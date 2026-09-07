'use client';

/**
 * ScoreBreakdown Component
 * Specification: [Vishnu] Phase 6: Category Scores Breakdown
 * 
 * Renders individual competency score cards, progress bars, and breakdown
 * metrics across all evaluated dimensions.
 */

import React from 'react';
import { AssessmentDetails, ScoresBreakdown } from '@/types/aiprep';

export interface ScoreBreakdownProps {
  assessment: AssessmentDetails;
  scoresBreakdown?: ScoresBreakdown;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  assessment,
  scoresBreakdown: propScoresBreakdown,
}) => {
  const report = assessment?.report;
  const transcriptEval = report?.transcript_evaluation;
  const scoresBreakdown: ScoresBreakdown =
    propScoresBreakdown || transcriptEval?.scores_breakdown || {};

  const filteredScores = React.useMemo(() => {
    return Object.entries(scoresBreakdown).filter(([k]) => {
      const l = k.toLowerCase();
      return !l.includes('business') && !l.includes('acumen');
    });
  }, [scoresBreakdown]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Competency Score Breakdown
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Performance metrics across individual evaluated technical and non-technical dimensions
          </p>
        </div>

        {filteredScores.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 italic">
            No category scores recorded for this assessment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
            {filteredScores.map(([key, val]) => {
              const score = typeof val?.score === 'number' ? Math.round(val.score) : 0;
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              const color =
                score >= 80
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : score >= 65
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-amber-600 dark:text-amber-400';
              const barColor =
                score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-indigo-500' : 'bg-amber-500';

              return (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {label}
                    </span>
                    <span className={`text-base font-black ${color}`}>{score}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreBreakdown;
