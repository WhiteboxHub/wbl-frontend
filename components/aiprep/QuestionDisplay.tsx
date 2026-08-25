/**
 * QuestionDisplay Component — 2026 Next-Gen Broadcast Teleprompter
 * 
 * Target Workspace: wbl-frontend
 * Primary Developer: Narasimha (FE1)
 * 
 * Ultra-Modern Design:
 * - Frosted ambient glass with gradient border glow
 * - High-end typography (Inter font-semibold with soft tracking)
 * - Modern glowing badges & category chip
 */

'use client';

import React from 'react';
import { Question } from '@/lib/aiprep-api';
import { IconSparkles, IconHelpCircle } from '@tabler/icons-react';

interface QuestionDisplayProps {
  question: Question;
  currentIndex: number;
  totalCount: number;
  category: string;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  currentIndex,
  totalCount,
  category,
}) => {
  const { question_text, difficulty_level } = question;

  const difficultyBadges = {
    EASY: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    HARD: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    EXPERT: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  };

  return (
    <div className="relative w-full rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-blue-500/30 shadow-lg shadow-indigo-500/5 transition-all">
      <div className="w-full bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl rounded-2xl px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Badges + Question Prompt */}
        <div className="flex items-start md:items-center gap-3.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 rounded-xl shadow-sm shadow-indigo-500/20">
              <IconHelpCircle size={14} stroke={2.2} />
              Q{currentIndex + 1}/{totalCount}
            </span>
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border backdrop-blur-md ${difficultyBadges[difficulty_level] || difficultyBadges.MEDIUM}`}>
              {difficulty_level}
            </span>
          </div>

          <p className="text-sm md:text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-relaxed select-text flex-1">
            "{question_text}"
          </p>
        </div>

        {/* Right: Category Chip */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15 px-3.5 py-1.5 rounded-xl border border-indigo-500/20 backdrop-blur-md">
          <IconSparkles size={15} stroke={2} className="text-indigo-500 animate-pulse" />
          <span className="capitalize">{category.replace(/_/g, ' ').toLowerCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;
