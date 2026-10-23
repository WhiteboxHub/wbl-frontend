"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  OverviewReport.tsx
//  AI Prep Assessment Report – Overview + Details Redesign
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useRef, useCallback, useMemo, memo, type RefObject } from "react";
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
  FileText,
  Copy,
  Check,
  ChevronDown,
  MicOff,
  Cloud,
  GitBranch,
  Star,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Sparkles,
  ExternalLink,
  X,
  Target,
  Layers,
  Boxes,
  Briefcase,
} from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";
import {
  normalizeReport,
  type NormalizedReport,
  type JdRequirementCoverageItem,
} from "@/types/aiprep-report";
import type { AssessmentDetail } from "@/types/aiprep";
import {
  REPORT_TABS,
  tabFromParam,
  type ReportTab,
} from "./report-tabs";
import { getUserTeamRole } from "@/utils/auth";
import VideoPlayer from "./VideoPlayer";
import TechnicalEvaluationView from "./TechnicalEvaluationView";

export type { ReportTab };

// ═════════════════════════════════════════════════════════════════════════════
//  CONCEPT LABELS & MAPPING UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

const CONCEPT_LABEL_MAP: Readonly<Record<string, string>> = {
  // ── Agentic AI ──
  agentic_ai: "Agentic AI",
  agent_framework: "Agent Framework",
  orchestration: "Orchestration",
  design_patterns: "Design Patterns",
  agent_to_agent: "Agent-to-Agent",
  multi_agent: "Multi-Agent",
  mcp: "MCP",
  tool_calling: "Tool Calling",
  memory_management: "Memory Management",
  context_engineering: "Context Engineering",
  evaluations: "Evaluations",
  guardrails: "Guardrails",
  observability: "Observability",
  governance: "Governance",
  prompt_engineering: "Prompt Engineering",
  reasoning_strategy: "Reasoning Strategy",

  // ── RAG & Retrieval ──
  rag: "RAG",
  retrieval: "Retrieval",
  ingestion: "Ingestion",
  cleaning_preprocessing: "Cleaning / Preprocessing",
  chunking: "Chunking",
  embeddings: "Embeddings",
  vector_database: "Vector Database",
  hybrid_retrieval: "Hybrid Retrieval",
  reranking: "Reranking",
  metadata_filtering: "Metadata Filtering",
  knowledge_graph: "Knowledge Graph",
  ontology: "Ontology",
  query_optimization: "Query Optimization",
  caching: "Caching",
  retrieval_evaluation: "Retrieval Evaluation",

  // ── Software Engineering ──
  apis: "APIs",
  api_gateway: "API Gateway",
  fastapi: "FastAPI",
  backend_services: "Backend Services",
  microservices: "Microservices",
  react_frontend: "React Frontend",
  sql_database: "SQL Database",
  document_nosql_database: "Document / NoSQL DB",

  // ── DevOps & CI/CD ──
  cicd: "CI/CD",
  github_actions: "GitHub Actions",
  gitops: "GitOps",
  automated_testing: "Automated Testing",
  deployment_strategy: "Deployment Strategy",

  // ── Models & AI Platforms ──
  model_selection_or_routing: "Model Selection / Routing",
  model_registry: "Model Registry",

  // ── Cloud ──
  cloud_providers: "Cloud Providers",
  compute_services: "Compute Services",
  container_platforms: "Container Platforms",
  storage_services: "Storage Services",
  ai_cloud_services: "AI Cloud Services",
  infrastructure_tools: "Infrastructure Tools",
  docker: "Docker",
  kubernetes: "Kubernetes",
  containerization: "Containerization",
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  terraform: "Terraform",
};

export function getConceptLabel(key: string): string {
  if (CONCEPT_LABEL_MAP[key]) return CONCEPT_LABEL_MAP[key];
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}


// ═════════════════════════════════════════════════════════════════════════════
//  QUALITATIVE BADGE (STATUS PILL)
// ═════════════════════════════════════════════════════════════════════════════

export function JdFitBadge({ fit, size = "md" }: { fit?: string; size?: "sm" | "md" }) {
  if (!fit) return null;
  const raw = fit.toUpperCase().trim();
  let label = raw.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  let classes = "bg-slate-100 text-slate-700 border-slate-200";

  if (raw === "STRONG_FIT" || raw === "STRONG") {
    label = "Strong Fit";
    classes = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (raw === "GOOD_FIT" || raw === "GOOD") {
    label = "Good Fit";
    classes = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (raw === "PARTIAL_FIT" || raw === "PARTIAL") {
    label = "Partial Fit";
    classes = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (raw === "WEAK_FIT" || raw === "WEAK") {
    label = "Weak Fit";
    classes = "bg-rose-50 text-rose-700 border-rose-200";
  }

  const px = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold border shadow-2xs ${px} ${classes}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

export function MatchBadge({ matchType }: { matchType?: string }) {
  if (!matchType) return null;
  const raw = matchType.toUpperCase().trim();
  let label = raw;
  let classes = "bg-slate-50 text-slate-600 border-slate-200";

  if (raw === "EXACT") {
    label = "Exact Match";
    classes = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (raw === "EQUIVALENT") {
    label = "Equivalent";
    classes = "bg-sky-50 text-sky-700 border-sky-200";
  } else if (raw === "RELATED") {
    label = "Related Experience";
    classes = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (raw === "NONE") {
    label = "No Match";
    classes = "bg-slate-100 text-slate-500 border-slate-200";
  }

  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${classes}`}>
      {label}
    </span>
  );
}

export function SeniorityBadge({ match }: { match?: string }) {
  if (!match) return null;
  const raw = match.toUpperCase().trim();
  let label = raw.replaceAll("_", " ");
  let classes = "bg-slate-50 text-slate-600 border-slate-200";

  if (raw === "MATCHES" || raw === "MATCH") {
    label = "Matches Target Level";
    classes = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (raw === "BELOW_TARGET") {
    label = "Below Target Level";
    classes = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (raw === "ABOVE_TARGET") {
    label = "Above Target Level";
    classes = "bg-purple-50 text-purple-700 border-purple-200";
  } else if (raw === "UNCLEAR") {
    label = "Seniority Unclear";
    classes = "bg-slate-100 text-slate-600 border-slate-200";
  }

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${classes}`}>
      {label}
    </span>
  );
}

export function SuggestedOpeningCard({ opening }: { opening?: { note?: string; example?: string } }) {
  const [copied, setCopied] = useState(false);
  if (!opening?.example) return null;

  const handleCopy = () => {
    if (opening.example) {
      navigator.clipboard.writeText(opening.example);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 p-3.5 sm:p-4 shadow-2xs">
      <div className="flex items-center justify-between gap-2 border-b border-indigo-100/80 pb-2 mb-2.5">
        <div className="flex items-center gap-2 text-indigo-700">
          <div className="p-1 rounded-lg bg-indigo-100/80 border border-indigo-200">
            <Sparkles size={15} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Suggested Opening Pitch
            </h3>
            <p className="text-[11px] text-indigo-700/80">
              {opening.note || "Built strictly from facts you stated in the transcript, tightened to fit this JD."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-600" />
              <span className="text-emerald-700 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy Opening</span>
            </>
          )}
        </button>
      </div>
      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic bg-white/90 p-3 rounded-lg border border-indigo-100 shadow-2xs">
        "{opening.example}"
      </p>
    </section>
  );
}

const QualitativeBadge = memo(function QualitativeBadge({
  status,
  inverted = false,
  size = "md",
}: {
  status?: string;
  inverted?: boolean;
  size?: "sm" | "md";
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
  } else if (raw === "NOT_MENTIONED") {
    displayLabel = "Not Mentioned";
  } else if (raw === "NEEDS_POLISH") {
    displayLabel = "Needs Polish";
  }

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

  if (inverted) {
    if (raw === "LOW" || raw === "MINIMAL") {
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (raw === "MODERATE" || raw === "MEDIUM") {
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
      colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
    } else if (["NEEDS_POLISH", "PARTIAL", "MODERATE", "AVERAGE", "DEVELOPING"].includes(raw)) {
      colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (["WEAK", "NEEDS_IMPROVEMENT", "NEEDS_WORK", "POOR", "NEGATIVE"].includes(raw)) {
      colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
    } else if (["NOT_MENTIONED", "NOT_APPLICABLE", "N/A", "INSUFFICIENT_DATA"].includes(raw)) {
      colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
    }
  }

  const px = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${px} ${colorClasses}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {displayLabel}
    </span>
  );
});

// ═════════════════════════════════════════════════════════════════════════════
//  CONCEPT STATUS ITEM (CHECKLIST BADGE)
// ═════════════════════════════════════════════════════════════════════════════

function ConceptStatusItem({
  label,
  status,
}: {
  label: string;
  status?: string;
}) {
  const st = (status || "NOT_MENTIONED").toUpperCase().trim();

  let icon = <X size={11} className="text-rose-500 shrink-0" />;
  let badgeClasses = "bg-rose-50 text-rose-700 border-rose-200";
  let displayStatus = "Not Mentioned";

  if (st === "COVERED" || st === "STRONG" || st === "GOOD" || st === "EXCELLENT") {
    icon = <Check size={11} className="text-emerald-600 shrink-0 stroke-[3]" />;
    badgeClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
    displayStatus = "Covered";
  } else if (st === "PARTIAL" || st === "MODERATE" || st === "NEEDS_POLISH") {
    icon = <AlertTriangle size={11} className="text-amber-600 shrink-0" />;
    badgeClasses = "bg-amber-50 text-amber-700 border-amber-200";
    displayStatus = "Partial";
  } else if (st === "NOT_APPLICABLE" || st === "N/A") {
    icon = <span className="text-slate-400 font-bold shrink-0 text-[10px]">-</span>;
    badgeClasses = "bg-slate-100 text-slate-500 border-slate-200";
    displayStatus = "N/A";
  }

  return (
    <div className="flex items-center justify-between gap-1.5 p-1.5 px-2 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-1.5 min-w-0">
        {icon}
        <span className="text-[11px] font-medium text-slate-800 truncate">{label}</span>
      </div>
      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold border shrink-0 ${badgeClasses}`}>
        {displayStatus}
      </span>
    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
//  TEXT SANITIZATION & CONTENT FILTERING
// ═════════════════════════════════════════════════════════════════════════════

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
  /^(the\s+)?(candidate|speaker)\s+is\s+answering\s+technical/i,
  /thank\s+you\s+for\s+watching/i,
  /thanks\s+for\s+watching/i,
  /please\s+(like\s+and\s+)?subscribe/i,
  /^(thank\s+you|thanks\s+for\s+watching)\.?$/i,
];

function isRealContent(text?: string | null): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 8) return false;
  return !EMPTY_FALLBACK_PATTERNS.some((p) => p.test(t));
}

function isEvaluatorSentence(text?: string | null): boolean {
  if (!isRealContent(text)) return false;
  const trimmed = text!.trim();

  // Reject first-person candidate transcript quotes (e.g., "I have worked...", "I'm familiar...")
  const firstPersonPattern = /^(?:so\s+|and\s+|also\s+)?\b(i|i'm|i've|i'll|i'd|my|we|we've|our)\b/i;
  if (firstPersonPattern.test(trimmed)) {
    return false;
  }

  // Reject quotes containing candidate conversational speech fragments
  if (/\b(i\s+have|i\s+am|i\s+worked|i\s+use|my\s+role|my\s+experience|i\s+was|my\s+friends)\b/i.test(trimmed)) {
    return false;
  }

  return true;
}

function hasRealSpeech(report: NormalizedReport): boolean {
  const isInsufficient = Boolean(
    report.insufficient_content ||
    (report.assessment as any)?.insufficient_content ||
    (report.assessment as any)?.data?.assessment_eval?.insufficient_content ||
    (report.assessment?.report as any)?.insufficient_content
  );
  if (isInsufficient) {
    return false;
  }
  const fullText = (report.transcript?.full_text || "").trim();
  if (
    /^(the\s+)?(candidate|speaker)\s+is\s+answering\s+technical/i.test(fullText) ||
    /thank\s+you\s+for\s+watching/i.test(fullText) ||
    /thanks\s+for\s+watching/i.test(fullText)
  ) {
    const stripped = fullText
      .replace(/^(the\s+)?(candidate|speaker)\s+is\s+answering\s+technical[^\.\n]*/gi, "")
      .replace(/thank\s+you\s+for\s+watching!?/gi, "")
      .replace(/thanks\s+for\s+watching!?/gi, "")
      .trim();
    if (stripped.length < 15) {
      return false;
    }
  }

  if (
    Boolean(report.technical_evaluation) ||
    isRealContent(report.overall_summary) ||
    (report.intro_sections && report.intro_sections.length > 0) ||
    (report.requirement_coverage && report.requirement_coverage.length > 0) ||
    Boolean(report.jd_alignment || report.jd_evaluation) ||
    Boolean(report.scores?.overall_band || report.scores?.ai_engineering?.band)
  ) {
    return true;
  }
  return fullText.length > 15;
}

function getTranscriptDuration(report: NormalizedReport, mediaDurationSec?: number | null): string {
  // If the media element has already loaded and reported its exact duration, prioritize it for 100% sync
  if (mediaDurationSec != null && mediaDurationSec > 0 && !isNaN(mediaDurationSec) && isFinite(mediaDurationSec)) {
    const totalSec = Math.round(mediaDurationSec);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins > 0 && secs > 0) return `${mins} min ${secs} sec`;
    if (mins > 0) return `${mins} min`;
    return `${secs} sec`;
  }

  if (!hasRealSpeech(report)) return "";
  const assessment = report.assessment;
  let totalSec: number | null = null;

  const dataRec = assessment.data as any;

  // 1. Prioritize total recording / playback duration (matches VideoPlayer)
  const candidateDurations = [
    report.audio_telemetry?.speaking_duration_sec,
    report.delivery_analysis?.rawMetrics?.speaking_duration_seconds,
    report.audio?.recording_environment?.speaking_duration_seconds,
    (assessment as any)?.duration_seconds,
    (assessment as any)?.client_duration_seconds,
    (assessment as any)?.total_duration_seconds,
    dataRec?.total_audio_duration_seconds,
    dataRec?.audio_telemetry?.total_audio_duration_seconds,
    dataRec?.duration_seconds,
    dataRec?.client_duration_seconds,
    dataRec?.audio_telemetry?.duration_seconds,
    dataRec?.audio_telemetry?.speaking_duration_seconds,
  ];

  for (const dur of candidateDurations) {
    if (dur != null) {
      const sec = Number(dur);
      if (!isNaN(sec) && sec > 0) {
        totalSec = Math.round(sec);
        break;
      }
    }
  }

  // 2. Fallback to last segment timestamp in transcript
  if (!totalSec && report.transcript?.segments && report.transcript.segments.length > 0) {
    const segs = report.transcript.segments;
    const lastSeg = segs[segs.length - 1];
    if (lastSeg.timestamp_s != null && lastSeg.timestamp_s > 0) {
      totalSec = Math.round(lastSeg.timestamp_s);
    }
  }

  // 3. Fallback to speaking duration if total session duration is absent
  if (!totalSec && dataRec?.audio_telemetry?.speaking_duration_seconds != null) {
    const sec = Number(dataRec.audio_telemetry.speaking_duration_seconds);
    if (!isNaN(sec) && sec > 0) totalSec = Math.round(sec);
  }
  if (!totalSec && report.audio_telemetry?.speaking_duration_sec != null) {
    const sec = Number(report.audio_telemetry.speaking_duration_sec);
    if (!isNaN(sec) && sec > 0) totalSec = Math.round(sec);
  }

  // 4. Fallback to estimated duration from words
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

// ═════════════════════════════════════════════════════════════════════════════
//  EMPTY STATE CARD
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
//  DYNAMIC SECTION EVALUATION DATA RESOLVER (PURE LLM GET DATA)
// ═════════════════════════════════════════════════════════════════════════════

interface SectionEvalData {
  status: string;
  subtitle: string;
  observations: string[];
  conceptsCovered: string[];
  conceptsMissed: string[];
  technologies: string[];
  recommendations: { topic: string; guidance?: string }[];
}

function isRelevantToSection(topic: string, secKeys: string[]): boolean {
  const lower = topic.toLowerCase();

  if (secKeys.includes("career_story") || secKeys.includes("introduction_quality")) {
    return (
      lower.includes("intro") ||
      lower.includes("career") ||
      lower.includes("role") ||
      lower.includes("project") ||
      lower.includes("communication") ||
      lower.includes("clarity") ||
      lower.includes("timeline") ||
      lower.includes("background") ||
      lower.includes("framing") ||
      lower.includes("business") ||
      lower.includes("evolution")
    );
  }

  if (secKeys.includes("agentic_ai") || secKeys.includes("rag_and_retrieval")) {
    return (
      lower.includes("agent") ||
      lower.includes("rag") ||
      lower.includes("retrieval") ||
      lower.includes("vector") ||
      lower.includes("embedding") ||
      lower.includes("llm") ||
      lower.includes("prompt") ||
      lower.includes("orchestrat") ||
      lower.includes("chunk") ||
      lower.includes("memory") ||
      lower.includes("eval") ||
      lower.includes("guardrail") ||
      lower.includes("mcp") ||
      lower.includes("tool") ||
      lower.includes("ai")
    );
  }

  if (secKeys.includes("software_engineering")) {
    return (
      lower.includes("api") ||
      lower.includes("fastapi") ||
      lower.includes("backend") ||
      lower.includes("microservice") ||
      lower.includes("database") ||
      lower.includes("sql") ||
      lower.includes("nosql") ||
      lower.includes("react") ||
      lower.includes("code") ||
      lower.includes("architecture") ||
      lower.includes("pattern")
    );
  }

  if (secKeys.includes("cicd_and_delivery") || secKeys.includes("cloud_and_infrastructure")) {
    return (
      lower.includes("cicd") ||
      lower.includes("ci/cd") ||
      lower.includes("docker") ||
      lower.includes("kubernetes") ||
      lower.includes("aws") ||
      lower.includes("cloud") ||
      lower.includes("deploy") ||
      lower.includes("github actions") ||
      lower.includes("pipeline") ||
      lower.includes("gitops") ||
      lower.includes("terraform") ||
      lower.includes("infrastructure") ||
      lower.includes("container") ||
      lower.includes("hosting")
    );
  }

  return false;
}

function resolveSectionData(
  report: NormalizedReport,
  secKeys: string[],
  inventoryKeys: string[] = []
): SectionEvalData {
  const {
    intro_sections = [],
    technical_analysis,
    critical_gaps = [],
    priority_improvements = [],
    technology_inventory = {},
  } = report;

  const matchedSecs = intro_sections.filter((s) => secKeys.includes(s.key));

  // 1. Status resolution
  let status = "NOT_MENTIONED";
  if (matchedSecs.length > 0) {
    const statuses = matchedSecs.map((s) => (s.status || "").toUpperCase().trim());
    if (statuses.some((st) => ["STRONG", "EXCELLENT", "GOOD", "COVERED", "POSITIVE"].includes(st))) {
      status = "STRONG";
    } else if (statuses.some((st) => ["PARTIAL", "MODERATE", "ADEQUATE", "DEVELOPING", "NEEDS_POLISH"].includes(st))) {
      status = "PARTIAL";
    } else if (statuses.some((st) => ["WEAK", "NEEDS_WORK", "NEEDS_IMPROVEMENT", "POOR"].includes(st))) {
      status = "WEAK";
    }
  }

  // 2. Subtitle / Summary
  const observationTexts = matchedSecs
    .map((s) => s.observation)
    .filter(isRealContent) as string[];
  let subtitle = observationTexts.length > 0 ? Array.from(new Set(observationTexts)).join(" ") : "";

  if (!subtitle && status === "NOT_MENTIONED") {
    subtitle = "The candidate did not cover specific details for this section during the assessment.";
  }

  // 3. Observations list (strictly LLM synthesized evaluation sentences, NO raw candidate transcript quotes)
  const obsSet = new Set<string>();
  matchedSecs.forEach((sec) => {
    if (isEvaluatorSentence(sec.observation)) obsSet.add(sec.observation!);
  });

  secKeys.forEach((key) => {
    const techSec = (technical_analysis as any)?.[key];
    if (techSec?.key_observations && Array.isArray(techSec.key_observations)) {
      techSec.key_observations.forEach((obs: string) => isEvaluatorSentence(obs) && obsSet.add(obs));
    }
  });

  const observations = Array.from(obsSet);

  // 4. Technologies Mentioned (strictly scoped to this section, no global bleed)
  const techSet = new Set<string>();
  matchedSecs.forEach((sec) => {
    if (Array.isArray(sec.technologies_mentioned)) {
      sec.technologies_mentioned.forEach((t) => t && t.trim() && techSet.add(t.trim()));
    }
  });
  inventoryKeys.forEach((invKey) => {
    const list = (technology_inventory as any)?.[invKey];
    if (Array.isArray(list)) {
      list.forEach((t: string) => t && t.trim() && techSet.add(t.trim()));
    }
  });

  // 5. Concepts Covered vs Missed (100% Dynamic rendering of backend evaluation)
  const coveredSet = new Set<string>();
  const missedSet = new Set<string>();

  // Extract concepts dynamically from backend evaluation for these sections
  matchedSecs.forEach((sec) => {
    if (sec.concepts && typeof sec.concepts === "object") {
      for (const [k, v] of Object.entries(sec.concepts)) {
        if (!k) continue;
        // Strict requirement: Caching belongs exclusively to Software Engineering
        if (k.toLowerCase() === "caching" && !secKeys.includes("software_engineering")) {
          continue;
        }
        const st = (v || "").toUpperCase().trim();
        if (["COVERED", "STRONG", "GOOD", "EXCELLENT", "PARTIAL", "TRUE", "YES"].includes(st)) {
          coveredSet.add(k);
        } else {
          // Exhaustive fallback: anything not covered is missed (NOT_MENTIONED, NOT_APPLICABLE, N/A, etc.)
          missedSet.add(k);
        }
      }
    }
  });

  // Strict invariant: An item cannot be both covered and missed
  coveredSet.forEach((item) => {
    missedSet.delete(item);
    missedSet.delete(item.toLowerCase().trim());
  });

  // 5b. Card Status Rule:
  // "STRONG" requires: totalCovered >= totalMissed AND overall_status is COVERED/STRONG
  const totalCovered = coveredSet.size;
  const totalMissed = missedSet.size;

  if (status === "WEAK") {
    // Preserve "WEAK" status resolved in Step 1 from backend section evaluations
  } else if (totalCovered === 0) {
    status = "NOT_MENTIONED";
  } else {
    const hasCoveredStatus = matchedSecs.some((s) => {
      const st = (s.status || "").toUpperCase().trim();
      return ["STRONG", "EXCELLENT", "GOOD", "COVERED", "POSITIVE"].includes(st);
    });

    if (totalCovered >= totalMissed && hasCoveredStatus) {
      status = "STRONG";
    } else {
      status = "PARTIAL";
    }
  }

  // 6. Recommendations / Missed tools to include
  const recommendations: { topic: string; guidance?: string }[] = [];
  const addedTopics = new Set<string>();

  critical_gaps.forEach((gap) => {
    const topicStr = gap.what_is_missing || gap.topic || "";
    if (topicStr && isRelevantToSection(topicStr, secKeys)) {
      if (!addedTopics.has(topicStr)) {
        addedTopics.add(topicStr);
        recommendations.push({
          topic: topicStr,
          guidance: gap.why_it_matters || gap.suggested_addition,
        });
      }
    }
  });

  priority_improvements.forEach((imp) => {
    const topicStr = imp.topic || "";
    if (topicStr && isRelevantToSection(topicStr, secKeys)) {
      if (!addedTopics.has(topicStr)) {
        addedTopics.add(topicStr);
        recommendations.push({
          topic: topicStr,
          guidance: imp.guidance || imp.example,
        });
      }
    }
  });

  return {
    status,
    subtitle,
    observations,
    conceptsCovered: Array.from(coveredSet),
    conceptsMissed: Array.from(missedSet),
    technologies: Array.from(techSet),
    recommendations,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  OVERVIEW CATEGORY CARD
// ═════════════════════════════════════════════════════════════════════════════

function OverviewCategoryCard({
  icon,
  title,
  summary,
  status,
  subTabId,
  onSelectTab,
}: {
  icon: React.ReactNode;
  title: string;
  summary?: string;
  status?: string;
  subTabId: string;
  onSelectTab: (tab: ReportTab, subTab?: string) => void;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs transition-all hover:shadow-xs hover:border-blue-200/90">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            {icon}
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">{title}</h3>
          </div>
          {status && <QualitativeBadge status={status} size="sm" />}
        </div>
        <p className="text-xs text-slate-600 leading-snug sm:leading-relaxed line-clamp-3 mb-2">
          {summary || "Evaluation summary available in detailed view."}
        </p>
      </div>
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-end">
        <button
          type="button"
          onClick={() => onSelectTab("Details", subTabId)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
        >
          View More →
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  OVERVIEW TAB CONTENT
// ═════════════════════════════════════════════════════════════════════════════

export interface OverviewProps {
  report: NormalizedReport;
  videoRef: RefObject<HTMLVideoElement | null>;
  seekTo: (seconds: number) => void;
  assessmentId: string;
  onSelectTab: (tab: ReportTab, subTab?: string) => void;
  onOpenTranscript?: () => void;
  onDurationChange?: (duration: number) => void;
}


// ═════════════════════════════════════════════════════════════════════════════
//  JD WALKTHROUGH DETAIL ACCORDIONS & CARDS
// ═════════════════════════════════════════════════════════════════════════════

function JdRequirementsAccordion({
  coverage = [],
  isExpanded,
  onToggle,
}: {
  coverage: JdRequirementCoverageItem[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const coveredItems = coverage.filter((r) => r.status === "COVERED");
  const partialItems = coverage.filter((r) => r.status === "PARTIAL");
  const missedItems = coverage.filter((r) => r.status === "NOT_MENTIONED");
  const gapItems = [...partialItems, ...missedItems];

  const coveredRatio = coverage.length > 0 ? coveredItems.length / coverage.length : 0;
  const overallStatus = coveredRatio >= 0.7 ? "STRONG" : coveredRatio >= 0.5 ? "ADEQUATE" : "NEEDS_WORK";

  // Collect notes/observations
  const observations = coverage
    .filter((r) => r.note && r.note.trim())
    .map((r) => `${r.requirement}: ${r.note}`);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-50 border border-slate-100 text-slate-700">
            <Target size={18} className="text-blue-600" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            JD Requirements Coverage
          </h3>
          <QualitativeBadge status={overallStatus} size="sm" />
          <span className="text-[10px] font-semibold text-slate-500">
            ({coveredItems.length}/{coverage.length} Covered)
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`text-slate-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="p-3 sm:p-3.5 border-t border-slate-100 space-y-2.5">
          <p className="text-xs text-slate-600 leading-snug">
            Granular evaluation of MUST_HAVE and NICE_TO_HAVE competencies aligned with the target Job Description.
          </p>

          {/* 1. REQUIREMENTS COVERED (Intro-style emerald pills) */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              REQUIREMENTS COVERED:
            </span>
            {coveredItems.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {coveredItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80 shadow-2xs"
                  >
                    <Check size={11} className="text-emerald-600 stroke-[3]" />
                    {item.requirement}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">None verified in spoken transcript</p>
            )}
          </div>

          {/* 2. REQUIREMENTS MISSED (Intro-style rose pills) */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              REQUIREMENTS MISSED / GAPS:
            </span>
            {gapItems.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {gapItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200/80 shadow-2xs"
                  >
                    <AlertTriangle size={11} className="text-rose-500 stroke-[2]" />
                    {item.requirement}
                    {item.importance === "MUST_HAVE" && (
                      <span className="text-[9px] font-bold uppercase text-rose-800 ml-0.5">• Must-Have</span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">All target requirements covered</p>
            )}
          </div>

          {/* 3. KEY OBSERVATIONS (Signature Intro-style blue box) */}
          {observations.length > 0 && (
            <div className="rounded-lg border border-blue-100 bg-[#f4f8ff] p-2.5 sm:p-3 space-y-1">
              <h4 className="text-xs font-bold text-slate-900">Key Observations</h4>
              <ul className="space-y-0.5 text-xs text-slate-700">
                {observations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                    <span className="leading-snug">{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. SPOKEN EVIDENCE BREAKDOWN (Compact, sleek checklist cards) */}
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Spoken Evidence by Requirement:
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                {coveredItems.length}/{coverage.length} Verified
              </span>
            </div>
            <div className="space-y-1.5">
              {coverage.map((item, idx) => (
                <div key={idx} className="bg-white rounded-md p-2 border border-slate-100 shadow-2xs text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {item.status === "COVERED" ? (
                        <Check size={12} className="text-emerald-600 stroke-[3] shrink-0" />
                      ) : item.status === "PARTIAL" ? (
                        <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                      ) : (
                        <X size={12} className="text-rose-500 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-900">{item.requirement}</span>
                      {item.importance === "MUST_HAVE" && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">Must-Have</span>
                      )}
                      {item.category && (
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{item.category.replaceAll("_", " ")}</span>
                      )}
                      {item.match_type && (
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{item.match_type}</span>
                      )}
                    </div>
                    <QualitativeBadge status={item.status} size="sm" />
                  </div>
                  {item.evidence && (
                    <p className="text-[11px] text-slate-600 italic pl-2.5 border-l-2 border-emerald-400 mt-1 leading-snug">
                      "{item.evidence}"
                    </p>
                  )}
                  {item.note && !item.evidence && (
                    <p className="text-[11px] text-slate-500 italic pl-2.5 border-l-2 border-slate-200 mt-1 leading-snug">
                      {item.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JdRoleAlignmentAccordion({
  roleAlignment,
  careerStory,
  isExpanded,
  onToggle,
}: {
  roleAlignment?: NormalizedReport["role_alignment"];
  careerStory?: NormalizedReport["career_story"];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-50 border border-slate-100 text-slate-700">
            <User size={18} className="text-indigo-600" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            Role Alignment & Career Story
          </h3>
          {roleAlignment?.overall_status && (
            <QualitativeBadge status={roleAlignment.overall_status} size="sm" />
          )}
        </div>
        <ChevronDown
          size={15}
          className={`text-slate-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="p-3 sm:p-3.5 border-t border-slate-100 space-y-3">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-100">
            {roleAlignment?.seniority_match && (
              <SeniorityBadge match={roleAlignment.seniority_match} />
            )}
            {roleAlignment?.domain_fit && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold">Domain Fit:</span>
                <QualitativeBadge status={roleAlignment.domain_fit} size="sm" />
              </div>
            )}
            {roleAlignment?.role_relevance && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold">Role Relevance:</span>
                <QualitativeBadge status={roleAlignment.role_relevance} size="sm" />
              </div>
            )}
            {careerStory?.leads_logically_to_target_role && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold">Leads to Target Role:</span>
                <QualitativeBadge status={careerStory.leads_logically_to_target_role} size="sm" />
              </div>
            )}
          </div>

          {/* Identified Transitions */}
          {careerStory?.transitions_identified && careerStory.transitions_identified.length > 0 && (
            <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Identified Career Transitions:
              </span>
              <ul className="space-y-1 text-xs text-slate-700">
                {careerStory.transitions_identified.map((tr, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{tr}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Observations */}
          {(roleAlignment?.observation || careerStory?.observation) && (
            <div className="rounded-lg border border-blue-100 bg-[#f4f8ff] p-2.5 sm:p-3 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900">Key Observations</h4>
              {roleAlignment?.observation && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {roleAlignment.observation}
                </p>
              )}
              {careerStory?.observation && careerStory.observation !== roleAlignment?.observation && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {careerStory.observation}
                </p>
              )}
            </div>
          )}

          {/* Evidence Quotes */}
          {((roleAlignment?.evidence && roleAlignment.evidence.length > 0) ||
            (careerStory?.evidence && careerStory.evidence.length > 0)) && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Spoken Transcript Evidence:
              </span>
              <div className="space-y-1.5">
                {[...(roleAlignment?.evidence || []), ...(careerStory?.evidence || [])].map(
                  (ev, idx) => (
                    <blockquote
                      key={idx}
                      className="rounded-md bg-emerald-50/60 border border-emerald-200/60 p-2 text-xs italic text-emerald-950 font-medium"
                    >
                      "{ev}"
                    </blockquote>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JdCurrentProjectAccordion({
  project,
  techAlign,
  isExpanded,
  onToggle,
}: {
  project?: NormalizedReport["current_role_and_project"];
  techAlign?: NormalizedReport["jd_technical_alignment"];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-50 border border-slate-100 text-slate-700">
            <Cpu size={18} className="text-sky-600" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            Current Project & Technical Alignment
          </h3>
          {project?.overall_status && (
            <QualitativeBadge status={project.overall_status} size="sm" />
          )}
        </div>
        <ChevronDown
          size={15}
          className={`text-slate-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="p-3 sm:p-3.5 border-t border-slate-100 space-y-3">
          {/* Project Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {project?.project_explained && (
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Project Explained:</span>
                <QualitativeBadge status={project.project_explained} size="sm" />
              </div>
            )}
            {project?.business_problem && (
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Business Problem:</span>
                <QualitativeBadge status={project.business_problem} size="sm" />
              </div>
            )}
            {project?.users_or_customers && (
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Users / Scale:</span>
                <QualitativeBadge status={project.users_or_customers} size="sm" />
              </div>
            )}
            {project?.technical_ownership && (
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Personal Ownership:</span>
                <QualitativeBadge status={project.technical_ownership} size="sm" />
              </div>
            )}
          </div>

          {/* Technology Inventory */}
          {techAlign && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              {techAlign.technologies_matching_jd && techAlign.technologies_matching_jd.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Technologies Matching JD:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {techAlign.technologies_matching_jd.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200"
                      >
                        <Check size={11} className="text-emerald-600 stroke-[3]" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {techAlign.jd_technologies_not_mentioned && techAlign.jd_technologies_not_mentioned.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    JD Technologies Not Mentioned:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {techAlign.jd_technologies_not_mentioned.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200"
                      >
                        <AlertTriangle size={11} className="text-amber-600" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {techAlign.equivalent_technologies && techAlign.equivalent_technologies.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                    Equivalent Technologies:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {techAlign.equivalent_technologies.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Observations */}
          {(project?.observation || techAlign?.observation) && (
            <div className="rounded-lg border border-blue-100 bg-[#f4f8ff] p-2.5 sm:p-3 space-y-1">
              <h4 className="text-xs font-bold text-slate-900">Key Observations</h4>
              {project?.observation && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {project.observation}
                </p>
              )}
              {techAlign?.observation && techAlign.observation !== project?.observation && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {techAlign.observation}
                </p>
              )}
            </div>
          )}

          {/* Evidence Quotes */}
          {((project?.evidence && project.evidence.length > 0) ||
            (techAlign?.evidence && techAlign.evidence.length > 0)) && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Spoken Transcript Evidence:
              </span>
              <div className="space-y-1.5">
                {[...(project?.evidence || []), ...(techAlign?.evidence || [])].map((ev, idx) => (
                  <blockquote
                    key={idx}
                    className="rounded-md bg-emerald-50/60 border border-emerald-200/60 p-2 text-xs italic text-emerald-950 font-medium"
                  >
                    "{ev}"
                  </blockquote>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JdTailoringAccordion({
  tailoring,
  valueProp,
  isExpanded,
  onToggle,
}: {
  tailoring?: NormalizedReport["tailoring_quality"];
  valueProp?: NormalizedReport["value_proposition"];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-violet-50 border border-violet-100 text-violet-700">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Value Proposition & Tailoring Quality
              </h3>
              {tailoring?.tailored_to_role && (
                <QualitativeBadge status={tailoring.tailored_to_role} size="sm" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Why this role, quantified impact outcomes, differentiators, and adaptation to the JD
            </p>
          </div>
        </div>
        <ChevronDown
          size={15}
          className={`text-slate-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="p-3 sm:p-3.5 border-t border-slate-100 space-y-3">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-100">
            {tailoring?.tailored_to_role && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold">Tailored to Role:</span>
                <QualitativeBadge status={tailoring.tailored_to_role} size="sm" />
              </div>
            )}
            {tailoring?.irrelevant_content_ratio && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold">Irrelevant Content:</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  {tailoring.irrelevant_content_ratio}
                </span>
              </div>
            )}
            {valueProp?.impact_and_outcomes && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold">Impact Articulated:</span>
                <QualitativeBadge status={valueProp.impact_and_outcomes} size="sm" />
              </div>
            )}
          </div>

          {/* Differentiators */}
          {valueProp?.differentiators && valueProp.differentiators.length > 0 && (
            <div className="rounded-lg bg-violet-50/50 p-2.5 border border-violet-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-900">
                Key Differentiators:
              </span>
              <ul className="space-y-1 text-xs text-slate-700">
                {valueProp.differentiators.map((diff, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-violet-600 font-bold">•</span>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Observations */}
          {(tailoring?.observation || valueProp?.observation) && (
            <div className="rounded-lg border border-blue-100 bg-[#f4f8ff] p-2.5 sm:p-3 space-y-1">
              <h4 className="text-xs font-bold text-slate-900">Key Observations</h4>
              {tailoring?.observation && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {tailoring.observation}
                </p>
              )}
              {valueProp?.observation && valueProp.observation !== tailoring?.observation && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {valueProp.observation}
                </p>
              )}
            </div>
          )}

          {/* Evidence Quotes */}
          {((tailoring?.evidence && tailoring.evidence.length > 0) ||
            (valueProp?.evidence && valueProp.evidence.length > 0)) && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Spoken Transcript Evidence:
              </span>
              <div className="space-y-1.5">
                {[...(tailoring?.evidence || []), ...(valueProp?.evidence || [])].map((ev, idx) => (
                  <blockquote
                    key={idx}
                    className="rounded-md bg-emerald-50/60 border border-emerald-200/60 p-2 text-xs italic text-emerald-950 font-medium"
                  >
                    "{ev}"
                  </blockquote>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JdFinalAssessmentCard({
  finalAssessment,
}: {
  finalAssessment?: NormalizedReport["jd_final_assessment"];
}) {
  if (!finalAssessment) return null;

  return (
    <div className="rounded-xl border border-indigo-100 bg-white p-3 sm:p-3.5 shadow-2xs space-y-2.5">
      <div className="flex items-center gap-2 text-indigo-700 border-b border-slate-100 pb-2">
        <Sparkles size={16} />
        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
          Final Diagnostic Assessment
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {finalAssessment.jd_fit_summary && (
          <div className="p-2.5 rounded-lg bg-indigo-50/40 border border-indigo-100/70 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
              JD Fit Summary
            </span>
            <p className="text-slate-700 leading-snug">{finalAssessment.jd_fit_summary}</p>
          </div>
        )}
        {finalAssessment.career_story_relevance && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Career Story Relevance
            </span>
            <p className="text-slate-700 leading-snug">{finalAssessment.career_story_relevance}</p>
          </div>
        )}
        {finalAssessment.current_project_clarity && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Current Project Clarity
            </span>
            <p className="text-slate-700 leading-snug">{finalAssessment.current_project_clarity}</p>
          </div>
        )}
        {finalAssessment.technical_alignment_depth && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Technical Depth
            </span>
            <p className="text-slate-700 leading-snug">{finalAssessment.technical_alignment_depth}</p>
          </div>
        )}
        {finalAssessment.seniority_match && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Seniority Calibration
            </span>
            <p className="text-slate-700 leading-snug">{finalAssessment.seniority_match}</p>
          </div>
        )}
        {finalAssessment.most_important_improvement && (
          <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Top Actionable Improvement
            </span>
            <p className="text-amber-950 font-medium leading-snug">{finalAssessment.most_important_improvement}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function EvaluationContent({
  report,
  videoRef,
  seekTo,
  assessmentId,
  onSelectTab,
  onOpenTranscript,
  onDurationChange,
}: OverviewProps) {
  const {
    youtube_url,
    overall_readiness,
    overall_summary,
    scores,
    intro_sections,
    final_assessment,
    insufficient_content,
    consent,
    strongest_points,
    critical_gaps,
  } = report;

  const authToken =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") || localStorage.getItem("token") || ""
      : "";

  const rawMediaType = (report.assessment.media_type || "").toUpperCase();
  const isAudioOnly = rawMediaType === "AUDIO" || rawMediaType === "AUDIO_ONLY";

  const mediaPath = isAudioOnly ? "audio" : "video";
  const canShowRecording = Boolean(
    consent?.save_recording ??
    (report.assessment as any)?.consent?.save_recording ??
    true
  );
  const localPreviewUrl =
    typeof window !== "undefined"
      ? (window as any).__aiprep_local_preview?.[assessmentId] ||
        (() => {
          const stored = sessionStorage.getItem(`aiprep_local_preview_${assessmentId}`);
          // A blob: URL is only valid within the lifetime of the in-memory window context.
          // If the page was reloaded, window.__aiprep_local_preview is wiped, meaning the blob is dead.
          if (stored && stored.startsWith("blob:") && !(window as any).__aiprep_local_preview?.[assessmentId]) {
            try {
              sessionStorage.removeItem(`aiprep_local_preview_${assessmentId}`);
            } catch (_) {}
            return undefined;
          }
          return stored || undefined;
        })()
      : undefined;

  const serverUrl = assessmentId
    ? `${(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api$/, "")}/api/aiprep/assessments/${assessmentId}/${mediaPath}${authToken ? `?token=${encodeURIComponent(authToken)}` : ""}`
    : undefined;

  // Auto-cleanup local instant playback blob once YouTube URL is available
  useEffect(() => {
    if (youtube_url && typeof window !== "undefined" && assessmentId) {
      if ((window as any).__aiprep_local_preview?.[assessmentId]) {
        try {
          URL.revokeObjectURL((window as any).__aiprep_local_preview[assessmentId]);
        } catch (_) {}
        delete (window as any).__aiprep_local_preview[assessmentId];
      }
      try {
        sessionStorage.removeItem(`aiprep_local_preview_${assessmentId}`);
      } catch (_) {}
    }
  }, [youtube_url, assessmentId]);

  // Playback hierarchy:
  // 1. YouTube (once upload is done)
  // 2. Instant Local Playback (0ms zero-latency preview while YouTube is pending)
  // 3. Persistent Server Stream (when reopening a closed assessment)
  const effectivePlaybackUrl = canShowRecording
    ? (youtube_url || localPreviewUrl || serverUrl)
    : undefined;

  const durationSeconds =
    report.audio_telemetry?.speaking_duration_sec ||
    report.delivery_analysis?.rawMetrics?.speaking_duration_seconds ||
    report.audio?.recording_environment?.speaking_duration_seconds ||
    (report as any).audio_telemetry?.duration ||
    Number((report.assessment as any)?.duration_seconds) ||
    Number((report.assessment as any)?.client_duration_seconds) ||
    Number((report.assessment as any)?.total_duration_seconds) ||
    Number((report.assessment?.data as any)?.audio_telemetry?.total_audio_duration_seconds) ||
    0;


  const candidateSpoke = hasRealSpeech(report);

  if (!candidateSpoke) {
    return <EmptyEvaluationCard />;
  }

  // ── Technical Assessment: delegate to dedicated view ─────────────────────
  if (report.technical_evaluation || report.assessment?.assessment_type === "TECHNICAL") {
    return (
      <TechnicalEvaluationView
        report={report}
        activeTab="Overview"
        onSelectTab={(tab) => onSelectTab(tab)}
        videoRef={videoRef}
        seekTo={seekTo}
        assessmentId={assessmentId}
        onDurationChange={onDurationChange}
      />
    );
  }

  const isJdReport = Boolean(
    report.is_jd_intro ||
    report.jd_evaluation ||
    isJobDescriptionAssessment(report.assessment, report)
  );
  const jdFit = report.jd_alignment || report.jd_evaluation?.overall_assessment?.jd_alignment;

  // Pure dynamic data resolution per section category matching Details tab
  const introData = resolveSectionData(
    report,
    ["career_story", "current_role", "current_project", "ai_engineering_evolution", "introduction_quality"],
    ["career"]
  );

  const aiData = resolveSectionData(
    report,
    [
      "agentic_ai",
      "rag_and_retrieval",
      "models_and_ai_platforms",
      "ai_engineering",
      "ai_agents_multiagent_mentioned",
      "mcp_mentioned",
      "memory_context_engineering_mentioned",
      "guardrails_evals_observability_mentioned",
      "rag_retrieval_chunking_mentioned",
    ],
    ["ai_engineering", "agent_frameworks", "agent_protocols_and_patterns", "retrieval_and_rag", "vector_databases", "models", "model_platforms"]
  );

  const seData = resolveSectionData(
    report,
    ["software_engineering"],
    ["software_engineering", "backend_and_api", "frontend", "databases"]
  );

  const devopsCloudData = resolveSectionData(
    report,
    ["cicd_and_delivery", "cloud_and_infrastructure", "devops", "cloud", "infrastructure", "cicd", "containers_and_orchestration", "infrastructure_as_code"],
    ["devops", "cloud", "cicd", "containers_and_orchestration", "infrastructure_as_code", "cloud_and_infrastructure", "cicd_and_delivery", "containers", "infrastructure"]
  );

  const allSectionsNotMentioned =
    introData.status === "NOT_MENTIONED" &&
    aiData.status === "NOT_MENTIONED" &&
    seData.status === "NOT_MENTIONED" &&
    devopsCloudData.status === "NOT_MENTIONED";

  // Dynamic overall readiness strictly from API or dynamic status
  const readiness =
    overall_readiness ||
    scores.overall_band ||
    (allSectionsNotMentioned ? "NOT_MENTIONED" : "GOOD");

  const summaryText =
    overall_summary ||
    (allSectionsNotMentioned
      ? "No substantive technical details or concepts were mentioned during this assessment session."
      : "Dynamic candidate assessment based on spoken content and evaluation metrics.");

  const strongestSignalText =
    report.overall_strongest_signal ||
    (strongest_points && strongest_points.length > 0
      ? strongest_points[0]
      : allSectionsNotMentioned
      ? "No specific technical strengths demonstrated during this brief response."
      : "Strong understanding of core technical principles.");

  const biggestGapText =
    report.overall_biggest_gap ||
    (critical_gaps && critical_gaps.length > 0
      ? critical_gaps[0].what_is_missing || critical_gaps[0].topic || critical_gaps[0].why_it_matters
      : allSectionsNotMentioned
      ? "The candidate did not elaborate on technical, engineering, or career concepts."
      : "Further elaboration on technical depth suggested.");

  const introStatus = introData.status;
  const introSummary = introData.subtitle;

  const aiStatus = aiData.status;
  const aiSummary = aiData.subtitle;

  const seStatus = seData.status;
  const seSummary = seData.subtitle;

  const cicdStatus = devopsCloudData.status;
  const cicdSummary = devopsCloudData.subtitle;

  // If spoken content was insufficient (< 15 words / < 20s), render strictly the "Evaluation Unavailable" layout and nothing else
  if (insufficient_content) {
    return (
      <div className="space-y-3 sm:space-y-3.5">
        <section className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm mb-4">
            <span>✦</span>
            <span className="text-slate-900 font-bold">Overall Assessment</span>
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 py-12 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100/90 border border-amber-200/90 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
              <MicOff size={22} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Evaluation Unavailable
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
              We don't have enough information to provide an evaluation for this assessment. Please ensure you speak clearly and provide a complete introduction during your next attempt.
            </p>
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* ── 1. OVERALL SUMMARY CARD ── */}
      <section className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="p-1 rounded-lg bg-blue-50 border border-blue-100">
              <FileText size={16} />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Overall Summary</h2>
          </div>
          <div className="flex items-center gap-2.5">
            {jdFit && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">JD Fit:</span>
                <JdFitBadge fit={jdFit} size="sm" />
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Readiness:</span>
              <QualitativeBadge status={readiness} size="sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Summary */}
          <div className="lg:col-span-1 space-y-1 border-b lg:border-b-0 lg:border-r border-slate-100 pb-3 lg:pb-0 lg:pr-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Summary</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {summaryText}
            </p>
          </div>

          {/* Strongest Signal */}
          <div className="space-y-1 border-b lg:border-b-0 lg:border-r border-slate-100 pb-3 lg:pb-0 lg:pr-4">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Star size={14} className="fill-emerald-500/20" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Strongest Signal</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {strongestSignalText}
            </p>
          </div>

          {/* Biggest Gap */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600">
              <AlertTriangle size={14} className="fill-amber-500/20" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Biggest Gap</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {biggestGapText}
            </p>
          </div>
        </div>

        {report.jd_analysis && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            {report.jd_analysis.role_title && (
              <div className="flex items-center gap-1 text-slate-700">
                <Briefcase size={13} className="text-indigo-600 shrink-0" />
                <span className="font-bold">Target Role:</span>
                <span className="font-semibold text-indigo-900">{report.jd_analysis.role_title}</span>
              </div>
            )}
            {report.jd_analysis.seniority_level && report.jd_analysis.seniority_level !== "UNSPECIFIED" && (
              <div className="flex items-center gap-1 text-slate-700">
                <span className="font-bold">Seniority:</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  {report.jd_analysis.seniority_level}
                </span>
              </div>
            )}
            {report.jd_analysis.domain && (
              <div className="flex items-center gap-1 text-slate-700">
                <span className="font-bold">Domain:</span>
                <span className="text-slate-600">{report.jd_analysis.domain}</span>
              </div>
            )}
            {report.requirement_coverage && report.requirement_coverage.length > 0 && (
              <div className="flex items-center gap-1 text-slate-700 sm:ml-auto">
                <span className="text-slate-500">Requirements:</span>
                <span className="font-bold text-emerald-700">
                  {report.requirement_coverage.filter((r) => r.status === "COVERED").length}/{report.requirement_coverage.length} Covered
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 2. EVALUATION CATEGORY CARDS (2x2 GRID) ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {isJdReport ? (
          <>
            <OverviewCategoryCard
              icon={<User size={16} className="text-indigo-600" />}
              title="Role & Career Story"
              status={report.role_alignment?.overall_status || report.career_story?.overall_status || "COVERED"}
              summary={report.role_alignment?.observation || report.career_story?.observation || "Evaluates seniority match, logical career narrative, and domain relevance."}
              subTabId="role_alignment"
              onSelectTab={onSelectTab}
            />

            <OverviewCategoryCard
              icon={<Target size={16} className="text-blue-600" />}
              title="JD Requirements Coverage"
              status={jdFit || "COVERED"}
              summary={
                report.requirement_coverage && report.requirement_coverage.length > 0
                  ? `${report.requirement_coverage.filter((r) => r.status === "COVERED").length} of ${report.requirement_coverage.length} requirements verified from spoken evidence.`
                  : "Granular verification of must-have and nice-to-have JD capabilities."
              }
              subTabId="requirements"
              onSelectTab={onSelectTab}
            />

            <OverviewCategoryCard
              icon={<Cpu size={16} className="text-sky-600" />}
              title="Current Project & Tech Stack"
              status={report.current_role_and_project?.overall_status || report.jd_technical_alignment?.overall_status || "COVERED"}
              summary={report.current_role_and_project?.observation || report.jd_technical_alignment?.observation || "Evaluates project ownership, user scale, business problem, and core tech stack."}
              subTabId="current_project"
              onSelectTab={onSelectTab}
            />

            <OverviewCategoryCard
              icon={<Sparkles size={16} className="text-violet-600" />}
              title="Value Proposition & Tailoring"
              status={report.tailoring_quality?.tailored_to_role || report.value_proposition?.overall_status || "STRONG"}
              summary={report.tailoring_quality?.observation || report.value_proposition?.observation || "Evaluates role tailoring, concrete impact outcomes, and differentiators."}
              subTabId="tailoring"
              onSelectTab={onSelectTab}
            />
          </>
        ) : (
          <>
            <OverviewCategoryCard
              icon={<User size={16} className="text-indigo-600" />}
              title="Intro Evaluation"
              status={introStatus}
              summary={introSummary}
              subTabId="intro"
              onSelectTab={onSelectTab}
            />

            <OverviewCategoryCard
              icon={<Cpu size={16} className="text-blue-600" />}
              title="AI Engineering"
              status={aiStatus}
              summary={aiSummary}
              subTabId="ai_engineering"
              onSelectTab={onSelectTab}
            />

            <OverviewCategoryCard
              icon={<Code2 size={16} className="text-sky-600" />}
              title="Software Engineering"
              status={seStatus}
              summary={seSummary}
              subTabId="software_engineering"
              onSelectTab={onSelectTab}
            />

            <OverviewCategoryCard
              icon={<GitBranch size={16} className="text-orange-600" />}
              title="DevOps, CI/CD & Cloud"
              status={cicdStatus}
              summary={cicdSummary}
              subTabId="devops_cicd"
              onSelectTab={onSelectTab}
            />
          </>
        )}
      </section>

      {/* ── JD REQUIREMENTS QUICK SNAPSHOT (For JD reports) ── */}
      {isJdReport && report.requirement_coverage && report.requirement_coverage.length > 0 && (
        <section className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-blue-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">JD Requirements Evidence</h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("Details", "requirements")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              View Full Evidence Map →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.requirement_coverage.slice(0, 6).map((req, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {req.importance === "MUST_HAVE" && (
                      <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-800">Must-Have</span>
                    )}
                    <span className="font-semibold text-slate-800 line-clamp-1">{req.requirement}</span>
                  </div>
                  {req.evidence && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-1">"{req.evidence}"</p>
                  )}
                </div>
                <QualitativeBadge status={req.status} size="sm" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. RECORDING PLAYBACK ── */}
      {canShowRecording && effectivePlaybackUrl && (
        <section className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs">
          <div className="mb-2 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
            {isAudioOnly ? (
              <AudioWaveform size={15} className="text-blue-600" />
            ) : (
              <Video size={15} className="text-blue-600" />
            )}
            <h2 className="text-xs sm:text-sm font-bold">
              {isAudioOnly ? "Audio Recording Playback" : "Recording Playback"}
            </h2>
          </div>
          <div className="w-full max-w-3xl mx-auto">
            <VideoPlayer
              youtubeUrl={effectivePlaybackUrl}
              fallbackUrl={serverUrl}
              videoRef={videoRef}
              isAudioOnly={isAudioOnly}
              candidateName={report.candidate_name}
              durationSeconds={durationSeconds}
              onDurationChange={onDurationChange}
            />
          </div>
        </section>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  DETAIL SECTION CARD COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

function DetailSectionCard({
  icon,
  title,
  status,
  subtitle,
  observations,
  conceptsCovered,
  conceptsMissed,
  technologies,
  recommendations,
  isExpanded,
  onToggle,
  showConcepts = true,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
  subtitle?: string;
  observations: string[];
  conceptsCovered: string[];
  conceptsMissed: string[];
  technologies: string[];
  recommendations: { topic: string; guidance?: string }[];
  isExpanded: boolean;
  onToggle: () => void;
  showConcepts?: boolean;
}) {
  // Deduplicated topics covered: merge conceptsCovered with technologies
  const coveredTopicsMap = new Map<string, string>();
  conceptsCovered.forEach((cKey) => {
    const label = getConceptLabel(cKey);
    const norm = label.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!coveredTopicsMap.has(norm)) {
      coveredTopicsMap.set(norm, label);
    }
  });
  technologies.forEach((tech) => {
    if (tech && tech.trim()) {
      const trimmed = tech.trim();
      const norm = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!coveredTopicsMap.has(norm)) {
        coveredTopicsMap.set(norm, trimmed);
      }
    }
  });
  const allCoveredTopics = Array.from(coveredTopicsMap.values());

  // Deduplicated topics missed: conceptsMissed excluding anything that's covered
  const missedTopicsMap = new Map<string, string>();
  conceptsMissed.forEach((cKey) => {
    const label = getConceptLabel(cKey);
    const norm = label.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!coveredTopicsMap.has(norm) && !missedTopicsMap.has(norm)) {
      missedTopicsMap.set(norm, label);
    }
  });
  const allMissedTopics = Array.from(missedTopicsMap.values());

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-50 border border-slate-100 text-slate-700">
            {icon}
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">{title}</h3>
          <QualitativeBadge status={status} size="sm" />
        </div>
        <ChevronDown
          size={15}
          className={`text-slate-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="p-3 sm:p-3.5 border-t border-slate-100 space-y-2 sm:space-y-2.5">
          {subtitle && (
            <p className="text-xs text-slate-600 leading-snug">
              {subtitle}
            </p>
          )}

          {showConcepts ? (
            <>
              {/* 1. TOPICS COVERED */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  TOPICS COVERED:
                </span>
                {allCoveredTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {allCoveredTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80 shadow-2xs"
                      >
                        <Check size={11} className="text-emerald-600 stroke-[3]" />
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">None mentioned in response</p>
                )}
              </div>

              {/* 2. TOPICS MISSED */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  TOPICS MISSED:
                </span>
                {allMissedTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {allMissedTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200/80 shadow-2xs"
                      >
                        <AlertTriangle size={11} className="text-rose-500 stroke-[2]" />
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">All core topics covered</p>
                )}
              </div>

              {/* 3. KEY OBSERVATIONS */}
              {observations.length > 0 && (
                <div className="rounded-lg border border-blue-100 bg-[#f4f8ff] p-2.5 sm:p-3 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Key Observations</h4>
                  <ul className="space-y-0.5 text-xs text-slate-700">
                    {observations.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                        <span className="leading-snug">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Introduction Evaluation: Key Observations & Recommended Improvements */}
              {observations.length > 0 && (
                <div className="rounded-lg border border-blue-100 bg-[#f4f8ff] p-2.5 sm:p-3 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Key Observations</h4>
                  <ul className="space-y-0.5 text-xs text-slate-700">
                    {observations.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                        <span className="leading-snug">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-2.5 sm:p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-800">
                    <Lightbulb size={14} className="text-amber-600 shrink-0" />
                    <h4 className="text-xs font-bold text-amber-900">
                      Recommended Improvements for Next Time
                    </h4>
                  </div>
                  <ul className="space-y-1 text-xs text-amber-950">
                    {recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 bg-white/80 p-1.5 rounded-md border border-amber-200/60 shadow-2xs">
                        <Sparkles size={12} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{rec.topic}</span>
                          {rec.guidance && (
                            <p className="text-slate-700 text-xs mt-0.5 leading-snug">
                              {rec.guidance}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  DETAILS TAB CONTENT (4 EXPANDABLE CATEGORIES + SUMMARY CARDS)
// ═════════════════════════════════════════════════════════════════════════════

export function DetailsContent({
  report,
  seekTo,
  videoRef,
  initialSubTab = "intro",
  activeTab,
  onSelectTab,
  onOpenTranscript,
  onDurationChange,
}: {
  report: NormalizedReport;
  seekTo: (seconds: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  initialSubTab?: string;
  activeTab?: ReportTab;
  onSelectTab?: (tab: ReportTab) => void;
  onOpenTranscript?: () => void;
  onDurationChange?: (duration: number) => void;
}) {
  const {
    critical_gaps = [],
    priority_improvements = [],
    strongest_points = [],
  } = report;

  const candidateSpoke = hasRealSpeech(report);

  const isJdReport = Boolean(
    report.is_jd_intro ||
    report.jd_evaluation ||
    isJobDescriptionAssessment(report.assessment, report)
  );

  // Accordion state supporting both JD and non-JD assessment types
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    if (isJdReport) {
      return {
        requirements: initialSubTab === "requirements" || !initialSubTab || initialSubTab === "intro",
        role_alignment: initialSubTab === "role_alignment",
        current_project: initialSubTab === "current_project",
        tailoring: initialSubTab === "tailoring",
      };
    }
    return {
      intro: initialSubTab === "intro" || !initialSubTab,
      ai_engineering: initialSubTab === "ai_engineering",
      software_engineering: initialSubTab === "software_engineering",
      devops_cicd: initialSubTab === "devops_cicd" || initialSubTab === "cloud",
    };
  });

  useEffect(() => {
    if (initialSubTab) {
      const targetKey = initialSubTab === "cloud" ? "devops_cicd" : initialSubTab;
      setExpandedSections((prev) => ({
        ...prev,
        [targetKey]: true,
      }));
    }
  }, [initialSubTab]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExpandAll = () => {
    if (isJdReport) {
      setExpandedSections({
        requirements: true,
        role_alignment: true,
        current_project: true,
        tailoring: true,
      });
    } else {
      setExpandedSections({
        intro: true,
        ai_engineering: true,
        software_engineering: true,
        devops_cicd: true,
      });
    }
  };

  const handleCollapseAll = () => {
    if (isJdReport) {
      setExpandedSections({
        requirements: false,
        role_alignment: false,
        current_project: false,
        tailoring: false,
      });
    } else {
      setExpandedSections({
        intro: false,
        ai_engineering: false,
        software_engineering: false,
        devops_cicd: false,
      });
    }
  };

  if (!candidateSpoke || report.insufficient_content) {
    return <EmptyEvaluationCard />;
  }

  // ── Technical Assessment or Delivery Analysis: delegate to dedicated view ──
  if (
    report.technical_evaluation ||
    report.assessment?.assessment_type === "TECHNICAL" ||
    activeTab === "Audio Analysis" ||
    activeTab === "Video Analysis"
  ) {
    return (
      <TechnicalEvaluationView
        report={report}
        activeTab={activeTab || "Details"}
        onSelectTab={onSelectTab || (() => {})}
        seekTo={seekTo}
        videoRef={videoRef}
        assessmentId={String(report.assessment?.id || "")}
        onDurationChange={onDurationChange}
      />
    );
  }

  // Pure dynamic data resolution per section category
  const introData = resolveSectionData(
    report,
    ["career_story", "current_role", "current_project", "ai_engineering_evolution", "introduction_quality"],
    ["career"]
  );

  const aiData = resolveSectionData(
    report,
    [
      "agentic_ai",
      "rag_and_retrieval",
      "models_and_ai_platforms",
      "ai_engineering",
      "ai_agents_multiagent_mentioned",
      "mcp_mentioned",
      "memory_context_engineering_mentioned",
      "guardrails_evals_observability_mentioned",
      "rag_retrieval_chunking_mentioned",
    ],
    ["ai_engineering", "agent_frameworks", "agent_protocols_and_patterns", "retrieval_and_rag", "vector_databases", "models", "model_platforms"]
  );

  const seData = resolveSectionData(
    report,
    ["software_engineering"],
    ["software_engineering", "backend_and_api", "frontend", "databases"]
  );

  const devopsCloudData = resolveSectionData(
    report,
    ["cicd_and_delivery", "cloud_and_infrastructure", "devops", "cloud", "infrastructure", "cicd", "containers_and_orchestration", "infrastructure_as_code"],
    ["devops", "cloud", "cicd", "containers_and_orchestration", "infrastructure_as_code", "cloud_and_infrastructure", "cicd_and_delivery", "containers", "infrastructure"]
  );

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {/* Top Toolbar: Expand All / Collapse All */}
      <div className="flex items-center justify-end gap-2 pb-0.5">
        <button
          type="button"
          onClick={handleExpandAll}
          className="px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 rounded-md border border-blue-200/80 bg-white transition-colors cursor-pointer shadow-2xs"
        >
          Expand All
        </button>
        <button
          type="button"
          onClick={handleCollapseAll}
          className="px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-md border border-slate-200 bg-white transition-colors cursor-pointer shadow-2xs"
        >
          Collapse All
        </button>
      </div>

      {isJdReport ? (
        <>
          {/* ── ACCORDION 1: JD REQUIREMENTS EVIDENCE MAP ── */}
          <JdRequirementsAccordion
            coverage={report.requirement_coverage || []}
            isExpanded={Boolean(expandedSections.requirements)}
            onToggle={() => toggleSection("requirements")}
          />

          {/* ── ACCORDION 2: ROLE ALIGNMENT & CAREER STORY ── */}
          <JdRoleAlignmentAccordion
            roleAlignment={report.role_alignment}
            careerStory={report.career_story}
            isExpanded={Boolean(expandedSections.role_alignment)}
            onToggle={() => toggleSection("role_alignment")}
          />

          {/* ── ACCORDION 3: CURRENT PROJECT & TECHNICAL ALIGNMENT ── */}
          <JdCurrentProjectAccordion
            project={report.current_role_and_project}
            techAlign={report.jd_technical_alignment}
            isExpanded={Boolean(expandedSections.current_project)}
            onToggle={() => toggleSection("current_project")}
          />

          {/* ── ACCORDION 4: VALUE PROPOSITION & TAILORING ── */}
          <JdTailoringAccordion
            tailoring={report.tailoring_quality}
            valueProp={report.value_proposition}
            isExpanded={Boolean(expandedSections.tailoring)}
            onToggle={() => toggleSection("tailoring")}
          />
        </>
      ) : (
        <>
          {/* ── ACCORDION 1: INTRO EVALUATION ── */}
          <DetailSectionCard
            icon={<User size={18} className="text-indigo-600" />}
            title="Introduction Evaluation"
            status={introData.status}
            subtitle={introData.subtitle}
            observations={introData.observations}
            conceptsCovered={introData.conceptsCovered}
            conceptsMissed={introData.conceptsMissed}
            technologies={introData.technologies}
            recommendations={introData.recommendations}
            isExpanded={Boolean(expandedSections.intro)}
            onToggle={() => toggleSection("intro")}
            showConcepts={false}
          />

          {/* ── ACCORDION 2: AI ENGINEERING CONCEPTS ── */}
          <DetailSectionCard
            icon={<Cpu size={18} className="text-blue-600" />}
            title="AI Engineering Concepts"
            status={aiData.status}
            subtitle={aiData.subtitle}
            observations={aiData.observations}
            conceptsCovered={aiData.conceptsCovered}
            conceptsMissed={aiData.conceptsMissed}
            technologies={aiData.technologies}
            recommendations={aiData.recommendations}
            isExpanded={Boolean(expandedSections.ai_engineering)}
            onToggle={() => toggleSection("ai_engineering")}
          />

          {/* ── ACCORDION 3: SOFTWARE ENGINEERING CONCEPTS ── */}
          <DetailSectionCard
            icon={<Code2 size={18} className="text-sky-600" />}
            title="Software Engineering Concepts"
            status={seData.status}
            subtitle={seData.subtitle}
            observations={seData.observations}
            conceptsCovered={seData.conceptsCovered}
            conceptsMissed={seData.conceptsMissed}
            technologies={seData.technologies}
            recommendations={seData.recommendations}
            isExpanded={Boolean(expandedSections.software_engineering)}
            onToggle={() => toggleSection("software_engineering")}
          />

          {/* ── ACCORDION 4: DEVOPS, CI/CD & CLOUD CONCEPTS ── */}
          <DetailSectionCard
            icon={<GitBranch size={18} className="text-orange-600" />}
            title="DevOps, CI/CD & Cloud Concepts"
            status={devopsCloudData.status}
            subtitle={devopsCloudData.subtitle}
            observations={devopsCloudData.observations}
            conceptsCovered={devopsCloudData.conceptsCovered}
            conceptsMissed={devopsCloudData.conceptsMissed}
            technologies={devopsCloudData.technologies}
            recommendations={devopsCloudData.recommendations}
            isExpanded={Boolean(expandedSections.devops_cicd)}
            onToggle={() => toggleSection("devops_cicd")}
          />
        </>
      )}

      {/* ── BOTTOM CARDS: STRONGEST POINTS & CRITICAL GAPS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 pt-0.5">
        {/* Strongest Points */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-600 border-b border-slate-100 pb-1.5">
            <Star size={15} className="fill-emerald-500/20 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Strongest Points</h3>
          </div>
          {strongest_points.length > 0 ? (
            <ul className="space-y-1 text-xs text-slate-700">
              {strongest_points.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                  <span className="leading-snug">{pt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No specific strengths listed.</p>
          )}
        </div>

        {/* Critical Gaps */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-amber-600 border-b border-slate-100 pb-1.5">
            <AlertTriangle size={15} className="fill-amber-500/20 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Critical Gaps</h3>
          </div>
          {critical_gaps.length > 0 ? (
            <ul className="space-y-1 text-xs text-slate-700">
              {critical_gaps.map((gap, idx) => (
                <li key={idx} className="p-2 rounded-lg bg-amber-50/50 border border-amber-200/60 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {gap.topic || "Critical Gap"}
                    </span>
                    {gap.importance && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        {gap.importance}
                      </span>
                    )}
                  </div>
                  {gap.what_is_missing && (
                    <p className="text-slate-700 text-xs leading-snug">
                      <span className="font-semibold text-slate-800">What's missing: </span>
                      {gap.what_is_missing}
                    </p>
                  )}
                  {gap.why_it_matters && (
                    <p className="text-slate-600 text-xs leading-snug">
                      <span className="font-semibold text-slate-700">Why it matters: </span>
                      {gap.why_it_matters}
                    </p>
                  )}
                  {gap.suggested_addition && (
                    <p className="text-emerald-900 text-xs leading-snug bg-emerald-50/70 p-1.5 rounded border border-emerald-200/70 italic">
                      <span className="font-semibold not-italic text-emerald-800">Suggested addition: </span>
                      "{gap.suggested_addition}"
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No critical gaps identified.</p>
          )}
        </div>
      </div>

      {/* Priority Improvements */}
      {priority_improvements.length > 0 && (
        <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 border-b border-slate-100 pb-1.5">
            <Target size={15} className="shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Priority Improvements</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-2.5">
            {priority_improvements.map((imp, idx) => (
              <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 sm:p-2.5 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 shrink-0">
                    {imp.priority || idx + 1}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                    {imp.topic || `Improvement #${idx + 1}`}
                  </h4>
                </div>
                {imp.guidance && (
                  <p className="text-xs text-slate-600 leading-snug">
                    {imp.guidance}
                  </p>
                )}
                {imp.example && (
                  <p className="text-[11px] text-indigo-900 leading-snug italic bg-indigo-50/60 p-1.5 rounded border border-indigo-100/70">
                    "{imp.example}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Assessment Diagnostic Card */}
      {report.jd_final_assessment && (
        <JdFinalAssessmentCard finalAssessment={report.jd_final_assessment} />
      )}

    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  TRANSCRIPT MODAL
// ═════════════════════════════════════════════════════════════════════════════

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
//  JOB DESCRIPTION MODAL & HELPERS
// ═════════════════════════════════════════════════════════════════════════════

export function isJobDescriptionAssessment(
  assessment?: AssessmentDetail | null,
  report?: NormalizedReport | null
): boolean {
  if (!assessment) return false;
  const rawType = (
    assessment.assessment_type ||
    (report?.assessment as any)?.assessment_type ||
    ""
  ).toUpperCase().replace(/[\s-]+/g, "_");

  if (
    rawType === "JD_INTRO" ||
    rawType === "JOB_DESCRIPTION_INTRO" ||
    rawType === "JD" ||
    rawType === "JDINTRO"
  ) {
    return true;
  }

  const jdText =
    assessment.job_description ||
    (assessment as any)?.job_description_text ||
    (report?.assessment as any)?.job_description ||
    (report?.assessment as any)?.job_description_text ||
    (assessment.data as any)?.job_description ||
    (assessment.data as any)?.jd_text;

  if (typeof jdText === "string" && jdText.trim().length > 0) {
    return true;
  }

  if (typeof window !== "undefined") {
    const activeType = (window.sessionStorage?.getItem("aiprep_active_type") || "").toUpperCase();
    if (activeType === "JD_INTRO" || activeType === "JD") {
      return true;
    }
  }

  return false;
}

export function getAssessmentJobDescription(
  assessment?: AssessmentDetail | null,
  report?: NormalizedReport | null
): string {
  const direct =
    assessment?.job_description ||
    (assessment as any)?.job_description_text ||
    (report?.assessment as any)?.job_description ||
    (report?.assessment as any)?.job_description_text ||
    (assessment?.data as any)?.job_description ||
    (assessment?.data as any)?.jd_text ||
    (report as any)?.job_description;

  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim();
  }

  if (typeof window !== "undefined") {
    const stored = window.sessionStorage?.getItem("aiprep_jd_text");
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
  }

  // Fallback: reconstruct a readable JD summary from jd_analysis data
  const analysis = report?.jd_analysis;
  if (analysis) {
    const lines: string[] = [];
    if (analysis.role_title) lines.push(`Role: ${analysis.role_title}`);
    if (analysis.domain) lines.push(`Domain: ${analysis.domain}`);
    if (analysis.seniority_level) lines.push(`Seniority: ${analysis.seniority_level}`);

    if (analysis.must_have_requirements?.length) {
      lines.push("\nMust-Have Requirements:");
      analysis.must_have_requirements.forEach((s: string) => lines.push(`  - ${s}`));
    }
    if (analysis.nice_to_have_requirements?.length) {
      lines.push("\nNice-to-Have:");
      analysis.nice_to_have_requirements.forEach((s: string) => lines.push(`  - ${s}`));
    }
    if (analysis.core_responsibilities?.length) {
      lines.push("\nCore Responsibilities:");
      analysis.core_responsibilities.forEach((r: string) => lines.push(`  - ${r}`));
    }
    if (analysis.soft_skills_and_ownership?.length) {
      lines.push("\nSoft Skills & Ownership:");
      analysis.soft_skills_and_ownership.forEach((s: string) => lines.push(`  - ${s}`));
    }
    if (lines.length > 0) return lines.join("\n");
  }

  return "";
}

export function getAssessmentTargetRoleInfo(
  assessment?: AssessmentDetail | null,
  report?: NormalizedReport | null
): { role: string; company: string } {
  let role = "";
  let company = "";

  if (typeof window !== "undefined") {
    role = window.sessionStorage?.getItem("aiprep_jd_role") || "";
    company = window.sessionStorage?.getItem("aiprep_jd_company") || "";
  }

  const dataObj = (assessment?.data as any) || {};
  if (!role && dataObj?.target_role) role = String(dataObj.target_role);
  if (!company && dataObj?.target_company) company = String(dataObj.target_company);

  return { role, company };
}

function JobDescriptionModal({
  isOpen,
  onClose,
  assessment,
  report,
}: {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentDetail;
  report: NormalizedReport;
}) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const rawJd =
    (typeof assessment?.job_description === "string" && assessment.job_description.trim()) ||
    (typeof (assessment as any)?.job_description_text === "string" && (assessment as any).job_description_text.trim()) ||
    (typeof (report?.assessment as any)?.job_description === "string" && (report?.assessment as any).job_description.trim()) ||
    (typeof (report?.assessment as any)?.job_description_text === "string" && (report?.assessment as any).job_description_text.trim()) ||
    (typeof (assessment?.data as any)?.job_description === "string" && (assessment?.data as any).job_description.trim()) ||
    (typeof (assessment?.data as any)?.jd_text === "string" && (assessment?.data as any).jd_text.trim()) ||
    (typeof (report as any)?.job_description === "string" && (report as any).job_description.trim()) ||
    (typeof window !== "undefined" ? window.sessionStorage?.getItem("aiprep_jd_text")?.trim() || "" : "") ||
    "";

  const jdText = rawJd || getAssessmentJobDescription(assessment, report);
  const { role, company } = getAssessmentTargetRoleInfo(assessment, report);

  const handleCopy = () => {
    if (jdText) {
      navigator.clipboard.writeText(jdText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Briefcase size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {role || "Target Job Description"}
              </h3>
              {company ? (
                <p className="text-xs text-slate-500">{company}</p>
              ) : (
                <p className="text-xs text-slate-500">Job Description for this assessment</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            aria-label="Close Job Description modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {!rawJd && report.jd_analysis
                ? "Parsed JD Summary"
                : "Job Description Content"}
            </span>
            {jdText && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-slate-500" />
                    <span>Copy Job Description</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* If raw JD was provided, always display the exact text. Fall back to structured jd_analysis if only analysis exists */}
          {!rawJd && report.jd_analysis ? (
            <div className="space-y-4">
              {/* Meta row */}
              {(report.jd_analysis.role_title || report.jd_analysis.seniority_level || report.jd_analysis.domain) && (
                <div className="flex flex-wrap gap-2">
                  {report.jd_analysis.role_title && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Briefcase size={11} /> {report.jd_analysis.role_title}
                    </span>
                  )}
                  {report.jd_analysis.seniority_level && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                      {report.jd_analysis.seniority_level}
                    </span>
                  )}
                  {report.jd_analysis.domain && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                      {report.jd_analysis.domain}
                    </span>
                  )}
                </div>
              )}

              {/* Must-Have Requirements */}
              {(report.jd_analysis.must_have_requirements?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Must-Have Requirements</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.jd_analysis.must_have_requirements!.map((s: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Nice-to-Have Requirements */}
              {(report.jd_analysis.nice_to_have_requirements?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nice-to-Have</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.jd_analysis.nice_to_have_requirements!.map((s: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Responsibilities */}
              {(report.jd_analysis.core_responsibilities?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Core Responsibilities</p>
                  <ul className="space-y-1.5">
                    {report.jd_analysis.core_responsibilities!.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="mt-0.5 text-indigo-400 shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Soft Skills */}
              {(report.jd_analysis.soft_skills_and_ownership?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Soft Skills & Ownership</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.jd_analysis.soft_skills_and_ownership!.map((s: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 italic text-center">
                Showing AI-parsed JD summary — original JD text was not stored for this session.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap select-text font-mono">
                {jdText || "No job description text was provided for this assessment session."}
              </p>
            </div>
          )}
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
//  REPORT HEADER
// ═════════════════════════════════════════════════════════════════════════════

export interface ReportHeaderProps {
  assessment: AssessmentDetail;
  report: NormalizedReport;
  activeTab: ReportTab;
  onSelectTab: (tab: ReportTab) => void;
  onOpenTranscript?: () => void;
  mediaDuration?: number | null;
  onOpenJd?: () => void;
}

export function getAssessmentsListUrl(): string {
  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    const fromParam = searchParams.get("from");
    if (fromParam === "avatar" || fromParam?.includes("avatar")) {
      return "/avatar/assessments";
    }
    if (fromParam && fromParam.startsWith("/")) {
      return fromParam;
    }
    const stored = sessionStorage.getItem("aiprep_return_url");
    if (stored) return stored;

    if (document.referrer) {
      if (document.referrer.includes("/avatar/assessments") || document.referrer.includes("/avatar")) {
        return "/avatar/assessments";
      }
    }
    try {
      const role = getUserTeamRole();
      if (role === "employee" || role === "admin" || role === "instructor") {
        return "/avatar/assessments";
      }
    } catch {}
  }
  return "/user_dashboard/ai-prep/assessments";
}

export function navigateToAssessmentType(router: ReturnType<typeof useRouter>) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("aiprep_wizard_step", "CONFIGURATION");
      sessionStorage.removeItem("aiprep_active_id");
      sessionStorage.removeItem("aiprep_active_questions");
      sessionStorage.removeItem("aiprep_hardware_check");
      sessionStorage.removeItem("aiprep_jd_text");
      sessionStorage.removeItem("aiprep_jd_filename");
      sessionStorage.removeItem("aiprep_jd_role");
      sessionStorage.removeItem("aiprep_jd_company");
    } catch {}

    const searchParams = new URLSearchParams(window.location.search);
    const fromParam = searchParams.get("from");
    const isEmbedded = searchParams.get("embed") === "true" || (window.self !== window.top);

    if (fromParam === "avatar" || fromParam?.includes("avatar")) {
      router.push("/avatar/assessments");
      return;
    }

    const role = getUserTeamRole();
    if (role === "employee" || role === "admin") {
      router.push("/avatar/assessments");
      return;
    }

    const storedReturn = sessionStorage.getItem("aiprep_return_url");
    if (storedReturn && storedReturn.includes("/aiprep") && !storedReturn.includes("/user_dashboard")) {
      router.push(isEmbedded ? "/aiprep?embed=true&start=true" : "/aiprep?start=true");
      return;
    }

    const targetUrl = isEmbedded
      ? "/user_dashboard/ai-prep/assessment-type?embed=true"
      : "/user_dashboard/ai-prep/assessment-type";
    router.push(targetUrl);
    return;
  }
  router.push("/user_dashboard/ai-prep/assessment-type");
}

export function navigateToAssessmentsList(router: ReturnType<typeof useRouter>) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("aiprep_wizard_step");
      sessionStorage.removeItem("aiprep_active_id");
      sessionStorage.removeItem("aiprep_jd_text");
      sessionStorage.removeItem("aiprep_jd_filename");
      sessionStorage.removeItem("aiprep_jd_role");
      sessionStorage.removeItem("aiprep_jd_company");
    } catch {}

    const targetUrl = getAssessmentsListUrl();
    router.replace(targetUrl);
    return;
  }
  router.replace("/avatar/assessments");
}

export function ReportHeader({
  assessment,
  report,
  activeTab,
  onSelectTab,
  onOpenTranscript,
  mediaDuration,
  onOpenJd,
}: ReportHeaderProps) {
  const router = useRouter();
  const candidateSpoke = hasRealSpeech(report);
  const isJdAssessment = isJobDescriptionAssessment(assessment, report);
  const showViewJd = isJdAssessment || Boolean(getAssessmentJobDescription(assessment, report));

  const candidateName =
    report.candidate_name ||
    assessment.candidate_name ||
    (assessment as any)?.candidate_full_name ||
    (assessment as any)?.candidate?.full_name ||
    (assessment as any)?.candidate?.name ||
    (() => {
      if (typeof window !== "undefined") {
        try {
          const userStr = localStorage.getItem("user") || localStorage.getItem("user_profile") || localStorage.getItem("auth_user");
          if (userStr) {
            const u = JSON.parse(userStr);
            if (u?.full_name) return u.full_name;
            if (u?.name) return u.name;
            if (u?.first_name) return `${u.first_name} ${u.last_name || ""}`.trim();
          }
        } catch {}
      }
      return null;
    })();

  const typeLabelMap: Record<string, string> = {
    INTRO: "Introductory Assessment",
    JD_INTRO: "JD Walkthrough Assessment",
    TECHNICAL: "Technical Assessment",
    SYSTEM_DESIGN: "System Design Assessment",
    HIRING_MANAGER: "Hiring Manager Assessment",
    RECRUITER: "Recruiter Assessment",
  };

  const typeName =
    (assessment.assessment_type && typeLabelMap[assessment.assessment_type]) ||
    (isJdAssessment ? "JD Walkthrough Assessment" : "Assessment Evaluation");

  const rawDate = assessment.completed_at || assessment.created_at;
  const completedDateStr = rawDate
    ? (() => {
        let dateStr = String(rawDate).trim();
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

  const durationStr = getTranscriptDuration(report, mediaDuration) || undefined;

  const typeStr =
    assessment.assessment_type === "INTRO"
      ? "Introductory"
      : assessment.assessment_type === "JD_INTRO"
        ? "JD Walkthrough"
        : isJdAssessment
          ? "JD Walkthrough"
          : assessment.assessment_type
            ? assessment.assessment_type.replaceAll("_", " ")
            : "Introductory";

  return (
    <header className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs mb-2.5 sm:mb-3">
      {/* Top Row: Back link + View JD + View Transcript button */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigateToAssessmentsList(router)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Assessments
        </button>

        <div className="flex items-center gap-2">
          {showViewJd && onOpenJd && (
            <button
              type="button"
              onClick={onOpenJd}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
            >
              <Briefcase size={13} className="text-indigo-600" />
              View JD
            </button>
          )}

          {Boolean(report.consent?.save_transcript ?? true) && !report.insufficient_content && candidateSpoke && onOpenTranscript && (
            <button
              type="button"
              onClick={onOpenTranscript}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 shadow-2xs hover:bg-violet-100 hover:border-violet-300 transition-colors cursor-pointer"
            >
              <FileText size={13} className="text-violet-600" />
              View Transcript
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h1 className="mt-1.5 text-lg sm:text-xl font-bold tracking-tight text-[#071d49]">
        {typeName}
      </h1>

      {/* Metadata Row */}
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
        {candidateName && (
          <>
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <User size={12} className="text-slate-400" />
              Candidate: {candidateName}
            </span>
            {(completedDateStr || durationStr || typeStr) && <span className="text-slate-300">|</span>}
          </>
        )}
        {completedDateStr && <span>Completed on: {completedDateStr}</span>}
        {completedDateStr && (durationStr || typeStr) && <span className="text-slate-300">|</span>}
        {durationStr && <span>Duration: {durationStr}</span>}
        {durationStr && typeStr && <span className="text-slate-300">|</span>}
        {typeStr && <span>Type: {typeStr}</span>}
      </div>

      {/* Navigation Tabs: Overview, Details, and Audio/Video Analysis */}
      <nav
        className="mt-2.5 flex gap-5 border-b border-slate-200"
        aria-label="Report sections"
      >
        {(() => {
          const analysisTabLabel: ReportTab | null = report.delivery_analysis
            ? (report.delivery_analysis.type === "video" ? "Video Analysis" : "Audio Analysis")
            : null;

          const tabs: Array<{ label: ReportTab }> = [
            { label: "Overview" },
            { label: "Details" },
            // TEMPORARY: Audio/Video Analysis tab disabled
            // ...(analysisTabLabel ? [{ label: analysisTabLabel }] : []),
          ];

          return tabs.map((tab) => {
            const isTabActive =
              (tab.label === "Overview" && (activeTab === "Overview" || activeTab === "Evaluation")) ||
              (tab.label === "Details" && activeTab === "Details") ||
              (tab.label === "Audio Analysis" && activeTab === "Audio Analysis") ||
              (tab.label === "Video Analysis" && activeTab === "Video Analysis");

            const isDetailsDisabled = tab.label === "Details" && !candidateSpoke;

            return (
              <button
                key={tab.label}
                type="button"
                disabled={isDetailsDisabled}
                onClick={() => !isDetailsDisabled && onSelectTab(tab.label)}
                className={`pb-1.5 text-xs sm:text-sm transition-colors ${
                  isDetailsDisabled
                    ? "text-slate-300 cursor-not-allowed select-none"
                    : isTabActive
                    ? "border-b-2 border-blue-600 font-bold text-blue-600 cursor-pointer"
                    : "font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                }`}
              >
                {tab.label}
              </button>
            );
          });
        })()}
      </nav>
    </header>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN CONTAINER / EXPORT
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

  const [activeTab, setActiveTab] = useState<ReportTab>(() => {
    if (tabParam) return tabFromParam(tabParam);
    return initialTab ?? "Overview";
  });

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
  const [isCancelled, setIsCancelled] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const [isJdModalOpen, setIsJdModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => undefined);
    }
  };

  const lastLoadedIdRef = useRef<string | null>(null);
  const reportRequestIdRef = useRef(0);
  const [candidateId, setCandidateId] = useState<string | number | null>(() => initialCandidateId ?? null);

  const loadReport = useCallback(async (forceRefresh = false) => {
    if (!assessmentId) return;
    // Avoid duplicate initial loads, but allow an explicit user-triggered status check.
    if (!forceRefresh && lastLoadedIdRef.current === String(assessmentId)) return;
    lastLoadedIdRef.current = String(assessmentId);

    // If the user refreshes again before a request finishes, only the newest
    // request is allowed to update the report UI.
    const requestId = ++reportRequestIdRef.current;
    const isCurrentRequest = () => requestId === reportRequestIdRef.current;

    setLoading(true);
    setError("");
    setIsProcessing(false);
    setIsCancelled(false);
    setStatusMsg("");

    try {
      const assessment = await aiPrepApi.getAssessment(assessmentId);
      if (!isCurrentRequest()) return;

      if (assessment?.candidate_id) {
        setCandidateId(assessment.candidate_id);
      }
      const statusUpper = (assessment.status || "").toUpperCase();

      if (statusUpper === "CANCELLED") {
        setIsCancelled(true);
        setLoading(false);
        return;
      }

      if (
        ["EVALUATING", "IN_PROGRESS", "SUBMITTED", "PENDING"].includes(statusUpper) &&
        !assessment.report
      ) {
        setIsProcessing(true);
        setStatusMsg("Your assessment report is still being prepared.");
        setLoading(false);
        return;
      }

      const dataVal = (assessment.data as any) || null;
      let reportVal = (assessment.report as any) || null;

      if (!reportVal && !assessment.report) {
        if (typeof window !== "undefined") {
          try {
            const cachedStr = sessionStorage.getItem(`aiprep_submission_${assessmentId}`);
            if (cachedStr) {
              const cached = JSON.parse(cachedStr);
              if (cached?.data?.report || cached?.report) {
                reportVal = cached.data?.report || cached.report;
              }
            }
          } catch (_) {}
        }

        if (!reportVal && statusUpper === "COMPLETED") {
          setReport(normalizeReport(assessment, dataVal, null));
          return;
        }

        if (!reportVal) {
          setError(
            statusUpper === "FAILED"
              ? "Assessment evaluation could not be completed."
              : "We couldn't load this assessment report."
          );
          setLoading(false);
          return;
        }
      }

      setReport(normalizeReport(assessment, dataVal, reportVal));
    } catch (err: unknown) {
      if (!isCurrentRequest()) return;
      console.error("[AiPrepReport] Failed to load real report:", err);
      setError("We couldn't load this assessment report.");
    } finally {
      if (isCurrentRequest()) setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // The session page owns the submission SSE connection and navigates here only after COMPLETED.
  // This page intentionally performs no polling or secondary stream requests.

  // ── Auto-Poll when assessment is in EVALUATING / isProcessing state ───────
  useEffect(() => {
    if (!isProcessing || !assessmentId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const fresh = await aiPrepApi.getAssessment(assessmentId);
        const status = (fresh?.status || "").toUpperCase();
        if (isMounted && (status === "COMPLETED" || status === "FAILED" || status === "CANCELLED" || fresh?.report)) {
          clearInterval(interval);
          loadReport(true);
        }
      } catch (_) {}
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isProcessing, assessmentId, loadReport]);

  // ── Auto-Swap to YouTube when background upload completes ─────────────────
  useEffect(() => {
    if (!report || report.youtube_url || isProcessing || !assessmentId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const fresh = await aiPrepApi.getAssessment(assessmentId);
        if (isMounted && fresh?.youtube_url) {
          clearInterval(interval);
          loadReport();
        }
      } catch (_) {}
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [report, isProcessing, assessmentId, loadReport]);

  useEffect(() => {
    document.documentElement.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("height");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("height");
  }, []);

  const [detailsSubTab, setDetailsSubTab] = useState<string>(() => {
    return searchParams.get("section") || "intro";
  });

  useEffect(() => {
    const sec = searchParams.get("section");
    if (sec) {
      setDetailsSubTab(sec);
    }
  }, [searchParams]);

  const handleTabChange = (tabLabel: ReportTab, subTab?: string) => {
    if (tabLabel === "Details" && report && !hasRealSpeech(report)) {
      return;
    }
    setActiveTab(tabLabel);
    const resolvedSubTab = subTab ?? (tabLabel === "Details" ? "intro" : undefined);
    if (resolvedSubTab) {
      setDetailsSubTab(resolvedSubTab);
    }
  };

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

  if (isProcessing) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f8fafc] p-4 select-none">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full mx-auto shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 flex items-center justify-center mb-4 text-[#7C3AED] shadow-sm">
            <LoaderCircle size={36} className="animate-spin text-[#7C3AED]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">
            Submitting Assessment
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-5">
            {statusMsg || "Your assessment evaluation is still in progress. Check the status to see whether your report is ready."}
          </p>
          <button
            type="button"
            onClick={() => loadReport(true)}
            className="mb-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
          >
            <RefreshCw size={15} /> Check status / Refresh report
          </button>
          <p className="mb-4 text-xs text-slate-400">This checks once when you click; it does not poll automatically.</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-[#7C3AED] to-purple-400 rounded-full animate-pulse w-full" />
          </div>
        </div>
      </main>
    );
  }

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
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => loadReport(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
            >
              <RefreshCw size={15} /> Try Again
            </button>
          </div>
        </section>
      </main>
    );
  }

  const { assessment } = report;
  const isOverviewTab = activeTab === "Overview" || activeTab === "Evaluation";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 w-full space-y-2.5 sm:space-y-3">
        <ReportHeader
          assessment={assessment}
          report={report}
          activeTab={activeTab}
          onSelectTab={handleTabChange}
          onOpenTranscript={() => setIsTranscriptModalOpen(true)}
          mediaDuration={mediaDuration}
          onOpenJd={() => setIsJdModalOpen(true)}
        />

        <main>
          {/* Keep both tabs mounted in the DOM to preserve audio/video playback and prevent unmount errors */}
          <div className={isOverviewTab ? "block" : "hidden"}>
            <EvaluationContent
              report={report}
              videoRef={videoRef}
              seekTo={seekTo}
              assessmentId={assessmentId}
              onSelectTab={handleTabChange}
              onOpenTranscript={() => setIsTranscriptModalOpen(true)}
              onDurationChange={setMediaDuration}
            />
          </div>
          <div className={!isOverviewTab ? "block" : "hidden"}>
            <DetailsContent
              report={report}
              seekTo={seekTo}
              videoRef={videoRef}
              initialSubTab={detailsSubTab}
              activeTab={activeTab}
              onSelectTab={handleTabChange}
              onOpenTranscript={() => setIsTranscriptModalOpen(true)}
              onDurationChange={setMediaDuration}
            />
          </div>
        </main>
      </div>

      <TranscriptModal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        report={report}
      />

      <JobDescriptionModal
        isOpen={isJdModalOpen}
        onClose={() => setIsJdModalOpen(false)}
        assessment={assessment}
        report={report}
      />
    </div>
  );
}