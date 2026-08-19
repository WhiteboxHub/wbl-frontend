/**
 * QuestionDisplay Component
 * 
 * Target Workspace: wbl-frontend
 * Primary Developer: Narasimha (FE1)
 * 
 * Renders the active question with clean slide-in transitions using framer-motion.
 */

import React from 'react';
import { Question } from '@/lib/aiprep-api';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Star, Sparkles } from 'lucide-react';

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

  const difficultyColors = {
    EASY: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40',
    MEDIUM: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900/40',
    HARD: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40',
    EXPERT: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40',
  };

  return (
    <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm relative overflow-hidden text-slate-850 dark:text-slate-100">
      {/* Decorative Glow background */}
      <div className="absolute top-0 left-0 -z-10 h-24 w-24 rounded-full bg-[#4A6CF7]/5 blur-2xl" />

      {/* Meta indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#4A6CF7] uppercase tracking-widest bg-[#4A6CF7]/10 px-2.5 py-1 rounded-md border border-[#4A6CF7]/20">
            {category.replace('_', ' ')}
          </span>
          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${difficultyColors[difficulty_level] || difficultyColors.MEDIUM}`}>
            {difficulty_level}
          </span>
        </div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Question {currentIndex + 1} of {totalCount}</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="min-h-[140px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full text-center"
          >
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 leading-relaxed md:text-3xl px-4 select-none">
              "{question_text}"
            </h2>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-4 mt-6">
        <Sparkles className="w-3.5 h-3.5 text-[#4A6CF7] animate-pulse" />
        <span>Synthesize your thoughts and answer clearly. Your speech pace and filler words are analyzed.</span>
      </div>
    </div>
  );
};
export default QuestionDisplay;
