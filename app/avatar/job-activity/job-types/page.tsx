"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";

// Job Name Renderer - formats job names with spaces and title case
const JobNameRenderer = (params: any) => {
  const name = params.value;
  if (!name) return "";
  return name.toString();
};

export default function JobTypesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [filteredJobTypes, setFilteredJobTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AG Grid Columns
  const columnDefs: ColDef[] = [
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
      width: 300,
      editable: true,
      cellRenderer: JobNameRenderer,
    },
    {
      field: "job_description",
      headerName: "Job Description",
      width: 410,
      editable: true,
    },
    {
      field: "created_date",
      headerName: "Created Date",
      width: 200,
      editable: false,
    },
  ];

  // Fetch job types
  const fetchJobTypes = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiFetch("/job-types");
      const arr = Array.isArray(res) ? res : res?.data ?? [];

      const sorted = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);

      setJobTypes(sorted);
      setFilteredJobTypes(sorted);

      toast.success("Fetched job types successfully.");
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to fetch job types";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobTypes();
  }, []);

  // Search filter
  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return setFilteredJobTypes(jobTypes);

    const filtered = jobTypes.filter((row) => {
      const idMatch = row.id?.toString().includes(lower);
      const nameMatch = row.job_name?.toLowerCase().includes(lower);
      const descMatch = row.job_description?.toLowerCase().includes(lower);

      return idMatch || nameMatch || descMatch;
    });

    setFilteredJobTypes(filtered);
  }, [searchTerm, jobTypes]);

  // Update row
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await apiFetch(`/job-types/${updatedRow.id}`, {
        method: "PUT",
        body: updatedRow,
      });

      const updated = jobTypes
        .map((jt) => (jt.id === updatedRow.id ? updatedRow : jt))
        .slice()
        .sort((a, b) => b.id - a.id);

      setJobTypes(updated);
      setFilteredJobTypes(updated);

      toast.success("Row updated successfully.");
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to update job type";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  // Delete row
  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/job-types/${id}`, { method: "DELETE" });

      const updated = jobTypes.filter((jt) => jt.id !== id);
      setJobTypes(updated);
      setFilteredJobTypes(updated);

      toast.success(`Job Type ${id} deleted.`);
    } catch (e: any) {
      const msg = e?.body || e?.message || "Failed to delete job type";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  if (loading) return <p className="mt-8 text-center">Loading...</p>;
  if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Job Types</h1>
          <p>Manage all job types here.</p>
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
            placeholder="Search by Id, job name, or description..."
            className="pl-10"
          />
        </div>
      </div>

      <AGGridTable
        rowData={filteredJobTypes}
        columnDefs={columnDefs}
        title={`Job Types (${filteredJobTypes.length})`}
        height="calc(70vh)"
        onRowAdded={async (newRow: any) => {
          try {
            const payload = {
              job_name: newRow.job_name || "",
              job_description: newRow.job_description || "",
            };

            if (!payload.job_name) {
              toast.error("Job Name is required");
              return;
            }

            const res = await apiFetch("/job-types", {
              method: "POST",
              body: payload,
            });

            const created = Array.isArray(res) ? res : res?.data ?? res;
            const updated = [created, ...jobTypes]
              .slice()
              .sort((a: any, b: any) => b.id - a.id);

            setJobTypes(updated);
            setFilteredJobTypes(updated);

            toast.success("Job Type created");
          } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to create job type";
            toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
          }
        }}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}
