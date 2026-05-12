"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Brain, Key, Upload, CheckCircle, AlertCircle,
  ChevronRight, FileText, Eye, EyeOff, Bot,
  Settings, Save, Plus, Trash2, Mic, MicOff, Loader2, PlayCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useAuth } from "@/utils/AuthContext";
import axios from "axios";
import { apiFetch } from "@/lib/api";

const MODELS_BY_PROVIDER: Record<string, string[]> = {
  OpenAI: [
    "GPT-5.3", "GPT-5.2", "GPT-5.1", "GPT-4.1", "GPT-4.0", 
    "GPT-4 Turbo", "GPT-3.5 Turbo", "o1", "o1-mini", "o3", "o3-mini", 
    "GPT-5.3 multimodal", "GPT-4o", "GPT-4o-mini", "DALL·E 3", "DALL·E 4", 
    "Whisper v3", "TTS-1", "TTS-1 HD", "text-embedding-3-large", "text-embedding-3-small"
  ],
  Claude: [
    "Claude 3 Opus", "Claude 3 Sonnet", "Claude 3 Haiku", 
    "Claude 3.5 Sonnet", "Claude 3.5 Haiku"
  ],
  Gemini: [
    "Gemini 1.0 Pro", "Gemini 1.0 Ultra", "Gemini 1.5 Pro", 
    "Gemini 1.5 Flash", "Gemini 2.0 Pro", "Gemini 2.0 Flash"
  ],
};

type Step = 1 | 2 | 3 | 4;

export type CandidateSetupWizardProps = {
  variant?: "page" | "embedded";
  /** When embedded, called instead of navigating away after setup completes. */
  onSetupComplete?: () => void | Promise<void>;
  /** WBL candidate id — ties resume/API keys to candidate_marketing & candidate_llm_api_keys. */
  candidateId?: number;
  /** When true and setup is already complete, open on resume edit (step 2) instead of the done screen. */
  manageMode?: boolean;
  /** Pre-fetched session data to skip the slow init+summary round-trip on open. */
  prefetchedSession?: { sessionId: string; summaryData: any } | null;
};

export function CandidateSetupWizard({
  variant = "page",
  onSetupComplete,
  candidateId,
  manageMode = false,
  prefetchedSession = null,
}: CandidateSetupWizardProps) {
  const router = useRouter();
  const isEmbedded = variant === "embedded";
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [loadingApiKey, setLoadingApiKey] = useState(false);
  const [mounted, setMounted] = useState(false);
  const finishSetupRef = useRef<HTMLDivElement>(null);

  // Resume State
  const [resumeJson, setResumeJson] = useState<string>("");
  const [resumeError, setResumeError] = useState<string>("");
  const [resumeWarning, setResumeWarning] = useState<string>("");
  const [isValidated, setIsValidated] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  // API Key State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState({
    provider_name: "OpenAI",
    api_key: "",
    model_name: "GPT-5.3",
    voice_enabled: false
  });
  const [showKey, setShowKey] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [apiSuccess, setApiSuccess] = useState<string>("");
  const [setupStatus, setSetupStatus] = useState<any>(null);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_AIPREP_API_URL || (process.env.NODE_ENV === "production" ? "https://ai-backend-560359652969.us-central1.run.app/api" : "http://localhost:8000/api");

  const ingestSummary = (d: any, opts?: { skipStepReset?: boolean }) => {
    const hasKeys =
      d.has_api_key === true ||
      (Array.isArray(d.llm_keys) && d.llm_keys.length > 0);
    const hasResume =
      d.resume_text === "Exists" ||
      (d.resume_json != null && typeof d.resume_json === "object");
    const st = {
      resume_uploaded: hasResume,
      api_keys_configured: hasKeys,
      setup_complete: hasResume && hasKeys,
    };
    setSetupStatus(st);

    if (d.resume_json && typeof d.resume_json === "object") {
      setFileName(d.resume_filename || "existing_resume.json");
      setResumeJson(JSON.stringify(d.resume_json, null, 2));
    }

    if (Array.isArray(d.llm_keys) && d.llm_keys.length > 0) {
      setApiKeys(
        d.llm_keys.map((k: { id: number; provider_name: string; model_name: string; voice_enabled: boolean }) => ({
          id: k.id,
          provider_name: k.provider_name,
          model_name: k.model_name || "Active",
          voice_enabled: Boolean(k.voice_enabled),
        }))
      );
    } else {
      setApiKeys([]);
    }

    if (!opts?.skipStepReset) {
      if (manageMode && st.setup_complete) {
        // In manage mode, always land on Step 1 so user sees the upload screen
        // with existing file and option to upload a different JSON
        setCurrentStep(1);
      } else if (st.setup_complete) {
        setCurrentStep(4);
      } else if (st.resume_uploaded) {
        // Don't skip to step 2 — show upload screen with existing file info
        setCurrentStep(1);
      } else if (st.api_keys_configured) {
        setCurrentStep(3);
      } else {
        setCurrentStep(1);
      }
    }
  };

  const reloadSummary = async (sid: string, skipStepReset?: boolean) => {
    const statusRes = await axios.get(`${API_URL}/setup/summary?session_id=${sid}`);
    ingestSummary(statusRes.data, { skipStepReset: !!skipStepReset });
  };

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading || !isAuthenticated) return;

    // If pre-fetched session data is provided (from Dashboard), skip the slow init+summary fetch
    if (prefetchedSession) {
      setSessionId(prefetchedSession.sessionId);
      localStorage.setItem("prep_token", prefetchedSession.sessionId);
      ingestSummary(prefetchedSession.summaryData);
      if (!prefetchedSession.summaryData.resume_json) {
        setFileName("");
        setResumeJson("");
      }
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const payload = JSON.parse(atob(token.split(".")[1]));
        const email = payload.sub || payload.email || payload.uname || "candidate";

        let cid: number | null =
          typeof candidateId === "number" && candidateId > 0 ? candidateId : null;
        if (cid == null) {
          try {
            const u = await apiFetch("user_dashboard", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (u?.candidate_id) cid = Number(u.candidate_id);
          } catch {
            /* ignore */
          }
        }
        if (cid == null || cid <= 0) {
          toast.error("Candidate profile not linked. Open setup from your dashboard.");
          return;
        }

        const res = await axios.post(`${API_URL}/setup/init-and-summary`, {
          candidate_id: cid,
          wbl_email: email,
          name: email,
        });
        const sid = res.data.session_id;
        const summaryData = res.data.summary;
        if (cancelled) return;
        setSessionId(sid);
        localStorage.setItem("prep_token", sid);

        ingestSummary(summaryData);
        if (!summaryData.resume_json) {
          setFileName("");
          setResumeJson("");
        }
      } catch (err) {
        console.error("Failed to init AI prep session", err);
        toast.error("Could not load setup. Try again.");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [mounted, authLoading, isAuthenticated, candidateId, manageMode, prefetchedSession]);

  const validateJson = (jsonStr: string) => {
    try { JSON.parse(jsonStr); return true; } catch { return false; }
  };

  const validateResumeStructure = (data: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const getNested = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : undefined, obj);
    };

    const highBasics = ['name', 'email', 'url', 'summary'];
    highBasics.forEach(field => {
      if (!getNested(data, `basics.${field}`)) errors.push(`basics.${field}`);
    });

    if (!Array.isArray(data.work) || data.work.length === 0) {
      errors.push("work (must be a non-empty array)");
    } else {
      data.work.forEach((w: any, idx: number) => {
        ['name', 'position', 'startDate', 'endDate'].forEach(field => {
          if (w[field] === undefined || w[field] === null) errors.push(`work[${idx}].${field}`);
        });
        if (!Array.isArray(w.highlights) || w.highlights.length === 0) {
          errors.push(`work[${idx}].highlights`);
        }
      });
    }

    if (!Array.isArray(data.skills) || data.skills.length === 0) {
      errors.push("skills (must be a non-empty array)");
    } else {
      data.skills.forEach((s: any, idx: number) => {
        if (!s.name) errors.push(`skills[${idx}].name`);
        if (!Array.isArray(s.keywords) || s.keywords.length === 0) {
          errors.push(`skills[${idx}].keywords`);
        }
      });
    }

    if (!Array.isArray(data.education) || data.education.length === 0) {
      warnings.push("education");
    } else {
      data.education.forEach((e: any, idx: number) => {
        ['institution', 'studyType', 'area'].forEach(field => {
          if (!e[field]) warnings.push(`education[${idx}].${field}`);
        });
      });
    }
    
    if (!Array.isArray(getNested(data, 'basics.profiles')) || data.basics.profiles.length === 0) {
      warnings.push("basics.profiles");
    }
    if (!getNested(data, 'custom_fields.technical_screening')) {
      warnings.push("custom_fields.technical_screening");
    }

    ['application_logistics', 'legal', 'eeo'].forEach(field => {
      if (!getNested(data, `custom_fields.${field}`)) warnings.push(`custom_fields.${field}`);
    });

    return { isValid: errors.length === 0, errors, warnings };
  };

  const handleValidateResume = () => {
    setResumeError("");
    setResumeWarning("");
    if (!validateJson(resumeJson)) {
      setResumeError("Invalid JSON format. Please check your input.");
      return;
    }
    const data = JSON.parse(resumeJson);
    const { isValid, errors, warnings } = validateResumeStructure(data);
    
    if (!isValid) {
      setResumeError(`Missing mandatory fields: ${errors.join(", ")}`);
      setIsValidated(false);
      toast.error("Resume validation failed. Please add missing mandatory fields.");
      return;
    }

    if (warnings.length > 0) {
      setResumeWarning(`Missing recommended fields: ${warnings.join(", ")}. You can still proceed.`);
      setIsValidated(true);
      toast.success("Validation passed with warnings.");
    } else {
      setResumeWarning("");
      setIsValidated(true);
      toast.success("Resume structure is perfectly valid!");
    }
  };

  const handleResumeSubmit = async () => {
    if (!validateJson(resumeJson) || !sessionId) {
      setResumeError("Invalid JSON format or missing session.");
      return;
    }
    
    const data = JSON.parse(resumeJson);
    const { isValid, errors } = validateResumeStructure(data);
    if (!isValid) {
      setResumeError(`Missing mandatory fields: ${errors.join(", ")}`);
      setIsValidated(false);
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      const blob = new Blob([resumeJson], { type: "application/json" });
      formData.append("file", blob, fileName || "resume.json");
      formData.append("session_id", sessionId);

      await axios.post(`${API_URL}/setup/resume`, formData);
      toast.success("Resume saved successfully!");
      setCurrentStep(3);
      await reloadSummary(sessionId, true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Failed to save resume";
      setResumeError(detail);
      toast.error(detail);
      setIsValidated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      toast.error("Please upload a JSON file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (validateJson(content)) {
        setResumeJson(JSON.stringify(JSON.parse(content), null, 2));
        setFileName(file.name);
        setResumeError("");
        setResumeWarning("");
        setCurrentStep(2);
      } else {
        toast.error("File content is not valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddApiKey = async () => {
    setApiError("");
    if (!newKey.api_key || !sessionId) { 
      setApiError("Please enter an API key."); 
      toast.error("Please enter an API key."); 
      return; 
    }
    setLoadingApiKey(true);
    try {
      setApiSuccess("");
      await axios.post(`${API_URL}/setup/validate`, {
          api_provider: newKey.provider_name,
          api_key: newKey.api_key,
          session_id: sessionId,
          model_name: newKey.model_name,
          voice_enabled: newKey.voice_enabled,
      });
      setApiSuccess(`${newKey.provider_name} key validated and added successfully!`);
      toast.success(`${newKey.provider_name} key added!`);
      setNewKey({ ...newKey, api_key: "" });
      await reloadSummary(sessionId, true);
      
      // Auto-scroll to the bottom (Finish Setup) after a small delay to allow UI to render
      setTimeout(() => {
        finishSetupRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    } catch (err: any) {
      let errorMsg = err.response?.data?.detail || "Invalid API Key";
      if (errorMsg.includes("does not support voice processing")) {
        errorMsg = "Voice processing not available for this key. Please select another model or provider.";
      }
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingApiKey(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!sessionId) {
      toast.error("Session not ready. Please wait or refresh.");
      return;
    }
    try {
      await axios.delete(`${API_URL}/setup/llm-key/${id}`, {
        params: { session_id: sessionId },
      });
      toast.success("API key removed.");
      await reloadSummary(sessionId, true);
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Failed to remove key";
      toast.error(detail);
    }
  };

  const steps = [
    { num: 1, label: "Upload Resume", desc: "JSON file format" },
    { num: 2, label: "Review JSON", desc: "Edit experience" },
    { num: 3, label: "API Keys", desc: "LLM providers" },
    { num: 4, label: "Done", desc: "Ready for AI prep" },
  ];

  if (!mounted || authLoading) return null;

  if (!isAuthenticated) return null;

  return (
    <section
      className={
        isEmbedded
          ? "relative z-10 flex flex-1 min-h-0 flex-col overflow-hidden"
          : "relative z-10 flex min-h-[calc(100vh-120px)] items-center justify-center pt-24 pb-8 overflow-hidden"
      }
    >
      {/* Background decoration matching site style */}
      <div className="absolute right-0 top-0 z-[-1]">
        <svg width="1440" height="600" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.05" d="M1086.96 197.978L632.959 454.978L935.625 435.926L1086.96 197.978Z" fill="url(#wiz_grad1)" />
          <path opacity="0.05" d="M1324.5 555.5L1450 487V686.5L1324.5 867.5L-10 188L1324.5 555.5Z" fill="url(#wiz_grad2)" />
          <defs>
            <linearGradient id="wiz_grad1" x1="1178.4" y1="51.853" x2="780.959" y2="353.581" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" /><stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wiz_grad2" x1="160.5" y1="120" x2="1099.45" y2="1092.04" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4A6CF7" /><stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div
        className={
          isEmbedded
            ? "flex flex-1 min-h-0 flex-col w-full max-w-5xl mx-auto px-2 lg:px-4"
            : "container mx-auto px-4 w-full max-w-5xl"
        }
      >
        <div
          className={
            isEmbedded
              ? "flex flex-col md:flex-row bg-white dark:bg-dark shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex-1 min-h-0 min-h-[420px]"
              : "flex flex-col md:flex-row bg-white dark:bg-dark shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[500px] h-[calc(100vh-200px)] max-h-[640px]"
          }
        >
          
          {/* ----- LEFT SIDEBAR (STEPS) ----- */}
          <div className="w-full md:w-1/3 bg-gray-50/80 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800 p-6 md:p-8 flex flex-col shrink-0">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-extrabold text-black dark:text-white leading-tight">
                Candidate Setup
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Configure your AI profile
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-6">
              {steps.map((s) => {
                const isPast = currentStep > s.num;
                const isActive = currentStep === s.num;

                return (
                  <div key={s.num} className="flex gap-4 items-start relative">
                    {/* Vertical line connecting steps */}
                    {s.num !== steps.length && (
                      <div className={`absolute left-4 top-8 bottom-[-24px] w-0.5 ${isPast ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    )}
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10 bg-white dark:bg-gray-900 transition-all ${
                      isActive ? "border-primary text-primary" : 
                      isPast ? "border-primary bg-primary text-white dark:bg-primary" : 
                      "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600"
                    }`}>
                      {isPast ? <CheckCircle size={14} /> : <span className="text-[11px] font-extrabold">{s.num}</span>}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isActive ? "text-black dark:text-white" : isPast ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
                        {s.label}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                🔒 Keys are encrypted at rest.
              </p>
            </div>
          </div>

          {/* ----- RIGHT CONTENT (ACTIONS) ----- */}
          <div className="w-full md:w-2/3 p-6 md:p-8 overflow-y-auto flex flex-col relative">
                  {/* ── STEP 1: UPLOAD ── */}
            {currentStep === 1 && (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-black dark:text-white mb-1">
                    Upload JSON Resume
                  </h2>
                  {fileName ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Your resume is already uploaded. Review it below or upload a different file.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-primary dark:text-primary mb-2">
                        &ldquo;If you don&apos;t have a JSON resume, please reach out to your instructors.&rdquo;
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Provide your resume in JSON format. This allows our AI to parse your experience correctly.
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-4 flex-1">
                  {fileName ? (
                    /* ── Existing file state ── */
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-primary/20 bg-primary/5 rounded-xl flex-1 text-center">
                      <div className="w-16 h-16 bg-white dark:bg-gray-800 shadow-sm rounded-2xl flex items-center justify-center mb-4 relative">
                        <FileText className="w-8 h-8 text-primary" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">Resume on File</p>
                      <p className="text-xs text-primary font-mono bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-5">
                        {fileName}
                      </p>
                      {/* Upload different JSON button */}
                      <button
                        onClick={() => document.getElementById("json-upload-step1")?.click()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:text-primary hover:bg-primary/5 transition-all duration-200"
                      >
                        <Upload size={14} />
                        Upload different JSON
                      </button>
                      <input id="json-upload-step1" type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                    </div>
                  ) : (
                    /* ── Empty / drop zone ── */
                    <div
                      onClick={() => document.getElementById("json-upload")?.click()}
                      className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary dark:hover:border-primary bg-gray-50 dark:bg-gray-800/30 hover:bg-primary/5 transition-all group flex-1"
                    >
                      <input id="json-upload" type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                      <div className="w-12 h-12 bg-white dark:bg-gray-800 shadow-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="font-bold text-base text-black dark:text-white mb-1">Select JSON File</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Click to browse your computer</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-800 flex flex-wrap justify-between gap-3">
                  <div />
                  <button
                    disabled={!resumeJson}
                    onClick={() => resumeJson && setCurrentStep(2)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-900 to-purple-400 py-2.5 px-6 text-sm font-bold text-white transition duration-500 hover:bg-gradient-to-tl disabled:opacity-40 shadow-sm disabled:cursor-not-allowed"
                  >
                    Review JSON <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: REVIEW ── */}
            {currentStep === 2 && (
              <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-black dark:text-white mb-1">Review JSON</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Edit your resume metadata before saving.</p>
                  </div>
                </div>

                {resumeError && (
                  <div className="mb-4 text-xs text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{resumeError}</span>
                  </div>
                )}

                {resumeWarning && (
                  <div className="mb-4 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{resumeWarning}</span>
                  </div>
                )}

                {isValidated && !resumeError && !resumeWarning && (
                  <div className="mb-4 text-xs text-green-600 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/50 p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle size={14} className="shrink-0" />
                    <span>Resume successfully validated! You can now save and continue.</span>
                  </div>
                )}

                <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-4 bg-gray-50 dark:bg-dark min-h-[200px]">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme={isDark ? "vs-dark" : "light"}
                    value={resumeJson}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 12, bottom: 12 },
                    }}
                    onChange={(val) => {
                      setResumeJson(val || "");
                      setIsValidated(false);
                      setResumeWarning("");
                    }}
                  />
                </div>

                <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-800 flex justify-between gap-3 shrink-0">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2.5 rounded-xl border-2 border-indigo-900/20 dark:border-indigo-400/20 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-300"
                  >
                    Back
                  </button>
                  
                  {!isValidated ? (
                    <button
                      onClick={handleValidateResume}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border-2 border-primary text-primary rounded-xl text-sm font-bold transition duration-300 hover:bg-primary hover:text-white shadow-sm"
                    >
                      <CheckCircle size={16} /> Validate Resume
                    </button>
                  ) : (
                    <button
                      disabled={loading}
                      onClick={handleResumeSubmit}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-indigo-900 to-purple-400 rounded-xl text-sm font-bold text-white transition duration-500 hover:bg-gradient-to-tl disabled:opacity-60 shadow-sm"
                    >
                      <Save size={16} /> {loading ? "Saving..." : "Save & Continue"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 3: API KEYS ── */}
            {currentStep === 3 && (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 overflow-y-auto pr-1">
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-black dark:text-white mb-1">AI Provider Keys</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Configure LLM accounts for the platform.</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 flex-1">
                  {/* Add form */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-fit">
                    <h3 className="text-sm font-bold text-black dark:text-white mb-4 flex items-center gap-1.5">
                      <Plus size={16} className="text-primary" /> Add Key
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Provider</label>
                        <select
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white px-3 py-2 text-xs focus:outline-none focus:border-primary"
                          value={newKey.provider_name}
                          onChange={(e) => {
                            const provider = e.target.value;
                            setNewKey({ 
                              ...newKey, 
                              provider_name: provider,
                              model_name: MODELS_BY_PROVIDER[provider][0]
                            });
                          }}
                        >
                          <option value="OpenAI">OpenAI</option>
                          <option value="Claude">Claude</option>
                          <option value="Gemini">Gemini</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">API Key</label>
                        <div className="relative">
                          <textarea
                            rows={3}
                            placeholder="Paste your API key here..."
                            className={`w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white px-3 py-2 pr-9 text-xs focus:outline-none focus:border-primary resize-none font-mono ${!showKey ? 'mask-text' : ''}`}
                            value={newKey.api_key}
                            onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                          >
                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Model</label>
                        <select
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white px-3 py-2 text-xs focus:outline-none focus:border-primary"
                          value={newKey.model_name}
                          onChange={(e) => {
                            const newModel = e.target.value;
                            setNewKey({ 
                              ...newKey, 
                              model_name: newModel
                            });
                          }}
                        >
                          {(MODELS_BY_PROVIDER[newKey.provider_name] || []).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-2 pb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            onClick={() => setNewKey({ ...newKey, voice_enabled: !newKey.voice_enabled })}
                            className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors duration-200 ${newKey.voice_enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                          >
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${newKey.voice_enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Enable Voice Processing</span>
                        </div>
                        {newKey.voice_enabled ? <Mic size={14} className="text-primary" /> : <MicOff size={14} className="text-gray-400" />}
                      </div>

                      <button
                        onClick={handleAddApiKey}
                        disabled={loadingApiKey || !newKey.api_key}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-br from-indigo-900 to-purple-400 text-xs font-bold text-white transition duration-500 hover:bg-gradient-to-tl disabled:opacity-40 shadow-sm flex items-center justify-center gap-2"
                      >
                        {loadingApiKey ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Validating...
                          </>
                        ) : "Add Key"}
                      </button>

                    {apiSuccess && (
                      <div className="mt-4 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                        <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">{apiSuccess}</span>
                      </div>
                    )}

                    {apiError && (
                      <div className="mt-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">{apiError}</span>
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Keys list */}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-black dark:text-white mb-3 flex items-center gap-1.5">
                      <Settings size={16} className="text-gray-400" /> Configured
                    </h3>

                    {apiKeys.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center bg-gray-50 dark:bg-gray-800/20">
                        <Bot size={24} className="text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">None configured yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                        {apiKeys.map((k) => (
                          <div key={k.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl group shadow-sm">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-xs text-black dark:text-white">{k.provider_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-bold">{k.model_name}</span>
                                {k.voice_enabled && (
                                  <span className="flex items-center gap-1 text-[9px] text-primary font-bold">
                                    <Mic size={10} /> Voice
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteKey(k.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div ref={finishSetupRef} className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex justify-between gap-3">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 rounded-xl border-2 border-indigo-900/20 dark:border-indigo-400/20 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => apiKeys.length > 0 && setCurrentStep(4)}
                    disabled={apiKeys.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-br from-indigo-900 to-purple-400 text-sm font-bold text-white transition duration-500 hover:bg-gradient-to-tl disabled:opacity-40 shadow-sm"
                  >
                    Finish Setup <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: DONE ── */}
            {currentStep === 4 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl flex items-center justify-center mb-5 rotate-12 transition-transform hover:rotate-0">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-black dark:text-white mb-2">You&apos;re All Set!</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto mb-8">
                  Your AI profile is ready. You can update your settings at any time from your dashboard.
                </p>

                <div className="flex items-center justify-center gap-3 w-full mb-8">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50">
                    <FileText size={14} className="text-green-600 dark:text-green-500" />
                    <span className="text-xs font-bold text-green-700 dark:text-green-400">Resume ✓</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50">
                    <Key size={14} className="text-green-600 dark:text-green-500" />
                    <span className="text-xs font-bold text-green-700 dark:text-green-400">{apiKeys.length} Keys ✓</span>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (isEmbedded) {
                      const baseUrl =
                        process.env.NEXT_PUBLIC_AIPREP_FRONTEND_URL || "http://localhost:3000";
                      const token = localStorage.getItem("prep_token");
                      if (token) {
                        window.open(`${baseUrl}/auth?token=${token}`, "_blank");
                      } else {
                        window.open(baseUrl, "_blank");
                      }
                      await onSetupComplete?.();
                    } else {
                      router.push("/user_dashboard");
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-8 py-3 text-sm font-bold text-white transition duration-500 shadow-md shadow-emerald-900/20"
                >
                  {isEmbedded ? (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Start Preparation
                    </>
                  ) : (
                    <>
                      Go to Dashboard <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
