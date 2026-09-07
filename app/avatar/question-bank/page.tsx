"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { QuestionBankItem, QuestionFiltersState } from "@/types/aiprep";
import {
  fetchQuestionBank,
  createQuestion,
  updateQuestion,
  toggleQuestionStatus,
  deleteQuestion,
} from "@/utils/aiprepQuestionApi";
import { QuestionFilters } from "@/components/aiprep/QuestionFilters";
import { QuestionBankTable } from "@/components/aiprep/QuestionBankTable";
import { QuestionDrawer } from "@/components/aiprep/QuestionDrawer";
import { QuestionDetailDrawer } from "@/components/aiprep/QuestionDetailDrawer";
import type { QuestionFormData } from "@/components/aiprep/QuestionForm";

export default function QuestionBankPage() {
  // Data state
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<QuestionFiltersState>({
    search: "",
    category: "all",
    sub_category: "all",
    difficulty: "all",
    status: "all",
  });

  // Drawer state (Add / Edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);

  // Detail drawer state (View)
  const [viewingQuestion, setViewingQuestion] = useState<QuestionBankItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchQuestionBank(filters, currentPage, 10);
      setQuestions(res.items);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error("Failed to load questions:", err);
      setError(err?.message || "Failed to load questions from question bank.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // ---------------------------------------------------------------------------
  // Filter handlers
  // ---------------------------------------------------------------------------
  const handleFilterChange = (newFilters: Partial<QuestionFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: "all",
      sub_category: "all",
      difficulty: "all",
      status: "all",
    });
    setCurrentPage(1);
  };

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const handleSaveQuestion = async (data: QuestionFormData) => {
    try {
      if (data.id) {
        await updateQuestion(data.id, data);
        showToast("Question updated successfully.");
      } else {
        await createQuestion(data as Omit<QuestionBankItem, "id" | "created_at">);
        showToast("Question created successfully.");
      }
      await loadQuestions();
    } catch (err: any) {
      throw new Error(err.message || "Failed to save question.");
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleQuestionStatus(id, !currentStatus);
      showToast(
        `Question ${!currentStatus ? "activated" : "deactivated"} successfully.`
      );
      await loadQuestions();
    } catch {
      showToast("Failed to update question status.", "error");
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm(`Are you sure you want to permanently delete question #${id}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteQuestion(id);
      showToast(`Question #${id} deleted successfully.`);
      await loadQuestions();
    } catch (err: any) {
      showToast(err.message || "Failed to delete question.", "error");
    }
  };

  // ---------------------------------------------------------------------------
  // Drawer handlers
  // ---------------------------------------------------------------------------
  const openAddDrawer = () => {
    setEditingQuestion(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (q: QuestionBankItem) => {
    setEditingQuestion(q);
    setIsDrawerOpen(true);
  };

  const openDetailDrawer = (q: QuestionBankItem) => {
    setViewingQuestion(q);
    setIsDetailOpen(true);
  };

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-xl backdrop-blur-md transition-all ${
            toast.type === "success"
              ? "border border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-200"
              : "border border-red-200 bg-red-50/95 text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <span className="text-sm font-semibold">{toast.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            AI Prep Question Bank
          </h1>
        </div>
      </div>

      {/* Filters Bar */}
      <QuestionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Error state */}
      {error && !isLoading && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-12 text-center shadow-xs dark:border-red-900/50 dark:bg-red-950/20">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <h3 className="mt-3 text-sm font-bold text-red-800 dark:text-red-300">
            {error}
          </h3>
          <button
            type="button"
            onClick={loadQuestions}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-xs hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-gray-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="mt-6">
          <QuestionBankTable
            questions={questions}
            isLoading={isLoading}
            onEdit={openEditDrawer}
            onView={openDetailDrawer}
            onDelete={(q) => handleDeleteQuestion(q.id)}
            onAddClick={openAddDrawer}
            onToggleStatus={handleToggleStatus}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      )}

      {/* Add / Edit Drawer */}
      <QuestionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveQuestion}
        onDelete={handleDeleteQuestion}
        initialData={editingQuestion}
      />

      {/* Detail Drawer */}
      <QuestionDetailDrawer
        question={viewingQuestion}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onDelete={handleDeleteQuestion}
        onEdit={(q) => {
          setIsDetailOpen(false);
          openEditDrawer(q);
        }}
      />
    </div>
  );
}
