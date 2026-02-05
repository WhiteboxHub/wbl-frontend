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

type JobRequest = {
    id: number;
    job_type: string;
    candidate_marketing_id: number;
    status: string;
    requested_at: string;
    processed_at?: string | null;
};

type FormData = {
    job_type: string;
    candidate_marketing_id: number;
};

const initialFormData: FormData = {
    job_type: "",
    candidate_marketing_id: 0,
};

const StatusRenderer = ({ value }: { value?: string }) => {
    const status = value?.toLowerCase() || "";
    const variantMap: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        processed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    return (
        <Badge className={`${variantMap[status] || variantMap.pending} capitalize`}>
            {value || ""}
        </Badge>
    );
};

const ApproveButtonRenderer = (params: any) => {
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        try {
            await apiFetch(`/job-request/${params.data.id}`, {
                method: "PUT",
                body: { status: "APPROVED" }
            });
            toast.success("Job request approved!");
            params.context.componentParent.fetchJobRequests(true);
        } catch (error) {
            toast.error("Failed to approve job request");
        } finally {
            setLoading(false);
        }
    };

    if (params.data.status !== 'PENDING') return null;

    return (
        <Button
            size="sm"
            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleApprove}
            disabled={loading}
        >
            {loading ? "..." : "Approve"}
        </Button>
    );
};

export default function JobRequestPage() {
    const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiEndpoint = "/job-request";

    const fetchJobRequests = useCallback(
        async (forceRefresh: boolean = false) => {
            setLoading(true);
            try {
                const data = forceRefresh ? await apiFetch(apiEndpoint) : await cachedApiFetch(apiEndpoint);
                const requestsData = Array.isArray(data) ? data : (data?.data || []);
                setJobRequests(requestsData);
            } catch (err) {
                const error = err instanceof Error ? err.message : "Failed to load job requests";
                setError(error);
                toast.error(error);
            } finally {
                setLoading(false);
            }
        },
        [apiEndpoint]
    );

    useEffect(() => {
        fetchJobRequests();
    }, [fetchJobRequests]);

    const transformFromUI = (data: any) => {
        return {
            ...data,
            candidate_marketing_id: data.candidate_marketing_id ? parseInt(data.candidate_marketing_id) : null,
        };
    };

    const handleRowUpdated = useCallback(
        async (updatedRow: any) => {
            const id = updatedRow.id;
            try {
                const { id: _id, requested_at, processed_at, ...uiFields } = updatedRow;
                const payload = transformFromUI(uiFields);
                await apiFetch(`${apiEndpoint}/${id}`, { method: "PUT", body: payload });
                toast.success("Job request updated successfully");
                fetchJobRequests(true);
            } catch (error) {
                toast.error("Failed to update job request");
                console.error(error);
            }
        },
        [apiEndpoint, fetchJobRequests]
    );

    const handleRowAdded = useCallback(
        async (newRow: any) => {
            try {
                const payload = transformFromUI(newRow);
                await apiFetch(apiEndpoint, { method: "POST", body: payload });
                toast.success("Job request created successfully");
                fetchJobRequests(true);
            } catch (error) {
                toast.error("Failed to create job request");
                console.error(error);
            }
        },
        [apiEndpoint, fetchJobRequests]
    );

    const handleRowDeleted = useCallback(
        async (id: number) => {
            try {
                await apiFetch(`${apiEndpoint}/${id}`, { method: "DELETE" });
                setJobRequests(prev => prev.filter(request => request.id !== id));
                toast.success("Job request deleted successfully");
            } catch (error) {
                toast.error("Failed to delete job request");
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
                width: 200,
                editable: true,
            },
            {
                field: "candidate_marketing_id",
                headerName: "Candidate",
                width: 150,
                editable: true,
            },
            {
                field: "status",
                headerName: "Status",
                width: 150,
                editable: true,
                cellRenderer: StatusRenderer,
            },
            {
                field: "requested_at",
                headerName: "Requested At",
                width: 180,
                valueFormatter: (params: any) => {
                    if (!params.value) return "";
                    return new Date(params.value).toLocaleString();
                },
            },
            {
                field: "processed_at",
                headerName: "Processed At",
                width: 180,
                valueFormatter: (params: any) => {
                    if (!params.value) return "Not Processed";
                    return new Date(params.value).toLocaleString();
                },
            },
        ],
        []
    );

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return jobRequests;
        const term = searchTerm.toLowerCase();
        return jobRequests.filter(request =>
            request.job_type?.toLowerCase().includes(term) ||
            request.status?.toLowerCase().includes(term) ||
            request.id.toString().includes(term)
        );
    }, [jobRequests, searchTerm]);

    return (
        <div className="p-6 space-y-4">
            <Toaster position="top-right" richColors />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <RefreshCw className="w-7 h-7 text-blue-600" />
                        Job Requests
                    </h1>
                    <div className="max-w-md">
                        <div className="relative mt-1">
                            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search job requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-96 font-medium shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <AGGridTable
                title={`Job Requests (${filteredData.length})`}
                rowData={filteredData}
                columnDefs={columnDefs}
                onRowUpdated={handleRowUpdated}
                onRowAdded={handleRowAdded}
                onRowDeleted={handleRowDeleted}
                loading={loading}
                showAddButton={true}
            />
        </div>
    );
}
