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
  ChevronDown,
  ChevronUp,
  Download,
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
  const raw = status.toUpperCase();
  const label = formatBand(status) || status;

  const isGood =
    [
      "EXCELLENT",
      "STRONG",
      "STRONG PERFORMANCE",
      "GOOD",
      "COVERED",
      "POSITIVE",
    ].includes(raw) ||
    label.toLowerCase().includes("strong") ||
    label.toLowerCase().includes("good") ||
    label.toLowerCase().includes("positive");

  const isAvg =
    ["ADEQUATE", "AVERAGE", "DEVELOPING", "PARTIAL"].includes(raw) ||
    label.toLowerCase().includes("developing") ||
    label.toLowerCase().includes("average");

  const colorClasses = isGood
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isAvg
    ? "bg-sky-50 text-sky-700 border-sky-200"
    : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${colorClasses}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
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
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          {icon}
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        </div>
        {observation ? (
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
            {observation}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No specific observation recorded.
          </p>
        )}
      </div>
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
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
  onSelectTab: (tab: ReportTab) => void;
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
  const introResumeBand = introSection?.status ?? scores.overall_band;

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
    report.intro_quality?.technical_depth;
  const aiEngObs =
    aiEngSection?.observation ?? report.technical_analysis?.summary;

  const coreEngSection = intro_sections.find((s) =>
    [
      "software_engineering",
      "cloud_and_infrastructure",
      "cicd_and_delivery",
      "mcp_mentioned",
      "memory_context_engineering_mentioned",
    ].includes(s.key)
  );
  const coreEngBand = scores.core_engineering?.band ?? coreEngSection?.status;
  const coreEngObs =
    coreEngSection?.observation ??
    report.technical_analysis?.depth_assessment;

  const rawAudioStrength = audio?.primary_vocal_strength?.toLowerCase() === "pace" ? "Speaking Speed" : audio?.primary_vocal_strength;
  const audioObs = sanitizeQualitativeText(
    audio?.executive_summary ?? rawAudioStrength ?? undefined
  );
  const audioBand = audio?.overall_readiness;

  const videoObs = sanitizeQualitativeText(
    video?.overall_summary ?? video?.primary_setup_strength ?? undefined
  );
  const videoBand = video
    ? video.factors.camera_framing_centering?.status ?? scores.non_technical?.band
    : undefined;

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
    addlSection?.status;
  const addlObs =
    addlSection?.observation ?? report.non_technical?.communication_summary;

  const rawTip =
    final_assessment?.most_important_improvement ??
    priority_improvements[0]?.guidance ??
    coaching_suggestions.find((c) => c.priority === 1)?.suggestion ??
    coaching_suggestions[0]?.suggestion;


  const previewSegments = transcript.segments.slice(0, 5);
  const isAudioOnly =
    report.assessment.media_type === "AUDIO" ||
    report.assessment.media_type === "AUDIO_ONLY";

  return (
    <div className="space-y-6">
      {/* ── 1. Overall Assessment (Wide Horizontal Card) ────────────────── */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-lg">✦</span>
            <h2 className="text-base font-bold text-slate-900">
              Overall Assessment
            </h2>
          </div>
          <QualitativeBadge
            status={overall_readiness ?? scores.overall_band}
          />
        </div>
        {overall_summary ? (
          <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-slate-700">
            {overall_summary}
          </p>
        ) : (
          <p className="mt-3.5 text-xs sm:text-sm text-slate-400 italic">
            {report.assessment.status === "EVALUATING"
              ? "Your assessment is currently being evaluated. Summary will appear shortly."
              : "No overall assessment summary recorded for this session."}
          </p>
        )}
      </section>

      {/* ── 2. Evaluation Highlights (Dynamic Grid) ─────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          Evaluation Highlights
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <HighlightCard
            icon={<User size={18} />}
            title="Introduction & Resume"
            observation={introSection?.observation}
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

      {/* ── 3. Recording Playback & Transcript Preview (2-Column Desktop) ── */}
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
              onClick={() => onSelectTab("Details")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              <ExternalLink size={12} />
              Open Full Transcript
            </button>
          </div>

          {previewSegments.length > 0 ? (
            <div className="flex-1 space-y-2.5 overflow-hidden">
              {previewSegments.map((seg, i) => (
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
                    {seg.text}
                  </p>
                </div>
              ))}
            </div>
          ) : transcript.full_text ? (
            <div className="flex-1 max-h-52 overflow-y-auto pr-1 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap select-text">
              {transcript.full_text}
            </div>
          ) : (
            <p className="flex-1 text-xs text-slate-400 italic">
              Transcript not available for this session.
            </p>
          )}
        </section>
      </div>

      {/* ── 4. Tip Section ───────────────────────────────────────────────── */}
      {rawTip && (
        <section className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-blue-50/50 p-4">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Tip
            </p>
            <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-slate-700">
              {rawTip}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION C — DETAILS TAB CONTENT (Expandable Real Evaluation Sections)
// ═════════════════════════════════════════════════════════════════════════════

interface DetailSectionData {
  id: string;
  icon: React.ReactNode;
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
}: {
  report: NormalizedReport;
  seekTo: (seconds: number) => void;
}) {
  const {
    intro_sections,
    intro_quality,
    technical_analysis,
    scores,
    audio,
    video,
    transcript,
    coaching_suggestions,
    priority_improvements,
    critical_gaps,
  } = report;

  // Assemble dynamic evaluation sections based on real available report data
  const sections: DetailSectionData[] = [];

  // 1. Introduction Evaluation Section
  const introObs: string[] = [];
  intro_sections.forEach((s) => {
    if (s.observation) {
      introObs.push(`${s.title}: ${s.observation}`);
    }
  });
  if (intro_quality?.clarity) {
    introObs.push(`Speech Clarity: Evaluated as ${formatBand(intro_quality.clarity)}.`);
  }
  if (intro_quality?.coherence) {
    introObs.push(`Story Flow: Structured as ${formatBand(intro_quality.coherence)}.`);
  }
  if (intro_quality?.technical_depth) {
    introObs.push(`Technical Depth: Assessed as ${formatBand(intro_quality.technical_depth)}.`);
  }

  sections.push({
    id: "intro",
    icon: <User size={18} className="text-blue-600" />,
    title: "Introduction Evaluation",
    status: scores.overall_band || report.overall_readiness,
    description: intro_quality?.observation || undefined,
    observations: introObs.length > 0 ? introObs.slice(0, 6) : undefined,
  });

  // 2. AI Engineering Concepts Section
  const aiObs: string[] = [];
  if (technical_analysis?.strengths && technical_analysis.strengths.length > 0) {
    technical_analysis.strengths.forEach((s) => aiObs.push(s));
  }
  if (
    technical_analysis?.areas_for_improvement &&
    technical_analysis.areas_for_improvement.length > 0
  ) {
    technical_analysis.areas_for_improvement.forEach((i) =>
      aiObs.push(`Growth Opportunity: ${i}`)
    );
  }
  if (technical_analysis?.depth_assessment) {
    aiObs.push(`Depth Assessment: ${technical_analysis.depth_assessment}`);
  }

  sections.push({
    id: "ai_engineering",
    icon: <Cpu size={18} className="text-blue-600" />,
    title: "AI Engineering Concepts",
    status: scores.ai_engineering?.band,
    description: technical_analysis?.summary || undefined,
    observations: aiObs.length > 0 ? aiObs : undefined,
  });

  // 3. Software Engineering Section
  const seObs: string[] = [];
  const seSection = intro_sections.find((s) =>
    ["software_engineering", "cloud_and_infrastructure", "cicd_and_delivery"].includes(
      s.key
    )
  );
  if (seSection?.observation) seObs.push(seSection.observation);
  if (scores.core_engineering?.band) {
    seObs.push(
      `Core Engineering: Rated ${formatBand(scores.core_engineering.band)}.`
    );
  }

  sections.push({
    id: "software_engineering",
    icon: <Code2 size={18} className="text-blue-600" />,
    title: "Software Engineering",
    status: scores.core_engineering?.band || seSection?.status,
    description: seSection?.observation || undefined,
    observations: seObs.length > 0 ? seObs : undefined,
  });

  // 4. Audio Analysis Section
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
    audio.key_findings.forEach((kf) => {
      const factorName = kf.factor.toLowerCase() === "pace" ? "Speaking Speed" : kf.factor;
      const cleanFinding = sanitizeQualitativeText(kf.finding);
      if (cleanFinding) audioObs.push(`${factorName}: ${cleanFinding}`);
    });
  }

  sections.push({
    id: "audio_analysis",
    icon: <AudioWaveform size={18} className="text-blue-600" />,
    title: "Audio Analysis",
    status: audio?.overall_readiness,
    description: audio?.executive_summary ? sanitizeQualitativeText(audio.executive_summary) : undefined,
    observations: audioObs.length > 0 ? audioObs : undefined,
  });

  // 5. Video & On-Camera Section (only if not audio-only)
  const isAudioOnly =
    report.assessment.media_type === "AUDIO" ||
    report.assessment.media_type === "AUDIO_ONLY";

  if (!isAudioOnly) {
    const videoObs: string[] = [];
    if (video?.primary_setup_strength) {
      videoObs.push(`Setup Strength: ${sanitizeQualitativeText(video.primary_setup_strength)}`);
    }
    if (video?.key_findings && video.key_findings.length > 0) {
      video.key_findings.forEach((kf) => {
        const cleanFinding = sanitizeQualitativeText(kf.finding);
        if (cleanFinding) videoObs.push(`${kf.factor}: ${cleanFinding}`);
      });
    }

    sections.push({
      id: "video_analysis",
      icon: <Video size={18} className="text-blue-600" />,
      title: "Video & On-Camera",
      status: video?.factors?.camera_framing_centering?.status,
      description: video?.overall_summary ? sanitizeQualitativeText(video.overall_summary) : undefined,
      observations: videoObs.length > 0 ? videoObs : undefined,
    });
  }

  // 6. Transcript Section
  const transcriptDuration = getTranscriptDuration(report);
  sections.push({
    id: "transcript",
    icon: <FileText size={18} className="text-blue-600" />,
    title: "Transcript",
    status: undefined,
    rightElement: transcriptDuration ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
        <Clock size={12} className="text-blue-600" />
        <span>{transcriptDuration}</span>
      </span>
    ) : undefined,
    description: undefined,
    customContent: (
      <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
        {transcriptDuration && (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Recorded Speech</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
              <Clock size={12} className="text-blue-600" />
              Time Taken: <strong className="text-slate-900 font-bold">{transcriptDuration}</strong>
            </span>
          </div>
        )}
        {transcript.segments && transcript.segments.length > 0 ? (
          transcript.segments.map((seg, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs py-1">
              {seg.timestamp_s != null ? (
                <button
                  type="button"
                  onClick={() => seekTo(seg.timestamp_s!)}
                  className="w-12 shrink-0 font-mono text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer"
                  title={`Seek video to ${seg.timestamp}`}
                >
                  {seg.timestamp ?? fmtTime(seg.timestamp_s)}
                </button>
              ) : (
                <span className="w-12 shrink-0 font-mono text-slate-400">
                  {seg.timestamp ?? "—"}
                </span>
              )}
              <span className="shrink-0 font-semibold text-slate-700">
                {seg.speaker || "Candidate"}:
              </span>
              <p className="flex-1 text-slate-600 leading-relaxed">{seg.text}</p>
            </div>
          ))
        ) : transcript.full_text ? (
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {transcript.full_text}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">No transcript recorded.</p>
        )}
      </div>
    ),
  });

  // 7. Additional Observations (replacing Coaching)
  const addlObs: string[] = [];
  if (report.non_technical?.communication_summary) {
    addlObs.push(`Communication: ${report.non_technical.communication_summary}`);
  }
  if (report.non_technical?.structure_quality) {
    addlObs.push(`Structure: ${report.non_technical.structure_quality}`);
  }
  if (report.non_technical?.confidence_notes) {
    addlObs.push(`Confidence: ${report.non_technical.confidence_notes}`);
  }
  if (report.strongest_points && report.strongest_points.length > 0) {
    report.strongest_points.forEach((p) => {
      if (p) addlObs.push(p);
    });
  }
  if (priority_improvements && priority_improvements.length > 0) {
    priority_improvements.forEach((p) => {
      if (p.guidance) {
        addlObs.push(`${p.topic ? `${p.topic}: ` : ""}${p.guidance}`);
      }
    });
  }
  if (coaching_suggestions && coaching_suggestions.length > 0) {
    coaching_suggestions.forEach((c) => {
      if (c.suggestion) {
        addlObs.push(`${c.area ? `${c.area}: ` : ""}${c.suggestion}`);
      }
    });
  }
  if (critical_gaps && critical_gaps.length > 0) {
    critical_gaps.forEach((g) => {
      if (g.what_is_missing) {
        addlObs.push(`${g.topic ? `${g.topic}: ` : ""}${g.what_is_missing}`);
      }
    });
  }

  const addlStatus =
    scores.non_technical?.band
      ? formatBand(scores.non_technical.band)
      : scores.business_acumen?.band
      ? formatBand(scores.business_acumen.band)
      : undefined;

  sections.push({
    id: "additional_observations",
    icon: <Lightbulb size={18} className="text-emerald-600" />,
    title: "Additional Observations",
    status: addlStatus,
    description: undefined,
    observations: addlObs.length > 0 ? addlObs : undefined,
  });

  // Manage expandable states
  const [openSectionIds, setOpenSectionIds] = useState<Record<string, boolean>>(() => {
    // Default: first 3 sections expanded
    const init: Record<string, boolean> = {};
    sections.slice(0, 3).forEach((s) => {
      init[s.id] = true;
    });
    return init;
  });

  const allExpanded = sections.every((s) => openSectionIds[s.id]);

  const handleToggleAll = () => {
    if (allExpanded) {
      setOpenSectionIds({});
    } else {
      const next: Record<string, boolean> = {};
      sections.forEach((s) => {
        next[s.id] = true;
      });
      setOpenSectionIds(next);
    }
  };

  const toggleSection = (id: string) => {
    setOpenSectionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Expand All / Collapse All */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Detailed Evaluation Sections
        </h2>
        <button
          type="button"
          onClick={handleToggleAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          {allExpanded ? (
            <>
              <ChevronUp size={14} className="text-slate-500" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown size={14} className="text-slate-500" />
              Expand All
            </>
          )}
        </button>
      </div>

      {/* Expandable Sections List */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = Boolean(openSectionIds[section.id]);
          return (
            <div
              key={section.id}
              className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs transition-colors"
            >
              {/* Header (Clickable) */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 sm:px-5 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span className="shrink-0 flex items-center">{section.icon}</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {section.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {section.rightElement}
                  {section.status && <QualitativeBadge status={section.status} />}
                  <span className="text-slate-400">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </button>

              {/* Body (Expanded) */}
              {isOpen && (
                <div className="border-t border-slate-100 p-4 sm:p-5 space-y-4 bg-white">
                  {section.description && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Description
                      </h4>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                        {section.description}
                      </p>
                    </div>
                  )}

                  {section.observations && section.observations.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Key Observations
                      </h4>
                      <ul className="space-y-2">
                        {section.observations.map((obs, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs sm:text-sm text-slate-600"
                          >
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span className="leading-relaxed">{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(!section.observations || section.observations.length === 0) && !section.customContent && (
                    <p className="text-xs text-slate-400 italic">
                      No specific observations recorded for this section.
                    </p>
                  )}

                  {section.customContent}
                </div>
              )}
            </div>
          );
        })}
      </div>
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

  const modeStr =
    assessment.media_type === "AUDIO" || assessment.media_type === "AUDIO_ONLY"
      ? "Audio Only"
      : assessment.media_type
      ? "Video"
      : undefined;

  const handleDownload = () => {
    window.print();
  };

  return (
    <header className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs mb-6 print:border-none print:shadow-none print:p-0">
      {/* Top Row: Back to My Assessments & Download Report */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/user_dashboard/ai-prep"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors print:hidden"
        >
          <ArrowLeft size={15} />
          Back to My Assessments
        </Link>

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
      <h1 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-[#071d49]">
        {title}
      </h1>

      {/* Metadata Row with Subtle Dividers */}
      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
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
        className="mt-5 flex gap-8 border-b border-slate-200 print:hidden"
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

  const handleTabChange = (tabLabel: ReportTab) => {
    setActiveTab(tabLabel);
    const param = paramFromTab(tabLabel);
    const targetUrl = `/aiprep/reports/${assessmentId}?tab=${param}`;
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
            <Link
              href="/user_dashboard/ai-prep"
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Back to My Assessments
            </Link>
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
            <Link
              href="/user_dashboard/ai-prep"
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Back to My Assessments
            </Link>
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
      {/* Wide centered container matching the report-only reference */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <ReportHeader
          assessment={assessment}
          report={report}
          activeTab={activeTab}
          onSelectTab={handleTabChange}
        />

        <main>
          {isEvaluationTab ? (
            <EvaluationContent
              report={report}
              videoRef={videoRef}
              seekTo={seekTo}
              assessmentId={assessmentId}
              onSelectTab={handleTabChange}
            />
          ) : (
            <DetailsContent report={report} seekTo={seekTo} />
          )}
        </main>
      </div>
    </div>
  );
}
