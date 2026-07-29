"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    AlertCircle,
    Check,
    CheckCircle,
    Copy,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Mic,
    Pencil,
    Plus,
    RefreshCw,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/admin_ui/select";
import { apiFetch } from "@/lib/api";

type ValidationStatus = "active" | "inactive" | "invalid" | "checking";

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

// Validation state is now persisted in the DB (V124 migration: status, failure_reason,
// failure_code, last_validated_at columns on candidate_llm_api_keys).
// The localStorage cache (wbl_llm_key_validation_v1) has been removed; status is
// returned directly from GET /coderpad/me/llm-keys and written by validate-batch.

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
    const loadCountRef = useRef(0);
    const isMounted = useRef(true);
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
    const [autoDetecting, setAutoDetecting] = useState(false);
    const [detectionResult, setDetectionResult] = useState<{
        provider?: string;
        status?: string;
        message?: string;
        models?: string[];
        defaultModel?: string;
    } | null>(null);
    const [dynamicModels, setDynamicModels] = useState<string[]>([]);
    const [allExhaustedModalOpen, setAllExhaustedModalOpen] = useState(false);

    const recomputeDefaultKey = useCallback((currentRows: LlmKeyRow[]): LlmKeyRow[] => {
        if (currentRows.length === 0) return currentRows;

        // Find current default key
        const currentDefault = currentRows.find((r) => r.is_default);

        // 1. If current default key is active, keep it as default!
        if (currentDefault && currentDefault.validation_status === "active") {
            return currentRows.map((r) => ({
                ...r,
                is_default: r.id === currentDefault.id,
            }));
        }

        // 2. Current default is missing or NOT active (invalid / credits exhausted) -> find first active key
        const firstActive = currentRows.find((r) => r.validation_status === "active");

        if (firstActive) {
            void apiFetch(`coderpad/me/llm-keys/${firstActive.id}/set-default`, { method: "POST" }).catch(() => {});
            return currentRows.map((r) => ({
                ...r,
                is_default: r.id === firstActive.id,
            }));
        }

        // 3. No active key exists (all keys invalid or credits exhausted)
        const allEvaluated = currentRows.every((r) => r.validation_status !== "checking");
        if (allEvaluated && currentRows.length > 0) {
            setAllExhaustedModalOpen(true);
        }

        return currentRows.map((r) => ({
            ...r,
            is_default: false,
        }));
    }, []);

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
                return recomputeDefaultKey(next);
            });
        },
        [recomputeDefaultKey]
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
        loadCountRef.current += 1;
        const currentLoadCount = loadCountRef.current;
        setLoading(true);
        setRevealed({});
        // One-time cleanup: remove old localStorage cache from existing users' browsers
        if (typeof window !== "undefined") {
            localStorage.removeItem("wbl_llm_key_validation_v1");
        }
        try {
            const data = await apiFetch("coderpad/me/llm-keys");
            const list: LlmKeyRow[] = (Array.isArray(data) ? data : []).map(
                (k: {
                    id: number;
                    provider_name: string;
                    masked_key: string;
                    api_key?: string | null;
                    model_name?: string | null;
                    entry_date?: string | null;
                    voice_enabled?: boolean;
                    is_default?: boolean;
                    validation_status?: string | null;
                    validation_message?: string | null;
                }) => {
                    const rawStatus = k.validation_status ?? "inactive";
                    const st: ValidationStatus =
                        rawStatus === "active" || rawStatus === "inactive" || rawStatus === "invalid" || rawStatus === "checking"
                            ? (rawStatus as ValidationStatus)
                            : "inactive";
                    return {
                        id: k.id,
                        provider_name: k.provider_name,
                        masked_key: k.masked_key,
                        model_name: k.model_name ?? null,
                        entry_date: k.entry_date ?? null,
                        voice_enabled: parseBoolFlag(k.voice_enabled),
                        is_default: parseBoolFlag(k.is_default),
                        // Status comes from DB now — no localStorage cache needed
                        validation_status: st,
                        validation_message: k.validation_message ?? null,
                    };
                }
            );
            if (currentLoadCount !== loadCountRef.current || !isMounted.current) return;
            setRows(list);
            if (list.length > 0) {
                void validateAllKeys(list);
                try {
                    const revealedKeys: Record<number, string> = {};
                    await Promise.all(
                        list.map(async (row) => {
                            try {
                                const rev = await apiFetch(`coderpad/me/llm-keys/${row.id}/reveal`);
                                const k = typeof rev?.api_key === "string" ? rev.api_key.trim() : "";
                                if (k && currentLoadCount === loadCountRef.current && isMounted.current) {
                                    revealedKeys[row.id] = k;
                                }
                            } catch (e) {
                                console.error(`Failed to reveal key ${row.id}:`, e);
                            }
                        })
                    );
                    if (currentLoadCount === loadCountRef.current && isMounted.current) {
                        setRevealed(revealedKeys);
                    }
                } catch (e) {
                    console.error("Failed to automatically reveal keys:", e);
                }
            } else {
                setRevealed({});
            }
        } catch (err: unknown) {
            const e = err as { body?: { detail?: string }; status?: number };
            const detail =
                typeof e?.body?.detail === "string" ? e.body.detail : null;
            if (currentLoadCount !== loadCountRef.current || !isMounted.current) return;
            if (e?.status === 404) {
                toast.error(detail ?? "Candidate profile not found.");
            } else {
                toast.error(detail ?? "Could not load your LLM keys.");
            }
            setRows([]);
        } finally {
            if (currentLoadCount === loadCountRef.current && isMounted.current) {
                setLoading(false);
            }
        }
    }, [validateAllKeys]);

    useEffect(() => {
        isMounted.current = true;
        void loadKeys();
        return () => {
            isMounted.current = false;
        };
    }, [loadKeys]);

    useEffect(() => {
        const hasActiveKey = rows.some((r) => r.validation_status === "active");
        onValidationChange?.(hasActiveKey);
    }, [rows, onValidationChange]);

    const closeModal = () => {
        setModalOpen(false);
        setEditRow(null);
        setFormKey("");
        setDetectionResult(null);
        setDynamicModels([]);
    };

    const openAddModal = () => {
        setEditRow(null);
        setFormProvider("OpenAI");
        setFormModel(MODELS_BY_PROVIDER.OpenAI[0]);
        setFormKey("");
        setFormVoice("no");
        setDetectionResult(null);
        setDynamicModels([]);
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
        setDetectionResult(null);
        setDynamicModels([]);
        setModalOpen(true);
    };

    const onProviderChange = useCallback((provider: ProviderId) => {
        setFormProvider(provider);
        setDynamicModels([]);
        const models = MODELS_BY_PROVIDER[provider] || ["default"];
        setFormModel(models[0]);
    }, []);

    const runKeyDetection = useCallback(async (keyVal: string) => {
        const trimmed = keyVal.trim();
        if (!trimmed || trimmed.length < 8) {
            setDetectionResult(null);
            setDynamicModels([]);
            return;
        }
        setAutoDetecting(true);
        try {
            const res = await apiFetch("coderpad/me/llm-keys/detect-and-validate", {
                method: "POST",
                body: { api_key: trimmed },
            });
            if (res && res.detected_provider) {
                const provName = normalizeProvider(res.detected_provider);
                setFormProvider(provName);
                const fallback = MODELS_BY_PROVIDER[provName] || ["default"];
                const available = Array.isArray(res.available_models) && res.available_models.length > 0
                    ? res.available_models
                    : fallback;
                setDynamicModels(available);
                setFormModel(res.default_model || available[0] || fallback[0]);
                setDetectionResult({
                    provider: res.display_name || res.detected_provider,
                    status: res.status,
                    message: res.message,
                    models: available,
                    defaultModel: res.default_model || available[0],
                });
            }
        } catch {
            /* ignore detection error */
        } finally {
            setAutoDetecting(false);
        }
    }, []);

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

    const [copiedId, setCopiedId] = useState<number | null>(null);

    const copyKey = async (row: LlmKeyRow) => {
        let textToCopy = revealed[row.id];
        if (!textToCopy) {
            setRevealingId(row.id);
            try {
                const rev = await apiFetch(`coderpad/me/llm-keys/${row.id}/reveal`);
                textToCopy = typeof rev?.api_key === "string" ? rev.api_key.trim() : "";
                if (textToCopy) {
                    setRevealed((prev) => ({ ...prev, [row.id]: textToCopy }));
                }
            } catch {
                toast.error("Could not fetch API key for copy.");
                setRevealingId(null);
                return;
            } finally {
                setRevealingId(null);
            }
        }
        if (textToCopy) {
            try {
                await navigator.clipboard.writeText(textToCopy);
                setCopiedId(row.id);
                toast.success(`${row.provider_name} API Key copied to clipboard!`);
                setTimeout(() => setCopiedId(null), 2000);
            } catch {
                toast.error("Failed to copy API key to clipboard.");
            }
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
                toast.success(`${row.provider_name} API Key is valid & active!`);
            } else if (hit.status === "invalid") {
                toast.error(`${row.provider_name} API Key is invalid.`);
            } else {
                toast.error(`${row.provider_name} API Key is inactive.`);
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

        setFormSaving(true);
        try {
            let savedId = editRow?.id;
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
                let targetProvider = formProvider;
                let targetModel = formModel;

                // Live auto-detection before saving so candidate never needs to select provider or model manually
                try {
                    const detectRes = await apiFetch("coderpad/me/llm-keys/detect-and-validate", {
                        method: "POST",
                        body: { api_key: k },
                    });
                    if (detectRes && detectRes.detected_provider && detectRes.detected_provider !== "Unknown") {
                        targetProvider = normalizeProvider(detectRes.detected_provider);
                        targetModel = detectRes.default_model || detectRes.available_models?.[0] || MODELS_BY_PROVIDER[targetProvider]?.[0] || targetModel;
                    }
                } catch {
                    /* fallback to form values */
                }

                const res = await apiFetch("coderpad/me/llm-keys", {
                    method: "POST",
                    body: {
                        provider_name: targetProvider,
                        api_key: k,
                        model_name: targetModel,
                        voice_enabled: voiceEnabled,
                    },
                });
                savedId = res.id;
                toast.success("LLM key saved.");
                setEditRow({
                    id: savedId,
                    provider_name: targetProvider,
                    masked_key: "***",
                    model_name: targetModel,
                    entry_date: new Date().toISOString(),
                    voice_enabled: voiceEnabled,
                    is_default: false,
                    validation_status: "checking",
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

        const savedId = await saveKey(false);
        if (!savedId) return;

        toast.loading("Validating...", { id: "validate-toast" });
        try {
            const batch = await apiFetch("coderpad/me/llm-keys/validate-batch", {
                method: "POST",
                body: {
                    keys: [{ id: savedId, provider_name: formProvider, source: "wbl" }],
                },
            });
            const hit = batch?.results?.[0];
            if (!hit) throw new Error("No validation result");

            applyValidationResults([hit]);

            if (hit.status === "active") {
                toast.success(`${formProvider} key is active.`, { id: "validate-toast" });
            } else if (hit.status === "invalid") {
                toast.error(hit.message || "Invalid API key", { id: "validate-toast" });
            } else {
                toast.error(hit.message || "Key inactive", { id: "validate-toast" });
            }
        } catch (err) {
            toast.error("Validation failed.", { id: "validate-toast" });
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
                        <DialogContent className="max-w-[min(42rem,95vw)] sm:max-w-3xl gap-0 p-0 overflow-hidden min-h-[420px] flex flex-col justify-between">
                            <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
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

                            <div className="px-6 py-4 space-y-4 flex-1 flex flex-col justify-start">
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
                                                {(dynamicModels.length > 0
                                                    ? dynamicModels
                                                    : (MODELS_BY_PROVIDER[formProvider] || ["default"])
                                                ).map((m) => (
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
                                                className={`h-3.5 w-3.5 ${formVoice === "yes"
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
                                                <SelectValue placeholder="Speech enabled" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-44">
                                                <SelectItem value="no">No</SelectItem>
                                                <SelectItem value="yes">Yes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="min-w-0">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                        API key
                                    </Label>
                                    <Input
                                        type="password"
                                        value={formKey}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormKey(val);

                                            const trimmed = val.trim();
                                            if (trimmed.startsWith("sk-ant-")) {
                                                onProviderChange("Claude");
                                            } else if (trimmed.startsWith("AIza") || trimmed.startsWith("AQ.") || trimmed.startsWith("AQ")) {
                                                onProviderChange("Gemini");
                                            } else if (trimmed.startsWith("gsk_")) {
                                                onProviderChange("Groq");
                                            } else if (trimmed.startsWith("xai-")) {
                                                onProviderChange("Grok");
                                            } else if (trimmed.startsWith("sk-or-")) {
                                                onProviderChange("OpenRouter");
                                            } else if (trimmed.startsWith("pplx-")) {
                                                onProviderChange("Perplexity");
                                            } else if (trimmed.startsWith("sk-proj-") || trimmed.startsWith("sk-admin-")) {
                                                onProviderChange("OpenAI");
                                            } else if (trimmed.startsWith("deepseek-") || trimmed.startsWith("ds-")) {
                                                onProviderChange("DeepSeek");
                                            }
                                            void runKeyDetection(val);
                                        }}
                                        placeholder={
                                            editRow
                                                ? "Leave blank to keep current key"
                                                : "Paste API key (Provider & Models auto-detected)"
                                        }
                                        className="mt-1 h-9 font-mono text-sm"
                                        autoComplete="new-password"
                                    />
                                </div>

                                {/* Reserved min-height container for Live Detection & Validation Status */}
                                <div className="min-h-[56px] flex flex-col justify-center">
                                    {autoDetecting && (
                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                            <span>Auto-detecting provider and fetching supported models…</span>
                                        </div>
                                    )}

                                    {detectionResult && !autoDetecting && (
                                        <div
                                            className={`p-2.5 border rounded-lg text-xs space-y-0.5 ${detectionResult.status === "active"
                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                                                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 font-semibold">
                                                {detectionResult.status === "active" ? (
                                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                ) : (
                                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                                )}
                                                <span>
                                                    {detectionResult.status === "active"
                                                        ? `Provider Detected: ${detectionResult.provider}`
                                                        : `Provider Detection / Validation Error`}
                                                </span>
                                            </div>
                                            <p className="text-[11px] opacity-90">
                                                {detectionResult.message}
                                            </p>
                                            {detectionResult.status === "active" && (
                                                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                                    Found {detectionResult.models?.length || 0} supported models. Default selected: <strong>{detectionResult.defaultModel}</strong>
                                                </p>
                                            )}
                                        </div>
                                    )}
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
                                    variant="outline"
                                    size="sm"
                                    className="min-w-[7rem]"
                                    disabled={formSaving || (!editRow && !formKey.trim())}
                                    onClick={() => void validateFormKey()}
                                >
                                    Validate
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
                                    <th className="px-4 py-3">Validate</th>
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
                                                <td className="px-4 py-3 min-w-[320px]">
                                                    <div className="flex items-start gap-2 w-full max-w-[420px]">
                                                        <div
                                                            onClick={() => openEditModal(row)}
                                                            className="flex-1 min-w-0 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                            title="Click to edit key"
                                                        >
                                                            {showPlain ? (
                                                                <span
                                                                    className="block text-xs font-mono text-gray-800 dark:text-gray-200 break-all leading-relaxed whitespace-pre-wrap select-all"
                                                                    aria-label={`${row.provider_name} API key`}
                                                                >
                                                                    {displayKey}
                                                                </span>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    readOnly
                                                                    value="••••••••••••"
                                                                    className="block w-full border-0 bg-transparent p-0 text-xs font-mono text-gray-700 dark:text-gray-300 outline-none focus:ring-0 cursor-pointer"
                                                                    autoComplete="off"
                                                                    spellCheck={false}
                                                                    aria-label={`${row.provider_name} API key`}
                                                                />
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="shrink-0 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                                            title="Copy API key"
                                                            disabled={revealingId === row.id}
                                                            onClick={() => void copyKey(row)}
                                                        >
                                                            {copiedId === row.id ? (
                                                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </button>
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
                                                            className={`rounded-md border px-2 py-1 text-xs font-semibold min-w-[4.5rem] disabled:opacity-60 ${row.voice_enabled
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
                                                                className={`h-3.5 w-3.5 shrink-0 ${row.voice_enabled
                                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                                        : "text-gray-300 dark:text-gray-600"
                                                                    }`}
                                                                aria-hidden
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${row.is_default && row.validation_status === "active"
                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                                                            }`}
                                                    >
                                                        {row.is_default && row.validation_status === "active" ? "Yes" : "No"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        disabled={validatingId === row.id}
                                                        onClick={() => void validateRow(row)}
                                                    >
                                                        {validatingId === row.id ? (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                Validating…
                                                            </span>
                                                        ) : (
                                                            "Validate"
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

            {/* All Keys Invalid / Credits Completed Popup Modal */}
            <Dialog open={allExhaustedModalOpen} onOpenChange={setAllExhaustedModalOpen}>
                <DialogContent className="max-w-md p-6 rounded-2xl space-y-4">
                    <DialogHeader className="text-left space-y-1">
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            All LLM Keys Invalid / Credits Completed
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pt-1">
                            All of your configured LLM API keys are invalid or have exhausted their available credits.
                            Please add a new API key or add credits to continue using AI features.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 font-medium">
                        No active LLM key is currently available for AI features.
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAllExhaustedModalOpen(false)}
                        >
                            Dismiss
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            onClick={() => {
                                setAllExhaustedModalOpen(false);
                                openAddModal();
                            }}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
