"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import api, { apiFetch, API_BASE_URL } from "@/lib/api";
import axios from "axios";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon, RefreshCw, ExternalLink, User, Building } from "lucide-react";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { toast, Toaster } from "sonner";

const AGGridTable = dynamic(() => import("@/components/AGGridTable"), {
  ssr: false,
});

const DateFormatter = ({ value }: { value?: string | Date | null }) =>
  value ? new Date(value).toLocaleDateString() : "-";

const DateTimeFormatter = ({ value }: { value?: string | Date | null }) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const LinkedInUrlRenderer = ({ value }: { value?: string }) => {
  if (!value) return <span className="text-gray-400">-</span>;
  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
    >
      <ExternalLink className="h-3 w-3" />
      View Profile
    </a>
  );
};

const StatusBadge = ({ value }: { value?: string }) => {
  if (!value) return null;
  
  const statusConfig = {
    success: { label: "Success", variant: "success" },
    failed: { label: "Failed", variant: "destructive" },
    idle: { label: "Idle", variant: "secondary" },
    running: { label: "Running", variant: "default" },
    error: { label: "Error", variant: "destructive" },
    completed: { label: "Completed", variant: "success" },
  };

  const config = statusConfig[value] || { label: value, variant: "default" };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

const ActivityTypeBadge = ({ value }: { value?: string }) => {
  if (!value) return null;
  
  const typeConfig = {
    extraction: { label: "Extraction", variant: "default" },
    connection: { label: "Connection", variant: "secondary" },
  };

  const config = typeConfig[value] || { label: value, variant: "default" };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

const EmailRenderer = ({ value }: { value?: string }) => {
  if (!value) return <span className="text-gray-400">-</span>;
  return (
    <a
      href={`mailto:${value}`}
      className="text-blue-600 hover:underline dark:text-blue-400"
    >
      {value}
    </a>
  );
};

export default function LinkedInActivityLogGrid() {
  const gridRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const apiEndpoint = useMemo(
    () => `${process.env.NEXT_PUBLIC_API_URL}/linkedin_activity_logs`,
    []
  );

const fetchLogs = useCallback(async () => {
  setLoading(true);
  console.log("[fetchLogs] Fetching LinkedIn activity logs...");
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const endpointsToTry = [
    "/linkedin_activity_logs",
    "/linkedin_activity_logs/",
  ];

  const normalize = (b: any) => {
    if (!b) return [];
    if (Array.isArray(b)) return b;
    if (Array.isArray(b.data)) return b.data;
    if (Array.isArray(b.results)) return b.results;
    if (Array.isArray(b.logs)) return b.logs;
    for (const k of Object.keys(b || {})) if (Array.isArray(b[k])) return b[k];
    if (typeof b === "object") return [b];
    return [];
  };

  try {
    // Try api.get
    if (api?.get) {
      for (const ep of endpointsToTry) {
        try {
          console.log("[fetchLogs] trying api.get", ep);
          const resp = await api.get(ep);
          console.log("[fetchLogs] api.get response:", resp);
          const arr = normalize(resp?.data);
          setLogs(arr);
          setFilteredLogs(arr);
          return;
        } catch (err: any) {
          console.warn("[fetchLogs] api.get failed for", ep, err?.status ?? err?.message ?? err);
        }
      }
    }

    // Try apiFetch
    if (typeof apiFetch === "function") {
      for (const ep of endpointsToTry) {
        try {
          console.log("[fetchLogs] trying apiFetch", ep);
          const body = await apiFetch(ep);
          console.log("[fetchLogs] apiFetch body:", body);
          const arr = normalize(body);
          setLogs(arr);
          setFilteredLogs(arr);
          return;
        } catch (err: any) {
          console.warn("[fetchLogs] apiFetch failed for", ep, err?.status ?? err?.message ?? err);
        }
      }

      // Try with credentials
      try {
        console.log("[fetchLogs] trying apiFetch with credentials");
        const body = await apiFetch(endpointsToTry[0], { credentials: "include", useCookies: true });
        console.log("[fetchLogs] apiFetch(creds) body:", body);
        const arr = normalize(body);
        setLogs(arr);
        setFilteredLogs(arr);
        return;
      } catch (err: any) {
        console.warn("[fetchLogs] apiFetch(creds) failed", err);
      }
    }

    // Try axios
    for (const ep of endpointsToTry) {
      const full = base ? `${base}${ep.startsWith("/") ? "" : "/"}${ep}` : ep;
      try {
        console.log("[fetchLogs] trying axios GET", full);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token") || localStorage.getItem("token") || localStorage.getItem("auth_token")
            : null;
        const headers: any = { Accept: "application/json" };
        if (token) headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
        const res = await axios.get(full, { headers, withCredentials: true });
        console.log("[fetchLogs] axios res status", res.status, "data:", res.data);
        const arr = normalize(res.data);
        setLogs(arr);
        setFilteredLogs(arr);
        return;
      } catch (err: any) {
        console.warn("[fetchLogs] axios failed for", full, err?.response?.status ?? err?.message ?? err);
      }
    }

    toast.error("Failed to load LinkedIn activity logs — check console/network for details.");
  } catch (err: any) {
    console.error("[fetchLogs] unexpected", err);
    toast.error(err?.message || "Failed to load LinkedIn activity logs");
  } finally {
    setLoading(false);
  }
}, [apiEndpoint]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim()) setFilteredLogs(logs);
      else {
        const term = searchTerm.toLowerCase();
        setFilteredLogs(
          logs.filter(
            (log) =>
              log.candidate_name?.toLowerCase().includes(term) ||
              log.full_name?.toLowerCase().includes(term) ||
              log.company_name?.toLowerCase().includes(term) ||
              log.source_email?.toLowerCase().includes(term) ||
              log.activity_type?.toLowerCase().includes(term) ||
              log.status?.toLowerCase().includes(term) ||
              log.message?.toLowerCase().includes(term)
          )
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, logs]);

  const handleRowUpdated = async (updatedData: any) => {
    try {
      await apiFetch(`/linkedin_activity_logs/${updatedData.id}`, {
        method: "PUT",
        body: updatedData,
      });
      toast.success("LinkedIn activity log updated successfully");
      fetchLogs();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update log");
    }
  };

  const handleRowDeleted = async (logId: number | string) => {
    try {
      await apiFetch(`/linkedin_activity_logs/${logId}`, {
        method: "DELETE",
      });
      toast.success("LinkedIn activity log deleted successfully");
      fetchLogs();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete log");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columnDefs: ColDef[] = useMemo<ColDef[]>(
    () => [
      { 
        field: "id", 
        headerName: "ID", 
        width: 80, 
        pinned: "left" 
      },
      // {
      //   field: "candidate_name",
      //   headerName: "Candidate Name",
      //   width: 180,
      //   flex: 0,
      //   cellRenderer: ({ value }: { value?: string }) => (
      //     <div className="flex items-center gap-2">
      //       <span>{value || "-"}</span>
      //     </div>
      //   )
      // },
      {
        field: "full_name",
        headerName: "Full Name",
        width: 180,
        flex: 0
      },
      {
        field: "company_name",
        headerName: "Company",
        width: 150,
        flex: 0,
        cellRenderer: ({ value }: { value?: string }) => (
          <div className="flex items-center gap-2">
            <span>{value || "-"}</span>
          </div>
        )
      },
      {
        field: "source_email",
        headerName: "Source Email",
        width: 200,
        cellRenderer: EmailRenderer,
        flex: 0
      },
      {
        field: "activity_type",
        headerName: "Activity Type",
        width: 140,
        cellRenderer: ActivityTypeBadge,
        flex: 0
      },
      {
        field: "linkedin_profile_url",
        headerName: "Profile URL",
        width: 130,
        cellRenderer: LinkedInUrlRenderer,
        flex: 0
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        flex: 0
      },
      {
        field: "message",
        headerName: "Message",
        width: 130,
        flex: 0,
      },
      {
        field: "created_at",
        headerName: "Created At",
        width: 180,
        valueFormatter: DateTimeFormatter,
        flex: 0
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      minWidth: 100,
      wrapText: true,
      autoHeight: true,
    }),
    []
  );

  return (
    <div className="space-y-2">
      <Toaster position="top-center" richColors />

      {/* Header Section */}
      <div className="space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              LinkedIn Activity Log
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track LinkedIn profile extractions and connection activities
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-md">
            <div className="relative mt-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by candidate, company, email, activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-center">
        <div className="w-full max-w-7xl">
          <AGGridTable
            rowData={filteredLogs}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            loading={loading}
            height="600px"
            title={`LinkedIn Activity Logs (${filteredLogs.length})`}
            showSearch={false}
            onRowUpdated={handleRowUpdated}
            onRowDeleted={handleRowDeleted}
          />
        </div>
      </div>
    </div>
  );
}