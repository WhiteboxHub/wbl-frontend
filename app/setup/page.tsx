"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Brain, Key, Upload, CheckCircle, AlertCircle,
  ChevronRight, FileText, Eye, EyeOff, Bot,
  Settings, Save, Plus, Trash2, Code
} from "lucide-react";
import { toast } from "react-hot-toast";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

type Step = 1 | 2 | 3 | 4;

export default function CandidateSetupWizard() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Resume State
  const [resumeJson, setResumeJson] = useState<string>("");
  const [resumeError, setResumeError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  // API Key State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState({
    provider_name: "OpenAI",
    api_key: "",
    model_name: "gpt-4o",
    services_enabled: { whisper: true, embeddings: true }
  });
  const [showKey, setShowKey] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [setupStatus, setSetupStatus] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const statusRes = await api.get("/candidate/setup-status");
      setSetupStatus(statusRes.data);

      if (statusRes.data.resume_uploaded) {
        try {
          const resumeRes = await api.get("/candidate/resume");
          setResumeJson(JSON.stringify(resumeRes.data.resume_json, null, 2));
          if (resumeRes.data.file_name) {
            setFileName(resumeRes.data.file_name);
          } else {
            setFileName("existing_resume.json");
          }
          // If setup is fully complete, start them at step 4 initially so they see completion,
          // or start them at step 1 with data pre-filled. We will start at 1 to allow edit flow.
        } catch (e) { console.error("Failed to fetch resume"); }
      }
      
      if (statusRes.data.api_keys_configured) {
        fetchApiKeys();
      }
    } catch (err) {
      console.error("Failed to fetch setup status", err);
    }
  };

  const validateJson = (jsonStr: string) => {
    try { JSON.parse(jsonStr); return true; } catch { return false; }
  };

  const handleResumeSubmit = async () => {
    if (!validateJson(resumeJson)) {
      setResumeError("Invalid JSON format. Please check your input.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/candidate/resume", { 
        resume_json: JSON.parse(resumeJson), 
        file_name: fileName 
      });
      toast.success("Resume saved successfully!");
      setCurrentStep(3);
      initializeData();
    } catch (err: any) {
      toast.error(err.body?.detail || "Failed to save resume");
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
        setCurrentStep(2);
      } else {
        toast.error("File content is not valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddApiKey = async () => {
    setApiError("");
    if (!newKey.api_key) { 
      setApiError("Please enter an API key."); 
      toast.error("Please enter an API key."); 
      return; 
    }
    setLoading(true);
    try {
      await api.post("/candidate/api-keys", newKey);
      toast.success(`${newKey.provider_name} key added!`);
      setNewKey({ ...newKey, api_key: "" });
      fetchApiKeys();
      initializeData();
    } catch (err: any) {
      const errorMsg = err.body?.detail || "Failed to add API key. Key might be invalid.";
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await api.get("/candidate/api-keys");
      setApiKeys(res.data);
    } catch { console.error("Failed to fetch api keys"); }
  };

  useEffect(() => {
    if (currentStep === 3) fetchApiKeys();
  }, [currentStep]);

  const handleDeleteKey = async (id: number) => {
    try {
      await api.delete(`/candidate/api-keys/${id}`);
      toast.success("API key removed");
      fetchApiKeys();
      initializeData();
    } catch { toast.error("Failed to delete key"); }
  };

  const steps = [
    { num: 1, label: "Upload Resume", desc: "JSON file format" },
    { num: 2, label: "Review JSON", desc: "Edit experience" },
    { num: 3, label: "API Keys", desc: "LLM providers" },
    { num: 4, label: "Done", desc: "Ready for AI prep" },
  ];

  if (!mounted) return null;

  return (
    <section className="relative z-10 flex min-h-[calc(100vh-120px)] items-center justify-center pt-24 pb-8 overflow-hidden">
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

      <div className="container mx-auto px-4 w-full max-w-5xl">
        <div className="flex flex-col md:flex-row bg-white dark:bg-dark shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[500px] h-[calc(100vh-200px)] max-h-[640px]">
          
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
                const isFuture = currentStep < s.num;

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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Provide your resume in JSON format. This allows our AI to parse your experience correctly.
                  </p>
                </div>

                <div className="flex flex-col gap-4 flex-1">
                  {fileName ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-primary/20 bg-primary/5 rounded-xl flex-1 text-center">
                      <div className="w-16 h-16 bg-white dark:bg-gray-800 shadow-sm rounded-2xl flex items-center justify-center mb-4 relative">
                        <FileText className="w-8 h-8 text-primary" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">File Attached</p>
                      <p className="text-xs text-primary font-mono bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        {fileName}
                      </p>
                      <button
                        onClick={() => document.getElementById("json-upload")?.click()}
                        className="mt-5 text-xs font-bold text-gray-500 hover:text-primary transition underline decoration-gray-300 underline-offset-4"
                      >
                        Upload a different file
                      </button>
                      <input id="json-upload" type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                    </div>
                  ) : (
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
                  {setupStatus?.resume_uploaded ? (
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl border-2 border-indigo-900/20 dark:border-indigo-400/20 text-sm font-bold text-indigo-900 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition duration-300"
                    >
                      Skip Upload
                    </button>
                  ) : <div />}
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

                <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-4 bg-gray-50 dark:bg-dark min-h-[200px]">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme={isDark ? "vs-dark" : "light"}
                    value={resumeJson}
                    onChange={(val) => setResumeJson(val || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 12, bottom: 12 },
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
                  <button
                    disabled={loading}
                    onClick={handleResumeSubmit}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-indigo-900 to-purple-400 rounded-xl text-sm font-bold text-white transition duration-500 hover:bg-gradient-to-tl disabled:opacity-60 shadow-sm"
                  >
                    <Save size={16} /> {loading ? "Saving..." : "Save & Continue"}
                  </button>
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
                          onChange={(e) => setNewKey({ ...newKey, provider_name: e.target.value })}
                        >
                          <option value="OpenAI">OpenAI</option>
                          <option value="Claude">Claude</option>
                          <option value="Gemini">Gemini</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">API Key</label>
                        <div className="relative">
                          <input
                            type={showKey ? "text" : "password"}
                            placeholder="sk-..."
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white px-3 py-2 pr-9 text-xs focus:outline-none focus:border-primary"
                            value={newKey.api_key}
                            onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                          >
                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Model</label>
                        <input
                          type="text"
                          placeholder="gpt-4o"
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-black dark:text-white px-3 py-2 text-xs focus:outline-none focus:border-primary"
                          value={newKey.model_name}
                          onChange={(e) => setNewKey({ ...newKey, model_name: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 pb-1">
                        {[
                          { key: "whisper", label: "Voice" },
                          { key: "embeddings", label: "Embeddings" }
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-primary focus:ring-primary w-3.5 h-3.5"
                              checked={(newKey.services_enabled as any)[key]}
                              onChange={(e) => setNewKey({ ...newKey, services_enabled: { ...newKey.services_enabled, [key]: e.target.checked } })}
                            />
                            <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{label}</span>
                          </label>
                        ))}
                      </div>

                      <button
                        onClick={handleAddApiKey}
                        disabled={loading || !newKey.api_key}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-br from-indigo-900 to-purple-400 text-xs font-bold text-white transition duration-500 hover:bg-gradient-to-tl disabled:opacity-40 shadow-sm"
                      >
                        {loading ? "Adding..." : "Add"}
                      </button>

                      {apiError && (
                        <div className="mt-2 text-[11px] text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 p-2 rounded flex items-center gap-1.5 font-medium">
                          <AlertCircle size={14} className="shrink-0" /> 
                          <span>{apiError}</span>
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
                                <span className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-bold">{k.model_name}</span>
                              </div>
                              <div className="flex gap-1.5">
                                {k.services_enabled?.whisper && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-0.5" title="Voice Enabled" />}
                                {k.services_enabled?.embeddings && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" title="Embeddings Enabled" />}
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
                
                <div className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex justify-between gap-3">
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
                <h2 className="text-2xl font-extrabold text-black dark:text-white mb-2">You're All Set!</h2>
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
                  onClick={() => router.push("/user_dashboard")}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-900 to-purple-400 px-8 py-3 text-sm font-bold text-white transition duration-500 hover:bg-gradient-to-tl shadow-md shadow-indigo-900/20"
                >
                  Go to Dashboard <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
