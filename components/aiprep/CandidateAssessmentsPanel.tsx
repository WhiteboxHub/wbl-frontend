"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  RefreshCw,
  ArrowLeft,
  Brain,
  PlusCircle,
  FileText,
  CheckCircle2,
  Sparkles,
  Clock,
} from "lucide-react";
import { AssessmentGridItem, AssessmentFiltersState } from "@/types/assessment";
import { assessmentService } from "@/services/assessmentService";
import { AssessmentGrid } from "./AssessmentGrid";
import { AssessmentFilters } from "./AssessmentFilters";
import { AssessmentDetailModal } from "./AssessmentDetailModal";

interface CandidateAssessmentsPanelProps {
  onStartAssessment?: () => void;
  onBack?: () => void;
}

export const CandidateAssessmentsPanel: React.FC<CandidateAssessmentsPanelProps> = ({
  onStartAssessment,
  onBack,
}) => {
  const [assessments, setAssessments] = useState<AssessmentGridItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<AssessmentFiltersState>({
    search: "",
    category: "all",
    media_type: "all",
    status: "all",
    date_operator: "equals",
    date_value: "",
    date_to: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentGridItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAssessments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await assessmentService.fetchCandidateAssessments(filters, currentPage, limit);
      setAssessments(res.items);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error("Failed to load candidate assessments:", err);
      setError(err?.message || "Failed to load your assessments.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, limit]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const handleFilterChange = (newFilters: Partial<AssessmentFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: "all",
      media_type: "all",
      status: "all",
      date_operator: "equals",
      date_value: "",
      date_to: "",
    });
    setCurrentPage(1);
  };

  const handleViewAssessment = (assessment: AssessmentGridItem) => {
    setSelectedAssessment(assessment);
    setIsModalOpen(true);
  };

  const stats = useMemo(() => {
    let completed = 0;
    let evaluating = 0;
    let inProgress = 0;

    assessments.forEach((a) => {
      const s = (a.status || "").toUpperCase();
      if (s === "COMPLETED") completed++;
      else if (s === "EVALUATING") evaluating++;
      else if (s === "IN_PROGRESS" || s === "PROCESSING" || s === "TESTING") inProgress++;
    });

    return {
      total: assessments.length,
      completed,
      evaluating,
      inProgress,
    };
  }, [assessments]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs shrink-0">
            <Brain className="h-4.5 w-4.5" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              My Assessments
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Review your completed practice sessions, performance analytics, and AI evaluation reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs transition-all cursor-pointer"
              title="Back to AI Prep"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => loadAssessments()}
            disabled={isLoading}
            className="inline-flex h-8 w-8 items-center justify-center text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs transition-all cursor-pointer"
            title="Refresh Assessments"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
          </button>

          {onStartAssessment && (
            <button
              type="button"
              onClick={onStartAssessment}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Start Practice Assessment</span>
            </button>
          )}
        </div>
      </div>

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Total Sessions */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
              Total Sessions
            </span>
            <span className="p-0.5 text-purple-600 dark:text-purple-400">
              <FileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.total}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              Completed
            </span>
            <span className="p-0.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.completed}
          </p>
        </div>

        {/* Evaluating */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
              Evaluating
            </span>
            <span className="p-0.5 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.evaluating}
          </p>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
              In Progress
            </span>
            <span className="p-0.5 text-blue-600 dark:text-blue-400">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.inProgress}
          </p>
        </div>
      </div>

      {/* Filters */}
      <AssessmentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isAdmin={false}
      />

      {/* Grid */}
      <AssessmentGrid
        assessments={assessments}
        isLoading={isLoading}
        error={error}
        onRetry={loadAssessments}
        onView={handleViewAssessment}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        isAdmin={false}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Detail Modal */}
      <AssessmentDetailModal
        isOpen={isModalOpen}
        assessment={selectedAssessment}
        onClose={() => setIsModalOpen(false)}
        isAdmin={false}
      />
    </div>
  );
};
