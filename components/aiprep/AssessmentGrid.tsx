"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  Video,
  Mic,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings,
} from "lucide-react";
import { AssessmentGridItem, AssessmentFiltersState } from "@/types/assessment";

interface AssessmentGridProps {
  assessments: AssessmentGridItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onView: (assessment: AssessmentGridItem) => void;
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  onPageChange: (page: number) => void;
  isAdmin?: boolean;
  filters?: AssessmentFiltersState;
  onFilterChange?: (filters: Partial<AssessmentFiltersState>) => void;
}

const ASSESSMENT_TYPES = [
  {
    value: "INTRO",
    label: "INTRO",
    style:
      "bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800",
  },
  {
    value: "JD_INTRO",
    label: "JD INTRO",
    style:
      "bg-cyan-50 text-cyan-700 border-cyan-200/80 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
  },
  {
    value: "RECRUITER",
    label: "RECRUITER SCREEN",
    style:
      "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    value: "HIRING_MANAGER",
    label: "HIRING MANAGER",
    style:
      "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
  },
  {
    value: "SYSTEM_DESIGN",
    label: "SYSTEM DESIGN",
    style:
      "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  },
  {
    value: "TECHNICAL",
    label: "TECHNICAL",
    style:
      "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  },
];

const STATUS_TYPES = [
  {
    value: "IN_PROGRESS",
    label: "IN PROGRESS",
    style:
      "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  },
  {
    value: "EVALUATING",
    label: "EVALUATING",
    style:
      "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  },
  {
    value: "COMPLETED",
    label: "COMPLETED",
    style:
      "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    value: "FAILED",
    label: "FAILED",
    style:
      "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  },
];

const MODE_TYPES = [
  {
    value: "AUDIO",
    label: "Audio Only",
    icon: Mic,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    value: "VIDEO",
    label: "Video Only",
    icon: Video,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "VIDEO_AUDIO",
    label: "Video + Audio",
    icon: Video,
    color: "text-indigo-600 dark:text-indigo-400",
  },
];

function getCanonicalAssessmentType(raw?: string): string {
  const t = (raw || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (t === "INTRO" || t === "GENERAL_INTRO") return "INTRO";
  if (t === "JD_INTRO" || t === "JOB_DESCRIPTION_INTRO" || t === "JD" || t === "JDINTRO") return "JD_INTRO";
  if (t === "RECRUITER" || t === "RECRUITER_SCREEN" || t === "RECRUITER_SCREENING") return "RECRUITER";
  if (t === "HIRING_MANAGER" || t === "HIRINGMANAGER" || t === "HM") return "HIRING_MANAGER";
  if (t === "SYSTEM_DESIGN" || t === "SYSTEMDESIGN") return "SYSTEM_DESIGN";
  if (t === "TECHNICAL" || t === "TECH") return "TECHNICAL";
  return t;
}

function getCanonicalMode(raw?: string | number): string {
  const m = String(raw || "").toUpperCase().replace(/[\s\+\-_]+/g, "_");
  if (m === "1" || m === "AUDIO" || m === "AUDIO_ONLY") return "AUDIO";
  if (m === "2" || m === "VIDEO" || m === "VIDEO_ONLY") return "VIDEO";
  return "VIDEO_AUDIO";
}

function getCanonicalStatus(raw?: string): string {
  const s = (raw || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (s === "IN_PROGRESS" || s === "PROCESSING" || s === "TESTING") return "IN_PROGRESS";
  if (s === "EVALUATING") return "EVALUATING";
  if (s === "COMPLETED") return "COMPLETED";
  if (s === "FAILED") return "FAILED";
  return s;
}

const FunnelFilterIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-3.5 w-3.5 ${
      isActive
        ? "text-purple-600 dark:text-purple-400 font-bold"
        : "text-gray-400 hover:text-gray-600 dark:text-gray-400"
    }`}
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
);

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
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-base cursor-pointer"
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

export const AssessmentGrid: React.FC<AssessmentGridProps> = ({
  assessments = [],
  isLoading,
  error,
  onRetry,
  onView,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  isAdmin = true,
  filters,
  onFilterChange,
}) => {
  // Column toggle modal state
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const allColumnsList = useMemo(() => {
    const list = [
      { field: "id", label: "Assessment ID" },
    ];
    if (isAdmin) {
      list.push({ field: "candidate", label: "Candidate" });
    }
    list.push(
      { field: "assessment_type", label: "Assessment Type" },
      { field: "mode", label: "Mode" },
      { field: "status", label: "Status" },
      { field: "score", label: "Score" },
      { field: "date", label: "Date" },
      { field: "actions", label: "Actions" }
    );
    return list;
  }, [isAdmin]);

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

  // Internal filter state (used when filters prop is not provided)
  const [internalCategory, setInternalCategory] = useState("all");
  const [internalMode, setInternalMode] = useState("all");
  const [internalStatus, setInternalStatus] = useState("all");
  const [internalDateOperator, setInternalDateOperator] = useState("equals");
  const [internalDateValue, setInternalDateValue] = useState("");
  const [internalDateTo, setInternalDateTo] = useState("");

  const currentCategory = filters ? filters.category : internalCategory;
  const currentMode = filters ? (filters.media_type || "all") : internalMode;
  const currentStatus = filters ? (filters.status || "all") : internalStatus;
  const currentDateOperator = filters ? (filters.date_operator || "equals") : internalDateOperator;
  const currentDateValue = filters ? (filters.date_value || "") : internalDateValue;
  const currentDateTo = filters ? (filters.date_to || "") : internalDateTo;

  const isTypeFiltered = currentCategory !== "all";
  const isModeFiltered = currentMode !== "all";
  const isStatusFiltered = currentStatus !== "all";
  const isDateFiltered = Boolean(currentDateValue);

  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const [typeDropdownPos, setTypeDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [statusDropdownPos, setStatusDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [modeDropdownPos, setModeDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [dateDropdownPos, setDateDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const typeButtonRef = useRef<HTMLDivElement>(null);
  const statusButtonRef = useRef<HTMLDivElement>(null);
  const modeButtonRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLDivElement>(null);

  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  const toggleTypeDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeButtonRef.current) {
      const rect = typeButtonRef.current.getBoundingClientRect();
      setTypeDropdownPos({
        top: rect.bottom + 6,
        left: Math.max(10, rect.left - 40),
      });
    }
    setTypeDropdownOpen((prev) => !prev);
    setStatusDropdownOpen(false);
    setModeDropdownOpen(false);
    setDateDropdownOpen(false);
  };

  const toggleModeDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (modeButtonRef.current) {
      const rect = modeButtonRef.current.getBoundingClientRect();
      setModeDropdownPos({
        top: rect.bottom + 6,
        left: Math.max(10, rect.left - 40),
      });
    }
    setModeDropdownOpen((prev) => !prev);
    setTypeDropdownOpen(false);
    setStatusDropdownOpen(false);
    setDateDropdownOpen(false);
  };

  const toggleStatusDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (statusButtonRef.current) {
      const rect = statusButtonRef.current.getBoundingClientRect();
      setStatusDropdownPos({
        top: rect.bottom + 6,
        left: Math.max(10, rect.left - 40),
      });
    }
    setStatusDropdownOpen((prev) => !prev);
    setTypeDropdownOpen(false);
    setModeDropdownOpen(false);
    setDateDropdownOpen(false);
  };

  const toggleDateDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      setDateDropdownPos({
        top: rect.bottom + 6,
        left: Math.max(10, rect.left - 100),
      });
    }
    setDateDropdownOpen((prev) => !prev);
    setTypeDropdownOpen(false);
    setStatusDropdownOpen(false);
    setModeDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(e.target as Node) &&
        typeButtonRef.current &&
        !typeButtonRef.current.contains(e.target as Node)
      ) {
        setTypeDropdownOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node) &&
        statusButtonRef.current &&
        !statusButtonRef.current.contains(e.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
      if (
        modeDropdownRef.current &&
        !modeDropdownRef.current.contains(e.target as Node) &&
        modeButtonRef.current &&
        !modeButtonRef.current.contains(e.target as Node)
      ) {
        setModeDropdownOpen(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(e.target as Node) &&
        dateButtonRef.current &&
        !dateButtonRef.current.contains(e.target as Node)
      ) {
        setDateDropdownOpen(false);
      }
    };
    const handleScroll = () => {
      setTypeDropdownOpen(false);
      setStatusDropdownOpen(false);
      setModeDropdownOpen(false);
      setDateDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [
    setTypeDropdownOpen,
    setStatusDropdownOpen,
    setModeDropdownOpen,
    setDateDropdownOpen,
  ]);

  const handleSelectType = (val: string) => {
    if (onFilterChange) {
      onFilterChange({ category: val });
    } else {
      setInternalCategory(val);
    }
    setTypeDropdownOpen(false);
  };

  const handleSelectMode = (val: string) => {
    if (onFilterChange) {
      onFilterChange({ media_type: val });
    } else {
      setInternalMode(val);
    }
    setModeDropdownOpen(false);
  };

  const handleSelectStatus = (val: string) => {
    if (onFilterChange) {
      onFilterChange({ status: val });
    } else {
      setInternalStatus(val);
    }
    setStatusDropdownOpen(false);
  };

  const handleDateOperatorChange = (val: string) => {
    if (onFilterChange) {
      onFilterChange({ date_operator: val });
    } else {
      setInternalDateOperator(val);
    }
  };

  const handleDateValueChange = (val: string) => {
    if (onFilterChange) {
      onFilterChange({ date_value: val });
    } else {
      setInternalDateValue(val);
    }
  };

  const handleDateToChange = (val: string) => {
    if (onFilterChange) {
      onFilterChange({ date_to: val });
    } else {
      setInternalDateTo(val);
    }
  };

  const handleResetDateFilter = () => {
    if (onFilterChange) {
      onFilterChange({ date_operator: "equals", date_value: "", date_to: "" });
    } else {
      setInternalDateOperator("equals");
      setInternalDateValue("");
      setInternalDateTo("");
    }
    setDateDropdownOpen(false);
  };

  const getStatusBadge = (status?: string) => {
    const s = getCanonicalStatus(status);
    const found = STATUS_TYPES.find((st) => st.value === s);
    const style =
      found?.style ||
      "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    return (
      <span
        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-extrabold uppercase ${style}`}
      >
        {s.replace(/_/g, " ")}
      </span>
    );
  };

  const getTypeBadge = (type?: string) => {
    const t = getCanonicalAssessmentType(type);
    const found = ASSESSMENT_TYPES.find((at) => at.value === t);
    const style =
      found?.style ||
      "bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800";
    const label = found?.label || t.replace(/_/g, " ");
    return (
      <span
        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase ${style}`}
      >
        {label}
      </span>
    );
  };

  // 1: Audio Only, 2: Video Only, 3: Video + Audio
  const getMediaBadge = (mode?: string) => {
    const m = getCanonicalMode(mode);
    if (m === "AUDIO") {
      return (
        <span className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-semibold">
          <Mic className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          <span>Audio Only</span>
        </span>
      );
    }
    if (m === "VIDEO") {
      return (
        <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Video className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>Video Only</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold">
        <Video className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span>Video + Audio</span>
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  const displayedAssessments = useMemo(() => {
    if (!assessments || !Array.isArray(assessments)) return [];
    if (filters) {
      return assessments;
    }
    return assessments.filter((a) => {
      const matchType =
        currentCategory === "all" ||
        getCanonicalAssessmentType(a.assessment_type) === getCanonicalAssessmentType(currentCategory);
      const matchStatus =
        currentStatus === "all" ||
        getCanonicalStatus(a.status) === getCanonicalStatus(currentStatus);
      const matchMode =
        currentMode === "all" ||
        getCanonicalMode(a.media_type || (a as any).media_mode) === getCanonicalMode(currentMode);

      let matchDate = true;
      if (currentDateValue) {
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

        const itemKey = parseItemDateKey(a.created_at || a.started_at);
        if (!itemKey) {
          matchDate = false;
        } else if (currentDateOperator === "equals") {
          matchDate = itemKey === currentDateValue;
        } else if (currentDateOperator === "not_equals") {
          matchDate = itemKey !== currentDateValue;
        } else if (currentDateOperator === "less_than") {
          matchDate = itemKey < currentDateValue;
        } else if (currentDateOperator === "greater_than") {
          matchDate = itemKey > currentDateValue;
        } else if (currentDateOperator === "in_range") {
          matchDate = itemKey >= currentDateValue && (!currentDateTo || itemKey <= currentDateTo);
        }
      }

      return matchType && matchStatus && matchMode && matchDate;
    });
  }, [
    assessments,
    filters,
    currentCategory,
    currentStatus,
    currentMode,
    currentDateOperator,
    currentDateValue,
    currentDateTo,
  ]);

  const handleExportCSV = () => {
    const listToExport =
      displayedAssessments.length > 0 ? displayedAssessments : assessments;
    if (!listToExport || listToExport.length === 0) return;
    const headers = [
      "Assessment ID",
      "Candidate ID",
      "Assessment Type",
      "Mode",
      "Status",
      "Score",
      "Date",
    ];
    const rows = listToExport.map((a) => [
      `AS-${a.id}`,
      a.candidate_id || "",
      a.assessment_type || "",
      a.media_type || (a as any).media_mode || "",
      a.status || "",
      a.score != null ? `${a.score}%` : "—",
      formatDate(a.created_at),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `assessments_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const recordCount = totalCount ?? displayedAssessments.length;

  return (
    <div className="space-y-3">
      {/* Sub-toolbar: records count pill + settings and export buttons */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 shadow-2xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          {recordCount} records
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsColumnModalOpen(true)}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 shadow-2xs transition-colors cursor-pointer"
            title="Columns Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-emerald-600 dark:border-gray-800 dark:bg-gray-900 dark:text-emerald-400 dark:hover:bg-gray-800 shadow-2xs transition-colors cursor-pointer"
            title="Download CSV"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 min-h-[420px] flex flex-col rounded-xl border border-gray-200 bg-white shadow-xs overflow-visible dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Loading assessments...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Failed to load assessments
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 max-w-md">
                {error}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto min-h-[350px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-bold text-gray-800 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-200 sticky top-0 z-10">
                  {!hiddenColumns.has("id") && (
                    <th className="py-3.5 px-4 w-32 font-bold">Assessment ID</th>
                  )}
                  {isAdmin && !hiddenColumns.has("candidate") && (
                    <th className="py-3.5 px-4 w-44 font-bold">Candidate</th>
                  )}

                  {/* Assessment Type Column with Funnel Filter */}
                  {!hiddenColumns.has("assessment_type") && (
                    <th className="py-3.5 px-4 w-48 relative font-bold">
                      <div
                        ref={typeButtonRef}
                        className="flex items-center justify-between min-w-0"
                      >
                        <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate">
                          Assessment Type
                        </span>
                        <div
                          onClick={toggleTypeDropdown}
                          className="ml-1 flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
                          title="Filter by Assessment Type"
                        >
                          {isTypeFiltered && (
                            <span className="mr-1 min-w-[16px] rounded-full bg-blue-600 px-1 py-0.2 text-center text-[10px] font-bold text-white">
                              1
                            </span>
                          )}
                          <FunnelFilterIcon isActive={isTypeFiltered} />
                        </div>
                      </div>
                    </th>
                  )}

                  {/* Mode Column with Funnel Filter */}
                  {!hiddenColumns.has("mode") && (
                    <th className="py-3.5 px-4 w-44 relative font-bold">
                      <div
                        ref={modeButtonRef}
                        className="flex items-center justify-between min-w-0"
                      >
                        <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate">
                          Mode
                        </span>
                        <div
                          onClick={toggleModeDropdown}
                          className="ml-1 flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
                          title="Filter by Mode"
                        >
                          {isModeFiltered && (
                            <span className="mr-1 min-w-[16px] rounded-full bg-blue-600 px-1 py-0.2 text-center text-[10px] font-bold text-white">
                              1
                            </span>
                          )}
                          <FunnelFilterIcon isActive={isModeFiltered} />
                        </div>
                      </div>
                    </th>
                  )}

                  {/* Status Column with Funnel Filter */}
                  {!hiddenColumns.has("status") && (
                    <th className="py-3.5 px-4 w-44 relative font-bold">
                      <div
                        ref={statusButtonRef}
                        className="flex items-center justify-between min-w-0"
                      >
                        <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate">
                          Status
                        </span>
                        <div
                          onClick={toggleStatusDropdown}
                          className="ml-1 flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
                          title="Filter by Status"
                        >
                          {isStatusFiltered && (
                            <span className="mr-1 min-w-[16px] rounded-full bg-blue-600 px-1 py-0.2 text-center text-[10px] font-bold text-white">
                              1
                            </span>
                          )}
                          <FunnelFilterIcon isActive={isStatusFiltered} />
                        </div>
                      </div>
                    </th>
                  )}

                  {!hiddenColumns.has("score") && (
                    <th className="py-3.5 px-4 w-24 font-bold">Score</th>
                  )}

                  {/* Date Column with Funnel Filter */}
                  {!hiddenColumns.has("date") && (
                    <th className="py-3.5 px-4 w-44 relative font-bold">
                      <div
                        ref={dateButtonRef}
                        className="flex items-center justify-between min-w-0"
                      >
                        <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate">
                          Date
                        </span>
                        <div
                          onClick={toggleDateDropdown}
                          className="ml-1 flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
                          title="Filter by Date"
                        >
                          {isDateFiltered && (
                            <span className="mr-1 min-w-[16px] rounded-full bg-blue-600 px-1 py-0.2 text-center text-[10px] font-bold text-white">
                              1
                            </span>
                          )}
                          <FunnelFilterIcon isActive={isDateFiltered} />
                        </div>
                      </div>
                    </th>
                  )}

                  {!hiddenColumns.has("actions") && (
                    <th className="py-3.5 px-4 w-28 text-center font-bold">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {displayedAssessments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 8 : 7}
                      className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium"
                    >
                      No assessment records match the selected filters
                    </td>
                  </tr>
                ) : (
                  displayedAssessments.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {!hiddenColumns.has("id") && (
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          AS-{a.id}
                        </td>
                      )}

                      {isAdmin && !hiddenColumns.has("candidate") && (
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                              Candidate #{a.candidate_id || "—"}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono">
                              CAND-{a.candidate_id || "—"}
                            </p>
                          </div>
                        </td>
                      )}

                      {!hiddenColumns.has("assessment_type") && (
                        <td className="py-3.5 px-4">
                          {getTypeBadge(a.assessment_type)}
                        </td>
                      )}

                      {!hiddenColumns.has("mode") && (
                        <td className="py-3.5 px-4">
                          {getMediaBadge(a.media_type || (a as any).media_mode)}
                        </td>
                      )}

                      {!hiddenColumns.has("status") && (
                        <td className="py-3.5 px-4">
                          {getStatusBadge(a.status)}
                        </td>
                      )}

                      {!hiddenColumns.has("score") && (
                        <td className="py-3.5 px-4 font-medium text-gray-500 dark:text-gray-400">
                          {a.score != null && a.score > 0
                            ? `${a.score}%`
                            : "—"}
                        </td>
                      )}

                      {!hiddenColumns.has("date") && (
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 font-medium">
                          {formatDate(a.created_at)}
                        </td>
                      )}

                      {!hiddenColumns.has("actions") && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onView(a)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/80 bg-indigo-50/70 px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>View</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/30 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Page{" "}
            <strong className="text-gray-900 dark:text-white">
              {currentPage}
            </strong>{" "}
            of{" "}
            <strong className="text-gray-900 dark:text-white">
              {totalPages || 1}
            </strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Column Visibility Modal */}
      <ColumnVisibilityModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        allColumns={allColumnsList}
        hiddenColumns={hiddenColumns}
        onToggleColumn={toggleColumnVisibility}
      />

      {/* Portal Modal: Assessment Type Filter */}
      {typeDropdownOpen &&
        createPortal(
          <div
            ref={typeDropdownRef}
            className="filter-dropdown pointer-events-auto fixed flex w-56 flex-col space-y-1.5 rounded-2xl border border-gray-200 bg-white p-3.5 text-xs shadow-xl dark:border-gray-800 dark:bg-gray-900"
            style={{
              top: `${typeDropdownPos.top}px`,
              left: `${typeDropdownPos.left}px`,
              zIndex: 99999,
              maxHeight: "360px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 border-b border-gray-100 pb-2 dark:border-gray-800">
              <label
                className="flex cursor-pointer items-center font-bold text-xs text-gray-800 dark:text-gray-200 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSelectType("all")}
              >
                <input
                  type="checkbox"
                  checked={currentCategory === "all"}
                  readOnly
                  className="mr-2.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                />
                Select All
              </label>
            </div>

            <div className="space-y-1.5">
              {ASSESSMENT_TYPES.map((t) => {
                const isChecked =
                  getCanonicalAssessmentType(currentCategory) ===
                  getCanonicalAssessmentType(t.value);
                return (
                  <label
                    key={t.value}
                    onClick={() => handleSelectType(t.value)}
                    className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="mr-2.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                    />
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold uppercase border ${t.style}`}
                    >
                      {t.label}
                    </span>
                  </label>
                );
              })}
            </div>

            {isTypeFiltered && (
              <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => handleSelectType("all")}
                  className="w-full py-1 text-center font-bold text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Portal Modal: Mode Filter */}
      {modeDropdownOpen &&
        createPortal(
          <div
            ref={modeDropdownRef}
            className="filter-dropdown pointer-events-auto fixed flex w-52 flex-col space-y-1.5 rounded-2xl border border-gray-200 bg-white p-3.5 text-xs shadow-xl dark:border-gray-800 dark:bg-gray-900"
            style={{
              top: `${modeDropdownPos.top}px`,
              left: `${modeDropdownPos.left}px`,
              zIndex: 99999,
              maxHeight: "360px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 border-b border-gray-100 pb-2 dark:border-gray-800">
              <label
                className="flex cursor-pointer items-center font-bold text-xs text-gray-800 dark:text-gray-200 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSelectMode("all")}
              >
                <input
                  type="checkbox"
                  checked={currentMode === "all"}
                  readOnly
                  className="mr-2.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                />
                Select All
              </label>
            </div>

            <div className="space-y-1.5">
              {MODE_TYPES.map((m) => {
                const isChecked =
                  getCanonicalMode(currentMode) === getCanonicalMode(m.value);
                const Icon = m.icon;
                return (
                  <label
                    key={m.value}
                    onClick={() => handleSelectMode(m.value)}
                    className="flex cursor-pointer items-center rounded px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="mr-2.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                    />
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${m.color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{m.label}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {isModeFiltered && (
              <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => handleSelectMode("all")}
                  className="w-full py-1 text-center font-bold text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Portal Modal: Status Filter */}
      {statusDropdownOpen &&
        createPortal(
          <div
            ref={statusDropdownRef}
            className="filter-dropdown pointer-events-auto fixed flex w-52 flex-col space-y-1.5 rounded-2xl border border-gray-200 bg-white p-3.5 text-xs shadow-xl dark:border-gray-800 dark:bg-gray-900"
            style={{
              top: `${statusDropdownPos.top}px`,
              left: `${statusDropdownPos.left}px`,
              zIndex: 99999,
              maxHeight: "360px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 border-b border-gray-100 pb-2 dark:border-gray-800">
              <label
                className="flex cursor-pointer items-center font-bold text-xs text-gray-800 dark:text-gray-200 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSelectStatus("all")}
              >
                <input
                  type="checkbox"
                  checked={currentStatus === "all"}
                  readOnly
                  className="mr-2.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                />
                Select All
              </label>
            </div>

            <div className="space-y-1.5">
              {STATUS_TYPES.map((s) => {
                const isChecked =
                  getCanonicalStatus(currentStatus) ===
                  getCanonicalStatus(s.value);
                return (
                  <label
                    key={s.value}
                    onClick={() => handleSelectStatus(s.value)}
                    className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="mr-2.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                    />
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold uppercase border ${s.style}`}
                    >
                      {s.label}
                    </span>
                  </label>
                );
              })}
            </div>

            {isStatusFiltered && (
              <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => handleSelectStatus("all")}
                  className="w-full py-1 text-center font-bold text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Portal Modal: Date Filter */}
      {dateDropdownOpen &&
        createPortal(
          <div
            ref={dateDropdownRef}
            className="filter-dropdown pointer-events-auto fixed flex w-60 flex-col space-y-2.5 rounded-2xl border border-gray-200 bg-white p-3.5 text-xs shadow-xl dark:border-gray-800 dark:bg-gray-900"
            style={{
              top: `${dateDropdownPos.top}px`,
              left: `${dateDropdownPos.left}px`,
              zIndex: 99999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <select
                value={currentDateOperator}
                onChange={(e) => handleDateOperatorChange(e.target.value)}
                className="w-full rounded-lg border border-blue-400 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-blue-500 dark:bg-gray-800 dark:text-gray-100 font-medium"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not equals</option>
                <option value="less_than">Less than</option>
                <option value="greater_than">Greater than</option>
                <option value="in_range">In range</option>
              </select>
            </div>

            <div>
              <input
                type="date"
                value={currentDateValue}
                onChange={(e) => handleDateValueChange(e.target.value)}
                className="w-full rounded-lg border border-blue-400 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {currentDateOperator === "in_range" && (
              <div>
                <input
                  type="date"
                  placeholder="To"
                  value={currentDateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="w-full rounded-lg border border-blue-400 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}

            <div className="flex justify-end pt-1 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={handleResetDateFilter}
                className="rounded border border-blue-500 px-3.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/50 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
