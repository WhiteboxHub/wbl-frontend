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
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

const JobNameRenderer = (params: any) => {
  const name = params.value;
  if (!name) return "";

  // Convert to init case (capitalize first letter of each word)
  const initCaseName = name.toString()
    .split(/[\s_-]+/)
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
  const showLoader = useMinimumLoadingTime(loading);
  const [error, setError] = useState("");

  const getEmployeeName = (value: any, list?: any[]) => {
    const empList = list || employees;
    if (!value || value === null || value === "") return "Not Assigned";
    const id = typeof value === "string" ? parseInt(value) : value;
    if (isNaN(id)) return value;
    const employee = empList.find((emp) => emp.id == id);
    return employee ? employee.name : "Not Assigned";
  };



  const fetchData = async (showSuccessToast = false) => {
    try {
      if (showSuccessToast === true) {
        setLoading(true);
      }
      setError("");

      const res = await apiFetch("/api/job-types");
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const sorted = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);

      const employeesRes = await apiFetch("/api/employees");
      const employeesArr = Array.isArray(employeesRes)
        ? employeesRes
        : employeesRes?.data ?? [];

      setEmployees(employeesArr);

      // Enrich job types with names for display/view mode
      const enriched = sorted.map((row: any) => ({
        ...row,
        job_owner_1_name: getEmployeeName(row.job_owner_1, employeesArr),
        job_owner_2_name: getEmployeeName(row.job_owner_2, employeesArr),
        job_owner_3_name: getEmployeeName(row.job_owner_3, employeesArr),
      }));

      setJobTypes(enriched);
      setFilteredJobTypes(enriched);

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

  // AG Grid Columns - UPDATE job_owner column
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
      editable: false,
      cellRenderer: JobNameRenderer,
    },
    {
      field: "job_owner_1_name",
      headerName: "Job Owner 1",
      width: 200,
      editable: false,
      cellRenderer: (params: any) => {
        const val = params.value;
        if (val && val !== "Not Assigned") return val;
        return getEmployeeName(params.data.job_owner_1);
      },
    },
    {
      field: "job_owner_2_name",
      headerName: "Job Owner 2",
      width: 200,
      editable: false,
      cellRenderer: (params: any) => {
        const val = params.value;
        if (val && val !== "Not Assigned") return val;
        return getEmployeeName(params.data.job_owner_2);
      },
    },
    {
      field: "job_owner_3_name",
      headerName: "Job Owner 3",
      width: 200,
      editable: false,
      cellRenderer: (params: any) => {
        const val = params.value;
        if (val && val !== "Not Assigned") return val;
        return getEmployeeName(params.data.job_owner_3);
      },
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      editable: false,
      cellRenderer: (params) => {
        const val = params.value || "manual";
        return val.charAt(0).toUpperCase() + val.slice(1);
      },
    },
    {
      field: "unique_id",
      headerName: "Unique ID",
      width: 300,
      editable: true,
    },
    {
      field: "description",
      headerName: "Job Description",
      width: 410,
      editable: false,
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
      editable: false,
    },
  ];

  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return setFilteredJobTypes(jobTypes);

    const filtered = jobTypes.filter((row) => {
      const idMatch = row.id?.toString().includes(lower);
      const codeMatch = row.unique_id?.toLowerCase().includes(lower);
      const nameMatch = row.name?.toLowerCase().includes(lower);
      const owner1Name = row.job_owner_1_name || getEmployeeName(row.job_owner_1);
      const owner2Name = row.job_owner_2_name || getEmployeeName(row.job_owner_2);
      const owner3Name = row.job_owner_3_name || getEmployeeName(row.job_owner_3);
      const ownerMatch =
        owner1Name.toLowerCase().includes(lower) ||
        owner2Name.toLowerCase().includes(lower) ||
        owner3Name.toLowerCase().includes(lower);
      const descMatch = row.description?.toLowerCase().includes(lower);
      const notesMatch = row.notes?.toLowerCase().includes(lower);
      const categoryMatch = row.category?.toLowerCase().includes(lower);

      return (
        idMatch ||
        codeMatch ||
        nameMatch ||
        ownerMatch ||
        descMatch ||
        notesMatch ||
        categoryMatch
      );
    });

    setFilteredJobTypes(filtered);
  }, [searchTerm, jobTypes, employees]);

  const getErrorMessage = (e: any) => {
    return (
      e?.body?.detail ||
      e?.detail ||
      e?.message ||
      (typeof e?.body === "string" ? e.body : "An error occurred")
    );
  };

  const handleRowDeleted = async (id: number) => {
    try {
      await apiFetch(`/api/job-types/${id}`, { method: "DELETE" });

      const updated = jobTypes.filter((jt) => jt.id !== id);
      setJobTypes(updated);
      setFilteredJobTypes(updated);

      toast.success(`Job Type ${id} deleted successfully`);
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    }
  };


  // Add state for add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddJobType = () => {
    setIsAddModalOpen(true);
  };

  const processJobTypeSave = async (
    data: any,
    isEdit: boolean
  ) => {
    try {
      const jobOwnerId = data.job_owner_id ? parseInt(data.job_owner_id) : null;

      if (data.job_owner_id && isNaN(jobOwnerId as number)) {
        toast.error("Invalid Job Owner ID");
        return;
      }

      const payload = {
        unique_id: data.unique_id?.trim() || "",
        name: data.name?.trim() || "",
        job_owner_1: (data.job_owner_1 && data.job_owner_1 !== "") ? parseInt(data.job_owner_1) : null,
        job_owner_2: (data.job_owner_2 && data.job_owner_2 !== "") ? parseInt(data.job_owner_2) : null,
        job_owner_3: (data.job_owner_3 && data.job_owner_3 !== "") ? parseInt(data.job_owner_3) : null,
        category: data.category || "manual",
        description: data.description?.trim() || "",
        notes: data.notes?.trim() || "",
      };

      // Validate required fields
      if (!payload.name) {
        toast.error("Job Name is required");
        return;
      }
      if (!payload.unique_id) {
        toast.error("Unique ID is required");
        return;
      }

      const url = isEdit ? `/api/job-types/${data.id}` : "/api/job-types";
      const method = isEdit ? "PUT" : "POST";

      await apiFetch(url, { method, body: payload });

      await fetchData(false);
      toast.success(
        isEdit ? "Job type updated successfully" : "Job type created successfully"
      );

      if (!isEdit) {
        setIsAddModalOpen(false);
      }
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleEditSave = (data: any) => processJobTypeSave(data, true);
  const handleAddSave = (data: any) => processJobTypeSave(data, false);

  // Get initial data for add modal
  const getAddInitialData = () => {
    return {
      name: "",
      unique_id: "",
      job_owner_1: null,
      job_owner_2: null,
      job_owner_3: null,
      category: "manual",
      description: "",
      notes: "",
    };
  };

  if (showLoader) return <Loader />;
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
        onAddClick={handleAddJobType}
        onRowUpdated={handleEditSave}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />

      {/* Add Modal for Job Types */}
      {isAddModalOpen && (
        <EditModal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddSave}
          data={getAddInitialData()}
          title="Job Type"
          batches={[]}
          isAddMode={true}
        />
      )}


    </div>
  );
}