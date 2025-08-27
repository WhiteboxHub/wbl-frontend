

"use client";
import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import "@/styles/admin.css";
import "@/styles/App.css";

// import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, Plus } from "lucide-react";
import axios from "axios";
import AGGridTable, { PhoneRenderer, EmailRenderer } from "@/components/AGGridTable";


const DateFormatter = (params: any) =>
  params.value ? new Date(params.value).toLocaleDateString() : "";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
        ...updatedRow,
        id: updatedRow.id,
        name: updatedRow.full_name || "",
        email: updatedRow.email,
        phone: updatedRow.phone,
        address: updatedRow.address,
        dob: updatedRow.dob,
        startdate: updatedRow.startdate,
        enddate: updatedRow.lastmoddate,
        instructor: updatedRow.instructor,
        notes: updatedRow.notes,
        state: updatedRow.state,
        aadhaar: updatedRow.aadhaar,
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/employees/${updatedRow.id}`,
        payload
      );

      const updatedUIRow = {
        ...payload,
        full_name: payload.name,
        lastmoddate: payload.enddate,
      };

      setFilteredEmployees((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedUIRow : row))
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

  const handleAddEmployee = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/employees`,
        blankEmployeeData
      );
      const newEmployee = {
        ...res.data,
        full_name: res.data.name,
        startdate: res.data.startdate,
        lastmoddate: res.data.enddate,
      };
      setFilteredEmployees((prev) => [newEmployee, ...prev]);
      setCurrentPage(1); // jump to first page to show new employee
    } catch (error) {
      console.error("Failed to add employee:", error);
      setError("Failed to add employee");
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
        headerName: "Email", 
        field: "email", 
        editable: true,
        cellRenderer: EmailRenderer, // 🔹 Add this
        onCellValueChanged: (params) => handleRowUpdated(params.data),
    },
    { 
        headerName: "Phone", 
        field: "phone", 
        editable: true,
        cellRenderer: PhoneRenderer, // 🔹 Add this
        onCellValueChanged: (params) => handleRowUpdated(params.data),
    },


    // { 
    //   headerName: "Email", 
    //   field: "email", 
    //   editable: true,
    //   onCellValueChanged: (params) => handleRowUpdated(params.data),
    // },
    // { 
    //   headerName: "Phone", 
    //   field: "phone", 
    //   editable: true,
    //   onCellValueChanged: (params) => handleRowUpdated(params.data),
    // },
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
    { headerName: "End Date", field: "lastmoddate", valueFormatter: DateFormatter },
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

        {/* Add Employee Button */}
        <button
          onClick={handleAddEmployee}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            title="Employee"
            height="70vh"
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
            showFilters={false}
            showSearch={false}
          />

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                {[10, 50, 100, 200].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

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












