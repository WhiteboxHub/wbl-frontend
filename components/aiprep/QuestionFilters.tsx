"use client";

import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { QuestionFiltersState } from "@/types/aiprep";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";

interface QuestionFiltersProps {
  filters: QuestionFiltersState;
  onFilterChange: (filters: Partial<QuestionFiltersState>) => void;
  onReset: () => void;
}

export const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const isFiltered =
    filters.search.trim() !== "" ||
    filters.category !== "all" ||
    filters.difficulty !== "all" ||
    filters.status !== "all";

  return (
    <div className="max-w-md">
      <Label
        htmlFor="question-search-input"
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Search Questions
      </Label>
      <div className="relative mt-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            id="question-search-input"
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10"
            aria-label="Search questions"
          />
        </div>
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-1.5 shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
            title="Reset all filters"
            aria-label="Reset filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};


