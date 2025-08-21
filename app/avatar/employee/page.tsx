// employee/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import axios from "axios";
import { Plus } from "lucide-react";

const DateFormatter = (params: any) =>
  params.value ? new Date(params.value).toLocaleDateString() : "";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blankEmployeeData = {
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    dob: "",
    startdate: "",
    instructor: 0,
    status: 1,
    enddate: "",
    notes: "",
    aadhaar: "",
  };


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees`);
      if (!res.ok) throw new Error("Failed to fetch employees");

      const rawData = await res.json();
      const mappedData = rawData.map((emp: any) => ({
        ...emp,
        full_name: emp.name,
        start_date: emp.startdate,
        lastmoddate: emp.enddate,
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
  }, []);

  useEffect(() => {
    setCurrentPage(1); // reset to page 1 on new search
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = employees.filter((emp) =>
        Object.values(emp).some((val) =>
          String(val).toLowerCase().includes(term)
        )
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);
   const [state, setState] = useState({
      searchTerm: "",
      employees: [],
      filteredEmployees: [],
      isLoading: true,
      error: null as string | null,
      page: 1,
      limit: 100,
      total: 0,
    
      formData: blankEmployeeData,
      formSaveLoading: false,
      loadingRowId: null,
    });
   
   
  
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const payload = {
        ...updatedRow,
        id: updatedRow.id,
        name: updatedRow.name || "",
        email: updatedRow.email,
        phone: updatedRow.phone,
        address: updatedRow.address,
        dob: updatedRow.dob,
        startdate: updatedRow.start_date,
        enddate: updatedRow.lastmoddate,
        instructor: updatedRow.instructor,
        notes: updatedRow.notes,
        state: updatedRow.state,
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/employees/${updatedRow.id}`,
        payload
      );

      const updatedUIRow = {
        ...payload,
        full_name: payload.name,
        start_date: payload.startdate,
        lastmoddate: payload.enddate,
      };

      setFilteredEmployees((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedUIRow : row))
      );
    } catch (error) {
      console.error("Failed to update employee:", error);
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/employees/${id}`);
      setFilteredEmployees((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Failed to delete employee:", error);
    }
  };
  const handleAddEmployee = async () => {
    try {
      const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/employees`,
      blankEmployeeData
    );
    const newEmployee = {
      ...res.data,
      full_name: res.data.name,
      start_date: res.data.startdate,
      lastmoddate: res.data.enddate,
    };
    setFilteredEmployees((prev) => [newEmployee, ...prev]);
  } catch (error) {
    console.error("Failed to add employee:", error);
  }
};


  const columnDefs: ColDef[] = [
    { headerName: "ID", field: "id", width: 80, pinned: "left" },
    { headerName: "Full Name", field: "full_name", editable: true },
    { headerName: "Email", field: "email", editable: true },
    { headerName: "Phone", field: "phone", editable: true },
    { headerName: "Address", field: "address", editable: true },
    { headerName: "State", field: "state", editable: true },
    { headerName: "DOB", field: "dob", valueFormatter: DateFormatter, editable: true },
    { headerName: "Start Date", field: "startdate", valueFormatter: DateFormatter, editable: true },
    { headerName: "Instructor", field: "instructor", editable: true},
    { headerName: "Status", field: "status", editable: true },
    { headerName: "End Date", field: "lastmoddate", valueFormatter: DateFormatter },
    { headerName: "Notes", field: "notes", editable: true },
    { headerName: "Aadhar Number", field: "aadhaar", editable: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <p className="text-gray-600">Browse, search, and manage employees.</p>
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
            placeholder="Search by name, email, phone, etc."
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="text-sm mt-1">{filteredEmployees.length} result(s) found</p>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading employees...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <>
          <AGGridTable
            rowData={paginatedEmployees}
            // rowData={state.filteredEmployees}
            columnDefs={columnDefs}
            onRowClicked={(event) => console.log("Row clicked:", event.data)}
            // title={`Employees (${filteredEmployees.length})`}
            title="Employee"
            height="70vh"
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
            showFilters={true}
            showSearch={false}
          />

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
            {/* Rows per page selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1); // reset to first page
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                {[10,50,100,200].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

