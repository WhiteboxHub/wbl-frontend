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

  // Convert to init case (capitalize first letter of each word)
  const initCaseName = name.toString()
    .split(/[\s_-]+/) // Split on spaces, underscores, or hyphens
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return initCaseName;
};

const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const dateStr = params.value?.slice(0, 10);
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "/");
};

export default function JobTypesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [filteredJobTypes, setFilteredJobTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getEmployeeName = (value) => {
    if (!value) return "Not Assigned";
    if (typeof value === "string") return value;
    const employee = employees.find((emp) => emp.id == value);
    return employee ? employee.name : `ID: ${value}`;
  };

  const getEmployeeIdByName = (name) => {
    if (!name || name === "Not Assigned") return null;
    const employee = employees.find((emp) => emp.name === name);
    return employee ? employee.id : null;
  };

  const fetchData = async (showSuccessToast = false) => {
    try {
      if (showSuccessToast === true) {
        setLoading(true);
      }
      setError("");

      const res = await apiFetch("/job-types");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sorted = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);

      const employeesRes = await apiFetch("/employees");
      const employeesArr = Array.isArray(employeesRes)
        ? employeesRes
        : employeesRes?.data ?? [];

      setJobTypes(sorted);
      setFilteredJobTypes(sorted);
      setEmployees(employeesArr);

      if (showSuccessToast) {
        toast.success("Data refreshed successfully");
      }
    } catch (e: any) {
      const msg =
        e?.body?.detail ||
        e?.detail ||
        e?.message ||
        e?.body ||
        "Failed to fetch data";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      if (showSuccessToast === true) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  const columnDefs: ColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      pinned: "left",
      editable: false,
    },
    {
      field: "name",
      headerName: "Name",
      width: 300,
      editable: true,
      cellRenderer: JobNameRenderer,
    },
    {
      field: "job_owner",
      headerName: "Job Owner",
      width: 200,
      editable: true,
      cellRenderer: (params) => {
        return getEmployeeName(params.value);
      },
      cellEditor: "agSelectCellEditor",
      cellEditorParams: (params) => {
        return {
          values: [
            "",
            ...employees
              .filter((emp) => emp.status === 1)
              .map((emp) => emp.id.toString()),
          ],
          valueListGap: 0,
          valueListMaxHeight: 220,
          // Format the dropdown display to show names
          formatValue: (value: any) => {
            if (!value || value === "") return "Not Assigned";
            const emp = employees.find(
              (e) => e.id.toString() === value.toString()
            );
            return emp ? emp.name : value;
          },
        };
      },
      valueFormatter: (params) => {
        return getEmployeeName(params.value);
      },
      valueSetter: (params) => {
        const newValue = params.newValue;
        if (newValue && newValue !== "") {
          const parsed = parseInt(newValue);
          params.data.job_owner = isNaN(parsed) ? null : parsed;
        } else {
          params.data.job_owner = null;
        }
        return true;
      },
    },
    {
      field: "unique_id",
      headerName: "Unique ID",
      width: 250,
      editable: true,
    },
    {
      field: "description",
      headerName: "Job Description",
      width: 410,
      editable: true,
    },
    {
      field: "lastmod_date_time",
      headerName: "Last Modified",
      width: 150,
      editable: false,
      filter: "agDateColumnFilter",
      valueFormatter: DateFormatter,
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
      width: 250,
      editable: true,
    },
  ];

  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return setFilteredJobTypes(jobTypes);

    const filtered = jobTypes.filter((row) => {
      const idMatch = row.id?.toString().includes(lower);
      const codeMatch = row.unique_id?.toLowerCase().includes(lower);
      const nameMatch = row.name?.toLowerCase().includes(lower);
      const ownerName =
        typeof row.job_owner === "string"
          ? row.job_owner
          : getEmployeeName(row.job_owner);
      const ownerMatch = ownerName.toLowerCase().includes(lower);
      const descMatch = row.description?.toLowerCase().includes(lower);
      const notesMatch = row.notes?.toLowerCase().includes(lower);

      return (
        idMatch ||
        codeMatch ||
        nameMatch ||
        ownerMatch ||
        descMatch ||
        notesMatch
      );
    });

    setFilteredJobTypes(filtered);
  }, [searchTerm, jobTypes, employees]);

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const payload: any = {};

      if (updatedRow.name !== undefined) payload.name = updatedRow.name;
      if (updatedRow.unique_id !== undefined)
        payload.unique_id = updatedRow.unique_id;
      if (updatedRow.description !== undefined)
        payload.description = updatedRow.description;
      if (updatedRow.notes !== undefined) payload.notes = updatedRow.notes;

      if (updatedRow.job_owner !== undefined) {
        if (typeof updatedRow.job_owner === "string") {
          payload.job_owner = getEmployeeIdByName(updatedRow.job_owner);
        } else {
          payload.job_owner = updatedRow.job_owner;
        }
      }

      await apiFetch(`/job-types/${updatedRow.id}`, {
        method: "PUT",
        body: payload,
      });

      await fetchData(false);
      toast.success("Job type updated successfully");
    } catch (e: any) {
      let errorMsg = "Failed to update job type";
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
      await fetchData(false);
    }
  };

  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/job-types/${id}`, { method: "DELETE" });

      const updated = jobTypes.filter((jt) => jt.id !== id);
      setJobTypes(updated);
      setFilteredJobTypes(updated);

      toast.success(`Job Type ${id} deleted successfully`);
    } catch (e: any) {
      let errorMsg = "Failed to delete job type";
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

  if (loading) return <p className="mt-8 text-center">Loading...</p>;
  if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Types</h1>
          <p>Manage all job types here.</p>
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
            let jobOwnerId = null;

            if (
              newRow.job_owner !== undefined &&
              newRow.job_owner !== null &&
              newRow.job_owner !== ""
            ) {
              if (typeof newRow.job_owner === "number") {
                jobOwnerId = newRow.job_owner;
              } else if (typeof newRow.job_owner === "string") {
                const parsed = parseInt(newRow.job_owner);
                if (!isNaN(parsed)) {
                  jobOwnerId = parsed;
                } else {
                  jobOwnerId = getEmployeeIdByName(newRow.job_owner);
                }
              }
            }

            const payload = {
              unique_id: newRow.unique_id?.trim() || "",
              name: newRow.name?.trim() || "",
              job_owner: jobOwnerId,
              description: newRow.description?.trim() || "",
              notes: newRow.notes?.trim() || "",
            };

            if (!payload.name || payload.name === "") {
              toast.error("Job Name is required");
              return;
            }
            if (!payload.unique_id || payload.unique_id === "") {
              toast.error("Unique ID is required");
              return;
            }
            if (!payload.job_owner) {
              toast.error("Job Owner is required");
              return;
            }

            await apiFetch("/job-types", {
              method: "POST",
              body: payload,
            });

            await fetchData(false);
            toast.success("Job type created successfully");
          } catch (e: any) {
            let errorMsg = "Failed to create job type";
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
        }}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}
