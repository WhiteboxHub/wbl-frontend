"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Clock3, FileText, Loader2, Play, RefreshCw } from "lucide-react";
import { aiPrepApi, isCompletedAssessment, loadCompletedAssessment } from "@/lib/aiprep-api";
import type { AiPrepAssessmentListItem, AiPrepCompletedAssessmentView } from "@/types/aiprep";

interface AIPrepDashboardProps {
  candidateId: number | null;
  onStartAssessment: () => void;
  onViewReport: (assessmentId: number) => void;
  onViewHistoryAnalytics: () => void;
}

function formatType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function AIPrepDashboard({ candidateId, onStartAssessment, onViewReport, onViewHistoryAnalytics }: AIPrepDashboardProps) {
  const [assessments, setAssessments] = useState<AiPrepAssessmentListItem[]>([]);
  const [latestCompleted, setLatestCompleted] = useState<AiPrepCompletedAssessmentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!candidateId) {
      setError("Unable to resolve your candidate profile for AI Prep.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await aiPrepApi.listAssessments(candidateId);
      setAssessments(response.items);
      const completed = response.items
        .filter((item) => isCompletedAssessment(item.status))
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];
      setLatestCompleted(completed ? await loadCompletedAssessment(completed.id) : null);
    } catch {
      setError("Unable to load your AI Prep assessment data.");
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeAssessment = useMemo(
    () => assessments.filter((item) => !isCompletedAssessment(item.status))
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0],
    [assessments]
  );

  if (loading) {
    return <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <section className="rounded-2xl border border-red-200 bg-red-50 p-5"><p className="font-semibold text-red-900">{error}</p><button type="button" onClick={() => void load()} className="mt-3 text-sm font-semibold text-red-700">Try again</button></section>;
  }

  if (!latestCompleted && activeAssessment) {
    return <ActiveAssessment assessment={activeAssessment} onOpen={onStartAssessment} onRefresh={load} />;
  }

  if (!latestCompleted) return <NewCandidate onStart={onStartAssessment} />;

  return <CompletedCandidate assessment={latestCompleted} completedCount={assessments.filter((item) => isCompletedAssessment(item.status)).length} onStart={onStartAssessment} onViewReport={onViewReport} onViewHistoryAnalytics={onViewHistoryAnalytics} />;
}

function NewCandidate({ onStart }: { onStart: () => void }) {
  return (
    <section className="flex min-h-[455px] flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Get started</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Welcome to your AI Interview Prep</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Your first practice assessment evaluates your technical answers, communication, and coaching areas.
        </p>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6 dark:border-gray-800">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">What happens when you start</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Step number="Step 1" title="Setup & hardware check" detail="Confirm microphone and camera access." />
          <Step number="Step 2" title="Interview simulation" detail="Answer assessment questions at your own pace." />
          <Step number="Step 3" title="Detailed report" detail="Review results after processing is complete." />
        </div>
      </div>

      <div className="mt-auto flex justify-center pt-7">
        <button type="button" onClick={onStart} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
          <Play className="h-4 w-4 fill-current" /> Start Assessment
        </button>
      </div>
    </section>
  );
}

function ActiveAssessment({ assessment, onOpen, onRefresh }: { assessment: AiPrepAssessmentListItem; onOpen: () => void; onRefresh: () => Promise<void> }) {
  const processing = assessment.status === "PROCESSING";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Assessment status</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{formatType(assessment.assessment_type)}</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><Metric label="Current status" value={assessment.status.replace(/_/g, " ")} /><Metric label="Started" value={formatDate(assessment.created_at)} /></div>
      <div className="mt-6 flex gap-3"><button type="button" onClick={onOpen} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"><Play className="h-4 w-4 fill-current" />{processing ? "View processing" : "Continue assessment"}</button><button type="button" onClick={() => void onRefresh()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
    </section>
  );
}

function CompletedCandidate({ assessment, completedCount, onStart, onViewReport, onViewHistoryAnalytics }: { assessment: AiPrepCompletedAssessmentView; completedCount: number; onStart: () => void; onViewReport: (assessmentId: number) => void; onViewHistoryAnalytics: () => void }) {
  const report = assessment.report;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Latest completed assessment</p><h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{formatType(assessment.assessment.assessment_type)}</h1><p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500"><Calendar className="h-4 w-4" /> Completed {formatDate(assessment.assessment.completed_at)}</p></div><button type="button" onClick={() => onViewReport(assessment.assessment.id)} className="inline-flex h-fit items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"><FileText className="h-4 w-4" /> View Report</button></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Overall score" value={report ? `${report.overall_score}/100` : "Not available"} /><Metric label="Coaching band" value={report?.coaching_band ?? "Not available"} /><Metric label="Completed assessments" value={String(completedCount)} /></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2"><Insight title="Strengths" values={assessment.strengths.slice(0, 2)} /><Insight title="Areas to improve" values={assessment.improvementAreas.slice(0, 2)} /></div>
      <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={onViewHistoryAnalytics} className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700"><Clock3 className="h-4 w-4" /> View history & analytics</button><button type="button" onClick={onStart} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"><Play className="h-4 w-4 fill-current" /> Start another assessment</button></div>
    </section>
  );
}

function Step({ number, title, detail }: { number: string; title: string; detail: string }) { return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-gray-800 dark:bg-gray-800/40"><p className="text-xs font-bold text-indigo-600">{number}</p><h2 className="mt-2 text-sm font-bold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-gray-800 dark:bg-gray-800/40"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-lg font-bold text-slate-950 dark:text-white">{value}</p></div>; }
function Insight({ title, values }: { title: string; values: string[] }) { return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-gray-800 dark:bg-gray-800/40"><h2 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h2>{values.length ? <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">{values.map((value, index) => <li key={`${title}-${index}`} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />{value}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Not available for this assessment.</p>}</div>; }
