"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { EditModal } from "@/components/EditModal";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";

/**
 * Formats API error messages into user-friendly format
 * @param error - The error object from API response
 * @returns Formatted error message string
 */
function formatErrorMessage(error: any): string {
  if (!error) {
    return "An unknown error occurred";
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle array of validation errors (Pydantic format)
  if (Array.isArray(error)) {
    const validationErrors = error.filter(item =>
      item.type && item.msg && item.loc
    );

    if (validationErrors.length > 0) {
      const fieldErrors = validationErrors.map(err => {
        const fieldName = err.loc[err.loc.length - 1];
        return `${fieldName}: ${err.msg}`;
      });
      return `Validation failed:\n- ${fieldErrors.join('\n- ')}`;
    }
  }

  // Handle single error objects
  if (error.detail) {
    return error.detail;
  }

  if (error.message) {
    return error.message;
  }

  // Handle body with detail
  if (error.body && error.body.detail) {
    return error.body.detail;
  }

  // Handle body as string
  if (error.body && typeof error.body === "string") {
    return error.body;
  }

  // Fallback to JSON stringify for complex objects
  try {
    return JSON.stringify(error);
  } catch {
    return "An error occurred while processing the request";
  }
}

const JobNameRenderer = (params: any) => {
  const name = params.value;
  if (!name || name === null || name === undefined) return "[Job Type Missing]";
  return name.toString();
};

const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const dateStr = params.value?.slice(0, 10);
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "/");
};

const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
};


interface JobType {
  id: number;
  name: string;
  unique_id: string;
  job_owner: string | null;
  description: string | null;
  notes: string | null;
  lastmod_date_time: string | null;
  lastmod_user_name: string | null;
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
  employee_id: number | null;
  activity_date: string;
  activity_count: number;
  notes: string | null;
  last_mod_date: string;
  lastmod_user_name: string | null;
  job_name: string;
  candidate_name: string | null;
  employee_name: string | null;
}

export default function JobActivityLogPage() {
  const [logs, setLogs] = useState<JobActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<JobActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const fetchLogs = async (showSuccessToast = false) => {
    try {
      if (showSuccessToast === true) {
        setLoading(true);
      }
      setError("");
      const data = await apiFetch("/api/job_activity_logs");
      const arr = Array.isArray(data) ? data : data?.data || [];

      // Sort by ID descending to show newest first
      const sorted = arr.sort((a: any, b: any) => b.id - a.id);

      setLogs(sorted);
      setFilteredLogs(sorted);

      if (showSuccessToast) {
        toast.success("Data refreshed successfully");
      }
    } catch (e: any) {
      const formattedError = formatErrorMessage(e);
      setError(formattedError);
      toast.error(formattedError);
    } finally {
      if (showSuccessToast === true) {
        setLoading(false);
      }
    }
  };

  const fetchJobTypes = async () => {
    try {
      const data = await apiFetch("/api/job-types");
      const jobTypesArray = Array.isArray(data) ? data : [];
      setJobTypes(jobTypesArray);
    } catch (e: any) {
      toast.error("Failed to load job types");
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await apiFetch("/api/employees");
      const arr = Array.isArray(data) ? data : data?.data || [];
      setEmployees(arr);
    } catch (e: any) {
      toast.error("Failed to load employees");
    }
  };

  const fetchCandidates = async () => {
    try {
      const data = await apiFetch("/api/candidates");
      const arr = Array.isArray(data) ? data : data?.data || [];
      setCandidates(arr);
    } catch (e: any) {
      toast.error("Failed to load candidates");
    }
  };

  useEffect(() => {
    fetchLogs(true);
    fetchJobTypes();
    fetchEmployees();
    fetchCandidates();
  }, []);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredLogs(logs);
      return;
    }

    const filtered = logs.filter(
      (log) =>
        log.job_name?.toLowerCase().includes(term) ||
        log.employee_name?.toLowerCase().includes(term) ||
        log.candidate_name?.toLowerCase().includes(term) ||
        log.activity_date?.toLowerCase().includes(term) ||
        log.notes?.toLowerCase().includes(term)
    );
    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

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
        filter: "agSetColumnFilter",
        filterParams: {
          values: jobTypes.map(job => job.name),
          valueListGap: 0,
          valueListMaxHeight: 220,
        },
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
        field: "last_mod_date",
        headerName: "Last Modified",
        width: 180,
        valueFormatter: DateFormatter,
        editable: false,
        filter: "agDateColumnFilter",
      },
      {
        field: "lastmod_user_name",
        headerName: "Last Modified By",
        width: 200,
        editable: false,
      },
      {
        field: "notes",
        headerName: "Notes",
        width: 300,
        editable: true,
        cellRenderer: (params) => stripHtml(params.value || ""),
        cellEditor: 'agLargeTextCellEditor',
        cellEditorParams: {
          maxLength: 10000,
          rows: 3,
          cols: 50
        },
      },
    ],
    [jobTypes]
  );

  const handleRowUpdated = async (updatedRow: JobActivityLog) => {
    // Construct payload with all updatable fields
    const payload: any = {};

    // Handle job_id (from job_name conversion in EditModal)
    if (updatedRow.job_id !== undefined) {
      payload.job_id = updatedRow.job_id;
    }

    // Handle candidate_id (from candidate_name conversion in EditModal)
    if (updatedRow.candidate_id !== undefined) {
      payload.candidate_id = updatedRow.candidate_id;
    }

    // Handle employee_id (from employee_name conversion in EditModal)
    if (updatedRow.employee_id !== undefined) {
      payload.employee_id = updatedRow.employee_id;
    }

    // Handle activity_date
    if (updatedRow.activity_date !== undefined) {
      payload.activity_date = updatedRow.activity_date;
    }

    // Handle activity_count
    if (updatedRow.activity_count !== undefined) {
      payload.activity_count = updatedRow.activity_count;
    }

    // Handle notes
    if (updatedRow.notes !== undefined) {
      payload.notes = updatedRow.notes;
    }

    // If no fields to update, return early
    if (Object.keys(payload).length === 0) {
      console.warn("No fields to update for job activity log:", updatedRow.id);
      return;
    }

    console.log("Updating job activity log:", updatedRow.id, payload);
    try {
      await apiFetch(`/api/job_activity_logs/${updatedRow.id}`, {
        method: "PUT",
        body: payload,
      });

      await fetchLogs(false);
      toast.success("Log updated successfully");
    } catch (error: any) {
      console.error("Error updating job activity log:", error);
      const errorMsg =
        error?.body?.detail ||
        error?.detail ||
        error?.message ||
        error?.body ||
        "Failed to update log";
      toast.error(
        typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)
      );
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await apiFetch(`/api/job_activity_logs/${id}`, { method: "DELETE" });

      setFilteredLogs((prev) => prev.filter((row) => row.id !== id));
      setLogs((prev) => prev.filter((row) => row.id !== id));
      toast.success(`Log ${id} deleted successfully`);
    } catch (error: any) {
      const errorMsg =
        error?.body?.detail ||
        error?.detail ||
        error?.message ||
        error?.body ||
        "Failed to delete log";
      toast.error(
        typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)
      );
    }
  };

  // Add state for add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddJobActivityLog = () => {
    setIsAddModalOpen(true);
  };

  const handleAddSave = async (newData: any) => {
    try {
      let jobId = null;
      let candidateId = null;
      let employeeId = null;

      if (newData.job_id !== undefined && newData.job_id !== null && newData.job_id !== "") {
        if (typeof newData.job_id === "number") {
          jobId = newData.job_id;
        } else if (typeof newData.job_id === "string") {
          const parsed = parseInt(newData.job_id);
          if (!isNaN(parsed)) {
            jobId = parsed;
          }
        }
      }

      if (newData.candidate_id !== undefined && newData.candidate_id !== null && newData.candidate_id !== "") {
        if (typeof newData.candidate_id === "number") {
          candidateId = newData.candidate_id;
        } else if (typeof newData.candidate_id === "string") {
          const parsed = parseInt(newData.candidate_id);
          if (!isNaN(parsed)) {
            candidateId = parsed;
          }
        }
      }

      if (newData.employee_id !== undefined && newData.employee_id !== null && newData.employee_id !== "") {
        if (typeof newData.employee_id === "number") {
          employeeId = newData.employee_id;
        } else if (typeof newData.employee_id === "string") {
          const parsed = parseInt(newData.employee_id);
          if (!isNaN(parsed)) {
            employeeId = parsed;
          }
        }
      }

      const payload = {
        job_id: jobId,
        candidate_id: candidateId,
        employee_id: employeeId,
        activity_date: newData.activity_date?.trim() || new Date().toISOString().split('T')[0],
        activity_count: parseInt(newData.activity_count) || 0,
        notes: newData.notes?.trim() || "",
      };

      // Validate required fields
      if (!payload.job_id) {
        toast.error("Job is required");
        return;
      }
      if (!payload.activity_date) {
        toast.error("Activity Date is required");
        return;
      }

      await apiFetch("/api/job_activity_logs", {
        method: "POST",
        body: payload,
      });

      await fetchLogs(false);
      toast.success("Job activity log created successfully");
      setIsAddModalOpen(false);
    } catch (e: any) {
      let errorMsg = "Failed to create job activity log";
      if (e?.body?.detail) {
        errorMsg = e.body.detail;
      } else if (e?.detail) {
        errorMsg = e.detail;
      } else if (e?.message) {
        errorMsg = e.message;
      } else if (typeof e?.body === "string") {
        errorMsg = e.body;
      }
      toast.error(errorMsg);
    }
  };

  // Get initial data for add modal
  const getAddInitialData = () => {
    return {
      id: "",
      job_id: "",
      job_name: "",
      candidate_id: "",
      candidate_name: "",
      employee_id: "",
      employee_name: "",
      activity_date: new Date().toISOString().split('T')[0],
      activity_count: "",
      notes: "",
      last_mod_date: "",
      lastmod_user_name: "",
    };
  };

  if (loading) return <p className="mt-8 text-center">Loading...</p>;
  if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Activity Log</h1>
          <p>Manage all job activity logs here.</p>
        </div>
      </div>

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
        onAddClick={handleAddJobActivityLog}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />

      {/* Add Modal for Job Activity Logs */}
      {isAddModalOpen && (
        <EditModal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddSave}
          data={getAddInitialData()}
          title="Job Activity Log"
          batches={[]}
          isAddMode={true}
        />
      )}
    </div>
  );
}
