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

type JobDefinition = {
    id: number;
    job_type: string;
    status: string;
    candidate_marketing_id: number;
    email_engine_id?: number | null;
    config_json?: string | null;
    created_at: string;
    updated_at?: string | null;
};

type FormData = {
    job_type: string;
    status: string;
    candidate_marketing_id: number;
    email_engine_id?: number;
    config_json: string;
};

const initialFormData: FormData = {
    job_type: "",
    status: "ACTIVE",
    candidate_marketing_id: 0,
    email_engine_id: undefined,
    config_json: "",
};

const StatusRenderer = ({ value }: { value?: string }) => {
    const status = value?.toLowerCase() || "";
    const variantMap: Record<string, string> = {
        active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
        paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
    return (
        <Badge className={`${variantMap[status] || variantMap.active} capitalize`}>
            {value || ""}
        </Badge>
    );
};

export default function JobDefinitionPage() {
    const [jobDefinitions, setJobDefinitions] = useState<JobDefinition[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);
    const [error, setError] = useState<string | null>(null);

    const apiEndpoint = "/job-definition";

    // Data Transformations
    const transformToUI = useCallback((job: any) => {
        let config: any = {};
        try {
            config = typeof job.config_json === "string" ? JSON.parse(job.config_json) : (job.config_json || {});
        } catch (e) {
            console.warn("Failed to parse config for job", job.id);
        }
        return {
            ...job,
            recipient_source: config.recipient_source || "CSV",
            date_filter: config.date_filter || "ALL_ACTIVE",
            lookback_days: config.lookback_days || 0,
            batch_size: config.batch_size || 200,
            csv_offset: config.csv_offset || 0,
        };
    }, []);

    const transformFromUI = (data: any) => {
        const { recipient_source, date_filter, lookback_days, batch_size, csv_offset, ...rest } = data;
        const config = {
            recipient_source,
            date_filter,
            lookback_days: parseInt(lookback_days || 0),
            batch_size: parseInt(batch_size || 200),
            csv_offset: parseInt(csv_offset || 0),
        };
        return {
            ...rest,
            status: rest.status || "ACTIVE",
            config_json: JSON.stringify(config),
            candidate_marketing_id: rest.candidate_marketing_id ? parseInt(rest.candidate_marketing_id) : null,
            email_engine_id: rest.email_engine_id ? parseInt(rest.email_engine_id) : null,
        };
    };

    const fetchJobDefinitions = useCallback(
        async (forceRefresh: boolean = false) => {
            setLoading(true);
            try {
                const data = forceRefresh ? await apiFetch(apiEndpoint) : await cachedApiFetch(apiEndpoint);
                const jobsData = Array.isArray(data) ? data : (data?.data || []);
                setJobDefinitions(jobsData.map(transformToUI));
            } catch (err) {
                const error = err instanceof Error ? err.message : "Failed to load job definitions";
                setError(error);
                toast.error(error);
            } finally {
                setLoading(false);
            }
        },
        [apiEndpoint, transformToUI]
    );

    useEffect(() => {
        fetchJobDefinitions();
    }, [fetchJobDefinitions]);

    const handleRowUpdated = useCallback(
        async (updatedRow: any) => {
            const id = updatedRow.id;
            console.log("Updating job definition:", id, updatedRow);

            if (!id) {
                console.warn("Attempted to update row without ID:", updatedRow);
                return;
            }

            try {
                const { id: _id, created_at, updated_at, ...uiFields } = updatedRow;
                const payload = transformFromUI(uiFields);
                console.log("PUT Payload:", payload);
                await apiFetch(`${apiEndpoint}/${id}`, { method: "PUT", body: payload });
                toast.success("Job definition updated successfully");
                fetchJobDefinitions(true);
            } catch (error) {
                toast.error("Failed to update job definition");
                console.error("Update error:", error);
            }
        },
        [apiEndpoint, fetchJobDefinitions]
    );

    const handleRowAdded = useCallback(
        async (newRow: any) => {
            console.log("Adding job definition:", newRow);
            try {
                const payload = transformFromUI(newRow);
                console.log("POST Payload:", payload);
                await apiFetch(apiEndpoint, { method: "POST", body: payload });
                toast.success("Job definition created successfully");
                fetchJobDefinitions(true);
            } catch (error) {
                toast.error("Failed to create job definition");
                console.error("Create error:", error);
            }
        },
        [apiEndpoint, fetchJobDefinitions]
    );

    const handleRowDeleted = useCallback(
        async (id: number) => {
            try {
                await apiFetch(`${apiEndpoint}/${id}`, { method: "DELETE" });
                setJobDefinitions(prev => prev.filter(job => job.id !== id));
                toast.success("Job definition deleted successfully");
            } catch (error) {
                toast.error("Failed to delete job definition");
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
                editable: false,
            },
            {
                field: "job_type",
                headerName: "Job Type",
                width: 150,
                editable: true,
            },
            {
                field: "status",
                headerName: "Status",
                width: 120,
                editable: true,
                cellRenderer: StatusRenderer,
            },
            {
                field: "recipient_source",
                headerName: "Source",
                width: 130,
                editable: true,
                cellStyle: { fontWeight: "bold" },
            },
            {
                field: "date_filter",
                headerName: "Filter",
                width: 130,
                editable: true,
            },
            {
                field: "batch_size",
                headerName: "Batch",
                width: 100,
                editable: true,
            },
            {
                field: "csv_offset",
                headerName: "Progress",
                width: 100,
                editable: true,
                cellStyle: { color: "#3b82f6", fontWeight: "bold" },
            },
            {
                field: "candidate_marketing_id",
                headerName: "Candidate",
                width: 120,
                editable: true,
            },
            {
                field: "email_engine_id",
                headerName: "Engine",
                width: 100,
                editable: true,
            },
            {
                field: "updated_at",
                headerName: "Last Active",
                width: 180,
                valueFormatter: (params: any) => {
                    if (!params.value) return "";
                    return new Date(params.value).toLocaleString();
                },
            },
        ],
        []
    );

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return jobDefinitions;
        const term = searchTerm.toLowerCase();
        return jobDefinitions.filter(job =>
            job.job_type?.toLowerCase().includes(term) ||
            job.status?.toLowerCase().includes(term) ||
            job.id.toString().includes(term)
        );
    }, [jobDefinitions, searchTerm]);

    return (
        <div className="p-6 space-y-4">
            <Toaster position="top-right" richColors />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <RefreshCw className="w-6 h-6 text-blue-600" />
                        Job Definitions
                    </h1>
                    <div className="max-w-md">
                        <div className="relative mt-1">
                            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search job definitions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-96 font-medium"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {showLoader ? (
                <Loader />
            ) : (
                <AGGridTable
                    title={`Job Definitions (${filteredData.length})`}
                    rowData={filteredData}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowAdded={handleRowAdded}
                    onRowDeleted={handleRowDeleted}
                    showAddButton={true}
                />
            )}
        </div>
    );
}
