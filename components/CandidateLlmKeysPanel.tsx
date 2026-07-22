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
    Copy,
    Check,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/admin_ui/select";
import { apiFetch } from "@/lib/api";

type ValidationStatus = "active" | "inactive" | "invalid" | "checking" | "credits_exhausted";

type ProviderId = "OpenAI" | "Claude" | "Gemini" | "Mistral" | "Llama" | "Grok" | "DeepSeek" | "Cohere" | "Together" | "Perplexity" | "Groq" | "AzureOpenAI" | "AWSBedrock" | "VertexAI" | "OpenRouter" | "HuggingFace" | "NvidiaNIM" | "Fireworks" | "Cerebras" | "AI21" | "SambaNova" | "IBMWatsonx" | "Qwen" | "Moonshot" | "ZeroOneAI" | "Ollama" | "LMStudio" | "vLLM";

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
    { id: "Claude", label: "Anthropic (Claude)" },
    { id: "Gemini", label: "Google Gemini" },
    { id: "Mistral", label: "Mistral AI" },
    { id: "Llama", label: "Meta Llama" },
    { id: "Grok", label: "xAI (Grok)" },
    { id: "DeepSeek", label: "DeepSeek" },
    { id: "Cohere", label: "Cohere" },
    { id: "Together", label: "Together AI" },
    { id: "Perplexity", label: "Perplexity AI" },
    { id: "Groq", label: "Groq" },
    { id: "AzureOpenAI", label: "Azure OpenAI" },
    { id: "AWSBedrock", label: "AWS Bedrock" },
    { id: "VertexAI", label: "Google Vertex AI" },
    { id: "OpenRouter", label: "OpenRouter" },
    { id: "HuggingFace", label: "Hugging Face" },
    { id: "NvidiaNIM", label: "NVIDIA NIM" },
    { id: "Fireworks", label: "Fireworks AI" },
    { id: "Cerebras", label: "Cerebras" },
    { id: "AI21", label: "AI21 Labs" },
    { id: "SambaNova", label: "SambaNova" },
    { id: "IBMWatsonx", label: "IBM Watsonx" },
    { id: "Qwen", label: "Alibaba Qwen" },
    { id: "Moonshot", label: "Moonshot AI (Kimi)" },
    { id: "ZeroOneAI", label: "01.AI (Yi)" },
    { id: "Ollama", label: "Ollama (Local)" },
    { id: "LMStudio", label: "LM Studio (Local)" },
    { id: "vLLM", label: "vLLM (Self Hosted)" },
];

const MODELS_BY_PROVIDER: Record<ProviderId, string[]> = {
    OpenAI: ["gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "o3", "o3-mini", "o4-mini"],
    Claude: ["Claude Opus 4", "Claude Sonnet 4", "Claude Haiku 3.5", "Claude Sonnet 3.7", "Claude Opus 3"],
    Gemini: ["Gemini 2.5 Pro", "Gemini 2.5 Flash", "Gemini 2.5 Flash Lite", "Gemini 2.0 Flash", "Gemini 1.5 Pro", "Gemini 1.5 Flash"],
    Mistral: ["Mistral Large", "Mistral Medium", "Mistral Small", "Codestral", "Pixtral", "Devstral", "Mixtral 8x7B", "Mixtral 8x22B"],
    Llama: ["Llama 3.3 70B", "Llama 3.2 90B Vision", "Llama 3.2 11B Vision", "Llama 3.2 3B", "Llama 3.2 1B", "Llama 3.1 405B", "Llama 3.1 70B", "Llama 3.1 8B"],
    Grok: ["Grok 4", "Grok 3", "Grok 3 Mini"],
    DeepSeek: ["DeepSeek R1", "DeepSeek V3", "DeepSeek Coder"],
    Cohere: ["Command R", "Command R+", "Command A", "Embed English", "Embed Multilingual"],
    Together: ["Llama Models", "Qwen Models", "DeepSeek Models", "Mistral Models", "Gemma Models", "Mixtral Models"],
    Perplexity: ["Sonar", "Sonar Pro", "Sonar Reasoning", "Sonar Deep Research"],
    Groq: ["Llama 3.3 70B", "Llama 3.1 8B", "Mixtral 8x7B", "Gemma 2", "DeepSeek R1"],
    AzureOpenAI: ["gpt-4o", "gpt-4o-mini", "gpt-35-turbo"],
    AWSBedrock: ["Claude", "Llama", "Nova", "Titan", "Mistral", "Cohere", "AI21"],
    VertexAI: ["Gemini", "Claude", "Llama", "Mistral", "Imagen"],
    OpenRouter: ["OpenAI Models", "Claude Models", "Gemini Models", "Llama Models", "Qwen Models", "DeepSeek Models", "Mistral Models"],
    HuggingFace: ["Llama", "Qwen", "Mistral", "Gemma", "Falcon", "Phi", "DeepSeek", "FLAN-T5"],
    NvidiaNIM: ["Llama", "Nemotron", "Mistral", "DeepSeek"],
    Fireworks: ["Llama", "Mixtral", "DeepSeek", "Qwen", "Mistral"],
    Cerebras: ["llama3.1-8b", "llama3.1-70b"],
    AI21: ["Jamba", "Jurassic"],
    SambaNova: ["Meta-Llama-3.1-70B-Instruct", "Meta-Llama-3.1-8B-Instruct"],
    IBMWatsonx: ["Granite", "Llama", "Mixtral"],
    Qwen: ["Qwen 3", "Qwen 2.5", "Qwen Coder", "Qwen VL"],
    Moonshot: ["Kimi K2", "Kimi Chat"],
    ZeroOneAI: ["Yi Large", "Yi Vision", "Yi Coder"],
    Ollama: ["llama3", "llama3.1", "llama3.2", "mistral", "deepseek-r1", "phi4", "qwen3", "gemma3"],
    LMStudio: ["Any GGUF Model", "Llama", "Qwen", "Mistral", "Gemma", "Phi", "DeepSeek"],
    vLLM: ["Any HuggingFace compatible model"]
};

const fieldSelectClassName =
    "mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm h-9";

function parseBoolFlag(value: unknown): boolean {
    return value === true || value === 1 || value === "1" || value === "true";
}

function normalizeProvider(name: string): ProviderId {
    const k = (name || "").trim().toLowerCase();
    if (k.includes("azure")) return "AzureOpenAI";
    if (k.includes("openai") || k.includes("gpt")) return "OpenAI";
    if (k.includes("claude") || k.includes("anthropic")) return "Claude";
    if (k.includes("vertex")) return "VertexAI";
    if (k.includes("gemini") || k.includes("google")) return "Gemini";
    if (k.includes("mistral")) return "Mistral";
    if (k.includes("llama") || k.includes("meta")) return "Llama";
    if (k.includes("grok") || k.includes("xai")) return "Grok";
    if (k.includes("deepseek")) return "DeepSeek";
    if (k.includes("groq")) return "Groq";
    if (k.includes("cohere")) return "Cohere";
    if (k.includes("together")) return "Together";
    if (k.includes("perplexity")) return "Perplexity";
    if (k.includes("openrouter")) return "OpenRouter";
    if (k.includes("hugging")) return "HuggingFace";
    if (k.includes("nvidia") || k.includes("nim")) return "NvidiaNIM";
    if (k.includes("fireworks")) return "Fireworks";
    if (k.includes("cerebras")) return "Cerebras";
    if (k.includes("ai21")) return "AI21";
    if (k.includes("samba")) return "SambaNova";
    if (k.includes("watson") || k.includes("ibm")) return "IBMWatsonx";
    if (k.includes("bedrock") || k.includes("aws")) return "AWSBedrock";
    if (k.includes("qwen") || k.includes("alibaba")) return "Qwen";
    if (k.includes("moonshot") || k.includes("kimi")) return "Moonshot";
    if (k.includes("yi") || k.includes("01.ai")) return "ZeroOneAI";
    if (k.includes("ollama")) return "Ollama";
    if (k.includes("lm studio") || k.includes("lmstudio")) return "LMStudio";
    if (k.includes("vllm")) return "vLLM";
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

function getFriendlyValidationMessage(provider: string, rawMessage: string | null | undefined): string {
    if (!rawMessage) {
        return `${provider} Validation Failed: The key could not be verified.`;
    }

    const lowerMsg = rawMessage.toLowerCase();

    // 1. Incorrect key or auth failure
    if (
        lowerMsg.includes("incorrect api key") ||
        lowerMsg.includes("invalid api key") ||
        lowerMsg.includes("authentication failed") ||
        lowerMsg.includes("invalid_api_key")
    ) {
        return `${provider} Validation Failed: The API key provided is incorrect. Please verify and try again.`;
    }

    // 2. Billing / quota limit issues
    if (
        lowerMsg.includes("quota") ||
        lowerMsg.includes("limit") ||
        lowerMsg.includes("billing") ||
        lowerMsg.includes("credit") ||
        lowerMsg.includes("insufficient")
    ) {
        return `${provider} Validation Failed: Insufficient credits or quota limit reached on this API key.`;
    }

    // 3. Strip any secret keys/stars out of the message
    let cleanMsg = rawMessage;
    if (cleanMsg.includes("sk-")) {
        cleanMsg = cleanMsg.replace(/sk-[a-zA-Z0-9*-]+/g, "[API Key]");
    }
    cleanMsg = cleanMsg.replace(/\*+/g, "***");

    // 4. If the message is still very long, summarize it
    if (cleanMsg.length > 120 || lowerMsg.includes("url") || lowerMsg.includes("http")) {
        return `${provider} Validation Failed: Invalid API key. Please check your key configuration.`;
    }

    return cleanMsg;
}

/** Keys from ``candidate_llm_api_keys`` for the logged-in candidate (via ``candidate.id``). */
export function CandidateLlmKeysPanel({ 

    onValidationChange,
    children 
}: { 
    onValidationChange?: (isValid: boolean) => void;
    children?: React.ReactNode;
}) {
    const [rows, setRows] = useState<LlmKeyRow[]>([]);
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

    const [copyingId, setCopyingId] = useState<number | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
    const [detecting, setDetecting] = useState(false);



    const [isValidated, setIsValidated] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [validationStatus, setValidationStatus] = useState<'success' | 'error' | null>(null);
    const [modalKeyStatus, setModalKeyStatus] = useState<string>("inactive");

    const copyKeyToClipboard = async (row: LlmKeyRow) => {
        setCopyingId(row.id);
        try {
            const rev = await apiFetch(`coderpad/me/llm-keys/${row.id}/reveal`);
            const key = typeof rev?.api_key === "string" ? rev.api_key.trim() : "";
            if (!key) throw new Error("empty");
            await navigator.clipboard.writeText(key);
            setCopiedId(row.id);
            toast.success("API key copied to clipboard");
            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        } catch {
            toast.error("Could not copy API key.");
        } finally {
            setCopyingId(null);
        }
    };



    const fetchModelsForProvider = async (provider: ProviderId, currentKey?: string, keyId?: number) => {
        try {
            const res = await apiFetch("coderpad/me/llm-keys/discover-models", {
                method: "POST",
                body: {
                    provider_name: provider,
                    api_key: currentKey || undefined,
                    key_id: keyId || undefined,
                },
            });
            if (res?.models && Array.isArray(res.models) && res.models.length > 0) {
                setDiscoveredModels(res.models);
                return res.models;
            }
        } catch (err) {
            console.error("Model discovery failed:", err);
        }
        const fallback = MODELS_BY_PROVIDER[provider] || [];
        setDiscoveredModels(fallback);
        return fallback;
    };

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
                    status?: string;
                    validation_message?: string | null;
                }) => ({
                    id: k.id,
                    provider_name: k.provider_name,
                    masked_key: k.masked_key,
                    model_name: k.model_name ?? null,
                    entry_date: k.entry_date ?? null,
                    voice_enabled: parseBoolFlag(k.voice_enabled),
                    is_default: parseBoolFlag(k.is_default),
                    validation_status: ((k as any).validation_status || k.status || "inactive") as ValidationStatus,
                    validation_message: k.validation_message ?? null,
                })
            );
            setRows(list);
            const unvalidated = list.filter((k) => k.validation_status === "inactive" || (k.validation_status as string) === "unvalidated");
            if (unvalidated.length > 0) {
                void validateAllKeys(unvalidated);
            }
            return list;
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
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadKeys();
    }, [loadKeys]);

    useEffect(() => {
        const defaultRow = rows.find((r) => r.is_default);
        const hasActiveKey = defaultRow
            ? defaultRow.validation_status === "active"
            : (rows.length === 1 && rows[0].validation_status === "active");
        onValidationChange?.(hasActiveKey);
    }, [rows, onValidationChange]);

    useEffect(() => {
        setIsValidated(false);
        setValidationMessage(null);
        setValidationStatus(null);
        setModalKeyStatus("inactive");
    }, [formKey]);

    const resetValidationState = () => {
        setIsValidated(false);
        setIsValidating(false);
        setValidationMessage(null);
        setValidationStatus(null);
        setModalKeyStatus("inactive");
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditRow(null);
        setFormKey("");
        resetValidationState();
    };

    const openAddModal = () => {
        setEditRow(null);
        setFormProvider("OpenAI");
        setDiscoveredModels(MODELS_BY_PROVIDER.OpenAI);
        setFormModel(MODELS_BY_PROVIDER.OpenAI[0]);
        setFormKey("");
        setFormVoice("no");
        resetValidationState();
        setModalOpen(true);
    };

    const openEditModal = async (row: LlmKeyRow) => {
        const provider = normalizeProvider(row.provider_name);
        setEditRow(row);
        setFormProvider(provider);
        const models = await fetchModelsForProvider(provider, undefined, row.id);
        setFormModel(
            row.model_name && models.includes(row.model_name)
                ? row.model_name
                : models[0] || ""
        );
        setFormKey("");
        setFormVoice(row.voice_enabled ? "yes" : "no");
        resetValidationState();
        setModalOpen(true);
    };

    const onProviderChange = async (provider: ProviderId) => {
        setFormProvider(provider);
        resetValidationState();
        const models = await fetchModelsForProvider(provider, formKey, editRow?.id);
        if (models.length > 0) {
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
                toast.error(getFriendlyValidationMessage(row.provider_name, hit.message));
            } else {
                toast.error(getFriendlyValidationMessage(row.provider_name, hit.message));
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

    const updateIsDefault = async (row: LlmKeyRow, isDefault: boolean) => {
        if (row.is_default === isDefault) return;
        setDefaultUpdatingId(row.id);
        setRows((prev) =>
            prev.map((r) => {
                if (isDefault) {
                    return { ...r, is_default: r.id === row.id };
                } else {
                    return r.id === row.id ? { ...r, is_default: false } : r;
                }
            })
        );
        try {
            await apiFetch(`coderpad/me/llm-keys/${row.id}/is-default`, {
                method: "PATCH",
                body: { is_default: isDefault },
            });
            toast.success("Default status updated.");
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
        if (!confirm(`Delete ${row.provider_name} key?`)) return;
        try {
            await apiFetch(`coderpad/me/llm-keys/${row.id}`, { method: "DELETE" });
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

    const saveKey = async (shouldClose = true) => {
        const k = formKey.trim();
        const voiceEnabled = formVoice === "yes";

        if (!editRow && !k) {
            toast.error("Enter your API key.");
            return;
        }

        // Prevent double submit on save
        if (formSaving) return;

        setFormSaving(true);
        try {
            let currentStatus = modalKeyStatus;
            
            // Auto validate right before saving if they haven't validated manually
            if (k && currentStatus === "inactive") {
                try {
                    const res = await apiFetch("coderpad/me/llm-keys/validate", {
                        method: "POST",
                        body: { provider_name: formProvider, api_key: k },
                    });
                    if (res?.valid) {
                        currentStatus = "active";
                    } else {
                        const isExhausted = res?.status === "CREDITS_EXHAUSTED";
                        currentStatus = isExhausted ? "credits_exhausted" : "invalid";
                    }
                } catch (err: unknown) {
                    currentStatus = "inactive";
                }
            }

            let savedId = editRow?.id;
            if (editRow) {
                const body: {
                    provider_name: string;
                    model_name: string;
                    voice_enabled: boolean;
                    api_key?: string;
                    status?: string;
                } = {
                    provider_name: formProvider,
                    model_name: formModel,
                    voice_enabled: voiceEnabled,
                };
                if (k) {
                    body.api_key = k;
                    body.status = currentStatus;
                }
                await apiFetch(`coderpad/me/llm-keys/${editRow.id}`, {
                    method: "PUT",
                    body,
                });
                toast.success("LLM key updated.");
            } else {
                const res = await apiFetch("coderpad/me/llm-keys", {
                    method: "POST",
                    body: {
                        provider_name: formProvider,
                        api_key: k,
                        model_name: formModel,
                        voice_enabled: voiceEnabled,
                        status: currentStatus,
                    },
                });
                savedId = res?.id || 0;
                toast.success("LLM key saved.");
                setEditRow({
                    id: savedId,
                    provider_name: formProvider,
                    masked_key: "***",
                    model_name: formModel,
                    entry_date: new Date().toISOString(),
                    voice_enabled: voiceEnabled,
                    is_default: false,
                    validation_status: currentStatus as any,
                    validation_message: null
                });
                setFormKey("");
            }
            if (shouldClose) {
                closeModal();
            }
            await loadKeys();
            return savedId;
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

    const validateFormKey = async () => {
        const k = formKey.trim();
        if (!editRow && !k) {
            toast.error("Enter your API key to validate.");
            return;
        }

        if (isValidating) return;

        setIsValidating(true);
        setValidationMessage(null);
        setValidationStatus(null);
        setIsValidated(false);

        const toastId = toast.loading("Validating API key...");
        try {
            const res = await apiFetch("coderpad/me/llm-keys/validate", {
                method: "POST",
                body: {
                    provider_name: formProvider,
                    api_key: k,
                },
            });

            if (res?.valid) {
                setIsValidated(true);
                setValidationStatus("success");
                setModalKeyStatus("active");
                setValidationMessage("✓ API key validated successfully.");
                toast.success("API key validated successfully.", { id: toastId });
            } else {
                setIsValidated(false);
                setValidationStatus("error");
                const isExhausted = res?.status === "CREDITS_EXHAUSTED";
                setModalKeyStatus(isExhausted ? "credits_exhausted" : "invalid");
                const friendly = getFriendlyValidationMessage(formProvider, res?.message);
                setValidationMessage(`❌ ${friendly}`);
                toast.dismiss(toastId);
            }
        } catch (err: unknown) {
            let errorMsg = "Unable to validate the API key right now. Please try again.";
            try {
                const e = err as { body?: { detail?: string } };
                if (typeof e?.body?.detail === "string") errorMsg = e.body.detail;
            } catch {
                /* default */
            }
            const friendly = getFriendlyValidationMessage(formProvider, errorMsg);
            setIsValidated(false);
            setValidationStatus("error");
            setValidationMessage(`❌ ${friendly}`);
            toast.error(friendly, { id: toastId });
        } finally {
            setIsValidating(false);
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
        if (status === "credits_exhausted") {
            return (
                <span
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                    title={row.validation_message || "Credits Exhausted"}
                >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Credits Exhausted
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
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-850 dark:text-gray-300"
                title={row.validation_message || "Not validated yet"}
            >
                <AlertCircle className="h-3.5 w-3.5" />
                Not Validated
            </span>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="p-6 md:p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-gray-50 dark:border-gray-800/80 pb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                                My LLM Setup
                            </h2>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Configure and verify your environment before starting an AI interview.
                            </p>
                            {rows.length > 0 && (
                                <p className="text-xs font-medium text-gray-400 mt-2">
                                    Found <span className="font-bold text-blue-600">{rows.length}</span> {rows.length === 1 ? "key" : "keys"}
                                </p>
                            )}
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
                                    <Select
                                        value={formProvider}
                                        onValueChange={(val) => onProviderChange(val as ProviderId)}
                                    >
                                        <SelectTrigger className="mt-1 h-9 w-full bg-white dark:bg-gray-800">
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent nativeScroll>
                                            {PROVIDERS.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="min-w-0 sm:col-span-1">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                        Model
                                    </Label>
                                    <Select
                                        value={formModel}
                                        onValueChange={setFormModel}
                                    >
                                        <SelectTrigger className="mt-1 h-9 w-full bg-white dark:bg-gray-800">
                                            <SelectValue placeholder="Select model" />
                                        </SelectTrigger>
                                        <SelectContent nativeScroll>
                                            {(discoveredModels.length > 0 ? discoveredModels : MODELS_BY_PROVIDER[formProvider]).map((m) => (
                                                <SelectItem key={m} value={m}>
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                    <Select
                                        value={formVoice}
                                        onValueChange={(val) => setFormVoice(val as "yes" | "no")}
                                    >
                                        <SelectTrigger className="mt-1 h-9 w-full bg-white dark:bg-gray-800">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-44">
                                            <SelectItem value="no">No</SelectItem>
                                            <SelectItem value="yes">Yes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="min-w-0">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    API key
                                    {detecting && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                                </Label>
                                <Input
                                    type="password"
                                    value={formKey}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormKey(val);
                                        
                                        const trimmed = val.trim();
                                        let detectedProvider = null;
                                        if (trimmed.startsWith("sk-ant-")) detectedProvider = "Claude";
                                        else if (trimmed.startsWith("sk-proj-")) detectedProvider = "OpenAI";
                                        else if (trimmed.startsWith("sk-or-")) detectedProvider = "OpenRouter";
                                        else if (trimmed.startsWith("gsk_")) detectedProvider = "Groq";
                                        else if (trimmed.startsWith("xai-")) detectedProvider = "Grok";
                                        else if (trimmed.startsWith("AIza")) detectedProvider = "Gemini";
                                        else if (trimmed.startsWith("sk-") && trimmed.length > 40 && !trimmed.includes(" ")) detectedProvider = "OpenAI";

                                        if (detectedProvider && detectedProvider !== formProvider) {
                                            setFormProvider(detectedProvider as any);
                                            const fallback = MODELS_BY_PROVIDER[detectedProvider as any] || [];
                                            setDiscoveredModels(fallback);
                                            setFormModel(fallback[0] || "");
                                        }

                                        if (trimmed.length > 15) {
                                            setDetecting(true);
                                            apiFetch("coderpad/me/llm-keys/detect-provider", {
                                                method: "POST",
                                                body: { api_key: trimmed },
                                            }).then((res) => {
                                                if (res?.provider_name) {
                                                    const normalized = normalizeProvider(res.provider_name);
                                                    setFormProvider(normalized);
                                                    if (res.models && Array.isArray(res.models) && res.models.length > 0) {
                                                        setDiscoveredModels(res.models);
                                                        setFormModel(res.models[0]);
                                                    } else {
                                                        const fallback = MODELS_BY_PROVIDER[normalized] || [];
                                                        setDiscoveredModels(fallback);
                                                        setFormModel(fallback[0] || "");
                                                    }
                                                }
                                            }).catch((err) => {
                                                console.error("Provider detection failed:", err);
                                            }).finally(() => {
                                                setDetecting(false);
                                            });
                                        }
                                    }}
                                    placeholder={
                                        editRow
                                            ? "Leave blank to keep current key"
                                            : formProvider === "OpenAI"
                                              ? "sk-…"
                                              : "Paste API key"
                                    }
                                    className="mt-1 h-9 font-mono text-sm"
                                    autoComplete="new-password"
                                />
                                {validationMessage && (
                                    <p className={`text-xs font-semibold mt-1.5 ${
                                        validationStatus === "success" 
                                            ? "text-emerald-600 dark:text-emerald-400" 
                                            : "text-red-600 dark:text-red-400"
                                    }`}>
                                        {validationMessage}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 flex-row justify-end gap-2 sm:space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={closeModal}
                                disabled={formSaving || isValidating}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="min-w-[7rem]"
                                disabled={formSaving || isValidating || !formKey.trim()}
                                onClick={() => void validateFormKey()}
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin mr-1.5 inline" />
                                        Validating...
                                    </>
                                ) : isValidated ? (
                                    "Validated ✓"
                                ) : (
                                    "Validate"
                                )}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={
                                    formSaving ||
                                    isValidating ||
                                    (!editRow && !formKey.trim())
                                }
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

                <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-950/20">
                        <table className="w-full min-w-[820px] text-base">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-sm font-bold text-gray-500 uppercase tracking-wide">
                                    <th className="px-4 py-3">Provider</th>
                                    <th className="px-4 py-3">Key</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Entry Date</th>
                                    <th className="px-4 py-3">Speech Enabled</th>
                                    <th className="px-4 py-3">Default</th>
                                    <th className="px-4 py-3 text-center">Validate</th>
                                    <th className="px-4 py-3 w-20" />
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading…
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
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
                                                    <div className="flex items-center gap-2 w-full max-w-[320px]">
                                                        <div
                                                            className="flex-1 min-w-0 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-2 whitespace-normal break-all text-xs font-mono text-gray-700 dark:text-gray-300"
                                                        >
                                                            {displayKey}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="shrink-0 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                                            title="Copy API key"
                                                            disabled={copyingId === row.id}
                                                            onClick={() => void copyKeyToClipboard(row)}
                                                        >
                                                            {copyingId === row.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : copiedId === row.id ? (
                                                                <Check className="h-4 w-4 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="shrink-0 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                                                    {row.is_default ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                            YES
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-650 dark:bg-gray-800 dark:text-gray-400">
                                                            NO
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={validatingId !== null}
                                                        onClick={() => void validateRow(row)}
                                                        className="font-semibold text-xs min-w-[5.5rem]"
                                                    >
                                                        {validatingId === row.id ? (
                                                            <>
                                                                <Loader2 className="mr-1 h-3 w-3 animate-spin inline" />
                                                                Validating…
                                                            </>
                                                        ) : row.validation_status === "active" ? (
                                                            "Validate"
                                                        ) : (
                                                            "Revalidate"
                                                        )}
                                                    </Button>
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
                                                            className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            title="Delete key"
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
                    <p className="px-4 py-3 text-[11px] text-gray-400">
                        Status is remembered until you click Validate. Keys are loaded from your profile.
                    </p>
                    {children}
                </div>
            </div>
        </div>
    );
}
