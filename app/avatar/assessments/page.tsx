"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { AssessmentGridItem, AssessmentFiltersState } from "@/types/assessment";
import { assessmentService } from "@/services/assessmentService";
import { AssessmentFilters } from "@/components/aiprep/AssessmentFilters";
import { AssessmentGrid } from "@/components/aiprep/AssessmentGrid";
import { AssessmentDetailModal } from "@/components/aiprep/AssessmentDetailModal";

const getCanonicalAssessmentType = (raw?: string): string => {
  const t = (raw || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (t === "INTRO" || t === "GENERAL_INTRO") return "INTRO";
  if (t === "JD_INTRO" || t === "JOB_DESCRIPTION_INTRO" || t === "JD" || t === "JDINTRO") return "JD_INTRO";
  if (t === "RECRUITER" || t === "RECRUITER_SCREEN" || t === "RECRUITER_SCREENING") return "RECRUITER";
  if (t === "HIRING_MANAGER" || t === "HIRINGMANAGER" || t === "HM") return "HIRING_MANAGER";
  if (t === "SYSTEM_DESIGN" || t === "SYSTEMDESIGN") return "SYSTEM_DESIGN";
  if (t === "TECHNICAL" || t === "TECH") return "TECHNICAL";
  return t;
};

const getCanonicalMode = (raw?: string | number): string => {
  const m = String(raw || "").toUpperCase().replace(/[\s\+\-_]+/g, "_");
  if (m === "1" || m === "AUDIO" || m === "AUDIO_ONLY") return "AUDIO";
  return "VIDEO_AUDIO";
};

const getCanonicalStatus = (raw?: string): string => {
  const s = (raw || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (s === "IN_PROGRESS" || s === "PROCESSING" || s === "TESTING") return "IN_PROGRESS";
  if (s === "EVALUATING") return "EVALUATING";
  if (s === "COMPLETED") return "COMPLETED";
  if (s === "FAILED") return "FAILED";
  return s;
};

export default function CandidateAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentGridItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<AssessmentFiltersState>({
    search: "",
    candidate_id: "",
    candidate_search: "",
    category: "all",
    media_type: "all",
    status: "all",
    date_operator: "equals",
    date_value: "",
    date_to: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 50;

  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentGridItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAssessments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await assessmentService.fetchEmployeeAssessments(
        filters,
        currentPage,
        limit
      );
      setAssessments(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
    } catch (err: any) {
      console.error("Failed to load assessments:", err);
      const msg =
        typeof err?.message === "string"
          ? err.message
          : err?.detail
          ? JSON.stringify(err.detail)
          : "Failed to load candidate assessments.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [
    filters,
    currentPage,
    limit,
    setIsLoading,
    setError,
    setAssessments,
    setTotalPages,
    setTotalCount,      
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
      candidate_id: "",
      candidate_search: "",
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

  const displayedAssessments = useMemo(() => {
    let list = assessments;

    if (filters.search?.trim()) {
      const term = filters.search.toLowerCase().trim();
      list = list.filter((a) => {
        const matchId = `as-${a.id}`.toLowerCase().includes(term) || String(a.id).includes(term);
        const matchCandId = String(a.candidate_id || "").includes(term) || `cand-${a.candidate_id}`.toLowerCase().includes(term);
        const matchCandName = Boolean(a.candidate_name && a.candidate_name.toLowerCase().includes(term));
        const matchCandEmail = Boolean(a.candidate_email && a.candidate_email.toLowerCase().includes(term));
        return matchId || matchCandId || matchCandName || matchCandEmail;
      });
    }

    if (filters.candidate_id?.trim()) {
      const candTerm = filters.candidate_id.toLowerCase().trim();
      list = list.filter((a) => {
        return (
          String(a.candidate_id || "").toLowerCase().includes(candTerm) ||
          `cand-${a.candidate_id}`.toLowerCase().includes(candTerm) ||
          `candidate #${a.candidate_id}`.toLowerCase().includes(candTerm) ||
          Boolean(a.candidate_name && a.candidate_name.toLowerCase().includes(candTerm)) ||
          Boolean(a.candidate_email && a.candidate_email.toLowerCase().includes(candTerm))
        );
      });
    }

    if (filters.category && filters.category !== "all") {
      const targetCanonical = getCanonicalAssessmentType(filters.category);
      list = list.filter(
        (a) => getCanonicalAssessmentType(a.assessment_type) === targetCanonical
      );
    }

    if (filters.media_type && filters.media_type !== "all") {
      const targetMode = getCanonicalMode(filters.media_type);
      list = list.filter(
        (a) => getCanonicalMode(a.media_type || (a as any).media_mode) === targetMode
      );
    }

    if (filters.status && filters.status !== "all") {
      const targetStatus = getCanonicalStatus(filters.status);
      list = list.filter((a) => getCanonicalStatus(a.status) === targetStatus);
    }

    if (filters.date_value) {
      const parseItemDateKey = (dateStr?: string | null): string => {
        if (!dateStr) return "";
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        } catch {
          return "";
        }
      };

      const op = filters.date_operator || "equals";
      list = list.filter((a) => {
        const itemKey = parseItemDateKey(a.created_at || a.started_at);
        if (!itemKey) return false;
        if (op === "equals") return itemKey === filters.date_value;
        if (op === "not_equals") return itemKey !== filters.date_value;
        if (op === "less_than") return itemKey < filters.date_value!;
        if (op === "greater_than") return itemKey > filters.date_value!;
        if (op === "in_range") {
          return itemKey >= filters.date_value! && (!filters.date_to || itemKey <= filters.date_to);
        }
        return true;
      });
    }

    return list;
  }, [
    assessments,
    filters.search,
    filters.candidate_id,
    filters.category,
    filters.media_type,
    filters.status,
    filters.date_operator,
    filters.date_value,
    filters.date_to,
  ]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Candidate Assessments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Candidates currently in assessment phase
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <AssessmentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isAdmin={true}
      />

      {/* Grid Table */}
      <AssessmentGrid
        assessments={displayedAssessments}
        isLoading={isLoading}
        error={error}
        onRetry={loadAssessments}
        onView={handleViewAssessment}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        filters={filters}
        onFilterChange={handleFilterChange}
        isAdmin={true}
      />

      {/* Detail Modal */}
      <AssessmentDetailModal
        isOpen={isModalOpen}
        assessment={selectedAssessment}
        onClose={() => setIsModalOpen(false)}
        isAdmin={true}
      />
    </div>
  );
}
