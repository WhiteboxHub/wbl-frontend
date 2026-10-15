"use client";

import React from "react";
import { Search, RotateCcw, X } from "lucide-react";
import { QuestionFiltersState } from "@/types/aiprep";

interface QuestionFiltersProps {
  filters: QuestionFiltersState;
  onFilterChange: (filters: Partial<QuestionFiltersState>) => void;
  onReset: () => void;
  totalResults: number;
  onAddQuestion?: () => void;
}

export const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const isFiltered =
    Boolean(filters.search?.trim()) ||
    (Boolean(filters.subject) && filters.subject !== "all") ||
    (Boolean(filters.concept) && filters.concept !== "all") ||
    (Boolean(filters.category) && filters.category !== "all") ||
    (Boolean(filters.difficulty) && filters.difficulty !== "all") ||
    (Boolean(filters.scope) && filters.scope !== "all") ||
    (Boolean(filters.status) && filters.status !== "all");

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-gray-200/90 bg-white p-3 shadow-xs dark:border-gray-800 dark:bg-gray-900/90">
      {/* Search Bar Row */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="question-search-input"
            type="text"
            placeholder="Search questions..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="h-10 w-full rounded-xl border border-gray-300 bg-gray-50/60 pl-10 pr-9 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#2a5a6b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2a5a6b]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-teal-400"
            aria-label="Search questions"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-gray-300 bg-gray-50 px-3.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer shrink-0"
            title="Reset all filters"
            aria-label="Reset all filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips Bar (shows if any search or column dropdown filter is active) */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <span className="font-semibold text-gray-600 dark:text-gray-300">Active Filters:</span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Search: &quot;{filters.search}&quot;
              <button
                type="button"
                onClick={() => onFilterChange({ search: "" })}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.subject && filters.subject !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
              Subject: {filters.subject}
              <button
                type="button"
                onClick={() => onFilterChange({ subject: "all" })}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.concept && filters.concept !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
              Concept: {filters.concept}
              <button
                type="button"
                onClick={() => onFilterChange({ concept: "all" })}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.category && filters.category !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Category: {filters.category}
              <button
                type="button"
                onClick={() => onFilterChange({ category: "all" })}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.difficulty && filters.difficulty !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Difficulty: {filters.difficulty}
              <button
                type="button"
                onClick={() => onFilterChange({ difficulty: "all" })}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.scope && filters.scope !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Scope: {filters.scope}
              <button
                type="button"
                onClick={() => onFilterChange({ scope: "all" })}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.status && filters.status !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              Status: {filters.status === "active" ? "Active" : "Inactive"}
              <button
                type="button"
                onClick={() => onFilterChange({ status: "all" })}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
