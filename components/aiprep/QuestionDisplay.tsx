"use client";

import React from "react";
import { QuestionBankItem } from "@/types/aiprep";
import { Layers, Zap, Tag } from "lucide-react";

interface QuestionDisplayProps {
  question: QuestionBankItem;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question }) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff?.toUpperCase()) {
      case "EASY":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
      case "HARD":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition-all dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
          <Layers className="h-3 w-3" />
          {question.category}
        </span>

        {question.sub_category && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-400">
            <Tag className="h-3 w-3" />
            {question.sub_category}
          </span>
        )}

        <span
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold ${getDifficultyBadge(
            question.difficulty_level
          )}`}
        >
          <Zap className="h-3 w-3" />
          {question.difficulty_level}
        </span>

        <span
          className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
            question.is_active
              ? "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {question.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="text-sm font-medium leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
        {question.question_text}
      </p>
    </div>
  );
};
