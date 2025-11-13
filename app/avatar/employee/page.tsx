"use client";
import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";

import { SearchIcon, X } from "lucide-react";
import AGGridTable from "@/components/AGGridTable";
import { apiFetch } from "@/lib/api"; 
import { useForm } from "react-hook-form";


const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const parts = String(params.value).split("-");
  if (parts.length !== 3) return String(params.value);
  const [year, month, day] = parts;
  return `${month}/${day}/${year}`;
};

// Form Data Type
type EmployeeFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  dob: string;
  startdate: string;
  enddate: string;
  instructor: number;
  status: number;
  notes: string;
  aadhaar: string;
};

const initialFormData: EmployeeFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  state: "",
  dob: "",
  startdate: "",
  enddate: "",
  instructor: 0,
  status: 1,
  notes: "",
  aadhaar: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [formSaveLoading, setFormSaveLoading] = useState(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmployeeFormData>({
    defaultValues: initialFormData,
  });


  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/employees");
      const rawData = Array.isArray(data) ? data : data?.data || [];
      const mappedData = rawData.map((emp: any) => ({
        ...emp,
        full_name: emp.name ?? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim(),
      }));
      setEmployees(mappedData);
      setFilteredEmployees(mappedData);
      setError(null);
    } catch (e: any) {
      console.error("Failed to fetch employees:", e);
      setError(e?.message || "Failed to fetch employees");
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = employees.filter((emp) =>
        ["full_name", "name", "email", "phone"].some((field) =>
          String(emp[field] || "").toLowerCase().includes(term)
        )
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const payload = {
        id: updatedRow.id,
        name: updatedRow.full_name || updatedRow.name || "",
        email: updatedRow.email || null,
        phone: updatedRow.phone || null,
        address: updatedRow.address || null,
        dob: updatedRow.dob || null,
        startdate: updatedRow.startdate || null,
        enddate: updatedRow.enddate || null,
        instructor: updatedRow.instructor ?? null,
        notes: updatedRow.notes || null,
        state: updatedRow.state || null,
        aadhaar: updatedRow.aadhaar || null,
        status: updatedRow.status ?? null,
      };

      console.log("Sending payload:", payload);
      await apiFetch(`/employees/${updatedRow.id}`, { method: "PUT", body: payload });

      // Optimistic UI update
      setFilteredEmployees((prev) =>
        prev.map((employee) => (employee.id === updatedRow.id ? { ...employee, ...updatedRow } : employee))
      );
      // Update master list also
      setEmployees((prev) => prev.map((employee) => (employee.id === updatedRow.id ? { ...employee, ...updatedRow } : employee)));
    } catch (err) {
      console.error("Failed to update employee:", err);
      setError("Failed to update employee");
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await apiFetch(`/employees/${id}`, { method: "DELETE" });
      setFilteredEmployees((prev) => prev.filter((row) => row.id !== id));
      setEmployees((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Failed to delete employee:", err);
      setError("Failed to delete employee");
    }
  };

  const handleCloseEmployeeForm = () => {
    setShowEmployeeForm(false);
    reset();
  };

  const handleFormSubmit = async (data: EmployeeFormData) => {
    setFormSaveLoading(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        state: data.state || null,
        dob: data.dob || null,
        startdate: data.startdate || null,
        enddate: data.enddate || null,
        notes: data.notes || null,
        status: data.status ?? null,
        instructor: data.instructor ?? null,
        aadhaar: data.aadhaar || null,
      };

      const created = await apiFetch("/employees", { method: "POST", body: payload });
      const newEmployee = {
        ...created,
        full_name: created.name ?? payload.name,
      };
      setFilteredEmployees((prev) => [newEmployee, ...prev]);
      setEmployees((prev) => [newEmployee, ...prev]);
      handleCloseEmployeeForm();
    } catch (err) {
      console.error("Failed to add employee:", err);
      setError("Failed to add employee");
    } finally {
      setFormSaveLoading(false);
    }
  };

  // Add drag resize functionality for notes textarea
  useEffect(() => {
    if (!showEmployeeForm) return; // Only initialize when modal is open

    const textarea = document.querySelector(
      'textarea[id="notes"]'
    ) as HTMLTextAreaElement;
    const dragHandle = document.querySelector(".drag-handle") as HTMLElement;

    if (!textarea || !dragHandle) return;

    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    const startResize = (e: MouseEvent) => {
      isResizing = true;
      startY = e.clientY;
      startHeight = parseInt(
        document.defaultView?.getComputedStyle(textarea).height || "0",
        10
      );
      e.preventDefault();
    };

    const resize = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = e.clientY - startY;
      textarea.style.height = `${Math.max(60, startHeight + deltaY)}px`; // Minimum height 60px
    };

    const stopResize = () => {
      isResizing = false;
    };

    dragHandle.addEventListener("mousedown", startResize);
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);

    return () => {
      dragHandle.removeEventListener("mousedown", startResize);
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };
  }, [showEmployeeForm]); // Re-initialize when modal opens/closes

  const columnDefs: ColDef[] = [
    { headerName: "ID", field: "id", width: 80, pinned: "left" },
    {
      headerName: "Full Name",
      field: "full_name",
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      editable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return "";
        return (
          <a href={`tel:${params.value}`} className="text-blue-600 underline hover:text-blue-800">
            {params.value}
          </a>
        );
      },
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      editable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return "";
        return (
          <a href={`mailto:${params.value}`} className="text-blue-600 underline hover:text-blue-800" onClick={(e) => e.stopPropagation()}>
            {params.value}
          </a>
        );
      },
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    { headerName: "Address", field: "address", editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
    { headerName: "State", field: "state", editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
    { headerName: "DOB", field: "dob", valueFormatter: DateFormatter, editable: true, filter:"agDateColumnFilter", onCellValueChanged: (params) => handleRowUpdated(params.data) },
    { headerName: "Start Date", field: "startdate", valueFormatter: DateFormatter, editable: true,filter:"agDateColumnFilter", onCellValueChanged: (params) => handleRowUpdated(params.data) },
    { headerName: "End Date", field: "enddate", valueFormatter: DateFormatter, editable: true,filter:"agDateColumnFilter", onCellValueChanged: (params) => handleRowUpdated(params.data) },
    { headerName: "Instructor", field: "instructor", editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
    { headerName: "Status", field: "status", editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
    {
      field: "notes",
      headerName: "Notes",
      width: 300,
      sortable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return "";
        return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: params.value }} />;
      },
    },
    { headerName: "Aadhar Number", field: "aadhaar", editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
  ];

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseEmployeeForm();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Employee Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse, search, and manage employees.</p>
          <div className="mt-2 sm:mt-0 sm:max-w-md">

            <Label
              htmlFor="search"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {/* Search Employees */}
            </Label>

            {searchTerm && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filteredEmployees.length} result(s) found
              </p>
            )}

          </div>
        </div>
      </div>

      <div className="max-w-md">
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email, phone" className="pl-10" />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading employees...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <>
          <AGGridTable
            rowData={filteredEmployees}
            columnDefs={columnDefs}
            onRowClicked={(event) => console.log("Row clicked:", event.data)}
            title={`Employees (${filteredEmployees.length})`}
            height="70vh"
            loading={loading}
            onRowAdded={async (newRow: any) => {
              try {
                const payload = {
                  name: newRow.full_name || newRow.name || "",
                  email: newRow.email || null,
                  phone: newRow.phone || null,
                  address: newRow.address || null,
                  dob: newRow.dob || null,
                  startdate: newRow.startdate || null,
                  enddate: newRow.enddate || null,
                  instructor: newRow.instructor ?? null,
                  notes: newRow.notes || null,
                  state: newRow.state || null,
                  aadhaar: newRow.aadhaar || null,
                  status: newRow.status ?? null,
                };
                if (!payload.name || !payload.email || payload.status == null || payload.instructor == null) {
                  setError("Full Name, Email, Status and Instructor are required");
                  return;
                }
                const created = await apiFetch("/employees", { method: "POST", body: payload });
                const newEmployee = { ...created, full_name: created.name ?? payload.name };
                setFilteredEmployees((prev) => [newEmployee, ...prev]);
                setEmployees((prev) => [newEmployee, ...prev]);
              } catch (err:any) {
                console.error("Failed to add employee via grid +:", err);
                setError(err?.message || "Failed to add employee");
              }
            }}
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
            showFilters={false}
            showSearch={false}
          />
        </>
      )}

    </div>
  );
}