"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Brain,
} from "lucide-react";
import { AssessmentGridItem, AssessmentFiltersState } from "@/types/assessment";
import { assessmentService } from "@/services/assessmentService";
import { logger } from "@/lib/utils";
import { AssessmentGrid } from "./AssessmentGrid";
import { AssessmentFilters } from "./AssessmentFilters";

interface CandidateAssessmentsPanelProps {
  onStartAssessment?: () => void;
  onBack?: () => void;
}

export const CandidateAssessmentsPanel: React.FC<CandidateAssessmentsPanelProps> = ({
  onStartAssessment,
  onBack,
}) => {
  const router = useRouter();
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
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const limit = 50;
  const isMountedRef = React.useRef(true);
  const reqIdRef = React.useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadAssessments = useCallback(async () => {
    const currentReqId = ++reqIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await assessmentService.fetchCandidateAssessments(filters, currentPage, limit);
      if (isMountedRef.current && currentReqId === reqIdRef.current) {
        setAssessments(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
      }
    } catch (err: any) {
      if (isMountedRef.current && currentReqId === reqIdRef.current) {
        logger.error("Failed to load candidate assessments", err);
        setError(err?.message || "Failed to load your assessments.");
      }
    } finally {
      if (isMountedRef.current && currentReqId === reqIdRef.current) {
        setIsLoading(false);
      }
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
    const reportTarget = assessment.id || assessment.assessment_uuid;
    router.push(`/aiprep/reports/${reportTarget}`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs shrink-0">
            <Brain className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
              My Assessment List
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Review your completed practice sessions, performance analytics, and AI evaluation reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 items-center gap-2 px-3.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              title="Back to AI Prep"
            >
              <ArrowLeft className="w-4 h-4 shrink-0 text-gray-600 dark:text-gray-300" />
              <span>Back</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => loadAssessments()}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 px-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
            title="Refresh assessments"
          >
            <svg
              className={`w-4 h-4 shrink-0 ${isLoading ? "animate-spin text-purple-600" : "text-gray-600 dark:text-gray-300"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <AssessmentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isAdmin={false}
      />

      {/* Assessments Grid */}
      <AssessmentGrid
        assessments={assessments}
        isLoading={isLoading}
        error={error}
        onRetry={loadAssessments}
        onView={handleViewAssessment}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        isAdmin={false}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};
