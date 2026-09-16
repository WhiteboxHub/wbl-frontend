"use client";

import { useState, useEffect } from "react";
import { Check, CheckCircle2, AlertCircle, HelpCircle, Sparkles, ChevronDown, ChevronUp, X, ArrowRight } from "lucide-react";
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

  const strengths = technical_analysis?.strengths ?? [];
  const displayedStrengths = expandedStrengths ? strengths : strengths.slice(0, 3);
  const hasMoreStrengths = strengths.length > 3;

  const improvements = technical_analysis?.areas_for_improvement ?? [];
  const displayedImprovements = expandedImprovements ? improvements : improvements.slice(0, 3);
  const hasMoreImprovements = improvements.length > 3;

  const validationAreas = gaps_to_validate ?? [];

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
    technical_analysis?.summary ||
    strengths.length > 0 ||
    improvements.length > 0 ||
    validationAreas.length > 0
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

      {/* 2. Compact Technical Summary Card */}
      {technical_analysis?.summary && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">Technical Summary</h3>
            </div>
            {overallBand && <Badge status={overallBand} />}
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
            {technical_analysis.summary}
          </p>
          {technical_analysis.depth_assessment && (
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                Depth Assessment
              </p>
              <p className="text-xs leading-relaxed text-slate-600 italic">
                {technical_analysis.depth_assessment}
              </p>
            </div>
          )}
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
