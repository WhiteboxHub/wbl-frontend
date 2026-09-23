"use client";

import React from "react";
import { Search, User, RotateCcw } from "lucide-react";
import { AssessmentFiltersState } from "@/types/assessment";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";

interface AssessmentFiltersProps {
  filters: AssessmentFiltersState;
  onFilterChange: (filters: Partial<AssessmentFiltersState>) => void;
  onReset: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  isAdmin?: boolean;
}

export const AssessmentFilters: React.FC<AssessmentFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  onRefresh,
  isLoading = false,
  isAdmin = true,
}) => {
  const isFiltered =
    Boolean(filters.search?.trim()) ||
    Boolean(filters.candidate_id?.trim()) ||
    (filters.category && filters.category !== "all") ||
    (filters.media_type && filters.media_type !== "all") ||
    (filters.status && filters.status !== "all") ||
    Boolean(filters.date_value);

  const handleAction = () => {
    onReset();
    onRefresh?.();
  };

  return (
    <div className="flex flex-wrap items-end gap-3 max-w-2xl">
      {/* Search Assessments */}
      <div className="flex-1 min-w-[200px]">
        <Label
          htmlFor="assessment-search-input"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search Assessments
        </Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            id="assessment-search-input"
            type="text"
            placeholder="Search by ID..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

      {/* Candidate Filter */}
      {isAdmin && (
        <div className="flex-1 min-w-[200px]">
          <Label
            htmlFor="candidate-search-input"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Candidate Filter
          </Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              id="candidate-search-input"
              type="text"
              placeholder="Candidate ID, Name or Email"
              value={filters.candidate_id || ""}
              onChange={(e) => onFilterChange({ candidate_id: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Refresh Button (styled matching Image 1) */}
      {(isFiltered || onRefresh) && (
        <button
          type="button"
          onClick={handleAction}
          disabled={isLoading}
          className="inline-flex h-10 items-center gap-1.5 shrink-0 px-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
          title="Refresh assessments"
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-600" : ""}`}
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
      )}
    </div>
  );
};

