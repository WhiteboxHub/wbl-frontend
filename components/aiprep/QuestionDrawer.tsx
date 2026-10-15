"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { QuestionBankItem } from "@/types/aiprep";
import { QuestionForm, QuestionFormData } from "./QuestionForm";

interface QuestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: QuestionFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void> | void;
  initialData?: QuestionBankItem | null;
}

export const QuestionDrawer: React.FC<QuestionDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const isEditMode = Boolean(initialData);

  // Keep the page behind the editor stationary while scrolling the modal.
  // Restore prior styles on close/unmount rather than resetting other layout state.
  useEffect(() => {
    if (!isOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (data: QuestionFormData) => {
    await onSave(data);
    onClose();
  };

  const handleDelete = async (id: number) => {
    if (onDelete) {
      await onDelete(id);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4 overflow-hidden overscroll-contain animate-in fade-in duration-200">
      {/* Backdrop: intentionally non-dismissable so horizontal scrolling or
          clicks outside the form cannot accidentally close an in-progress edit. */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
      />

      {/* Centered Modal Card (Matching Candidate Marketing reference) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className="pointer-events-auto relative z-10 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden overscroll-contain border border-blue-200 dark:border-blue-900 dark:bg-gray-900 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header (Matching Candidate Marketing reference) */}
        <div className="sticky top-0 shrink-0 flex items-center justify-between border-b border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-darklight dark:via-dark dark:to-darklight px-4 py-3 sm:px-6 z-10">
          <h2
            id="modal-title"
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-sm sm:text-base md:text-lg font-bold text-transparent"
          >
            {isEditMode
              ? `Question Bank (${initialData?.id || ""}) - Edit Details`
              : "Question Bank - Add New Question"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-slate-800 cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X size={18} className="sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Modal Body with Form */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
          <QuestionForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
            onDelete={onDelete ? handleDelete : undefined}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
