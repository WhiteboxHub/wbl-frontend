"use client";

import { useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
  Volume2,
  GitFork,
  Code2,
  Target,
} from "lucide-react";
import { type NormalizedReport, formatBand, bandColor } from "@/types/aiprep-report";

interface Props {
  report: NormalizedReport;
}

function Badge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${bandColor(status)}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {formatBand(status)}
    </span>
  );
}

export default function PerformanceReport({ report }: Props) {
  const { scores, technical_analysis, gaps_to_validate } = report;

  // Controls showing first 3 items vs all items within each card
  const [expandedStrengths, setExpandedStrengths] = useState(false);
  const [expandedImprovements, setExpandedImprovements] = useState(false);

  // Modal state for validation details on demand
  const [selectedValidation, setSelectedValidation] = useState<{ topic: string; reason?: string } | null>(null);

  // Escape key listener & body scroll lock for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedValidation(null);
    };
    if (selectedValidation) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selectedValidation]);

  const overallBand = scores?.overall_band || report.overall_readiness;

  // Resolve strengths from technical analysis, intro strongest points, or overall strongest signal
  const strengths = (technical_analysis?.strengths && technical_analysis.strengths.length > 0)
    ? technical_analysis.strengths
    : (report.strongest_points && report.strongest_points.length > 0)
      ? report.strongest_points
      : (report.overall_strongest_signal ? [report.overall_strongest_signal] : []);

  const displayedStrengths = expandedStrengths ? strengths : strengths.slice(0, 3);
  const hasMoreStrengths = strengths.length > 3;

  // Resolve improvements from technical analysis, priority improvements, critical gaps, or overall biggest gap
  const improvements = (technical_analysis?.areas_for_improvement && technical_analysis.areas_for_improvement.length > 0)
    ? technical_analysis.areas_for_improvement
    : (report.priority_improvements && report.priority_improvements.length > 0)
      ? report.priority_improvements.map((p) => (p.topic ? `${p.topic}: ${p.guidance || ""}`.trim() : p.guidance || "")).filter(Boolean)
      : (report.critical_gaps && report.critical_gaps.length > 0)
        ? report.critical_gaps.map((g) => (g.topic ? `${g.topic}: ${g.what_is_missing || g.why_it_matters || ""}`.trim() : g.what_is_missing || "")).filter(Boolean)
        : (report.overall_biggest_gap ? [report.overall_biggest_gap] : []);

  const displayedImprovements = expandedImprovements ? improvements : improvements.slice(0, 3);
  const hasMoreImprovements = improvements.length > 3;

  // Resolve validation areas
  const validationAreas = (gaps_to_validate && gaps_to_validate.length > 0)
    ? gaps_to_validate
    : (report.critical_gaps && report.critical_gaps.length > 0)
      ? report.critical_gaps.map((g) => ({
        topic: g.topic || "Validation Topic",
        reason: g.what_is_missing || g.why_it_matters || g.suggested_addition || "Candidate should elaborate on this in follow-up.",
      }))
      : [];

  const summary = technical_analysis?.summary || report.overall_summary;
  const isCompleted = report.assessment?.status === "COMPLETED" || Boolean(report.overall_readiness);

  const isAllExpanded = (expandedStrengths || !hasMoreStrengths) && (expandedImprovements || !hasMoreImprovements);

  const handleToggleAll = () => {
    if (isAllExpanded) {
      setExpandedStrengths(false);
      setExpandedImprovements(false);
    } else {
      setExpandedStrengths(true);
      setExpandedImprovements(true);
    }
  };

  const hasContent = Boolean(
    summary ||
    strengths.length > 0 ||
    improvements.length > 0 ||
    validationAreas.length > 0 ||
    report.intro_quality ||
    isCompleted
  );

  if (!hasContent) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Performance analysis will appear when the evaluation is complete.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-slate-950">Performance Analysis</h2>
        <p className="text-sm text-slate-500">
          A detailed analysis of your interview performance across key areas.
        </p>
      </div>

      {/* 2. Compact Performance / Technical Summary Card */}
      {summary && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {technical_analysis?.summary ? "Technical Summary" : "Performance Summary"}
              </h3>
            </div>
            {overallBand && <Badge status={overallBand} />}
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
            {summary}
          </p>
          {(technical_analysis?.depth_assessment || report.intro_quality?.technical_depth) && (
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Technical Discussion Overview
              </p>
              <p className="text-xs leading-relaxed text-slate-600 italic">
                {technical_analysis?.depth_assessment ||
                  `Technical coverage evaluated as ${formatBand(report.intro_quality?.technical_depth)} with opportunity to expand on specific tools and architecture.`}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Intro Delivery Quality / Presentation Factors */}
      {report.intro_quality && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Key Introduction Highlights</h3>
              <p className="text-xs text-slate-500">Core communication and presentation elements for your introduction</p>
            </div>
            {report.intro_quality.observation && (
              <span className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 max-w-md leading-relaxed">
                💡 {report.intro_quality.observation.toLowerCase().includes("lacks clarity, coherence, and technical depth") ||
                report.intro_quality.observation.toLowerCase().startsWith("the introduction lacks")
                  ? "Focus on structuring your journey smoothly, mentioning key technologies, and highlighting your personal contributions."
                  : report.intro_quality.observation}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Speech Clarity",
                hint: "Articulation & pacing",
                icon: <Volume2 className="size-3.5 text-violet-500" />,
                val: report.intro_quality.clarity,
              },
              {
                label: "Story Flow",
                hint: "Structure & sequence",
                icon: <GitFork className="size-3.5 text-violet-500" />,
                val: report.intro_quality.coherence,
              },
              {
                label: "Tech Background",
                hint: "Tools & technologies",
                icon: <Code2 className="size-3.5 text-violet-500" />,
                val: report.intro_quality.technical_depth,
              },
              {
                label: "Project Impact",
                hint: "Relevance & results",
                icon: <Target className="size-3.5 text-violet-500" />,
                val: report.intro_quality.business_context,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-white hover:border-violet-200 transition-all"
              >
                <div className="mb-2">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs mb-0.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{item.hint}</p>
                </div>
                <div>
                  {item.val ? (
                    <Badge status={item.val} />
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Strengths & Areas to Improve - Compact Two Columns */}
      {(strengths.length > 0 || improvements.length > 0) && (
        <div className="space-y-2.5">
          {/* Section title & Expand all / Close all button */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Strengths & Areas to Improve
            </h3>
            {(hasMoreStrengths || hasMoreImprovements) && (
              <button
                type="button"
                onClick={handleToggleAll}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-violet-700 hover:border-violet-200 transition-all"
              >
                {isAllExpanded ? (
                  <>
                    <ChevronUp className="size-3 text-slate-500" />
                    Close all
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3 text-slate-500" />
                    Expand all
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Strengths Card */}
            {strengths.length > 0 && (
              <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Strengths</h4>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {strengths.length}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {displayedStrengths.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="size-2 stroke-[3]" />
                        </span>
                        <span className={`flex-1 text-xs text-slate-700 leading-relaxed ${expandedStrengths ? "" : "line-clamp-2"}`}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {hasMoreStrengths && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setExpandedStrengths(prev => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      {expandedStrengths ? (
                        <>Show fewer strengths ↑</>
                      ) : (
                        <>View all {strengths.length} strengths →</>
                      )}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Areas to Improve Card */}
            {improvements.length > 0 && (
              <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                        <AlertCircle className="size-3.5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Areas to Improve</h4>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      {improvements.length}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {displayedImprovements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[9px] font-extrabold leading-none">
                          !
                        </span>
                        <span className={`flex-1 text-xs text-slate-700 leading-relaxed ${expandedImprovements ? "" : "line-clamp-2"}`}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {hasMoreImprovements && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setExpandedImprovements(prev => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 transition-colors"
                    >
                      {expandedImprovements ? (
                        <>Show fewer areas to improve ↑</>
                      ) : (
                        <>View all {improvements.length} areas to improve →</>
                      )}
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {/* 4. Areas to Validate - Compact Topic Grid (Descriptions on Demand) */}
      {validationAreas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                <HelpCircle className="size-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Areas to Validate</h3>
            </div>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
              {validationAreas.length} {validationAreas.length === 1 ? "topic" : "topics"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {validationAreas.map((gap, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedValidation({ topic: gap.topic ?? "Validation Topic", reason: gap.reason })}
                className="group flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm hover:border-violet-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                    <HelpCircle className="size-3" />
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                    {gap.topic}
                  </h4>
                </div>
                <ArrowRight className="size-3 shrink-0 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Modal for Validation Details */}
      {selectedValidation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedValidation(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                  <HelpCircle className="size-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {selectedValidation.topic}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedValidation(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Existing LLM-generated reason
              </p>
              {selectedValidation.reason ? (
                <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3.5">
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-800">
                    {selectedValidation.reason}
                  </p>
                </div>
              ) : (
                <p className="text-xs italic text-slate-400">
                  No specific validation reason provided for this topic.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-5 py-2.5 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedValidation(null)}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
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
