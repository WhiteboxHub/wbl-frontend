'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, Sparkles } from 'lucide-react';
import type { QuestionBankItem } from '@/types/aiprep';

export interface QuestionDisplayProps {
  questions: QuestionBankItem[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  isLoading?: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questions,
  currentIndex,
  onNavigate,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl animate-pulse min-h-[220px] flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm font-medium">Loading session questions...</p>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl min-h-[220px] flex flex-col justify-center items-center text-center">
        <HelpCircle className="w-10 h-10 text-slate-500 mb-3" />
        <h3 className="text-base font-semibold text-slate-300 mb-1">General Freeform Interview</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Please introduce yourself, state your background, and walk through your experience.
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex] || questions[0];
  const total = questions.length;
  const progressPct = Math.round(((currentIndex + 1) / total) * 100);

  // Difficulty badge colors
  const getDifficultyBadge = (diff?: string | null) => {
    const d = (diff || 'MEDIUM').toUpperCase();
    switch (d) {
      case 'EASY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'HARD':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'EXPERT':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'MEDIUM':
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between relative overflow-hidden">
      {/* Top Header: Category, Progress & Difficulty */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              {currentQuestion.category || 'Interview Track'}
            </span>

            {currentQuestion.sub_category && (
              <span className="text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                {currentQuestion.sub_category}
              </span>
            )}

            {currentQuestion.difficulty_level && (
              <span
                className={`text-xs font-medium border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getDifficultyBadge(
                  currentQuestion.difficulty_level
                )}`}
              >
                {currentQuestion.difficulty_level}
              </span>
            )}
          </div>

          {/* Question Index Badge */}
          <div className="text-xs font-bold font-mono text-slate-400 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/60">
            Question {currentIndex + 1} of {total}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-5">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Question Text */}
        <div className="min-h-[90px] flex items-center">
          <h2 className="text-lg md:text-xl font-semibold text-white leading-relaxed">
            {currentQuestion.question_text}
          </h2>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Question</span>
        </button>

        <div className="flex space-x-1">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-6 bg-indigo-500'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Go to Question ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNavigate(Math.min(total - 1, currentIndex + 1))}
          disabled={currentIndex === total - 1}
          className="flex items-center space-x-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:hover:text-indigo-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Next Question</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default QuestionDisplay;
