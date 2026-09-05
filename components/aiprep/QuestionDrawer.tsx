"use client";

import React from "react";
import { X } from "lucide-react";
import { QuestionBankItem } from "@/types/aiprep";
import { QuestionForm, QuestionFormData } from "./QuestionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/admin_ui/dialog";

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="fixed left-[50%] top-[50%] z-50 flex max-h-[90vh] w-[95vw] max-w-3xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl duration-200 dark:border-gray-800 dark:bg-gray-900 sm:rounded-2xl"
        aria-label={isEditMode ? "Edit question dialog" : "Add question dialog"}
      >
        {/* Header with blue/purple title like the reference */}
        <DialogHeader className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-blue-50/40 via-white to-indigo-50/30 px-6 py-4 text-left dark:border-gray-800 dark:from-blue-950/20 dark:via-gray-900 dark:to-indigo-950/20">
          <DialogTitle className="text-lg font-bold tracking-tight text-blue-600 dark:text-blue-400">
            {isEditMode
              ? `Edit Question #${initialData?.id || ""}`
              : "Add New Question"}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {isEditMode
              ? "Update question details, category classification, difficulty level, and active status."
              : "Create a standardized question with difficulty rating and category classification."}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Form Body */}
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <QuestionForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
            onDelete={onDelete ? handleDelete : undefined}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
