"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  OverviewReport.tsx
//  AI Prep Assessment Report – Dedicated Report UI (No Left Sidebar)
//  - Section A: Qualitative Badge & Highlight Card Components
//  - Section B: EvaluationContent (Overall Assessment, Highlights Grid, Video & Transcript, Tip)
//  - Section C: DetailsContent (Expandable evaluation sections with real data)
//  - Section D: ReportHeader (Back link, Title, Metadata row with dividers, Download Report, Tabs)
//  - Section E: AiPrepReport (Shell: data fetching, state handling, natural scroll)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback, type RefObject } from "react";
import Link from "next/link";
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
  Download,
  X,
  Copy,
  Check,
} from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";
import {
  normalizeReport,
  type NormalizedReport,
  formatBand,
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

// ═════════════════════════════════════════════════════════════════════════════
//  HELPERS & QUALITATIVE BADGE (NO NUMERIC SCORES)
// ═════════════════════════════════════════════════════════════════════════════

function QualitativeBadge({ status }: { status?: string }) {
  if (!status) return null;
  const raw = status.toUpperCase().trim();
  const formatted = formatBand(status);

  const isGood =
    [
      "EXCELLENT",
      "STRONG",
      "STRONG PERFORMANCE",
      "GOOD",
      "COVERED",
      "POSITIVE",
    ].includes(raw) ||
    formatted === "Good" ||
    raw.includes("GOOD") ||
    raw.includes("STRONG");

  const isAvg =
    !isGood &&
    ([
      "ADEQUATE",
      "AVERAGE",
      "DEVELOPING",
      "PARTIAL",
      "MODERATE",
    ].includes(raw) ||
      formatted === "Average" ||
      raw.includes("AVG") ||
      raw.includes("AVERAGE") ||
      raw.includes("DEVELOPING"));

  const isSpecialNA = raw === "NOT_APPLICABLE" || raw === "N/A";
  const isSpecialNoData = raw === "INSUFFICIENT_DATA";

  // Strictly 3 standardized rating labels:
  const displayLabel = isGood
    ? "Good"
    : isAvg
    ? "Average"
    : isSpecialNA
    ? "N/A"
    : isSpecialNoData
    ? "Insufficient Data"
    : "Needs Improvement";

  // Strictly 3 standardized rating colors:
  // 1. Good -> Green
  // 2. Average -> Amber
  // 3. Needs Improvement (bad) -> Red
  const colorClasses = isGood
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isAvg
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : isSpecialNA || isSpecialNoData
    ? "bg-slate-50 text-slate-600 border-slate-200"
    : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${colorClasses}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {displayLabel}
    </span>
  );
}

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
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          {icon}
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">{title}</h3>
        </div>
        {observation ? (
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {observation}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No specific observation recorded.
          </p>
        )}
      </div>
      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Rating
        </span>
        {status ? (
          <QualitativeBadge status={status} />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>
    </div>
  );
}

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

function getTranscriptDuration(report: NormalizedReport): string {
  const assessment = report.assessment;
  let totalSec: number | null = null;

  // 1. Audio telemetry speaking duration
  const dataRec = assessment.data as any;
  if (dataRec?.audio_telemetry?.speaking_duration_seconds != null) {
    const sec = Number(dataRec.audio_telemetry.speaking_duration_seconds);
    if (!isNaN(sec) && sec > 0) {
      totalSec = Math.round(sec);
    }
  }

  // 2. Timestamps from segments (last segment timestamp_s)
  if (!totalSec && report.transcript?.segments && report.transcript.segments.length > 0) {
    const segs = report.transcript.segments;
    const lastSeg = segs[segs.length - 1];
    if (lastSeg.timestamp_s != null && lastSeg.timestamp_s > 0) {
      totalSec = Math.round(lastSeg.timestamp_s);
    }
  }

  // 3. Started_at and completed_at difference
  if (!totalSec && assessment.started_at && assessment.completed_at) {
    const start = new Date(assessment.started_at).getTime();
    const end = new Date(assessment.completed_at).getTime();
    if (!isNaN(start) && !isNaN(end) && end > start) {
      const diffSec = Math.round((end - start) / 1000);
      if (diffSec > 0) {
        totalSec = diffSec;
      }
    }
  }

  // 4. Fallback based on word count (conversational ~130 wpm)
  if (!totalSec && report.transcript?.full_text) {
    const words = report.transcript.full_text.trim().split(/\s+/).filter(Boolean).length;
    if (words > 0) {
      totalSec = Math.max(10, Math.round((words / 130) * 60));
    }
  }

  if (!totalSec || totalSec <= 0) return "";

  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins > 0 && secs > 0) return `${mins} min ${secs} sec`;
  if (mins > 0) return `${mins} min`;
  return `${secs} sec`;
}

/**
 * Transforms raw numeric speech metrics (e.g., WPM scores or percentages)
 * into qualitative ratings (Good, Average, Needs Improvement).
 */
function sanitizeQualitativeText(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/was recorded at \d+\s*WPM,?\s*(?:which is)?\s*significantly below the preferred range/gi, "was slower than optimal (Needs Improvement)")
    .replace(/was recorded at \d+\s*WPM,?\s*(?:which is)?\s*below the preferred range/gi, "was below average speed (Average / Needs Improvement)")
    .replace(/was (?:recorded at \d+\s*WPM|Conversational Pace \(Good\)),?\s*(?:which is)?\s*(?:well )?within the (?:preferred|strong) range/gi, "was steady and natural (Good), within the recommended range")
    .replace(/was recorded at \d+\s*WPM,?\s*(?:which is)?\s*(?:well )?within the preferred range/gi, "was steady and natural (Good)")
    .replace(/was recorded at \d+\s*WPM,?\s*(?:which is)?\s*above the preferred range/gi, "was faster than standard (Average / Needs Polish)")
    .replace(/was recorded at \d+\s*WPM,?\s*(?:which is)?\s*significantly above the preferred range/gi, "was rapid (Needs Improvement)")
    .replace(/recorded at \d+\s*WPM,?\s*(?:which is)?\s*significantly below the preferred range/gi, "was below optimal speed (Needs Improvement)")
    .replace(/recorded at \d+\s*WPM,?\s*(?:which is)?\s*within the (?:preferred|strong) range/gi, "was steady and natural (Good)")
    .replace(/(?:was )?recorded at \d+\s*WPM/gi, "was at a comfortable speaking speed")
    .replace(/\bConversational Pace\s*\(Good\)\b/gi, "steady and natural (Good)")
    .replace(/\b(?:speaking|speech)\s*pace\b/gi, "speaking speed")
    .replace(/\b(\d+)\s*WPM\b/gi, (_, val) => {
      const n = parseInt(val, 10);
      if (n < 110) return "Slower Speed (Needs Improvement)";
      if (n <= 125) return "Deliberate Speed (Average)";
      if (n <= 165) return "Steady Speed (Good)";
      if (n <= 185) return "Brisk Speed (Average)";
      return "Rapid Speed (Needs Improvement)";
    })
    .replace(/There were no pauses detected, and the silence ratio was \d+%/gi, "Continuous speech with minimal natural pauses detected (Needs Improvement)")
    .replace(/and the silence ratio was \d+%/gi, "with minimal pause duration (Average)")
    .replace(/the silence ratio was \d+%/gi, "pause ratio was minimal")
    .replace(/silence ratio was \d+%/gi, "pause ratio was minimal")
    .replace(/The average volume was [+-]?\d+(?:\.\d+)?\s*dBFS,?\s*(?:which is)?\s*within the (?:strong|preferred|good) range\.?/gi, "Volume was clear and well-projected (Good).")
    .replace(/The average volume was [+-]?\d+(?:\.\d+)?\s*dBFS,?\s*(?:which is)?\s*below the (?:preferred|optimal) range\.?/gi, "Volume was low and could be projected more clearly (Needs Improvement).")
    .replace(/The average volume was [+-]?\d+(?:\.\d+)?\s*dBFS\.?/gi, "Volume was at an audible level (Good).")
    .replace(/[+-]?\d+(?:\.\d+)?\s*dBFS/gi, "optimal volume")
    .replace(/\b0%\b/g, "minimal")
    .replace(/\b\d+%\b/g, "moderate");
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION B — EVALUATION TAB CONTENT
// ═════════════════════════════════════════════════════════════════════════════

export interface OverviewProps {
  report: NormalizedReport;
  videoRef: RefObject<HTMLVideoElement | null>;
  seekTo: (seconds: number) => void;
  assessmentId: string;
  onSelectTab: (tab: ReportTab, subTab?: string) => void;
}

export function EvaluationContent({
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
    [
      "career_story",
      "current_role",
      "current_project",
      "introduced_self",
      "career_arc_covered",
    ].includes(s.key)
  );
  const introResumeBand =
    introSection?.status ??
    scores.overall_band ??
    report.overall_readiness ??
    "AVERAGE";
  const introResumeObs =
    introSection?.observation ??
    final_assessment?.career_story ??
    final_assessment?.current_project_clarity ??
    report.overall_summary;

  const aiEngSection = intro_sections.find((s) =>
    [
      "agentic_ai",
      "rag_and_retrieval",
      "models_and_ai_platforms",
      "rag_retrieval_chunking_mentioned",
      "ai_agents_multiagent_mentioned",
    ].includes(s.key)
  );
  const aiEngBand =
    scores.ai_engineering?.band ??
    aiEngSection?.status ??
    report.intro_quality?.technical_depth ??
    "AVERAGE";
  const aiEngObs =
    aiEngSection?.observation ??
    final_assessment?.ai_engineering_depth ??
    report.technical_analysis?.summary;

  const coreEngSection = intro_sections.find((s) =>
    [
      "software_engineering",
      "cloud_and_infrastructure",
      "cicd_and_delivery",
      "mcp_mentioned",
      "memory_context_engineering_mentioned",
    ].includes(s.key)
  );
  const coreEngBand =
    scores.core_engineering?.band ??
    coreEngSection?.status ??
    "AVERAGE";
  const coreEngObs =
    coreEngSection?.observation ??
    final_assessment?.production_engineering_depth ??
    report.technical_analysis?.depth_assessment;

  const rawAudioStrength =
    audio?.primary_vocal_strength?.toLowerCase() === "pace"
      ? "Speaking Speed"
      : audio?.primary_vocal_strength;
  const audioObs = sanitizeQualitativeText(
    audio?.executive_summary ??
      rawAudioStrength ??
      audio?.factors?.fluency?.observation ??
      undefined
  );
  const audioBand =
    audio?.overall_readiness ??
    scores.non_technical?.band ??
    "AVERAGE";

  const videoObs = sanitizeQualitativeText(
    video?.overall_summary ??
      video?.primary_setup_strength ??
      video?.factors?.camera_framing_centering?.observation ??
      "Eye contact, framing, and visual presentation evaluated."
  );
  const videoBand =
    video?.factors?.camera_framing_centering?.status ??
    scores.non_technical?.band ??
    "AVERAGE";

  const addlSection = intro_sections.find((s) =>
    [
      "ai_engineering_evolution",
      "cicd_and_delivery",
      "guardrails_evals_observability_mentioned",
    ].includes(s.key)
  );
  const addlBand =
    scores.non_technical?.band ??
    scores.business_acumen?.band ??
    addlSection?.status ??
    "AVERAGE";
  const addlObs =
    addlSection?.observation ??
    final_assessment?.transition_quality ??
    report.priority_improvements?.[0]?.guidance ??
    report.non_technical?.communication_summary ??
    (report.strongest_points && report.strongest_points[0]);

  const rawTip =
    final_assessment?.most_important_improvement ??
    priority_improvements[0]?.guidance ??
    coaching_suggestions.find((c) => c.priority === 1)?.suggestion ??
    coaching_suggestions[0]?.suggestion;


  const previewSegments = transcript.segments.slice(0, 5);
  const rawMediaType = (report.assessment.media_type || "").toUpperCase();
  const isAudioOnly =
    rawMediaType === "AUDIO" ||
    rawMediaType === "AUDIO_ONLY";

  const hasRecording = Boolean(
    youtube_url &&
    youtube_url.trim().length > 0 &&
    youtube_url.trim().toLowerCase() !== "null" &&
    youtube_url.trim().toLowerCase() !== "undefined"
  );

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* ── 1. Overall Assessment (Wide Horizontal Card) ────────────────── */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-sm">✦</span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              Overall Assessment
            </h2>
          </div>
          <QualitativeBadge
            status={overall_readiness ?? scores.overall_band}
          />
        </div>
        {overall_summary ? (
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-700">
            {overall_summary}
          </p>
        ) : (
          <p className="mt-2 text-xs sm:text-sm text-slate-400 italic">
            {report.assessment.status === "EVALUATING"
              ? "Your assessment is currently being evaluated. Summary will appear shortly."
              : "No overall assessment summary recorded for this session."}
          </p>
        )}
      </section>

      {/* ── 2. Evaluation Highlights (Dynamic Grid) ─────────────────────── */}
      <section>
        <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          Evaluation Highlights
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <HighlightCard
            icon={<User size={18} />}
            title="Introduction & Resume"
            observation={introResumeObs}
            status={introResumeBand}
          />
          <HighlightCard
            icon={<Cpu size={18} />}
            title="AI Engineering"
            observation={aiEngObs}
            status={aiEngBand}
          />
          <HighlightCard
            icon={<Code2 size={18} />}
            title="Software Engineering"
            observation={coreEngObs}
            status={coreEngBand}
          />
          <HighlightCard
            icon={<AudioWaveform size={18} />}
            title="Audio Analysis"
            observation={audioObs}
            status={audioBand}
          />
          {!isAudioOnly && (
            <HighlightCard
              icon={<Video size={18} />}
              title="Video & On-Camera"
              observation={videoObs}
              status={videoBand}
            />
          )}
          <HighlightCard
            icon={<ShieldCheck size={18} />}
            title="Additional Factors"
            observation={addlObs}
            status={addlBand}
          />
        </div>
      </section>

      {/* ── 3. Recording Playback & Transcript Preview ── */}
      {!isAudioOnly || hasRecording ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* LEFT: Recording Playback */}
          <section className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center gap-2 text-slate-800">
              {isAudioOnly ? (
                <AudioWaveform size={16} className="text-blue-600" />
              ) : (
                <Video size={16} className="text-blue-600" />
              )}
              <h2 className="text-sm font-bold">
                {isAudioOnly ? "Audio Recording Playback" : "Recording Playback"}
              </h2>
            </div>
            <div className="flex-1 min-h-[260px] flex flex-col justify-center">
              <VideoPlayer youtubeUrl={youtube_url} videoRef={videoRef} />
            </div>
          </section>

          {/* RIGHT: Transcript Preview */}
          <section className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-slate-800">
                <FileText size={16} className="text-blue-600" />
                <h2 className="text-sm font-bold">Transcript Preview</h2>
                {getTranscriptDuration(report) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <Clock size={11} className="text-blue-600" />
                    {getTranscriptDuration(report)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("Details", "transcript")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                <ExternalLink size={12} />
                Open Full Transcript
              </button>
            </div>

            {previewSegments.length > 0 ? (
              <div className="flex-1 space-y-2.5 overflow-hidden">
                {previewSegments.map((seg, i) => {
                  const cleanText = seg.text.replace(/<\/?s>/gi, "").trim();
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      {seg.timestamp_s != null ? (
                        <button
                          type="button"
                          onClick={() => seekTo(seg.timestamp_s!)}
                          className="w-11 shrink-0 font-mono text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors cursor-pointer"
                          title={`Seek recording to ${seg.timestamp}`}
                        >
                          {seg.timestamp ?? fmtTime(seg.timestamp_s)}
                        </button>
                      ) : (
                        <span className="w-11 shrink-0 font-mono text-slate-400">
                          {seg.timestamp ?? "—"}
                        </span>
                      )}
                      <span className="shrink-0 font-semibold text-slate-700">
                        {seg.speaker || "Candidate"}:
                      </span>
                      <p className="flex-1 leading-relaxed text-slate-600">
                        {cleanText}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : transcript.full_text ? (
              <div className="flex-1 max-h-52 overflow-y-auto pr-1 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap select-text">
                {transcript.full_text.replace(/<\/?s>/gi, "").trim()}
              </div>
            ) : (
              <p className="flex-1 text-xs text-slate-400 italic">
                Transcript not available for this session.
              </p>
            )}
          </section>
        </div>
      ) : (
        /* Full-width clean transcript preview when no recording is stored in DB */
        <section className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-slate-800">
              <FileText size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Transcript Preview</h2>
              {getTranscriptDuration(report) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Clock size={12} className="text-blue-600" />
                  {getTranscriptDuration(report)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("Details", "transcript")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              <ExternalLink size={13} />
              Open Full Transcript
            </button>
          </div>

          {previewSegments.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {previewSegments.map((seg, i) => {
                const cleanText = seg.text.replace(/<\/?s>/gi, "").trim();
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="shrink-0 font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/70 text-[10px]">
                      {seg.timestamp ?? fmtTime(seg.timestamp_s) ?? "—"}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-800 text-xs">
                      {seg.speaker || "Candidate"}:
                    </span>
                    <p className="flex-1 leading-snug text-slate-600 text-xs">
                      {cleanText}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : transcript.full_text ? (
            <div className="max-h-32 overflow-y-auto pr-1 text-xs leading-snug text-slate-600 whitespace-pre-wrap select-text">
              {transcript.full_text.replace(/<\/?s>/gi, "").trim()}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Transcript not available for this session.
            </p>
          )}
        </section>
      )}

      {/* ── 4. Tip Banner (Full Width, styled matching the reference image) ── */}
      <section className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-[#f0fdf4] p-4 shadow-2xs">
        <Lightbulb size={22} className="mt-0.5 shrink-0 text-emerald-600" />
        <div className="space-y-0.5 flex-1">
          <h3 className="text-sm font-bold text-slate-900">
            Tip
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            {rawTip || "Go to the Details tab to see the complete evaluation across all AI Engineering criteria, audio and video analytics (if applicable), and improvement suggestions."}
          </p>
        </div>
      </section>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION C — DETAILS TAB CONTENT (Expandable Real Evaluation Sections)
// ═════════════════════════════════════════════════════════════════════════════

interface DetailSectionData {
  id: string;
  tabLabel?: string;
  icon: React.ReactNode;
  iconContainerClass: string;
  title: string;
  status?: string;
  rightElement?: React.ReactNode;
  description?: string;
  observations?: string[];
  customContent?: React.ReactNode;
}

export function DetailsContent({
  report,
  seekTo,
  initialSubTab = "intro",
}: {
  report: NormalizedReport;
  seekTo: (seconds: number) => void;
  initialSubTab?: string;
}) {
  const {
    intro_sections = [],
    intro_quality,
    technical_analysis,
    scores,
    audio,
    video,
    transcript,
    coaching_suggestions = [],
    priority_improvements = [],
    critical_gaps = [],
    final_assessment,
    strongest_points = [],
  } = report;

  const rawMedia = (report.assessment.media_type || "").toUpperCase();
  const isAudioOnly =
    rawMedia === "AUDIO" ||
    rawMedia === "AUDIO_ONLY";

  const [transcriptFilter, setTranscriptFilter] = useState("");
  const [showFullTranscriptModal, setShowFullTranscriptModal] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Reconstruct clean continuous paragraph without fragmented speaker / timestamp artifacts
  const fullParagraphText = (() => {
    let raw = transcript.full_text?.trim() || "";
    if (!raw && transcript.segments && transcript.segments.length > 0) {
      raw = transcript.segments.map((s) => s.text).join(" ");
    }
    return raw
      .replace(/<\/?s>/gi, "")
      .replace(/(?:^|\n|\r)\s*(?:Candidate|Speaker\s*\d*|\w+):\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  })();

  const handleCopyTranscript = () => {
    if (fullParagraphText) {
      navigator.clipboard.writeText(fullParagraphText);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  // Helper to extract real observation from intro sections by key
  const getSecObs = (key: string): string | undefined => {
    const s = intro_sections.find((item) => item.key === key);
    return s?.observation?.trim() || undefined;
  };

  const sections: DetailSectionData[] = [];

  // 1. Introduction Evaluation (AI Engineering Focus)
  const introObs: string[] = [];
  const careerStoryObs = getSecObs("career_story");
  if (careerStoryObs) introObs.push(careerStoryObs);

  const currentRoleObs = getSecObs("current_role");
  if (currentRoleObs) introObs.push(currentRoleObs);

  const currentProjObs = getSecObs("current_project");
  if (currentProjObs) introObs.push(currentProjObs);

  const evolutionObs = getSecObs("ai_engineering_evolution");
  if (evolutionObs) introObs.push(evolutionObs);

  if (final_assessment?.current_project_clarity?.trim()) {
    introObs.push(final_assessment.current_project_clarity.trim());
  }

  if (final_assessment?.most_important_improvement?.trim()) {
    introObs.push(final_assessment.most_important_improvement.trim());
  }

  if (report.resume_alignment?.missed_highlights && report.resume_alignment.missed_highlights.length > 0) {
    report.resume_alignment.missed_highlights.forEach((h) => {
      if (h?.trim()) introObs.push(`Resume Highlight to Mention: ${h.trim()}`);
    });
  }

  if (report.resume_alignment?.unverified_claims && report.resume_alignment.unverified_claims.length > 0) {
    report.resume_alignment.unverified_claims.forEach((c) => {
      if (c?.trim()) introObs.push(`Unverified Spoken Claim: ${c.trim()}`);
    });
  }

  // If specific keys were not present, collect non-empty observations from intro_sections
  if (introObs.length === 0) {
    intro_sections.slice(0, 5).forEach((s) => {
      if (s.observation?.trim()) introObs.push(s.observation.trim());
    });
  }

  const introDesc =
    final_assessment?.career_story?.trim() ||
    intro_quality?.observation?.trim() ||
    report.overall_summary?.trim() ||
    careerStoryObs;

  const introStatus =
    scores.overall_band ||
    report.overall_readiness ||
    intro_sections.find((s) => ["career_story", "current_role", "current_project"].includes(s.key))?.status ||
    "NEEDS_IMPROVEMENT";

  sections.push({
    id: "intro",
    tabLabel: "Introduction",
    icon: <User size={16} className="text-blue-600" />,
    iconContainerClass: "bg-blue-50 text-blue-600 border-blue-100",
    title: "Introduction Evaluation (AI Engineering Focus)",
    status: introStatus,
    description: introDesc,
    observations: introObs.length > 0 ? introObs : undefined,
  });

  // 2. AI Engineering Concepts
  const aiObs: string[] = [];
  const agenticSec = intro_sections.find((s) => s.key === "agentic_ai");
  const ragSec = intro_sections.find((s) => s.key === "rag_and_retrieval");
  const modelsSec = intro_sections.find((s) => s.key === "models_and_ai_platforms");

  const agenticObs = agenticSec?.observation?.trim();
  if (agenticObs) aiObs.push(agenticObs);

  const ragObs = ragSec?.observation?.trim();
  if (ragObs) aiObs.push(ragObs);

  const modelsObs = modelsSec?.observation?.trim();
  if (modelsObs) aiObs.push(modelsObs);

  if (technical_analysis?.strengths && technical_analysis.strengths.length > 0) {
    technical_analysis.strengths.forEach((s) => {
      if (s?.trim()) aiObs.push(s.trim());
    });
  }

  if (technical_analysis?.areas_for_improvement && technical_analysis.areas_for_improvement.length > 0) {
    technical_analysis.areas_for_improvement.forEach((i) => {
      if (i?.trim()) aiObs.push(i.trim());
    });
  }

  if (technical_analysis?.depth_assessment?.trim()) {
    aiObs.push(technical_analysis.depth_assessment.trim());
  }

  // Extract explicit AI Engineering Concept Coverage signals from backend LLM evaluation
  const aiConceptsList: { label: string; status: string }[] = [];
  [agenticSec, ragSec, modelsSec].forEach((sec) => {
    if (sec?.concepts) {
      Object.entries(sec.concepts).forEach(([conceptKey, conceptStatus]) => {
        if (conceptStatus && conceptStatus !== "NOT_APPLICABLE") {
          aiConceptsList.push({
            label: conceptKey.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            status: String(conceptStatus).toUpperCase(),
          });
        }
      });
    }
  });

  // Collect technologies mentioned across all AI sections
  const aiTechnologies = Array.from(
    new Set([
      ...(agenticSec?.technologies_mentioned || []),
      ...(ragSec?.technologies_mentioned || []),
      ...(modelsSec?.technologies_mentioned || []),
      ...(report.technology_inventory?.agent_frameworks || []),
      ...(report.technology_inventory?.retrieval_and_rag || []),
      ...(report.technology_inventory?.vector_databases || []),
      ...(report.technology_inventory?.models || []),
      ...(report.technology_inventory?.model_platforms || []),
    ])
  ).filter(Boolean);

  const aiDesc =
    final_assessment?.ai_engineering_depth?.trim() ||
    technical_analysis?.summary?.trim() ||
    agenticObs;

  const resolvedAiStatus =
    scores.ai_engineering?.band ||
    agenticSec?.status ||
    ragSec?.status ||
    modelsSec?.status ||
    report.intro_quality?.technical_depth ||
    (aiConceptsList.filter((c) => c.status === "COVERED").length > 0
      ? "GOOD"
      : aiConceptsList.filter((c) => c.status === "PARTIAL").length > 0
      ? "AVERAGE"
      : "NEEDS_IMPROVEMENT");

  sections.push({
    id: "ai_engineering",
    tabLabel: "AI Engineering",
    icon: <Cpu size={16} className="text-purple-600" />,
    iconContainerClass: "bg-purple-50 text-purple-600 border-purple-100",
    title: "AI Engineering Concepts",
    status: resolvedAiStatus,
    description: aiDesc,
    observations: aiObs.length > 0 ? aiObs : undefined,
    customContent: (
      <div className="space-y-2.5 pt-1">
        {/* Concept Coverage Matrix */}
        {aiConceptsList.length > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                AI Engineering Concept Coverage
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {aiConceptsList.filter((c) => c.status === "COVERED").length} of {aiConceptsList.length} Covered
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {aiConceptsList.map((c, idx) => {
                const isCovered = c.status === "COVERED";
                const isPartial = c.status === "PARTIAL";
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                      isCovered
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : isPartial
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-100 text-slate-500 border-slate-200 opacity-75"
                    }`}
                  >
                    {isCovered ? "✓" : isPartial ? "≈" : "✕"} {c.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Technologies Mentioned */}
        {aiTechnologies.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
            <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
              Technologies Mentioned:
            </span>
            {aiTechnologies.map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    ),
  });

  // 3. Software Engineering / QA / Data / DevOps
  const seObs: string[] = [];
  const seSec = intro_sections.find((s) => s.key === "software_engineering");
  const cloudSec = intro_sections.find((s) => s.key === "cloud_and_infrastructure");
  const cicdSec = intro_sections.find((s) => s.key === "cicd_and_delivery");

  const seSectionObs = getSecObs("software_engineering");
  if (seSectionObs) seObs.push(seSectionObs);

  const cloudObs = getSecObs("cloud_and_infrastructure");
  if (cloudObs) seObs.push(cloudObs);

  const cicdObs = getSecObs("cicd_and_delivery");
  if (cicdObs) seObs.push(cicdObs);

  const seDesc =
    final_assessment?.production_engineering_depth?.trim() ||
    seSectionObs ||
    cloudObs;

  const resolvedSeStatus =
    scores.core_engineering?.band ||
    seSec?.status ||
    cloudSec?.status ||
    cicdSec?.status ||
    (seObs.length > 0 &&
    seObs.every(
      (o) =>
        o.toLowerCase().includes("not mention") ||
        o.toLowerCase().includes("does not") ||
        o.toLowerCase().includes("not cover")
    )
      ? "NEEDS_IMPROVEMENT"
      : "AVERAGE");

  // Extract software engineering and DevOps concept coverage signals
  const seConceptsList: { label: string; status: string }[] = [];
  [seSec, cloudSec, cicdSec].forEach((sec) => {
    if (sec?.concepts) {
      Object.entries(sec.concepts).forEach(([conceptKey, conceptStatus]) => {
        if (conceptStatus && conceptStatus !== "NOT_APPLICABLE") {
          seConceptsList.push({
            label: conceptKey.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            status: String(conceptStatus).toUpperCase(),
          });
        }
      });
    }
  });

  // Collect technologies mentioned across software, cloud, and DevOps
  const seTechnologies = Array.from(
    new Set([
      ...(seSec?.technologies_mentioned || []),
      ...(cloudSec?.technologies_mentioned || []),
      ...(cicdSec?.technologies_mentioned || []),
      ...(report.technology_inventory?.backend_and_api || []),
      ...(report.technology_inventory?.frontend || []),
      ...(report.technology_inventory?.databases || []),
      ...(report.technology_inventory?.cloud || []),
      ...(report.technology_inventory?.containers_and_orchestration || []),
      ...(report.technology_inventory?.infrastructure_as_code || []),
      ...(report.technology_inventory?.cicd || []),
    ])
  ).filter(Boolean);

  sections.push({
    id: "software_engineering",
    tabLabel: "Software Engineering",
    icon: <Code2 size={16} className="text-blue-600" />,
    iconContainerClass: "bg-blue-50 text-blue-600 border-blue-100",
    title: "Software Engineering / QA / Data / DevOps",
    status: resolvedSeStatus,
    description: seDesc,
    observations: seObs.length > 0 ? seObs : undefined,
    customContent: (seConceptsList.length > 0 || seTechnologies.length > 0) ? (
      <div className="space-y-2.5 pt-1">
        {/* Concept Coverage Matrix */}
        {seConceptsList.length > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Software & Infrastructure Coverage
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {seConceptsList.filter((c) => c.status === "COVERED").length} of {seConceptsList.length} Covered
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {seConceptsList.map((c, idx) => {
                const isCovered = c.status === "COVERED";
                const isPartial = c.status === "PARTIAL";
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                      isCovered
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : isPartial
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-100 text-slate-500 border-slate-200 opacity-75"
                    }`}
                  >
                    {isCovered ? "✓" : isPartial ? "≈" : "✕"} {c.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Technologies Mentioned */}
        {seTechnologies.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
            <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
              Technologies Mentioned:
            </span>
            {seTechnologies.map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    ) : undefined,
  });

  // 4. Audio Analysis (Communication Skills) - Compact & Space-Efficient
  const audioObs: string[] = [];
  if (audio?.primary_vocal_strength) {
    const strength = audio.primary_vocal_strength.toLowerCase() === "pace" ? "Speaking Speed" : audio.primary_vocal_strength;
    audioObs.push(`Primary Strength: ${sanitizeQualitativeText(strength)}`);
  }
  if (audio?.primary_vocal_gap) {
    const gap = audio.primary_vocal_gap.toLowerCase() === "pace" ? "Speaking Speed" : audio.primary_vocal_gap;
    audioObs.push(`Primary Opportunity: ${sanitizeQualitativeText(gap)}`);
  }
  if (audio?.key_findings && audio.key_findings.length > 0) {
    audio.key_findings.slice(0, 2).forEach((kf) => {
      const factorName = kf.factor.toLowerCase() === "pace" ? "Speaking Speed" : kf.factor;
      const cleanFinding = sanitizeQualitativeText(kf.finding);
      if (cleanFinding) audioObs.push(`${factorName}: ${cleanFinding}`);
    });
  }

  // Compute qualitative status for pace (handles raw WPM numbers and enums)
  let paceStatus = audio?.factors?.pace?.status;
  if (!paceStatus && audio?.factors?.pace?.wpm_recorded != null) {
    const wpm = Number(audio.factors.pace.wpm_recorded);
    if (!isNaN(wpm)) {
      if (wpm < 110 || wpm > 185) paceStatus = "NEEDS_IMPROVEMENT";
      else if (wpm < 125 || wpm > 165) paceStatus = "AVERAGE";
      else paceStatus = "GOOD";
    }
  }
  if (paceStatus && /^\d+$/.test(paceStatus.trim())) {
    const wpm = Number(paceStatus.trim());
    if (wpm < 110 || wpm > 185) paceStatus = "NEEDS_IMPROVEMENT";
    else if (wpm < 125 || wpm > 165) paceStatus = "AVERAGE";
    else paceStatus = "GOOD";
  }
  if (!paceStatus) paceStatus = "AVERAGE";

  const fluencyRating = audio?.factors?.fluency?.status || "AVERAGE";
  const fillerRating = audio?.factors?.filler_word_usage?.status || "AVERAGE";
  const vocalRating = audio?.factors?.confidence_vocal_presence?.status || audio?.factors?.volume?.status || "AVERAGE";

  sections.push({
    id: "audio_analysis",
    tabLabel: "Audio Analysis",
    icon: <AudioWaveform size={16} className="text-amber-600" />,
    iconContainerClass: "bg-amber-50 text-amber-600 border-amber-100",
    title: "Audio Analysis (Communication Skills)",
    status: audio?.overall_readiness || scores.non_technical?.band || "AVERAGE",
    description: audio?.executive_summary ? sanitizeQualitativeText(audio.executive_summary) : undefined,
    observations: audioObs.length > 0 ? audioObs : undefined,
    customContent: (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
        <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Speaking Pace</span>
          <QualitativeBadge status={paceStatus} />
        </div>
        <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Fluency</span>
          <QualitativeBadge status={fluencyRating} />
        </div>
        <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Filler Words</span>
          <QualitativeBadge status={fillerRating} />
        </div>
        <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Vocal Presence</span>
          <QualitativeBadge status={vocalRating} />
        </div>
      </div>
    ),
  });

  // 5. Video Analysis (On-Camera Presentation) - Omit if audio only
  if (!isAudioOnly) {
    const videoObs: string[] = [];
    if (video?.primary_setup_strength) {
      videoObs.push(`Setup Strength: ${sanitizeQualitativeText(video.primary_setup_strength)}`);
    }
    if (video?.primary_setup_gap) {
      videoObs.push(`Setup Opportunity: ${sanitizeQualitativeText(video.primary_setup_gap)}`);
    }
    if (video?.key_findings && video.key_findings.length > 0) {
      video.key_findings.forEach((kf) => {
        const cleanFinding = sanitizeQualitativeText(kf.finding);
        if (cleanFinding) videoObs.push(`${kf.factor}: ${cleanFinding}`);
      });
    }

    const framingRating = video?.factors?.camera_framing_centering?.status;
    const gazeRating = video?.factors?.camera_angle_gaze_alignment?.status;
    const screenGazeRating = video?.factors?.off_screen_gaze_duration?.status;
    const tensionRating = video?.factors?.observable_physical_tension?.status;
    const hasVideoFactors = Boolean(framingRating || gazeRating || screenGazeRating || tensionRating);

    sections.push({
      id: "video_analysis",
      tabLabel: "Video Presentation",
      icon: <Video size={16} className="text-rose-600" />,
      iconContainerClass: "bg-rose-50 text-rose-600 border-rose-100",
      title: "Video Analysis (On-Camera Presentation)",
      status: video?.factors?.camera_framing_centering?.status || scores.non_technical?.band || "AVERAGE",
      description: video?.overall_summary ? sanitizeQualitativeText(video.overall_summary) : undefined,
      observations: videoObs.length > 0 ? videoObs : undefined,
      customContent: hasVideoFactors ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          {framingRating && (
            <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
              <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Framing</span>
              <QualitativeBadge status={framingRating} />
            </div>
          )}
          {gazeRating && (
            <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
              <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Eye Contact</span>
              <QualitativeBadge status={gazeRating} />
            </div>
          )}
          {screenGazeRating && (
            <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
              <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Screen Focus</span>
              <QualitativeBadge status={screenGazeRating} />
            </div>
          )}
          {tensionRating && (
            <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
              <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Composure</span>
              <QualitativeBadge status={tensionRating} />
            </div>
          )}
        </div>
      ) : undefined,
    });
  }

  // 6. Transcript
  const transcriptDuration = getTranscriptDuration(report);
  const segments = transcript.segments || [];
  const filteredSegments = transcriptFilter.trim()
    ? segments.filter((seg) =>
        seg.text.toLowerCase().includes(transcriptFilter.toLowerCase())
      )
    : segments;

  sections.push({
    id: "transcript",
    tabLabel: "Transcript",
    icon: <FileText size={16} className="text-violet-600" />,
    iconContainerClass: "bg-violet-50 text-violet-600 border-violet-100",
    title: "Transcript",
    status: undefined,
    rightElement: transcriptDuration ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock size={11} className="text-blue-600" />
        {transcriptDuration}
      </span>
    ) : undefined,
    customContent: (
      <div className="space-y-2.5 pt-1">
        {fullParagraphText ? (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Spoken Transcript (Full Paragraph)
              </span>
              <button
                type="button"
                onClick={handleCopyTranscript}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
              >
                {copiedTranscript ? (
                  <>
                    <Check size={11} className="text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} className="text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <div className="max-h-60 sm:max-h-72 overflow-y-auto pr-1">
              <p className="text-xs text-slate-700 leading-snug sm:leading-normal whitespace-pre-wrap select-text">
                {fullParagraphText}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2">No transcript recorded for this session.</p>
        )}
      </div>
    ),
  });

  // 7. Additional Observations
  const addlObs: string[] = [];
  const addlSec = intro_sections.find((s) =>
    [
      "ai_engineering_evolution",
      "guardrails_evals_observability_mentioned",
      "additional_observations",
    ].includes(s.key)
  );
  if (addlSec?.observation?.trim()) {
    addlObs.push(addlSec.observation.trim());
  }

  if (report.non_technical?.communication_summary?.trim()) {
    addlObs.push(`Communication: ${report.non_technical.communication_summary.trim()}`);
  }
  if (report.non_technical?.structure_quality?.trim()) {
    addlObs.push(`Structure: ${report.non_technical.structure_quality.trim()}`);
  }
  if (report.non_technical?.confidence_notes?.trim()) {
    addlObs.push(`Confidence: ${report.non_technical.confidence_notes.trim()}`);
  }
  if (final_assessment?.transition_quality?.trim()) {
    addlObs.push(`Transition Quality: ${final_assessment.transition_quality.trim()}`);
  }
  if (strongest_points && strongest_points.length > 0) {
    strongest_points.forEach((p) => {
      if (p?.trim()) addlObs.push(p.trim());
    });
  }
  if (priority_improvements && priority_improvements.length > 0) {
    priority_improvements.forEach((p) => {
      const guidance = p.guidance?.trim();
      const topic = p.topic?.trim();
      const example = p.example?.trim();
      if (guidance) {
        addlObs.push(`Priority Improvement (${topic || "Focus Area"}): ${guidance}${example ? ` — Example: "${example}"` : ""}`);
      }
    });
  }
  if (critical_gaps && critical_gaps.length > 0) {
    critical_gaps.forEach((g) => {
      const topic = g.topic?.trim();
      const missing = g.what_is_missing?.trim();
      const why = g.why_it_matters?.trim();
      const addition = g.suggested_addition?.trim();
      if (missing || addition || why) {
        const textParts = [missing, addition ? `Suggested addition: "${addition}"` : "", why ? `Context: ${why}` : ""].filter(Boolean);
        addlObs.push(`Identified Gap (${topic || "Content"}): ${textParts.join(" — ")}`);
      }
    });
  }

  const addlStatus =
    scores.non_technical?.band ||
    scores.business_acumen?.band ||
    addlSec?.status ||
    "AVERAGE";

  const addlDesc =
    report.non_technical?.communication_summary?.trim() ||
    addlSec?.observation?.trim() ||
    "Delivery, structure, and overall presentation signals evaluated during the interview.";

  sections.push({
    id: "additional_observations",
    tabLabel: "Additional Observations",
    icon: <ShieldCheck size={16} className="text-emerald-600" />,
    iconContainerClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    title: "Additional Observations",
    status: addlStatus,
    description: sanitizeQualitativeText(addlDesc),
    observations: addlObs.length > 0 ? addlObs : undefined,
  });

  // ── Active Sub-Tab State (Zero-Scroll Single-View Layout) ──
  const [activeSectionId, setActiveSectionId] = useState<string>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSectionId(initialSubTab);
    }
  }, [initialSubTab]);

  const activeSection =
    sections.find((s) => s.id === activeSectionId) || sections[0];

  return (
    <div className="space-y-3">
      {/* Horizontal Sub-Tabs Bar (Fits comfortably on wide screens without cutting off) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none no-scrollbar w-full">
        {sections.map((section) => {
          const isActive = section.id === activeSection.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSectionId(section.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? "bg-white text-blue-700 border-blue-400 shadow-2xs ring-2 ring-blue-500/15"
                  : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <span
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                  isActive
                    ? section.iconContainerClass
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {section.icon}
              </span>
              <span>{section.tabLabel || section.title}</span>
              {section.status && (
                <span
                  className={`size-1.5 rounded-full shrink-0 ${
                    ["EXCELLENT", "STRONG", "GOOD", "COVERED", "POSITIVE"].includes(
                      section.status.toUpperCase()
                    )
                      ? "bg-emerald-500"
                      : ["AVERAGE", "ADEQUATE", "DEVELOPING", "PARTIAL", "MODERATE"].includes(
                          section.status.toUpperCase()
                        )
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  title={section.status}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Section Content Card (Zero Page Scroll) */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs space-y-3 animate-in fade-in-50 duration-150">
        {/* Card Header: Icon, Full Title, Right Element, and Qualitative Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 border ${activeSection.iconContainerClass}`}
            >
              {activeSection.icon}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {activeSection.title}
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            {activeSection.rightElement}
            {activeSection.status && (
              <QualitativeBadge status={activeSection.status} />
            )}
          </div>
        </div>

        {/* Executive Description */}
        {activeSection.description && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Executive Description
            </span>
            <p className="text-xs text-slate-600 leading-snug sm:leading-normal">
              {activeSection.description}
            </p>
          </div>
        )}

        {/* Key Observations */}
        {activeSection.observations && activeSection.observations.length > 0 && (
          <div className="rounded-xl bg-[#f0f7ff] border border-blue-100/90 p-3 sm:p-3.5">
            <h4 className="text-xs font-bold text-slate-900 mb-1.5">
              Key Observations
            </h4>
            <ul className="space-y-1.5">
              {activeSection.observations.map((obs, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-600"
                >
                  <span className="text-blue-500 font-bold shrink-0 leading-none mt-0.5">
                    •
                  </span>
                  <span className="leading-snug sm:leading-normal">{obs}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(!activeSection.observations || activeSection.observations.length === 0) &&
          !activeSection.customContent &&
          !activeSection.description && (
            <p className="text-xs text-slate-400 italic py-2">
              No specific observations recorded for this section.
            </p>
          )}

        {/* Custom Content (e.g. Concept Matrix, Tech Badges, Audio/Video Factor Badges, Spoken Transcript) */}
        {activeSection.customContent}
      </div>

      {/* Full Transcript Modal */}
      {showFullTranscriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Full Assessment Transcript</h3>
                  {transcriptDuration && (
                    <p className="text-xs text-slate-500">Duration: {transcriptDuration}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullTranscriptModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Continuous Spoken Narrative
                </span>
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedTranscript ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} className="text-slate-500" />
                      <span>Copy Full Transcript</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {fullParagraphText || "No transcript recorded for this assessment."}
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullTranscriptModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION D — REPORT HEADER (Back link, Title, Metadata row, Download, Tabs)
// ═════════════════════════════════════════════════════════════════════════════

export interface ReportHeaderProps {
  assessment: AssessmentDetail;
  report: NormalizedReport;
  activeTab: ReportTab;
  onSelectTab: (tab: ReportTab) => void;
}

export function ReportHeader({
  assessment,
  report,
  activeTab,
  onSelectTab,
}: ReportHeaderProps) {
  // Dynamic role resolution from job description or resume
  const roleStr = (() => {
    const jd = assessment.job_description;
    if (jd) {
      const match = jd.match(/(?:title|role|position):\s*([^\n\r,]+)/i);
      if (match && match[1]?.trim()) return match[1].trim();
      if (jd.length < 40) return jd.trim();
    }
    return undefined;
  })();

  // Assessment Title formatting
  const typeLabelMap: Record<string, string> = {
    INTRO: "Introductory Assessment",
    JD_INTRO: "Job-Specific Introduction Assessment",
    TECHNICAL: "Technical Assessment",
    SYSTEM_DESIGN: "System Design Assessment",
    HIRING_MANAGER: "Hiring Manager Assessment",
    RECRUITER: "Recruiter Assessment",
  };

  const typeName =
    (assessment.assessment_type && typeLabelMap[assessment.assessment_type]) ||
    (assessment.assessment_type
      ? `${assessment.assessment_type.replaceAll("_", " ")} Assessment`
      : "Assessment");

  const title = roleStr ? `${roleStr} – ${typeName}` : typeName;

  // Metadata formatting
  const rawDate = assessment.completed_at || assessment.created_at;
  const completedDateStr = rawDate
    ? new Date(rawDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : undefined;

  const speakingSec =
    report.audio?.recording_environment?.speaking_duration_seconds;
  const durationStr = speakingSec
    ? `${Math.max(1, Math.round(speakingSec / 60))} mins`
    : assessment.started_at && assessment.completed_at
    ? `${Math.max(1, Math.round((new Date(assessment.completed_at).getTime() - new Date(assessment.started_at).getTime()) / 60000))} mins`
    : undefined;

  const typeStr =
    assessment.assessment_type === "INTRO"
      ? "Introductory"
      : assessment.assessment_type
      ? assessment.assessment_type.replaceAll("_", " ")
      : undefined;

  const rawMedia = (assessment.media_type || "").toUpperCase();
  const isAudioOnly =
    rawMedia === "AUDIO" ||
    rawMedia === "AUDIO_ONLY";

  const modeStr = isAudioOnly ? "Audio Only" : "Audio + Video";

  const handleDownload = () => {
    window.print();
  };

  return (
    <header className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs mb-4 sm:mb-5 print:border-none print:shadow-none print:p-0">
      {/* Top Row: Back link + Download Report */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = "/user_dashboard/ai-prep/assessments";
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors print:hidden cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Assessments
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer print:hidden ml-auto"
        >
          <Download size={14} className="text-slate-600" />
          Download Report
        </button>
      </div>

      {/* Title */}
      <h1 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-[#071d49]">
        {title}
      </h1>

      {/* Metadata Row with Subtle Dividers */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
        {completedDateStr && <span>Completed on {completedDateStr}</span>}
        {completedDateStr && durationStr && <span className="text-slate-300">|</span>}
        {durationStr && <span>Duration {durationStr}</span>}
        {(completedDateStr || durationStr) && typeStr && <span className="text-slate-300">|</span>}
        {typeStr && <span>Type {typeStr}</span>}
        {((completedDateStr || durationStr || typeStr) && modeStr) && <span className="text-slate-300">|</span>}
        {modeStr && <span>Mode {modeStr}</span>}
        {((completedDateStr || durationStr || typeStr || modeStr) && roleStr) && <span className="text-slate-300">|</span>}
        {roleStr && <span>Role {roleStr}</span>}
      </div>

      {/* Horizontal Tabs: Evaluation & Details */}
      <nav
        className="mt-4 flex gap-8 border-b border-slate-200 print:hidden"
        aria-label="Report sections"
      >
        {REPORT_TABS.map((tab) => {
          const isEvaluation =
            (tab.label === "Evaluation" &&
              (activeTab === "Evaluation" || activeTab === "Overview")) ||
            (tab.label === "Details" && activeTab !== "Evaluation" && activeTab !== "Overview");

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onSelectTab(tab.label)}
              className={`pb-2.5 text-sm transition-colors cursor-pointer ${
                isEvaluation
                  ? "border-b-2 border-blue-600 font-bold text-blue-600"
                  : "font-medium text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION E — SHELL / CONTAINER (Default Export)
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
    return initialTab ?? "Evaluation";
  });

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabFromParam(tabParam));
    } else {
      setActiveTab(initialTab ?? "Evaluation");
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

  // Fetch real report data
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
      console.error("[AiPrepReport] Failed to load real report:", err);
      setError("We couldn't load this assessment report.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const [detailsSubTab, setDetailsSubTab] = useState<string>(() => {
    return searchParams.get("section") || "intro";
  });

  useEffect(() => {
    const sec = searchParams.get("section");
    if (sec) {
      setDetailsSubTab(sec);
    } else if (tabParam === "details") {
      setDetailsSubTab("intro");
    }
  }, [tabParam, searchParams]);

  const handleTabChange = (tabLabel: ReportTab, subTab?: string) => {
    setActiveTab(tabLabel);
    // When clicking Details directly, always default to "intro" (Introduction)
    const resolvedSubTab = subTab ?? (tabLabel === "Details" ? "intro" : undefined);
    if (resolvedSubTab) {
      setDetailsSubTab(resolvedSubTab);
    }
    const param = paramFromTab(tabLabel);
    const sectionParam = resolvedSubTab ? `&section=${resolvedSubTab}` : "";
    const targetUrl = `/aiprep/reports/${assessmentId}?tab=${param}${sectionParam}`;
    router.push(targetUrl, { scroll: false });
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f8fafc] p-6">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-700 shadow-sm">
          <LoaderCircle className="animate-spin text-blue-600" size={22} />
          Loading your assessment report…
        </div>
      </main>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f8fafc] p-6">
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto cursor-pointer"
            >
              <RefreshCw size={15} /> Check Status
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = "/user_dashboard/ai-prep/assessments";
                }
              }}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto cursor-pointer"
            >
              Assessments List
            </button>
          </div>
        </section>
      </main>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f8fafc] p-6">
        <section className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle size={26} />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            {error || "We couldn't load this assessment report."}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Please make sure you are signed in and that the assessment evaluation has completed.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadReport}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto cursor-pointer"
            >
              <RefreshCw size={15} /> Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = "/user_dashboard/ai-prep/assessments";
                }
              }}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto cursor-pointer"
            >
              Assessments List
            </button>
          </div>
        </section>
      </main>
    );
  }

  const { assessment } = report;
  const isEvaluationTab =
    activeTab === "Evaluation" || activeTab === "Overview";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 w-full space-y-3 sm:space-y-3.5">
        <ReportHeader
          assessment={assessment}
          report={report}
          activeTab={activeTab}
          onSelectTab={handleTabChange}
        />

        <main className="space-y-3 sm:space-y-3.5">
          {isEvaluationTab ? (
            <EvaluationContent
              report={report}
              videoRef={videoRef}
              seekTo={seekTo}
              assessmentId={assessmentId}
              onSelectTab={handleTabChange}
            />
          ) : (
            <DetailsContent
              report={report}
              seekTo={seekTo}
              initialSubTab={detailsSubTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
