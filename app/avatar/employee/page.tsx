
"use client";
import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, Plus } from "lucide-react";
import axios from "axios";
import AGGridTable from "@/components/AGGridTable";

const DateFormatter = (params: any) => {
  if (!params.value) return "";
  const [year, month, day] = params.value.split("-");
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
  const [formData, setFormData] = useState({
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
  });
  const [formSaveLoading, setFormSaveLoading] = useState(false);

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

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees`);
      if (!res.ok) throw new Error("Failed to fetch employees");
      const rawData = await res.json();
      const mappedData = rawData.map((emp: any) => ({
        ...emp,
        full_name: emp.name,
        startdate: emp.startdate,
        // lastmoddate: emp.enddate,
      }));
      setEmployees(mappedData);
      setFilteredEmployees(mappedData);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    setIsLoading(true)
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = employees.filter((emp) =>
        ["name", "email", "phone"].some((field) =>
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
        email: updatedRow.email,
        phone: updatedRow.phone,
        address: updatedRow.address,
        dob: updatedRow.dob,
        startdate: updatedRow.startdate,
        enddate: updatedRow.lastmoddate || updatedRow.enddate,
        instructor: updatedRow.instructor,
        notes: updatedRow.notes,
        state: updatedRow.state,
        aadhaar: updatedRow.aadhaar,
        status: updatedRow.status,
      };
      console.log("Sending payload:", payload);
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/employees/${updatedRow.id}`,
        payload
      );
      setFilteredEmployees((prevEmployees) =>
        prevEmployees.map((employee) =>
          employee.id === updatedRow.id ? { ...employee, ...updatedRow } : employee
        )
      );
    } catch (error) {
      console.error("Failed to update employee:", error);
      setError("Failed to update employee");
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/employees/${id}`);
      setFilteredEmployees((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Failed to delete employee:", error);
      setError("Failed to delete employee");
    }
  };

  const handleOpenEmployeeForm = () => {
    setShowEmployeeForm(true);
  };

  const handleCloseEmployeeForm = () => {
    setShowEmployeeForm(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        status: formData.status || null,
        instructor: formData.instructor || null,
        aadhaar: formData.aadhaar || null,
      };
      console.log("Sending payload:", payload);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/employees`,
        payload
      );
      const newEmployee = {
        ...response.data,
        full_name: response.data.name,
        startdate: response.data.startdate,
        lastmoddate: response.data.enddate,
      };
      setFilteredEmployees((prev) => [newEmployee, ...prev]);
      handleCloseEmployeeForm();
      setFormData(blankEmployeeData);
    } catch (error) {
      console.error("Failed to add employee:", error);
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
          <a
            href={`tel:${params.value}`}
            className="text-blue-600 underline hover:text-blue-800"
          >
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
          <a
            href={`mailto:${params.value}`}
            className="text-blue-600 underline hover:text-blue-800"
            onClick={(event) => event.stopPropagation()}
          >
            {params.value}
          </a>
        );
      },
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      headerName: "Address",
      field: "address",
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      headerName: "State",
      field: "state",
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      headerName: "DOB",
      field: "dob",
      valueFormatter: DateFormatter,
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      headerName: "Start Date",
      field: "startdate",
      valueFormatter: DateFormatter,
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      headerName: "End Date",
      field: "enddate",
      valueFormatter: DateFormatter,
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      headerName: "Instructor",
      field: "instructor",
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      headerName: "Status",
      field: "status",
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      headerName: "Notes",
      field: "notes",
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    {
      headerName: "Aadhar Number",
      field: "aadhaar",
      editable: true,
      onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <p className="text-gray-600">Browse, search, and manage employees.</p>
        </div>
        <button
          onClick={handleOpenEmployeeForm}
          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search">Search</Label>
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
        {searchTerm && (
          <p className="text-sm mt-1">{filteredEmployees.length} result(s) found</p>
        )}
      </div>

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-4 shadow-md">
            <h2 className="mb-4 text-center text-xl font-semibold">New Employee Form</h2>
            <form
              onSubmit={handleFormSubmit}
              className="grid grid-cols-1 gap-2 md:grid-cols-2"
            >
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
                status: {
                  label: "Status",
                  type: "select",
                  options: [0, 1],
                  required: true,
                },
                instructor: {
                  label: "Instructor",
                  type: "select",
                  options: [0, 1],
                  required: true,
                },
              }).map(([name, config]) => (
                <div
                  key={name}
                  className={config.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <label
                    htmlFor={name}
                    className="mb-0.5 block text-xs font-medium text-gray-700"
                  >
                    {config.label}
                  </label>
                  {config.type === "select" ? (
                    <select
                      id={name}
                      name={name}
                      value={formData[name as keyof typeof formData]}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required={config.required}
                    >
                      <option value="" disabled>
                        Select {config.label}
                      </option>
                      {config.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : config.type === "textarea" ? (
                    <textarea
                      id={name}
                      name={name}
                      value={formData[name as keyof typeof formData]}
                      onChange={handleFormChange}
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type={config.type}
                      id={name}
                      name={name}
                      value={formData[name as keyof typeof formData]}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required={config.required}
                    />
                  )}
                </div>
              ))}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={formSaveLoading}
                  className={`w-full rounded-md py-1.5 text-sm transition duration-200 ${
                    formSaveLoading
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {formSaveLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
            <button
              onClick={handleCloseEmployeeForm}
              className="absolute right-2 top-2 text-xl leading-none text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Table */}
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
            // title="Employee"
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

