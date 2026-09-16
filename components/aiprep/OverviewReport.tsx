"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  OverviewReport.tsx
//  Consolidated AI Prep Report component:
//  - Section A: OverviewContent (overview tab content & recording preview)
//  - Section B: ReportHeader (header metadata, back button, tab navigation)
//  - Section C: AiPrepReport (main shell: data fetching, state handling, tabs)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback, type RefObject } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  User,
  Cpu,
  Code2,
  AudioWaveform,
  Video,
  ShieldCheck,
  Lightbulb,
  FileText,
  ExternalLink,
} from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";
import {
  normalizeReport,
  type NormalizedReport,
  formatBand,
  bandColor,
} from "@/types/aiprep-report";
import type { AssessmentDetail } from "@/types/aiprep";
import {
  REPORT_TABS,
  tabFromParam,
  paramFromTab,
  type ReportTab,
} from "./report-tabs";
import VideoPlayer from "./VideoPlayer";

export type { ReportTab };

// ─── Lazy-loaded tab components (everything except Overview) ──────────────────
const PerformanceReport   = dynamic(() => import("./PerformanceReport"));
const TechnicalReport     = dynamic(() => import("./TechnicalReport"));
const CommunicationReport = dynamic(() => import("./CommunicationReport"));
const CoachingReport      = dynamic(() => import("./CoachingReport"));
const TranscriptReport    = dynamic(() => import("./TranscriptReport"));
const NextStepsReport     = dynamic(() => import("./NextStepsReport"));

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION A — OVERVIEW TAB CONTENT
// ═════════════════════════════════════════════════════════════════════════════

// ── Status Badge ──────────────────────────────────────────────────────────────
function Badge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${bandColor(
        status
      )}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {formatBand(status)}
    </span>
  );
}

// ── Highlight Card ────────────────────────────────────────────────────────────
function HighlightCard({
  icon,
  title,
  observation,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  observation?: string;
  status?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-violet-600">{icon}</div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      {observation ? (
        <p className="flex-1 text-xs leading-5 text-slate-600 line-clamp-3">
          {observation}
        </p>
      ) : (
        <p className="flex-1 text-xs text-slate-400 italic">
          Evaluation data unavailable.
        </p>
      )}
      <div className="mt-auto pt-1">
        {status ? (
          <Badge status={status} />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>
    </div>
  );
}

// ── Format seconds → MM:SS ────────────────────────────────────────────────────
function fmtTime(seconds?: number): string {
  if (seconds == null || isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// ── Overview Tab Component ────────────────────────────────────────────────────
export interface OverviewProps {
  report: NormalizedReport;
  videoRef: RefObject<HTMLVideoElement | null>;
  seekTo: (seconds: number) => void;
  assessmentId: string;
  onSelectTab: (tab: ReportTab) => void;
}

export function OverviewContent({
  report,
  videoRef,
  seekTo,
  assessmentId,
  onSelectTab,
}: OverviewProps) {
  const {
    youtube_url,
    overall_readiness,
    overall_summary,
    scores,
    intro_sections,
    audio,
    video,
    transcript,
    coaching_suggestions,
    priority_improvements,
    final_assessment,
  } = report;

  const introSection = intro_sections.find((s) =>
    ["career_story", "current_role", "current_project", "introduced_self", "career_arc_covered"].includes(s.key)
  );
  const introResumeBand = introSection?.status ?? scores.overall_band;
  const aiEngBand = scores.ai_engineering?.band;
  const aiEngObs =
    intro_sections.find((s) =>
      [
        "agentic_ai",
        "rag_and_retrieval",
        "models_and_ai_platforms",
        "rag_retrieval_chunking_mentioned",
        "ai_agents_multiagent_mentioned",
      ].includes(s.key)
    )?.observation ?? report.technical_analysis?.summary;
  const coreEngBand = scores.core_engineering?.band;
  const coreEngObs =
    intro_sections.find((s) =>
      [
        "software_engineering",
        "cloud_and_infrastructure",
        "cicd_and_delivery",
        "mcp_mentioned",
        "memory_context_engineering_mentioned",
      ].includes(s.key)
    )?.observation ?? report.technical_analysis?.depth_assessment;
  const audioObs =
    audio?.executive_summary ?? audio?.primary_vocal_strength ?? undefined;
  const audioBand = audio?.overall_readiness;
  const videoObs =
    video?.overall_summary ?? video?.primary_setup_strength ?? undefined;
  const videoBand = video
    ? video.factors.camera_framing_centering?.status ?? scores.non_technical?.band
    : undefined;
  const addlBand =
    scores.non_technical?.band ?? scores.business_acumen?.band;
  const addlObs =
    intro_sections.find((s) =>
      ["ai_engineering_evolution", "cicd_and_delivery", "guardrails_evals_observability_mentioned"].includes(s.key)
    )?.observation ?? report.non_technical?.communication_summary;

  const tip =
    final_assessment?.most_important_improvement ??
    priority_improvements[0]?.guidance ??
    coaching_suggestions.find((c) => c.priority === 1)?.suggestion ??
    coaching_suggestions[0]?.suggestion;
  const previewSegments = transcript.segments.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* ── Overall Assessment ───────────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">✦</span>
            <h2 className="text-base font-extrabold text-slate-900">
              Overall Assessment
            </h2>
          </div>
          <Badge status={overall_readiness ?? scores.overall_band} />
        </div>
        {overall_summary ? (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {overall_summary}
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-400 italic">
            {report.assessment.status === "EVALUATING"
              ? "Your assessment is currently being evaluated. Check back soon."
              : "Overall summary not yet available."}
          </p>
        )}
      </section>

      {/* ── Evaluation Highlights ────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Evaluation Highlights
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HighlightCard
            icon={<User size={16} />}
            title="Introduction & Resume"
            observation={introSection?.observation}
            status={introResumeBand}
          />
          <HighlightCard
            icon={<Cpu size={16} />}
            title="AI Engineering"
            observation={aiEngObs}
            status={aiEngBand}
          />
          <HighlightCard
            icon={<Code2 size={16} />}
            title="Software Engineering"
            observation={coreEngObs}
            status={coreEngBand}
          />
          <HighlightCard
            icon={<AudioWaveform size={16} />}
            title="Audio Analysis"
            observation={audioObs}
            status={audioBand}
          />
          <HighlightCard
            icon={<Video size={16} />}
            title="Video & On-Camera"
            observation={
              report.assessment.media_type === "AUDIO"
                ? "Audio-only assessment — no video evaluation."
                : videoObs
            }
            status={
              report.assessment.media_type === "AUDIO" ? undefined : videoBand
            }
          />
          <HighlightCard
            icon={<ShieldCheck size={16} />}
            title="Additional Factors"
            observation={addlObs}
            status={addlBand}
          />
        </div>
      </section>

      {/* ── Recording + Transcript preview ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recording Playback */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-slate-700">
            <Video size={15} className="text-violet-500" />
            <h2 className="text-sm font-bold">Recording Playback</h2>
          </div>
          <VideoPlayer youtubeUrl={youtube_url} videoRef={videoRef} />
        </section>

        {/* Transcript Preview */}
        <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText size={15} className="text-violet-500" />
              <h2 className="text-sm font-bold">Transcript Preview</h2>
            </div>
            <Link
              href={`/aiprep/reports/${assessmentId}?tab=transcript`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                  e.preventDefault();
                  onSelectTab("Transcript");
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
            >
              <ExternalLink size={12} />
              Open Full Transcript
            </Link>
          </div>

          {previewSegments.length > 0 ? (
            <div className="flex-1 space-y-3 overflow-hidden">
              {previewSegments.map((seg, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  {seg.timestamp_s != null ? (
                    <button
                      onClick={() => seekTo(seg.timestamp_s!)}
                      className="w-10 shrink-0 font-mono text-violet-600 hover:text-violet-800 hover:underline text-left transition-colors cursor-pointer"
                      title={`Seek to ${seg.timestamp}`}
                    >
                      {seg.timestamp ?? fmtTime(seg.timestamp_s)}
                    </button>
                  ) : (
                    <span className="w-10 shrink-0 font-mono text-slate-400">
                      {seg.timestamp ?? "—"}
                    </span>
                  )}
                  <div>
                    {seg.speaker && (
                      <p className="mb-0.5 font-bold text-slate-700">
                        {seg.speaker}
                      </p>
                    )}
                    <p className="leading-5 text-slate-600 line-clamp-2">
                      {seg.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : transcript.full_text ? (
            <p className="flex-1 text-xs leading-6 text-slate-600 line-clamp-6">
              {transcript.full_text}
            </p>
          ) : (
            <p className="flex-1 text-xs text-slate-400 italic">
              Transcript unavailable for this assessment.
            </p>
          )}
        </section>
      </div>

      {/* ── Tip ──────────────────────────────────────────────────────────── */}
      {tip && (
        <section className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Tip
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{tip}</p>
          </div>
        </section>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION B — REPORT HEADER (merged from ReportHeader.tsx)
// ═════════════════════════════════════════════════════════════════════════════

export interface ReportHeaderProps {
  assessment: AssessmentDetail;
  assessmentId: string;
  activeTab: ReportTab;
  onSelectTab: (tab: ReportTab) => void;
}

export function ReportHeader({
  assessment,
  assessmentId,
  activeTab,
  onSelectTab,
}: ReportHeaderProps) {
  const typeLabelMap: Record<string, string> = {
    INTRO: "Introduction Assessment",
    JD_INTRO: "Job-Specific Introduction",
    TECHNICAL: "Technical Assessment",
    SYSTEM_DESIGN: "System Design Assessment",
    HIRING_MANAGER: "Hiring Manager Assessment",
    RECRUITER: "Recruiter Assessment",
  };

  const typeLabel =
    (assessment.assessment_type && typeLabelMap[assessment.assessment_type]) ??
    assessment.assessment_type?.replaceAll("_", " ") ??
    "Assessment";


  return (
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
          <h1 className="text-xl font-extrabold text-slate-900 capitalize">
            {typeLabel}
          </h1>
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

        {/* Tab nav — each tab updates ?tab= query param */}
        <nav
          className="mt-4 flex gap-1 overflow-x-auto"
          aria-label="Report sections"
        >
          {REPORT_TABS.map((tab) => {
            const isActive = tab.label === activeTab;
            return (
              <button
                key={tab.label}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onSelectTab(tab.label)}
                className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
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
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION C — SHELL / CONTAINER (default export)
// ═════════════════════════════════════════════════════════════════════════════

export interface ShellProps {
  assessmentId: string;
  initialTab?: ReportTab;
}

export default function AiPrepReport({
  assessmentId,
  initialTab,
}: ShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<ReportTab>(() => {
    if (tabParam) return tabFromParam(tabParam);
    return initialTab ?? "Overview";
  });

  // Keep active tab in sync with URL searchParams and initialTab
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabFromParam(tabParam));
    } else {
      setActiveTab(initialTab ?? "Overview");
    }
  }, [tabParam, initialTab]);

  const [report, setReport] = useState<NormalizedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => undefined);
    }
  };

  // ── Fetch real report data ──────────────────────────────────────────────────
  const loadReport = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError("");
    setIsProcessing(false);
    setStatusMsg("");

    try {
      const assessment = await aiPrepApi.getAssessment(assessmentId);
      const statusUpper = (assessment.status || "").toUpperCase();

      if (
        ["EVALUATING", "IN_PROGRESS", "SUBMITTED", "PENDING"].includes(
          statusUpper
        ) &&
        !assessment.report
      ) {
        try {
          const reportRes = await aiPrepApi.getAssessmentReport(assessmentId);
          const dataRes = await aiPrepApi
            .getAssessmentData(assessmentId)
            .catch(() => null);
          setReport(normalizeReport(assessment, dataRes, reportRes));
        } catch {
          setIsProcessing(true);
          setStatusMsg("Your assessment report is still being prepared.");
        }
        setLoading(false);
        return;
      }

      const [dataRes, reportRes] = await Promise.allSettled([
        aiPrepApi.getAssessmentData(assessmentId),
        aiPrepApi.getAssessmentReport(assessmentId),
      ]);

      const dataVal = dataRes.status === "fulfilled" ? dataRes.value : null;
      const reportVal =
        reportRes.status === "fulfilled" ? reportRes.value : null;

      if (!reportVal && !assessment.report) {
        setError(
          statusUpper === "FAILED"
            ? "Assessment evaluation could not be completed."
            : "We couldn't load this assessment report."
        );
        setLoading(false);
        return;
      }

      setReport(normalizeReport(assessment, dataVal, reportVal));
    } catch (err: unknown) {
      console.error("[AiPrepReport] Failed to load:", err);
      setError("We couldn't load this assessment report.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // ── Tab change + URL query param sync ───────────────────────────────────────
  const handleTabChange = (tabLabel: ReportTab) => {
    setActiveTab(tabLabel);
    const param = paramFromTab(tabLabel);
    const targetUrl = `/aiprep/reports/${assessmentId}?tab=${param}`;
    router.push(targetUrl, { scroll: false });
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-[#f7f9fc] p-6">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-700 shadow-sm">
          <LoaderCircle className="animate-spin text-violet-600" size={22} />
          Loading your assessment report…
        </div>
      </main>
    );
  }

  // ── Evaluating state ────────────────────────────────────────────────────────
  if (isProcessing) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-[#f7f9fc] p-6">
        <section className="max-w-md w-full rounded-2xl border border-amber-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock size={26} />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            {statusMsg || "Your assessment report is still being prepared."}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Our AI is analyzing your spoken communication, technical depth, and
            presentation. This usually takes 1–2 minutes.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadReport}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 sm:w-auto cursor-pointer"
            >
              <RefreshCw size={15} /> Check Status
            </button>
            <Link
              href="/user_dashboard/ai-prep"
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              My Assessments
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error || !report) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-[#f7f9fc] p-6">
        <section className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle size={26} />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            {error || "We couldn't load this assessment report."}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Please make sure you are signed in and that the evaluation has
            completed.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadReport}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 sm:w-auto cursor-pointer"
            >
              <RefreshCw size={15} /> Try Again
            </button>
            <Link
              href="/user_dashboard/ai-prep"
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── Report loaded ───────────────────────────────────────────────────────────
  const { assessment } = report;

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <ReportHeader
        assessment={assessment}
        assessmentId={assessmentId}
        activeTab={activeTab}
        onSelectTab={handleTabChange}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {activeTab === "Overview" && (
          <OverviewContent
            report={report}
            videoRef={videoRef}
            seekTo={seekTo}
            assessmentId={assessmentId}
            onSelectTab={handleTabChange}
          />
        )}
        {activeTab === "Performance" && <PerformanceReport report={report} />}
        {activeTab === "Technical" && <TechnicalReport report={report} />}
        {activeTab === "Communication" && (
          <CommunicationReport report={report} />
        )}
        {activeTab === "Coaching" && <CoachingReport report={report} />}
        {activeTab === "Transcript" && (
          <TranscriptReport
            report={report}
            videoRef={videoRef}
            seekTo={seekTo}
          />
        )}
        {activeTab === "Next Steps" && <NextStepsReport report={report} />}
      </main>
    </div>
  );
}
