"use client";

import React, { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import type {
  NormalizedReport,
  TechnicalEvaluation,
  TechnicalQuestionEval,
  TechnicalConceptEval,
} from "@/types/aiprep-report";

interface Props {
  report: NormalizedReport;
  activeTab: string;
  onSelectTab: (tab: "Overview" | "Details") => void;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function TechnicalEvaluationView({ report, activeTab, onSelectTab }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
                  Technical Readiness Assessment
                </h1>
                <p className="text-[11px] text-slate-500">
                  Principal evaluation across AI, Software Systems, and Cloud Delivery
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

          <p className="mt-2.5 text-xs text-slate-700 leading-relaxed line-clamp-2">
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

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
                      {subj.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {subj.terminology_gaps && subj.terminology_gaps.length > 0 ? (
                      <div className="flex items-center gap-1 overflow-hidden pr-2">
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          Add:
                        </span>
                        <span className="text-[10px] font-semibold text-rose-600 truncate bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                          {subj.terminology_gaps[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium">
                        Terms accurate
                      </span>
                    )}

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
                    <span className="text-[9px] font-semibold text-slate-500 truncate max-w-full">
                      {q.difficulty_level?.[0] ?? "—"}
                    </span>
                    <span className={`mt-1 size-1.5 rounded-full ${qmeta.dotClass}`} />
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
                  <span className="line-clamp-2">{st}</span>
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
                  <span className="line-clamp-2">{imp}</span>
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
              <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {techEval.difficulty_analysis.easy}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-extrabold uppercase text-blue-700 tracking-wider">
                Medium Tier
              </span>
              <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {techEval.difficulty_analysis.medium}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider">
                Hard Tier
              </span>
              <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {techEval.difficulty_analysis.hard}
              </p>
            </div>
          </div>
        </div>
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
                    <span className="font-semibold text-slate-700">{activeConcept.subject}</span>{" "}
                    • {activeConcept.questions_count ?? 0} question
                    {(activeConcept.questions_count ?? 0) !== 1 ? "s" : ""} tested
                  </p>
                )}
              </div>

              {activeConcept.data_note && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {activeConcept.data_note}
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1 mb-1">
                  <CheckCircle2 size={12} /> Demonstrated Strengths
                </span>
                <ul className="space-y-1">
                  {activeConcept.strengths && activeConcept.strengths.length > 0 ? (
                    activeConcept.strengths.slice(0, 2).map((st, i) => (
                      <li key={i} className="text-[11px] text-slate-700 line-clamp-2">
                        • {st}
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
                  <AlertTriangle size={12} /> Priority Gaps &amp; Fixes
                </span>
                <ul className="space-y-1">
                  {activeConcept.gaps && activeConcept.gaps.length > 0 ? (
                    activeConcept.gaps.slice(0, 2).map((gap, i) => (
                      <li key={i} className="text-[11px] text-slate-700 line-clamp-2">
                        • {gap}
                      </li>
                    ))
                  ) : (
                    <li className="text-[11px] text-slate-400 italic">
                      No major gaps identified!
                    </li>
                  )}
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
                            {q.difficulty_level}
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
                                className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 truncate max-w-[200px]"
                              >
                                {mp.description}
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

                      <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-700">
                            {coveredCount}/{totalPoints} points
                          </span>
                          <div className="w-16 h-1 bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                coveragePercent >= 75
                                  ? "bg-emerald-500"
                                  : coveragePercent >= 50
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${coveragePercent}%` }}
                            />
                          </div>
                        </div>

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
                            {/* Principal Evaluator Observation */}
                            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 space-y-1">
                              <span className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider">
                                Principal Evaluator Observation
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
                                      <span>{p.description}</span>
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
                                        <span>{p.description}</span>
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

                            {/* Verbatim evidence */}
                            {q.evidence && q.evidence.length > 0 && (
                              <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Quote size={12} /> Verbatim Transcript Evidence
                                </span>
                                {q.evidence.map((ev, i) => (
                                  <blockquote
                                    key={i}
                                    className="p-2.5 rounded bg-white border-l-2 border-slate-400 text-xs italic text-slate-700"
                                  >
                                    &ldquo;{ev}&rdquo;
                                  </blockquote>
                                ))}
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
                                    Recommended Answer Framing (Ground Truth)
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
