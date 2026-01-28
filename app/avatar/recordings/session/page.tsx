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
import { toast, Toaster } from "sonner";
import api, { smartUpdate } from "@/lib/api";

export default function SessionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch sessions using lib/api.js
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = debouncedSearch.trim()
        ? { search_title: debouncedSearch.trim() }
        : {};
      const { data } = await api.get("/session", { params });
      const sessionsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setSessions(sessionsData);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      if (err.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error(err.message || "Failed to fetch sessions.");
      }
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Derived filtered list
  const filteredSessions = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    if (!term) return sessions;
    return sessions.filter(
      (s) =>
        s.title?.toLowerCase().includes(term) ||
        String(s.sessionid).includes(term)
    );
  }, [debouncedSearch, sessions]);

  // Column definitions for AG Grid
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
        sortable: true,
        filter: "agDateColumnFilter",
        valueGetter: (params) => {
          return params.data?.entry_date ? new Date(params.data.entry_date) : null;
        },
        valueFormatter: (params) => {
          const value = params.value;
          if (!value) return "-";
          return value.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
        },
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
      {
        field: "backup_url",
        headerName: "Backup URL",
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
      { field: "notes", headerName: "Notes", width: 160, editable: true },

    ],
    []
  );

  // PUT request on row update using smartUpdate
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      const payload = {
        title: updatedRow.title,
        status: updatedRow.status || "active",
        link: updatedRow.link,
        backup_url: updatedRow.backup_url,
        videoid: updatedRow.videoid,
        type: updatedRow.type,
        sessiondate: updatedRow.sessiondate,
        subject_id: updatedRow.subject_id,
        subject: updatedRow.subject,
        notes: updatedRow.notes,
      };
      const updatedSession = await smartUpdate(
        "session",
        updatedRow.sessionid,
        payload
      );
      setSessions((prev) =>
        prev.map((row) =>
          row.sessionid === updatedRow.sessionid ? updatedSession : row
        )
      );
      toast.success("Session updated successfully.");
    } catch (err) {
      console.error("Failed to update session:", err);
      if (err.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error(err.message || "Failed to update session.");
      }
    }
  };

  // DELETE request on row deletion
  const handleRowDeleted = async (id: number | string) => {
    try {
      await api.delete(`/session/${id}`);
      setSessions((prev) => prev.filter((row) => row.sessionid !== id));
      toast.success(`Session ${id} deleted.`);
    } catch (err) {
      console.error("Failed to delete session:", err);
      if (err.status === 401) {
        toast.error("Not authorized — please login again.");
      } else {
        toast.error(err.message || "Failed to delete session.");
      }
    }
  };

  // UI render
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
          rowData={filteredSessions}
          columnDefs={columnDefs}
          // title={`Sessions (${sessions.length})`}
          title={
            debouncedSearch
              ? `Sessions (${filteredSessions.length})`
              : `Sessions (${sessions.length})`
          }
          height="600px"
          showSearch={false}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}
    </div>
  );
}
