// whiteboxLearning-wbl/app/avatar/training/session/page.tsx
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
import { toast } from "sonner";

export default function SessionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sessions, setSessions] = useState<any[]>([]);
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

  // Fetch sessions (pagination + search)
  const fetchSessions = async () => {
    try {
      setLoading(true);

      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/session`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("per_page", pageSize.toString());
      if (debouncedSearch.trim()) url.searchParams.append("search_title", debouncedSearch.trim());

      const res = await fetch(url.toString());
      if (!res.ok) {
        setSessions([]);
        setTotal(0);
        return;
      }
      const data = await res.json();

      setSessions(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setSessions([]);
      setTotal(0);
      toast.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, pageSize, debouncedSearch]);

  // Column definitions
  const columnDefs: ColDef[] = useMemo<ColDef[]>(() => [
    { field: "sessionid", headerName: "ID", width: 90, pinned: "left" },
    { field: "title", headerName: "Title", width: 290, editable: true },
    {
      field: "link",
      headerName: "Link",
      width: 150,
      cellRenderer: (params: any) => {
        if (!params.value) return "";
        return (
          <a
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Click Here
          </a>
        );
      },
    },
    { field: "videoid", headerName: "Video ID", width: 160, editable: true },
    { field: "type", headerName: "Type", width: 140, editable: true },
    {
      field: "subject",
      headerName: "Subject",
      width: 180,
      valueGetter: (params) => params.data?.subject?.name ?? "",
    },
    {
      field: "sessiondate",
      headerName: "Session Date",
      width: 180,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "",
    },
  ], []);

  // PUT request on row update
  const handleRowUpdated = async (updatedRow: any) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/session/${updatedRow.sessionid}`, updatedRow);
      fetchSessions();
      toast.success("Session updated successfully");
    } catch (err) {
      console.error("Failed to update session:", err);
      toast.error("Failed to update session");
    }
  };

  // DELETE request on row deletion
  const handleRowDeleted = async (id: number | string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/session/${id}`);
      fetchSessions();
      toast.success("Session deleted successfully");
    } catch (err) {
      console.error("Failed to delete session:", err);
      toast.error("Failed to delete session");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sessions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage learning sessions
          </p>
        </div>
        <Button className="bg-whitebox-600 hover:bg-whitebox-700 text-white">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Session
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search by Title
        </Label>
        <div className="relative mt-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            value={searchTerm}
            placeholder="Type session title..."
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
          title={`Sessions (${total})`}
          height="600px"
          showSearch={false}
          onRowUpdated={handleRowUpdated}
          onRowDeleted={handleRowDeleted}
        />
      )}

      {/* Pagination Controls */}
      {sessions.length > 0 && (
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
