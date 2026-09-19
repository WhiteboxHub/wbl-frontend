"use client";

import { useState, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import { type NormalizedReport, type CoachingSuggestion } from "@/types/aiprep-report";

interface Props {
  report: NormalizedReport;
}

interface SelectedCoachingItem {
  suggestion: CoachingSuggestion;
  displayIndex: string;
}

export default function CoachingReport({ report }: Props) {
  const [selected, setSelected] = useState<SelectedCoachingItem | null>(null);

  // Close modal on Escape key and lock background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
      }
    };

    if (selected) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selected]);

  const rawSuggestions = (report.coaching_suggestions && report.coaching_suggestions.length > 0)
    ? report.coaching_suggestions
    : (report.priority_improvements && report.priority_improvements.length > 0)
      ? report.priority_improvements.map((p, idx) => ({
          priority: typeof p.priority === "number" ? p.priority : idx + 1,
          dimension: "Delivery & Structure",
          area: p.topic || `Priority ${idx + 1}`,
          suggestion: [p.guidance, p.example ? `Example: ${p.example}` : ""].filter(Boolean).join(" "),
          evidence: p.example,
        }))
      : (report.critical_gaps && report.critical_gaps.length > 0)
        ? report.critical_gaps.map((g, idx) => ({
            priority: idx + 1,
            dimension: "Content Coverage",
            area: g.topic || `Focus Area ${idx + 1}`,
            suggestion: [g.what_is_missing, g.suggested_addition ? `Recommendation: ${g.suggested_addition}` : ""].filter(Boolean).join(" ") || "Improve depth and coverage.",
            evidence: g.why_it_matters,
          }))
        : (report.improvements && report.improvements.length > 0)
          ? report.improvements.map((imp, idx) => ({
              priority: typeof imp.priority === "number" ? imp.priority : idx + 1,
              dimension: "Interview Performance",
              area: imp.topic || `Recommendation ${idx + 1}`,
              suggestion: imp.rationale || "",
              evidence: imp.effort ? `Estimated effort: ${imp.effort}` : undefined,
            }))
          : report.final_assessment?.most_important_improvement
            ? [
                {
                  priority: 1,
                  dimension: "Core Focus",
                  area: "Primary Improvement",
                  suggestion: report.final_assessment.most_important_improvement,
                },
              ]
            : report.overall_biggest_gap
              ? [
                  {
                    priority: 1,
                    dimension: "Core Focus",
                    area: "Key Gap to Address",
                    suggestion: report.overall_biggest_gap,
                  },
                ]
              : [];

  const hasCoaching = rawSuggestions.length > 0;

  // Empty state if no coaching suggestions or fallbacks available
  if (!hasCoaching) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
            Coaching & Recommendations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized areas to focus on based on your assessment.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No coaching recommendations are available for this assessment.
          </p>
        </div>
      </div>
    );
  }

  // Preserve priority ordering if available
  const sortedSuggestions = [...rawSuggestions].sort(
    (a, b) => (a.priority ?? 999) - (b.priority ?? 999)
  );

  const coachingCount = sortedSuggestions.length;

  return (
    <div className="space-y-5">
      {/* ── 1. Page Header ── */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Coaching & Recommendations
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Personalized areas to focus on based on your assessment.
        </p>
      </div>

      {/* ── 2. Coaching Priority Summary Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/50 text-lg"
            role="img"
            aria-label="Target"
          >
            🎯
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Coaching Priorities
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Focus on the key areas identified from your assessment.
            </p>
          </div>
        </div>
        <div className="self-start sm:self-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-100 dark:border-violet-800/50">
            {coachingCount} {coachingCount === 1 ? "area" : "areas"}
          </span>
        </div>
      </div>

      {/* ── 3. Main Content: Compact Card Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {sortedSuggestions.map((item, index) => {
          const displayIndex =
            item.priority != null
              ? String(item.priority).padStart(2, "0")
              : String(index + 1).padStart(2, "0");

          return (
            <div
              key={index}
              onClick={() => setSelected({ suggestion: item, displayIndex })}
              className="group flex flex-col justify-between h-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-200 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected({ suggestion: item, displayIndex });
                }
              }}
            >
              <div className="space-y-3">
                {/* Header row with index, title, and dimension badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/50 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                      {displayIndex}
                    </span>
                    {item.area && (
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
                        {item.area}
                      </h4>
                    )}
                  </div>
                  {item.dimension && (
                    <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                      {item.dimension}
                    </span>
                  )}
                </div>

                {/* Short recommendation preview (line clamped, no evidence in card) */}
                {item.suggestion && (
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
                    {item.suggestion}
                  </p>
                )}
              </div>

              {/* Card Footer: View recommendation trigger */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                  View recommendation
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Detail Modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-150"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelected(null)}
          />

          {/* Modal Container */}
          <div
            className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5 pr-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/50 px-2 py-0.5 rounded-md">
                    {selected.displayIndex}
                  </span>
                  {selected.suggestion.dimension && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                      {selected.suggestion.dimension}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {selected.suggestion.area || "Coaching Recommendation"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Modal Body: Internally scrollable */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Full Recommendation */}
              {selected.suggestion.suggestion && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Recommendation
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {selected.suggestion.suggestion}
                  </p>
                </div>
              )}

              {/* Full Evidence */}
              {selected.suggestion.evidence && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Evidence
                  </h4>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-4">
                    <p className="text-xs sm:text-sm italic leading-relaxed text-slate-600 dark:text-slate-300">
                      "{selected.suggestion.evidence}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-5 py-3.5 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
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
