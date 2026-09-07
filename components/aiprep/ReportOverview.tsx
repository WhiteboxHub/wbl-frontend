'use client';

/**
 * ReportOverview Component
 * Specification: [Vishnu] Phase 6: Performance Overview Card
 * 
 * Renders the candidate's performance narrative, demonstrated strengths,
 * and key areas to practice.
 */

import React from 'react';
import { AssessmentDetails, CoachingBand } from '@/types/aiprep';
import { CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

export interface ReportOverviewProps {
  assessment: AssessmentDetails;
  onNavigateTab?: (tab: string) => void;
}

export const ReportOverview: React.FC<ReportOverviewProps> = ({
  assessment,
  onNavigateTab,
}) => {
  const report = assessment?.report;
  const transcriptEval = report?.transcript_evaluation;
  const techAnalysis = transcriptEval?.technical_analysis;
  const coachingBand = report?.coaching_band as CoachingBand | undefined;

  const headline = React.useMemo(() => {
    switch (coachingBand) {
      case 'EXCELLENT':
        return {
          title: 'Positive Performance',
          summary: 'Consistently clear, technically accurate explanations and strong communication fundamentals.',
          badge: 'Positive',
          badgeStyle:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'GOOD':
        return {
          title: 'Moderate Performance',
          summary: 'Good baseline technical depth and engagement with targeted areas to sharpen.',
          badge: 'Moderate',
          badgeStyle:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        };
      case 'NEEDS_PRACTICE':
      case 'EMERGING':
        return {
          title: 'Opportunity for Growth',
          summary: 'Focused practice on structured technical phrasing and concise delivery will accelerate your interview readiness.',
          badge: 'Growth Area',
          badgeStyle:
            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        };
      default:
        return {
          title: 'Assessment Summary',
          summary: 'Personalized evaluation derived from your completed interview practice session.',
          badge: 'Evaluated',
          badgeStyle:
            'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        };
    }
  }, [coachingBand]);

  const strengths = techAnalysis?.strengths || [];
  const improvements = techAnalysis?.areas_for_improvement || [];

  return (
    <div className="space-y-4">
      {/* Top Overview Narrative Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${headline.badgeStyle}`}>
              {headline.badge}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
              {headline.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {techAnalysis?.summary || headline.summary}
            </p>
          </div>

          {report?.overall_score != null && (
            <div className="sm:text-right shrink-0">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Overall Score
              </span>
              <p className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400">
                {Math.round(report.overall_score)}%
              </p>
            </div>
          )}
        </div>

        {/* Strengths & Improvements 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Strengths */}
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/30 dark:bg-emerald-950/10 p-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Demonstrated Strengths</span>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {strengths.length > 0 ? (
                strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">No specific strengths recorded.</li>
              )}
            </ul>
          </div>

          {/* Areas for Growth */}
          <div className="rounded-xl border border-amber-100 dark:border-amber-950/60 bg-amber-50/30 dark:bg-amber-950/10 p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>Key Areas to Practice</span>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {improvements.length > 0 ? (
                improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{imp}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">No specific improvements suggested.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportOverview;
