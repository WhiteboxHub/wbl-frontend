"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  HiringManagerReport.tsx
//  Clean, executive layout for Hiring Manager Assessment Report.
//  Directly matches the Technical Assessment visual layout standard.
//  3 Tabs: Overview | Questions & Feedback (Details) | Audio Analysis
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  Briefcase,
  Target,
  Users,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  Video,
  AudioWaveform,
  Scale,
  Award,
  User,
  Lightbulb,
  Check,
  Copy,
  X,
  ChevronDown,
  ChevronUp,
  Flame,
  Mic,
  ArrowRight,
  Compass,
  MessageSquare,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  NormalizedReport,
  HiringManagerEvaluation,
  HMCompetencyEvaluation,
  HMQuestionEvaluation,
  HMCompetencyCheckpoints,
} from "@/types/aiprep-report";
import { formatBand } from "@/types/aiprep-report";
import { aiPrepApi } from "@/lib/aiprep-api";
import VideoPlayer from "./VideoPlayer";
import { navigateToAssessmentsList } from "./OverviewReport";

// Standard 5 Competencies
export const STANDARD_HM_COMPETENCIES = [
  "Project Ownership",
  "Technical Roadblocks",
  "Conflict & Collaboration",
  "Trade-offs & Deadlines",
  "Delivery & Excellence",
] as const;

export function getCompetencyIcon(name: string) {
  const p = (name || "").toLowerCase();
  if (p.includes("ownership")) return <Target className="size-4 text-indigo-600" />;
  if (p.includes("roadblock")) return <AlertTriangle className="size-4 text-amber-600" />;
  if (p.includes("conflict") || p.includes("collaboration")) return <Users className="size-4 text-purple-600" />;
  if (p.includes("trade") || p.includes("deadline")) return <Scale className="size-4 text-blue-600" />;
  if (p.includes("delivery") || p.includes("excellence")) return <Award className="size-4 text-emerald-600" />;
  return <Briefcase className="size-4 text-slate-600" />;
}

export function QualitativeBadge({
  status,
  size = "md",
}: {
  status?: string;
  size?: "sm" | "md";
}) {
  if (!status) return null;
  const upper = status.toUpperCase().trim();
  const label = formatBand(status) || status;

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let dotClasses = "bg-slate-400";
  if (upper === "EXCELLENT" || upper === "STRONG") {
    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
    dotClasses = "bg-emerald-500";
  } else if (upper === "GOOD" || upper === "COVERED") {
    colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
    dotClasses = "bg-blue-500";
  } else if (upper === "AVERAGE" || upper === "PARTIAL" || upper === "ADEQUATE" || upper === "DEVELOPING" || upper === "MID-LEVEL") {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
    dotClasses = "bg-amber-500";
  } else if (upper === "POOR" || upper === "WEAK" || upper === "NEEDS_IMPROVEMENT" || upper === "NEEDS_WORK") {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
    dotClasses = "bg-rose-500";
  }

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px]"
      : "px-2.5 py-0.5 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${sizeClasses} ${colorClasses}`}>
      <span className={`size-1.5 rounded-full ${dotClasses}`} />
      {label}
    </span>
  );
}

export function getStatusDotColor(rating?: string) {
  if (!rating) return "bg-slate-400";
  const upper = rating.toUpperCase().trim();
  if (["STRONG", "EXCELLENT", "GOOD", "COVERED"].includes(upper)) return "bg-emerald-500";
  if (["AVERAGE", "PARTIAL", "ADEQUATE", "DEVELOPING", "MID-LEVEL"].includes(upper)) return "bg-amber-500";
  if (["POOR", "WEAK", "NEEDS_WORK", "NEEDS_IMPROVEMENT"].includes(upper)) return "bg-rose-500";
  return "bg-slate-400";
}

export function PersonalAgencyBadge({ agency }: { agency?: string }) {
  if (!agency) return null;
  const upper = agency.toUpperCase().trim();
  if (upper === "STRONG") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
        <User size={10} className="text-emerald-600" />
        Agency: Strong
      </span>
    );
  }
  if (upper === "MODERATE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">
        <User size={10} className="text-blue-600" />
        Agency: Moderate
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
      <User size={10} className="text-amber-600" />
      Agency: {formatBand(agency) || agency}
    </span>
  );
}

export function QuestionTypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  const upper = type.toUpperCase().trim();
  const isBehavioral = upper.includes("BEHAVIORAL");
  const label = type.replace(/_/g, " ").toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${isBehavioral
        ? "bg-purple-50 text-purple-700 border-purple-200"
        : "bg-slate-100 text-slate-700 border-slate-200"
        }`}
    >
      {label}
    </span>
  );
}

export function CompetencyCheckpointsCard({ checkpoints }: { checkpoints?: HMCompetencyCheckpoints }) {
  if (!checkpoints) return null;

  const items = [
    { label: "Problem Identification", status: checkpoints.problem_identification_and_initiative },
    { label: "Technical Depth", status: checkpoints.technical_depth_and_soundness },
    { label: "Stakeholder Alignment", status: checkpoints.stakeholder_alignment_and_communication },
    { label: "Personal Accountability", status: checkpoints.personal_accountability },
    { label: "Measurable Impact", status: checkpoints.measurable_impact },
  ].filter((it) => Boolean(it.status));

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5 h-full flex flex-col justify-start">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
          <Target size={13} className="text-blue-600" />
          <span>Core Leadership Checkpoints</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          Assessed in session
        </span>
      </div>

      <div className="space-y-1.5 flex-1 flex flex-col justify-around">
        {items.map((it, idx) => {
          const rawStatus = (it.status || "NOT_MENTIONED").toUpperCase().trim();
          let chipBorder = "border-slate-200 bg-white text-slate-700";
          let dot = "bg-slate-400";
          let statusLabel = rawStatus.replace(/_/g, " ");

          if (rawStatus === "COVERED") {
            chipBorder = "border-emerald-200/80 bg-emerald-50 text-emerald-800";
            dot = "bg-emerald-500";
            statusLabel = "Covered";
          } else if (rawStatus === "PARTIAL") {
            chipBorder = "border-amber-200/80 bg-amber-50 text-amber-800";
            dot = "bg-amber-500";
            statusLabel = "Partial";
          } else if (rawStatus === "NOT_APPLICABLE") {
            chipBorder = "border-slate-200 bg-slate-100 text-slate-500";
            dot = "bg-slate-400";
            statusLabel = "N/A";
          } else {
            chipBorder = "border-rose-200/80 bg-rose-50 text-rose-800";
            dot = "bg-rose-500";
            statusLabel = "Needs Focus";
          }

          return (
            <div
              key={idx}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs shadow-2xs ${chipBorder}`}
            >
              <span className="font-semibold text-slate-800 pr-2">{it.label}</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold shrink-0 uppercase tracking-wide">
                <span className={`size-1.5 rounded-full shrink-0 ${dot}`} />
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface HiringManagerReportProps {
  report: NormalizedReport;
  assessmentId: string;
  onOpenTranscript?: () => void;
}

export default function HiringManagerReport({
  report,
  assessmentId,
  onOpenTranscript,
}: HiringManagerReportProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const tabParam = searchParams?.get("tab")?.toLowerCase();
  const initialTab = tabParam === "details" ? "details" : "overview";
  const [activeTab, setActiveTab] = useState<"overview" | "details">(initialTab);

  // Details sidebar & questions selection
  const [selectedCompetencyName, setSelectedCompetencyName] = useState<string>("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});
  const [questionFilter, setQuestionFilter] = useState<"ALL" | "NEEDS_WORK">("ALL");



  // Transcript modal
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedAnswerId, setCopiedAnswerId] = useState<string | null>(null);

  const handleCopyModelAnswer = useCallback((qId: string, text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedAnswerId(qId);
      setTimeout(() => setCopiedAnswerId(null), 2000);
    }
  }, []);

  // Full transcript text
  const fullParagraphText = useMemo(() => {
    let raw = report.transcript?.full_text?.trim() || "";
    if (!raw && report.transcript?.segments && report.transcript.segments.length > 0) {
      raw = report.transcript.segments.map((s) => s.text).join(" ");
    }
    return raw
      .replace(/<\/?s>/gi, "")
      .replace(/(?:^|\n|\r)\s*(?:Candidate|Speaker\s*\d*):\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, [report.transcript]);

  const handleCopyTranscript = useCallback(() => {
    if (fullParagraphText) {
      navigator.clipboard.writeText(fullParagraphText);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  }, [fullParagraphText]);

  useEffect(() => {
    if (tabParam === "details" && activeTab !== "details") {
      setActiveTab("details");
    } else if ((tabParam === "overview" || !tabParam) && activeTab !== "overview") {
      setActiveTab("overview");
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tab: "overview" | "details") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      router.replace(url.pathname + url.search, { scroll: false });
    }
  };

  // Backend Data Extraction
  const hm: HiringManagerEvaluation = report.hiring_manager || {
    pillar_evaluations: [],
    question_evaluations: [],
  };

  const oa = hm.overall_assessment || {};
  const overallRating = oa.rating || report.overall_readiness || (report.assessment as any)?.rating || "GOOD";
  const executiveSummary =
    oa.executive_summary ||
    report.overall_summary ||
    "";
  const nextPracticeFocus = oa.next_practice_focus;

  const strengths =
    oa.top_strengths && oa.top_strengths.length > 0
      ? oa.top_strengths
      : report.strongest_points && report.strongest_points.length > 0
        ? report.strongest_points
        : [];

  const improvements =
    oa.priority_improvements && oa.priority_improvements.length > 0
      ? oa.priority_improvements
      : report.priority_improvements && report.priority_improvements.length > 0
        ? report.priority_improvements.map((p) => p.guidance || p.topic || "").filter(Boolean)
        : [];

  const strongestSignal =
    oa.strongest_signal || report.overall_strongest_signal || "";
  const biggestGap =
    oa.biggest_gap || report.overall_biggest_gap || "";

  const questions: HMQuestionEvaluation[] = useMemo(() => {
    return hm.question_evaluations || [];
  }, [hm.question_evaluations]);

  const competencies: HMCompetencyEvaluation[] = useMemo(() => {
    const list =
      (hm.competency_evaluations && hm.competency_evaluations.length > 0)
        ? hm.competency_evaluations
        : (hm.pillar_evaluations && hm.pillar_evaluations.length > 0)
          ? hm.pillar_evaluations
          : [];

    if (list.length > 0) {
      return list;
    }

    // If no explicit competency evaluations were returned, but questions exist with competency names:
    if (questions.length > 0) {
      const map = new Map<string, HMCompetencyEvaluation>();
      for (const q of questions) {
        const cName = q.competency || q.pillar || "General";
        if (!map.has(cName)) {
          map.set(cName, {
            competency: cName,
            pillar: cName,
            rating: q.rating || "AVERAGE",
            summary: q.observation || "",
            strengths: (q.covered_points || []).map((cp) => cp.description).filter(Boolean),
            gaps: (q.missed_points || []).map((mp) => mp.description).filter(Boolean),
            what_to_work_on: q.top_fix || "",
          });
        }
      }
      return Array.from(map.values());
    }

    return [];
  }, [hm.competency_evaluations, hm.pillar_evaluations, questions]);

  // Initialize selected competency / question
  useEffect(() => {
    if (!selectedCompetencyName && competencies.length > 0) {
      setSelectedCompetencyName(competencies[0].competency || competencies[0].pillar || "");
    }
  }, [competencies, selectedCompetencyName]);

  // Current active competency in Details
  const activeCompetency = useMemo(() => {
    return (
      competencies.find(
        (c) =>
          (c.competency || c.pillar || "").toLowerCase() === selectedCompetencyName.toLowerCase()
      ) || competencies[0]
    );
  }, [competencies, selectedCompetencyName]);

  // Questions belonging to the active competency
  const competencyQuestions = useMemo(() => {
    if (!activeCompetency) return questions;
    const name = (activeCompetency.competency || activeCompetency.pillar || "").toLowerCase();
    const matched = questions.filter(
      (q) => (q.competency || q.pillar || "").toLowerCase() === name
    );
    // If questions carry competency metadata, show matching questions (or empty if untested)
    const hasAnyCompTags = questions.some((q) => Boolean(q.competency || q.pillar));
    return hasAnyCompTags ? matched : questions;
  }, [questions, activeCompetency]);

  // Filtered questions in Details
  const filteredCompetencyQuestions = useMemo(() => {
    if (questionFilter === "NEEDS_WORK") {
      return competencyQuestions.filter((q) =>
        ["AVERAGE", "POOR", "WEAK", "NEEDS_WORK", "PARTIAL"].includes((q.rating || "").toUpperCase())
      );
    }
    return competencyQuestions;
  }, [competencyQuestions, questionFilter]);

  const needsWorkCount = useMemo(() => {
    return competencyQuestions.filter((q) =>
      ["AVERAGE", "POOR", "WEAK", "NEEDS_WORK", "PARTIAL"].includes((q.rating || "").toUpperCase())
    ).length;
  }, [competencyQuestions]);

  const delivery = hm.behavioral_delivery_analysis;

  // Media & Telemetry
  const isAudioOnly = report.assessment.assessment_type === "INTRO" || report.assessment.assessment_type === "HIRING_MANAGER";
  const durationSeconds =
    report.audio?.recording_environment?.speaking_duration_seconds ||
    (report as any).audio_telemetry?.duration ||
    (report as any).audio_telemetry?.speaking_duration_seconds ||
    0;

  const durationStr = useMemo(() => {
    if (durationSeconds && durationSeconds > 0) {
      const totalSec = Math.round(Number(durationSeconds));
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      if (mins > 0 && secs > 0) return `${mins} min ${secs} sec`;
      if (mins > 0) return `${mins} min`;
      return `${secs} sec`;
    }
    const rawCompleted = report.assessment.completed_at;
    const createDate = report.assessment.created_at;
    if (rawCompleted && createDate) {
      const start = new Date(createDate).getTime();
      const end = new Date(rawCompleted).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        const diffSec = Math.round((end - start) / 1000);
        if (diffSec < 7200) {
          const mins = Math.floor(diffSec / 60);
          const secs = diffSec % 60;
          return mins > 0 ? `${mins} min ${secs} sec` : `${secs} sec`;
        }
      }
    }
    return "--";
  }, [durationSeconds, report.assessment.completed_at, report.assessment.created_at]);

  // Dynamically generated waveform heights seeded by candidate audio metrics
  const waveformHeights = useMemo(() => {
    const seed = (durationSeconds || 120) * 17 + questions.length * 31;
    return Array.from({ length: 42 }).map((_, i) => {
      const wave1 = Math.sin((i / 42) * Math.PI * 3 + seed * 0.1);
      const wave2 = Math.cos((i / 42) * Math.PI * 7 + seed * 0.05);
      const wave3 = Math.sin((i / 42) * Math.PI * 13);
      const rawAmp = 40 + wave1 * 25 + wave2 * 20 + wave3 * 15;
      return Math.max(15, Math.min(100, Math.round(rawAmp)));
    });
  }, [durationSeconds, questions.length]);

  const authToken =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") || localStorage.getItem("token") || ""
      : "";

  const mediaPath = isAudioOnly ? "audio" : "video";
  const canShowRecording = Boolean(
    report.consent?.save_recording ??
    (report.assessment as any)?.consent?.save_recording ??
    true
  );

  const youtube_url =
    report.youtube_url ||
    report.assessment?.youtube_url ||
    (report as any).audio?.audio_url ||
    (report as any).audio_url ||
    null;

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

  // Playback hierarchy (exact same implementation as Intro Assessment Report):
  // 1. YouTube (once upload is done)
  // 2. Instant Local Playback (0ms zero-latency preview while YouTube is pending)
  // 3. Persistent Server Stream (fallback when YouTube fails or is pending)
  const effectivePlaybackUrl = canShowRecording
    ? (youtube_url || localPreviewUrl || serverUrl)
    : undefined;

  const candidateName = report.candidate_name || "";
  const rawDate = report.assessment.completed_at || report.assessment.created_at;
  const completedDateStr = useMemo(() => {
    if (!rawDate) return "";
    let dateStr = String(rawDate).trim();
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(dateStr)) {
      dateStr = dateStr.replace(" ", "T") + "Z";
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [rawDate]);

  const toggleExpand = (id: string) => {
    setExpandedQuestionIds((prev) => {
      const isCurrentlyExpanded = prev[id] !== false;
      return { ...prev, [id]: !isCurrentlyExpanded };
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">

        {/* --- TOP HEADER (TECHNICAL ASSESSMENT STYLE) --- */}
        <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigateToAssessmentsList(router)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer w-fit shadow-xs"
              >
                <ArrowLeft size={13} />
                <span>Back to Assessments</span>
              </button>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Hiring Manager Assessment
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  {completedDateStr ? (
                    <>
                      <span>Completed on: {completedDateStr}</span>
                      <span>|</span>
                    </>
                  ) : null}
                  <span>Duration: {durationStr}</span>
                </div>
              </div>
            </div>

            {Boolean(report.consent?.save_transcript ?? true) && (
              <button
                type="button"
                onClick={() => {
                  setIsTranscriptModalOpen(true);
                  onOpenTranscript?.();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/80 px-3.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <FileText size={13} className="text-purple-600" />
                <span>View Transcript</span>
              </button>
            )}
          </div>

          {/* 2 Tabs: Overview | Details matching screenshot tab bar */}
          <div className="flex items-center gap-6 border-b border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => handleTabChange("overview")}
              className={`pb-2.5 text-sm font-semibold transition-all cursor-pointer ${activeTab === "overview"
                ? "text-blue-600 font-bold border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("details")}
              className={`pb-2.5 text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "details"
                ? "text-blue-600 font-bold border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              <span>Details</span>
              {questions.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "details"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {questions.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/*  TAB 1: OVERVIEW (EXACT SCREEN 1 LAYOUT)                              */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* 1. Hiring Manager Performance Evaluation Card */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-blue-600 shrink-0" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Hiring Manager Performance Evaluation
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {competencies.length > 0
                      ? `Comprehensive evaluation across ${competencies.map((c) => c.competency || c.pillar).join(", ")}`
                      : "Comprehensive evaluation across assessed behavioral leadership competencies"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 pt-0.5">
                  <QualitativeBadge status={overallRating} />
                  <button
                    type="button"
                    onClick={() => handleTabChange("details")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span>Full Details</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                {executiveSummary}
              </p>

              {nextPracticeFocus && (
                <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-indigo-50/30 to-white p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-indigo-500/25 mt-0.5">
                      <Compass size={16} className="text-white" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                          Next Practice Focus
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                          Action Item
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                        {nextPracticeFocus}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 1b. Key Strategic Signals (v3.1.0) */}
            {(strongestSignal || biggestGap) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strongestSignal && (
                  <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-4 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Sparkles size={16} className="text-emerald-600 shrink-0" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">Strongest Leadership Signal</h3>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {strongestSignal}
                    </p>
                  </div>
                )}
                {biggestGap && (
                  <div className="rounded-xl border border-amber-200/90 bg-amber-50/40 p-4 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">Primary Growth Opportunity</h3>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {biggestGap}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Competencies Grid */}
            {competencies.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {competencies.map((comp, idx) => {
                  const name = comp.competency || comp.pillar || "Competency";
                  const qCount = questions.filter(
                    (q) => (q.competency || q.pillar || "").toLowerCase() === name.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                            {getCompetencyIcon(name)}
                            <span>{name}</span>
                          </div>
                          <QualitativeBadge status={comp.rating} size="sm" />
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <span>{qCount > 0 ? `${qCount} Question${qCount !== 1 ? "s" : ""} Tested` : "Not Tested in Session"}</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {comp.summary || (comp.rating === "NOT_TESTED" ? "Not assessed in this practice session." : "Evaluation details available in full breakdown.")}
                        </p>
                      </div>

                      <div className="text-right pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCompetencyName(name);
                            handleTabChange("details");
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          View &gt;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Question Performance Heatmap (Exact styling from Image 1) */}
            {questions.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Flame size={15} className="text-amber-500" />
                    <h3 className="text-xs font-bold text-slate-800">
                      Question Performance Heatmap
                    </h3>
                    <span className="text-xs text-slate-500 font-normal hidden sm:inline">
                      (Click any question to inspect)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Excellent
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-blue-500" />
                      Good
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Average
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-rose-500" />
                      Needs Work
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-9 gap-2">
                  {questions.map((q, idx) => {
                    const upperRating = (q.rating || "").toUpperCase();
                    let cardBg = "bg-rose-50/70 border-rose-200 text-rose-800 hover:border-rose-400";
                    if (["EXCELLENT", "STRONG"].includes(upperRating)) {
                      cardBg = "bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:border-emerald-400";
                    } else if (["GOOD", "COVERED"].includes(upperRating)) {
                      cardBg = "bg-blue-50/70 border-blue-200 text-blue-800 hover:border-blue-400";
                    } else if (["AVERAGE", "ADEQUATE", "PARTIAL", "DEVELOPING"].includes(upperRating)) {
                      cardBg = "bg-amber-50/70 border-amber-200 text-amber-800 hover:border-amber-400";
                    }

                    return (
                      <button
                        key={q.question_id || idx}
                        type="button"
                        onClick={() => {
                          const cName = q.competency || q.pillar;
                          if (cName) setSelectedCompetencyName(cName);
                          setSelectedQuestionId(q.question_id);
                          setExpandedQuestionIds({ [q.question_id]: true });
                          handleTabChange("details");
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer hover:shadow-xs hover:scale-[1.02] ${cardBg}`}
                      >
                        <div className="font-bold text-xs">
                          Q{idx + 1}
                        </div>
                        {q.difficulty_level ? (
                          <span className="text-[10px] opacity-75 capitalize">
                            {q.difficulty_level.toLowerCase()}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 4. Top Strengths & Fix These First (2 Columns from Image 1) */}
            {(strengths.length > 0 || improvements.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                {strengths.length > 0 && (
                  <section className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-800 border-b border-emerald-100 pb-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">Top Strengths</h3>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                      {strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Priority Improvements */}
                {improvements.length > 0 && (
                  <section className="rounded-xl border border-rose-200/80 bg-rose-50/30 p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-rose-800 border-b border-rose-100 pb-2">
                      <AlertTriangle size={16} className="text-rose-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">Fix These First</h3>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                      {improvements.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 size-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

            {/* 4b. Behavioral Delivery Analysis (v3.1.0) */}
            {delivery && (delivery.structured_storytelling || delivery.directness || delivery.conciseness_and_focus || delivery.conciseness_and_pacing || delivery.answer_depth || delivery.observation) && (() => {
              const deliveryMetrics = [
                {
                  key: "structured_storytelling",
                  label: "Structured Storytelling",
                  value: delivery.structured_storytelling,
                  desc: "Logical narrative flow & STAR framing",
                },
                {
                  key: "directness",
                  label: "Directness to Point",
                  value: delivery.directness,
                  desc: "Clear thesis & immediate answers",
                },
                {
                  key: "conciseness",
                  label: "Conciseness & Focus",
                  value: delivery.conciseness_and_focus || delivery.conciseness_and_pacing,
                  desc: "Pacing & filler-free articulation",
                },
                {
                  key: "answer_depth",
                  label: "Answer Depth",
                  value: delivery.answer_depth,
                  desc: "Strategic depth & quantitative context",
                },
                {
                  key: "authenticity",
                  label: "Authenticity & Poise",
                  value: delivery.authenticity_and_poise,
                  desc: "Executive tone & confidence",
                },
              ].filter((m) => Boolean(m.value));

              return (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-300 space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-3">
                     
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          Behavioral Delivery &amp; Communication Dynamics
                        </h3>
                        <p className="text-xs text-slate-500">
                          Evaluated across storytelling cadence, directness &amp; clarity
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 self-start sm:self-auto shadow-2xs">
                      <Mic className="size-3 text-purple-600" />
                      Spoken Delivery
                    </span>
                  </div>

                  {/* Metrics Cards Grid - auto adapts to 3 or 4 columns */}
                  <div className={`grid gap-3 ${deliveryMetrics.length === 3
                      ? "grid-cols-1 sm:grid-cols-3"
                      : deliveryMetrics.length === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    }`}>
                    {deliveryMetrics.map((metric) => (
                      <div
                        key={metric.key}
                        className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/30 to-slate-50/60 p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs hover:border-purple-200 hover:shadow-xs transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 leading-snug">
                            {metric.label}
                          </span>
                          <div className="shrink-0">
                            <QualitativeBadge status={metric.value} size="sm" />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          {metric.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Observation / Coaching Synthesis */}
                  {delivery.observation && (
                    <div className="rounded-xl border border-purple-200/70 bg-gradient-to-r from-purple-50/60 via-slate-50/30 to-white p-3.5 sm:p-4 flex items-start gap-3 shadow-2xs">
                      <div className="size-8 rounded-lg bg-purple-600/10 border border-purple-200/60 flex items-center justify-center shrink-0 text-purple-700 mt-0.5">
                        <MessageSquare className="size-4" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          
                          
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                          {delivery.observation}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* 5. Audio Recording Playback (Centered & Enlarged) */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <AudioWaveform size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Audio Recording &amp; Playback
                  </h3>
                  <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                    Audio Session
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Candidate Spoken Audio Track
                </span>
              </div>

              {/* Centered & Enlarged Audio Player Card — mirrors OverviewReport pattern */}
              <div className="w-full max-w-2xl mx-auto py-2">
                <VideoPlayer
                  youtubeUrl={effectivePlaybackUrl}
                  fallbackUrl={serverUrl}
                  isAudioOnly={isAudioOnly}
                  candidateName={candidateName}
                  durationSeconds={durationSeconds}
                  waveformAmplitudes={waveformHeights}
                />
              </div>
            </section>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/*  TAB 2: DETAILS (TOP NAV PLAN + BALANCED SIDE-BY-SIDE SPLIT VIEW)    */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "details" && (
          <div className="space-y-4">

            {/* â”€â”€ 1. COMPACT COMPETENCY NAVIGATION (CLEAN, BALANCED 5-COLUMN GRID) â”€â”€ */}
            {competencies.length > 0 && (
              <nav
                aria-label="Competency Navigation"
                className="bg-white rounded-xl border border-slate-200 p-2 sm:p-2.5 shadow-xs"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {competencies.map((comp, cIdx) => {
                    const compName = comp.competency || comp.pillar || "Competency";
                    const isSelectedComp =
                      (activeCompetency?.competency || activeCompetency?.pillar || "").toLowerCase() ===
                      compName.toLowerCase();
                    const compQs = questions.filter(
                      (q) => (q.competency || q.pillar || "").toLowerCase() === compName.toLowerCase()
                    );
                    const dotColor = getStatusDotColor(comp.rating);

                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => {
                          setSelectedCompetencyName(compName);
                          if (compQs.length > 0) {
                            setSelectedQuestionId(compQs[0].question_id);
                          } else {
                            setSelectedQuestionId("");
                          }
                        }}
                        className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-1.5 ${
                          isSelectedComp
                            ? "bg-blue-50/70 border-blue-600 text-blue-950 font-bold shadow-xs ring-2 ring-blue-500/20"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isSelectedComp ? "bg-blue-200 text-blue-900" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            0{cIdx + 1}
                          </span>
                          <QualitativeBadge status={comp.rating} size="sm" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {compName}
                        </span>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>{compQs.length} {compQs.length === 1 ? "Question" : "Questions"}</span>
                          <span className={`size-1.5 rounded-full shrink-0 ${dotColor}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </nav>
            )}

            {/* --- 2. EXECUTIVE EVALUATION (TOP) & TESTED QUESTIONS (BOTTOM) --- */}
            {activeCompetency ? (
              <div className="space-y-4">

                {/* --- TOP PANE: Competency Master Evaluation --- */}
                <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                        {getCompetencyIcon(activeCompetency.competency || activeCompetency.pillar || "")}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {activeCompetency.competency || activeCompetency.pillar}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Competency Evaluation • {competencyQuestions.length} Question{competencyQuestions.length !== 1 ? "s" : ""} Assessed
                        </p>
                      </div>
                    </div>
                    <QualitativeBadge status={activeCompetency.rating} size="sm" />
                  </div>

                  {/* Summary */}
                  {activeCompetency.summary && (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 sm:p-3.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Executive Observation
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {activeCompetency.summary}
                      </p>
                    </div>
                  )}

                  {/* Evaluation Signals: Balanced 12-Column Grid (Strengths & Gaps Stacked on Left 7 cols, Checkpoints on Right 5 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                    {/* Left Column: Strengths & Growth Areas (Span 7) */}
                    <div className="lg:col-span-7 flex flex-col gap-3">
                      {/* Demonstrated Strengths */}
                      <div className="rounded-xl bg-emerald-50/50 border border-emerald-200/80 p-3.5 space-y-2 flex-1">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase text-[10px] tracking-wider border-b border-emerald-100/90 pb-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>Demonstrated Strengths</span>
                        </div>
                        {activeCompetency.strengths && activeCompetency.strengths.length > 0 ? (
                          <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                            {activeCompetency.strengths.map((str, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-2">
                                <span className="mt-1.5 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No specific strengths flagged for this competency.</p>
                        )}
                      </div>

                      {/* Areas to Strengthen */}
                      <div className="rounded-xl bg-rose-50/50 border border-rose-200/80 p-3.5 space-y-2 flex-1">
                        <div className="flex items-center gap-1.5 text-rose-800 font-bold uppercase text-[10px] tracking-wider border-b border-rose-100/90 pb-1.5">
                          <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                          <span>Areas to Strengthen</span>
                        </div>
                        {((activeCompetency.gaps && activeCompetency.gaps.length > 0) || activeCompetency.what_to_work_on) ? (
                          <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                            {activeCompetency.gaps && activeCompetency.gaps.length > 0 ? (
                              activeCompetency.gaps.map((gap, gIdx) => (
                                <li key={gIdx} className="flex items-start gap-2">
                                  <span className="mt-1.5 size-1.5 rounded-full bg-rose-500 shrink-0" />
                                  <span>{gap}</span>
                                </li>
                              ))
                            ) : (
                              <li className="flex items-start gap-2">
                                <span className="mt-1.5 size-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>{activeCompetency.what_to_work_on}</span>
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No priority gaps identified for this competency.</p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Core Leadership Checkpoints (Span 5) */}
                    <div className="lg:col-span-5 flex flex-col">
                      {activeCompetency.checkpoints ? (
                        <CompetencyCheckpointsCard checkpoints={activeCompetency.checkpoints} />
                      ) : (
                        <div className="rounded-xl bg-slate-50/50 border border-slate-200/70 p-4 flex items-center justify-center text-xs text-slate-400 h-full">
                          Checkpoints not evaluated
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* --- BOTTOM PANE: Tested Questions & Real-Time Review --- */}
                <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-blue-600" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Tested Questions ({filteredCompetencyQuestions.length})
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setQuestionFilter("ALL")}
                        className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${questionFilter === "ALL"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        All ({competencyQuestions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestionFilter("NEEDS_WORK")}
                        className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${questionFilter === "NEEDS_WORK"
                          ? "bg-white text-rose-700 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        Needs Work ({needsWorkCount})
                      </button>
                    </div>
                  </div>

                  {filteredCompetencyQuestions.length === 0 ? (
                    <div className="text-center py-10 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 space-y-1">
                      <p className="text-xs font-semibold text-slate-700">
                        No questions tested under this competency in this session.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Select another competency from the Nav Plan above to view tested questions and coaching.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCompetencyQuestions.map((q, idx) => {
                        const globalIdx = questions.indexOf(q);
                        const isExpanded = expandedQuestionIds[q.question_id] !== false;
                        const dotColor = getStatusDotColor(q.rating);

                        // Build missed & covered tag strings
                        const missedTags = [
                          ...(q.missed_points || []).map((m) => m.description || m.id),
                          ...(q.leadership_signals_missing || []),
                        ].filter(Boolean);

                        const coveredTags = [
                          ...(q.covered_points || []).map((c) => c.description || c.id),
                          ...(q.leadership_signals_demonstrated || []),
                        ].filter(Boolean);

                        return (
                          <div
                            key={q.question_id || idx}
                            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3.5 transition-all shadow-xs"
                          >
                            {/* Row 1: Clean Question Card Header with Balanced Left & Right Groups */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                              {/* Left Meta Group */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                                  <span className={`size-2 rounded-full ${dotColor}`} />
                                  Question {idx + 1} of {filteredCompetencyQuestions.length}
                                </span>

                                {globalIdx >= 0 && questions.length > 1 && (
                                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                                    Q{globalIdx + 1} Overall
                                  </span>
                                )}

                                {q.difficulty_level ? (
                                  <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md capitalize">
                                    {q.difficulty_level.toLowerCase()}
                                  </span>
                                ) : null}

                                <QuestionTypeBadge type={q.question_type} />
                              </div>

                              {/* Right Evaluation & Action Group */}
                              <div className="flex items-center gap-2.5">
                                <QualitativeBadge status={q.rating} size="sm" />
                                <PersonalAgencyBadge agency={q.personal_agency} />

                                <button
                                  type="button"
                                  onClick={() => toggleExpand(q.question_id)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 cursor-pointer pl-1"
                                >
                                  <span>{isExpanded ? "Hide Review" : "Inspect Review"}</span>
                                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>
                              </div>
                            </div>

                            {/* Row 2: Prompt / Question Text */}
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                              {q.question_text}
                            </h4>

                            {/* Row 3: Signal Coverage Breakdown (Side-by-Side Demonstrated vs Missing Signals) */}
                            {(missedTags.length > 0 || coveredTags.length > 0) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                                {/* Demonstrated Signals */}
                                <div className="rounded-xl bg-emerald-50/50 border border-emerald-200/70 p-3 space-y-2">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between border-b border-emerald-100 pb-1.5">
                                    <span>Demonstrated Signals</span>
                                    <span className="text-[10px] text-emerald-700 font-semibold">{coveredTags.length} covered</span>
                                  </div>
                                  {coveredTags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {coveredTags.map((tag, tIdx) => (
                                        <span
                                          key={`cov-${tIdx}`}
                                          className="inline-flex items-center rounded-md border border-emerald-200 bg-white px-2 py-0.5 text-xs font-medium text-emerald-800 shadow-2xs"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400 italic">No specific signals registered.</p>
                                  )}
                                </div>

                                {/* Missing Signals */}
                                <div className="rounded-xl bg-rose-50/50 border border-rose-200/70 p-3 space-y-2">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center justify-between border-b border-rose-100 pb-1.5">
                                    <span>Missing Signals</span>
                                    <span className="text-[10px] text-rose-700 font-semibold">{missedTags.length} missed</span>
                                  </div>
                                  {missedTags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {missedTags.map((tag, tIdx) => (
                                        <span
                                          key={`mis-${tIdx}`}
                                          className="inline-flex items-center rounded-md border border-rose-200 bg-white px-2 py-0.5 text-xs font-medium text-rose-800 shadow-2xs"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400 italic">No priority gaps flagged for this response.</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Critical Anti-Pattern Alert (if flagged by evaluator) */}
                            {q.critical_failure_triggered && (
                              <div className="rounded-lg bg-rose-50 border border-rose-300 p-3 flex items-start gap-2.5 text-xs text-rose-900 shadow-2xs">
                                <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <div className="font-bold uppercase tracking-wider text-[11px] text-rose-950">
                                    Critical Anti-Pattern Flagged
                                  </div>
                                  <p className="text-xs text-rose-800 leading-relaxed font-medium">
                                    {q.critical_failure_triggered}
                                  </p>
                                </div>
                              </div>
                            )}


                            {/* Row 4: Expanded Review in Synchronized 2-Row Grid for Flawless Horizontal Alignment */}
                            {isExpanded && (
                              <div className="space-y-3.5 pt-3 border-t border-slate-100">
                                {/* Stage 1: The Interview Response & Evaluator Assessment */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                                  {/* Candidate Spoken Quote */}
                                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                          Your Spoken Answer
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                          Recorded Transcript
                                        </span>
                                      </div>
                                      {q.evidence && q.evidence.length > 0 && q.evidence[0].quote ? (
                                        <blockquote className="text-xs sm:text-[13px] text-slate-700 italic border-l-2 border-slate-400 pl-3 leading-relaxed">
                                          &ldquo;{q.evidence[0].quote}&rdquo;
                                        </blockquote>
                                      ) : (
                                        <p className="text-xs text-slate-400 italic">No direct spoken quote recorded.</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Hiring Manager Feedback */}
                                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between border-b border-blue-200 pb-2 mb-2.5">
                                        <span className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                                          Hiring Manager Feedback
                                        </span>
                                        <span className="text-[10px] font-medium text-blue-700 bg-blue-100/60 border border-blue-200 px-1.5 py-0.5 rounded">
                                          Evaluator Assessment
                                        </span>
                                      </div>
                                      {q.observation ? (
                                        <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-normal">
                                          {q.observation}
                                        </p>
                                      ) : (
                                        <p className="text-xs text-slate-400 italic">No specific observation recorded.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Stage 2: Coaching Action & Target Strong Answer */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                                  {/* Key Action to Improve */}
                                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-2.5">
                                        <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                                          Key Action to Improve
                                        </span>
                                        <span className="text-[10px] font-medium text-amber-800 bg-amber-100/70 border border-amber-200 px-1.5 py-0.5 rounded">
                                          Coaching Directive
                                        </span>
                                      </div>
                                      {q.top_fix && (
                                        <p className="text-xs sm:text-[13px] font-medium text-slate-900 leading-relaxed mb-2">
                                          {q.top_fix}
                                        </p>
                                      )}
                                      {q.coaching?.how_to_answer && (
                                        <div className="pt-2 border-t border-amber-200/80 text-xs text-amber-950 leading-relaxed">
                                          <span className="font-bold">Recommended Structure: </span>
                                          {q.coaching.how_to_answer}
                                        </div>
                                      )}
                                      {!q.top_fix && !q.coaching?.how_to_answer && (
                                        <p className="text-xs text-slate-400 italic">Performance met expectations for this prompt.</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Example Strong Answer */}
                                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between border-b border-indigo-200 pb-2 mb-2.5">
                                        <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                                          Example Strong Answer
                                        </span>
                                        {q.coaching?.stronger_version && (
                                          <button
                                            type="button"
                                            onClick={() => handleCopyModelAnswer(q.question_id, q.coaching?.stronger_version || "")}
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer bg-white border border-indigo-200 shadow-2xs"
                                          >
                                            {copiedAnswerId === q.question_id ? "Copied" : "Copy Answer"}
                                          </button>
                                        )}
                                      </div>
                                      {q.coaching?.stronger_version ? (
                                        <blockquote className="text-xs sm:text-[13px] text-slate-800 italic pl-3 border-l-2 border-indigo-500 leading-relaxed">
                                          &ldquo;{q.coaching.stronger_version}&rdquo;
                                        </blockquote>
                                      ) : (
                                        <p className="text-xs text-slate-400 italic">No model response provided.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                Select a competency from the nav plan above to view details.
              </div>
            )}
          </div>
        )}



      </div>

      {/* Transcript Modal */}
      {isTranscriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Full Assessment Transcript</h3>
                  {durationStr && (
                    <p className="text-xs text-slate-500">Duration: {durationStr}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {copiedTranscript ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTranscriptModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed max-h-[60vh]">
              {report.transcript?.segments && report.transcript.segments.length > 0 ? (
                <div className="space-y-3">
                  {report.transcript.segments.map((seg, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-[11px] font-bold text-slate-500 shrink-0 mt-0.5">
                        {seg.timestamp != null && !isNaN(Number(seg.timestamp))
                          ? `${Math.floor(Number(seg.timestamp) / 60)}:${String(Math.floor(Number(seg.timestamp) % 60)).padStart(2, "0")}`
                          : `#${idx + 1}`}
                      </span>
                      <p className="text-slate-700">{seg.text}</p>
                    </div>
                  ))}
                </div>
              ) : fullParagraphText ? (
                <p className="whitespace-pre-wrap">{fullParagraphText}</p>
              ) : (
                <p className="text-slate-400 italic">No transcript recorded for this session.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
