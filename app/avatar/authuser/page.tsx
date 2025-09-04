"use client";
import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";

export default function AuthUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch users (pagination or search)
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const trimmed = debouncedSearch.trim();
      const isIdSearch = !isNaN(Number(trimmed)) && trimmed !== "";

      if (isIdSearch) {
        // Search by numeric ID using /user/{id}
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/${trimmed}`);
        if (!res.ok) {
          setUsers([]);
          setTotal(0);
          return;
        }
        const data = await res.json();
        setUsers([data]);
        setTotal(1);
        setPage(1);
      } else {
        // Search by name or role using /user route
        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/user`);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("per_page", pageSize.toString());
        if (trimmed) url.searchParams.append("search_name", trimmed);

        const res = await fetch(url.toString());
        if (!res.ok) {
          setUsers([]);
          setTotal(0);
          return;
        }
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, debouncedSearch]);

  // Status Renderer
  const StatusRenderer = (params: any) => {
    const v = params.value?.toLowerCase() ?? "";
    const classes =
      v === "active"
        ? "bg-green-100 text-green-800"
        : v === "inactive"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";
    return <Badge className={classes}>{params.value?.toUpperCase()}</Badge>;
  };

  // Role Renderer
  const RoleRenderer = (params: any) => {
    const role = params.value ?? "";
    const map: Record<string, string> = {
      ADMIN: "bg-indigo-100 text-indigo-800",
      USER: "bg-gray-100 text-gray-800",
      MANAGER: "bg-emerald-100 text-emerald-800",
    };
    return <Badge className={map[role] ?? "bg-gray-200 text-gray-700"}>{role}</Badge>;
  };

  // Visa Status Renderer
  const VisaStatusRenderer = (params: any) => {
    const visa = params.value ?? "";
    const map: Record<string, string> = {
      Citizen: "bg-blue-100 text-blue-800",
      Visa: "bg-purple-100 text-purple-800",
      "Permanent resident": "bg-green-100 text-green-800",
      "Green Card": "bg-emerald-100 text-emerald-800",
      EAD: "bg-yellow-100 text-yellow-800",
      F1: "bg-pink-100 text-pink-800",
      "Waiting for Status": "bg-orange-100 text-orange-800",
    };
    return <Badge className={map[visa] ?? "bg-gray-200 text-gray-700"}>{visa}</Badge>;
  };

  // Column definitions
  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
    { field: "id", headerName: "ID", width: 100, pinned: "left" },
    // { field: "uname", headerName: "Email", width: 200, editable: true },
    // { field: "phone", headerName: "Phone", width: 150, editable: true },
  {
    field: "uname",
    headerName: "Email",
    width: 250,
    editable: true,
    cellRenderer: (params: any) => {
      if (!params.value) return "";
      return (
        <a
          href={`mailto:${params.value}`}
          className="text-blue-600 underline hover:text-blue-800"
          onClick={(event) => event.stopPropagation()} // stop row selection
        >
          {params.value}
        </a>
      );
    },
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
  },
    { field: "fullname", headerName: "Full Name", width: 180, editable: true },
    { field: "status", headerName: "Status", width: 150, editable: true, cellRenderer: StatusRenderer },
    { field: "visa_status", headerName: "Visa Status", width: 160, editable: true, cellRenderer: VisaStatusRenderer },
    { field: "address", headerName: "Address", width: 200, editable: true },
    { field: "state", headerName: "State", width: 140, editable: true },
    { field: "zip", headerName: "Zip Code", width: 120, editable: true },
    { field: "city", headerName: "City", width: 140, editable: true },
    { field: "country", headerName: "Country", width: 140, editable: true },
    { field: "registereddate", headerName: "Registered Date", width: 180,valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : "" },
    // { field: "passwd", headerName: "Password Hash", width: 200 },
    { field: "googleId", headerName: "Google ID", width: 220 },
    { field: "team", headerName: "Team", width: 180, editable: true },
    { field: "message", headerName: "Message", width: 250, editable: true },
    // { field: "lastlogin", headerName: "Last Login", width: 180, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "" },
    { field: "logincount", headerName: "Login Count", width: 140 },
    // { field: "level3date", headerName: "Level 3 Date", width: 180, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : "" },
    // { field: "demo", headerName: "Demo User", width: 120 },
    { field: "enddate", headerName: "End Date", width: 150, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : "" },
    // { field: "reset_token", headerName: "Reset Token", width: 220 },
    // { field: "token_expiry",headerName: "Token Expiry", width: 180, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "" },
    { field: "role", headerName: "Role", width: 150, editable: true, cellRenderer: RoleRenderer },
    // { field: "lastmoddatetime", headerName: "Last Modified", width: 200, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "" },
    { field: "notes", headerName: "Notes", width: 250, editable: true },
  ], []);

  // PUT request on row update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/user/${updatedRow.id}`, updatedRow);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  // DELETE request on row deletion
  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/user/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Auth Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage application authentication users
          </p>
        </div>
        <Button className="bg-whitebox-600 hover:bg-whitebox-700 text-white">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search by Name, Email or ID
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Type name, email, or numeric ID..."
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* AG Grid Table */}
      {loading ? (
        <p className="text-center mt-8">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-center mt-8 text-gray-500">No users found.</p>
      ) : (
        <AGGridTable
          rowData={users}
          columnDefs={columnDefs}
          title={`Users (${total})`}
          height="600px"
          showSearch={false}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}

      {/* Pagination Controls */}
      {users.length > 0 && (
        <div className="flex justify-between items-center mt-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-2 py-1 border rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= total}
              className="px-2 py-1 border rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
