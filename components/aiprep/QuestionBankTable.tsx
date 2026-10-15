"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Settings,
  Trash2,
  Download,
  Plus,
  HelpCircle,
} from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  ColDef,
  GridReadyEvent,
  GridSizeChangedEvent,
  RowClickedEvent,
  RowDoubleClickedEvent,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { QuestionBankItem, QuestionFiltersState } from "@/types/aiprep";
import { Badge } from "@/components/admin_ui/badge";
import { createPortal } from "react-dom";
import {
  SUBJECT_CONCEPTS_MAP,
  ALL_CONCEPTS_LIST,
  SUBJECT_OPTIONS,
  DIFFICULTY_OPTIONS,
  SCOPE_OPTIONS,
  CONCEPT_OPTIONS,
  formatDuration,
  getSubjectStyle,
  getScopeStyle,
  type QuestionSubject,
} from "@/lib/questionBankTaxonomy";

ModuleRegistry.registerModules([AllCommunityModule]);

interface QuestionBankTableProps {
  questions: QuestionBankItem[];
  isLoading: boolean;
  onEdit: (question: QuestionBankItem) => void;
  onView: (question: QuestionBankItem) => void;
  onDelete?: (question: QuestionBankItem) => void;
  onAddClick?: () => void;
  onToggleStatus?: (id: number, currentStatus: boolean) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  title?: string;
  filters?: QuestionFiltersState;
  onFilterChange?: (filters: Partial<QuestionFiltersState>) => void;
  height?: string;
}

const EditSquareIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);

// Clean compact rectangular badge styles
const CATEGORY_STYLES: Record<string, string> = {
  INTRO:
    "bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800",
  JD_INTRO:
    "bg-cyan-50 text-cyan-700 border-cyan-200/80 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
  RECRUITER:
    "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  HIRING_MANAGER:
    "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
  SYSTEM_DESIGN:
    "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  TECHNICAL:
    "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  INTRO: "Intro",
  JD_INTRO: "JD Intro",
  RECRUITER: "Recruiter Screen",
  HIRING_MANAGER: "Hiring Manager",
  SYSTEM_DESIGN: "System Design",
  TECHNICAL: "Technical",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  HARD: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  EXPERT: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

const ColumnVisibilityModal = ({
  isOpen,
  onClose,
  allColumns,
  hiddenColumns,
  onToggleColumn,
}: {
  isOpen: boolean;
  onClose: () => void;
  allColumns: { field: string; label: string }[];
  hiddenColumns: Set<string>;
  onToggleColumn: (field: string) => void;
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Toggle Columns
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-base"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {allColumns.map((col) => {
            const isVisible = !hiddenColumns.has(col.field);
            return (
              <label
                key={col.field}
                className="flex items-center gap-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => onToggleColumn(col.field)}
                  className="rounded text-[#2a5a6b] focus:ring-[#2a5a6b]"
                />
                <span>{col.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "INTRO", label: "Intro Warm-up" },
  { value: "JD_INTRO", label: "JD Intro" },
  { value: "RECRUITER", label: "Recruiter Screen" },
  { value: "HIRING_MANAGER", label: "Hiring Manager" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "TECHNICAL", label: "Technical" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
];

interface ColumnFilterOption {
  value: string;
  label: string;
  group?: string;
}

interface ColumnFilterHeaderProps {
  title: string;
  fieldKey: "category" | "difficulty" | "status" | "subject" | "scope" | "concept";
  options: ColumnFilterOption[];
  filters?: QuestionFiltersState;
  onFilterChange?: (filters: Partial<QuestionFiltersState>) => void;
}

const StandardColumnHeader = (params: any) => {
  const { column } = params;
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const title = params.displayName || column?.getColDef()?.headerName || "";
  const enableFilter = params.enableFilter !== false && Boolean(column?.getColDef()?.filter);
  const [isFilterActive, setIsFilterActive] = useState(false);

  useEffect(() => {
    const checkFilter = () => {
      if (column?.isFilterActive) {
        setIsFilterActive(column.isFilterActive());
      }
    };
    checkFilter();
    column?.addEventListener?.("filterChanged", checkFilter);
    return () => {
      column?.removeEventListener?.("filterChanged", checkFilter);
    };
  }, [column, setIsFilterActive]);

  const onSortClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (params.progressSort) {
      params.progressSort();
    }
  };

  const onFilterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof params.showFilter === "function" && filterButtonRef.current) {
      params.showFilter(filterButtonRef.current);
    } else if (typeof params.showColumnFilter === "function" && filterButtonRef.current) {
      params.showColumnFilter(filterButtonRef.current);
    } else if (typeof params.showColumnMenu === "function" && filterButtonRef.current) {
      params.showColumnMenu(filterButtonRef.current);
    } else if (params.api) {
      const colId = params.column?.getColId?.() || params.column;
      if (typeof params.api.showColumnFilter === "function") {
        params.api.showColumnFilter(colId);
      }
    }
  };

  const sortOrder = params.column?.getSort?.();

  return (
    <div className="flex w-full items-center justify-between min-w-0">
      <span
        onClick={onSortClick}
        className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate cursor-pointer select-none hover:text-[#2a5a6b] dark:hover:text-teal-400 transition-colors"
      >
        {title}
      </span>
      <div className="flex items-center gap-1 shrink-0 ml-1">
        {sortOrder && (
          <span className="text-[10px] text-gray-400">
            {sortOrder === "asc" ? "▲" : "▼"}
          </span>
        )}
        {enableFilter && (
          <div
            ref={filterButtonRef}
            onClick={onFilterClick}
            className="flex cursor-pointer items-center justify-center p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={`Filter by ${title}`}
          >
            {isFilterActive && (
              <span className="mr-1 min-w-[16px] rounded-full bg-blue-600 px-1 py-0.2 text-center text-[10px] font-bold text-white">
                1
              </span>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3.5 w-3.5 ${isFilterActive ? "text-purple-600 font-bold" : "text-gray-400 hover:text-gray-600 dark:text-gray-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

const renderFilterBadge = (
  fieldKey: "category" | "difficulty" | "status" | "subject" | "scope" | "concept",
  value: string,
  label: string
) => {
  if (value === "all") {
    return <span className="font-bold text-xs text-gray-700 dark:text-gray-200">Select All</span>;
  }
  if (fieldKey === "category") {
    const style = CATEGORY_STYLES[value] || CATEGORY_STYLES.TECHNICAL;
    return (
      <span className={`inline-flex h-5 items-center rounded-md border px-2 text-[10px] font-extrabold uppercase tracking-wide ${style}`}>
        {CATEGORY_LABELS[value] || label}
      </span>
    );
  }
  if (fieldKey === "difficulty") {
    const style = DIFFICULTY_STYLES[value] || "bg-gray-50 text-gray-700 border-gray-200";
    return (
      <span className={`inline-flex h-5 items-center rounded-md border px-2 text-[10px] font-extrabold uppercase tracking-wide ${style}`}>
        {label}
      </span>
    );
  }
  if (fieldKey === "subject") {
    const style = getSubjectStyle(value);
    return (
      <span className={`inline-flex h-5 items-center rounded-md border px-2 text-[10px] font-extrabold uppercase tracking-wide ${style}`}>
        {label}
      </span>
    );
  }
  if (fieldKey === "concept") {
    return (
      <span className="inline-flex min-h-5 h-auto py-0.5 items-center rounded-md border border-teal-200/80 bg-teal-50 px-2 text-[10px] font-bold text-teal-700 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300 whitespace-normal text-left leading-tight">
        {label}
      </span>
    );
  }
  if (fieldKey === "scope") {
    const style = getScopeStyle(value);
    return (
      <span className={`inline-flex h-5 items-center rounded-md border px-2 text-[10px] font-extrabold uppercase tracking-wide ${style}`}>
        {label}
      </span>
    );
  }
  if (fieldKey === "status") {
    const style = value === "active" ? "bg-green-100 text-green-800 border-transparent" : "bg-red-100 text-red-800 border-transparent";
    return (
      <span className={`inline-flex h-5 items-center rounded-md border px-2 text-[10px] font-extrabold uppercase tracking-wide ${style}`}>
        {label}
      </span>
    );
  }
  return <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</span>;
};

const ColumnFilterHeader: React.FC<ColumnFilterHeaderProps> = ({
  title,
  fieldKey,
  options,
  filters,
  onFilterChange,
}) => {
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentValue = filters ? filters[fieldKey] : "all";
  const isFiltered = currentValue !== "all";

  const toggleFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      const dropdownWidth = fieldKey === "concept" ? 380 : 250;
      const dropdownHeight = fieldKey === "concept" ? 440 : 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldFlipUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      const top = shouldFlipUp
        ? Math.max(10, rect.top - dropdownHeight - 6)
        : Math.min(window.innerHeight - dropdownHeight - 10, rect.bottom + 6);
      const left = Math.max(10, Math.min(window.innerWidth - dropdownWidth - 16, rect.left - 40));
      setDropdownPos({ top, left });
    }
    setFilterVisible((v) => !v);
    setSearchQuery("");
  };

  const handleSelect = (val: string) => {
    if (onFilterChange) {
      if (fieldKey === "category") {
        onFilterChange({ category: val });
      } else if (fieldKey === "difficulty") {
        onFilterChange({ difficulty: val });
      } else if (fieldKey === "status") {
        onFilterChange({ status: val as QuestionFiltersState["status"] });
      } else if (fieldKey === "subject") {
        onFilterChange({ subject: val });
      } else if (fieldKey === "scope") {
        onFilterChange({ scope: val });
      } else if (fieldKey === "concept") {
        onFilterChange({ concept: val });
      }
    }
    setFilterVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        filterButtonRef.current &&
        !filterButtonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setFilterVisible(false);
      }
    };

    const handleScroll = (event: Event) => {
      const target = event.target as Node;
      // Do not close when scrolling inside the dropdown or dragging its scrollbar!
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      setFilterVisible(false);
    };

    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((o) => o.value === "all" || o.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const groupedOptions = useMemo(() => {
    const nonAll = filteredOptions.filter((o) => o.value !== "all");
    const hasGroups = nonAll.some((o) => Boolean(o.group));
    if (!hasGroups) {
      return [{ groupName: null, items: nonAll }];
    }
    const map = new Map<string, typeof nonAll>();
    nonAll.forEach((o) => {
      const g = o.group || "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(o);
    });
    return Array.from(map.entries()).map(([groupName, items]) => ({
      groupName,
      items,
    }));
  }, [filteredOptions]);

  const totalNonAllCount = options.filter((o) => o.value !== "all").length;
  const filteredNonAllCount = filteredOptions.filter((o) => o.value !== "all").length;

  return (
    <div className="relative flex w-full items-center justify-between min-w-0" ref={filterButtonRef}>
      <span className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
        {title}
      </span>
      <div
        onClick={toggleFilter}
        className="ml-1 flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={`Filter by ${title}`}
      >
        {isFiltered && (
          <span className="mr-1 min-w-[16px] rounded-full bg-blue-600 px-1 py-0.2 text-center text-[10px] font-bold text-white">
            1
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3.5 w-3.5 ${isFiltered ? "text-purple-600 font-bold" : "text-gray-400 hover:text-gray-600 dark:text-gray-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
          />
        </svg>
      </div>

      {filterVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`filter-dropdown pointer-events-auto fixed flex ${
              fieldKey === "concept" ? "w-[380px]" : "w-60"
            } flex-col rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-2xl dark:border-gray-700 dark:bg-gray-800`}
            style={{
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              zIndex: 99999,
              maxHeight: "460px",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header: Title and Item Count */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                Filter by {title}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                {totalNonAllCount} {title.toLowerCase()}s
              </span>
            </div>

            {/* Search Input */}
            {options.length > 5 && (
              <div className="pt-2 pb-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search ${totalNonAllCount} ${title.toLowerCase()}s...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-800 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 pr-7"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Select All */}
            <div className="border-b border-gray-100 pb-1.5 pt-1 dark:border-gray-700">
              <label
                className="flex cursor-pointer items-center font-bold text-xs text-gray-800 dark:text-gray-200 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSelect("all")}
              >
                <input
                  type="checkbox"
                  checked={!isFiltered}
                  readOnly
                  className="mr-2.5 h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                />
                <span>Select All</span>
                <span className="ml-auto text-[10px] font-normal text-gray-400">
                  ({totalNonAllCount})
                </span>
              </label>
            </div>

            {/* Dedicated Scrollable Options List */}
            <div
              className="flex-1 overflow-y-auto max-h-[260px] pr-1 space-y-1 my-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#94a3b8 #f1f5f9",
              }}
              onScroll={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {groupedOptions.length === 0 || (groupedOptions.length === 1 && groupedOptions[0].items.length === 0) ? (
                <div className="py-4 text-center text-xs text-gray-400">
                  No {title.toLowerCase()}s found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                groupedOptions.map(({ groupName, items }) => (
                  <div key={groupName || "default"} className="space-y-0.5">
                    {groupName && (
                      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xs px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between border-b border-gray-100/80 dark:border-gray-700/80">
                        <span>{groupName}</span>
                        <span className="text-[9px] font-semibold bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 rounded px-1.5 py-0.2">
                          {items.length}
                        </span>
                      </div>
                    )}
                    {items.map(({ value, label }) => {
                      const isSelected = currentValue === value;
                      return (
                        <label
                          key={value}
                          onClick={() => handleSelect(value)}
                          className="flex cursor-pointer items-center rounded-lg px-2 py-1.5 hover:bg-teal-50/70 dark:hover:bg-teal-950/40 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="mr-2.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                          />
                          <div className="min-w-0 flex-1">
                            {renderFilterBadge(fieldKey, value, label)}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-2 dark:border-gray-700 flex items-center justify-between text-[10.5px]">
              <span className="text-gray-400 dark:text-gray-500">
                {searchQuery ? `Showing ${filteredNonAllCount} of ${totalNonAllCount}` : `${totalNonAllCount} concepts in database`}
              </span>
              {isFiltered && (
                <button
                  type="button"
                  onClick={() => handleSelect("all")}
                  className="font-bold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

const StatusRenderer = (params: any) => {
  const raw = params.value ?? params.data?.is_active;
  const statusStr = String(raw || "").toLowerCase();
  const isActive = statusStr === "active" || statusStr === "true" || statusStr === "1" || raw === true || raw === 1;
  const badgeClass = isActive
    ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 border-transparent select-none cursor-pointer transition-colors rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide inline-flex items-center"
    : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 border-transparent select-none cursor-pointer transition-colors rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide inline-flex items-center";

  const onToggleStatus = params.context?.onToggleStatus || params.onToggleStatus;
  const questionId = params.data?.id;

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setIsOpen((v) => !v);
  };

  const handleSelectStatus = (targetActive: boolean) => {
    setIsOpen(false);
    if (targetActive !== isActive && onToggleStatus && questionId != null) {
      onToggleStatus(questionId, isActive);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  return (
    <div className="flex h-full items-center min-w-0" ref={buttonRef}>
      <div onClick={toggleDropdown} title="Click to change status" className="cursor-pointer shrink-0">
        <span className={badgeClass}>
          {isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[99999] w-32 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 py-1"
            style={{
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              position: "fixed",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleSelectStatus(true)}
              className={`block w-full px-4 py-2 text-left text-xs font-semibold cursor-pointer transition-colors ${isActive
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => handleSelectStatus(false)}
              className={`block w-full px-4 py-2 text-left text-xs font-semibold cursor-pointer transition-colors ${!isActive
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              Inactive
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export const QuestionBankTable: React.FC<QuestionBankTableProps> = ({
  questions,
  isLoading,
  onEdit,
  onView,
  onDelete,
  onAddClick,
  onToggleStatus,
  currentPage,
  totalPages,
  totalCount,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
  title = "AI Prep Question Bank",
  filters,
  onFilterChange,
  height = "calc(70vh)",
}) => {
  const [pageInput, setPageInput] = useState<string>(String(currentPage));
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState<QuestionBankItem | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const gridApiRef = useRef<any>(null);

  const dynamicConceptOptions = useMemo<ColumnFilterOption[]>(() => {
    const optionsList: ColumnFilterOption[] = [
      { value: "all", label: "All Concepts" },
    ];

    const activeSubject = filters?.subject;

    if (
      activeSubject &&
      activeSubject !== "all" &&
      SUBJECT_CONCEPTS_MAP[activeSubject as QuestionSubject]
    ) {
      SUBJECT_CONCEPTS_MAP[activeSubject as QuestionSubject].forEach((c) => {
        optionsList.push({ value: c.name, label: c.name, group: activeSubject });
      });
    } else {
      (
        Object.entries(SUBJECT_CONCEPTS_MAP) as [QuestionSubject, { name: string }[]][]
      ).forEach(([subj, list]) => {
        list.forEach((c) => {
          optionsList.push({ value: c.name, label: c.name, group: subj });
        });
      });
    }

    const allStandardConcepts = new Set(ALL_CONCEPTS_LIST.map((c) => c.name));
    const extraConcepts = new Set<string>();
    (questions || []).forEach((q) => {
      const c = (q.concept || (q as any).sub_category)?.trim();
      if (c && c !== "—" && !allStandardConcepts.has(c)) {
        extraConcepts.add(c);
      }
    });

    if (extraConcepts.size > 0 && (!activeSubject || activeSubject === "all")) {
      Array.from(extraConcepts)
        .sort((a, b) => a.localeCompare(b))
        .forEach((c) => {
          optionsList.push({ value: c, label: c, group: "Other DB Concepts" });
        });
    }

    return optionsList;
  }, [questions, filters?.subject]);

  const displayedQuestions = useMemo(() => {
    return questions;
  }, [questions]);

  // Reset row heights after React commits updated question data, rather than
  // from AG Grid's row-update lifecycle callback.
  useEffect(() => {
    const api = gridApiRef.current;
    if (api && !api.isDestroyed?.()) {
      api.resetRowHeights();
    }
  }, [displayedQuestions]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const handlePageInputSubmit = () => {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      if (parsed !== currentPage) {
        onPageChange(parsed);
      }
    } else {
      setPageInput(String(currentPage));
    }
  };

  // Keep configured column widths stable. Auto-fitting on grid resize and data
  // changes makes the horizontal scroll range unstable and can misalign cells.
  const handleGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);

  const handleGridSizeChanged = useCallback((_params: GridSizeChangedEvent) => {
    // Fixed column widths let the horizontal scrollbar stop at the grid boundary.
  }, []);

  const toggleColumnVisibility = (field: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const handleDownloadCSV = () => {
    if (!questions || questions.length === 0) return;
    const headers = [
      "ID",
      "Question",
      "Category",
      "Difficulty",
      "Created At",
      "Subject",
      "Concept",
      "Duration (s)",
      "Scope",
      "Status",
    ];
    const csvRows = [headers.join(",")];
    for (const q of questions) {
      const row = [
        q.id,
        `"${(q.question_text || "").replace(/"/g, '""')}"`,
        `"${q.category || ""}"`,
        `"${q.difficulty_level || ""}"`,
        `"${formatDate(q.created_at)}"`,
        `"${q.subject || ""}"`,
        `"${q.concept || ""}"`,
        q.time_limit_seconds || 120,
        `"${q.scope || ""}"`,
        q.ground_truth ? "Configured" : "None",
        q.is_active ? "Active" : "Inactive",
      ];
      csvRows.push(row.join(","));
    }
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `question_bank_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allColumnsList = useMemo(
    () => [
      { field: "id", label: "ID" },
      { field: "question_text", label: "Question" },
      { field: "category", label: "Category" },
      { field: "difficulty_level", label: "Difficulty" },
      { field: "created_at", label: "Created" },
      { field: "subject", label: "Subject" },
      { field: "concept", label: "Concept" },
      { field: "time_limit_seconds", label: "Duration" },
      { field: "scope", label: "Scope" },
      { field: "is_active", label: "Status" },
    ],
    []
  );

  const columnDefs = useMemo<ColDef<QuestionBankItem>[]>(
    () => [
      // 1. ID
      {
        headerName: "ID",
        field: "id",
        width: 75,
        minWidth: 60,
        maxWidth: 90,
        pinned: "left",
        hide: hiddenColumns.has("id"),
        sortable: true,
        filter: "agNumberColumnFilter",
        filterParams: {
          debounceMs: 500,
          suppressAndOrCondition: true,
        },
        headerComponent: StandardColumnHeader,
        cellRenderer: (params: any) => (
          <div className="flex h-full items-center min-w-0">
            <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
              {params.value}
            </span>
          </div>
        ),
      },
      // 2. Question
      {
        headerName: "Question",
        field: "question_text",
        width: 320,
        minWidth: 280,
        pinned: "left",
        wrapText: true,
        autoHeight: true,
        cellClass: "question-cell",
        hide: hiddenColumns.has("question_text"),
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: {
          debounceMs: 500,
          suppressAndOrCondition: true,
        },
        headerComponent: StandardColumnHeader,
        cellRenderer: (params: any) => (
          <div
            style={{
              width: "100%",
              padding: "10px 0",
              minWidth: 0,
            }}
            title={params.value}
          >
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#111827",
                lineHeight: "1.55",
                wordBreak: "break-word",
              }}
            >
              {params.value}
            </span>
          </div>
        ),
      },
      // 3. Category
      {
        headerName: "Category",
        field: "category",
        width: 175,
        minWidth: 155,
        hide: hiddenColumns.has("category"),
        sortable: true,
        cellRenderer: (params: any) => {
          const cat = params.value || "TECHNICAL";
          return (
            <div className="flex h-full w-full min-w-0 items-center overflow-hidden pr-1">
              <span
                className={`inline-flex min-h-6 max-w-full items-center justify-center rounded-md border px-2 py-1 text-center text-[10px] leading-tight font-extrabold uppercase tracking-wide whitespace-normal break-words ${
                  CATEGORY_STYLES[cat] || CATEGORY_STYLES.TECHNICAL
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </span>
            </div>
          );
        },
        headerComponent: () => (
          <ColumnFilterHeader
            title="Category"
            fieldKey="category"
            options={CATEGORY_OPTIONS}
            filters={filters}
            onFilterChange={onFilterChange}
          />
        ),
      },
      // 4. Difficulty
      {
        headerName: "Difficulty",
        field: "difficulty_level",
        width: 120,
        minWidth: 105,
        hide: hiddenColumns.has("difficulty_level"),
        sortable: true,
        cellRenderer: (params: any) => {
          const diff = params.value || "MEDIUM";
          return (
            <div className="flex h-full items-center shrink-0">
              <span
                className={`inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-extrabold uppercase tracking-wide ${
                  DIFFICULTY_STYLES[diff] ||
                  "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {diff}
              </span>
            </div>
          );
        },
        headerComponent: () => (
          <ColumnFilterHeader
            title="Difficulty"
            fieldKey="difficulty"
            options={DIFFICULTY_OPTIONS}
            filters={filters}
            onFilterChange={onFilterChange}
          />
        ),
      },
      // 5. Created
      {
        headerName: "Created",
        field: "created_at",
        width: 100,
        minWidth: 90,
        hide: hiddenColumns.has("created_at"),
        sortable: true,
        filter: "agDateColumnFilter",
        headerComponent: StandardColumnHeader,
        filterParams: {
          comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
            if (!cellValue) return -1;
            const cellDate = new Date(cellValue);
            if (isNaN(cellDate.getTime())) return -1;
            const cellDateAtMidnight = new Date(
              cellDate.getFullYear(),
              cellDate.getMonth(),
              cellDate.getDate()
            );
            if (cellDateAtMidnight.getTime() === filterLocalDateAtMidnight.getTime()) {
              return 0;
            }
            if (cellDateAtMidnight < filterLocalDateAtMidnight) {
              return -1;
            }
            return 1;
          },
          buttons: ["reset"],
        },
        cellRenderer: (params: any) => (
          <div className="flex h-full items-center min-w-0">
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {formatDate(params.value)}
            </span>
          </div>
        ),
      },
      // 6. Subject
      {
        headerName: "Subject",
        field: "subject",
        width: 175,
        minWidth: 155,
        hide: hiddenColumns.has("subject"),
        sortable: true,
        cellRenderer: (params: any) => {
          const subj = params.value;
          if (!subj) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
          return (
            <div className="flex h-full items-center min-w-0 max-w-full overflow-hidden">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-tight max-w-full ${
                  getSubjectStyle(subj)
                }`}
                style={{
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  lineHeight: "1.25",
                }}
              >
                {subj}
              </span>
            </div>
          );
        },
        headerComponent: () => (
          <ColumnFilterHeader
            title="Subject"
            fieldKey="subject"
            options={SUBJECT_OPTIONS}
            filters={filters}
            onFilterChange={onFilterChange}
          />
        ),
      },
      // 7. Concept
      {
        headerName: "Concept",
        field: "concept",
        width: 230,
        minWidth: 210,
        wrapText: true,
        autoHeight: true,
        cellClass: "concept-cell",
        hide: hiddenColumns.has("concept"),
        sortable: true,
        headerComponent: () => (
          <ColumnFilterHeader
            title="Concept"
            fieldKey="concept"
            options={dynamicConceptOptions}
            filters={filters}
            onFilterChange={onFilterChange}
          />
        ),
        cellRenderer: (params: any) => {
          const concept = params.value || params.data?.sub_category || "—";
          if (!concept || concept === "—") {
            return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
          }
          return (
            <div
              className="w-full py-2 text-xs font-semibold text-gray-800 dark:text-gray-200"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                whiteSpace: "normal",
                wordBreak: "break-word",
                lineHeight: "1.35",
              }}
              title={concept}
            >
              {concept}
            </div>
          );
        },
      },
      // 8. Duration
      {
        headerName: "Duration",
        field: "time_limit_seconds",
        width: 125,
        minWidth: 120,
        hide: hiddenColumns.has("time_limit_seconds"),
        sortable: true,
        headerComponent: StandardColumnHeader,
        cellRenderer: (params: any) => {
          const secs = params.value ?? params.data?.time_limit_seconds ?? 120;
          return (
            <div className="flex h-full items-center min-w-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {formatDuration(secs)}
              </span>
            </div>
          );
        },
      },
      // 9. Scope
      {
        headerName: "Scope",
        field: "scope",
        width: 110,
        minWidth: 95,
        hide: hiddenColumns.has("scope"),
        sortable: true,
        cellRenderer: (params: any) => {
          const sc = params.value;
          if (!sc) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
          return (
            <div className="flex h-full items-center shrink-0">
              <span
                className={`inline-flex h-6 items-center rounded-md border px-2 text-[10px] font-extrabold uppercase tracking-wide ${
                  getScopeStyle(sc)
                }`}
              >
                {sc}
              </span>
            </div>
          );
        },
        headerComponent: () => (
          <ColumnFilterHeader
            title="Scope"
            fieldKey="scope"
            options={SCOPE_OPTIONS}
            filters={filters}
            onFilterChange={onFilterChange}
          />
        ),
      },
      // 10. Status
      {
        headerName: "Status",
        field: "is_active",
        width: 115,
        minWidth: 100,
        hide: hiddenColumns.has("is_active"),
        sortable: true,
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["Active", "Inactive"],
        },
        cellRenderer: StatusRenderer,
        headerComponent: () => (
          <ColumnFilterHeader
            title="Status"
            fieldKey="status"
            options={STATUS_OPTIONS}
            filters={filters}
            onFilterChange={onFilterChange}
          />
        ),
      },
    ],
    [onEdit, onView, hiddenColumns, filters, onFilterChange, dynamicConceptOptions]
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-gray-50/80 dark:bg-gray-800/60"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2a5a6b]/10 text-[#2a5a6b] dark:bg-teal-950/50 dark:text-teal-400">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-gray-100">
          No questions found
        </h3>
        <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
          No questions match your current search or filter criteria, or the question bank is empty.
        </p>
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2a5a6b] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#224855] transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New Question
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      {/* Column Visibility Modal */}
      <ColumnVisibilityModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        allColumns={allColumnsList}
        hiddenColumns={hiddenColumns}
        onToggleColumn={toggleColumnVisibility}
      />

      {/* Avatar Grid Top Header Title & Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {title} <span className="text-gray-500 font-semibold">({totalCount})</span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {onAddClick && (
            <button
              type="button"
              onClick={onAddClick}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-green-600 shadow-xs transition-colors hover:bg-green-50 dark:border-gray-700 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-gray-700 cursor-pointer"
              title="Add Questions"
              aria-label="Add Questions"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Add Questions</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsColumnModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-xs transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Toggle Columns"
            aria-label="Toggle Columns"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={!selectedRow}
            onClick={() => selectedRow && onView(selectedRow)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-xs transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="View Selected Question"
            aria-label="View Selected Question"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={!selectedRow}
            onClick={() => selectedRow && onEdit(selectedRow)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-xs transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Edit Selected Question"
            aria-label="Edit Selected Question"
          >
            <EditSquareIcon className="h-4 w-4" />
          </button>

          {onDelete && (
            <button
              type="button"
              disabled={!selectedRow}
              onClick={() => selectedRow && onDelete(selectedRow)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 shadow-xs transition-colors hover:bg-red-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700"
              title="Delete Selected Question"
              aria-label="Delete Selected Question"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-emerald-600 shadow-xs transition-colors hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-emerald-400 dark:hover:bg-gray-700"
            title="Download CSV"
            aria-label="Download CSV"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Global CSS Overrides for clean, robust AG Grid auto-fit layout */}
      <style jsx global>{`
        .ag-theme-alpine {
          --ag-header-background-color: #ffffff !important;
          --ag-header-foreground-color: #111827 !important;
          --ag-header-height: 44px !important;
          --ag-font-size: 13px !important;
          --ag-border-color: #e5e7eb !important;
          --ag-row-border-color: #f1f5f9 !important;
          --ag-selected-row-background-color: #e0f2fe !important;
          --ag-row-hover-color: #f8fafc !important;
          --ag-cell-horizontal-padding: 12px !important;
        }
        .ag-theme-alpine .ag-header {
          background-color: #ffffff !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        .ag-theme-alpine .ag-header-row {
          background-color: #ffffff !important;
        }
        .ag-theme-alpine .ag-row-selected,
        .ag-theme-alpine .ag-row-selected .ag-cell {
          background-color: #e0f2fe !important;
        }
        /* ── All cells: flex, clipped, vertically centred, no vertical column lines ── */
        .ag-theme-alpine .ag-cell {
          border-right: none !important;
          box-sizing: border-box !important;
          min-width: 0 !important;
        }
        /* Let AG Grid own wrapper sizing/positioning so pinned and horizontally
           scrolling columns stay aligned with their headers. */
        .ag-theme-alpine .ag-cell-wrapper,
        .ag-theme-alpine .ag-cell-value,
        .ag-theme-alpine .ag-react-container {
          box-sizing: border-box !important;
          min-width: 0 !important;
        }
        /* ── QUESTION & CONCEPT columns: multiline text wrapping so content comes down cleanly ── */
        .ag-theme-alpine .ag-cell.question-cell {
          white-space: normal !important;
          min-height: 52px !important;
        }
        .ag-theme-alpine .ag-cell.question-cell .ag-cell-wrapper,
        .ag-theme-alpine .ag-cell.question-cell .ag-cell-value,
        .ag-theme-alpine .ag-cell.question-cell .ag-react-container {
          min-width: 0 !important;
          min-height: 52px !important;
        }
        .ag-theme-alpine .ag-paging-panel {
          display: none !important;
        }
        .dark .ag-theme-alpine {
          --ag-header-background-color: #0f172a !important;
          --ag-header-foreground-color: #f8fafc !important;
          --ag-border-color: #1e293b !important;
          --ag-row-border-color: #1e293b !important;
          --ag-background-color: #090d16 !important;
          --ag-row-hover-color: #1e293b !important;
          --ag-foreground-color: #f1f5f9 !important;
          --ag-selected-row-background-color: rgba(30, 64, 175, 0.4) !important;
        }
        .dark .ag-theme-alpine .ag-header,
        .dark .ag-theme-alpine .ag-header-row {
          background-color: #0f172a !important;
          border-bottom: 1px solid #1e293b !important;
        }
        .dark .ag-theme-alpine .ag-row-selected,
        .dark .ag-theme-alpine .ag-row-selected .ag-cell {
          background-color: rgba(30, 64, 175, 0.4) !important;
        }
        .dark .ag-theme-alpine .ag-cell {
          border-right: none !important;
        }
        .ag-header-cell-label,
        .ag-header-cell-comp-wrapper {
          font-weight: 600 !important;
          font-size: 13px !important;
          color: #111827 !important;
          width: 100% !important;
          min-width: 0 !important;
          text-transform: none !important;
          letter-spacing: normal !important;
        }
        .dark .ag-header-cell-label,
        .dark .ag-header-cell-comp-wrapper {
          color: #f8fafc !important;
        }
        .ag-header-cell {
          border-right: 1px solid #e5e7eb !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
        }
        .dark .ag-header-cell {
          border-right: 1px solid #334155 !important;
        }
        .ag-theme-alpine .ag-row {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .dark .ag-theme-alpine .ag-row {
          border-bottom: 1px solid #1e293b !important;
        }
        /* ── AG Grid Date & Text Filter Popup Styling ── */
        .ag-theme-alpine .ag-popup {
          z-index: 99999 !important;
        }
        .ag-theme-alpine .ag-filter {
          background-color: #ffffff !important;
          border-radius: 8px !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 8px 16px -2px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          padding: 8px 10px !important;
          font-family: inherit !important;
        }
        .ag-theme-alpine .ag-picker-field,
        .ag-theme-alpine .ag-filter-select,
        .ag-theme-alpine .ag-picker-field-wrapper {
          border-radius: 6px !important;
          border: 1.5px solid #60a5fa !important;
          padding: 3px 8px !important;
          font-size: 13px !important;
          background-color: #ffffff !important;
          color: #111827 !important;
          outline: none !important;
          min-height: 28px !important;
        }
        .ag-theme-alpine .ag-text-field-input,
        .ag-theme-alpine input[type="date"] {
          border-radius: 6px !important;
          border: 1.5px solid #cbd5e1 !important;
          padding: 4px 8px !important;
          font-size: 13px !important;
          margin-top: 6px !important;
          outline: none !important;
          min-height: 28px !important;
          transition: border-color 0.15s ease-in-out;
        }
        .ag-theme-alpine .ag-text-field-input:focus,
        .ag-theme-alpine input[type="date"]:focus {
          border-color: #3b82f6 !important;
        }
        .ag-theme-alpine .ag-select-list,
        .ag-theme-alpine .ag-select-popup {
          background-color: #ffffff !important;
          border-radius: 6px !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          padding: 4px 0 !important;
        }
        .ag-theme-alpine .ag-select-list-item {
          padding: 5px 12px !important;
          font-size: 13px !important;
          color: #1f2937 !important;
          cursor: pointer !important;
          line-height: 1.4 !important;
        }
        .ag-theme-alpine .ag-select-list-item.ag-active-item,
        .ag-theme-alpine .ag-select-list-item:hover {
          background-color: #e0f2fe !important;
          color: #0284c7 !important;
        }
        .dark .ag-theme-alpine .ag-filter {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
          color: #f3f4f6 !important;
        }
        .dark .ag-theme-alpine .ag-select-list,
        .dark .ag-theme-alpine .ag-select-popup {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
        }
        .dark .ag-theme-alpine .ag-select-list-item {
          color: #f3f4f6 !important;
        }
        .dark .ag-theme-alpine .ag-select-list-item.ag-active-item,
        .dark .ag-theme-alpine .ag-select-list-item:hover {
          background-color: #1e3a8a !important;
          color: #bfdbfe !important;
        }
        .dark .ag-theme-alpine .ag-picker-field,
        .dark .ag-theme-alpine .ag-filter-select,
        .dark .ag-theme-alpine .ag-picker-field-wrapper,
        .dark .ag-theme-alpine .ag-text-field-input,
        .dark .ag-theme-alpine input[type="date"] {
          background-color: #111827 !important;
          border-color: #4b5563 !important;
          color: #f9fafb !important;
        }
      `}</style>

      {/* Unified table + pagination panel */}
      <div className="rounded-2xl shadow-xs overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* AG Grid Table Container */}
      <div
        className={`ag-theme-alpine ${isDarkMode ? "ag-grid-dark-mode" : ""
          } w-full max-w-full border-b border-gray-200 dark:border-gray-700 overflow-hidden min-w-0`}
        style={{ height: height, minHeight: "420px", width: "100%", maxWidth: "100%" }}
      >
        <AgGridReact
          // Stable row identity prevents AG Grid from reusing a stale row node
          // when refreshed API data contains the same question IDs.
          getRowId={(params) => String(params.data.id)}
          rowData={displayedQuestions}
          columnDefs={columnDefs}
          context={{ onToggleStatus }}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
          }}
          rowSelection="single"
          onRowClicked={(event: RowClickedEvent) => setSelectedRow(event.data)}
          onCellValueChanged={(event: any) => {
            if (event.colDef.field === "is_active" && onToggleStatus && event.data?.id != null) {
              const rawOld = event.oldValue;
              const oldIsActive = String(rawOld || "").toLowerCase() === "active" || rawOld === true;
              onToggleStatus(event.data.id, oldIsActive);
            }
          }}
          pagination={false}
          suppressPaginationPanel={true}
          loading={isLoading}
          // Disable row animations because auto-height React renderers can leave a stale blank row during data refreshes.
          animateRows={false}
          headerHeight={44}
          suppressCellFocus={true}
          onGridReady={handleGridReady}
          onGridSizeChanged={handleGridSizeChanged}

        />
      </div>

      {/* AG Grid–style Pagination Footer */}
      <div className="flex items-center justify-between border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-lg px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400" style={{ minHeight: '42px' }}>
        {/* Left: Page Size */}
        <div className="flex items-center gap-2">
          <span className="font-medium">Page Size:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
            aria-label="Page size"
          >
            {[10, 25, 50, 100].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Center: Record count */}
        <div className="font-semibold text-gray-800 dark:text-gray-200">
          {totalCount === 0 ? '0' : `${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, totalCount)}`} of {totalCount}
        </div>

        {/* Right: Navigation */}
        <div className="flex items-center gap-0.5">
          {/* First page */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="First page"
            title="First Page"
          >
            <ChevronLeft className="h-3.5 w-3.5" /><ChevronLeft className="h-3.5 w-3.5 -ml-2.5" />
          </button>
          {/* Prev page */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
            title="Previous Page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Page label */}
          <span className="px-2 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Page{" "}
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handlePageInputSubmit();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              onBlur={handlePageInputSubmit}
              onFocus={(e) => e.target.select()}
              className="inline-block w-10 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-center text-xs font-semibold text-gray-900 dark:text-gray-100 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 mx-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Page number"
            />
            of {totalPages}
          </span>

          {/* Next page */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
            title="Next Page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {/* Last page */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Last page"
            title="Last Page"
          >
            <ChevronRight className="h-3.5 w-3.5" /><ChevronRight className="h-3.5 w-3.5 -ml-2.5" />
          </button>
        </div>
      </div>
      </div>{/* end unified panel */}
    </div>
  );
};
