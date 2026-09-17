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
  isAdmin?: boolean;
}

export const AssessmentFilters: React.FC<AssessmentFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  isAdmin = true,
}) => {
  const isFiltered =
    Boolean(filters.search?.trim()) ||
    Boolean(filters.candidate_id?.trim()) ||
    (filters.category && filters.category !== "all") ||
    (filters.media_type && filters.media_type !== "all") ||
    (filters.status && filters.status !== "all") ||
    Boolean(filters.date_value);

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
            placeholder="Search..."
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

      {/* Reset Button */}
      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center gap-1.5 shrink-0 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="h-4 w-4 text-gray-400" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};

