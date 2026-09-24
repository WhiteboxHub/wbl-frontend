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

import { useEffect, useState, useRef, useCallback, useMemo, type RefObject } from "react";
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
  ChevronDown,
  MicOff,
} from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";
import { logger } from "@/lib/utils";
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

function QualitativeBadge({
  status,
  inverted = false,
}: {
  status?: string;
  inverted?: boolean;
}) {
  if (!status) return null;
  const raw = status.toUpperCase().trim();
  const formatted = formatBand(status, inverted);

  const isGood =
    (!inverted && raw === "HIGH") ||
    (inverted && (raw === "LOW" || raw === "MINIMAL")) ||
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
    (raw === "MODERATE" ||
      [
        "ADEQUATE",
        "AVERAGE",
        "DEVELOPING",
        "PARTIAL",
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
  inverted = false,
}: {
  icon: React.ReactNode;
  title: string;
  observation?: string;
  status?: string;
  inverted?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          {icon}
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">{title}</h3>
        </div>
        {observation && (
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {observation}
          </p>
        )}
      </div>
      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Rating
        </span>
        {status ? (
          <QualitativeBadge status={status} inverted={inverted} />
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

// ── Content Validation & Fallback Filtering ──────────────────────────────────
// Filters out generic fallback/negative statements emitted when a candidate
// did not speak or did not cover a topic (e.g. "No career story was provided",
// "No mention of agentic AI concepts", "The speaking duration is too short...").
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FALLBACK_PATTERNS: RegExp[] = [
  /^no\s/i,
  /^none\b/i,
  /^n\/?a$/i,
  /^not\s+(provided|mentioned|covered|available|applicable|discussed|evaluated|demonstrated|explained)\b/i,
  /^(the\s+)?(candidate|speaker)\s+(did\s+not|does\s+not|didn't|hasn't|failed\s+to|was\s+not\s+able\s+to|omits?)\b/i,
  /^(the\s+)?(candidate|speaker)\s+(should|needs\s+to|must)\s+(provide|explain|discuss|elaborate|give|include|cover)\b/i,
  /^(the\s+)?introduction\s+(does\s+not|did\s+not|didn't|hasn't|lacks|failed\s+to|contains\s+no|has\s+no|is\s+missing|provides\s+no|omits)\b/i,
  /\b(does\s+not|did\s+not|didn't|hasn't|failed\s+to)\s+(mention|demonstrate|contain|provide|include|cover|show|discuss|explain|elaborate|highlight|touch\s+upon)\b/i,
  /\blacks?\s+(any\s+)?(mention|substantive|content|details?|depth|evidence|coverage|information)\b/i,
  /\bno\s+(aspect|mention|concept|details?|depth|information|evidence|discussion|coverage|demonstration)\b/i,
  /^did\s+not\s+(mention|provide|discuss|cover|speak|attend|participate|explain|demonstrate)\b/i,
  /^there\s+(is|was|were)\s+no\s+(mention|discussion|evidence|data|information|details)\b/i,
  /^neither\s+.*\s+(was|were)\s+(mentioned|discussed|covered|provided)\b/i,
  /\b(was|were)\s+not\s+(mentioned|covered|discussed|demonstrated|provided|explained)\b/i,
  /\bwasn't\s+(mentioned|covered|discussed|demonstrated|provided|explained)\b/i,
  /\bnot\s+mentioned\b/i,
  /\bnot\s+covered\b/i,
  /\bnot_mentioned\b/i,
  /^(the\s+)?speaking\s+duration\s+is\s+too\s+short/i,
  /^duration\s+(is\s+)?too\s+short/i,
  /^insufficient\s+(data|speech|audio|duration|information)\b/i,
  /^unable\s+to\s+evaluate\b/i,
  /\blacks?\s+(any\s+)?content\s+to\s+evaluate\b/i,
  /^no\s+specific\s+observation\s+recorded/i,
  /^eye\s+contact,\s+framing,\s+and\s+visual\s+presentation\s+evaluated\.?$/i,
  /^assessment\s+completed\.?$/i,
  /^(thank\s+you|thanks\s+for\s+watching)\.?$/i,
  /^identified\s+gap\b/i,
  /^priority\s+improvement\b/i,
  /^resume\s+highlight\s+to\s+mention\b/i,
  /^unverified\s+spoken\s+claim\b/i,
  /^what\s+is\s+missing\b/i,
];

function isRealContent(text?: string | null): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 8) return false;
  return !EMPTY_FALLBACK_PATTERNS.some((p) => p.test(t));
}

const WHISPER_HALLUCINATIONS: RegExp[] = [
  /^assessment\s+completed\.?$/i,
  /^thank\s+you(\s+for\s+watching)?\.?$/i,
  /^thanks\s+for\s+watching\.?$/i,
  /^subtitles\s+by.*$/i,
  /^subscribe(\s+to\s+my\s+channel)?\.?$/i,
  /^you\.?$/i,
  /^bye\.?$/i,
];

function isOnlyGreetingsOrTestUtterances(text: string): boolean {
  const cleaned = text
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'<>]/g, " ")
    .toLowerCase()
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const greetingAndNoiseTokens = new Set([
    "hi", "hello", "hey", "fellow", "fellows", "there", "bye", "goodbye",
    "thanks", "thank", "you", "good", "morning", "afternoon", "evening",
    "test", "testing", "check", "checking", "mic", "sound",
    "one", "two", "three", "four", "1", "2", "3",
    "can", "hear", "me", "am", "i", "audible", "loud", "clear",
    "ok", "okay", "yes", "yeah", "yep", "no", "nope",
    "so", "um", "uh", "ah", "well"
  ]);

  const nonGreetingTokens = words.filter((w) => !greetingAndNoiseTokens.has(w));

  // If there are literally no substantive words at all
  if (nonGreetingTokens.length === 0) return true;

  // If total utterance is very short (e.g. <= 6 words) and contains fewer than 2 non-greeting words
  if (words.length <= 6 && nonGreetingTokens.length < 2) return true;

  return false;
}

function hasRealSpeech(report: NormalizedReport): boolean {
  const fullText = (report.transcript?.full_text || "").trim();
  const segments = report.transcript?.segments || [];
  let combined = fullText;
  if (!combined && segments.length > 0) {
    combined = segments.map((s) => s.text || "").join(" ").trim();
  }
  combined = combined.replace(/<\/?s>/gi, "").trim();
  if (!combined) return false;

  if (WHISPER_HALLUCINATIONS.some((p) => p.test(combined))) {
    return false;
  }
  if (!isRealContent(combined)) {
    return false;
  }
  if (isOnlyGreetingsOrTestUtterances(combined)) {
    return false;
  }
  return true;
}

function isPositiveStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  return ["COVERED", "PARTIAL", "STRONG", "GOOD", "ADEQUATE", "AVERAGE", "DEVELOPING", "POSITIVE", "EXCELLENT"].includes(s);
}

// ── Explicit Topic Detectors ─────────────────────────────────────────────────
export function hasExplainedIntroduction(report: NormalizedReport): boolean {
  if (!hasRealSpeech(report)) return false;

  const introKeys = [
    "career_story",
    "current_role",
    "current_project",
    "introduced_self",
    "career_arc_covered",
  ];

  const introSections = (report.intro_sections || []).filter((s) =>
    introKeys.includes(s.key)
  );

  // 1. Check if any intro section has a genuinely covered/partial status
  const hasCoveredStatus = introSections.some((s) => isPositiveStatus(s.status));
  if (hasCoveredStatus) return true;

  // 2. Check if any intro section has genuine transcript evidence
  const hasEvidence = introSections.some(
    (s) => Array.isArray(s.evidence) && s.evidence.some((e) => e && e.trim().length > 0)
  );
  if (hasEvidence) return true;

  // 3. Check if any intro section has genuine positive observation passing isRealContent
  const hasValidObservation = introSections.some((s) => isRealContent(s.observation));
  if (hasValidObservation) return true;

  // 4. Check final assessment fields for genuine career or project descriptions
  if (isRealContent(report.final_assessment?.career_story)) return true;
  if (isRealContent(report.final_assessment?.current_project_clarity)) return true;

  return false;
}

export function hasExplainedAiEngineering(report: NormalizedReport): boolean {
  if (!hasRealSpeech(report)) return false;

  const aiKeys = [
    "agentic_ai",
    "rag_and_retrieval",
    "models_and_ai_platforms",
    "rag_retrieval_chunking_mentioned",
    "ai_agents_multiagent_mentioned",
  ];

  const aiSections = (report.intro_sections || []).filter((s) =>
    aiKeys.includes(s.key)
  );

  // 1. Check if any AI concept is COVERED or PARTIAL
  const hasAiConcepts = aiSections.some(
    (s) =>
      s.concepts &&
      Object.values(s.concepts).some((st) => isPositiveStatus(String(st)))
  );
  if (hasAiConcepts) return true;

  // 2. Check if any AI section has genuine transcript evidence
  const hasEvidence = aiSections.some(
    (s) => Array.isArray(s.evidence) && s.evidence.some((e) => e && e.trim().length > 0)
  );
  if (hasEvidence) return true;

  // 3. Check if actual AI technologies were mentioned by candidate
  const techInv = report.technology_inventory;
  const aiTech = [
    ...(techInv?.agent_frameworks || []),
    ...(techInv?.retrieval_and_rag || []),
    ...(techInv?.vector_databases || []),
    ...(techInv?.models || []),
    ...(techInv?.model_platforms || []),
  ].filter(Boolean);
  if (aiTech.length > 0) return true;

  const hasSectionTech = aiSections.some(
    (s) =>
      Array.isArray(s.technologies_mentioned) &&
      s.technologies_mentioned.filter(Boolean).length > 0
  );
  if (hasSectionTech) return true;

  // 4. Check if section has positive status
  const hasPositiveSecStatus = aiSections.some((s) => isPositiveStatus(s.status));
  if (hasPositiveSecStatus) return true;

  // 5. Check if any observation passes isRealContent
  const hasRealObs = aiSections.some((s) => isRealContent(s.observation));
  if (hasRealObs) return true;

  if (isRealContent(report.final_assessment?.ai_engineering_depth)) return true;

  return false;
}

export function hasExplainedSoftwareEngineering(report: NormalizedReport): boolean {
  if (!hasRealSpeech(report)) return false;

  const seKeys = [
    "software_engineering",
    "cloud_and_infrastructure",
    "cicd_and_delivery",
    "mcp_mentioned",
    "memory_context_engineering_mentioned",
  ];

  const seSections = (report.intro_sections || []).filter((s) =>
    seKeys.includes(s.key)
  );

  // 1. Check if any SE concept is COVERED or PARTIAL
  const hasSeConcepts = seSections.some(
    (s) =>
      s.concepts &&
      Object.values(s.concepts).some((st) => isPositiveStatus(String(st)))
  );
  if (hasSeConcepts) return true;

  // 2. Check if any SE section has genuine transcript evidence
  const hasEvidence = seSections.some(
    (s) => Array.isArray(s.evidence) && s.evidence.some((e) => e && e.trim().length > 0)
  );
  if (hasEvidence) return true;

  // 3. Check if actual SE technologies were mentioned
  const techInv = report.technology_inventory;
  const seTech = [
    ...(techInv?.backend_and_api || []),
    ...(techInv?.frontend || []),
    ...(techInv?.databases || []),
    ...(techInv?.cloud || []),
    ...(techInv?.containers_and_orchestration || []),
    ...(techInv?.infrastructure_as_code || []),
    ...(techInv?.cicd || []),
  ].filter(Boolean);
  if (seTech.length > 0) return true;

  const hasSectionTech = seSections.some(
    (s) =>
      Array.isArray(s.technologies_mentioned) &&
      s.technologies_mentioned.filter(Boolean).length > 0
  );
  if (hasSectionTech) return true;

  // 4. Check if section has positive status
  const hasPositiveSecStatus = seSections.some((s) => isPositiveStatus(s.status));
  if (hasPositiveSecStatus) return true;

  // 5. Check if any observation passes isRealContent
  const hasRealObs = seSections.some((s) => isRealContent(s.observation));
  if (hasRealObs) return true;

  if (isRealContent(report.final_assessment?.production_engineering_depth)) return true;

  return false;
}

export function hasExplainedAudio(report: NormalizedReport): boolean {
  if (!hasRealSpeech(report)) return false;
  const audio = report.audio;
  const nonTech = report.non_technical;
  const nonTechBand = report.scores?.non_technical?.band;

  const hasNonTechContent = Boolean(
    isRealContent(nonTech?.communication_summary) ||
    isRealContent(nonTech?.structure_quality) ||
    isRealContent(nonTech?.confidence_notes) ||
    (nonTechBand && isPositiveStatus(nonTechBand))
  );

  if (!audio) return hasNonTechContent;

  const hasRealObs = isRealContent(audio.executive_summary) || isRealContent(audio.primary_vocal_strength);

  const isValidFactor = (factor?: { status?: string; observation?: string }) => {
    if (!factor) return false;
    if (factor.status && factor.status !== "INSUFFICIENT_DATA") return true;
    return Boolean(factor.status !== "INSUFFICIENT_DATA" && factor.observation && isRealContent(factor.observation));
  };

  const hasValidFactor =
    isValidFactor(audio.factors?.pace) ||
    isValidFactor(audio.factors?.fluency) ||
    isValidFactor(audio.factors?.filler_word_usage) ||
    isValidFactor(audio.factors?.confidence_vocal_presence) ||
    isValidFactor(audio.factors?.volume);

  const isAudioReal = Boolean(
    (audio.overall_readiness && audio.overall_readiness !== "INSUFFICIENT_DATA") ||
    hasRealObs ||
    hasValidFactor
  );

  return isAudioReal || hasNonTechContent;
}

export function hasExplainedVideo(report: NormalizedReport): boolean {
  if (!hasRealSpeech(report)) return false;
  const rawMediaType = (report.assessment.media_type || "").toUpperCase();
  const isAudioOnly = rawMediaType === "AUDIO" || rawMediaType === "AUDIO_ONLY";
  if (isAudioOnly) return false;

  const video = report.video;
  if (!video) return false;

  const framingStatus = video.factors?.camera_framing_centering?.status;
  if (!framingStatus || framingStatus === "INSUFFICIENT_DATA") return false;

  const hasRealObs = isRealContent(video.overall_summary);
  const hasFactors =
    Boolean(framingStatus && framingStatus !== "INSUFFICIENT_DATA") ||
    Boolean(video.factors?.camera_angle_gaze_alignment?.status && video.factors.camera_angle_gaze_alignment.status !== "INSUFFICIENT_DATA") ||
    Boolean(video.factors?.off_screen_gaze_duration?.status && video.factors.off_screen_gaze_duration.status !== "INSUFFICIENT_DATA") ||
    Boolean(video.factors?.observable_physical_tension?.status && video.factors.observable_physical_tension.status !== "INSUFFICIENT_DATA");

  return hasRealObs || hasFactors;
}

function getTranscriptDuration(report: NormalizedReport): string {
  // If no actual speech was uttered (e.g. 1s session with silence or Whisper hallucination), return empty
  if (!hasRealSpeech(report)) return "";

  const assessment = report.assessment;
  let totalSec: number | null = null;

  // 1. Audio telemetry speaking duration from assessment data
  const dataRec = assessment.data as any;
  if (dataRec?.audio_telemetry?.speaking_duration_seconds != null) {
    const sec = Number(dataRec.audio_telemetry.speaking_duration_seconds);
    if (!isNaN(sec) && sec > 0) {
      totalSec = Math.round(sec);
    }
  }

  // 2. Audio evaluation recording environment speaking duration
  if (!totalSec && report.audio?.recording_environment?.speaking_duration_seconds != null) {
    const sec = Number(report.audio.recording_environment.speaking_duration_seconds);
    if (!isNaN(sec) && sec > 0) {
      totalSec = Math.round(sec);
    }
  }

  // 3. Audio / Video telemetry duration_seconds
  if (!totalSec && dataRec?.audio_telemetry?.duration_seconds != null) {
    const sec = Number(dataRec.audio_telemetry.duration_seconds);
    if (!isNaN(sec) && sec > 0) totalSec = Math.round(sec);
  }
  if (!totalSec && dataRec?.video_telemetry?.duration_seconds != null) {
    const sec = Number(dataRec.video_telemetry.duration_seconds);
    if (!isNaN(sec) && sec > 0) totalSec = Math.round(sec);
  }

  // 4. Assessment duration_seconds directly
  if (!totalSec && (assessment as any)?.duration_seconds != null) {
    const sec = Number((assessment as any).duration_seconds);
    if (!isNaN(sec) && sec > 0) totalSec = Math.round(sec);
  }

  // 5. Timestamps from segments (last segment timestamp_s)
  if (!totalSec && report.transcript?.segments && report.transcript.segments.length > 0) {
    const segs = report.transcript.segments;
    const lastSeg = segs[segs.length - 1];
    if (lastSeg.timestamp_s != null && lastSeg.timestamp_s > 0) {
      totalSec = Math.round(lastSeg.timestamp_s);
    }
  }

  // 6. Started_at and completed_at difference
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

  // 7. Fallback based on word count (conversational ~130 wpm)
  if (!totalSec && report.transcript?.full_text) {
    const words = report.transcript.full_text.trim().split(/\s+/).filter(Boolean).length;
    if (words > 0) {
      totalSec = Math.max(1, Math.round((words / 130) * 60));
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

/**
 * Transforms feedback observations and descriptions from third person
 * (e.g., "Vishnu clearly outlines his career progression", "The candidate explains...")
 * to second person direct coaching voice ("You clearly outline your career progression...").
 */
function formatFeedbackToSecondPerson(
  text?: string | null,
  candidateName?: string | null
): string {
  if (!text) return "";
  let s = text.trim();

  // 1. Gather candidate names (explicit + dynamically detected from text)
  const nameSet = new Set<string>();

  if (candidateName) {
    candidateName
      .trim()
      .split(/\s+/)
      .forEach((n) => {
        const clean = n.replace(/[^a-zA-Z]/g, "");
        if (clean.length >= 2 && !/^(candidate|speaker|user|mr|ms|mrs|dr)$/i.test(clean)) {
          nameSet.add(clean);
        }
      });
  }

  // Common non-name capitalized words that might start sentences or appear before verbs
  const nonNameWords = new Set([
    "the", "this", "that", "these", "those", "here", "there", "it", "they",
    "our", "your", "my", "each", "both", "section", "key", "overview",
    "however", "overall", "introduction", "audio", "video", "transcript",
    "summary", "assessment", "analysis", "evaluation", "feedback", "report"
  ]);

  // Dynamically detect names followed by 3rd-person verbs or adverbs
  // e.g. "Vishnu effectively communicates", "Vishnu demonstrates", "Vishnu mentions"
  const dynamicNameRegex =
    /\b([A-Z][a-z]{2,})\s+(?:(?:effectively|clearly|strongly|briefly|also|consistently|adequately|partially|well|successfully)\s+)?(?:communicates|outlines|mentions|demonstrates|highlights|describes|provides|shows|discusses|explains|focuses|covers|emphasizes|presents|states|articulates|details|notes|identifies|applies|structures|uses|builds|leverages|maintains|exhibits|displays|lacks|speaks|walks|shares|delivers)\b/g;
  let dynamicMatch: RegExpExecArray | null;
  while ((dynamicMatch = dynamicNameRegex.exec(s)) !== null) {
    const candidateWord = dynamicMatch[1];
    if (!nonNameWords.has(candidateWord.toLowerCase())) {
      nameSet.add(candidateWord);
    }
  }

  // Also detect possessive name: "Vishnu's"
  const possessiveNameRegex = /\b([A-Z][a-z]{2,})'s\b/g;
  let possMatch: RegExpExecArray | null;
  while ((possMatch = possessiveNameRegex.exec(s)) !== null) {
    const candidateWord = possMatch[1];
    if (!nonNameWords.has(candidateWord.toLowerCase())) {
      nameSet.add(candidateWord);
    }
  }

  // Build names pattern including "the candidate", "the speaker", "candidate", "speaker"
  const namesEscaped = Array.from(nameSet).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const nameEntityPattern = namesEscaped.length > 0
    ? `(?:the\\s+candidate|the\\s+speaker|candidate|speaker|${namesEscaped.join("|")})`
    : `(?:the\\s+candidate|the\\s+speaker|candidate|speaker)`;

  // 2. Replace possessives: Name's, The candidate's, The speaker's -> your / Your
  const possessiveRegex = new RegExp(`\\b${nameEntityPattern}'s\\b`, "gi");
  s = s.replace(possessiveRegex, (match, offset) => {
    const isStart = offset === 0 || /[.!?]\s*$/.test(s.slice(0, offset));
    return isStart ? "Your" : "your";
  });

  // 3. Subject Name/The Candidate + Verbs
  function deinflectVerb(v: string): string {
    const lower = v.toLowerCase();
    if (lower === "is") return "are";
    if (lower === "was") return "were";
    if (lower === "has") return "have";
    if (lower === "does") return "do";
    if (lower === "doesn't" || lower === "doesnt") return "don't";
    if (lower === "communicates") return "communicate";
    if (lower === "outlines") return "outline";
    if (lower === "mentions") return "mention";
    if (lower === "demonstrates") return "demonstrate";
    if (lower === "highlights") return "highlight";
    if (lower === "describes") return "describe";
    if (lower === "provides") return "provide";
    if (lower === "shows") return "show";
    if (lower === "discusses") return "discuss";
    if (lower === "explains") return "explain";
    if (lower === "focuses") return "focus";
    if (lower === "covers") return "cover";
    if (lower === "emphasizes") return "emphasize";
    if (lower === "presents") return "present";
    if (lower === "states") return "state";
    if (lower === "articulates") return "articulate";
    if (lower === "details") return "detail";
    if (lower === "notes") return "note";
    if (lower === "identifies") return "identify";
    if (lower === "applies") return "apply";
    if (lower === "structures") return "structure";
    if (lower === "uses") return "use";
    if (lower === "builds") return "build";
    if (lower === "leverages") return "leverage";
    if (lower === "maintains") return "maintain";
    if (lower === "exhibits") return "exhibit";
    if (lower === "displays") return "display";
    if (lower === "lacks") return "lack";
    if (lower === "speaks") return "speak";
    if (lower === "walks") return "walk";
    if (lower === "shares") return "share";
    if (lower === "delivers") return "deliver";

    if (lower.endsWith("ies")) return lower.slice(0, -3) + "y";
    if (lower.endsWith("sses") || lower.endsWith("shes") || lower.endsWith("ches") || lower.endsWith("xes") || lower.endsWith("zes")) {
      return lower.slice(0, -2);
    }
    if (lower.endsWith("es") && (lower.endsWith("oes") || lower.endsWith("goes"))) {
      return lower.slice(0, -2);
    }
    if (lower.endsWith("s") && !lower.endsWith("ss")) {
      return lower.slice(0, -1);
    }
    return v;
  }

  // 3a. Name + does not / doesn't
  const doesNotRegex = new RegExp(`\\b${nameEntityPattern}\\s+(does\\s+not|doesn't)\\b`, "gi");
  s = s.replace(doesNotRegex, (match, negation, offset) => {
    const isStart = offset === 0 || /[.!?]\s*$/.test(s.slice(0, offset));
    const pronoun = isStart ? "You" : "you";
    const neg = negation.toLowerCase().includes("n't") ? "don't" : "do not";
    return `${pronoun} ${neg}`;
  });

  // 3b. Name + (adverb)? + verb
  const subjectVerbRegex = new RegExp(
    `\\b(${nameEntityPattern})\\s+((?:(?:effectively|clearly|strongly|briefly|also|consistently|adequately|partially|well|successfully)\\s+)?)([a-z]+)\\b`,
    "gi"
  );
  s = s.replace(subjectVerbRegex, (match, subj, adv, verb, offset) => {
    const isStart = offset === 0 || /[.!?]\s*$/.test(s.slice(0, offset));
    const pronoun = isStart ? "You" : "you";
    const newVerb = deinflectVerb(verb);
    return `${pronoun} ${adv || ""}${newVerb}`;
  });

  // 4. Pronouns: he / she / his / him / himself
  // "himself" / "herself" -> "yourself"
  s = s.replace(/\b(himself|herself)\b/gi, (match, reflexive, offset) => {
    const isStart = offset === 0 || /[.!?]\s*$/.test(s.slice(0, offset));
    return isStart ? "Yourself" : "yourself";
  });

  // "his" / "her" possessive
  s = s.replace(/\bhis\b/gi, (match, offset) => {
    const isStart = offset === 0 || /[.!?]\s*$/.test(s.slice(0, offset));
    return isStart ? "Your" : "your";
  });

  // "he does not" / "he doesn't"
  s = s.replace(/\b(he|she)\s+(does\s+not|doesn't)\b/gi, (match, subj, negation, offset) => {
    const isStart = offset === 0 || /[.!?]\s*$/.test(s.slice(0, offset));
    const pronoun = isStart ? "You" : "you";
    const neg = negation.toLowerCase().includes("n't") ? "don't" : "do not";
    return `${pronoun} ${neg}`;
  });

  // "he" / "she" + (adverb)? + verb
  s = s.replace(/\b(he|she)\s+((?:(?:effectively|clearly|strongly|briefly|also|consistently|adequately|partially|well|successfully)\s+)?)([a-z]+)\b/gi, (match, subj, adv, verb, offset) => {
    const isStart = offset === 0 || /[.!?]\s*$/.test(s.slice(0, offset));
    const pronoun = isStart ? "You" : "you";
    const newVerb = deinflectVerb(verb);
    return `${pronoun} ${adv || ""}${newVerb}`;
  });

  // Remaining standalone "he", "she", "him"
  s = s.replace(/\b(he|she|him)\b/gi, (match, pr, offset) => {
    const isStart = offset === 0 || /[.!?]\s*$/.test(s.slice(0, offset));
    return isStart ? "You" : "you";
  });

  // Any remaining occurrences of candidate name or "the candidate" / "the speaker"
  const remainingNameRegex = new RegExp(`\\b${nameEntityPattern}\\b`, "gi");
  s = s.replace(remainingNameRegex, (match, offset) => {
    const isStart = offset === 0 || /[.!?]\s*$/.test(s.slice(0, offset));
    return isStart ? "You" : "you";
  });

  // Handle "but does not" without explicit subject:
  // e.g. "You mention your involvement... but does not clearly define" -> "but do not clearly define"
  s = s.replace(/\b(but|and|yet)\s+does\s+not\b/gi, "$1 do not");
  s = s.replace(/\b(but|and|yet)\s+doesn't\b/gi, "$1 don't");

  // 5. Capitalize first letter of every sentence
  s = s.replace(/(?:^|[.!?]\s+)([a-z])/g, (m, char) => m.toUpperCase());

  // Clean up any double spaces
  s = s.replace(/\s{2,}/g, " ").trim();

  return s;
}

// ═════════════════════════════════════════════════════════════════════════════
//  SHORT COMPACT EMPTY EVALUATION POPUP CARD
// ═════════════════════════════════════════════════════════════════════════════

export function EmptyEvaluationCard() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center py-6 sm:py-10 px-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="w-full max-w-sm rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 text-center shadow-lg shadow-slate-900/5">
        <div className="mx-auto mb-2.5 flex size-9 items-center justify-center rounded-full bg-amber-50 border border-amber-200/80 text-amber-600">
          <MicOff size={16} strokeWidth={2.2} />
        </div>

        <h2 className="text-sm sm:text-base font-bold text-slate-900">
          No Evaluation Data Available
        </h2>

        <p className="mt-1 text-xs text-slate-600 leading-snug">
          No spoken responses were detected during this session. Please make sure to speak clearly and perform well in your assessment to receive an evaluation.
        </p>

        <div className="mt-3.5 flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigateToAssessmentType(router)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
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

  const candidateSpoke = hasRealSpeech(report);

  const hasIntroContent = hasExplainedIntroduction(report);
  const hasAiContent = hasExplainedAiEngineering(report);
  const hasSeContent = hasExplainedSoftwareEngineering(report);
  const hasAudioContent = hasExplainedAudio(report);
  const hasVideoContent = hasExplainedVideo(report);

  const candidateName = report.candidate_name || (report.assessment as any)?.candidate_name;

  // ── Introduction & Resume ──
  const introSection = intro_sections.find((s) =>
    [
      "career_story",
      "current_role",
      "current_project",
      "introduced_self",
      "career_arc_covered",
    ].includes(s.key)
  );
  const rawIntroObs =
    introSection?.observation ??
    final_assessment?.career_story ??
    final_assessment?.current_project_clarity ??
    undefined;
  const introResumeObs = isRealContent(rawIntroObs)
    ? formatFeedbackToSecondPerson(rawIntroObs, candidateName)
    : undefined;
  const introResumeBand = introSection?.status;

  // ── AI Engineering ──
  const aiEngSection = intro_sections.find((s) =>
    [
      "agentic_ai",
      "rag_and_retrieval",
      "models_and_ai_platforms",
      "rag_retrieval_chunking_mentioned",
      "ai_agents_multiagent_mentioned",
    ].includes(s.key)
  );
  const rawAiObs =
    aiEngSection?.observation ??
    final_assessment?.ai_engineering_depth ??
    report.technical_analysis?.summary;
  const aiEngObs = isRealContent(rawAiObs)
    ? formatFeedbackToSecondPerson(rawAiObs, candidateName)
    : undefined;
  const aiEngBand = aiEngSection?.status ?? scores.ai_engineering?.band;

  // ── Software Engineering ──
  const coreEngSection = intro_sections.find((s) =>
    [
      "software_engineering",
      "cloud_and_infrastructure",
      "cicd_and_delivery",
      "mcp_mentioned",
      "memory_context_engineering_mentioned",
    ].includes(s.key)
  );
  const rawCoreObs =
    coreEngSection?.observation ??
    final_assessment?.production_engineering_depth ??
    report.technical_analysis?.depth_assessment;
  const coreEngObs = isRealContent(rawCoreObs)
    ? formatFeedbackToSecondPerson(rawCoreObs, candidateName)
    : undefined;
  const coreEngBand = coreEngSection?.status ?? scores.core_engineering?.band;

  // ── Audio Analysis ──
  const rawAudioStrength =
    audio?.primary_vocal_strength?.toLowerCase() === "pace"
      ? "Speaking Speed"
      : audio?.primary_vocal_strength;

  const candidateAudioObservations = [
    audio?.executive_summary,
    rawAudioStrength,
    audio?.factors?.fluency?.observation,
    audio?.factors?.confidence_vocal_presence?.observation,
    report.non_technical?.communication_summary,
    report.non_technical?.confidence_notes,
  ];

  const firstRealAudioObs = candidateAudioObservations.find(
    (obs): obs is string => typeof obs === "string" && isRealContent(obs)
  );

  const rawAudioObs = firstRealAudioObs ? sanitizeQualitativeText(firstRealAudioObs) : undefined;
  const audioObs = isRealContent(rawAudioObs)
    ? formatFeedbackToSecondPerson(rawAudioObs, candidateName)
    : undefined;
  const audioBand = (audio?.overall_readiness && audio.overall_readiness !== "INSUFFICIENT_DATA")
    ? audio.overall_readiness
    : report.scores?.non_technical?.band;

  // ── Video Analysis ──
  const rawMediaType = (report.assessment.media_type || "").toUpperCase();
  const isAudioOnly =
    rawMediaType === "AUDIO" ||
    rawMediaType === "AUDIO_ONLY";

  const rawVideoObs = sanitizeQualitativeText(
    video?.overall_summary ??
    video?.primary_setup_strength ??
    video?.factors?.camera_framing_centering?.observation ??
    undefined
  );
  const videoObs = isRealContent(rawVideoObs)
    ? formatFeedbackToSecondPerson(rawVideoObs, candidateName)
    : undefined;
  const videoBand = video?.factors?.camera_framing_centering?.status;

  // ── Highlights Cards List (Filtered list built BEFORE rendering) ──
  const highlightCards: React.ReactNode[] = [];
  if (hasIntroContent) {
    highlightCards.push(
      <HighlightCard
        key="intro"
        icon={<User size={18} />}
        title="Introduction & Resume"
        observation={introResumeObs}
        status={introResumeBand}
      />
    );
  }
  if (hasAiContent) {
    highlightCards.push(
      <HighlightCard
        key="ai"
        icon={<Cpu size={18} />}
        title="AI Engineering"
        observation={aiEngObs}
        status={aiEngBand}
      />
    );
  }
  if (hasSeContent) {
    highlightCards.push(
      <HighlightCard
        key="se"
        icon={<Code2 size={18} />}
        title="Software Engineering"
        observation={coreEngObs}
        status={coreEngBand}
      />
    );
  }
  if (hasAudioContent) {
    highlightCards.push(
      <HighlightCard
        key="audio"
        icon={<AudioWaveform size={18} />}
        title="Audio Analysis"
        observation={audioObs}
        status={audioBand}
      />
    );
  }
  if (hasVideoContent) {
    highlightCards.push(
      <HighlightCard
        key="video"
        icon={<Video size={18} />}
        title="Video & On-Camera"
        observation={videoObs}
        status={videoBand}
      />
    );
  }

  // If candidate did not speak or there are no valid evaluated topics,
  // remove the middle cards (Overall Assessment, Highlights, Transcript, Tip)
  // and display the short popup-style empty state card instead:
  if (!candidateSpoke || highlightCards.length === 0) {
    return <EmptyEvaluationCard />;
  }

  const rawTip =
    final_assessment?.most_important_improvement ??
    priority_improvements[0]?.guidance ??
    coaching_suggestions.find((c) => c.priority === 1)?.suggestion ??
    coaching_suggestions[0]?.suggestion;

  const validPreviewSegments = candidateSpoke
    ? transcript.segments
      .filter((seg) => isRealContent(seg.text.replace(/<\/?s>/gi, "")))
      .slice(0, 5)
    : [];

  const hasRecording = Boolean(
    youtube_url &&
    youtube_url.trim().length > 0 &&
    youtube_url.trim().toLowerCase() !== "null" &&
    youtube_url.trim().toLowerCase() !== "undefined"
  );

  const durationStr = getTranscriptDuration(report);
  const durationSeconds = candidateSpoke
    ? report.audio?.recording_environment?.speaking_duration_seconds ||
      (report as any).audio_telemetry?.duration ||
      (report.transcript.segments.length > 0
        ? Math.max(...report.transcript.segments.map((s) => s.timestamp_s || 0))
        : 0) || 0
    : 0;


  const effectivePlaybackUrl =
    youtube_url ||
    (assessmentId
      ? `${(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api$/, "")}/api/aiprep/assessments/${assessmentId}/playback`
      : undefined);

  const validOverallSummary = isRealContent(overall_summary)
    ? formatFeedbackToSecondPerson(overall_summary, candidateName)
    : undefined;
  const rawOverallStatus = overall_readiness ?? scores.overall_band;
  const overallStatus = isPositiveStatus(rawOverallStatus) ? rawOverallStatus : undefined;

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
          {overallStatus && (
            <QualitativeBadge
              status={overallStatus}
            />
          )}
        </div>
        {validOverallSummary ? (
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-700">
            {validOverallSummary}
          </p>
        ) : (
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-700">
            Assessment evaluation based on the topics presented by the candidate.
          </p>
        )}
      </section>

      {/* ── 2. Evaluation Highlights (Dynamic Grid — only real candidate content) ── */}
      <section>
        <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          Evaluation Highlights
        </h2>
        {highlightCards.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {highlightCards}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 text-center shadow-xs">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              No evaluation highlights available. The candidate did not provide spoken responses for evaluation.
            </p>
          </div>
        )}
      </section>

      {/* ── 3. Recording Playback & Transcript Preview ── */}
      {Boolean(effectivePlaybackUrl) ? (
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
              <VideoPlayer
                youtubeUrl={effectivePlaybackUrl}
                videoRef={videoRef}
                isAudioOnly={isAudioOnly}
                candidateName={candidateName}
                durationSeconds={durationSeconds}
              />
            </div>
          </section>

          {/* RIGHT: Transcript Preview */}
          <section className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-slate-800">
                <FileText size={16} className="text-blue-600" />
                <h2 className="text-sm font-bold">Transcript Preview</h2>
                {durationStr && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <Clock size={11} className="text-blue-600" />
                    {durationStr}
                  </span>
                )}
              </div>
              {candidateSpoke && (
                <button
                  type="button"
                  onClick={() => onSelectTab("Details", "transcript")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  <ExternalLink size={12} />
                  Open Full Transcript
                </button>
              )}
            </div>

            {validPreviewSegments.length > 0 ? (
              <div className="flex-1 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {validPreviewSegments.map((seg, i) => {
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
            ) : candidateSpoke && transcript.full_text && isRealContent(transcript.full_text) ? (
              <div className="flex-1 max-h-52 overflow-y-auto pr-1 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap select-text">
                {transcript.full_text.replace(/<\/?s>/gi, "").trim()}
              </div>
            ) : (
              <p className="flex-1 text-xs text-slate-400 italic">
                No spoken transcript recorded for this session.
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
              {durationStr && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Clock size={12} className="text-blue-600" />
                  {durationStr}
                </span>
              )}
            </div>
            {candidateSpoke && (
              <button
                type="button"
                onClick={() => onSelectTab("Details", "transcript")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                <ExternalLink size={13} />
                Open Full Transcript
              </button>
            )}
          </div>

          {validPreviewSegments.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {validPreviewSegments.map((seg, i) => {
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
          ) : candidateSpoke && transcript.full_text && isRealContent(transcript.full_text) ? (
            <div className="max-h-32 overflow-y-auto pr-1 text-xs leading-snug text-slate-600 whitespace-pre-wrap select-text">
              {transcript.full_text.replace(/<\/?s>/gi, "").trim()}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No spoken transcript recorded for this session.
            </p>
          )}
        </section>
      )}

      {/* ── 4. Tip Banner (Full Width) — only shown when the LLM generated a tip ── */}
      {isRealContent(rawTip) && (
        <section className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-[#f0fdf4] p-4 shadow-2xs">
          <Lightbulb size={22} className="mt-0.5 shrink-0 text-emerald-600" />
          <div className="space-y-0.5 flex-1">
            <h3 className="text-sm font-bold text-slate-900">
              Tip
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              {formatFeedbackToSecondPerson(rawTip, candidateName)}
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

  const candidateSpoke = hasRealSpeech(report);
  const candidateName = report.candidate_name || (report.assessment as any)?.candidate_name;
  const rawMedia = (report.assessment.media_type || "").toUpperCase();
  const isAudioOnly =
    rawMedia === "AUDIO" ||
    rawMedia === "AUDIO_ONLY";

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
      .replace(/(?:^|\n|\r)\s*(?:Candidate|Speaker\s*\d*):\s*/gi, " ")
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
  if (hasExplainedIntroduction(report)) {
    const introObs: string[] = [];
    const careerStoryObs = getSecObs("career_story");
    if (careerStoryObs && isRealContent(careerStoryObs)) introObs.push(careerStoryObs);

    const currentRoleObs = getSecObs("current_role");
    if (currentRoleObs && isRealContent(currentRoleObs)) introObs.push(currentRoleObs);

    const currentProjObs = getSecObs("current_project");
    if (currentProjObs && isRealContent(currentProjObs)) introObs.push(currentProjObs);

    const rawIntroDesc =
      final_assessment?.career_story?.trim() ||
      intro_quality?.observation?.trim() ||
      careerStoryObs;
    const introDesc = isRealContent(rawIntroDesc) ? rawIntroDesc : undefined;
    const realIntroObs = introObs.filter(isRealContent);

    const introStatus = intro_sections.find((s) =>
      ["career_story", "current_role", "current_project"].includes(s.key) && isPositiveStatus(s.status)
    )?.status ?? (isPositiveStatus(scores.overall_band) ? scores.overall_band : undefined);

    if (introDesc || realIntroObs.length > 0) {
      sections.push({
        id: "intro",
        tabLabel: "Introduction",
        icon: <User size={16} className="text-blue-600" />,
        iconContainerClass: "bg-blue-50 text-blue-600 border-blue-100",
        title: "Introduction Evaluation (AI Engineering Focus)",
        status: introStatus,
        description: introDesc,
        observations: realIntroObs.length > 0 ? realIntroObs : undefined,
      });
    }
  }

  // 2. AI Engineering Concepts
  if (hasExplainedAiEngineering(report)) {
    const aiObs: string[] = [];
    const agenticSec = intro_sections.find((s) => s.key === "agentic_ai");
    const ragSec = intro_sections.find((s) => s.key === "rag_and_retrieval");
    const modelsSec = intro_sections.find((s) => s.key === "models_and_ai_platforms");

    const agenticObs = agenticSec?.observation?.trim();
    if (agenticObs && isRealContent(agenticObs)) aiObs.push(agenticObs);

    const ragObs = ragSec?.observation?.trim();
    if (ragObs && isRealContent(ragObs)) aiObs.push(ragObs);

    const modelsObs = modelsSec?.observation?.trim();
    if (modelsObs && isRealContent(modelsObs)) aiObs.push(modelsObs);

    if (technical_analysis?.strengths && technical_analysis.strengths.length > 0) {
      technical_analysis.strengths.forEach((s) => {
        if (s?.trim() && isRealContent(s.trim())) aiObs.push(s.trim());
      });
    }

    if (technical_analysis?.depth_assessment?.trim() && isRealContent(technical_analysis.depth_assessment.trim())) {
      aiObs.push(technical_analysis.depth_assessment.trim());
    }

    // Extract explicit AI Engineering Concept Coverage signals from backend LLM evaluation
    const aiConceptsList: { label: string; status: string }[] = [];
    [agenticSec, ragSec, modelsSec].forEach((sec) => {
      if (sec?.concepts) {
        Object.entries(sec.concepts).forEach(([conceptKey, conceptStatus]) => {
          if (conceptStatus && isPositiveStatus(String(conceptStatus))) {
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

    const rawAiDesc =
      final_assessment?.ai_engineering_depth?.trim() ||
      technical_analysis?.summary?.trim() ||
      agenticObs;
    const aiDesc = isRealContent(rawAiDesc) ? rawAiDesc : undefined;
    const realAiObs = aiObs.filter(isRealContent);

    const coveredAiConcepts = aiConceptsList.filter(
      (c) => c.status === "COVERED" || c.status === "PARTIAL"
    );
    const hasAiCustom = coveredAiConcepts.length > 0 || aiTechnologies.length > 0;

    const resolvedAiStatus =
      agenticSec?.status ||
      ragSec?.status ||
      modelsSec?.status ||
      scores.ai_engineering?.band;

    if (aiDesc || realAiObs.length > 0 || hasAiCustom) {
      sections.push({
        id: "ai_engineering",
        tabLabel: "AI Engineering",
        icon: <Cpu size={16} className="text-purple-600" />,
        iconContainerClass: "bg-purple-50 text-purple-600 border-purple-100",
        title: "AI Engineering Concepts",
        status: isPositiveStatus(resolvedAiStatus) ? resolvedAiStatus : undefined,
        description: aiDesc,
        observations: realAiObs.length > 0 ? realAiObs : undefined,
        customContent: hasAiCustom ? (
          <div className="space-y-1.5 pt-1">
            {coveredAiConcepts.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                  Concepts Covered:
                </span>
                {coveredAiConcepts.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium"
                  >
                    ✓ {c.label}
                  </span>
                ))}
              </div>
            )}
            {aiTechnologies.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                  Technologies:
                </span>
                {aiTechnologies.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : undefined,
      });
    }
  }

  // 3. Software Engineering / QA / Data / DevOps
  if (hasExplainedSoftwareEngineering(report)) {
    const seObs: string[] = [];
    const seSec = intro_sections.find((s) => s.key === "software_engineering");
    const cloudSec = intro_sections.find((s) => s.key === "cloud_and_infrastructure");
    const cicdSec = intro_sections.find((s) => s.key === "cicd_and_delivery");

    const seSectionObs = getSecObs("software_engineering");
    if (seSectionObs && isRealContent(seSectionObs)) seObs.push(seSectionObs);

    const cloudObs = getSecObs("cloud_and_infrastructure");
    if (cloudObs && isRealContent(cloudObs)) seObs.push(cloudObs);

    const cicdObs = getSecObs("cicd_and_delivery");
    if (cicdObs && isRealContent(cicdObs)) seObs.push(cicdObs);

    const rawSeDesc =
      final_assessment?.production_engineering_depth?.trim() ||
      seSectionObs ||
      cloudObs;
    const seDesc = isRealContent(rawSeDesc) ? rawSeDesc : undefined;
    const realSeObs = seObs.filter(isRealContent);

    const seConceptsList: { label: string; status: string }[] = [];
    [seSec, cloudSec, cicdSec].forEach((sec) => {
      if (sec?.concepts) {
        Object.entries(sec.concepts).forEach(([conceptKey, conceptStatus]) => {
          if (conceptStatus && isPositiveStatus(String(conceptStatus))) {
            seConceptsList.push({
              label: conceptKey.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              status: String(conceptStatus).toUpperCase(),
            });
          }
        });
      }
    });

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

    const coveredSeConcepts = seConceptsList.filter(
      (c) => c.status === "COVERED" || c.status === "PARTIAL"
    );
    const hasSeCustom = coveredSeConcepts.length > 0 || seTechnologies.length > 0;

    const resolvedSeStatus =
      seSec?.status ||
      cloudSec?.status ||
      cicdSec?.status ||
      scores.core_engineering?.band;

    if (seDesc || realSeObs.length > 0 || hasSeCustom) {
      sections.push({
        id: "software_engineering",
        tabLabel: "Software Engineering",
        icon: <Code2 size={16} className="text-blue-600" />,
        iconContainerClass: "bg-blue-50 text-blue-600 border-blue-100",
        title: "Software Engineering",
        status: isPositiveStatus(resolvedSeStatus) ? resolvedSeStatus : undefined,
        description: seDesc,
        observations: realSeObs.length > 0 ? realSeObs : undefined,
        customContent: hasSeCustom ? (
          <div className="space-y-1.5 pt-1">
            {coveredSeConcepts.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                  Concepts Covered:
                </span>
                {coveredSeConcepts.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium"
                  >
                    ✓ {c.label}
                  </span>
                ))}
              </div>
            )}
            {seTechnologies.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                  Technologies:
                </span>
                {seTechnologies.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : undefined,
      });
    }
  }

  // 4. Audio Analysis (Communication Skills)
  if (hasExplainedAudio(report)) {
    const audioObs: string[] = [];
    if (audio?.primary_vocal_strength && isRealContent(audio.primary_vocal_strength)) {
      const strength = audio.primary_vocal_strength.toLowerCase() === "pace" ? "Speaking Speed" : audio.primary_vocal_strength;
      audioObs.push(`Primary Strength: ${sanitizeQualitativeText(strength)}`);
    }
    if (audio?.key_findings && audio.key_findings.length > 0) {
      audio.key_findings.slice(0, 2).forEach((kf) => {
        const factorName = kf.factor.toLowerCase() === "pace" ? "Speaking Speed" : kf.factor;
        const cleanFinding = sanitizeQualitativeText(kf.finding);
        if (cleanFinding && isRealContent(cleanFinding)) audioObs.push(`${factorName}: ${cleanFinding}`);
      });
    }

    if (report.non_technical?.structure_quality && isRealContent(report.non_technical.structure_quality)) {
      audioObs.push(`Structure: ${report.non_technical.structure_quality}`);
    }
    if (report.non_technical?.confidence_notes && isRealContent(report.non_technical.confidence_notes)) {
      audioObs.push(`Confidence: ${report.non_technical.confidence_notes}`);
    }

    const paceStatus = audio?.factors?.pace?.status && audio.factors.pace.status !== "INSUFFICIENT_DATA" ? audio.factors.pace.status : undefined;
    const fluencyRating = audio?.factors?.fluency?.status && audio.factors.fluency.status !== "INSUFFICIENT_DATA" ? audio.factors.fluency.status : undefined;
    const fillerRating = audio?.factors?.filler_word_usage?.status && audio.factors.filler_word_usage.status !== "INSUFFICIENT_DATA" ? audio.factors.filler_word_usage.status : undefined;
    const vocalRating = (audio?.factors?.confidence_vocal_presence?.status && audio.factors.confidence_vocal_presence.status !== "INSUFFICIENT_DATA")
      ? audio.factors.confidence_vocal_presence.status
      : (audio?.factors?.volume?.status && audio.factors.volume.status !== "INSUFFICIENT_DATA" ? audio.factors.volume.status : undefined);

    const hasAnyMetric = Boolean(paceStatus || fluencyRating || fillerRating || vocalRating);
    const realAudioObs = audioObs.filter(isRealContent);
    const rawAudioDesc = (audio?.executive_summary && isRealContent(audio.executive_summary))
      ? sanitizeQualitativeText(audio.executive_summary)
      : (report.non_technical?.communication_summary && isRealContent(report.non_technical.communication_summary))
        ? sanitizeQualitativeText(report.non_technical.communication_summary)
        : undefined;
    const audioDesc = isRealContent(rawAudioDesc) ? rawAudioDesc : undefined;

    const audioStatus = (audio?.overall_readiness && audio.overall_readiness !== "INSUFFICIENT_DATA")
      ? audio.overall_readiness
      : report.scores?.non_technical?.band;

    if (audioDesc || realAudioObs.length > 0 || hasAnyMetric) {
      sections.push({
        id: "audio_analysis",
        tabLabel: "Audio Analysis",
        icon: <AudioWaveform size={16} className="text-amber-600" />,
        iconContainerClass: "bg-amber-50 text-amber-600 border-amber-100",
        title: "Audio Analysis (Communication Skills)",
        status: audioStatus,
        description: audioDesc,
        observations: realAudioObs.length > 0 ? realAudioObs : undefined,
        customContent: hasAnyMetric ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
            {paceStatus && (
              <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Speaking Pace</span>
                <QualitativeBadge status={paceStatus} />
              </div>
            )}
            {fluencyRating && (
              <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Fluency</span>
                <QualitativeBadge status={fluencyRating} />
              </div>
            )}
            {fillerRating && (
              <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Filler Words</span>
                <QualitativeBadge status={fillerRating} inverted />
              </div>
            )}
            {vocalRating && (
              <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Vocal Presence</span>
                <QualitativeBadge status={vocalRating} />
              </div>
            )}
          </div>
        ) : undefined,
      });
    }
  }

  // 5. Video Analysis (On-Camera Presentation) - Omit if audio only
  if (!isAudioOnly && hasExplainedVideo(report)) {
    const videoObs: string[] = [];
    if (video?.primary_setup_strength && isRealContent(video.primary_setup_strength)) {
      videoObs.push(`Setup Strength: ${sanitizeQualitativeText(video.primary_setup_strength)}`);
    }
    if (video?.key_findings && video.key_findings.length > 0) {
      video.key_findings.forEach((kf) => {
        const cleanFinding = sanitizeQualitativeText(kf.finding);
        if (cleanFinding && isRealContent(cleanFinding)) videoObs.push(`${kf.factor}: ${cleanFinding}`);
      });
    }

    const framingRating = video?.factors?.camera_framing_centering?.status && video.factors.camera_framing_centering.status !== "INSUFFICIENT_DATA" ? video.factors.camera_framing_centering.status : undefined;
    const gazeRating = video?.factors?.camera_angle_gaze_alignment?.status && video.factors.camera_angle_gaze_alignment.status !== "INSUFFICIENT_DATA" ? video.factors.camera_angle_gaze_alignment.status : undefined;
    const screenGazeRating = video?.factors?.off_screen_gaze_duration?.status && video.factors.off_screen_gaze_duration.status !== "INSUFFICIENT_DATA" ? video.factors.off_screen_gaze_duration.status : undefined;
    const tensionRating = video?.factors?.observable_physical_tension?.status && video.factors.observable_physical_tension.status !== "INSUFFICIENT_DATA" ? video.factors.observable_physical_tension.status : undefined;
    const hasVideoFactors = Boolean(framingRating || gazeRating || screenGazeRating || tensionRating);

    const realVideoObs = videoObs.filter(isRealContent);
    const rawVideoDesc = video?.overall_summary ? sanitizeQualitativeText(video.overall_summary) : undefined;
    const videoDesc = isRealContent(rawVideoDesc) ? rawVideoDesc : undefined;

    if (videoDesc || realVideoObs.length > 0 || hasVideoFactors) {
      sections.push({
        id: "video_analysis",
        tabLabel: "Video Presentation",
        icon: <Video size={16} className="text-rose-600" />,
        iconContainerClass: "bg-rose-50 text-rose-600 border-rose-100",
        title: "Video Analysis (On-Camera Presentation)",
        status: framingRating,
        description: videoDesc,
        observations: realVideoObs.length > 0 ? realVideoObs : undefined,
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
                <QualitativeBadge status={screenGazeRating} inverted />
              </div>
            )}
            {tensionRating && (
              <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2 text-center flex flex-col items-center justify-center gap-1">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Composure</span>
                <QualitativeBadge status={tensionRating} inverted />
              </div>
            )}
          </div>
        ) : undefined,
      });
    }
  }

  // 6. Transcript
  const transcriptDuration = getTranscriptDuration(report);
  if (candidateSpoke && isRealContent(fullParagraphText)) {
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
        </div>
      ),
    });
  }

  // 7. Additional Observations
  const addlObs: string[] = [];
  const hasAudioSection = sections.some((s) => s.id === "audio_analysis");
  const audioSectionDesc = sections.find((s) => s.id === "audio_analysis")?.description;
  const commSummaryUsedInAudio = Boolean(
    hasAudioSection &&
    report.non_technical?.communication_summary &&
    audioSectionDesc &&
    audioSectionDesc === sanitizeQualitativeText(report.non_technical.communication_summary)
  );

  if (!commSummaryUsedInAudio && report.non_technical?.communication_summary?.trim()) {
    const s = report.non_technical.communication_summary.trim();
    if (isRealContent(s)) addlObs.push(`Communication: ${s}`);
  }

  if (!hasAudioSection) {
    if (report.non_technical?.structure_quality?.trim()) {
      const s = report.non_technical.structure_quality.trim();
      if (isRealContent(s)) addlObs.push(`Structure: ${s}`);
    }
    if (report.non_technical?.confidence_notes?.trim()) {
      const s = report.non_technical.confidence_notes.trim();
      if (isRealContent(s)) addlObs.push(`Confidence: ${s}`);
    }
  }
  if (final_assessment?.transition_quality?.trim()) {
    const s = final_assessment.transition_quality.trim();
    if (isRealContent(s)) addlObs.push(`Transition Quality: ${s}`);
  }
  if (strongest_points && strongest_points.length > 0) {
    strongest_points.forEach((p) => {
      if (p?.trim() && isRealContent(p.trim())) addlObs.push(p.trim());
    });
  }

  const rawAddlDesc =
    !commSummaryUsedInAudio && report.non_technical?.communication_summary?.trim()
      ? report.non_technical.communication_summary.trim()
      : undefined;
  const addlDesc = isRealContent(rawAddlDesc) ? sanitizeQualitativeText(rawAddlDesc) : undefined;
  const realAddlObs = addlObs.filter(isRealContent);

  if (candidateSpoke && (addlDesc || realAddlObs.length > 0)) {
    sections.push({
      id: "additional_observations",
      tabLabel: "Additional Observations",
      icon: <ShieldCheck size={16} className="text-emerald-600" />,
      iconContainerClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
      title: "Additional Observations",
      status: report.scores?.non_technical?.band,
      description: addlDesc,
      observations: realAddlObs.length > 0 ? realAddlObs : undefined,
    });
  }

  // ── Post-Process: strip fallback content, format into second-person ("you" / "your") ──
  const filteredSections = useMemo(
    () =>
      sections
        .map((s) => ({
          ...s,
          description: isRealContent(s.description)
            ? formatFeedbackToSecondPerson(s.description, candidateName)
            : undefined,
          observations: s.observations
            ? s.observations
                .filter(isRealContent)
                .map((obs) => formatFeedbackToSecondPerson(obs, candidateName))
            : undefined,
        }))
        .filter((s) => {
          const hasText =
            !!s.description ||
            (Array.isArray(s.observations) && s.observations.length > 0);
          const hasCustom = s.customContent != null;
          return hasText || hasCustom;
        }),
    [sections, candidateName]
  );

  // ── Accordion State (Supports Independent Expansion & Expand/Collapse All) ──
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (initialSubTab && filteredSections.some((sec) => sec.id === initialSubTab)) {
      s.add(initialSubTab);
    } else if (filteredSections[0]?.id) {
      s.add(filteredSections[0].id);
    }
    return s;
  });

  const lastInitialSubTabRef = useRef(initialSubTab);
  const [hasExpandedInitial, setHasExpandedInitial] = useState(false);

  if (initialSubTab !== lastInitialSubTabRef.current) {
    lastInitialSubTabRef.current = initialSubTab;
    setHasExpandedInitial(false);
  }

  useEffect(() => {
    if (initialSubTab && !hasExpandedInitial) {
      if (filteredSections.some((s) => s.id === initialSubTab)) {
        setExpandedSectionIds((prev) => new Set(prev).add(initialSubTab));
        setHasExpandedInitial(true);
      }
    }
  }, [initialSubTab, filteredSections, hasExpandedInitial]);

  const toggleSection = (id: string) => {
    const isCurrentlyExpanded = expandedSectionIds.has(id);
    const willOpen = !isCurrentlyExpanded;

    // Mutually exclusive accordion: opening a card automatically closes the previous one
    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });

    // Smooth Auto-Scroll on Click: automatically scrolls card header to top of viewport
    if (willOpen && typeof window !== "undefined") {
      setTimeout(() => {
        const el = document.getElementById(`detail-section-${id}`);
        if (el) {
          const yOffset = -24; // breathing room above card header
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        }
      }, 60);
    }
  };

  const handleExpandAll = () => {
    setExpandedSectionIds(new Set(filteredSections.map((s) => s.id)));
  };

  const handleCollapseAll = () => {
    setExpandedSectionIds(new Set());
  };

  // Only consider topic evaluation sections (excluding transcript) to know if real evaluations exist
  const hasEvaluatedTopics = filteredSections.some((s) => s.id !== "transcript");

  // If candidate did not speak or there are no evaluated topics (only transcript or nothing),
  // display the short popup card:
  if (!candidateSpoke || filteredSections.length === 0 || !hasEvaluatedTopics) {
    return <EmptyEvaluationCard />;
  }

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {/* Top Toolbar: Expand All / Collapse All Controls */}
      <div className="flex items-center justify-end gap-2 pb-0.5 print:hidden">
        <button
          type="button"
          onClick={handleExpandAll}
          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 rounded-md border border-blue-200/80 bg-white transition-colors cursor-pointer shadow-2xs"
        >
          Expand All
        </button>
        <button
          type="button"
          onClick={handleCollapseAll}
          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-md border border-slate-200 bg-white transition-colors cursor-pointer shadow-2xs"
        >
          Collapse All
        </button>
      </div>

      {filteredSections.map((section) => {
        const isExpanded = expandedSectionIds.has(section.id);
        return (
          <div
            key={section.id}
            id={`detail-section-${section.id}`}
            className={`rounded-xl border bg-white shadow-xs overflow-hidden transition-all duration-200 ${
              isExpanded
                ? "border-blue-200/70 shadow-sm shadow-blue-500/5"
                : "border-slate-200/80"
            }`}
          >
            {/* ── Accordion Header ── */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleSection(section.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleSection(section.id);
                }
              }}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50/80 transition-colors cursor-pointer text-left select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${section.iconContainerClass}`}
                >
                  {section.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    {section.title}
                  </h3>
                  {!isExpanded && section.description && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-[200px] sm:max-w-md">
                      {section.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Transcript: inline Open button when collapsed */}
                {section.id === "transcript" && !isExpanded && fullParagraphText && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullTranscriptModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={11} />
                    Open Transcript
                  </button>
                )}
                {section.rightElement}
                {section.status && <QualitativeBadge status={section.status} />}
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>

            {/* ── Expanded Body ── */}
            {isExpanded && (
              <div className="px-3.5 pb-3 pt-1 border-t border-slate-100 space-y-2 animate-in fade-in-50 duration-150">
                {/* Description */}
                {section.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {section.description}
                  </p>
                )}

                {/* Key Observations */}
                {section.observations && section.observations.length > 0 && (
                  <div className="rounded-lg bg-[#f0f7ff] border border-blue-100/90 p-2.5 sm:p-3">
                    <h4 className="text-[11px] font-bold text-slate-900 mb-1">
                      Key Observations
                    </h4>
                    <ul className="space-y-1">
                      {section.observations.map((obs, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 text-xs text-slate-700"
                        >
                          <span className="text-blue-500 font-bold shrink-0 leading-none mt-0.5">
                            •
                          </span>
                          <span className="leading-snug">{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Custom Content */}
                {section.customContent}

                {/* Transcript: Open Full Transcript button (expanded state) */}
                {section.id === "transcript" && fullParagraphText && (
                  <button
                    type="button"
                    onClick={() => setShowFullTranscriptModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    Open Full Transcript
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Full Transcript Modal ── */}
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

export function navigateToAssessmentType(router: ReturnType<typeof useRouter>) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("aiprep_wizard_step", "CONFIGURATION");
      sessionStorage.removeItem("aiprep_active_id");
      window.dispatchEvent(
        new CustomEvent("aiprep-layout-mode", {
          detail: { active: true, step: "CONFIGURATION", slug: "assessment-type", isWizardActive: true },
        })
      );
    } catch {
      // Ignore storage errors
    }
  }
  router.push("/user_dashboard/ai-prep/assessment-type");
}

export function navigateToAssessmentsList(router: ReturnType<typeof useRouter>) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("aiprep_wizard_step");
      sessionStorage.removeItem("aiprep_active_id");
      sessionStorage.removeItem("aiprep_active_type");
      sessionStorage.removeItem("aiprep_active_mode");
      window.dispatchEvent(
        new CustomEvent("aiprep-layout-mode", {
          detail: { active: false, isWizardActive: false, headerCollapsed: false },
        })
      );
    } catch {
      // Ignore storage errors
    }

    if (document.referrer && document.referrer.includes("/avatar/assessments")) {
      router.push("/avatar/assessments");
      return;
    }
    if (document.referrer && document.referrer.includes("/aiprep/reports/dashboard")) {
      router.push("/aiprep/reports/dashboard");
      return;
    }
  }
  router.push("/user_dashboard/ai-prep/assessments");
}

export function ReportHeader({
  assessment,
  report,
  activeTab,
  onSelectTab,
}: ReportHeaderProps) {
  const router = useRouter();

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

  // Metadata formatting: Date and Time (e.g. "Aug 24, 2025 at 10:14 AM")
  const rawDate = assessment.completed_at || assessment.created_at;
  const completedDateStr = rawDate
    ? (() => {
        let dateStr = String(rawDate).trim();
        // If backend emits UTC SQL/ISO datetime without timezone suffix, treat as UTC
        if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(dateStr)) {
          dateStr = dateStr.replace(" ", "T") + "Z";
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return undefined;
        const datePart = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const timePart = d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return `${datePart} at ${timePart}`;
      })()
    : undefined;

  const durationStr = getTranscriptDuration(report) || undefined;

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
          onClick={() => navigateToAssessmentType(router)}
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

          const candidateSpoke = hasRealSpeech(report);
          const isDetailsDisabled = tab.label === "Details" && !candidateSpoke;

          return (
            <button
              key={tab.label}
              type="button"
              disabled={isDetailsDisabled}
              onClick={() => !isDetailsDisabled && onSelectTab(tab.label)}
              title={
                isDetailsDisabled
                  ? "Details are unavailable when no evaluation data is recorded"
                  : undefined
              }
              className={`pb-2.5 text-sm transition-colors ${
                isDetailsDisabled
                  ? "text-slate-300 cursor-not-allowed select-none"
                  : isEvaluation
                  ? "border-b-2 border-blue-600 font-bold text-blue-600 cursor-pointer"
                  : "font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
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
  candidateId?: string | number;
  initialTab?: ReportTab;
}

export default function AiPrepReport({
  assessmentId,
  candidateId: initialCandidateId,
  initialTab,
}: ShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [candidateId, setCandidateId] = useState<string | number | undefined>(
    initialCandidateId
  );

  useEffect(() => {
    if (initialCandidateId) {
      setCandidateId(initialCandidateId);
    }
  }, [initialCandidateId, setCandidateId]);

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

  useEffect(() => {
    if (report && !hasRealSpeech(report) && activeTab === "Details") {
      setActiveTab("Evaluation");
    }
  }, [report, activeTab, setActiveTab]);

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
      if (assessment.candidate_id) {
        setCandidateId(assessment.candidate_id);
      }
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

      const [dataRes, reportRes] = await window.Promise.allSettled([
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
      logger.error("[AiPrepReport] Failed to load real report:", err);
      setError("We couldn't load this assessment report.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId, setCandidateId, setLoading, setError, setIsProcessing, setStatusMsg, setReport]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Ensure document and body allow natural vertical scrolling for both Evaluation and Details pages.
  // Note: classList.remove for overflow-hidden is handled by the unified scroll-lock effect in app/layout.tsx.
  useEffect(() => {
    document.documentElement.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("height");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("height");

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new window.CustomEvent("aiprep-layout-mode", {
          detail: { active: false, fullscreen: false, isWizardActive: false, headerCollapsed: false, activeTab: "" },
        })
      );
    }
  }, []);

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
    // If candidate did not speak, Details tab is disabled
    if (tabLabel === "Details" && report && !hasRealSpeech(report)) {
      return;
    }
    setActiveTab(tabLabel);
    // When clicking Details directly, always default to "intro" (Introduction)
    const resolvedSubTab = subTab ?? (tabLabel === "Details" ? "intro" : undefined);
    if (resolvedSubTab) {
      setDetailsSubTab(resolvedSubTab);
    }
    const param = paramFromTab(tabLabel);
    const sectionParam = resolvedSubTab ? `&section=${resolvedSubTab}` : "";

    const isTwoSegmentRoute =
      typeof window !== "undefined" &&
      window.location.pathname.split("/").filter(Boolean).length === 4;

    const targetUrl = isTwoSegmentRoute && candidateId
      ? `/aiprep/reports/${candidateId}/${assessmentId}?tab=${param}${sectionParam}`
      : `/aiprep/reports/${assessmentId}?tab=${param}${sectionParam}`;
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
              onClick={() => navigateToAssessmentsList(router)}
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
              onClick={() => navigateToAssessmentsList(router)}
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 w-full space-y-3.5">
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