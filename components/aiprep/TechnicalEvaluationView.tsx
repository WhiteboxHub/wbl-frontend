"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  X,
  TrendingUp,
  Cpu,
  Code2,
  GitBranch,
  GraduationCap,
  Quote,
  Flame,
  Video,
  AudioWaveform,
  Mic,
  Clock,
  Activity,
  Gauge,
  Radio,
  AlertCircle,
  Eye,
  Monitor,
  ScanFace,
} from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import type {
  NormalizedReport,
  TechnicalEvaluation,
  TechnicalQuestionEval,
  TechnicalConceptEval,
  DeliveryFactor,
  DeliveryMetric,
  DeliveryAnalysis,
} from "@/types/aiprep-report";
import type { ReportTab } from "./report-tabs";

interface Props {
  report: NormalizedReport;
  activeTab: ReportTab;
  onSelectTab: (tab: ReportTab) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  seekTo?: (seconds: number) => void;
  assessmentId?: string;
}

// ─── Delivery Status Styling (Calm Palette decoupled from Technical Ratings) ───

function getDeliveryStatusBadge(status?: string | null) {
  if (!status) return null;
  const s = status.toUpperCase().trim();
  let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
  let dotClass = "bg-slate-400";
  let label = s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  if (["STRONG", "HIGH", "OPTIMAL"].includes(s)) {
    badgeClass = "bg-teal-50 text-teal-800 border-teal-200/80";
    dotClass = "bg-teal-500";
  } else if (["ADEQUATE", "AVERAGE", "MODERATE", "NORMAL"].includes(s)) {
    badgeClass = "bg-amber-50/80 text-amber-800 border-amber-200/70";
    dotClass = "bg-amber-500";
  } else if (["NEEDS_WORK", "POOR", "WEAK", "LOW", "TENSED"].includes(s)) {
    badgeClass = "bg-rose-50 text-rose-800 border-rose-200/80";
    dotClass = "bg-rose-500";
  } else if (["INSUFFICIENT_DATA", "INSUFFICIENT"].includes(s)) {
    badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
    dotClass = "bg-slate-400";
    label = "Insufficient Data";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${badgeClass}`}>
      <span className={`size-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

function getReliabilityBadge(reliability?: string | null, note?: string | null) {
  const r = reliability?.toUpperCase().trim();
  const hasNote = Boolean(note && note.trim());

  if (!r || r === "HIGH") {
    if (!hasNote) return null;
    return (
      <p className="text-[10px] text-slate-500 italic leading-tight pt-1.5 border-t border-slate-100">
        {note}
      </p>
    );
  }

  let badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
  if (["UNRELIABLE", "LOW"].includes(r)) {
    badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (r === "MEDIUM") {
    badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <div className="pt-2 border-t border-slate-100 space-y-1">
      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border ${badgeClass}`}>
        Reliability: {r.replace(/_/g, " ")}
      </span>
      {hasNote && (
        <p className="text-[10px] text-slate-500 italic leading-tight">
          {note}
        </p>
      )}
    </div>
  );
}

function getFactorMetricDisplay(factorKey: string, metric?: DeliveryMetric | null): string | null {
  if (!metric) return null;
  if (metric.formatted) return metric.formatted;
  if (metric.value !== undefined) {
    return `${metric.value} ${metric.unit || ""}`.trim();
  }
  return null;
}

function getTelemetryValueColor(
  type: "wpm" | "fillers" | "silence" | "duration" | "face" | "eye" | "screen" | "distraction",
  value?: number | null,
  factorStatus?: string | null
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "text-rose-600";
  }

  const s = factorStatus?.toUpperCase().trim();
  if (s) {
    if (["STRONG", "HIGH", "OPTIMAL"].includes(s)) return "text-emerald-600";
    if (["ADEQUATE", "AVERAGE", "MODERATE", "NORMAL"].includes(s)) return "text-amber-600";
    if (["NEEDS_WORK", "POOR", "WEAK", "LOW", "TENSED", "INSUFFICIENT_DATA", "INSUFFICIENT"].includes(s)) {
      return "text-rose-600";
    }
  }

  switch (type) {
    case "wpm":
      if (value >= 120 && value <= 160) return "text-emerald-600";
      if ((value >= 100 && value < 120) || (value > 160 && value <= 180)) return "text-amber-600";
      return "text-rose-600";

    case "fillers":
      if (value === 0 && (factorStatus === "INSUFFICIENT_DATA" || !factorStatus)) return "text-rose-600";
      if (value <= 2.0) return "text-emerald-600";
      if (value <= 5.0) return "text-amber-600";
      return "text-rose-600";

    case "silence":
      if (value >= 10 && value <= 25) return "text-emerald-600";
      if ((value >= 8 && value < 10) || (value > 25 && value <= 40)) return "text-amber-600";
      return "text-rose-600";

    case "duration":
      if (value >= 60) return "text-emerald-600";
      if (value >= 30) return "text-amber-600";
      return "text-rose-600";

    case "face":
    case "eye":
    case "screen":
      if (value >= 75) return "text-emerald-600";
      if (value >= 50) return "text-amber-600";
      return "text-rose-600";

    case "distraction":
      if (value <= 15) return "text-emerald-600";
      if (value <= 30) return "text-amber-600";
      return "text-rose-600";

    default:
      return "text-slate-900";
  }
}

function getFactorValueColor(status?: string | null): string {
  const s = status?.toUpperCase().trim();
  if (s) {
    if (["STRONG", "HIGH", "OPTIMAL"].includes(s)) return "text-emerald-600 font-bold";
    if (["ADEQUATE", "AVERAGE", "MODERATE", "NORMAL"].includes(s)) return "text-amber-600 font-bold";
    if (["NEEDS_WORK", "POOR", "WEAK", "LOW", "TENSED"].includes(s)) return "text-rose-600 font-bold";
  }
  return "text-slate-800 font-bold";
}

// ─── Rating config ────────────────────────────────────────────────────────────

const RATING_CONFIG: Record<
  string,
  { label: string; dotClass: string; bgClass: string; textClass: string; borderClass: string }
> = {
  EXCELLENT: {
    label: "Excellent",
    dotClass: "bg-emerald-500",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  GOOD: {
    label: "Good",
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
  },
  AVERAGE: {
    label: "Average",
    dotClass: "bg-amber-500",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  POOR: {
    label: "Needs Work",
    dotClass: "bg-rose-500",
    bgClass: "bg-rose-50",
    textClass: "text-rose-700",
    borderClass: "border-rose-200",
  },
  NOT_TESTED: {
    label: "Not Tested",
    dotClass: "bg-slate-300",
    bgClass: "bg-slate-50",
    textClass: "text-slate-500",
    borderClass: "border-slate-200",
  },
};

function getRatingMeta(rating?: string) {
  const key = (rating ?? "").toUpperCase();
  return RATING_CONFIG[key] ?? RATING_CONFIG.GOOD;
}

function cleanPointText(text?: string): string {
  if (!text) return "";
  return text
    .replace(/\s*\(required\)/gi, "")
    .replace(/\s*\(optional\)/gi, "")
    .replace(/\\Delta/g, "Δ")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDifficulty(diff?: string): string {
  if (!diff) return "—";
  const lower = diff.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// ─── Fallback for when the report has no technical_evaluation yet ─────────────

const EMPTY_TECHNICAL_EVALUATION: TechnicalEvaluation = {
  overall_assessment: {
    rating: "GOOD",
    executive_summary: "Technical evaluation is not yet available for this assessment.",
    top_strengths: [],
    priority_improvements: [],
    data_note: null,
  },
  subject_evaluations: [],
  difficulty_analysis: {
    easy: "—",
    medium: "—",
    hard: "—",
    observation: "Difficulty analysis unavailable.",
  },
  concept_evaluations: [],
  question_evaluations: [],
};

export default function TechnicalEvaluationView({
  report,
  activeTab,
  onSelectTab,
  videoRef,
  seekTo,
  assessmentId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeVideoRef = videoRef || internalVideoRef;

  const resolvedAssessmentId = assessmentId || String(report.assessment?.id || "");

  const authToken =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") || localStorage.getItem("token") || ""
      : "";

  const rawMediaType = (report.assessment?.media_type || "").toUpperCase();
  const isAudioOnly = rawMediaType === "AUDIO" || rawMediaType === "AUDIO_ONLY";
  const mediaPath = isAudioOnly ? "audio" : "video";

  const canShowRecording = Boolean(
    report.consent?.save_recording ??
    (report.assessment as any)?.consent?.save_recording ??
    true
  );

  const localPreviewUrl =
    typeof window !== "undefined" && resolvedAssessmentId
      ? (window as any).__aiprep_local_preview?.[resolvedAssessmentId] ||
        (() => {
          try {
            const stored = sessionStorage.getItem(`aiprep_local_preview_${resolvedAssessmentId}`);
            if (stored && stored.startsWith("blob:") && !(window as any).__aiprep_local_preview?.[resolvedAssessmentId]) {
              sessionStorage.removeItem(`aiprep_local_preview_${resolvedAssessmentId}`);
              return undefined;
            }
            return stored || undefined;
          } catch (_) {
            return undefined;
          }
        })()
      : undefined;

  const serverUrl = resolvedAssessmentId
    ? `${(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api$/, "")}/api/aiprep/assessments/${resolvedAssessmentId}/${mediaPath}${authToken ? `?token=${encodeURIComponent(authToken)}` : ""}`
    : undefined;

  const effectivePlaybackUrl = canShowRecording
    ? (report.youtube_url || localPreviewUrl || serverUrl)
    : undefined;

  const durationSeconds =
    report.audio_telemetry?.speaking_duration_sec ||
    report.audio?.recording_environment?.speaking_duration_seconds ||
    0;

  const [isMediaOpen, setIsMediaOpen] = useState(true);
  const delivery = report.delivery_analysis;

  const telemetryPace =
    report.audio_telemetry?.words_per_minute ??
    report.audio?.factors?.pace?.wpm_recorded;

  const telemetryFillers =
    report.audio_telemetry?.filler_word_count ??
    (report.audio?.factors?.filler_word_usage?.status === "INSUFFICIENT_DATA" ? undefined : 0);

  const telemetrySilence =
    report.audio_telemetry?.silence_percentage ??
    (report.audio?.factors?.pausing?.status === "INSUFFICIENT_DATA" ? undefined : 0);

  const techEval: TechnicalEvaluation =
    report.technical_evaluation ?? EMPTY_TECHNICAL_EVALUATION;

  const selectedConceptSlug = searchParams.get("concept");
  const selectedQuestionIdStr = searchParams.get("q");

  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(() => {
    return selectedQuestionIdStr ? Number(selectedQuestionIdStr) : null;
  });
  const [questionTabs, setQuestionTabs] = useState<Record<number, "answer" | "improve">>({});
  const [filterMode, setFilterMode] = useState<"all" | "needs_work">("all");

  // ── Active concept (driven by URL) ──────────────────────────────────────────
  const activeConcept: TechnicalConceptEval = useMemo(() => {
    const concepts = techEval.concept_evaluations;
    if (selectedConceptSlug) {
      const match = concepts.find(
        (c) =>
          c.concept.toLowerCase().replace(/[^a-z0-9]/g, "-") ===
          selectedConceptSlug.toLowerCase()
      );
      if (match) return match;
    }
    return concepts[0] ?? ({} as TechnicalConceptEval);
  }, [techEval.concept_evaluations, selectedConceptSlug]);

  // ── Sync expanded question from URL ─────────────────────────────────────────
  useEffect(() => {
    if (selectedQuestionIdStr) {
      const qId = Number(selectedQuestionIdStr);
      setExpandedQuestionId(qId);
    }
  }, [selectedQuestionIdStr]);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const selectConcept = (concept: TechnicalConceptEval) => {
    const slug = concept.concept.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "details");
    params.set("concept", slug);
    params.delete("q");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const toggleExpandQuestion = (questionId: number) => {
    const isCurrentlyExpanded = expandedQuestionId === questionId;
    const next = isCurrentlyExpanded ? null : questionId;
    setExpandedQuestionId(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("q", String(next));
    } else {
      params.delete("q");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const openQuestionFromHeatmap = (question: TechnicalQuestionEval) => {
    onSelectTab("Details");
    const parentConcept = techEval.concept_evaluations.find(
      (c) => c.concept.toLowerCase() === question.concept.toLowerCase()
    );
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "details");
    if (parentConcept) {
      const slug = parentConcept.concept.toLowerCase().replace(/[^a-z0-9]/g, "-");
      params.set("concept", slug);
    }
    params.set("q", String(question.question_id));
    router.push(`?${params.toString()}`, { scroll: false });
    setExpandedQuestionId(question.question_id);
    setTimeout(() => {
      document
        .getElementById(`question-${question.question_id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  //  OVERVIEW TAB
  // ══════════════════════════════════════════════════════════════════════════════

  if (activeTab === "Overview") {
    const overall = techEval.overall_assessment;
    const meta = getRatingMeta(overall.rating);

    const testedSubjects = techEval.subject_evaluations
      .filter((s) => s.rating !== "NOT_TESTED")
      .map((s) => s.subject);
    const dynamicSubtitle =
      testedSubjects.length > 0
        ? `Comprehensive evaluation across ${testedSubjects.join(", ")}`
        : "Comprehensive evaluation across tested technical domains";

    return (
      <div className="space-y-3">
        {/* ── Executive strip ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100/80">
                <Sparkles size={15} />
              </span>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">
                  Technical Performance Evaluation
                </h1>
                <p className="text-[11px] text-slate-500">
                  {dynamicSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
              >
                <span className={`size-1.5 rounded-full ${meta.dotClass}`} />
                {meta.label}
              </span>
              <button
                type="button"
                onClick={() => onSelectTab("Details")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer ml-1"
              >
                Full Details <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <p className="mt-2.5 text-xs text-slate-700 leading-relaxed">
            {overall.executive_summary}
          </p>
        </div>

        {/* ── Subject discipline cards ─────────────────────────────────────── */}
        {techEval.subject_evaluations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {techEval.subject_evaluations.map((subj) => {
              const smeta = getRatingMeta(subj.rating);
              const subjConcepts = techEval.concept_evaluations.filter(
                (c) => c.subject.toLowerCase() === subj.subject.toLowerCase()
              );

              const SubjIcon = subj.subject.includes("AI")
                ? Cpu
                : subj.subject.includes("Software")
                ? Code2
                : GitBranch;

              return (
                <div
                  key={subj.subject}
                  className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <SubjIcon size={14} className="text-slate-600" />
                        <h2 className="text-xs font-bold text-slate-900 truncate">
                          {subj.subject}
                        </h2>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${smeta.bgClass} ${smeta.textClass} ${smeta.borderClass}`}
                      >
                        <span className={`size-1.5 rounded-full ${smeta.dotClass}`} />
                        {smeta.label}
                      </span>
                    </div>

                    {/* Concept mini-dots */}
                    {subjConcepts.length > 0 && (
                      <div className="flex items-center gap-1.5 my-2 py-1 px-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          Concepts:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {subjConcepts.map((c) => {
                            const cmeta = getRatingMeta(c.rating);
                            return (
                              <button
                                key={c.concept}
                                type="button"
                                title={`${c.concept}: ${cmeta.label}`}
                                onClick={() => {
                                  onSelectTab("Details");
                                  selectConcept(c);
                                }}
                                className={`size-2.5 rounded-full ${cmeta.dotClass} hover:scale-125 transition-transform cursor-pointer`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                      {subj.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab("Details");
                        if (subjConcepts[0]) selectConcept(subjConcepts[0]);
                      }}
                      className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
                    >
                      View <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Question heatmap ─────────────────────────────────────────────── */}
        {techEval.question_evaluations.length > 0 && (
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Flame size={14} className="text-orange-500" />
                <h2 className="text-xs font-bold text-slate-900">
                  Question Performance Heatmap
                </h2>
                <span className="text-[11px] text-slate-400">
                  (Click any question to inspect)
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2.5 text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded bg-emerald-500" /> Excellent
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded bg-blue-500" /> Good
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded bg-amber-500" /> Average
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded bg-rose-500" /> Needs Work
                </span>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {techEval.question_evaluations.map((q, idx) => {
                const qmeta = getRatingMeta(q.rating);
                return (
                  <button
                    key={q.question_id}
                    type="button"
                    onClick={() => openQuestionFromHeatmap(q)}
                    title={`Q${idx + 1} (${q.rating}): ${q.question_text}`}
                    className={`group relative flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer hover:shadow-xs hover:-translate-y-0.5 ${qmeta.bgClass} ${qmeta.borderClass}`}
                  >
                    <span className={`text-[11px] font-extrabold ${qmeta.textClass}`}>
                      Q{idx + 1}
                    </span>
                    <span className="text-[9px] font-medium text-slate-600 truncate max-w-full">
                      {formatDifficulty(q.difficulty_level)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Strengths / Fix First ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-100">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-900">Top Strengths</h2>
            </div>
            <ul className="space-y-1.5">
              {overall.top_strengths.slice(0, 3).map((st, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <span>{st}</span>
                </li>
              ))}
              {overall.top_strengths.length === 0 && (
                <li className="text-[11px] text-slate-400 italic">No strengths recorded.</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-100">
              <AlertTriangle size={14} className="text-rose-600" />
              <h2 className="text-xs font-bold text-slate-900">Fix These First</h2>
            </div>
            <ul className="space-y-1.5">
              {overall.priority_improvements.slice(0, 3).map((imp, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug"
                >
                  <span className="size-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <span>{imp}</span>
                </li>
              ))}
              {overall.priority_improvements.length === 0 && (
                <li className="text-[11px] text-slate-400 italic">No improvements listed.</li>
              )}
            </ul>
          </div>
        </div>

        {/* ── Difficulty curve ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900">Difficulty Curve Analysis</h2>
            </div>
            <span className="text-[11px] text-slate-500 italic">
              {techEval.difficulty_analysis.observation}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">
                Easy Tier
              </span>
              <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                {techEval.difficulty_analysis.easy}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-extrabold uppercase text-blue-700 tracking-wider">
                Medium Tier
              </span>
              <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                {techEval.difficulty_analysis.medium}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider">
                Hard Tier
              </span>
              <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                {techEval.difficulty_analysis.hard}
              </p>
            </div>
          </div>
        </div>

        {/* ── Session Recording & Communication Delivery (Section 3) ── */}
        {canShowRecording && (
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {delivery?.type === "video" || (!isAudioOnly && !delivery) ? (
                  <Video size={15} className="text-blue-600" />
                ) : (
                  <AudioWaveform size={15} className="text-blue-600" />
                )}
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  {delivery?.type === "video" || (!isAudioOnly && !delivery)
                    ? "Video Recording & Presence"
                    : "Audio Recording & Speech Delivery"}
                </h2>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {delivery?.type === "video" || (!isAudioOnly && !delivery) ? "Video Session" : "Audio Session"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMediaOpen(!isMediaOpen)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
              >
                {isMediaOpen ? "Hide" : "Show Playback & Delivery"}
                {isMediaOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {isMediaOpen && (
              <div className={delivery ? "grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start" : "w-full"}>
                {/* ── Media Player ── */}
                <div className={delivery ? "lg:col-span-7 rounded-2xl overflow-hidden shadow-xs" : "w-full rounded-2xl overflow-hidden shadow-xs"}>
                  <VideoPlayer
                    youtubeUrl={effectivePlaybackUrl}
                    fallbackUrl={serverUrl}
                    videoRef={activeVideoRef}
                    isAudioOnly={isAudioOnly}
                    candidateName={report.candidate_name ?? undefined}
                    durationSeconds={durationSeconds}
                  />
                </div>

                {/* ── Measured Tiles & Delivery Summary (Only if delivery analysis exists) ── */}
                {delivery && (
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                        <Activity size={12} className="text-blue-600" />
                        {delivery.type === "video" ? "Presence Telemetry" : "Speech & Delivery Telemetry"}
                      </span>
                      <span className="text-[9px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                        Measured Signal
                      </span>
                    </div>

                    {delivery.type === "video" ? (
                      <div className="grid grid-cols-2 gap-2">
                        {/* Video Tile 1: Face Visibility */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Face Visibility</span>
                            <div className="w-5 h-5 rounded bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                              <ScanFace size={12} className="text-blue-600" />
                            </div>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={`text-base font-bold ${getTelemetryValueColor("face", delivery.rawMetrics?.face_visibility_pct)}`}>
                              {delivery.rawMetrics?.face_visibility_pct !== undefined
                                ? `${delivery.rawMetrics.face_visibility_pct}%`
                                : "—"}
                            </span>
                          </div>
                          <span className="mt-0.5 inline-block text-[9px] font-semibold text-slate-600">
                            Camera framing
                          </span>
                        </div>

                        {/* Video Tile 2: Eye Contact */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Eye Contact</span>
                            <div className="w-5 h-5 rounded bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                              <Eye size={12} className="text-teal-600" />
                            </div>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={`text-base font-bold ${getTelemetryValueColor("eye", delivery.rawMetrics?.eye_contact_pct, delivery.factors?.find((f) => f.key === "camera_angle_gaze_alignment")?.status)}`}>
                              {delivery.rawMetrics?.eye_contact_pct !== undefined
                                ? `${delivery.rawMetrics.eye_contact_pct}%`
                                : "—"}
                            </span>
                          </div>
                          <span className="mt-0.5 inline-block text-[9px] font-semibold text-slate-600">
                            Gaze alignment
                          </span>
                        </div>

                        {/* Video Tile 3: Screen Attention */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Screen Attention</span>
                            <div className="w-5 h-5 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              <Monitor size={12} className="text-indigo-600" />
                            </div>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={`text-base font-bold ${getTelemetryValueColor("screen", delivery.rawMetrics?.screen_attention_pct, delivery.factors?.find((f) => f.key === "primary_display_orientation")?.status)}`}>
                              {delivery.rawMetrics?.screen_attention_pct !== undefined
                                ? `${delivery.rawMetrics.screen_attention_pct}%`
                                : "—"}
                            </span>
                          </div>
                          <span className="mt-0.5 inline-block text-[9px] font-semibold text-slate-600">
                            Display focus
                          </span>
                        </div>

                        {/* Video Tile 4: Off-Screen Gaze */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Off-Screen Gaze</span>
                            <div className="w-5 h-5 rounded bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                              <Activity size={12} className="text-amber-600" />
                            </div>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={`text-base font-bold ${getTelemetryValueColor("distraction", delivery.rawMetrics?.distraction_level_pct, delivery.factors?.find((f) => f.key === "off_screen_gaze_duration")?.status)}`}>
                              {delivery.rawMetrics?.distraction_level_pct !== undefined
                                ? `${delivery.rawMetrics.distraction_level_pct}%`
                                : "—"}
                            </span>
                          </div>
                          <span className="mt-0.5 inline-block text-[9px] font-semibold text-slate-600">
                            Distraction level
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {/* Audio Tile 1: Speaking Pace */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Speaking Pace</span>
                            <div className="w-5 h-5 rounded bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                              <Gauge size={12} className="text-blue-600" />
                            </div>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={`text-base font-bold ${getTelemetryValueColor("wpm", delivery.rawMetrics?.wpm_recorded, delivery.factors?.find((f) => f.key === "pace")?.status)}`}>
                              {delivery.rawMetrics?.wpm_recorded !== undefined
                                ? `${delivery.rawMetrics.wpm_recorded}`
                                : "—"}
                            </span>
                            {delivery.rawMetrics?.wpm_recorded !== undefined && (
                              <span className="text-[10px] text-slate-500 font-medium">WPM</span>
                            )}
                          </div>
                          <span className="mt-0.5 inline-block text-[9px] font-semibold text-slate-600">
                            Words per minute
                          </span>
                        </div>

                        {/* Audio Tile 2: Filler Words */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Filler Words</span>
                            <div className="w-5 h-5 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              <Mic size={12} className="text-indigo-600" />
                            </div>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={`text-base font-bold ${getTelemetryValueColor("fillers", delivery.rawMetrics?.filler_rate_per_min, delivery.factors?.find((f) => f.key === "filler_word_usage")?.status)}`}>
                              {delivery.rawMetrics?.filler_rate_per_min !== undefined
                                ? `${delivery.rawMetrics.filler_rate_per_min}`
                                : "—"}
                            </span>
                            {delivery.rawMetrics?.filler_rate_per_min !== undefined && (
                              <span className="text-[10px] text-slate-500 font-medium">/min</span>
                            )}
                          </div>
                          <span className="mt-0.5 inline-block text-[9px] font-semibold text-slate-600">
                            Rate per minute
                          </span>
                        </div>

                        {/* Audio Tile 3: Silence & Pausing */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Silence & Pausing</span>
                            <div className="w-5 h-5 rounded bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                              <Clock size={12} className="text-amber-600" />
                            </div>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={`text-base font-bold ${getTelemetryValueColor("silence", delivery.rawMetrics?.silence_ratio_pct, delivery.factors?.find((f) => f.key === "pausing")?.status)}`}>
                              {delivery.rawMetrics?.silence_ratio_pct !== undefined
                                ? `${delivery.rawMetrics.silence_ratio_pct}%`
                                : "—"}
                            </span>
                          </div>
                          <span className="mt-0.5 inline-block text-[9px] font-semibold text-slate-600">
                            Silence ratio
                          </span>
                        </div>

                        {/* Audio Tile 4: Spoken Duration */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Spoken Duration</span>
                            <div className="w-5 h-5 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                              <Radio size={12} className="text-emerald-600" />
                            </div>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={`text-base font-bold ${getTelemetryValueColor(
                              "duration",
                              delivery.rawMetrics?.speaking_duration_seconds !== undefined && delivery.rawMetrics.speaking_duration_seconds > 0
                                ? delivery.rawMetrics.speaking_duration_seconds
                                : durationSeconds > 0
                                ? durationSeconds
                                : null
                            )}`}>
                              {delivery.rawMetrics?.speaking_duration_seconds !== undefined && delivery.rawMetrics.speaking_duration_seconds > 0
                                ? `${Math.floor(delivery.rawMetrics.speaking_duration_seconds / 60)}m ${Math.round(delivery.rawMetrics.speaking_duration_seconds % 60)}s`
                                : durationSeconds > 0
                                ? `${Math.floor(durationSeconds / 60)}m ${Math.round(durationSeconds % 60)}s`
                                : "—"}
                            </span>
                          </div>
                          <span className="mt-0.5 inline-block text-[9px] font-semibold text-slate-600">
                            Recorded speech
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Footer: one line of summaryText, link to full analysis, and note */}
                    <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                      {delivery.summaryText && (
                        <p className="text-xs text-slate-600 line-clamp-1 leading-normal">
                          {delivery.summaryText}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectTab(delivery.type === "video" ? "Video Analysis" : "Audio Analysis")}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                          View full {delivery.type === "video" ? "video" : "audio"} analysis &rarr;
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 italic leading-snug">
                        Communication & delivery signals are computed from audio/video telemetry and do not influence your technical scores.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  DELIVERY ANALYSIS TAB (Audio Analysis or Video Analysis)
  // ══════════════════════════════════════════════════════════════════════════════
  if (activeTab === "Audio Analysis" || activeTab === "Video Analysis") {
    if (!delivery) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          <p className="text-sm">No delivery analysis available for this assessment.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* a) Summary Card */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              {delivery.type === "video" ? (
                <Video size={18} className="text-blue-600" />
              ) : (
                <AudioWaveform size={18} className="text-blue-600" />
              )}
              <h2 className="text-base font-bold text-slate-900">
                {delivery.type === "video" ? "Video & Presence Analysis" : "Audio & Delivery Analysis"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Readiness pill (audio only, hide for video) */}
              {delivery.type === "audio" && delivery.readiness && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                    delivery.readiness.toUpperCase() === "INSUFFICIENT_DATA"
                      ? "bg-slate-100 text-slate-700 border-slate-300"
                      : "bg-teal-50 text-teal-800 border-teal-200"
                  }`}
                >
                  {delivery.readiness.toUpperCase() === "INSUFFICIENT_DATA"
                    ? "Status: Insufficient Data"
                    : `Readiness: ${delivery.readiness.replace(/_/g, " ")}`}
                </span>
              )}

              {/* Confidence: Small "High confidence" chip if HIGH */}
              {delivery.confidence &&
                delivery.confidence.level.toUpperCase() === "HIGH" &&
                delivery.readiness?.toUpperCase() !== "INSUFFICIENT_DATA" && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <CheckCircle2 size={11} className="text-teal-600" /> High confidence
                  </span>
                )}
            </div>
          </div>

          {/* b) Confidence Notice / Insufficient Data Banner */}
          {delivery.confidence &&
            (delivery.confidence.level.toUpperCase() === "INSUFFICIENT_DATA" ||
              delivery.readiness?.toUpperCase() === "INSUFFICIENT_DATA" ? (
              <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-xs text-slate-800 flex items-start gap-2">
                <AlertCircle size={15} className="text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">
                    Telemetry Notice: Insufficient Data to Evaluate
                  </p>
                  <p className="mt-0.5 text-slate-600 leading-relaxed">
                    {delivery.confidence.rationale ||
                      "Audio signal or spoken duration was insufficient to compute reliable delivery telemetry."}
                  </p>
                </div>
              </div>
            ) : delivery.confidence.level.toUpperCase() !== "HIGH" ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    Confidence Level: {delivery.confidence.level.replace(/_/g, " ")}
                  </p>
                  {delivery.confidence.rationale && (
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      {delivery.confidence.rationale}
                    </p>
                  )}
                </div>
              </div>
            ) : null)}

          {/* summaryText */}
          {delivery.summaryText && (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {delivery.summaryText}
            </p>
          )}

          {/* Strength (green) and Gap (amber) callouts */}
          {(delivery.strength || delivery.gap) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {delivery.strength && (
                <div className="rounded-lg border border-teal-200/80 bg-teal-50/40 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-teal-900 mb-1">
                    <CheckCircle2 size={13} className="text-teal-600" />
                    <span>Primary Strength</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{delivery.strength}</p>
                </div>
              )}
              {delivery.gap && (
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                    <AlertCircle size={13} className="text-amber-600" />
                    <span>Primary Focus Area</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{delivery.gap}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* c) Factor Grid */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Activity size={14} className="text-blue-600" />
              Delivery Factors & Telemetry Signals
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">
              {delivery.factors.length} assessed dimensions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {delivery.factors.map((factor) => {
              const metricDisplay = getFactorMetricDisplay(factor.key, factor.metric);
              return (
                <div
                  key={factor.key}
                  className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {factor.label}
                      </span>
                      {getDeliveryStatusBadge(factor.status)}
                    </div>

                    {metricDisplay && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-200/80 text-[11px] font-bold text-slate-800">
                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Measured:</span>
                        <span className={getFactorValueColor(factor.status)}>{metricDisplay}</span>
                      </div>
                    )}

                    {factor.observation && (
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        {factor.observation}
                      </p>
                    )}
                  </div>

                  {getReliabilityBadge(factor.reliability, factor.reliabilityNote)}
                </div>
              );
            })}
          </div>
        </div>

        {/* d) Key Findings */}
        {delivery.keyFindings && delivery.keyFindings.length > 0 && (
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              Key Findings & Actionable Takeaways
            </h3>
            <div className="divide-y divide-slate-100">
              {delivery.keyFindings.map((item, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {item.factor.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 pt-0.5">
                    {item.finding}
                  </p>
                  {item.why_it_matters && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      <span className="font-semibold text-slate-700">Why it matters: </span>
                      {item.why_it_matters}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* e) Environment Strip */}
        {(delivery.environmentNote || delivery.backgroundNoise || delivery.clippingDetected) && (
          <div className="rounded-lg border border-slate-200/70 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Recording Environment:
              </span>
              {delivery.environmentNote && (
                <span className="text-slate-700">{delivery.environmentNote}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {delivery.type === "audio" && delivery.backgroundNoise && (
                <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  Noise: {delivery.backgroundNoise}
                </span>
              )}
              {delivery.type === "audio" && delivery.clippingDetected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  <AlertCircle size={11} className="text-rose-600" />
                  Clipping detected
                </span>
              )}
            </div>
          </div>
        )}

        {/* Telemetry Disclaimer */}
        <p className="text-[11px] text-slate-400 text-center italic">
          * Communication & delivery signals are computed directly from audio/video telemetry and do not influence your technical depth scores.
        </p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  DETAILS TAB — Master-Detail layout
  // ══════════════════════════════════════════════════════════════════════════════

  const conceptQuestions = techEval.question_evaluations.filter(
    (q) =>
      q.concept?.toLowerCase() === activeConcept.concept?.toLowerCase() ||
      activeConcept.question_ids?.includes(q.question_id)
  );

  const displayedQuestions =
    filterMode === "needs_work"
      ? conceptQuestions.filter((q) => q.rating === "AVERAGE" || q.rating === "POOR")
      : conceptQuestions;

  const activeConceptMeta = getRatingMeta(activeConcept.rating);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* ── LEFT: Discipline Navigator ─────────────────────────────────── */}
        <div className="md:col-span-4 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Discipline Navigator
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold">
              {techEval.concept_evaluations.length} Topics
            </span>
          </div>

          <div className="space-y-3">
            {techEval.subject_evaluations.map((subj) => {
              const subjConcepts = techEval.concept_evaluations.filter(
                (c) => c.subject.toLowerCase() === subj.subject.toLowerCase()
              );

              return (
                <div key={subj.subject} className="space-y-1">
                  <div className="flex items-center justify-between px-1.5 py-0.5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      {subj.subject}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {subjConcepts.length} concepts
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {subjConcepts.map((c) => {
                      const isSelected = c.concept === activeConcept.concept;
                      const cmeta = getRatingMeta(c.rating);

                      return (
                        <button
                          key={c.concept}
                          type="button"
                          onClick={() => selectConcept(c)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-50 text-blue-900 border border-blue-200/80 shadow-2xs font-semibold"
                              : "text-slate-700 hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className={`size-2 rounded-full shrink-0 ${cmeta.dotClass}`} />
                            <span className="truncate">{c.concept}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {c.questions_count}Q
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {techEval.subject_evaluations.length === 0 && (
              <p className="text-[11px] text-slate-400 italic px-1">
                No concept breakdown available.
              </p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Concept workspace ─────────────────────────────────────── */}
        <div className="md:col-span-8 space-y-3">
          {/* Discipline Context Banner */}
          {(() => {
            const activeSubject = techEval.subject_evaluations.find(
              (s) => s.subject.toLowerCase() === activeConcept.subject?.toLowerCase()
            );
            if (!activeSubject) return null;
            const subMeta = getRatingMeta(activeSubject.rating);
            return (
              <div className="rounded-xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 p-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      Discipline Evaluation:
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {activeSubject.subject}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${subMeta.bgClass} ${subMeta.textClass} ${subMeta.borderClass}`}
                  >
                    <span className={`size-1.5 rounded-full ${subMeta.dotClass}`} />
                    {subMeta.label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {activeSubject.summary}
                </p>
              </div>
            );
          })()}

          {/* Concept header */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-slate-900">
                    {activeConcept.concept ?? "Select a concept"}
                  </h1>
                  {activeConcept.rating && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${activeConceptMeta.bgClass} ${activeConceptMeta.textClass} ${activeConceptMeta.borderClass}`}
                    >
                      <span className={`size-1.5 rounded-full ${activeConceptMeta.dotClass}`} />
                      {activeConceptMeta.label}
                    </span>
                  )}
                </div>
                {activeConcept.subject && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Part of{" "}
                    <span className="font-semibold text-slate-700">{activeConcept.subject}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1 mb-1">
                  <CheckCircle2 size={12} /> Demonstrated Strengths
                </span>
                <ul className="space-y-1">
                  {activeConcept.strengths && activeConcept.strengths.length > 0 ? (
                    activeConcept.strengths.map((st, i) => (
                      <li key={i} className="text-[11px] text-slate-700 leading-snug">
                        • {cleanPointText(st)}
                      </li>
                    ))
                  ) : (
                    <li className="text-[11px] text-slate-400 italic">
                      No specific strengths recorded.
                    </li>
                  )}
                </ul>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100">
                <span className="text-[10px] font-extrabold uppercase text-rose-800 tracking-wider flex items-center gap-1 mb-1">
                  <AlertTriangle size={12} /> Areas to Strengthen
                </span>
                <ul className="space-y-1">
                  {(() => {
                    const focusItems =
                      activeConcept.what_to_work_on && activeConcept.what_to_work_on.length > 0
                        ? activeConcept.what_to_work_on
                        : activeConcept.gaps && activeConcept.gaps.length > 0
                        ? activeConcept.gaps
                        : [];
                    if (focusItems.length === 0) {
                      return (
                        <li className="text-[11px] text-slate-400 italic">
                          No major gaps identified!
                        </li>
                      );
                    }
                    return focusItems.map((item, i) => (
                      <li key={i} className="text-[11px] text-slate-700 leading-snug">
                        • {cleanPointText(item)}
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </div>

          {/* Question list */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-blue-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  Tested Questions ({displayedQuestions.length})
                </h2>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                    filterMode === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("needs_work")}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                    filterMode === "needs_work"
                      ? "bg-white text-rose-700 shadow-2xs"
                      : "text-slate-500"
                  }`}
                >
                  Needs Work
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {displayedQuestions.map((q) => {
                const qmeta = getRatingMeta(q.rating);
                const isExpanded = expandedQuestionId === q.question_id;
                const activeQTab = questionTabs[q.question_id] ?? "answer";
                const totalPoints =
                  (q.covered_points?.length ?? 0) + (q.missed_points?.length ?? 0);
                const coveredCount = q.covered_points?.length ?? 0;
                const coveragePercent =
                  totalPoints > 0 ? Math.round((coveredCount / totalPoints) * 100) : 100;
                const qIndex = techEval.question_evaluations.findIndex(
                  (x) => x.question_id === q.question_id
                );
                const qNumberLabel = qIndex !== -1 ? `Q${qIndex + 1}` : `Q#${q.question_id}`;

                return (
                  <div
                    key={q.question_id}
                    id={`question-${q.question_id}`}
                    className={`rounded-xl border transition-all ${
                      isExpanded
                        ? "border-blue-400 bg-white shadow-xs ring-1 ring-blue-100"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    {/* ── Question Header Row (Clickable) ─────────────────── */}
                    <div
                      onClick={() => toggleExpandQuestion(q.question_id)}
                      className="p-3.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`size-2 rounded-full ${qmeta.dotClass}`} />
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            {qNumberLabel}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {formatDifficulty(q.difficulty_level)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${qmeta.bgClass} ${qmeta.textClass} ${qmeta.borderClass}`}
                          >
                            {qmeta.label}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {q.question_text}
                        </h3>

                        {!isExpanded && q.missed_points && q.missed_points.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">Missed:</span>
                            {q.missed_points.slice(0, 2).map((mp) => (
                              <span
                                key={mp.id}
                                className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 truncate max-w-[280px]"
                                title={cleanPointText(mp.description)}
                              >
                                {cleanPointText(mp.short_label || mp.description)}
                              </span>
                            ))}
                            {q.missed_points.length > 2 && (
                              <span className="text-[10px] text-slate-400">
                                +{q.missed_points.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:text-blue-700 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              Collapse <ChevronUp size={13} />
                            </>
                          ) : (
                            <>
                              Inspect Review <ChevronDown size={13} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ── Dropdown / Collapsible Body ────────────────────── */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4 rounded-b-xl space-y-3.5 animate-in fade-in-50 duration-150">
                        {/* Tab navigation inside dropdown */}
                        <div className="flex border-b border-slate-200 gap-2 pb-px">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuestionTabs((prev) => ({ ...prev, [q.question_id]: "answer" }));
                            }}
                            className={`py-1.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                              activeQTab === "answer"
                                ? "border-blue-600 text-blue-600 bg-white rounded-t border-t border-x border-slate-200 -mb-px"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Your Spoken Answer
                          </button>
                          {q.study_guidance && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuestionTabs((prev) => ({ ...prev, [q.question_id]: "improve" }));
                              }}
                              className={`py-1.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                                activeQTab === "improve"
                                  ? "border-blue-600 text-blue-600 bg-white rounded-t border-t border-x border-slate-200 -mb-px"
                                  : "border-transparent text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <GraduationCap size={13} />
                              How to Improve &amp; Model Answer
                            </button>
                          )}
                        </div>

                        {activeQTab === "answer" ? (
                          <div className="space-y-3 pt-1">
                            {/* Feedback on your answer */}
                            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 space-y-1">
                              <span className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider">
                                Feedback on your answer
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {q.observation}
                              </p>
                            </div>

                            {/* Covered Points */}
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                Key Points Covered ({q.covered_points?.length ?? 0})
                              </span>
                              {q.covered_points && q.covered_points.length > 0 ? (
                                <div className="space-y-1">
                                  {q.covered_points.map((p) => (
                                    <div
                                      key={p.id}
                                      className="p-2 rounded bg-emerald-50/50 border border-emerald-100 text-xs text-slate-800 flex items-start gap-1.5"
                                    >
                                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                      <span>{cleanPointText(p.description)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No key points covered.</p>
                              )}
                            </div>

                            {/* Missed Points */}
                            {q.missed_points && q.missed_points.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <AlertTriangle size={13} className="text-rose-600" />
                                  Gaps &amp; Missed Points ({q.missed_points.length})
                                </span>
                                <div className="space-y-1">
                                  {q.missed_points.map((p) => (
                                    <div
                                      key={p.id}
                                      className="p-2 rounded bg-rose-50/50 border border-rose-100 text-xs text-slate-800 flex items-start justify-between gap-2"
                                    >
                                      <div className="flex items-start gap-1.5">
                                        <span className="text-rose-600 font-bold shrink-0">✗</span>
                                        <span>{cleanPointText(p.description)}</span>
                                      </div>
                                      {p.status && (
                                        <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1 py-0.5 rounded shrink-0">
                                          {p.status}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Terminology chips */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                                  Accurate Terminology Used
                                </span>
                                {q.terms_used_well && q.terms_used_well.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {q.terms_used_well.map((t, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">None recorded</span>
                                )}
                              </div>

                              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
                                  Key Terms to Add
                                </span>
                                {q.terms_to_add && q.terms_to_add.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {q.terms_to_add.map((t, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">None required</span>
                                )}
                              </div>
                            </div>

                            {/* Unexplained terms section (Mentioned but not explained) */}
                            {q.terms_mentioned_unexplained && q.terms_mentioned_unexplained.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/80 space-y-2 mt-2">
                                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle size={12} className="text-amber-600" /> Mentioned But Not Explained
                                </span>
                                <ul className="space-y-2">
                                  {q.terms_mentioned_unexplained.map((t, i) => (
                                    <li
                                      key={i}
                                      className="p-2.5 rounded-md bg-white border border-amber-200/60 shadow-2xs space-y-1"
                                    >
                                      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                                        {t.term}
                                      </span>
                                      {t.quote && (
                                        <p className="text-[11px] italic text-slate-500">
                                          &ldquo;{t.quote}&rdquo;
                                        </p>
                                      )}
                                      <p className="text-xs text-slate-800 leading-snug font-medium">
                                        {t.feedback}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Full Spoken Transcript */}
                            {(q.transcript || (q.evidence && q.evidence.length > 0)) && (
                              <div className="space-y-1.5 pt-2.5 border-t border-slate-200/60">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Quote size={12} /> Full Spoken Transcript
                                </span>
                                <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                                  <p className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-sans">
                                    {q.transcript || q.evidence.join(" ")}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* How to Improve & Model Answer tab */
                          <div className="space-y-3 pt-1">
                            {q.study_guidance ? (
                              <>
                                <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 space-y-2">
                                  <span className="text-[11px] font-extrabold uppercase text-indigo-900 tracking-wider flex items-center gap-1">
                                    <BookOpen size={13} /> Recommended Study Topics
                                  </span>
                                  <ul className="space-y-1.5">
                                    {q.study_guidance.what_to_study.map((item, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-indigo-950 flex items-start gap-1.5"
                                      >
                                        <span className="size-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
                                  <span className="text-[11px] font-extrabold uppercase text-slate-900 tracking-wider flex items-center gap-1">
                                    <GraduationCap size={14} className="text-blue-600" />
                                    Recommended Answer Framing
                                  </span>
                                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                                    {q.study_guidance.how_to_answer}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-slate-500 italic">
                                No study guidance needed — all points were covered accurately.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {displayedQuestions.length === 0 && (
                <p className="text-[11px] text-slate-400 italic text-center py-4">
                  {filterMode === "needs_work"
                    ? "No questions need work in this concept — great performance!"
                    : "No questions found for this concept."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
