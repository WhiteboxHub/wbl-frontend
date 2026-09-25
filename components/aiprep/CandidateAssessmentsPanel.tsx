"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
} from "lucide-react";
import { AssessmentGridItem, AssessmentFiltersState } from "@/types/assessment";
import { assessmentService } from "@/services/assessmentService";
import { logger } from "@/lib/utils";
import { AssessmentGrid } from "./AssessmentGrid";
import { AssessmentFilters } from "./AssessmentFilters";

interface CandidateAssessmentsPanelProps {
  onStartAssessment?: () => void;
  onBack?: () => void;
  onDashboard?: () => void;
}

export const CandidateAssessmentsPanel: React.FC<CandidateAssessmentsPanelProps> = function({
  onStartAssessment,
  onBack,
  onDashboard,
}) {
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
        logger.error("Failed to load candidate assessments:", err);
        setError(err?.message || "Failed to load your assessments.");
      }
    } finally {
      if (isMountedRef.current && currentReqId === reqIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    currentPage,
    filters,
    isMountedRef,
    limit,
    reqIdRef,
    setAssessments,
    setError,
    setIsLoading,
    setTotalCount,
    setTotalPages,
  ]);

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
    if (typeof window !== "undefined") {
      sessionStorage.setItem("aiprep_return_url", "/user_dashboard/ai-prep/assessments");
    }
    router.push(`/aiprep/reports/${reportTarget}`);
  };

  const displayCount = totalCount !== undefined ? totalCount : assessments.length;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
      {/* Header Section */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            My Assessment List
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review your completed practice sessions, performance analytics, and AI evaluation reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onDashboard) {
                onDashboard();
              } else if (onBack) {
                onBack();
              } else {
                router.push("/user_dashboard/ai-prep");
              }
            }}
            className="group inline-flex h-9 items-center gap-2 px-3.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-gray-300 dark:hover:border-gray-700 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:-translate-x-1 transition-all" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <AssessmentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onRefresh={loadAssessments}
        isLoading={isLoading}
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
