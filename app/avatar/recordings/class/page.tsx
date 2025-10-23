"use client";

import "@/styles/admin.css";
import "@/styles/App.css";
import { AGGridTable } from "@/components/AGGridTable";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, PlusIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";

/* 🔹 Token helper (same as other pages) */
const ACCESS_TOKEN_KEYS = ["access_token", "token", "accesstoken"];

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

export default function RecordingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 🔹 Fetch recordings with Authorization header
  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const url = `${base}/recordings`;

      const params: Record<string, string> = {};
      if (debouncedSearch.trim()) params["search"] = debouncedSearch.trim();

      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };

      const res = await axios.get(url, { headers, params });

      const data = res.data && Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setRecordings(data);
    } catch (err: any) {
      console.error("Failed to fetch recordings:", err?.response?.data ?? err?.message ?? err);
      if (err?.response?.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error(err.response?.data?.message || "Failed to fetch recordings.");
      }
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, [debouncedSearch]);

  /* 🔹 Column definitions for AG Grid */
  const columnDefs: ColDef[] = useMemo<ColDef[]>(
    () => [
      { field: "id", headerName: "ID", width: 90, pinned: "left" },
      { field: "batchname", headerName: "Batch Name", width: 200, editable: true },
      { field: "description", headerName: "Description", width: 300, editable: true },
      { field: "type", headerName: "Type", width: 140, editable: true, cellEditor: "agTextCellEditor" },
      { field: "subject", headerName: "Subject", width: 180, editable: true },
      { field: "filename", headerName: "File Name", width: 180, editable: true },
      {
        field: "link",
        headerName: "Link",
        width: 250,
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
      { field: "videoid", headerName: "Video ID", width: 160, editable: true },
      {
        field: "classdate",
        headerName: "Class Date",
        width: 180,
        valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleDateString() : ""),
      },
    ],
    []
  );

  /* 🔹 PUT request on row update */
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const url = `${base}/recordings/${updatedRow.id}`;
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };

      await axios.put(url, updatedRow, { headers });

      setRecordings((prev) => prev.map((r) => (r.id === updatedRow.id ? { ...r, ...updatedRow } : r)));
      toast.success("Recording updated successfully.");
    } catch (err: any) {
      console.error("Failed to update recording:", err?.response?.data ?? err?.message ?? err);
      if (err?.response?.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error("Failed to update recording.");
      }
    }
  };

  /* 🔹 DELETE request on row deletion */
  const handleRowDeleted = async (id: number | string) => {
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const url = `${base}/recordings/${id}`;
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };

      await axios.delete(url, { headers });

      setRecordings((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Recording ${id} deleted.`);
    } catch (err: any) {
      console.error("Failed to delete recording:", err?.response?.data ?? err?.message ?? err);
      if (err?.response?.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error("Failed to delete recording.");
      }
    }
  };

  /* 🔹 UI render */
  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Class Recordings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage class recordings</p>
        </div>
        <Button className="bg-whitebox-600 hover:bg-whitebox-700 text-white">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Recording
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search by ID or Batch Name or Title
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Type ID or Batch Name..."
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center mt-8">Loading...</p>
      ) : recordings.length === 0 ? (
        <p className="text-center mt-8 text-gray-500">No recordings found.</p>
      ) : (
        <AGGridTable
          rowData={recordings}
          columnDefs={columnDefs}
          title={`Class Recordings (${recordings.length})`}
          height="600px"
          showSearch={false}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}
    </div>
  );
}
