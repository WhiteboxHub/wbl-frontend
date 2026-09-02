"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, BarChart3, Brain, FileText, MessageSquare, RefreshCw, Target } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { aiPrepApi } from "@/lib/aiprep-api";
import type { AiPrepAssessment, AiPrepReport, AudioTelemetry, Transcript, VisionTelemetry } from "@/types/aiprep";
import { CoachingSuggestions } from "./CoachingSuggestions";
import { CommunicationAnalytics } from "./CommunicationAnalytics";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { TechnicalRadar } from "./TechnicalRadar";
import { TranscriptViewer } from "./TranscriptViewer";

type ReportSection = "overview" | "skills" | "communication" | "coaching" | "evidence";
interface ReportData { assessment: AiPrepAssessment; report: AiPrepReport; transcript: Transcript | null; audio: AudioTelemetry | null; vision: VisionTelemetry | null; }
interface CurrentCandidate { candidate_id: number | null; }

const formatType = (value: string) => value.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ");
const formatDate = (value: string | null) => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Not available";

export function ReportOverview({ assessmentId, embedded = false }: { assessmentId: number; embedded?: boolean }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<ReportSection>("overview");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [currentCandidate, assessment] = await Promise.all([
        apiFetch("user_dashboard", { cache: "no-store" }) as Promise<CurrentCandidate>,
        aiPrepApi.getAssessment(assessmentId),
      ]);
      if (!currentCandidate.candidate_id || currentCandidate.candidate_id !== assessment.candidate_id) throw new Error("You do not have access to this assessment report.");
      if (assessment.status !== "COMPLETED") throw new Error("This report is available after processing is completed.");
      const report = await aiPrepApi.getReport(assessmentId);
      const [transcript, audio, vision] = await Promise.all([
        aiPrepApi.getTranscript(assessmentId).catch(() => null),
        aiPrepApi.getAudioTelemetry(assessmentId).catch(() => null),
        aiPrepApi.getVisionTelemetry(assessmentId).catch(() => null),
      ]);
      setData({ assessment, report, transcript, audio, vision });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load this AI Prep report.");
    } finally { setLoading(false); }
  }, [assessmentId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <State message="Preparing your assessment report..." />;
  if (error || !data) return <State message={error ?? "Report is not available."} retry={load} />;

  const technical = data.report.technical_analysis_json;
  const strengths = Array.isArray(technical.strengths) ? technical.strengths.slice(0, 2) : [];
  const improvements = Array.isArray(technical.areas_for_improvement) ? technical.areas_for_improvement.slice(0, 2) : [];
  const sections: Array<{ id: ReportSection; label: string; icon: typeof BarChart3 }> = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "skills", label: "Skills", icon: Brain },
    { id: "communication", label: "Communication", icon: MessageSquare },
    { id: "coaching", label: "Coaching plan", icon: Target },
    { id: "evidence", label: "Evidence", icon: FileText },
  ];

  return (
    <div className={`mx-auto max-w-6xl space-y-5 px-1 sm:px-2 ${embedded ? "py-2" : "py-28"}`}>
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">AI Prep report</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-2xl font-bold text-slate-950 dark:text-white">{formatType(data.assessment.assessment_type)}</h1><p className="mt-1 text-sm text-slate-500">Completed {formatDate(data.assessment.completed_at)}</p></div>
          <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Completed</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Overall score" value={`${data.report.overall_score}/100`} emphasize /><Metric label="Coaching band" value={data.report.coaching_band.replace(/_/g, " ")} /><Metric label="Assessment type" value={formatType(data.assessment.assessment_type)} /></div>
      </header>

      <nav aria-label="Report sections" className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setSection(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${section === id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-gray-800"}`}><Icon className="h-4 w-4" />{label}</button>)}
      </nav>

      {section === "overview" && <>
        <section className="grid gap-4 lg:grid-cols-2"><Insight title="What you did well" values={strengths} empty="Strengths are not available for this assessment." positive /><Insight title="Focus next" values={improvements} empty="Improvement areas are not available for this assessment." /></section>
        <ScoreBreakdown scores={data.report.scores_breakdown_json} />
      </>}
      {section === "skills" && <div className="space-y-5"><TechnicalRadar scores={data.report.scores_breakdown_json} /><TechnicalAnalysis report={data.report} /></div>}
      {section === "communication" && <CommunicationAnalytics analysis={data.report.non_technical_analysis_json} audio={data.audio} vision={data.vision} />}
      {section === "coaching" && <CoachingSuggestions suggestions={data.report.coaching_suggestions_json} />}
      {section === "evidence" && <TranscriptViewer transcript={data.transcript} evidence={data.report.transcript_evidence_json} />}
    </div>
  );
}

function TechnicalAnalysis({ report }: { report: AiPrepReport }) {
  const analysis = report.technical_analysis_json;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h2 className="text-lg font-bold text-slate-950 dark:text-white">Technical feedback</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{analysis.summary ?? "Not available for this assessment."}</p>{analysis.depth_assessment && <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600 dark:border-gray-800 dark:text-slate-300">{analysis.depth_assessment}</p>}</section>;
}

function Metric({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) { return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-gray-800 dark:bg-gray-800/40"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-2 font-bold text-slate-950 dark:text-white ${emphasize ? "text-2xl" : "text-lg"}`}>{value}</p></div>; }
function Insight({ title, values, empty, positive = false }: { title: string; values: string[]; empty: string; positive?: boolean }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><h2 className="text-base font-bold text-slate-950 dark:text-white">{title}</h2>{values.length ? <ul className="mt-3 space-y-2">{values.map((value, index) => <li key={`${title}-${index}`} className="flex gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${positive ? "bg-emerald-500" : "bg-amber-500"}`} />{value}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">{empty}</p>}</section>; }
function State({ message, retry }: { message: string; retry?: () => Promise<void> }) { return <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-slate-300"><AlertCircle className="inline h-5 w-5 text-indigo-600" /> <span className="ml-2">{message}</span>{retry && <button type="button" onClick={() => void retry()} className="mt-4 flex items-center gap-2 font-semibold text-indigo-600"><RefreshCw className="h-4 w-4" /> Retry</button>}</div>; }
