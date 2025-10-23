"use client";

import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";

/* 🔹 Token Helpers */
const ACCESS_TOKEN_KEYS = ["access_token", "token", "accesstoken"];

function getStoredToken(): string | null {
  for (const key of ACCESS_TOKEN_KEYS) {
    const val = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (val) return val;
  }
  return null;
}

function getAuthHeaders() {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export default function SessionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* 🔸 Debounce search input */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  /* 🔸 Fetch Sessions with Authorization header */
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const url = new URL(`${base}/session`);

      if (debouncedSearch.trim()) {
        url.searchParams.append("search_title", debouncedSearch.trim());
      }

      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await axios.get(url.toString(), { headers });

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setSessions(data);
    } catch (err: any) {
      console.error("Failed to fetch sessions:", err?.response?.data ?? err?.message ?? err);
      if (err?.response?.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error("Failed to fetch sessions.");
      }
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [debouncedSearch]);

  /* 🔸 Column definitions */
  const columnDefs: ColDef[] = useMemo<ColDef[]>(
    () => [
      { field: "sessionid", headerName: "ID", width: 120, pinned: "left" },
      { field: "title", headerName: "Title", width: 380, editable: true },
      { field: "videoid", headerName: "Video ID", width: 160, editable: true },
      { field: "type", headerName: "Type", width: 140, editable: true },
      { field: "subject", headerName: "Subject", width: 180, editable: true },
      {
        field: "sessiondate",
        headerName: "Session Date",
        width: 180,
        editable: true,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : "",
      },
      {
        field: "link",
        headerName: "Link",
        width: 250,
        editable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "";
          return (
            <a
              href={params.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
              onClick={(e) => e.stopPropagation()}
            >
              Open
            </a>
          );
        },
      },
    ],
    []
  );

  /* 🔸 PUT request on row update */
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };

      const payload = {
        title: updatedRow.title,
        link: updatedRow.link,
        videoid: updatedRow.videoid,
        type: updatedRow.type,
        sessiondate: updatedRow.sessiondate,
        subject_id: updatedRow.subject_id,
        subject: updatedRow.subject,
      };

      await axios.put(`${base}/session/${updatedRow.sessionid}`, payload, { headers });

      setSessions((prev) =>
        prev.map((row) =>
          row.sessionid === updatedRow.sessionid ? { ...row, ...payload } : row
        )
      );

      toast.success("Session updated successfully.");
    } catch (err: any) {
      console.error("Failed to update session:", err?.response?.data ?? err?.message ?? err);
      if (err?.response?.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error("Failed to update session.");
      }
    }
  };

  /* 🔸 DELETE request on row deletion */
  const handleRowDeleted = async (id: number | string) => {
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };

      await axios.delete(`${base}/session/${id}`, { headers });

      setSessions((prev) => prev.filter((row) => row.sessionid !== id));
      toast.success(`Session ${id} deleted.`);
    } catch (err: any) {
      console.error("Failed to delete session:", err?.response?.data ?? err?.message ?? err);
      if (err?.response?.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error("Failed to delete session.");
      }
    }
  };

  /* 🔸 UI render */
  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sessions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage class sessions</p>
        </div>
        <Button className="bg-whitebox-600 hover:bg-whitebox-700 text-white">
          <SearchIcon className="h-4 w-4 mr-2" />
          Add Session
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label
          htmlFor="search"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Search by ID or Title
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Type ID or Title..."
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* AG Grid Table */}
      {loading ? (
        <p className="text-center mt-8">Loading...</p>
      ) : sessions.length === 0 ? (
        <p className="text-center mt-8 text-gray-500">No sessions found.</p>
      ) : (
        <AGGridTable
          rowData={sessions}
          columnDefs={columnDefs}
          title={`Sessions (${sessions.length})`}
          height="600px"
          showSearch={false}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}
    </div>
  );
}
