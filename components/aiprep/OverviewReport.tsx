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
} from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";
import {
  normalizeReport,
  type NormalizedReport,
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

// Fixed evaluation concepts to show in checklists (shows covered, partial, not mentioned, N/A)
const AGENTIC_AI_CONCEPTS = [
  "agentic_ai",
  "agent_framework",
  "orchestration",
  "design_patterns",
  "agent_to_agent",
  "multi_agent",
  "mcp",
  "tool_calling",
  "memory_management",
  "context_engineering",
  "evaluations",
  "guardrails",
  "observability",
  "governance",
  "prompt_engineering",
  "reasoning_strategy",
] as const;

const RAG_CONCEPTS = [
  "rag",
  "retrieval",
  "ingestion",
  "cleaning_preprocessing",
  "chunking",
  "embeddings",
  "vector_database",
  "hybrid_retrieval",
  "reranking",
  "metadata_filtering",
  "knowledge_graph",
  "ontology",
  "query_optimization",
  "caching",
  "retrieval_evaluation",
] as const;

const SE_CONCEPTS = [
  "apis",
  "api_gateway",
  "fastapi",
  "backend_services",
  "microservices",
  "react_frontend",
  "sql_database",
  "document_nosql_database",
  "caching",
] as const;

const DEVOPS_CONCEPTS = [
  "cicd",
  "github_actions",
  "gitops",
  "automated_testing",
  "deployment_strategy",
  "docker",
  "kubernetes",
] as const;

const CLOUD_CONCEPTS = [
  "aws",
  "gcp",
  "azure",
  "terraform",
] as const;


// ═════════════════════════════════════════════════════════════════════════════
//  QUALITATIVE BADGE (STATUS PILL)
// ═════════════════════════════════════════════════════════════════════════════

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
  /^assessment\s+completed\.?$/i,
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
  if (
    isRealContent(report.overall_summary) ||
    (report.intro_sections && report.intro_sections.length > 0) ||
    Boolean(report.scores?.overall_band || report.scores?.ai_engineering?.band)
  ) {
    return true;
  }
  const fullText = (report.transcript?.full_text || "").trim();
  return fullText.length > 15;
}

function getTranscriptDuration(report: NormalizedReport): string {
  if (!hasRealSpeech(report)) return "";
  const assessment = report.assessment;
  let totalSec: number | null = null;

  const dataRec = assessment.data as any;
  if (dataRec?.audio_telemetry?.speaking_duration_seconds != null) {
    const sec = Number(dataRec.audio_telemetry.speaking_duration_seconds);
    if (!isNaN(sec) && sec > 0) totalSec = Math.round(sec);
  }
  if (!totalSec && (assessment as any)?.duration_seconds != null) {
    const sec = Number((assessment as any).duration_seconds);
    if (!isNaN(sec) && sec > 0) totalSec = Math.round(sec);
  }
  if (!totalSec && report.transcript?.segments && report.transcript.segments.length > 0) {
    const segs = report.transcript.segments;
    const lastSeg = segs[segs.length - 1];
    if (lastSeg.timestamp_s != null && lastSeg.timestamp_s > 0) {
      totalSec = Math.round(lastSeg.timestamp_s);
    }
  }
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

function matchesConceptOrTech(tech: string, conceptKey: string): boolean {
  const normTech = tech.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normKey = conceptKey.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normTech || !normKey) return false;
  if (normTech === normKey) return true;
  // Common aliases and abbreviations
  if (normKey === "cicd" && (normTech === "cicd" || normTech.includes("continuousintegration") || normTech.includes("continuousdeployment"))) return true;
  if (normKey === "kubernetes" && (normTech === "k8s" || normTech === "kube" || normTech === "kubectl" || normTech === "eks" || normTech === "gke" || normTech === "aks")) return true;
  if (normKey === "docker" && (normTech === "dockerfile" || normTech === "compose" || normTech === "containerd" || normTech === "containers")) return true;
  if (normKey === "aws" && (normTech === "amazonwebservices" || normTech === "amazoncloud" || normTech === "ec2" || normTech === "s3" || normTech === "lambda" || normTech === "ecs")) return true;
  if (normKey === "gcp" && (normTech === "googlecloud" || normTech === "googlecloudplatform" || normTech === "gke")) return true;
  if (normKey === "azure" && (normTech === "microsoftazure" || normTech === "aks")) return true;
  if (normKey === "terraform" && (normTech === "tf" || normTech === "opentofu" || normTech === "iac")) return true;
  if (normKey === "githubactions" && (normTech === "ghactions" || normTech === "githubaction")) return true;
  return false;
}

function resolveSectionData(
  report: NormalizedReport,
  secKeys: string[],
  conceptMasterList: readonly string[],
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

  // 4. Technologies Mentioned
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
  // Also check if any item anywhere in technology_inventory matches any concept in conceptMasterList
  if (technology_inventory && typeof technology_inventory === "object") {
    Object.values(technology_inventory).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((t) => {
          if (typeof t === "string" && t.trim()) {
            const trimmed = t.trim();
            if (conceptMasterList.some((cKey) => matchesConceptOrTech(trimmed, cKey))) {
              techSet.add(trimmed);
            }
          }
        });
      }
    });
  }

  // 5. Concepts Covered vs Missed
  const coveredSet = new Set<string>();
  const missedSet = new Set<string>();

  conceptMasterList.forEach((cKey) => {
    let isCovered = false;

    // Check matched section concepts
    matchedSecs.forEach((sec) => {
      if (sec.concepts) {
        for (const [k, v] of Object.entries(sec.concepts)) {
          if (matchesConceptOrTech(k, cKey)) {
            const st = (v || "").toUpperCase().trim();
            if (["COVERED", "STRONG", "GOOD", "EXCELLENT", "PARTIAL"].includes(st)) {
              isCovered = true;
            }
          }
        }
      }
      if (sec.technologies_mentioned && Array.isArray(sec.technologies_mentioned)) {
        if (sec.technologies_mentioned.some((t) => matchesConceptOrTech(t, cKey))) {
          isCovered = true;
        }
      }
    });

    // Check techSet
    if (Array.from(techSet).some((t) => matchesConceptOrTech(t, cKey))) {
      isCovered = true;
    }

    if (isCovered) {
      coveredSet.add(cKey);
    } else {
      missedSet.add(cKey);
    }
  });

  // If any concepts or technologies were covered, ensure status is not NOT_MENTIONED
  if (coveredSet.size > 0 && status === "NOT_MENTIONED") {
    status = coveredSet.size >= 3 ? "STRONG" : "PARTIAL";
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
      ? (window as any).__aiprep_local_preview?.[assessmentId] || undefined
      : undefined;

  const effectivePlaybackUrl = canShowRecording
    ? (youtube_url ||
        localPreviewUrl ||
        (assessmentId
          ? `${(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api$/, "")}/api/aiprep/assessments/${assessmentId}/${mediaPath}${authToken ? `?token=${encodeURIComponent(authToken)}` : ""}`
          : undefined))
    : undefined;

  const durationSeconds =
    report.audio?.recording_environment?.speaking_duration_seconds ||
    (report as any).audio_telemetry?.duration ||
    0;


  const candidateSpoke = hasRealSpeech(report);

  if (!candidateSpoke) {
    return <EmptyEvaluationCard />;
  }

  // Pure dynamic data resolution per section category matching Details tab
  const introData = resolveSectionData(
    report,
    ["career_story", "current_role", "current_project", "ai_engineering_evolution", "introduction_quality"],
    [],
    ["career"]
  );


  const aiData = resolveSectionData(
    report,
    ["agentic_ai", "rag_and_retrieval", "models_and_ai_platforms"],
    [...AGENTIC_AI_CONCEPTS, ...RAG_CONCEPTS],
    ["ai_engineering", "agent_frameworks", "agent_protocols_and_patterns", "retrieval_and_rag", "vector_databases", "models", "model_platforms"]
  );

  const seData = resolveSectionData(
    report,
    ["software_engineering"],
    SE_CONCEPTS,
    ["software_engineering", "backend_and_api", "frontend", "databases"]
  );

  const devopsCloudData = resolveSectionData(
    report,
    ["cicd_and_delivery", "cloud_and_infrastructure", "devops", "cloud", "infrastructure", "cicd", "containers_and_orchestration", "infrastructure_as_code"],
    [...DEVOPS_CONCEPTS, ...CLOUD_CONCEPTS],
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
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Readiness:</span>
            <QualitativeBadge status={readiness} size="sm" />
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
      </section>

      {/* ── 2. EVALUATION CATEGORY CARDS (2x2 GRID) ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
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
      </section>

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
              videoRef={videoRef}
              isAudioOnly={isAudioOnly}
              candidateName={report.candidate_name}
              durationSeconds={durationSeconds}
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
  initialSubTab = "intro",
  onOpenTranscript,
}: {
  report: NormalizedReport;
  seekTo: (seconds: number) => void;
  initialSubTab?: string;
  onOpenTranscript?: () => void;
}) {
  const {
    critical_gaps = [],
    priority_improvements = [],
    strongest_points = [],
  } = report;

  const candidateSpoke = hasRealSpeech(report);

  // Accordion state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    intro: initialSubTab === "intro" || !initialSubTab,
    ai_engineering: initialSubTab === "ai_engineering",
    software_engineering: initialSubTab === "software_engineering",
    devops_cicd: initialSubTab === "devops_cicd" || initialSubTab === "cloud",
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
    setExpandedSections({
      intro: true,
      ai_engineering: true,
      software_engineering: true,
      devops_cicd: true,
    });
  };

  const handleCollapseAll = () => {
    setExpandedSections({
      intro: false,
      ai_engineering: false,
      software_engineering: false,
      devops_cicd: false,
    });
  };

  if (!candidateSpoke || report.insufficient_content) {
    return <EmptyEvaluationCard />;
  }

  // Pure dynamic data resolution per section category
  const introData = resolveSectionData(
    report,
    ["career_story", "current_role", "current_project", "ai_engineering_evolution", "introduction_quality"],
    [],
    ["career"]
  );

  const aiData = resolveSectionData(
    report,
    ["agentic_ai", "rag_and_retrieval", "models_and_ai_platforms"],
    [...AGENTIC_AI_CONCEPTS, ...RAG_CONCEPTS],
    ["ai_engineering", "agent_frameworks", "agent_protocols_and_patterns", "retrieval_and_rag", "vector_databases", "models", "model_platforms"]
  );

  const seData = resolveSectionData(
    report,
    ["software_engineering"],
    SE_CONCEPTS,
    ["software_engineering", "backend_and_api", "frontend", "databases"]
  );

  const devopsCloudData = resolveSectionData(
    report,
    ["cicd_and_delivery", "cloud_and_infrastructure", "devops", "cloud", "infrastructure", "cicd", "containers_and_orchestration", "infrastructure_as_code"],
    [...DEVOPS_CONCEPTS, ...CLOUD_CONCEPTS],
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
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                  <span className="leading-snug">
                    {gap.what_is_missing || gap.topic || gap.why_it_matters}
                  </span>
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
                <p className="text-xs text-slate-600 leading-snug">
                  {imp.guidance || imp.example}
                </p>
              </div>
            ))}
          </div>
        </div>
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
//  REPORT HEADER
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
    } catch {}

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
}: ReportHeaderProps) {
  const router = useRouter();
  const candidateSpoke = hasRealSpeech(report);

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
    JD_INTRO: "Job-Specific Introduction Assessment",
    TECHNICAL: "Technical Assessment",
    SYSTEM_DESIGN: "System Design Assessment",
    HIRING_MANAGER: "Hiring Manager Assessment",
    RECRUITER: "Recruiter Assessment",
  };

  const typeName =
    (assessment.assessment_type && typeLabelMap[assessment.assessment_type]) ||
    "Assessment Evaluation";

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

  const durationStr = getTranscriptDuration(report) || undefined;

  const typeStr =
    assessment.assessment_type === "INTRO"
      ? "Introductory"
      : assessment.assessment_type
        ? assessment.assessment_type.replaceAll("_", " ")
        : "Introductory";

  return (
    <header className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs mb-2.5 sm:mb-3">
      {/* Top Row: Back link + View Transcript button */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigateToAssessmentsList(router)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Assessments
        </button>

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

      {/* Navigation Tabs: Overview & Details */}
      <nav
        className="mt-2.5 flex gap-5 border-b border-slate-200"
        aria-label="Report sections"
      >
        {REPORT_TABS.map((tab) => {
          const isOverviewTab =
            (tab.label === "Overview" && (activeTab === "Overview" || activeTab === "Evaluation")) ||
            (tab.label === "Details" && activeTab === "Details");

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
                  : isOverviewTab
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => undefined);
    }
  };

  const lastLoadedIdRef = useRef<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | number | null>(() => initialCandidateId ?? null);

  const loadReport = useCallback(async (forceRefresh = false) => {
    if (!assessmentId) return;
    // Avoid duplicate initial loads, but allow an explicit user-triggered status check.
    if (!forceRefresh && lastLoadedIdRef.current === String(assessmentId)) return;
    lastLoadedIdRef.current = String(assessmentId);

    setLoading(true);
    setError("");
    setIsProcessing(false);
    setIsCancelled(false);
    setStatusMsg("");

    try {
      const assessment = await aiPrepApi.getAssessment(assessmentId);
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
      console.error("[AiPrepReport] Failed to load real report:", err);
      setError("We couldn't load this assessment report.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // The session page owns the submission SSE connection and navigates here only after COMPLETED.
  // This page intentionally performs no polling or secondary stream requests.

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
    const param = paramFromTab(tabLabel);
    const sectionParam = resolvedSubTab ? `&section=${resolvedSubTab}` : "";
    const fromParam = searchParams.get("from");
    const fromQuery = fromParam ? `&from=${encodeURIComponent(fromParam)}` : "";

    const targetUrl = `/aiprep/reports/${assessmentId}?tab=${param}${sectionParam}${fromQuery}`;
    router.push(targetUrl, { scroll: false });
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
        />

        <main>
          {isOverviewTab ? (
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