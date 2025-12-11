"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";

const JobNameRenderer = (params: any) => {
  const name = params.value;
  if (!name) return "";
  return name.toString();
};

const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const dateStr = params.value?.slice(0, 10);
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "/");
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
  candidate_id: number | null;
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
      setLoading(true);
      setError("");
      const data = await apiFetch("/job_activity_logs");
      const arr = Array.isArray(data) ? data : data?.data || [];

      // Sort by ID descending to show newest first
      const sorted = arr.sort((a: any, b: any) => b.id - a.id);

      setLogs(sorted);
      setFilteredLogs(sorted);

      if (showSuccessToast) {
        toast.success("Data refreshed successfully");
      }
    } catch (e: any) {
      const errorMsg =
        e?.body?.detail ||
        e?.detail ||
        e?.message ||
        e?.body ||
        "Failed to load job activity logs";
      setError(
        typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)
      );
      toast.error(
        typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchJobTypes = async () => {
    try {
      const data = await apiFetch("/job-types");
      const jobTypesArray = Array.isArray(data) ? data : [];
      setJobTypes(jobTypesArray);
    } catch (e: any) {
      toast.error("Failed to load job types");
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await apiFetch("/employees");
      const arr = Array.isArray(data) ? data : data?.data || [];
      setEmployees(arr);
    } catch (e: any) {
      toast.error("Failed to load employees");
    }
  };

  const fetchCandidates = async () => {
    try {
      const data = await apiFetch("/candidates");
      const arr = Array.isArray(data) ? data : data?.data || [];
      setCandidates(arr);
    } catch (e: any) {
      toast.error("Failed to load candidates");
    }
  };

  useEffect(() => {
    fetchLogs();
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
        field: "notes",
        headerName: "Notes",
        width: 300,
        editable: true,
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
        headerName: "Last Mod User",
        width: 150,
        editable: false,
      },
    ],
    [jobTypes]
  );

  const handleRowUpdated = async (updatedRow: JobActivityLog) => {
    const payload = {
      activity_count: updatedRow.activity_count,
      notes: updatedRow.notes,
    };
    try {
      await apiFetch(`/job_activity_logs/${updatedRow.id}`, {
        method: "PUT",
        body: payload,
      });

      await fetchLogs(false);
      toast.success("Log updated successfully");
    } catch (error: any) {
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
      await apiFetch(`/job_activity_logs/${id}`, { method: "DELETE" });

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
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}
