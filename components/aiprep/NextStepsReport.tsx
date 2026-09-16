"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, HelpCircle, Target, Sparkles, RotateCcw } from "lucide-react";
import { type NormalizedReport } from "@/types/aiprep-report";

interface Props {
  report: NormalizedReport;
}

export default function NextStepsReport({ report }: Props) {
  const {
    priority_improvements = [],
    improvements = [],
    gaps_to_validate = [],
    critical_gaps = [],
    technical_analysis,
    final_assessment,
    audio,
  } = report;

  // ── 1. Gather Improvement Items (without coaching suggestions) ──────────────
  const improvementItems: { title: string; description?: string }[] = [];
  if (priority_improvements.length > 0) {
    priority_improvements.slice(0, 2).forEach((imp) => {
      if (imp.topic || imp.guidance) {
        improvementItems.push({
          title: imp.topic || "Area for Review",
          description: imp.guidance || imp.example,
        });
      }
    });
  } else if (improvements.length > 0) {
    improvements.slice(0, 2).forEach((imp) => {
      if (imp.topic || imp.rationale) {
        improvementItems.push({
          title: imp.topic || "Area for Review",
          description: imp.rationale,
        });
      }
    });
  } else if (technical_analysis?.areas_for_improvement && technical_analysis.areas_for_improvement.length > 0) {
    technical_analysis.areas_for_improvement.slice(0, 2).forEach((item) => {
      improvementItems.push({
        title: "Technical Area",
        description: item,
      });
    });
  }

  // ── 2. Gather Knowledge Gap Items (without coaching suggestions) ─────────────
  const gapItems: { title: string; description?: string }[] = [];
  if (gaps_to_validate.length > 0) {
    gaps_to_validate.slice(0, 2).forEach((gap) => {
      if (gap.topic || gap.reason) {
        gapItems.push({
          title: gap.topic || "Topic to Validate",
          description: gap.reason,
        });
      }
    });
  } else if (critical_gaps.length > 0) {
    critical_gaps.slice(0, 2).forEach((gap) => {
      if (gap.topic || gap.what_is_missing || gap.suggested_addition) {
        gapItems.push({
          title: gap.topic || "Topic to Validate",
          description: gap.what_is_missing || gap.suggested_addition || gap.why_it_matters,
        });
      }
    });
  }

  // ── 3. Practice Focus for Next Attempt ───────────────────────────────────────
  const practiceItems: { title: string; description?: string }[] = [];
  if (final_assessment?.most_important_improvement) {
    practiceItems.push({
      title: "Core Practice Focus",
      description: final_assessment.most_important_improvement,
    });
  } else if (audio?.primary_vocal_gap) {
    practiceItems.push({
      title: "Vocal Delivery Focus",
      description: audio.primary_vocal_gap,
    });
  } else if (final_assessment?.transition_quality) {
    practiceItems.push({
      title: "Narrative & Transitions",
      description: final_assessment.transition_quality,
    });
  }

  const hasAnyData =
    improvementItems.length > 0 || gapItems.length > 0 || practiceItems.length > 0;

  if (!hasAnyData) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Recommended Next Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Use what you learned from this assessment, practice the areas that need attention, and continue building your interview skills.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Next steps will appear when the evaluation is complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Page Header ── */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Recommended Next Steps
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Use what you learned from this assessment, practice the areas that need attention, and continue building your interview skills.
        </p>
      </div>

      {/* ── 2. Motivation / Encouragement Card ── */}
      <div className="rounded-2xl border border-violet-200/90 dark:border-violet-800/60 bg-gradient-to-br from-violet-50/90 via-white to-purple-50/50 dark:from-violet-950/40 dark:via-slate-900 dark:to-purple-950/30 p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              Keep building your interview skills
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Every assessment gives you another opportunity to practice, learn, and improve. Use the insights from this assessment, then put them into practice in your next one.
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Action-Oriented Next Steps ("What to do next") ── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            What to do next
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key actions to take before your next interview round.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Review your improvement areas */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  Review your improvement areas
                </h4>
              </div>

              {improvementItems.length > 0 ? (
                <div className="space-y-2.5">
                  {improvementItems.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 space-y-1"
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No specific improvement items flagged for review.
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Validate your knowledge */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  Validate your knowledge
                </h4>
              </div>

              {gapItems.length > 0 ? (
                <div className="space-y-2.5">
                  {gapItems.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 space-y-1"
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  All expected knowledge topics were covered in your response.
                </p>
              )}
            </div>
          </div>

          {/* Card 3: Practice before your next attempt */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 shrink-0">
                  <Target className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  Practice before your next attempt
                </h4>
              </div>

              {practiceItems.length > 0 ? (
                <div className="space-y-2.5">
                  {practiceItems.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 space-y-1"
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Focus on smooth transitions and crisp technical delivery in your next session.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Motivation + Next Assessment CTA ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-violet-600 dark:text-violet-400">
                <RotateCcw className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Ready for your next practice?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Put what you learned into practice with another assessment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/user_dashboard/ai-prep"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/user_dashboard/ai-prep"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:gap-2.5"
            >
              Start Assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
