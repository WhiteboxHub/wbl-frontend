"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColDef } from "ag-grid-community";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { AGGridTable } from "@/components/AGGridTable";
import { EnhancedMetricCard } from "@/components/EnhancedMetricCard";
import { Input } from "@/components/admin_ui/input";
import { Loader } from "@/components/admin_ui/loader";
import { apiFetch } from "@/lib/api";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

interface Summary {
  total_events: number;
  total_users: number;
  active_users_7d: number;
  total_jobs_attempted: number;
  total_jobs_submitted: number;
  total_jobs_failed: number;
  command_counts: Record<string, number>;
}

interface UserRow {
  id?: string;
  user_id: string;
  jobs_attempted: number;
  jobs_submitted: number;
  jobs_failed: number;
  last_event_at: string | null;
  apply_log_history?: Record<string, unknown>[] | null;
}

function userAnalyticsPath(userId: string): string {
  return `/analytics/users/${encodeURIComponent(userId)}`;
}

interface WboxCliUsagePanelProps {
  /** When false, skip fetching until the tab is selected */
  active?: boolean;
}

export function WboxCliUsagePanel({ active = true }: WboxCliUsagePanelProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const showLoader = useMinimumLoadingTime(loading && !hasLoaded);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const summaryData = await apiFetch("/analytics/summary");
      setSummary(summaryData);

      const params = new URLSearchParams({ page: "1", page_size: "200" });
      const trimmed = userFilter.trim();
      if (trimmed) {
        params.set("user_id", trimmed);
      }
      const usersData = await apiFetch(`/analytics/users?${params.toString()}`);
      setUsers(usersData?.users || []);
      setHasLoaded(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load WboxCLI analytics";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [userFilter]);

  useEffect(() => {
    if (active) {
      loadData();
    }
  }, [active, loadData]);

  const gridRows = useMemo(
    () =>
      users.map((row) => ({
        ...row,
        id: row.user_id,
      })),
    [users]
  );

  const handleRowUpdated = useCallback(
    async (updated: UserRow) => {
      const userId = (updated.user_id || updated.id || "").trim();
      if (!userId) {
        toast.error("Missing user id");
        return;
      }
      try {
        await apiFetch(userAnalyticsPath(userId), {
          method: "PATCH",
          body: {
            jobs_attempted: Number(updated.jobs_attempted) || 0,
            jobs_submitted: Number(updated.jobs_submitted) || 0,
            jobs_failed: Number(updated.jobs_failed) || 0,
          },
        });
        toast.success(`Updated metrics for ${userId}`);
        await loadData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update user";
        toast.error(message);
      }
    },
    [loadData]
  );

  const handleRowDeleted = useCallback(
    async (userId: string | number) => {
      const uid = String(userId).trim();
      if (!uid) {
        toast.error("Missing user id");
        return;
      }
      try {
        const result = await apiFetch(userAnalyticsPath(uid), { method: "DELETE" });
        const deleted = result?.deleted_events ?? 0;
        toast.success(`Deleted ${deleted} event(s) for ${uid}`);
        await loadData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to delete user";
        toast.error(message);
      }
    },
    [loadData]
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "user_id", headerName: "User", flex: 1.6 },
      {
        field: "jobs_attempted",
        headerName: "Jobs attempted",
        flex: 0.9,
        type: "numericColumn",
      },
      {
        field: "jobs_submitted",
        headerName: "Jobs submitted",
        flex: 0.9,
        type: "numericColumn",
      },
      {
        field: "jobs_failed",
        headerName: "Jobs failed",
        flex: 0.8,
        type: "numericColumn",
      },
      {
        field: "last_event_at",
        headerName: "Last activity",
        flex: 1.2,
        valueFormatter: (p) => {
          if (!p.value) return "—";
          try {
            return new Date(p.value).toLocaleString();
          } catch {
            return String(p.value);
          }
        },
      },
      {
        field: "apply_log_history",
        headerName: "Apply run log (jobs + steps)",
        flex: 3.2,
        valueFormatter: (p) => {
          if (!Array.isArray(p.value) || p.value.length === 0) return "[]";
          try {
            return JSON.stringify(p.value);
          } catch {
            return "[]";
          }
        },
      },
    ],
    []
  );

  if (!active) {
    return null;
  }

  if (showLoader && !hasLoaded) {
    return (
      <div className="py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <EnhancedMetricCard title="Total users" value={summary.total_users} variant="indigo" />
          <EnhancedMetricCard title="Active (7d)" value={summary.active_users_7d} variant="indigo" />
          <EnhancedMetricCard title="Jobs attempted" value={summary.total_jobs_attempted} variant="indigo" />
          <EnhancedMetricCard title="Jobs submitted" value={summary.total_jobs_submitted} variant="indigo" />
          <EnhancedMetricCard title="Jobs failed" value={summary.total_jobs_failed} variant="indigo" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            className="pl-9"
            placeholder="Filter by user email (WBL login)"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                loadData();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <AGGridTable
        title="WboxCLI users"
        rowData={gridRows}
        columnDefs={columnDefs}
        height="520px"
        showAddButton={false}
        getRowNodeId={(data) => String(data.user_id || data.id)}
        onRowUpdated={handleRowUpdated}
        onRowDeleted={handleRowDeleted}
        defaultColDef={{ editable: false }}
      />
    </div>
  );
}
