"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ColDef } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { SearchIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { AGGridTable } from "@/components/AGGridTable";
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

type JobRun = {
    id: number;
    job_definition_id: number;
    job_schedule_id: number;
    run_status: string;
    started_at: string;
    finished_at?: string | null;
    items_total: number;
    items_succeeded: number;
    items_failed: number;
    error_message?: string | null;
    details_json?: string | null;
};

const StatusRenderer = ({ value }: { value?: string }) => {
    const status = value?.toLowerCase() || "";
    const variantMap: Record<string, string> = {
        running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return (
        <Badge className={`${variantMap[status] || variantMap.running} capitalize`}>
            {value || ""}
        </Badge>
    );
};

export default function JobRunPage() {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [jobRuns, setJobRuns] = useState<JobRun[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);
    const [error, setError] = useState<string | null>(null);

    const apiEndpoint = useMemo(() => "/job-run", []);

    const fetchJobRuns = useCallback(
        async (forceRefresh: boolean = false) => {
            setLoading(true);
            try {
                const url = apiEndpoint;
                const data = forceRefresh ? await apiFetch(url) : await cachedApiFetch(url);
                const runsData = Array.isArray(data) ? data : (data?.data || []);
                setJobRuns(runsData);
            } catch (err) {
                const error = err instanceof Error ? err.message : "Failed to load job runs";
                setError(error);
                toast.error(error);
            } finally {
                setLoading(false);
            }
        },
        [apiEndpoint]
    );

    useEffect(() => {
        fetchJobRuns();
    }, [fetchJobRuns]);

    const handleRowUpdated = useCallback(
        async (updatedRow: JobRun) => {
            try {
                const { id, ...payload } = updatedRow;
                await apiFetch(`${apiEndpoint}/${id}`, { method: "PUT", body: payload });
                setJobRuns(prevRuns =>
                    prevRuns.map(run =>
                        run.id === id ? { ...run, ...payload } : run
                    )
                );
                toast.success("Job run updated successfully");
            } catch (error) {
                toast.error("Failed to update job run");
                console.error(error);
            }
        },
        [apiEndpoint]
    );

    const handleRowDeleted = useCallback(
        async (id: number) => {
            try {
                await apiFetch(`${apiEndpoint}/${id}`, { method: "DELETE" });
                setJobRuns(prev => prev.filter(run => run.id !== id));
                toast.success("Job run deleted successfully");
            } catch (error) {
                toast.error("Failed to delete job run");
                console.error(error);
            }
        },
        [apiEndpoint]
    );

    const columnDefs: ColDef<any, any>[] = useMemo(
        () => [
            {
                field: "id",
                headerName: "ID",
                width: 80,
                pinned: "left",
                filter: "agNumberColumnFilter",
            },
            {
                field: "job_definition_id",
                headerName: "Job Definition ID",
                width: 180,
                filter: "agNumberColumnFilter",
            },
            {
                field: "job_schedule_id",
                headerName: "Job Schedule ID",
                width: 180,
                filter: "agNumberColumnFilter",
            },
            {
                field: "run_status",
                headerName: "Status",
                width: 150,
                editable: true,
                cellRenderer: StatusRenderer,
                cellEditor: "agSelectCellEditor",
                cellEditorParams: {
                    values: ["RUNNING", "COMPLETED", "FAILED", "CANCELLED"],
                },
            },
            {
                field: "started_at",
                headerName: "Started At",
                width: 180,
                valueFormatter: (params: any) => {
                    if (!params.value) return "";
                    return new Date(params.value).toLocaleString();
                },
            },
            {
                field: "finished_at",
                headerName: "Finished At",
                width: 180,
                editable: true,
                valueFormatter: (params: any) => {
                    if (!params.value) return "In Progress";
                    return new Date(params.value).toLocaleString();
                },
            },
            {
                field: "items_total",
                headerName: "Total Items",
                width: 130,
                editable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "items_succeeded",
                headerName: "Succeeded",
                width: 130,
                editable: true,
                filter: "agNumberColumnFilter",
                cellStyle: { color: 'green', fontWeight: 'bold' },
            },
            {
                field: "items_failed",
                headerName: "Failed",
                width: 130,
                editable: true,
                filter: "agNumberColumnFilter",
                cellStyle: (params: any) => params.value > 0 ? { color: 'red', fontWeight: 'bold' } : {},
            },
            {
                field: "error_message",
                headerName: "Error Message",
                width: 300,
                editable: true,
                cellStyle: { color: 'red' },
            },
            {
                field: "details_json",
                headerName: "Details JSON",
                width: 250,
                editable: true,
            },
        ],
        []
    );

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return jobRuns;
        const term = searchTerm.toLowerCase();
        return jobRuns.filter(run =>
            run.run_status?.toLowerCase().includes(term) ||
            run.id.toString().includes(term) ||
            run.error_message?.toLowerCase().includes(term)
        );
    }, [jobRuns, searchTerm]);

    return (
        <div className="p-6 space-y-4">
            <Toaster position="top-right" richColors />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Job Runs
                    </h1>
                    <div className="max-w-md">
                        <div className="relative mt-1">
                            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search job runs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-96"
                            />
                        </div>
                    </div>
                </div>
            </div>


            {showLoader ? (
                <Loader />
            ) : (
                <AGGridTable
                    title={`Job Runs (${filteredData.length})`}
                    rowData={filteredData}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                />
            )}
        </div>
    );
}
