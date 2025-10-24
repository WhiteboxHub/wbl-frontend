"use client";
import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";

import { SearchIcon, Plus, X } from "lucide-react";
import AGGridTable from "@/components/AGGridTable";
import { apiFetch } from "@/lib/api"; // <<-- centralized helper
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

  const blankEmployeeData = {
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
  const [formData, setFormData] = useState(blankEmployeeData);
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

  const handleOpenEmployeeForm = () => {
    setShowEmployeeForm(true);
  };

  const handleCloseEmployeeForm = () => {
    setShowEmployeeForm(false);
    reset();
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Basic validations kept
    if (name === "name") {
      const regex = /^[A-Za-z. ]*$/;
      if (!regex.test(value)) return;
    }
    if (name === "phone" || name === "aadhaar") {
      const regex = /^[0-9]*$/;
      if (!regex.test(value)) return;
    }
    if (name === "address") {
      const regex = /^[A-Za-z0-9, ]*$/;
      if (!regex.test(value)) return;
    }
    if (name === "state") {
      const regex = /^[A-Za-z ]*$/;
      if (!regex.test(value)) return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSaveLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        state: formData.state || null,
        dob: formData.dob || null,
        startdate: formData.startdate || null,
        enddate: formData.enddate || null,
        notes: formData.notes || null,
        status: formData.status ?? null,
        instructor: formData.instructor ?? null,
        aadhaar: formData.aadhaar || null,

      };

      const created = await apiFetch("/employees", { method: "POST", body: payload });
      const newEmployee = {
        ...created,
        full_name: created.name ?? payload.name,
      };
      setFilteredEmployees((prev) => [newEmployee, ...prev]);
      setEmployees((prev) => [newEmployee, ...prev]);
      handleCloseEmployeeForm();

      setFormData(blankEmployeeData);
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
    { headerName: "DOB", field: "dob", valueFormatter: DateFormatter, editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
    { headerName: "Start Date", field: "startdate", valueFormatter: DateFormatter, editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
    { headerName: "End Date", field: "enddate", valueFormatter: DateFormatter, editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
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

        <div className="mt-2 flex flex-row items-center gap-2 sm:mt-0">
          <button onClick={handleOpenEmployeeForm} className="flex items-center whitespace-nowrap rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="max-w-md">
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email, phone" className="pl-10" />
        </div>
      </div>

      {showEmployeeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">

          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 -mx-6 -mt-6 mb-4 flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-4 py-3">
              <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-lg font-semibold text-transparent">
                Add Employee
              </h2>
              <button
                onClick={handleCloseEmployeeForm}
                className="rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-1 md:grid-cols-2"
            >
              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-bold text-blue-700"
                >
                  Full Name <span className="text-red-700">*</span>
                </Label>
                <input
                  type="text"
                  id="name"
                  {...register("name", {
                    required: "Full Name is required",
                    pattern: {
                      value: /^[A-Za-z. ]*$/,
                      message: "Only letters, dots and spaces are allowed",
                    },
                  })}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-bold text-blue-700"
                >
                  Email <span className="text-red-700">*</span>
                </Label>
                <input
                  type="email"
                  id="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Invalid email address",
                    },
                  })}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-bold text-blue-700"
                >
                  Phone
                </Label>
                <input
                  type="text"
                  id="phone"
                  {...register("phone", {
                    pattern: {
                      value: /^[0-9]*$/,
                      message: "Only numbers are allowed",
                    },
                  })}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-sm font-bold text-blue-700"
                >
                  Address
                </Label>
                <input
                  type="text"
                  id="address"
                  {...register("address", {
                    pattern: {
                      value: /^[A-Za-z0-9, ]*$/,
                      message:
                        "Only letters, numbers, commas and spaces are allowed",
                    },
                  })}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label
                  htmlFor="state"
                  className="text-sm font-bold text-blue-700"
                >
                  State
                </Label>
                <input
                  type="text"
                  id="state"
                  {...register("state", {
                    pattern: {
                      value: /^[A-Za-z ]*$/,
                      message: "Only letters and spaces are allowed",
                    },
                  })}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.state.message}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label
                  htmlFor="dob"
                  className="text-sm font-bold text-blue-700"
                >
                  Date of Birth
                </Label>
                <input
                  type="date"
                  id="dob"
                  {...register("dob")}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="startdate"
                  className="text-sm font-bold text-blue-700"
                >
                  Start Date
                </Label>
                <input
                  type="date"
                  id="startdate"
                  {...register("startdate")}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="enddate"
                  className="text-sm font-bold text-blue-700"
                >
                  End Date
                </Label>
                <input
                  type="date"
                  id="enddate"
                  {...register("enddate")}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Aadhaar Number */}
              <div className="space-y-2">
                <Label
                  htmlFor="aadhaar"
                  className="text-sm font-bold text-blue-700"
                >
                  Aadhaar Number
                </Label>
                <input
                  type="text"
                  id="aadhaar"
                  {...register("aadhaar", {
                    pattern: {
                      value: /^[0-9]*$/,
                      message: "Only numbers are allowed",
                    },
                  })}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.aadhaar && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.aadhaar.message}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label
                  htmlFor="status"
                  className="text-sm font-bold text-blue-700"
                >
                  Status <span className="text-red-700">*</span>
                </Label>
                <select
                  id="status"
                  {...register("status", {
                    required: "Status is required",
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" disabled>
                    Select Status
                  </option>
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.status.message}
                  </p>
                )}
              </div>

              {/* Instructor */}
              <div className="space-y-2">
                <Label
                  htmlFor="instructor"
                  className="text-sm font-bold text-blue-700"
                >
                  Instructor <span className="text-red-700">*</span>
                </Label>
                <select
                  id="instructor"
                  {...register("instructor", {
                    required: "Instructor is required",
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" disabled>
                    Select Instructor
                  </option>
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
                {errors.instructor && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.instructor.message}
                  </p>
                )}
              </div>
              {/* Notes */}
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-bold text-blue-700"
                >
                  Notes (optional)
                </Label>
                <div className="relative">
                  <textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Enter notes..."
                    className="min-h-[60px] w-full resize-none rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {/* Drag handle in bottom-right corner */}
                  <div
                    className="drag-handle absolute bottom-1 right-1 cursor-nwse-resize p-1 text-gray-400 transition-colors hover:text-gray-600"
                    title="Drag to resize"
                    style={{ pointerEvents: "auto" }}
                  >
                    <div className="flex h-5 w-5 items-center justify-center text-lg font-bold">
                      ↖
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2">

                <button
                  type="submit"
                  disabled={formSaveLoading}
                  className={`w-full rounded-lg py-2.5 text-sm font-medium transition duration-200 ${
                    formSaveLoading
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md hover:from-cyan-600 hover:to-blue-600"
                  }`}
                >
                  {formSaveLoading ? "Saving..." : "Save Employee"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

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
