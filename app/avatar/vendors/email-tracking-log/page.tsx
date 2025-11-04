"use client";

import React, { useEffect, useState, useRef } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { SearchIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { apiFetch } from "@/lib/api.js";

const AGGridTable = dynamic(() => import("@/components/AGGridTable"), {
  ssr: false,
});

const DateFormatter = (params: any) =>
  params.value ? new Date(params.value).toLocaleDateString() : "";

const DateTimeFormatter = (params: any) =>
  params.value
    ? new Date(params.value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const EmailRenderer = (params: any) =>
  params.value ? (
    <a
      href={`mailto:${params.value}`}
      className="text-blue-600 hover:underline dark:text-blue-400"
    >
      {params.value}
    </a>
  ) : (
    ""
  );

export default function EmailActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/email_activity_logs");
      const arr = Array.isArray(data) ? data : data?.data || [];
      setLogs(arr);
      setFilteredLogs(arr);
    } catch (e: any) {
      setError(e?.message || e?.body || "Failed to load email activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.candidate_name?.toLowerCase().includes(term) ||
          log.email?.toLowerCase().includes(term) ||
          log.activity_date?.toLowerCase().includes(term)
      );
    }
    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

  const columnDefs: ColDef[] = React.useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 100,
        pinned: "left",
        editable: false,
      },
      {
        field: "candidate_name",
        headerName: "Candidate Name",
        width: 200,
        editable: false,
      },
      {
        field: "email",
        headerName: "Email",
        width: 250,
        editable: false,
        cellRenderer: EmailRenderer,
      },
      {
        field: "activity_date",
        headerName: "Activity Date",
        width: 150,
        valueFormatter: DateFormatter,
        filter: "agDateColumnFilter",
        editable: false,
      },
      {
        field: "emails_read",
        headerName: "Emails Read",
        width: 160,
        editable: true,
      },
      {
        field: "last_updated",
        headerName: "Last Updated",
        width: 180,
        valueFormatter: DateTimeFormatter,
        editable: false,
      },
      {
        field: "candidate_marketing_id",
        headerName: "Marketing ID",
        width: 130,
        editable: false,
      },
    ],
    []
  );

  const handleRowUpdated = async (updatedRow: any) => {
    const payload = {
      emails_read: updatedRow.emails_read,
    };
    try {
      await apiFetch(`/email_activity_logs/${updatedRow.id}`, {
        method: "PUT",
        body: payload,
      });
      setFilteredLogs((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
      );
    } catch (error: any) {
      console.error("Update failed", error);
      alert(error?.message || error?.body || "Failed to update log");
    }
  };

  const handleRowDeleted = async (id: number | string) => {
    try {
      await apiFetch(`/email_activity_logs/${id}`, { method: "DELETE" });
      setFilteredLogs((prev) => prev.filter((row) => row.id !== id));
    } catch (error: any) {
      console.error("Delete failed", error);
      alert(error?.message || error?.body || "Failed to delete log");
    }
  };

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error)
    return <p className="text-center mt-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Email Activity Log
          </h1>
        </div>
        <Button
          onClick={fetchLogs}
          disabled={loading}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="max-w-md">
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/3 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by candidate name, email, date..."
            className="pl-10"
          />
        </div>
        {searchTerm && <p className="text-sm mt-1">{filteredLogs.length} found</p>}
      </div>

      <AGGridTable
        rowData={filteredLogs}
        columnDefs={columnDefs}
        title={`Email Activity Logs (${filteredLogs.length})`}
        height="calc(70vh)"
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        showSearch={false}
      />
    </div>
  );
}