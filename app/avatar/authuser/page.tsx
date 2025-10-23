// whiteboxLearning-wbl/app/avatar/authuser/page.tsx
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
import { toast, Toaster } from "sonner";

/**
 * Helper: unify token retrieval & header creation.
 * Checks both "access_token" and "token" keys in localStorage.
 */
const ACCESS_TOKEN_KEYS = ["access_token", "token", "accesstoken", "AuthorizationToken"]; // support common variants

function getStoredToken(): string | null {
  for (const k of ACCESS_TOKEN_KEYS) {
    const val = typeof window !== "undefined" ? localStorage.getItem(k) : null;
    if (val) return val;
  }
  return null;
}

function getAuthHeaders() {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export default function AuthUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch ALL users once (no pagination)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const url = `${base}/users`;
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };

      const res = await axios.get(url, { headers });

      // Accept both {data: [...]} or direct array
      const data = res.data && Array.isArray(res.data) ? res.data : res.data?.data ?? res.data ?? [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch users:", err?.response?.data ?? err?.message ?? err);
      toast.error("Failed to fetch users. Check console for details.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users (searching locally)
  const filteredUsers = users.filter((u) => {
    const term = debouncedSearch.toLowerCase();
    if (!term) return true;
    return (
      String(u.uname || "").toLowerCase().includes(term) ||
      String(u.fullname || "").toLowerCase().includes(term) ||
      String(u.phone || "").toLowerCase().includes(term) ||
      String(u.role || "").toLowerCase().includes(term) ||
      String(u.id || "").includes(term)
    );
  });

  // Status Renderer
  const StatusRenderer = (params: any) => {
    const v = (params.value ?? "").toString().toLowerCase();
    const classes =
      v === "active"
        ? "bg-green-100 text-green-800"
        : v === "inactive"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";
    return <Badge className={classes}>{String(params.value ?? "").toUpperCase()}</Badge>;
  };

  // Role Renderer
  const RoleRenderer = (params: any) => {
    const role = (params.value ?? "").toString();
    const map: Record<string, string> = {
      ADMIN: "bg-indigo-100 text-indigo-800",
      USER: "bg-gray-100 text-gray-800",
      MANAGER: "bg-emerald-100 text-emerald-800",
    };
    return <Badge className={map[role] ?? "bg-gray-200 text-gray-700"}>{role}</Badge>;
  };

  // Visa Status Renderer
  const VisaStatusRenderer = (params: any) => {
    const visa = (params.value ?? "").toString();
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
  const columnDefs: ColDef[] = useMemo<ColDef[]>(
    () => [
      { field: "id", headerName: "ID", width: 100, pinned: "left" },
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
              onClick={(event) => event.stopPropagation()}
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
            <a href={`tel:${params.value}`} className="text-blue-600 underline hover:text-blue-800">
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
      {
        field: "registereddate",
        headerName: "Registered Date",
        width: 180,
        valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleDateString() : ""),
      },
      { field: "googleId", headerName: "Google ID", width: 220 },
      { field: "team", headerName: "Team", width: 180, editable: true },
      { field: "message", headerName: "Message", width: 250, editable: true },
      {
        field: "enddate",
        headerName: "End Date",
        width: 150,
        valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleDateString() : ""),
      },
      { field: "role", headerName: "Role", width: 150, editable: true, cellRenderer: RoleRenderer },
      {
        field: "notes",
        headerName: "Notes",
        width: 300,
        sortable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: params.value }} />;
        },
      },
    ],
    []
  );

  // PUT request on row update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      await axios.put(`${base}/user/${updatedRow.id}`, updatedRow, { headers });

      setUsers((prev) => prev.map((user) => (user.id === updatedRow.id ? { ...user, ...updatedRow } : user)));
      toast.success("User updated successfully");
    } catch (err: any) {
      console.error("Failed to update user:", err?.response?.data ?? err?.message ?? err);
      // If unauthorized, show actionable message
      if (err?.response?.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error("Failed to update user");
      }
    }
  };

  // DELETE request on row deletion
  const handleRowDeleted = async (id: number | string) => {
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      await axios.delete(`${base}/user/${id}`, { headers });

      setUsers((prev) => prev.filter((user) => user.id !== id));
      toast.success("User deleted successfully");
    } catch (err: any) {
      console.error("Failed to delete user:", err?.response?.data ?? err?.message ?? err);
      if (err?.response?.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error("Failed to delete user");
      }
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Auth Users</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage application authentication users</p>
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
          <Input id="search" type="text" value={searchTerm} placeholder="Type name, email, or numeric ID..." onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* AG Grid Table */}
      {loading ? (
        <p className="text-center mt-8">Loading...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-center mt-8 text-gray-500">No users found.</p>
      ) : (
        <AGGridTable rowData={filteredUsers} columnDefs={columnDefs} title={`Users (${filteredUsers.length})`} height="600px" showSearch={false} onRowUpdated={handleRowUpdated} onRowDeleted={handleRowDeleted} />
      )}
    </div>
  );
}
