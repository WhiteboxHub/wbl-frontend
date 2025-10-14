"use client";
import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, Plus } from "lucide-react";
import AGGridTable from "@/components/AGGridTable";
import { apiFetch } from "@/lib/api"; // <<-- centralized helper

const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const parts = String(params.value).split("-");
  if (parts.length !== 3) return String(params.value);
  const [year, month, day] = parts;
  return `${month}/${day}/${year}`;
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

  if (loading) return <p className="text-gray-500">Loading employees...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Employee Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse, search, and manage employees.</p>
          <div className="mt-2 sm:mt-0 sm:max-w-md">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300"></Label>
            {searchTerm && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{filteredEmployees.length} result(s) found</p>}
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
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-4 shadow-md">
            <h2 className="mb-4 text-center text-xl font-semibold">New Employee Form</h2>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {/* form fields (same as before) */}
              {Object.entries({
                name: { label: "Full Name", type: "text", required: true },
                email: { label: "Email", type: "email", required: true },
                phone: { label: "Phone", type: "tel" },
                address: { label: "Address", type: "text" },
                state: { label: "State", type: "text" },
                dob: { label: "Date of Birth", type: "date" },
                startdate: { label: "Start Date", type: "date" },
                enddate: { label: "End Date", type: "date" },
                aadhaar: { label: "Aadhaar Number", type: "text" },
                notes: { label: "Notes (optional)", type: "textarea" },
                status: { label: "Status", type: "select", options: [0, 1], required: true },
                instructor: { label: "Instructor", type: "select", options: [0, 1], required: true },
              }).map(([name, config]) => (
                <div key={name} className={config.type === "textarea" ? "md:col-span-2" : ""}>
                  <label htmlFor={name} className="mb-0.5 block text-xs font-medium text-gray-700">{config.label}</label>
                  {config.type === "select" ? (
                    <select id={name} name={name} value={(formData as any)[name]} onChange={handleFormChange} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required={config.required}>
                      <option value="" disabled>Select {config.label}</option>
                      {config.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : config.type === "textarea" ? (
                    <textarea id={name} name={name} value={(formData as any)[name]} onChange={handleFormChange} rows={2} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  ) : (
                    <input type={config.type} id={name} name={name} value={(formData as any)[name]} onChange={handleFormChange} className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required={config.required} />
                  )}
                </div>
              ))}
              <div className="md:col-span-2">
                <button type="submit" disabled={formSaveLoading} className={`w-full rounded-md py-1.5 text-sm transition duration-200 ${formSaveLoading ? "cursor-not-allowed bg-gray-400" : "bg-green-600 text-white hover:bg-green-700"}`}>
                  {formSaveLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
            <button onClick={handleCloseEmployeeForm} className="absolute right-2 top-2 text-xl leading-none text-gray-500 hover:text-gray-700" aria-label="Close">&times;</button>
          </div>
        </div>
      )}

      <AGGridTable
        rowData={filteredEmployees}
        columnDefs={columnDefs}
        onRowClicked={(event) => console.log("Row clicked:", event.data)}
        height="70vh"
        loading={loading}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showFilters={false}
        showSearch={false}
      />
    </div>
  );
}
