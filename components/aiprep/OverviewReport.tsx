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
  XCircle,
  Copy,
  Check,
  ChevronDown,
  MicOff,
  Cloud,
  GitBranch,
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
import { getUserTeamRole } from "@/utils/auth";
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

  let displayLabel = raw
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  if (raw === "NOT_APPLICABLE" || raw === "N/A") {
    displayLabel = "N/A";
  } else if (raw === "INSUFFICIENT_DATA") {
    displayLabel = "Insufficient Data";
  }

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

  if (inverted) {
    if (raw === "LOW" || raw === "MINIMAL") {
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (raw === "MODERATE") {
      colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (raw === "HIGH" || raw === "EXCESSIVE") {
      colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
    }
  } else {
    if (
      ["STRONG", "EXCELLENT", "GOOD", "COVERED", "POSITIVE"].includes(raw) ||
      raw.includes("STRONG") ||
      raw.includes("GOOD")
    ) {
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (["ADEQUATE"].includes(raw)) {
      colorClasses = "bg-teal-50 text-teal-700 border-teal-200";
    } else if (["NEEDS_POLISH", "PARTIAL", "MODERATE", "AVERAGE", "DEVELOPING"].includes(raw)) {
      colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (["WEAK", "NEEDS_IMPROVEMENT", "NEEDS_WORK", "POOR", "NEGATIVE"].includes(raw)) {
      colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
    } else if (["NOT_MENTIONED", "NOT_APPLICABLE", "N/A", "INSUFFICIENT_DATA"].includes(raw)) {
      colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
    }
  }

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
  // If LLM evaluation results exist (e.g., Scenario 4 where transcript consent was declined),
  // candidate spoke and evaluation was performed.
  if (
    isRealContent(report.overall_summary) ||
    (report.intro_sections && report.intro_sections.length > 0) ||
    Boolean(report.scores?.overall_band || report.scores?.ai_engineering?.band)
  ) {
    return true;
  }

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

// ─────────────────────────────────────────────────────────────────────────────
//  MODULE-LEVEL LOOKUP TABLES
//  Defined once at module scope so they are never recreated per render.
// ─────────────────────────────────────────────────────────────────────────────

/** Maps intro-section key → human-readable group label (used in "What You Missed") */
const CONCEPT_GROUP_LABEL: Readonly<Record<string, string>> = {
  agentic_ai:               "Agentic AI",
  rag_and_retrieval:        "RAG & Retrieval",
  models_and_ai_platforms:  "Models & AI Platforms",
  software_engineering:     "Software Engineering",
  cloud_and_infrastructure: "Cloud Technologies",
  cicd_and_delivery:        "DevOps & CI/CD",
};

/**
 * Maps individual concept keys (from the LLM JSON) → friendly display labels.
 * Covers every concept key defined in the intro prompt schema.
 */
const CONCEPT_LABEL: Readonly<Record<string, string>> = {
  // ── Agentic AI ──
  agentic_ai:           "Agentic AI",
  agent_framework:      "Agent Framework",
  orchestration:        "Orchestration",
  design_patterns:      "Design Patterns",
  agent_to_agent:       "Agent-to-Agent Communication",
  multi_agent:          "Multi-Agent Architecture",
  mcp:                  "MCP / Tool Calling",
  tool_calling:         "Tool Calling",
  memory_management:    "Memory Management",
  context_engineering:  "Context Engineering",
  evaluations:          "Evaluations",
  guardrails:           "Guardrails",
  observability:        "Observability / Tracing",
  governance:           "Governance",
  prompt_engineering:   "Prompt Engineering",
  reasoning_strategy:   "Reasoning Strategy",
  // ── RAG & Retrieval ──
  rag:                  "RAG",
  retrieval:            "Retrieval",
  ingestion:            "Data Ingestion",
  cleaning_preprocessing: "Cleaning & Preprocessing",
  chunking:             "Chunking",
  embeddings:           "Embeddings",
  vector_database:      "Vector Database",
  hybrid_retrieval:     "Hybrid Retrieval",
  reranking:            "Re-ranking",
  metadata_filtering:   "Metadata Filtering",
  knowledge_graph:      "Knowledge Graph",
  ontology:             "Ontology",
  query_optimization:   "Query Optimization",
  caching:              "Caching",
  retrieval_evaluation: "Retrieval Evaluation",
  // ── Software Engineering ──
  apis:                 "APIs / REST",
  api_gateway:          "API Gateway",
  fastapi:              "FastAPI",
  backend_services:     "Backend Services",
  microservices:        "Microservices",
  react_frontend:       "React / Frontend",
  sql_database:         "SQL Database",
  document_nosql_database: "NoSQL / Document DB",
  // ── DevOps & CI/CD ──
  cicd:                 "CI/CD Pipeline",
  github_actions:       "GitHub Actions",
  gitops:               "GitOps",
  automated_testing:    "Automated Testing",
  deployment_strategy:  "Deployment Strategy",
};

/**
 * Ordered list of technical section keys evaluated in "What You Missed".
 * Order determines the display sequence in the grouped concept pills.
 */
const TECHNICAL_SECTION_KEYS: readonly string[] = [
  "agentic_ai",
  "rag_and_retrieval",
  "models_and_ai_platforms",
  "software_engineering",
  "cloud_and_infrastructure",
  "cicd_and_delivery",
];

/** Section keys that belong to the Introduction evaluation block. */
const INTRO_SECTION_KEYS: readonly string[] = [
  "career_story",
  "current_role",
  "current_project",
  "introduced_self",
  "career_arc_covered",
];

/** Section keys that belong to the AI Engineering evaluation block. */
const AI_SECTION_KEYS: readonly string[] = [
  "agentic_ai",
  "rag_and_retrieval",
  "models_and_ai_platforms",
  "rag_retrieval_chunking_mentioned",
  "ai_agents_multiagent_mentioned",
];

/** Section keys that belong to Software Engineering (excludes Cloud & CI/CD). */
const SE_SECTION_KEYS: readonly string[] = [
  "software_engineering",
  "mcp_mentioned",
  "memory_context_engineering_mentioned",
];

/**
 * Common capitalized words that are NOT candidate names.
 * Used in formatFeedbackToSecondPerson to avoid false-positive name detection.
 */
const NON_NAME_WORDS = new Set([
  "the", "this", "that", "these", "those", "here", "there", "it", "they",
  "our", "your", "my", "each", "both", "section", "key", "overview",
  "however", "overall", "introduction", "audio", "video", "transcript",
  "summary", "assessment", "analysis", "evaluation", "feedback", "report",
]);


// ── Explicit Topic Detectors ─────────────────────────────────────────────────
export function hasExplainedIntroduction(report: NormalizedReport): boolean {
  if (!hasRealSpeech(report)) return false;

  const introSections = (report.intro_sections || []).filter((s) =>
    INTRO_SECTION_KEYS.includes(s.key)
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

  const aiSections = (report.intro_sections || []).filter((s) =>
    AI_SECTION_KEYS.includes(s.key)
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

  // Only pure SE keys (NOT cloud or cicd — those have their own helpers)
  const seSections = (report.intro_sections || []).filter((s) =>
    SE_SECTION_KEYS.includes(s.key)
  );

  const hasSeConcepts = seSections.some(
    (s) =>
      s.concepts &&
      Object.values(s.concepts).some((st) => isPositiveStatus(String(st)))
  );
  if (hasSeConcepts) return true;

  const hasEvidence = seSections.some(
    (s) => Array.isArray(s.evidence) && s.evidence.some((e) => e && e.trim().length > 0)
  );
  if (hasEvidence) return true;

  const techInv = report.technology_inventory;
  const seTech = [
    ...(techInv?.backend_and_api || []),
    ...(techInv?.frontend || []),
    ...(techInv?.databases || []),
  ].filter(Boolean);
  if (seTech.length > 0) return true;

  const hasSectionTech = seSections.some(
    (s) =>
      Array.isArray(s.technologies_mentioned) &&
      s.technologies_mentioned.filter(Boolean).length > 0
  );
  if (hasSectionTech) return true;

  const hasPositiveSecStatus = seSections.some((s) => isPositiveStatus(s.status));
  if (hasPositiveSecStatus) return true;

  const hasRealObs = seSections.some((s) => isRealContent(s.observation));
  if (hasRealObs) return true;

  if (isRealContent(report.final_assessment?.production_engineering_depth)) return true;

  return false;
}

export function hasExplainedCloud(report: NormalizedReport): boolean {
  if (!hasRealSpeech(report)) return false;

  const cloudSec = (report.intro_sections || []).find((s) => s.key === "cloud_and_infrastructure");

  if (cloudSec?.concepts && Object.values(cloudSec.concepts).some((st) => isPositiveStatus(String(st)))) return true;
  if (Array.isArray(cloudSec?.evidence) && cloudSec.evidence.some((e) => e && e.trim().length > 0)) return true;
  if (Array.isArray(cloudSec?.technologies_mentioned) && cloudSec.technologies_mentioned.filter(Boolean).length > 0) return true;
  if (isPositiveStatus(cloudSec?.status)) return true;
  if (isRealContent(cloudSec?.observation)) return true;

  const cloudTech = [
    ...(report.technology_inventory?.cloud || []),
    ...(report.technology_inventory?.containers_and_orchestration || []),
    ...(report.technology_inventory?.infrastructure_as_code || []),
  ].filter(Boolean);
  if (cloudTech.length > 0) return true;

  return false;
}

export function hasExplainedCicd(report: NormalizedReport): boolean {
  if (!hasRealSpeech(report)) return false;

  const cicdSec = (report.intro_sections || []).find((s) => s.key === "cicd_and_delivery");

  if (cicdSec?.concepts && Object.values(cicdSec.concepts).some((st) => isPositiveStatus(String(st)))) return true;
  if (Array.isArray(cicdSec?.evidence) && cicdSec.evidence.some((e) => e && e.trim().length > 0)) return true;
  if (Array.isArray(cicdSec?.technologies_mentioned) && cicdSec.technologies_mentioned.filter(Boolean).length > 0) return true;
  if (isPositiveStatus(cicdSec?.status)) return true;
  if (isRealContent(cicdSec?.observation)) return true;

  const cicdTech = [
    ...(report.technology_inventory?.cicd || []),
  ].filter(Boolean);
  if (cicdTech.length > 0) return true;

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
  // (module-level constant NON_NAME_WORDS used here — see top of file)

  // Dynamically detect names followed by 3rd-person verbs or adverbs
  // e.g. "Vishnu effectively communicates", "Vishnu demonstrates", "Vishnu mentions"
  const dynamicNameRegex =
    /\b([A-Z][a-z]{2,})\s+(?:(?:effectively|clearly|strongly|briefly|also|consistently|adequately|partially|well|successfully)\s+)?(?:communicates|outlines|mentions|demonstrates|highlights|describes|provides|shows|discusses|explains|focuses|covers|emphasizes|presents|states|articulates|details|notes|identifies|applies|structures|uses|builds|leverages|maintains|exhibits|displays|lacks|speaks|walks|shares|delivers)\b/g;
  let dynamicMatch: RegExpExecArray | null;
  while ((dynamicMatch = dynamicNameRegex.exec(s)) !== null) {
    const candidateWord = dynamicMatch[1];
    if (!NON_NAME_WORDS.has(candidateWord.toLowerCase())) {
      nameSet.add(candidateWord);
    }
  }

  // Also detect possessive name: "Vishnu's"
  const possessiveNameRegex = /\b([A-Z][a-z]{2,})'s\b/g;
  let possMatch: RegExpExecArray | null;
  while ((possMatch = possessiveNameRegex.exec(s)) !== null) {
    const candidateWord = possMatch[1];
    if (!NON_NAME_WORDS.has(candidateWord.toLowerCase())) {
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
  const searchParams = useSearchParams();
  const fromAvatar = searchParams.get("from") === "avatar";
  const userRole = typeof window !== "undefined" ? getUserTeamRole() : null;
  const isAdminSide =
    fromAvatar ||
    userRole === "admin" ||
    userRole === "employee" ||
    (typeof window !== "undefined" &&
      sessionStorage.getItem("aiprep_return_url")?.includes("avatar"));

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
          {isAdminSide
            ? "No spoken responses were detected during this candidate's session."
            : "No spoken responses were detected during this session. Please make sure to speak clearly and perform well in your assessment to receive an evaluation."}
        </p>

        <div className="mt-3.5 flex items-center justify-center">
          <button
            type="button"
            onClick={() =>
              isAdminSide
                ? navigateToAssessmentsList(router)
                : navigateToAssessmentType(router)
            }
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {isAdminSide ? "Assessment List" : "Start Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION B — EVALUATION TAB CONTENT
// ═════════════════════════════════════════════════════════════════════════════

// ── InsufficientEvaluationState ─────────────────────────────────────────────
// Shown on the Overview tab when report.insufficient_content === true.
// Does NOT display fake evaluation — just a clear, user-friendly message.
function InsufficientEvaluationState() {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-6 sm:p-8 text-center shadow-xs">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100 border border-amber-200 text-amber-600">
        <MicOff size={22} strokeWidth={2} />
      </div>
      <h2 className="text-base sm:text-lg font-bold text-slate-900">
        Evaluation Unavailable
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 max-w-md mx-auto">
        We don&apos;t have enough information to provide an evaluation for this
        assessment. Please ensure you speak clearly and provide a complete
        introduction during your next attempt.
      </p>
    </div>
  );
}

export interface OverviewProps {
  report: NormalizedReport;
  videoRef: RefObject<HTMLVideoElement | null>;
  seekTo: (seconds: number) => void;
  assessmentId: string;
  onSelectTab: (tab: ReportTab, subTab?: string) => void;
  onOpenTranscript?: () => void;
}

export function EvaluationContent({
  report,
  videoRef,
  seekTo,
  assessmentId,
  onSelectTab,
  onOpenTranscript,
}: OverviewProps) {
  const {
    youtube_url,
    overall_readiness,
    overall_summary,
    scores,
    intro_sections,
    audio,
    transcript,
    final_assessment,
    insufficient_content,
    consent,
  } = report;

  const candidateName = report.candidate_name || (report.assessment as any)?.candidate_name;

  // ── Consent-driven visibility ─────────────────────────────────────────────
  const canShowRecording = Boolean(consent?.save_recording ?? true);
  const canShowTranscript = Boolean(consent?.save_transcript ?? true);

  // ── Playback URL ──────────────────────────────────────────────────────────
  const effectivePlaybackUrl = canShowRecording
    ? (youtube_url ||
        (assessmentId
          ? `${(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api$/, "")}/api/aiprep/assessments/${assessmentId}/playback`
          : undefined))
    : undefined;

  // ── Duration ──────────────────────────────────────────────────────────────
  const durationStr = getTranscriptDuration(report);
  const durationSeconds =
    audio?.recording_environment?.speaking_duration_seconds ||
    (report as any).audio_telemetry?.duration ||
    (transcript.segments.length > 0
      ? Math.max(...transcript.segments.map((s) => s.timestamp_s || 0))
      : 0) || 0;

  // ── Media type ──
  const rawMediaType = (report.assessment.media_type || "").toUpperCase();
  const isAudioOnly = rawMediaType === "AUDIO" || rawMediaType === "AUDIO_ONLY";

  // ── Overall summary ───────────────────────────────────────────────────────
  const validOverallSummary = isRealContent(overall_summary)
    ? formatFeedbackToSecondPerson(overall_summary, candidateName)
    : undefined;
  const rawOverallStatus = overall_readiness ?? scores.overall_band;
  const overallStatus = isPositiveStatus(rawOverallStatus) ? rawOverallStatus : undefined;

  // ── Highlight card observations ───────────────────────────────────────────
  const introSection = intro_sections.find((s) => INTRO_SECTION_KEYS.includes(s.key));
  const rawIntroObs = introSection?.observation ?? final_assessment?.career_story ?? final_assessment?.current_project_clarity;
  const introObs = isRealContent(rawIntroObs) ? formatFeedbackToSecondPerson(rawIntroObs, candidateName) : undefined;
  const introBand = introSection?.status;

  const aiEngSection = intro_sections.find((s) => AI_SECTION_KEYS.includes(s.key));
  const rawAiObs = aiEngSection?.observation ?? final_assessment?.ai_engineering_depth ?? report.technical_analysis?.summary;
  const aiObs = isRealContent(rawAiObs) ? formatFeedbackToSecondPerson(rawAiObs, candidateName) : undefined;
  const aiEngBand = aiEngSection?.status ?? scores.ai_engineering?.band;

  const seSection = intro_sections.find((s) => SE_SECTION_KEYS.includes(s.key));
  const rawSeObs = seSection?.observation ?? final_assessment?.production_engineering_depth;
  const seObs = isRealContent(rawSeObs) ? formatFeedbackToSecondPerson(rawSeObs, candidateName) : undefined;
  const seBand = seSection?.status ?? scores.core_engineering?.band;

  const cloudSection = intro_sections.find((s) => s.key === "cloud_and_infrastructure");
  const rawCloudObs = cloudSection?.observation ?? "You covered key cloud & infrastructure technologies.";
  const cloudObs = isRealContent(rawCloudObs) ? formatFeedbackToSecondPerson(rawCloudObs, candidateName) : undefined;
  const cloudBand = cloudSection?.status;

  const cicdSection = intro_sections.find((s) => s.key === "cicd_and_delivery");
  const rawCicdObs = cicdSection?.observation ?? "You mentioned deployment and delivery practices.";
  const cicdObs = isRealContent(rawCicdObs) ? formatFeedbackToSecondPerson(rawCicdObs, candidateName) : undefined;
  const cicdBand = cicdSection?.status;

  const rawAudioObs = audio?.executive_summary ?? audio?.primary_vocal_strength;
  const audioObs = isRealContent(rawAudioObs) ? formatFeedbackToSecondPerson(sanitizeQualitativeText(rawAudioObs), candidateName) : undefined;
  const audioBand = (audio?.overall_readiness && audio.overall_readiness !== "INSUFFICIENT_DATA")
    ? audio.overall_readiness
    : scores.non_technical?.band;

  // Build the 6 Highlight Cards matching requirement (Intro, AI Eng, Software Eng, Cloud, DevOps, Audio):
  const highlightCards: React.ReactNode[] = [
    <HighlightCard
      key="intro"
      icon={<User size={18} />}
      title="Introduction & Resume"
      observation={introObs}
      status={introBand}
    />,
    <HighlightCard
      key="ai"
      icon={<Cpu size={18} />}
      title="AI Engineering"
      observation={aiObs}
      status={aiEngBand}
    />,
    <HighlightCard
      key="se"
      icon={<Code2 size={18} />}
      title="Software Engineering"
      observation={seObs}
      status={seBand}
    />,
    <HighlightCard
      key="cloud"
      icon={<Cloud size={18} />}
      title="Cloud Technologies"
      observation={cloudObs}
      status={cloudBand}
    />,
    <HighlightCard
      key="devops"
      icon={<GitBranch size={18} />}
      title="DevOps & CI/CD"
      observation={cicdObs}
      status={cicdBand}
    />,
    <HighlightCard
      key="audio"
      icon={<AudioWaveform size={18} />}
      title="Audio Analysis"
      observation={audioObs}
      status={audioBand}
    />,
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── 1. Overall Assessment (Wide Horizontal Card) ────────────────── */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-sm">✦</span>
            <h2 className="text-sm font-bold text-slate-900">Overall Assessment</h2>
          </div>
          {overallStatus && !insufficient_content && (
            <QualitativeBadge status={overallStatus} />
          )}
        </div>

        {insufficient_content ? (
          <InsufficientEvaluationState />
        ) : (
          <>
            {validOverallSummary ? (
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">{validOverallSummary}</p>
            ) : (
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 italic">
                Assessment evaluation based on the topics presented by the candidate.
              </p>
            )}
          </>
        )}
      </section>

      {/* ── 2. EVALUATION HIGHLIGHTS Grid — only when content is sufficient ── */}
      {!insufficient_content && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            EVALUATION HIGHLIGHTS
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {highlightCards}
          </div>
        </section>
      )}

      {/* ── 3. Recording Playback (Gated by consent.save_recording) ── */}
      {!insufficient_content && canShowRecording && effectivePlaybackUrl && (
        <section className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="mb-3 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2.5">
            {isAudioOnly ? (
              <AudioWaveform size={16} className="text-blue-600" />
            ) : (
              <Video size={16} className="text-blue-600" />
            )}
            <h2 className="text-sm font-bold">
              {isAudioOnly ? "Audio Recording Playback" : "Recording Playback"}
            </h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-1 sm:py-2">
            <div className="w-full max-w-2xl sm:max-w-3xl mx-auto">
              <VideoPlayer
                youtubeUrl={effectivePlaybackUrl}
                videoRef={videoRef}
                isAudioOnly={isAudioOnly}
                candidateName={candidateName}
                durationSeconds={durationSeconds}
              />
            </div>
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
  onOpenTranscript,
}: {
  report: NormalizedReport;
  seekTo: (seconds: number) => void;
  initialSubTab?: string;
  onOpenTranscript?: () => void;
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
        title: "Introduction Evaluation",
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

  // 3a. Software Engineering
  if (hasExplainedSoftwareEngineering(report)) {
    const seObs: string[] = [];
    const seSec = intro_sections.find((s) => s.key === "software_engineering");

    const seSectionObs = getSecObs("software_engineering");
    if (seSectionObs && isRealContent(seSectionObs)) seObs.push(seSectionObs);

    const rawSeDesc =
      final_assessment?.production_engineering_depth?.trim() ||
      seSectionObs;
    const seDesc = isRealContent(rawSeDesc) ? rawSeDesc : undefined;
    const realSeObs = seObs.filter(isRealContent);

    const seConceptsList: { label: string; status: string }[] = [];
    if (seSec?.concepts) {
      Object.entries(seSec.concepts).forEach(([conceptKey, conceptStatus]) => {
        if (conceptStatus && isPositiveStatus(String(conceptStatus))) {
          seConceptsList.push({
            label: conceptKey.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            status: String(conceptStatus).toUpperCase(),
          });
        }
      });
    }

    const seTechnologies = Array.from(
      new Set([
        ...(seSec?.technologies_mentioned || []),
        ...(report.technology_inventory?.backend_and_api || []),
        ...(report.technology_inventory?.frontend || []),
        ...(report.technology_inventory?.databases || []),
      ])
    ).filter(Boolean);

    const coveredSeConcepts = seConceptsList.filter(
      (c) => c.status === "COVERED" || c.status === "PARTIAL"
    );
    const hasSeCustom = coveredSeConcepts.length > 0 || seTechnologies.length > 0;

    const resolvedSeStatus = seSec?.status || scores.core_engineering?.band;

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

  // 3b. Cloud Technologies
  if (hasExplainedCloud(report)) {
    const cloudSec = intro_sections.find((s) => s.key === "cloud_and_infrastructure");
    const cloudObsText = getSecObs("cloud_and_infrastructure");
    const cloudObs: string[] = [];
    if (cloudObsText && isRealContent(cloudObsText)) cloudObs.push(cloudObsText);

    const cloudConceptsList: { label: string; status: string }[] = [];
    if (cloudSec?.concepts) {
      Object.entries(cloudSec.concepts).forEach(([conceptKey, conceptStatus]) => {
        if (conceptStatus && isPositiveStatus(String(conceptStatus))) {
          cloudConceptsList.push({
            label: conceptKey.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            status: String(conceptStatus).toUpperCase(),
          });
        }
      });
    }

    const cloudTechnologies = Array.from(
      new Set([
        ...(cloudSec?.technologies_mentioned || []),
        ...(report.technology_inventory?.cloud || []),
        ...(report.technology_inventory?.containers_and_orchestration || []),
        ...(report.technology_inventory?.infrastructure_as_code || []),
      ])
    ).filter(Boolean);

    const coveredCloudConcepts = cloudConceptsList.filter(
      (c) => c.status === "COVERED" || c.status === "PARTIAL"
    );
    const hasCloudCustom = coveredCloudConcepts.length > 0 || cloudTechnologies.length > 0;
    const cloudDesc = isRealContent(cloudObsText) ? cloudObsText : undefined;
    const realCloudObs = cloudObs.filter(isRealContent);

    if (cloudDesc || realCloudObs.length > 0 || hasCloudCustom) {
      sections.push({
        id: "cloud_technologies",
        tabLabel: "Cloud",
        icon: <Cloud size={16} className="text-sky-600" />,
        iconContainerClass: "bg-sky-50 text-sky-600 border-sky-100",
        title: "Cloud Technologies",
        status: isPositiveStatus(cloudSec?.status) ? cloudSec?.status : undefined,
        description: cloudDesc,
        observations: realCloudObs.length > 0 ? realCloudObs : undefined,
        customContent: hasCloudCustom ? (
          <div className="space-y-1.5 pt-1">
            {coveredCloudConcepts.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                  Concepts Covered:
                </span>
                {coveredCloudConcepts.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium"
                  >
                    ✓ {c.label}
                  </span>
                ))}
              </div>
            )}
            {cloudTechnologies.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                  Technologies:
                </span>
                {cloudTechnologies.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-mono font-medium"
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

  // 3c. DevOps & CI/CD
  if (hasExplainedCicd(report)) {
    const cicdSec = intro_sections.find((s) => s.key === "cicd_and_delivery");
    const cicdObsText = getSecObs("cicd_and_delivery");
    const cicdObs: string[] = [];
    if (cicdObsText && isRealContent(cicdObsText)) cicdObs.push(cicdObsText);

    const cicdConceptsList: { label: string; status: string }[] = [];
    if (cicdSec?.concepts) {
      Object.entries(cicdSec.concepts).forEach(([conceptKey, conceptStatus]) => {
        if (conceptStatus && isPositiveStatus(String(conceptStatus))) {
          cicdConceptsList.push({
            label: conceptKey.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            status: String(conceptStatus).toUpperCase(),
          });
        }
      });
    }

    const cicdTechnologies = Array.from(
      new Set([
        ...(cicdSec?.technologies_mentioned || []),
        ...(report.technology_inventory?.cicd || []),
      ])
    ).filter(Boolean);

    const coveredCicdConcepts = cicdConceptsList.filter(
      (c) => c.status === "COVERED" || c.status === "PARTIAL"
    );
    const hasCicdCustom = coveredCicdConcepts.length > 0 || cicdTechnologies.length > 0;
    const cicdDesc = isRealContent(cicdObsText) ? cicdObsText : undefined;
    const realCicdObs = cicdObs.filter(isRealContent);

    if (cicdDesc || realCicdObs.length > 0 || hasCicdCustom) {
      sections.push({
        id: "devops_cicd",
        tabLabel: "DevOps & CI/CD",
        icon: <GitBranch size={16} className="text-orange-600" />,
        iconContainerClass: "bg-orange-50 text-orange-600 border-orange-100",
        title: "DevOps & CI/CD",
        status: isPositiveStatus(cicdSec?.status) ? cicdSec?.status : undefined,
        description: cicdDesc,
        observations: realCicdObs.length > 0 ? realCicdObs : undefined,
        customContent: hasCicdCustom ? (
          <div className="space-y-1.5 pt-1">
            {coveredCicdConcepts.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                  Concepts Covered:
                </span>
                {coveredCicdConcepts.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium"
                  >
                    ✓ {c.label}
                  </span>
                ))}
              </div>
            )}
            {cicdTechnologies.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                  Technologies:
                </span>
                {cicdTechnologies.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-mono font-medium"
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
    } else if (filteredSections.some((sec) => sec.id === "what_you_missed")) {
      // Auto-open "What You Missed" when present — it's the most actionable feedback
      s.add("what_you_missed");
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
                      onOpenTranscript?.();
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TranscriptModal({
  isOpen,
  onClose,
  report,
}: {
  isOpen: boolean;
  onClose: () => void;
  report: NormalizedReport;
}) {
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const canShowTranscript = Boolean(report.consent?.save_transcript ?? true);

  if (!isOpen || !canShowTranscript) return null;

  const fullParagraphText = (() => {
    let raw = report.transcript?.full_text?.trim() || "";
    if (!raw && report.transcript?.segments && report.transcript.segments.length > 0) {
      raw = report.transcript.segments.map((s) => s.text).join(" ");
    }
    return raw
      .replace(/<\/?s>/gi, "")
      .replace(/(?:^|\n|\r)\s*(?:Candidate|Speaker\s*\d*):\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  })();

  const transcriptDuration = getTranscriptDuration(report);

  const handleCopyTranscript = () => {
    if (fullParagraphText) {
      navigator.clipboard.writeText(fullParagraphText);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  return (
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
            onClick={onClose}
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
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap select-text">
              {fullParagraphText || "No transcript recorded for this assessment."}
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION D — REPORT HEADER (Back link, Title, Metadata row, Tabs)
// ═════════════════════════════════════════════════════════════════════════════

export interface ReportHeaderProps {
  assessment: AssessmentDetail;
  report: NormalizedReport;
  activeTab: ReportTab;
  onSelectTab: (tab: ReportTab) => void;
  onOpenTranscript?: () => void;
}

export function getAssessmentsListUrl(): string {
  if (typeof window !== "undefined") {
    // 1. Query parameter check (e.g. ?from=avatar or ?from=/avatar/assessments)
    const searchParams = new URLSearchParams(window.location.search);
    const fromParam = searchParams.get("from");
    if (fromParam === "avatar" || fromParam?.includes("avatar")) {
      return "/avatar/assessments";
    }
    if (fromParam && fromParam.startsWith("/")) {
      return fromParam;
    }

    // 2. Explicit return URL stored in sessionStorage
    const stored = sessionStorage.getItem("aiprep_return_url");
    if (stored) {
      return stored;
    }

    // 3. Document referrer check
    if (document.referrer) {
      if (document.referrer.includes("/avatar/assessments") || document.referrer.includes("/avatar")) {
        return "/avatar/assessments";
      }
      if (document.referrer.includes("/aiprep/reports/dashboard")) {
        return "/aiprep/reports/dashboard";
      }
    }

    // 4. Role-based fallback: employees and admins belong in avatar/assessments
    try {
      const role = getUserTeamRole();
      if (role === "employee" || role === "admin" || role === "instructor") {
        return "/avatar/assessments";
      }
    } catch {
      // fallback
    }
  }
  return "/user_dashboard/ai-prep/assessments";
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

    const role = getUserTeamRole();
    if (role === "employee" || role === "admin") {
      router.push("/avatar/assessments");
      return;
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

    const targetUrl = getAssessmentsListUrl();
    router.push(targetUrl);
    return;
  }
  router.push("/avatar/assessments");
}

export function ReportHeader({
  assessment,
  report,
  activeTab,
  onSelectTab,
  onOpenTranscript,
}: ReportHeaderProps) {
  const router = useRouter();
  const candidateSpoke = hasRealSpeech(report);

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

  return (
    <header className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs mb-4 sm:mb-5 print:border-none print:shadow-none print:p-0">
      {/* Top Row: Back link + Optional View Transcript Popup button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigateToAssessmentsList(router)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors print:hidden cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Assessments
        </button>

        {Boolean(report.consent?.save_transcript ?? true) && !report.insufficient_content && candidateSpoke && onOpenTranscript && (
          <button
            type="button"
            onClick={onOpenTranscript}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-2xs hover:bg-violet-100 hover:border-violet-300 transition-colors cursor-pointer print:hidden ml-auto"
          >
            <FileText size={14} className="text-violet-600" />
            View Transcript
          </button>
        )}
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
  const [isCancelled, setIsCancelled] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

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

  const lastLoadedIdRef = useRef<string | null>(null);

  // Fetch real report data (single consolidated GET call)
  const loadReport = useCallback(async () => {
    if (!assessmentId) return;
    if (lastLoadedIdRef.current === String(assessmentId)) return;
    lastLoadedIdRef.current = String(assessmentId);

    setLoading(true);
    setError("");
    setIsProcessing(false);
    setIsCancelled(false);
    setStatusMsg("");

    try {
      const assessment = await aiPrepApi.getAssessment(assessmentId);
      if (assessment.candidate_id) {
        setCandidateId(assessment.candidate_id);
      }
      const statusUpper = (assessment.status || "").toUpperCase();

      // ── Scenario 6: Cancelled assessment ───────────────────────────────────
      if (statusUpper === "CANCELLED") {
        setIsCancelled(true);
        setLoading(false);
        return;
      }

      // ── Still processing — LLM pipeline not yet complete ───────────────────
      if (
        ["EVALUATING", "IN_PROGRESS", "SUBMITTED", "PENDING"].includes(
          statusUpper
        ) &&
        !assessment.report
      ) {
        setIsProcessing(true);
        setStatusMsg("Your assessment report is still being prepared.");
        setLoading(false);
        return;
      }

      const dataVal = (assessment.data as any) || null;
      const reportVal = (assessment.report as any) || null;

      if (!reportVal && !assessment.report) {
        setError(
          statusUpper === "FAILED"
            ? "Assessment evaluation could not be completed."
            : "We couldn't load this assessment report."
        );
        setLoading(false);
        return;
      }

      // ── Scenarios 1–5: normalise the report (consent + insufficient flags ──
      // consent.save_recording and consent.save_transcript drive what is shown.
      // insufficient_content drives the Scenario 5 single-page banner.
      setReport(normalizeReport(assessment, dataVal, reportVal));
    } catch (err: unknown) {
      console.error("[AiPrepReport] Failed to load real report:", err);
      setError("We couldn't load this assessment report.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId, setCandidateId, setLoading, setError, setIsProcessing, setIsCancelled, setStatusMsg, setReport]);

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

  // ── Scenario 6: Cancelled assessment ──────────────────────────────────────
  if (isCancelled) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f8fafc] p-6">
        <section className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <XCircle size={30} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Assessment Cancelled</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            You exited this assessment before completing it. No evaluation report is available for this attempt.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            You can start a new assessment from your assessments list whenever you are ready.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigateToAssessmentsList(router)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
            >
              Back to Assessments
            </button>
          </div>
        </section>
      </main>
    );
  }

  // ── Processing state (Evaluating) ─────────────────────────────────────────
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
              onClick={() => { lastLoadedIdRef.current = null; loadReport(); }}
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
          onOpenTranscript={() => setIsTranscriptModalOpen(true)}
        />

        <main className="space-y-3 sm:space-y-3.5">
          {isEvaluationTab ? (
            <EvaluationContent
              report={report}
              videoRef={videoRef}
              seekTo={seekTo}
              assessmentId={assessmentId}
              onSelectTab={handleTabChange}
              onOpenTranscript={() => setIsTranscriptModalOpen(true)}
            />
          ) : (
            <DetailsContent
              report={report}
              seekTo={seekTo}
              initialSubTab={detailsSubTab}
              onOpenTranscript={() => setIsTranscriptModalOpen(true)}
            />
          )}
        </main>
      </div>

      <TranscriptModal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        report={report}
      />
    </div>
  );
}