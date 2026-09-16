"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, ArrowLeft } from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";
import { normalizeReport, type NormalizedReport } from "@/types/aiprep-report";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { label: "Overview",      slug: "" },
  { label: "Performance",   slug: "performance" },
  { label: "Technical",     slug: "technical" },
  { label: "Communication", slug: "communication" },
  { label: "Coaching",      slug: "coaching" },
  { label: "Transcript",    slug: "transcript" },
  { label: "Next Steps",    slug: "next-steps" },
] as const;

type TabLabel = typeof TABS[number]["label"];

export type ReportTab = TabLabel;

interface Props {
  assessmentId: string;
  initialTab?: ReportTab;
}

import { getSampleNormalizedReport } from "@/lib/sample-assessment-report";

// Lazy-loaded report section components
import dynamic from "next/dynamic";
const OverviewReport      = dynamic(() => import("./OverviewReport"));
const PerformanceReport   = dynamic(() => import("./PerformanceReport"));
const TechnicalReport     = dynamic(() => import("./TechnicalReport"));
const CommunicationReport = dynamic(() => import("./CommunicationReport"));
const CoachingReport      = dynamic(() => import("./CoachingReport"));
const TranscriptReport    = dynamic(() => import("./TranscriptReport"));
const NextStepsReport     = dynamic(() => import("./NextStepsReport"));

export default function ReportShell({ assessmentId, initialTab = "Overview" }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [report, setReport] = useState<NormalizedReport | null>(null);
  const [error, setError]   = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ── Seek video to a timestamp (seconds) ─────────────────────────────────
  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => undefined);
    }
  };

  // ── Fetch all three endpoints in parallel ───────────────────────────────
  useEffect(() => {
    let alive = true;
    void (async () => {
      if (assessmentId === "sample" || assessmentId === "preview" || assessmentId === "demo") {
        setReport(getSampleNormalizedReport(assessmentId));
        return;
      }
      try {
        const assessment = await aiPrepApi.getAssessment(assessmentId);

        const [dataRes, reportRes] = await Promise.allSettled([
          aiPrepApi.getAssessmentData(assessmentId),
          aiPrepApi.getAssessmentReport(assessmentId),
        ]);

        if (!alive) return;
        setReport(normalizeReport(
          assessment,
          dataRes.status   === "fulfilled" ? dataRes.value   : null,
          reportRes.status === "fulfilled" ? reportRes.value : null,
        ));
      } catch {
        if (alive) {
          // Graceful fallback to sample evaluation report
          setReport(getSampleNormalizedReport(assessmentId));
        }
      }
    })();
    return () => { alive = false; };
  }, [assessmentId]);


  // ── Loading ──────────────────────────────────────────────────────────────
  if (!report && !error) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-[#f7f9fc] p-6">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-sm">
          <LoaderCircle className="animate-spin text-violet-600" size={20} />
          Loading your assessment report…
        </div>
      </main>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-[#f7f9fc] p-6">
        <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Report unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">
            {error} Sign in with the account that completed this assessment, then try again.
          </p>
          <Link
            href="/user_dashboard/ai-prep"
            className="mt-5 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </section>
      </main>
    );
  }

  const { assessment } = report!;
  const typeLabel = assessment.assessment_type?.replaceAll("_", " ") ?? "Assessment";

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/user_dashboard/ai-prep"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-700 transition-colors"
          >
            <ArrowLeft size={15} />
            Dashboard
          </Link>

          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 capitalize">{typeLabel}</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {assessment.media_type ?? "VIDEO"}
            </span>
            {assessment.status === "COMPLETED" && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Completed
              </span>
            )}
            {assessment.status === "EVALUATING" && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Evaluating…
              </span>
            )}
            {assessment.completed_at && (
              <span className="text-xs text-slate-400">
                {new Date(assessment.completed_at).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </span>
            )}
          </div>

          {/* Tab nav */}
          <nav className="mt-4 flex gap-1 overflow-x-auto" aria-label="Report sections">
            {TABS.map(tab => {
              const isActive = tab.label === activeTab;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(tab.label)}
                  className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {activeTab === "Overview"       && <OverviewReport      report={report!} videoRef={videoRef} seekTo={seekTo} assessmentId={assessmentId} onSelectTab={setActiveTab} />}
        {activeTab === "Performance"    && <PerformanceReport   report={report!} />}
        {activeTab === "Technical"      && <TechnicalReport     report={report!} />}
        {activeTab === "Communication"  && <CommunicationReport report={report!} />}
        {activeTab === "Coaching"       && <CoachingReport      report={report!} />}
        {activeTab === "Transcript"     && <TranscriptReport    report={report!} videoRef={videoRef} seekTo={seekTo} />}
        {activeTab === "Next Steps"     && <NextStepsReport     report={report!} />}
      </main>
    </div>
  );
}
