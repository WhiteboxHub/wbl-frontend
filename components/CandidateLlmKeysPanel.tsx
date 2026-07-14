"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    CheckCircle,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Mic,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/admin_ui/dialog";
import { apiFetch } from "@/lib/api";

type ValidationStatus = "active" | "inactive" | "invalid" | "checking";

type ProviderId = "OpenAI" | "Claude" | "Mistral" | "Gemini" | "Azure OpenAI" | "Groq" | "Together AI" | "Cohere";

type LlmKeyRow = {
    id: number;
    provider_name: string;
    masked_key: string;
    model_name: string | null;
    entry_date: string | null;
    voice_enabled: boolean;
    is_default: boolean;
    validation_status: ValidationStatus;
    validation_message: string | null;
};

const PROVIDERS: { id: ProviderId; label: string }[] = [
    { id: "OpenAI", label: "OpenAI" },
    { id: "Claude", label: "Claude" },
    { id: "Mistral", label: "Mistral" },
    { id: "Gemini", label: "Gemini" },
    { id: "Azure OpenAI", label: "Azure OpenAI" },
    { id: "Groq", label: "Groq" },
    { id: "Together AI", label: "Together AI" },
    { id: "Cohere", label: "Cohere" },
];

const MODELS_BY_PROVIDER: Record<ProviderId, string[]> = {
  OpenAI: [
    "gpt-4o",
    "gpt-4.1",
    "gpt-4o-mini",
    "o3",
    "o4-mini"
  ],

  "Azure OpenAI": [
    "gpt-4o",
    "gpt-4.1",
    "gpt-35-turbo"
  ],

  Claude: [
    "Claude Sonnet 4",
    "Claude Opus 4",
    "Claude Haiku 3.5"
  ],

  Gemini: [
    "Gemini 2.5 Pro",
    "Gemini 2.5 Flash",
    "Gemini 2.0 Flash"
  ],

  Mistral: [
    "Mistral Large",
    "Mistral Medium",
    "Mistral Small"
  ],

  Groq: [
    "Llama 3 70B",
    "Mixtral 8x7B",
    "Gemma 2"
  ],

  "Together AI": [
    "Llama 3.3 70B",
    "DeepSeek V3",
    "Qwen 2.5"
  ],

  Cohere: [
    "Command R",
    "Command R+"
  ]
};
const PROVIDER_FIELDS: Record<
  ProviderId,
  {
    projectId?: boolean;
    organization?: boolean;
    endpoint?: boolean;
    deployment?: boolean;
    workspace?: boolean;
    region?: boolean;
    safety?: boolean;
    speed?: boolean;
  }
> = {

  OpenAI: {
    projectId: true,
    organization: true,
  },

  "Azure OpenAI": {
    endpoint: true,
    deployment: true,
  },

  Claude: {
    workspace: true,
  },

  Gemini: {
    region: true,
    safety: true,
  },

  Mistral: {
    endpoint: true,
  },

  Groq: {
    speed: true,
  },

  "Together AI": {
    endpoint: true,
  },

  Cohere: {}
};

const fieldSelectClassName =
    "mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm h-9";

function parseBoolFlag(value: unknown): boolean {
    return value === true || value === 1 || value === "1" || value === "true";
}

function normalizeProvider(name: string): ProviderId {
    const k = (name || "").trim().toLowerCase();
    if (k === "openai" || k === "gpt") return "OpenAI";
    if (k === "claude" || k === "anthropic") return "Claude";
    if (k === "mistral") return "Mistral";
    if (k === "gemini" || k === "google") return "Gemini";
    return "OpenAI";
}

function formatEntryDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const VALIDATION_CACHE_KEY = "wbl_llm_key_validation_v1";

type StoredValidationStatus = "active" | "inactive" | "invalid";

type CachedValidation = {
    status: StoredValidationStatus;
    message: string | null;
};

function readValidationCache(): Record<string, CachedValidation> {
    if (typeof window === "undefined") return {};
    try {
        const raw = localStorage.getItem(VALIDATION_CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as Record<string, CachedValidation>;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function writeValidationCache(cache: Record<string, CachedValidation>) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(VALIDATION_CACHE_KEY, JSON.stringify(cache));
    } catch {
        /* quota / private mode */
    }
}

function applyValidationCache(rows: LlmKeyRow[]): LlmKeyRow[] {
    const cache = readValidationCache();
    return rows.map((row) => {
        const hit = cache[String(row.id)];
        if (!hit) return row;
        return {
            ...row,
            validation_status: hit.status,
            validation_message: hit.message,
        };
    });
}

function persistRowsToValidationCache(rows: LlmKeyRow[]) {
    const cache = readValidationCache();
    for (const row of rows) {
        if (row.validation_status === "checking") continue;
        cache[String(row.id)] = {
            status: row.validation_status as StoredValidationStatus,
            message: row.validation_message,
        };
    }
    writeValidationCache(cache);
}

function removeKeyFromValidationCache(keyId: number) {
    const cache = readValidationCache();
    delete cache[String(keyId)];
    writeValidationCache(cache);
}

/** Keys from ``candidate_llm_api_keys`` for the logged-in candidate (via ``candidate.id``). */
type CandidateLlmKeysPanelProps = {
    onSuccess?: () => void;
    onValidationChange?: (isValid: boolean) => void;
};

export function CandidateLlmKeysPanel({
    onSuccess,
    onValidationChange,
}: CandidateLlmKeysPanelProps) {    const [rows, setRows] = useState<LlmKeyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [revealed, setRevealed] = useState<Record<number, string>>({});
    const [revealingId, setRevealingId] = useState<number | null>(null);
    const [validatingId, setValidatingId] = useState<number | null>(null);
    const [voiceUpdatingId, setVoiceUpdatingId] = useState<number | null>(null);
    const [defaultUpdatingId, setDefaultUpdatingId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editRow, setEditRow] = useState<LlmKeyRow | null>(null);
    const [formProvider, setFormProvider] = useState<ProviderId>("OpenAI");
    const [formKey, setFormKey] = useState("");
    const [formModel, setFormModel] = useState(MODELS_BY_PROVIDER.OpenAI[0]);
    const [formVoice, setFormVoice] = useState<"yes" | "no">("no");
    const [formSaving, setFormSaving] = useState(false);

    const applyValidationResults = useCallback(
        (results: Array<{ id: number; status: string; message?: string | null }>) => {
            const byId = new Map(results.map((r) => [r.id, r]));
            setRows((prev) => {
                const next = prev.map((row) => {
                    const hit = byId.get(row.id);
                    if (!hit) return row;
                    const st =
                        hit.status === "active" ||
                        hit.status === "inactive" ||
                        hit.status === "invalid"
                            ? (hit.status as ValidationStatus)
                            : "inactive";
                    return {
                        ...row,
                        validation_status: st,
                        validation_message: hit.message ?? null,
                    };
                });
                persistRowsToValidationCache(next);
                return next;
            });
        },
        []
    );

    const validateAllKeys = useCallback(async (keysToValidate: LlmKeyRow[]) => {
        if (keysToValidate.length === 0) return;
        setRows((prev) =>
            prev.map((r) => ({
                ...r,
                validation_status: "checking",
                validation_message: "Auto-validating…",
            }))
        );
        try {
            const batch = await apiFetch("coderpad/me/llm-keys/validate-batch", {
                method: "POST",
                body: {
                    keys: keysToValidate.map((k) => ({
                        id: k.id,
                        provider_name: k.provider_name,
                        source: "wbl",
                    })),
                },
            });
            const results = batch?.results;
            if (results && Array.isArray(results)) {
                applyValidationResults(results);
            } else {
                setRows((prev) =>
                    prev.map((r) =>
                        r.validation_status === "checking"
                            ? { ...r, validation_status: "inactive", validation_message: null }
                            : r
                    )
                );
            }
        } catch (err: unknown) {
            console.error("Auto validation failed:", err);
            setRows((prev) =>
                prev.map((r) =>
                    r.validation_status === "checking"
                        ? { ...r, validation_status: "inactive", validation_message: null }
                        : r
                )
            );
        }
    }, [applyValidationResults]);

    const loadKeys = useCallback(async () => {
        setLoading(true);
        setRevealed({});
        try {
            const data = await apiFetch("coderpad/me/llm-keys");
            const list: LlmKeyRow[] = (Array.isArray(data) ? data : []).map(
                (k: {
                    id: number;
                    provider_name: string;
                    masked_key: string;
                    model_name?: string | null;
                    entry_date?: string | null;
                    voice_enabled?: boolean;
                    is_default?: boolean;
                }) => ({
                    id: k.id,
                    provider_name: k.provider_name,
                    masked_key: k.masked_key,
                    model_name: k.model_name ?? null,
                    entry_date: k.entry_date ?? null,
                    voice_enabled: parseBoolFlag(k.voice_enabled),
                    is_default: parseBoolFlag(k.is_default),
                    validation_status: "inactive" as const,
                    validation_message: null,
                })
            );
            const loadedList = applyValidationCache(list);
            setRows(loadedList);
            if (loadedList.length > 0) {
                void validateAllKeys(loadedList);
            }
        } catch (err: unknown) {
            const e = err as { body?: { detail?: string }; status?: number };
            const detail =
                typeof e?.body?.detail === "string" ? e.body.detail : null;
            if (e?.status === 404) {
                toast.error(detail ?? "Candidate profile not found.");
            } else {
                toast.error(detail ?? "Could not load your LLM keys.");
            }
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadKeys();
    }, [loadKeys]);

    useEffect(() => {
        const hasActiveKey = rows.some((r) => r.validation_status === "active");
        onValidationChange?.(hasActiveKey);
    }, [rows, onValidationChange]);

    const closeModal = () => {
        setModalOpen(false);
        setEditRow(null);
        setFormKey("");
    };

    const openAddModal = () => {
        setEditRow(null);
        setFormProvider("OpenAI");
        setFormModel(MODELS_BY_PROVIDER.OpenAI[0]);
        setFormKey("");
        setFormVoice("no");
        setModalOpen(true);
    };

    const openEditModal = (row: LlmKeyRow) => {
        const provider = normalizeProvider(row.provider_name);
        setEditRow(row);
        setFormProvider(provider);
        setFormModel(
            row.model_name && MODELS_BY_PROVIDER[provider].includes(row.model_name)
                ? row.model_name
                : MODELS_BY_PROVIDER[provider][0]
        );
        setFormKey("");
        setFormVoice(row.voice_enabled ? "yes" : "no");
        setModalOpen(true);
    };

    const onProviderChange = (provider: ProviderId) => {
        setFormProvider(provider);
        const models = MODELS_BY_PROVIDER[provider];
        if (!models.includes(formModel)) {
            setFormModel(models[0]);
        }
    };

    const toggleReveal = async (row: LlmKeyRow) => {
        if (revealed[row.id]) {
            setRevealed((prev) => {
                const next = { ...prev };
                delete next[row.id];
                return next;
            });
            return;
        }
        setRevealingId(row.id);
        try {
            const rev = await apiFetch(`coderpad/me/llm-keys/${row.id}/reveal`);
            const k = typeof rev?.api_key === "string" ? rev.api_key.trim() : "";
            if (!k) throw new Error("empty");
            setRevealed((prev) => ({ ...prev, [row.id]: k }));
        } catch {
            toast.error("Could not reveal API key.");
        } finally {
            setRevealingId(null);
        }
    };
    const validateRow = async (row: LlmKeyRow) => {
        const previousStatus =
            row.validation_status === "checking" ? "inactive" : row.validation_status;
        const previousMessage = row.validation_message;

        setValidatingId(row.id);
        setRows((prev) =>
            prev.map((r) =>
                r.id === row.id
                    ? {
                          ...r,
                          validation_status: "checking",
                          validation_message: "Validating…",
                      }
                    : r
            )
        );
        try {
            const batch = await apiFetch("coderpad/me/llm-keys/validate-batch", {
                method: "POST",
                body: {
                    keys: [{ id: row.id, provider_name: row.provider_name, source: "wbl" }],
                },
            });
            const hit = batch?.results?.[0];
            if (!hit) throw new Error("No validation result");
            applyValidationResults([hit]);
            if (hit.status === "active") {
                toast.success(`${row.provider_name} key is active.`);
            } else if (hit.status === "invalid") {
                toast.error(hit.message || "Invalid API key");
            } else {
                toast.error(hit.message || "Key inactive");
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Validation failed";
            setRows((prev) =>
                prev.map((r) =>
                    r.id === row.id
                        ? {
                              ...r,
                              validation_status: previousStatus,
                              validation_message: previousMessage,
                          }
                        : r
                )
            );
            toast.error(msg);
        } finally {
            setValidatingId(null);
        }
    };

    const validateModalKey = async () => {
        if (editRow) {
            await validateRow(editRow);
            return;
        }

        if (!formKey.trim()) {
            toast.error("Enter your API key before validating.");
            return;
        }

        toast.success("Basic key check passed. Save the key to validate it fully.");
    };

    const updateIsDefault = async (row: LlmKeyRow, isDefault: boolean) => {
        if (row.is_default === isDefault) return;
        if (!isDefault && row.is_default) {
            toast.error("Set another key as default before turning this off.");
            return;
        }
        setDefaultUpdatingId(row.id);
        setRows((prev) =>
            prev.map((r) => ({
                ...r,
                is_default: r.id === row.id ? true : false,
            }))
        );
        try {
            await apiFetch(`coderpad/me/llm-keys/${row.id}/is-default`, {
                method: "PATCH",
                body: { is_default: true },
            });
            toast.success("Default key updated.");
        } catch {
            await loadKeys();
            toast.error("Could not update default key.");
        } finally {
            setDefaultUpdatingId(null);
        }
    };

    const updateVoiceEnabled = async (row: LlmKeyRow, enabled: boolean) => {
        if (row.voice_enabled === enabled) return;
        setVoiceUpdatingId(row.id);
        setRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, voice_enabled: enabled } : r))
        );
        try {
            await apiFetch(`coderpad/me/llm-keys/${row.id}/voice-enabled`, {
                method: "PATCH",
                body: { voice_enabled: enabled },
            });
            toast.success(`Speech enabled set to ${enabled ? "Yes" : "No"}.`);
        } catch {
            setRows((prev) =>
                prev.map((r) =>
                    r.id === row.id ? { ...r, voice_enabled: row.voice_enabled } : r
                )
            );
            toast.error("Could not update speech enabled.");
        } finally {
            setVoiceUpdatingId(null);
        }
    };

    const deleteRow = async (row: LlmKeyRow) => {
        if (row.is_default) {
            toast.error(
                "Cannot delete the default API key. Set another key as default first."
            );
            return;
        }
        if (!confirm(`Delete ${row.provider_name} key?`)) return;
        try {
            await apiFetch(`coderpad/me/llm-keys/${row.id}`, { method: "DELETE" });
            removeKeyFromValidationCache(row.id);
            toast.success("Key deleted.");
            await loadKeys();
        } catch (err: unknown) {
            let msg = "Could not delete key.";
            try {
                const e = err as { body?: { detail?: string } };
                if (typeof e?.body?.detail === "string") msg = e.body.detail;
            } catch {
                /* default */
            }
            toast.error(msg);
        }
    };

    const saveKey = async () => {
        const k = formKey.trim();
        const voiceEnabled = formVoice === "yes";

        if (!editRow && !k) {
            toast.error("Enter your API key.");
            return;
        }

        setFormSaving(true);
        try {
            if (editRow) {
                const body: {
                    provider_name: string;
                    model_name: string;
                    voice_enabled: boolean;
                    api_key?: string;
                } = {
                    provider_name: formProvider,
                    model_name: formModel,
                    voice_enabled: voiceEnabled,
                };
                if (k) body.api_key = k;
                await apiFetch(`coderpad/me/llm-keys/${editRow.id}`, {
                    method: "PUT",
                    body,
                });
                toast.success("LLM key updated.");
            } else {
                await apiFetch("coderpad/me/llm-keys", {
                    method: "POST",
                    body: {
                        provider_name: formProvider,
                        api_key: k,
                        model_name: formModel,
                        voice_enabled: voiceEnabled,
                    },
                });
                toast.success("LLM key saved.");
            }
            if (editRow && k) {
                removeKeyFromValidationCache(editRow.id);
            }
            closeModal();
            await loadKeys();
        } catch (err: unknown) {
            let msg = "Could not save API key.";
            try {
                const e = err as { body?: { detail?: string } };
                if (typeof e?.body?.detail === "string") msg = e.body.detail;
            } catch {
                /* default */
            }
            toast.error(msg);
        } finally {
            setFormSaving(false);
        }
    };

    const renderStatus = (row: LlmKeyRow) => {
        const status = validatingId === row.id ? "checking" : row.validation_status;
        if (status === "checking") {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Validating…
                </span>
            );
        }
        if (status === "active") {
            return (
                <span
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    title={row.validation_message || "Key is active"}
                >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Active
                </span>
            );
        }
        if (status === "invalid") {
            return (
                <span
                    className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    title={row.validation_message || "Invalid API key"}
                >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Invalid API key
                </span>
            );
        }
        return (
            <span
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                title={row.validation_message || "Not verified or unreachable"}
            >
                <AlertCircle className="h-3.5 w-3.5" />
                Inactive
            </span>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                            My LLM key
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Add and manage multiple API keys (OpenAI, Claude, Mistral, Gemini).
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 font-semibold"
                        onClick={openAddModal}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add key
                    </Button>
                </div>

                <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
                    <DialogContent className="max-w-[min(42rem,95vw)] sm:max-w-3xl gap-0 p-0 overflow-hidden">
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <DialogHeader className="space-y-1 text-left">
                                <DialogTitle className="text-base">
                                    {editRow ? "Edit LLM key" : "Add LLM key"}
                                </DialogTitle>
                                <DialogDescription className="text-xs leading-relaxed">
                                {editRow
                                    ? "Update this key’s provider, model, or speech settings. Leave the API key blank to keep the current value."
                                    : "Add another API key. Existing keys are kept."}
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="px-6 py-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                        Provider
                                    </Label>
                                <select
                                    className={fieldSelectClassName}
                                    value={formProvider}
                                    onChange={(e) =>
                                        onProviderChange(e.target.value as ProviderId)
                                    }
                                >
                                    {PROVIDERS.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                                </div>

                                <div className="min-w-0 sm:col-span-1">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                        Model
                                    </Label>
                                    <select
                                        className={fieldSelectClassName}
                                        value={formModel}
                                        onChange={(e) => setFormModel(e.target.value)}
                                    >
                                        {MODELS_BY_PROVIDER[formProvider].map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="min-w-0">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                        Speech enabled
                                        <Mic
                                            className={`h-3.5 w-3.5 ${
                                                formVoice === "yes"
                                                    ? "text-emerald-600"
                                                    : "text-gray-400"
                                            }`}
                                        />
                                    </Label>
                                    <select
                                        className={fieldSelectClassName}
                                        value={formVoice}
                                        onChange={(e) =>
                                            setFormVoice(e.target.value as "yes" | "no")
                                        }
                                    >
                                        <option value="no">No</option>
                                        <option value="yes">Yes</option>
                                    </select>
                                </div>
                            </div>

                        <div className="relative mt-1">
                            <Input
                                type="password"
                                value={formKey}
                                onChange={(e) => setFormKey(e.target.value)}
                                placeholder={
                                    editRow
                                         ? "Leave blank to keep current key"
                                         : formProvider === "OpenAI"
                                         ? "sk-..."
                                         : "Paste API key"
                                }
                                className="h-9 pr-24 font-mono text-sm"
                                autoComplete="new-password"
                            />

                             <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                                 onClick={() => void validateModalKey()}
                            >
                                  Validate
                            </Button>
                        </div>   
                        </div>

                        <DialogFooter className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 flex-row justify-end gap-2 sm:space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={closeModal}
                                disabled={formSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={formSaving || (!editRow && !formKey.trim())}
                                onClick={() => void saveKey()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-w-[7rem]"
                            >
                                {formSaving
                                    ? "Saving…"
                                    : editRow
                                      ? "Update key"
                                      : "Save key"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    <th className="px-4 py-3">Provider</th>
                                    <th className="px-4 py-3">Key</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Entry Date</th>
                                    <th className="px-4 py-3">Speech Enabled</th>
                                    <th className="px-4 py-3">Default</th>
                                    <th className="px-4 py-3 w-20" />
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading…
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                            No LLM keys yet. Click Add key to save your first API key.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => {
                                        const plain = revealed[row.id];
                                        const showPlain = Boolean(plain);
                                        const displayKey = plain || row.masked_key;
                                        return (
                                            <tr
                                                key={row.id}
                                                className="border-b border-gray-50 dark:border-gray-800/80 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                                            >
                                                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                                                    {row.provider_name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 w-full max-w-[280px]">
                                                        <div
                                                            className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 scroll-smooth overscroll-x-contain [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-track]:bg-transparent"
                                                            title={
                                                                showPlain
                                                                    ? "Scroll left or right to view the full key"
                                                                    : undefined
                                                            }
                                                        >
                                                            {showPlain ? (
                                                                <span
                                                                    className="inline-block min-w-max px-2 py-1.5 text-xs font-mono whitespace-nowrap text-gray-700 dark:text-gray-300 select-all"
                                                                    aria-label={`${row.provider_name} API key`}
                                                                >
                                                                    {displayKey}
                                                                </span>
                                                            ) : (
                                                                <input
                                                                    type="password"
                                                                    readOnly
                                                                    value={displayKey}
                                                                    className="block min-w-max w-full border-0 bg-transparent px-2 py-1.5 text-xs font-mono text-gray-700 dark:text-gray-300 outline-none focus:ring-0 whitespace-nowrap"
                                                                    autoComplete="off"
                                                                    spellCheck={false}
                                                                    aria-label={`${row.provider_name} API key`}
                                                                />
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="shrink-0 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                            title={showPlain ? "Hide key" : "Show key"}
                                                            disabled={revealingId === row.id}
                                                            onClick={() => void toggleReveal(row)}
                                                        >
                                                            {revealingId === row.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : showPlain ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">{renderStatus(row)}</td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                                                    {formatEntryDate(row.entry_date)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <select
                                                            className={`rounded-md border px-2 py-1 text-xs font-semibold min-w-[4.5rem] disabled:opacity-60 ${
                                                                row.voice_enabled
                                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                                    : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                            }`}
                                                            value={row.voice_enabled ? "yes" : "no"}
                                                            disabled={voiceUpdatingId === row.id}
                                                            onChange={(e) =>
                                                                void updateVoiceEnabled(
                                                                    row,
                                                                    e.target.value === "yes"
                                                                )
                                                            }
                                                            aria-label={`Speech enabled for ${row.provider_name}`}
                                                        >
                                                            <option value="no">No</option>
                                                            <option value="yes">Yes</option>
                                                        </select>
                                                        {voiceUpdatingId === row.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                                                        ) : (
                                                            <Mic
                                                                className={`h-3.5 w-3.5 shrink-0 ${
                                                                    row.voice_enabled
                                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                                        : "text-gray-300 dark:text-gray-600"
                                                                }`}
                                                                aria-hidden
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <select
                                                            className={`rounded-md border px-2 py-1 text-xs font-semibold min-w-[4.5rem] disabled:opacity-60 ${
                                                                row.is_default
                                                                    ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                                                    : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                            }`}
                                                            value={row.is_default ? "yes" : "no"}
                                                            disabled={
                                                                defaultUpdatingId === row.id ||
                                                                row.is_default
                                                            }
                                                            onChange={(e) =>
                                                                void updateIsDefault(
                                                                    row,
                                                                    e.target.value === "yes"
                                                                )
                                                            }
                                                            aria-label={`Default key for ${row.provider_name}`}
                                                        >
                                                            <option value="no">No</option>
                                                            <option value="yes">Yes</option>
                                                        </select>
                                                        {defaultUpdatingId === row.id && (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                                                        )}
                                                    </div>
                                                </td>
                                                
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                            title="Edit key"
                                                            onClick={() => openEditModal(row)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`p-1.5 rounded-md ${
                                                                row.is_default
                                                                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                                                    : "text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            }`}
                                                            title={
                                                                row.is_default
                                                                    ? "Cannot delete the default key"
                                                                    : "Delete key"
                                                            }
                                                            disabled={row.is_default}
                                                            onClick={() => void deleteRow(row)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className="px-4 py-3 text-[11px] text-gray-400 border-t border-gray-100 dark:border-gray-800">
                        Status is remembered after validation. Keys are loaded from your profile.
                    </p>
                </div>
            </div>
        </div>
    );
}
