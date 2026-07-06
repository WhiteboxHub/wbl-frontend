"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColDef } from "ag-grid-community";
import { SearchIcon, Trash2Icon, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { AGGridTable } from "@/components/AGGridTable";
import { EnhancedMetricCard } from "@/components/EnhancedMetricCard";
import { Input } from "@/components/admin_ui/input";
import { Loader } from "@/components/admin_ui/loader";
import { apiFetch } from "@/lib/api";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

interface Summary {
  total_users: number;
  active_users_7d: number;
  total_applications: number;
  total_fields: number;
  autofill_fields: number;
  llm_fields: number;
  human_fields: number;
  avg_automation_rate: number;
}

interface AnalyticsRow {
  user_id: string;
  total_applications: number;
  total_fields: number;
  autofill_fields: number;
  llm_fields: number;
  human_fields: number;
  avg_automation_rate: number;
  last_activity: string | null;
}

interface ApplicationLog {
  id: number;
  company_name: string;
  ats_platform: string;
  total_fields: number;
  autofill_fields: number;
  llm_fields: number;
  human_fields: number;
  automation_rate: number;
  submitted_at: string | null;
}

const analyticsColumnDefs: ColDef[] = [
  { field: "user_id", headerName: "User (Email or Candidate)", flex: 1.6 },
  {
    field: "total_applications",
    headerName: "Applications Filled",
    flex: 0.9,
    type: "numericColumn",
  },
  {
    field: "autofill_fields",
    headerName: "Autofill Fields",
    flex: 0.8,
    type: "numericColumn",
  },
  {
    field: "human_fields",
    headerName: "Human Fields",
    flex: 0.8,
    type: "numericColumn",
  },
  {
    field: "avg_automation_rate",
    headerName: "Avg Automation Rate",
    flex: 1.0,
    type: "numericColumn",
    valueFormatter: (p) => (p.value !== undefined ? `${p.value}%` : "—"),
  },
  {
    field: "last_activity",
    headerName: "Last Activity",
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
];

interface AutofillExtensionUsagePanelProps {
  active?: boolean;
}

export function AutofillExtensionUsagePanel({ active = true }: AutofillExtensionUsagePanelProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userLogs, setUserLogs] = useState<ApplicationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const showLoader = useMinimumLoadingTime(loading && !hasLoaded);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Global Summary stats
      const summaryData = await apiFetch("/reports/analytics/summary");
      setSummary(summaryData);

      // 2. Fetch User Grid list
      const params = new URLSearchParams({ page: "1", page_size: "250" });
      const trimmed = userFilter.trim();
      if (trimmed) {
        params.set("search", trimmed);
      }
      const usersData = await apiFetch(`/reports/analytics/users?${params.toString()}`);
      setRows(usersData?.users || []);
      
      setHasLoaded(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load Autofill analytics";
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

  // Fetch detailed logs when a user row is selected/clicked
  const handleRowSelection = useCallback(async (selectedRows: any[]) => {
    if (selectedRows.length > 0) {
      const userId = selectedRows[0].user_id;
      setSelectedUser(userId);
      setLoadingLogs(true);
      try {
        const logs = await apiFetch(`/reports/analytics/users/${encodeURIComponent(userId)}/logs`);
        setUserLogs(logs || []);
      } catch (err: unknown) {
        toast.error("Failed to load submission history");
        setUserLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    } else {
      setSelectedUser(null);
      setUserLogs([]);
    }
  }, []);

  const handleRowDeleted = useCallback(
    async (userId: string | number) => {
      const uid = String(userId).trim();
      if (!uid) {
        toast.error("Missing user identity");
        return;
      }
      try {
        const result = await apiFetch(`/reports/analytics/users/${encodeURIComponent(uid)}`, {
          method: "DELETE",
        });
        const deleted = result?.deleted_count ?? 0;
        toast.success(`Deleted ${deleted} application record(s) for ${uid}`);
        if (selectedUser === uid) {
          setSelectedUser(null);
          setUserLogs([]);
        }
        await loadData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to delete user logs";
        toast.error(message);
      }
    },
    [loadData, selectedUser]
  );

  const gridRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        id: row.user_id,
      })),
    [rows]
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
          <EnhancedMetricCard title="Total Users" value={summary.total_users} variant="indigo" />
          <EnhancedMetricCard title="Active (7d)" value={summary.active_users_7d} variant="indigo" />
          <EnhancedMetricCard
            title="Total Applications"
            value={summary.total_applications}
            variant="indigo"
          />
          <EnhancedMetricCard
            title="Total Autofill Fields"
            value={summary.autofill_fields}
            variant="indigo"
          />
          <EnhancedMetricCard
            title="Avg Automation Rate"
            value={`${summary.avg_automation_rate}%`}
            variant="indigo"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            className="pl-9"
            placeholder="Search by username or email..."
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm disabled:opacity-60"
        >
          <RefreshCcw className="h-4 w-4" />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Select a row below to inspect the candidate's detailed form submission history.
      </p>

      <AGGridTable
        title="Autofill Extension Usage Analytics"
        rowData={gridRows}
        columnDefs={analyticsColumnDefs}
        height="400px"
        showAddButton={false}
        showEditButton={false}
        getRowNodeId={(data) => String(data.user_id || data.id)}
        onRowDeleted={handleRowDeleted}
        onSelectionChanged={handleRowSelection}
        defaultColDef={{ editable: false, sortable: true, filter: true }}
      />

      {/* Selected User Log History Panel */}
      {selectedUser && (
        <div className="border border-violet-100 rounded-xl p-4 bg-violet-50/20 dark:bg-slate-900/50 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-violet-100 dark:border-slate-800 pb-2">
            <h4 className="font-semibold text-violet-900 dark:text-violet-300">
              Detailed History: <span className="font-mono text-sm">{selectedUser}</span>
            </h4>
            <button
              onClick={() => handleRowDeleted(selectedUser)}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-500"
            >
              <Trash2Icon className="h-3.5 w-3.5" />
              Clear User Telemetry
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-4 flex justify-center">
              <Loader />
            </div>
          ) : userLogs.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No detailed logs found for this user.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-violet-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold">
                  <tr>
                    <th className="px-4 py-2">Submitted At</th>
                    <th className="px-4 py-2">Company</th>
                    <th className="px-4 py-2">Platform</th>
                    <th className="px-4 py-2 text-right">Total Fields</th>
                    <th className="px-4 py-2 text-right">Autofill</th>
                    <th className="px-4 py-2 text-right">Human</th>
                    <th className="px-4 py-2 text-right">Automation Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  {userLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/30">
                      <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                        {log.submitted_at ? new Date(log.submitted_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                        {log.company_name}
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                        {log.ats_platform}
                      </td>
                      <td className="px-4 py-2 text-right">{log.total_fields}</td>
                      <td className="px-4 py-2 text-right text-emerald-600 font-medium">
                        {log.autofill_fields}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500">{log.human_fields}</td>
                      <td className="px-4 py-2 text-right font-semibold text-violet-800 dark:text-violet-400">
                        {log.automation_rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
