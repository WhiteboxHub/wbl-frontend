"use client";

import React, { useEffect, useState } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { Input } from "@/components/admin_ui/input";
import { SearchIcon, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin_ui/select";
import { Label } from "@/components/admin_ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin_ui/dialog";
import { Button } from "@/components/admin_ui/button";
import { apiFetch } from "@/lib/api.js";

const AGGridTable = dynamic(() => import("@/components/AGGridTable"), {
  ssr: false,
});

const formatDateFromDB = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
};

const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const dateStr = formatDateFromDB(params.value);
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "/");
};

const DateTimeFormatter = (params: any) =>
  params.value
    ? new Date(params.value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// Job Name Renderer - formats job names with spaces and title case
const JobNameRenderer = (params: any) => {
  const name = params.value;
  if (!name) return "";
  return name;
};

// Yes/No Filter Header Component
const YesNoFilterHeaderComponent = (props: any) => {
  const { selectedValues, setSelectedValues, fieldName } = props;
  const filterButtonRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = React.useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [filterVisible, setFilterVisible] = React.useState(false);

  const options = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  const toggleFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 200; // estimated max height
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top: number;
      if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
        top = rect.bottom + window.scrollY;
      } else {
        top = rect.top + window.scrollY - dropdownHeight;
      }

      setDropdownPos({
        top: Math.max(10, top),
        left: Math.max(10, rect.left + window.scrollX - 100),
      });
    }
    setFilterVisible((v) => !v);
  };

  const handleValueChange = (
    value: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
    setSelectedValues((prev: string[]) => {
      const isSelected = prev.includes(value);
      return isSelected ? prev.filter((v) => v !== value) : [...prev, value];
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedValues(options.map((opt) => opt.value));
    } else {
      setSelectedValues([]);
    }
  };

  const isAllSelected = selectedValues.length === options.length;
  const isIndeterminate =
    selectedValues.length > 0 && selectedValues.length < options.length;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFilterVisible(false);
      }
    };
    const handleScroll = () => setFilterVisible(false);

    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  return (
    <div className="relative flex w-full items-center">
      <span className="mr-2 flex-grow">{fieldName}</span>

      <div
        ref={filterButtonRef}
        className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={toggleFilter}
      >
        {selectedValues.length > 0 &&
          selectedValues.length < options.length && (
            <span className="text-primary-foreground min-w-[20px] rounded-full bg-primary px-2 py-0.5 text-center text-xs font-medium">
              {selectedValues.length}
            </span>
          )}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground h-4 w-4 hover:text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
          />
        </svg>
      </div>

      {filterVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 pointer-events-auto fixed z-50 flex w-64 flex-col space-y-2 overflow-hidden rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              maxHeight: "200px",
              overflowY: "auto",
              animationFillMode: "forwards",
            }}
            onClick={(e) => e.stopPropagation()}
            data-state="open"
          >
            <div className="mb-2 border-b border-border pb-2">
              <label className="flex cursor-pointer items-center rounded px-2 py-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="mr-3 h-3.5 w-3.5"
                  onClick={(e) => e.stopPropagation()}
                />
                Select All
              </label>
            </div>

            {options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => handleValueChange(option.value, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3 h-3.5 w-3.5"
                />
                {option.label}
              </label>
            ))}

            {selectedValues.length > 0 &&
              selectedValues.length < options.length && (
                <div className="mt-2 border-t border-border pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedValues([]);
                    }}
                    className="flex w-full cursor-pointer items-center rounded px-2 py-1 text-sm text-destructive hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-destructive"
                  >
                    Clear All
                  </button>
                </div>
              )}
          </div>,
          document.body
        )}
    </div>
  );
};

// Job Type Filter Header Component
const JobTypeFilterHeaderComponent = (props: any) => {
  const { selectedJobTypes, setSelectedJobTypes, jobTypes } = props;
  const filterButtonRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = React.useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [filterVisible, setFilterVisible] = React.useState(false);

  const toggleFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 400; // estimated max height
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top: number;
      if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
        // Show below
        top = rect.bottom + window.scrollY;
      } else {
        // Show above
        top = rect.top + window.scrollY - dropdownHeight;
      }

      setDropdownPos({
        top: Math.max(10, top), // Ensure at least 10px from top
        left: Math.max(10, rect.left + window.scrollX - 100), // Ensure at least 10px from left
      });
    }
    setFilterVisible((v) => !v);
  };

  const handleJobTypeChange = (
    jobTypeId: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
    setSelectedJobTypes((prev: number[]) => {
      const isSelected = prev.includes(jobTypeId);
      return isSelected
        ? prev.filter((id) => id !== jobTypeId)
        : [...prev, jobTypeId];
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedJobTypes(jobTypes.map((jt: any) => jt.id));
    } else {
      setSelectedJobTypes([]);
    }
  };

  const isAllSelected =
    selectedJobTypes.length === jobTypes.length && jobTypes.length > 0;
  const isIndeterminate =
    selectedJobTypes.length > 0 && selectedJobTypes.length < jobTypes.length;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFilterVisible(false);
      }
    };
    const handleScroll = () => setFilterVisible(false);

    if (filterVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [filterVisible]);

  return (
    <div className="relative flex w-full items-center">
      <span className="mr-2 flex-grow">Job Type</span>

      <div
        ref={filterButtonRef}
        className="flex cursor-pointer items-center gap-1 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={toggleFilter}
      >
        {selectedJobTypes.length > 0 &&
          selectedJobTypes.length < jobTypes.length && (
            <span className="text-primary-foreground min-w-[20px] rounded-full bg-primary px-2 py-0.5 text-center text-xs font-medium">
              {selectedJobTypes.length}
            </span>
          )}

        {/* Funnel icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground h-4 w-4 hover:text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
          />
        </svg>
      </div>

      {filterVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 pointer-events-auto fixed z-50 flex w-64 flex-col space-y-2 overflow-hidden rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
            style={{
              top: dropdownPos.top + 5,
              left: dropdownPos.left,
              maxHeight: "400px",
              overflowY: "auto",
              animationFillMode: "forwards",
            }}
            onClick={(e) => e.stopPropagation()}
            data-state="open"
          >
            <div className="mb-2 border-b border-border pb-2">
              <label className="flex cursor-pointer items-center rounded px-2 py-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="mr-3 h-3.5 w-3.5"
                  onClick={(e) => e.stopPropagation()}
                />
                Select All
              </label>
            </div>

            {jobTypes.map((jobType: any) => (
              <label
                key={jobType.id}
                className="flex cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedJobTypes.includes(jobType.id)}
                  onChange={(e) => handleJobTypeChange(jobType.id, e)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3 h-3.5 w-3.5"
                />
                {jobType.job_name}
              </label>
            ))}

            {selectedJobTypes.length > 0 &&
              selectedJobTypes.length < jobTypes.length && (
                <div className="mt-2 border-t border-border pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJobTypes([]);
                    }}
                    className="flex w-full cursor-pointer items-center rounded px-2 py-1 text-sm text-destructive hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-destructive"
                  >
                    Clear All
                  </button>
                </div>
              )}
          </div>,
          document.body
        )}
    </div>
  );
};

interface JobType {
  id: number;
  job_name: string;
  job_description: string | null;
}

interface Employee {
  id: number;
  name: string;
  email: string;
}

interface Candidate {
  id: number;
  full_name: string;
}

interface JobActivityLog {
  id: number;
  job_id: number;
  candidate_id: number | null;
  employee_id: number;
  activity_date: string;
  activity_count: number;
  json_downloaded: "yes" | "no";
  sql_downloaded: "yes" | "no";
  last_mod_date: string;
  job_name: string;
  candidate_name: string | null;
  employee_name: string;
}

export default function JobActivityLogPage() {
  const [logs, setLogs] = useState<JobActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<JobActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<number[]>([]);
  const [selectedJsonDownloaded, setSelectedJsonDownloaded] = useState<
    string[]
  >([]);
  const [selectedSqlDownloaded, setSelectedSqlDownloaded] = useState<string[]>(
    []
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [formData, setFormData] = useState({
    job_id: "",
    candidate_id: "",
    employee_id: "",
    activity_date: new Date().toISOString().split("T")[0],
    activity_count: 0,
    json_downloaded: "no" as "yes" | "no",
    sql_downloaded: "no" as "yes" | "no",
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/job_activity_logs");
      const arr = Array.isArray(data) ? data : data?.data || [];

      // Sort by ID descending to show newest first
      const sorted = arr.sort((a: any, b: any) => b.id - a.id);

      setLogs(sorted);
      setFilteredLogs(sorted);
    } catch (e: any) {
      setError(e?.message || e?.body || "Failed to load job activity logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobTypes = async () => {
    try {
      const data = await apiFetch("/job-types");
      const jobTypesArray = Array.isArray(data) ? data : [];
      setJobTypes(jobTypesArray);

      // Don't set default job type - show all logs by default
      // Users can manually filter if needed
    } catch (e: any) {
      console.error("Failed to load job types:", e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await apiFetch("/employees");
      const arr = Array.isArray(data) ? data : data?.data || [];
      setEmployees(arr);
    } catch (e: any) {
      console.error("Failed to load employees:", e);
    }
  };

  const fetchCandidates = async () => {
    try {
      const data = await apiFetch("/candidates");
      const arr = Array.isArray(data) ? data : data?.data || [];
      setCandidates(arr);
    } catch (e: any) {
      console.error("Failed to load candidates:", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchJobTypes();
    fetchEmployees();
    fetchCandidates();
  }, []);

  useEffect(() => {
    let filtered = logs;

    // Filter by job types (if any selected)
    if (selectedJobTypes.length > 0) {
      filtered = filtered.filter((log) =>
        selectedJobTypes.includes(log.job_id)
      );
    }

    // Filter by JSON Downloaded (if any selected)
    if (selectedJsonDownloaded.length > 0) {
      filtered = filtered.filter((log) =>
        selectedJsonDownloaded.includes(log.json_downloaded)
      );
    }

    // Filter by SQL Downloaded (if any selected)
    if (selectedSqlDownloaded.length > 0) {
      filtered = filtered.filter((log) =>
        selectedSqlDownloaded.includes(log.sql_downloaded)
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.job_name?.toLowerCase().includes(term) ||
          log.employee_name?.toLowerCase().includes(term) ||
          log.candidate_name?.toLowerCase().includes(term) ||
          log.activity_date?.toLowerCase().includes(term)
      );
    }
    setFilteredLogs(filtered);
  }, [
    logs,
    searchTerm,
    selectedJobTypes,
    selectedJsonDownloaded,
    selectedSqlDownloaded,
  ]);

  const columnDefs: ColDef[] = React.useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 100,
        pinned: "left",
        editable: false,
      },
      {
        field: "job_name",
        headerName: "Job Name",
        width: 250,
        editable: false,
        cellRenderer: JobNameRenderer,
        headerComponent: JobTypeFilterHeaderComponent,
        headerComponentParams: {
          selectedJobTypes,
          setSelectedJobTypes,
          jobTypes,
        },
      },
      {
        field: "employee_name",
        headerName: "Employee",
        width: 200,
        editable: false,
      },
      {
        field: "candidate_name",
        headerName: "Candidate",
        width: 200,
        editable: false,
      },
      {
        field: "activity_date",
        headerName: "Activity Date",
        width: 150,
        valueFormatter: DateFormatter,
        filter: "agDateColumnFilter",
        editable: false,
      },
      {
        field: "activity_count",
        headerName: "Activity Count",
        width: 150,
        editable: true,
      },
      {
        field: "json_downloaded",
        headerName: "JSON Downloaded",
        width: 180,
        editable: true,
        cellRenderer: (params: any) => (params.value === "yes" ? "Yes" : "No"),
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["yes", "no"],
        },
        headerComponent: YesNoFilterHeaderComponent,
        headerComponentParams: {
          selectedValues: selectedJsonDownloaded,
          setSelectedValues: setSelectedJsonDownloaded,
          fieldName: "JSON Downloaded",
        },
      },
      {
        field: "sql_downloaded",
        headerName: "SQL Downloaded",
        width: 180,
        editable: true,
        cellRenderer: (params: any) => (params.value === "yes" ? "Yes" : "No"),
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["yes", "no"],
        },
        headerComponent: YesNoFilterHeaderComponent,
        headerComponentParams: {
          selectedValues: selectedSqlDownloaded,
          setSelectedValues: setSelectedSqlDownloaded,
          fieldName: "SQL Downloaded",
        },
      },
      {
        field: "last_mod_date",
        headerName: "Last Modified",
        width: 180,
        valueFormatter: DateFormatter,
        editable: false,
        filter: "agDateColumnFilter",
      },
    ],
    [selectedJobTypes, jobTypes, selectedJsonDownloaded, selectedSqlDownloaded]
  );

  const handleRowUpdated = async (updatedRow: JobActivityLog) => {
    const payload = {
      activity_count: updatedRow.activity_count,
      json_downloaded: updatedRow.json_downloaded,
      sql_downloaded: updatedRow.sql_downloaded,
    };
    try {
      await apiFetch(`/job_activity_logs/${updatedRow.id}`, {
        method: "PUT",
        body: payload,
      });
      // Update both logs and filteredLogs to maintain consistency
      setLogs((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
      );
      setFilteredLogs((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
      );
    } catch (error: any) {
      console.error("Update failed", error);
      alert(error?.message || error?.body || "Failed to update log");
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await apiFetch(`/job_activity_logs/${id}`, { method: "DELETE" });
      setFilteredLogs((prev) => prev.filter((row) => row.id !== id));
      setLogs((prev) => prev.filter((row) => row.id !== id));
    } catch (error: any) {
      console.error("Delete failed", error);
      alert(error?.message || error?.body || "Failed to delete log");
    }
  };

  const handleAddLog = async (newData: any) => {
    // Validate required fields
    if (!newData.job_id || !newData.employee_id || !newData.activity_date) {
      alert(
        "Please fill in all required fields: Job Type, Employee, and Activity Date"
      );
      throw new Error("Missing required fields");
    }

    let cleanDate = newData.activity_date;
    if (typeof cleanDate === "string") {
      cleanDate = cleanDate.split("T")[0]; // Remove time part if exists
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        alert("Invalid date format. Please use YYYY-MM-DD format");
        throw new Error("Invalid date format");
      }
    }

    const payload = {
      job_id: parseInt(newData.job_id) || parseInt(newData.job_name) || null,
      employee_id:
        parseInt(newData.employee_id) ||
        parseInt(newData.employee_name) ||
        null,
      candidate_id: newData.candidate_id
        ? parseInt(newData.candidate_id)
        : null,
      activity_date: cleanDate,
      activity_count: parseInt(newData.activity_count) || 0,
      json_downloaded: newData.json_downloaded || "no",
      sql_downloaded: newData.sql_downloaded || "no",
    };

    // Final validation
    if (!payload.job_id || !payload.employee_id) {
      alert("Job Type and Employee are required");
      throw new Error("Missing required fields");
    }

    try {
      const result = await apiFetch("/job_activity_logs", {
        method: "POST",
        body: payload,
      });
      setLogs((prev) => [result, ...prev]);
      setFilteredLogs((prev) => [result, ...prev]);
      return result;
    } catch (error: any) {
      console.error("Create failed", error);
      const errorMsg =
        error?.detail ||
        error?.message ||
        error?.body ||
        "Failed to create log";
      alert(
        typeof errorMsg === "string"
          ? errorMsg
          : JSON.stringify(errorMsg, null, 2)
      );
      throw error;
    }
  };

  if (loading) return <p className="mt-8 text-center">Loading...</p>;
  if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Activity Log</h1>
          <p>Manage all job activity logs here.</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by job, employee, candidate, date..."
            className="pl-10"
          />
        </div>
      </div>

      {searchTerm && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredLogs.length} of {logs.length} logs
        </p>
      )}

      <AGGridTable
        rowData={filteredLogs}
        columnDefs={columnDefs}
        title={`Job Activity Logs (${filteredLogs.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
        onAddClick={() => setIsAddDialogOpen(true)}
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Add New Job Activity Log</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await handleAddLog(formData);
                setIsAddDialogOpen(false);
                setFormData({
                  job_id: "",
                  candidate_id: "",
                  employee_id: "",
                  activity_date: new Date().toISOString().split("T")[0],
                  activity_count: 0,
                  json_downloaded: "no",
                  sql_downloaded: "no",
                });
              } catch (error) {
                // Error already handled in handleAddLog
              }
            }}
            className="mt-4"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:gap-3 md:grid-cols-2 md:gap-5">
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block text-xs font-bold text-blue-700 sm:text-sm">
                  Job Type <span className="text-red-700">*</span>
                </label>
                <Select
                  value={formData.job_id || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, job_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((job) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.job_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee *</Label>
                <Select
                  value={formData.employee_id || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employee_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidate_id">Candidate</Label>
                <Select
                  value={formData.candidate_id || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, candidate_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((cand) => (
                      <SelectItem key={cand.id} value={cand.id.toString()}>
                        {cand.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity_date">Activity Date *</Label>
                <Input
                  id="activity_date"
                  type="date"
                  value={formData.activity_date}
                  onChange={(e) =>
                    setFormData({ ...formData, activity_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity_count">Activity Count</Label>
                <Input
                  id="activity_count"
                  type="number"
                  min="0"
                  value={formData.activity_count}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      activity_count: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="json_downloaded">JSON Downloaded</Label>
                  <Select
                    value={formData.json_downloaded}
                    onValueChange={(value: "yes" | "no") =>
                      setFormData({ ...formData, json_downloaded: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="sql_downloaded">SQL Downloaded</Label>
                  <Select
                    value={formData.sql_downloaded}
                    onValueChange={(value: "yes" | "no") =>
                      setFormData({ ...formData, sql_downloaded: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Log</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
