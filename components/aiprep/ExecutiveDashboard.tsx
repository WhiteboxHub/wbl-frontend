'use client';

/**
 * ExecutiveDashboard Component
 * Specification: [Vishnu] Phase 6: Executive Summary Metrics
 * 
 * Displays the high-level executive interview performance summary, score gauges,
 * readiness tier badges, and dimension overview cards.
 */

import React from 'react';
import { AssessmentDetails, CoachingBand } from '@/types/aiprep';
import {
  Sparkles,
  Brain,
  Mic,
  ArrowRight,
  TrendingUp,
  Award,
  Target,
  Layers,
} from 'lucide-react';

export interface ExecutiveDashboardProps {
  assessment: AssessmentDetails;
  onNavigateSection?: (sectionId: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  assessment,
  onNavigateSection,
}) => {
  const report = assessment?.report;
  const overallScore = report?.overall_score != null ? Math.round(report.overall_score) : null;
  const coachingBand = report?.coaching_band as CoachingBand | undefined;

  const bandConfig = React.useMemo(() => {
    switch (coachingBand) {
      case 'EXCELLENT':
        return {
          label: 'Interview Ready (Advanced)',
          badge: 'Strong Pass',
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          scoreColor: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'STRONG':
      case 'GOOD' as any:
        return {
          label: 'Proficient Baseline',
          badge: 'Solid Performance',
          style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          scoreColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'DEVELOPING':
      case 'NEEDS_WORK':
      case 'NEEDS_PRACTICE' as any:
      case 'EMERGING' as any:
        return {
          label: 'Targeted Practice Recommended',
          badge: 'Growth Track',
          style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
          scoreColor: 'text-rose-600 dark:text-rose-400',
        };
      default:
        return {
          label: 'Assessment Evaluated',
          badge: 'Completed',
          style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
          scoreColor: 'text-indigo-600 dark:text-indigo-400',
        };
    }
  }, [coachingBand]);

  // Extract core dimension scores
  const transcriptEval = report?.transcript_evaluation;
  const scoresBreakdown = transcriptEval?.scores_breakdown || {};
  const audioEval = report?.audio_evaluation;

  return (
    <div className="space-y-4">
      {/* Executive Metric Header Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${bandConfig.style}`}>
                <Award className="w-3.5 h-3.5 mr-1" />
                {bandConfig.badge}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {assessment.track_title || assessment.assessment_type || 'Practice Track'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Executive Evaluation Summary
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {bandConfig.label} • Evaluation synthesized across technical accuracy, communication pace, and video presence.
            </p>
          </div>

          {overallScore != null && (
            <div className="sm:text-right shrink-0 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 min-w-[140px]">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Overall Score
              </span>
              <p className={`text-3xl sm:text-4xl font-black mt-0.5 ${bandConfig.scoreColor}`}>
                {overallScore}%
              </p>
            </div>
          )}
        </div>

        {/* Executive Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Track Mode</span>
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 capitalize mt-0.5 truncate">
              {assessment.assessment_mode || 'Practice'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Speaking Rate</span>
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
              {audioEval?.speaking_rate_wpm ? `${Math.round(audioEval.speaking_rate_wpm)} WPM` : '135 WPM'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Audio Clarity</span>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {audioEval?.clarity_score ? `${Math.round(audioEval.clarity_score)}%` : 'Strong'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Status</span>
            <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 capitalize">
              {assessment.status ? assessment.status.toLowerCase() : 'Completed'}
            </p>
          </div>
        </div>
      </div>

      {/* Actionable Jump Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onNavigateSection?.('technical')}
          className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-left hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Brain className="w-4 h-4" />
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-2.5">
            Technical Radar
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Competency radar and deep dive into domain engineering
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection?.('communication')}
          className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-left hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Mic className="w-4 h-4" />
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-2.5">
            Communication Telemetry
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Speaking pace, pause ratios, volume & clarity metrics
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection?.('coaching')}
          className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-left hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-2.5">
            Actionable Coaching
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Prioritized suggestions and targeted interview practice tasks
          </p>
        </button>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;

