'use client';

/**
 * CoachingSuggestions Component
 * Specification: [Vishnu] Phase 6: AI Coaching Feedback
 * 
 * Renders prioritized AI coaching recommendations, interactive completion
 * checkboxes, rationale explanations, and actionable practice drills.
 */

import React, { useState, useMemo } from 'react';
import { AssessmentDetails, CoachingSuggestionItem } from '@/types/aiprep';
import { CheckCircle2, Lightbulb, Target, Sparkles } from 'lucide-react';

export interface ExtendedCoachingItem extends CoachingSuggestionItem {
  topic?: string;
  why_it_matters?: string;
  action?: string;
  practice?: string;
}

export interface CoachingSuggestionsProps {
  assessment: AssessmentDetails;
  coachingItems?: ExtendedCoachingItem[];
}

export const CoachingSuggestions: React.FC<CoachingSuggestionsProps> = ({
  assessment,
  coachingItems: propCoachingItems,
}) => {
  const report = assessment?.report;
  const transcriptEval = report?.transcript_evaluation;
  const techAnalysis = transcriptEval?.technical_analysis;
  const improvements = techAnalysis?.areas_for_improvement || [];
  const coachingRaw = transcriptEval?.coaching_suggestions || [];

  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});

  const coachingList: ExtendedCoachingItem[] = useMemo(() => {
    if (propCoachingItems && propCoachingItems.length > 0) {
      return propCoachingItems;
    }

    const raw: ExtendedCoachingItem[] =
      coachingRaw.length > 0
        ? coachingRaw
        : improvements.map((imp, idx) => ({
            priority: idx + 1,
            topic: 'Technical Walkthrough',
            dimension: 'Core Engineering',
            area: 'Trade-off Analysis',
            suggestion: imp,
            why_it_matters: 'Discussing concrete trade-offs demonstrates depth of experience to interviewers.',
            action: imp,
            practice: 'Practice articulating this topic out loud before your next interview session.',
          }));

    return raw.filter((item) => {
      const combined = `${item.dimension || ''} ${item.area || ''} ${item.topic || ''} ${item.suggestion || ''}`.toLowerCase();
      return !combined.includes('business acumen') && !combined.includes('business understanding') && !combined.includes('biz acumen');
    });
  }, [propCoachingItems, coachingRaw, improvements]);

  const toggleComplete = (idx: number) => {
    setCompletedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Targeted Coaching Suggestions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Actionable recommendations to incorporate before your next interview
          </p>
        </div>

        {coachingList.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 italic">
            No coaching suggestions recorded for this session.
          </div>
        ) : (
          <div className="space-y-3">
            {coachingList.map((item, idx) => {
              const isCompleted = completedItems[idx];

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10 opacity-80'
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {item.priority || idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.topic || item.area || 'Interview Focus Area'}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {item.suggestion}
                        </p>
                        {item.why_it_matters && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                            Why it matters: {item.why_it_matters}
                          </p>
                        )}
                        {item.practice && (
                          <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>Actionable Drill: {item.practice}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleComplete(idx)}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                      className={`shrink-0 p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
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

export default CoachingSuggestions;
