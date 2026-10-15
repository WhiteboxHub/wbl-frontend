"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SearchIcon, CheckCircle, XCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { QuestionBankItem, QuestionFiltersState } from "@/types/aiprep";
import {
  fetchQuestionBank,
  createQuestion,
  updateQuestion,
  toggleQuestionStatus,
  deleteQuestion,
} from "@/utils/aiprepQuestionApi";
import { QuestionBankTable } from "@/components/aiprep/QuestionBankTable";
import { QuestionDrawer } from "@/components/aiprep/QuestionDrawer";
import { QuestionDetailDrawer } from "@/components/aiprep/QuestionDetailDrawer";
import type { QuestionFormData } from "@/components/aiprep/QuestionForm";
import { ALL_CONCEPTS_LIST } from "@/lib/questionBankTaxonomy";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Toaster, toast } from "sonner";
import "@/styles/admin.css";
import "@/styles/App.css";

export default function QuestionBankPage() {
  // Data state
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<QuestionFiltersState>({
    search: "",
    subject: "all",
    concept: "all",
    category: "all",
    difficulty: "all",
    scope: "all",
    status: "all",
  });

  // Drawer state (Add / Edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);

  // Detail drawer state (View)
  const [viewingQuestion, setViewingQuestion] = useState<QuestionBankItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchQuestionBank(filters, currentPage, pageSize);
      setQuestions(res.items);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error("Failed to load questions:", err);
      setError(err?.message || "Failed to load questions from question bank.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // ---------------------------------------------------------------------------
  // Filter handlers
  // ---------------------------------------------------------------------------
  const handleFilterChange = (newFilters: Partial<QuestionFiltersState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...newFilters };
      if (
        newFilters.subject !== undefined &&
        newFilters.subject !== "all" &&
        next.concept !== "all"
      ) {
        const belongs = ALL_CONCEPTS_LIST.some(
          (c) => c.subject === newFilters.subject && c.name === next.concept
        );
        if (!belongs) {
          next.concept = "all";
        }
      }
      return next;
    });
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      subject: "all",
      concept: "all",
      category: "all",
      difficulty: "all",
      scope: "all",
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
        toast.success("Question updated successfully.");
      } else {
        await createQuestion(data as Omit<QuestionBankItem, "id" | "created_at">);
        toast.success("Question created successfully.");
      }
      await loadQuestions();
    } catch (err: any) {
      throw new Error(err.message || "Failed to save question.");
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleQuestionStatus(id, !currentStatus);
      toast.success(
        `Question ${!currentStatus ? "activated" : "deactivated"} successfully.`
      );
      await loadQuestions();
    } catch {
      toast.error("Failed to update question status.");
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm(`Deactivate question #${id}? It will be marked inactive and retained in the database for assessment history.`)) {
      return;
    }
    try {
      await deleteQuestion(id);
      toast.success(`Question #${id} deactivated successfully.`);
      await loadQuestions();
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate question. No change was confirmed by the backend.");
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
    <div className="space-y-6">
      <Toaster richColors position="top-center" />

      {/* Header Section */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            AI Prep Question Bank
          </h1>
        </div>
      </div>

      {/* Search Questions */}
      <div className="max-w-md">
        <Label
          htmlFor="question-search-input"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search Questions
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            id="question-search-input"
            type="text"
            placeholder="Search..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

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
        <div className="w-full">
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
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            title="AI Prep Question Bank"
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
