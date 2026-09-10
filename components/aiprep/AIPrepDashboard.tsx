"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BarChart3, ClipboardList, FileText, KeyRound, Lock, LoaderCircle, Play, Sparkles, X } from "lucide-react";
import AssessmentCard from "@/components/aiprep/AssessmentCard";
import { aiPrepApi } from "@/lib/aiprep-api";
import { apiFetch, setupApi } from "@/lib/api";
import type { AssessmentSummary, ReadinessCheck } from "@/types/aiprep";

type View = "home" | "assessments" | "assessment";
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "Not started";

type WhiteboxSetupStatus = { resume_uploaded: boolean; api_keys_configured: boolean; setup_complete: boolean };

export default function AIPrepDashboard({ initialView = "home", setupStatus }: { initialView?: View; setupStatus?: WhiteboxSetupStatus | null }) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [error, setError] = useState("");
  const [liveSetup, setLiveSetup] = useState<{ llm?: boolean; resume?: boolean }>({});
  // Always verify the current persisted setup values here. Parent setup state may
  // still say "complete" after a candidate deletes their last LLM key.
  // A resume can be saved as an uploaded file, parsed resume JSON, or the
  // existing Whitebox resume template. Do not show Resume Setup if any source
  // confirms it; the setup-summary endpoint can lag behind the visible resume.
  const hasResume = Boolean(liveSetup.resume || setupStatus?.resume_uploaded || readiness?.resume_check?.has_resume);
  const hasLlmKey = liveSetup.llm ?? (setupStatus ? Boolean(setupStatus.api_keys_configured) : Boolean(readiness?.llm_check?.is_configured));
  const isReady = hasResume && hasLlmKey;

  useEffect(() => { void (async () => {
    const [check, list, keys, resume] = await Promise.allSettled([aiPrepApi.getReadiness(), aiPrepApi.listAssessments(), apiFetch("coderpad/me/llm-keys"), setupApi.getStatus(true)]);
    if (check.status === "fulfilled") setReadiness(check.value);
    if (list.status === "fulfilled") setAssessments(list.value.items || []);
    setLiveSetup({
      ...(keys.status === "fulfilled" ? { llm: Array.isArray(keys.value) && keys.value.some((key: any) => key.validation_status === "active") } : {}),
      ...(resume.status === "fulfilled" ? { resume: Boolean(resume.value?.resume_uploaded || resume.value?.has_binary_resume || resume.value?.resume_json) } : {}),
    });
    setLoading(false);
  })(); }, []);
  const completed = useMemo(() => assessments.filter(a => a.status === "COMPLETED"), [assessments]);
  const goToSetup = (tab: "my-llm-setup" | "my-resume") => router.push(`/user_dashboard/${tab}`);
  const startAssessment = () => {
    if (!isReady) return setShowSetupModal(true);
    setView("assessment");
  };
  const cardAction = (name: string) => { if (!isReady) return setShowSetupModal(true); if (name === "Start an assessment") void startAssessment(); else setView("assessments"); };
  const cards = [{ title: "Start an assessment", icon: Play }, { title: "View assessments", icon: ClipboardList }, { title: "Analytics", icon: BarChart3 }, { title: "Scores", icon: FileText }];

  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-7 sm:px-6"><div className="mx-auto max-w-6xl">
    {view !== "assessment" && <div><h1 className="text-2xl font-extrabold tracking-tight text-[#071d49]">Welcome back!</h1><p className="mt-1 text-sm text-slate-500">Your AI-powered interview preparation platform.</p></div>}
    {!loading && !isReady && <div className="mt-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700"><AlertIcon /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{!hasLlmKey ? "LLM setup is not configured or has expired" : "Resume is not uploaded"}</p><p className="text-xs">{!hasLlmKey ? "Please set up your LLM API keys to start an assessment." : "Upload your resume to tailor your interview preparation."}</p></div><button onClick={() => goToSetup(!hasLlmKey ? "my-llm-setup" : "my-resume")} className="whitespace-nowrap rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600">Complete setup →</button></div>}
    {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    {loading ? <div className="grid min-h-[330px] place-items-center"><LoaderCircle className="animate-spin text-indigo-600" /></div> : view === "assessment" ? <AssessmentCard assessmentId="new" onBack={() => setView("home")} /> : view === "home" ? <section className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><div><h2 className="text-xl font-extrabold text-[#071d49]">AI Prep</h2><p className="mt-1 text-sm text-slate-500">Choose what you want to do next.</p></div><Sparkles className="text-indigo-500" size={20} /></div><div className="mt-5 grid gap-4 md:grid-cols-2">{cards.map(({ title, icon: Icon }) => <button key={title} onClick={() => cardAction(title)} disabled={starting} className={`flex min-h-[86px] items-center gap-4 rounded-xl border p-4 text-left transition ${isReady ? "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50" : "border-slate-200 bg-slate-50 text-slate-400"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400">{isReady ? <Icon size={19} className="text-indigo-600" /> : <Lock size={17} />}</span><span className="min-w-0 flex-1"><b className="block text-[15px] text-slate-700">{starting && title === "Start an assessment" ? "Starting…" : title}</b><small className="mt-1 block truncate text-slate-400">{isReady ? (title === "Start an assessment" ? "Practice with an AI interview" : "Review your AI Prep results") : "Complete your LLM setup and upload your resume to access this."}</small></span>{!isReady && <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400"><Lock className="mr-1 inline" size={10} />Locked</span>}</button>)}</div></section> : <section className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><div><h2 className="text-xl font-extrabold text-[#071d49]">Your assessments</h2><p className="text-sm text-slate-500">Completed reports: {completed.length}</p></div><button onClick={() => setView("home")} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-600 hover:bg-indigo-100">← Back to Dashboard</button></div><div className="mt-4 overflow-hidden rounded-xl border border-slate-200">{assessments.length ? assessments.map(a => <button key={a.id} onClick={() => router.push(`/aiprep/reports/${a.id}`)} className="flex w-full justify-between border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"><span><b className="block text-sm text-slate-800">{(a.assessment_type || "Assessment").replaceAll("_", " ")}</b><small className="text-slate-500">{formatDate(a.started_at || a.created_at)}</small></span><span className="text-xs font-bold text-slate-500">{(a.status || "Unknown").replaceAll("_", " ")}</span></button>) : <p className="p-7 text-center text-sm text-slate-500">No assessments yet.</p>}</div></section>}
    {showSetupModal && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-600"><AlertCircle size={21} /></span><div><h2 className="font-bold text-slate-900">Complete your AI Prep setup</h2><p className="mt-1 text-sm text-slate-600">Finish the missing setup before using AI Prep.</p></div></div><button onClick={() => setShowSetupModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close"><X size={20} /></button></div><div className="mt-5 space-y-3">{!hasLlmKey && <button onClick={() => goToSetup("my-llm-setup")} className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50"><span className="flex items-center gap-3"><KeyRound className="text-indigo-600" size={19} /><span><b className="block text-sm text-slate-900">Go to LLM Setup</b><small className="text-slate-500">Required for interview feedback.</small></span></span><b className="text-indigo-600">→</b></button>}{!hasResume && <button onClick={() => goToSetup("my-resume")} className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50"><span className="flex items-center gap-3"><FileText className="text-indigo-600" size={19} /><span><b className="block text-sm text-slate-900">Go to Resume Setup</b><small className="text-slate-500">Used to tailor assessment questions.</small></span></span><b className="text-indigo-600">→</b></button>}</div><button onClick={() => setShowSetupModal(false)} className="mt-5 w-full rounded-lg bg-slate-100 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">Not now</button></div></div>}
  </div></main>;
}

function AlertIcon() { return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-600 text-lg font-bold text-white">!</span>; }
