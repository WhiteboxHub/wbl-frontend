

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

// Helper: Convert string to InitCap format
const toInitCap = (name: string): string =>
  name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    defaultValues: initialFormData,
  });

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/employees");
      const rawData = Array.isArray(data) ? data : data?.data || [];

      const mappedData = rawData.map((emp: any) => {
        const fullName = emp.name ?? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim();
        return {
          ...emp,
          full_name: toInitCap(fullName),
        };
      });

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

  // Search filter
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

  // Update Row
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const formattedName = toInitCap(updatedRow.full_name || updatedRow.name || "");

      const payload = {
        id: updatedRow.id,
        name: formattedName,
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

      await apiFetch(`/employees/${updatedRow.id}`, { method: "PUT", body: payload });

      const updatedList = employees.map((emp) =>
        emp.id === updatedRow.id ? { ...emp, ...payload, full_name: formattedName } : emp
      );

      setEmployees(updatedList);
      setFilteredEmployees(updatedList);
    } catch (err) {
      console.error("Failed to update employee:", err);
      setError("Failed to update employee");
    }
  };

  // Delete Row
  const handleRowDeleted = async (id: number | string) => {
    try {
      await apiFetch(`/employees/${id}`, { method: "DELETE" });
      setEmployees((prev) => prev.filter((row) => row.id !== id));
      setFilteredEmployees((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error("Failed to delete employee:", err);
      setError("Failed to delete employee");
    }
  };


  // Add Employee (Form)

  const handleCloseEmployeeForm = () => {
    setShowEmployeeForm(false);
    reset();
  };


  const handleFormSubmit = async (data: EmployeeFormData) => {
    setFormSaveLoading(true);
    try {
      const formattedName = toInitCap(data.name);
      const payload = {
        ...data,
        name: formattedName,
      };

      const created = await apiFetch("/employees", { method: "POST", body: payload });
      const newEmployee = {
        ...created,
        full_name: formattedName,
      };

      setEmployees((prev) => [newEmployee, ...prev]);
      setFilteredEmployees((prev) => [newEmployee, ...prev]);
      reset();
      setShowEmployeeForm(false);
    } catch (err) {
      console.error("Failed to add employee:", err);
      setError("Failed to add employee");
    } finally {
      setFormSaveLoading(false);
    }
  };

  // Column Definitions
  const columnDefs: ColDef[] = [
    { headerName: "ID", field: "id", width: 80, pinned: "left" },
    {
      headerName: "Full Name",
      field: "full_name",
      editable: true,
      onCellValueChanged: (params) => {
        params.data.full_name = toInitCap(params.newValue || "");
        handleRowUpdated(params.data);
      },
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      editable: true,
      cellRenderer: (params: any) =>
        params.value ? (
          <a href={`tel:${params.value}`} className="text-blue-600 underline hover:text-blue-800">
            {params.value}
          </a>
        ) : (
          ""
        ),
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      editable: true,
      cellRenderer: (params: any) =>
        params.value ? (
          <a
            href={`mailto:${params.value}`}
            className="text-blue-600 underline hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {params.value}
          </a>
        ) : (
          ""
        ),
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
      cellRenderer: (params: any) =>
        params.value ? (
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: params.value }} />
        ) : (
          ""
        ),
    },
    { headerName: "Aadhaar Number", field: "aadhaar", editable: true, onCellValueChanged: (params) => handleRowUpdated(params.data) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Search */}
      <div className="max-w-md">
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone"
            className="pl-10"
          />
        </div>
      </div>


      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading employees...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <AGGridTable
          rowData={filteredEmployees}
          columnDefs={columnDefs}
          title={`Employees (${filteredEmployees.length})`}
          height="70vh"
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
          showFilters={false}
          showSearch={false}
        />
      )}
    </div>
  );
}

