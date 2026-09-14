"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ClipboardCheck, LoaderCircle } from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";
import type { AssessmentDetail } from "@/types/aiprep";

export default function ReportDetailPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    aiPrepApi.getAssessment(assessmentId).then(setAssessment).catch(() => setError("We could not load this assessment report."));
  }, [assessmentId]);

  if (!assessment && !error) return <div className="min-h-[60vh] grid place-items-center"><LoaderCircle className="animate-spin text-indigo-600" /></div>;
  if (error) return <div className="mx-auto max-w-3xl p-8 text-center text-slate-600">{error}</div>;

  const reportEntries = Object.entries(assessment?.report || {});
  return <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/aiprep/reports/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><ArrowLeft size={16} />Back to assessments</Link>
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex gap-3"><ClipboardCheck className="mt-1 text-indigo-600" /><div><h1 className="text-2xl font-bold text-slate-900">{assessment?.assessment_type || "Assessment"}</h1><p className="mt-1 text-sm text-slate-500">Status: {(assessment?.status || "Unknown").replaceAll("_", " ")}</p></div></div></div>
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Report overview</h2>{reportEntries.length ? <dl className="mt-4 grid gap-4 sm:grid-cols-2">{reportEntries.map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{key.replaceAll("_", " ")}</dt><dd className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</dd></div>)}</dl> : <p className="mt-3 text-sm text-slate-500">Your report will appear here when assessment processing is complete.</p>}</div>
  </div></section>;
}
