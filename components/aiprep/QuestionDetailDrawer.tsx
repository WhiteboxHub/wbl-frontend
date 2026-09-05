"use client";

import React from "react";
import { Edit2, Layers, CheckCircle2, Archive, Trash2 } from "lucide-react";
import { QuestionBankItem } from "@/types/aiprep";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/admin_ui/dialog";

interface QuestionDetailDrawerProps {
  question: QuestionBankItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (q: QuestionBankItem) => void;
  onDelete?: (id: number) => Promise<void> | void;
}

const CATEGORY_LABELS: Record<string, string> = {
  INTRO: "Intro",
  JD_INTRO: "Job Description Intro",
  RECRUITER: "Recruiter Screening",
  HIRING_MANAGER: "Hiring Manager",
  SYSTEM_DESIGN: "System Design",
  TECHNICAL: "Technical",
};

const DIFFICULTY_BADGES: Record<string, string> = {
  EASY: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  HARD: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  EXPERT: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
};

export const QuestionDetailDrawer: React.FC<QuestionDetailDrawerProps> = ({
  question,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!question) return null;

  const isActive = Boolean(question.is_active);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="fixed left-[50%] top-[50%] z-50 flex max-h-[90vh] w-[95vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl duration-200 dark:border-gray-800 dark:bg-gray-900 sm:rounded-2xl"
        aria-label="Question details dialog"
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-blue-50/40 via-white to-indigo-50/30 px-6 py-4 text-left dark:border-gray-800 dark:from-blue-950/20 dark:via-gray-900 dark:to-indigo-950/20">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-lg font-bold tracking-tight text-blue-600 dark:text-blue-400">
              Question #{question.id} Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  DIFFICULTY_BADGES[question.difficulty_level] ||
                  "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {question.difficulty_level}
              </span>
            </div>
          </div>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            Comprehensive evaluation specifications and interview metadata.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-5">
          {/* Classification */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Taxonomy Classification
            </span>
            <div className="mt-1.5 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-sm font-bold text-[#2a5a6b] dark:text-teal-400">
                <Layers className="h-4 w-4" />
                {CATEGORY_LABELS[question.category] || question.category}
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                Sub-Category:{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {question.category === "TECHNICAL" ? (question.sub_category || "—") : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Question */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Question
            </span>
            <div className="mt-1.5 rounded-xl border border-gray-200 bg-white p-4 text-sm font-medium leading-relaxed text-gray-900 shadow-xs dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-100">
              {question.question_text}
            </div>
          </div>

          {/* Status & Timestamp */}
          <div className="space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Assessment Status:</span>
              <span className="flex items-center gap-1.5 font-semibold">
                {isActive ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Active in Question Bank
                    </span>
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Inactive</span>
                  </>
                )}
              </span>
            </div>
            {question.created_at && (
              <div className="flex items-center justify-between">
                <span>Created Date:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {new Date(question.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {question.updated_at && (
              <div className="flex items-center justify-between">
                <span>Last Updated:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {new Date(question.updated_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-3.5 dark:border-gray-800 dark:bg-gray-900/60">
          {onDelete && question && (
            <button
              type="button"
              onClick={async () => {
                onClose();
                await onDelete(question.id);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow-xs transition-all hover:bg-red-100 hover:text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
              title="Delete Question"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Delete</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onEdit(question)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2a5a6b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1e4a5a] focus:ring-2 focus:ring-[#2a5a6b]/30"
          >
            <Edit2 className="h-4 w-4" />
            Edit Question
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

