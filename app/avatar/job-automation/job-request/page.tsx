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
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newJobForm, setNewJobForm] = useState(false);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [formSaveLoading, setFormSaveLoading] = useState(false);

    const apiEndpoint = useMemo(() => "/job-request", []);

    const fetchJobRequests = useCallback(
        async (forceRefresh: boolean = false) => {
            setLoading(true);
            try {
                const url = apiEndpoint;
                const data = forceRefresh ? await apiFetch(url) : await cachedApiFetch(url);
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

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSaveLoading(true);
        try {
            await apiFetch(apiEndpoint, { method: "POST", body: formData });
            await invalidateCache(apiEndpoint);
            await fetchJobRequests(true);
            toast.success("Job request created successfully!");
            setNewJobForm(false);
            setFormData(initialFormData);
        } catch (error) {
            toast.error("Failed to create job request");
            console.error("Error creating job request:", error);
        } finally {
            setFormSaveLoading(false);
        }
    };

    const handleRowUpdated = useCallback(
        async (updatedRow: JobRequest) => {
            try {
                const { id, requested_at, ...payload } = updatedRow;
                await apiFetch(`${apiEndpoint}/${id}`, { method: "PUT", body: payload });
                setJobRequests(prevRequests =>
                    prevRequests.map(request =>
                        request.id === id ? { ...request, ...payload } : request
                    )
                );
                toast.success("Job request updated successfully");
            } catch (error) {
                toast.error("Failed to update job request");
                console.error(error);
            }
        },
        [apiEndpoint]
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
                filter: "agNumberColumnFilter",
            },
            {
                field: "job_type",
                headerName: "Job Type",
                width: 200,
                filter: "agTextColumnFilter",
            },
            {
                field: "candidate_marketing_id",
                headerName: "Candidate Marketing ID",
                width: 200,
                filter: "agNumberColumnFilter",
            },
            {
                field: "status",
                headerName: "Status",
                width: 150,
                editable: true,
                cellRenderer: StatusRenderer,
                cellEditor: "agSelectCellEditor",
                cellEditorParams: {
                    values: ["PENDING", "APPROVED", "PROCESSING", "PROCESSED", "FAILED"],
                },
            },
            {
                headerName: "Action",
                width: 100,
                cellRenderer: ApproveButtonRenderer,
                pinned: "right",
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
                editable: true,
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

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Job Requests</h1>
                <div className="flex gap-2">
                    <Button onClick={() => setNewJobForm(!newJobForm)}>
                        {newJobForm ? "Cancel" : "New Job Request"}
                    </Button>
                    <Badge className="bg-yellow-100 text-yellow-800">
                        Pending: {jobRequests.filter(r => r.status === 'PENDING').length}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                        Approved: {jobRequests.filter(r => r.status === 'APPROVED').length}
                    </Badge>
                </div>
            </div>

            {newJobForm && (
                <form onSubmit={handleFormSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Job Type</label>
                            <Input
                                name="job_type"
                                value={formData.job_type}
                                onChange={handleFormChange}
                                required
                                placeholder="e.g., EMAIL_EXTRACTION, LINKEDIN_CONNECTION"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Candidate Marketing ID</label>
                            <Input
                                name="candidate_marketing_id"
                                type="number"
                                value={formData.candidate_marketing_id}
                                onChange={handleFormChange}
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" disabled={formSaveLoading}>
                        {formSaveLoading ? "Creating..." : "Create Job Request"}
                    </Button>
                </form>
            )}

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search job requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    onClick={() => fetchJobRequests(true)}
                    variant="outline"
                    size="icon"
                >
                    <RefreshCw className={loading ? "animate-spin" : ""} size={20} />
                </Button>
            </div>

            <AGGridTable
                title="Job Requests"
                rowData={filteredData}
                columnDefs={columnDefs}
                onRowUpdated={handleRowUpdated}
                onRowDeleted={handleRowDeleted}
                loading={loading}
                showTotalCount={true}
                context={{ componentParent: { fetchJobRequests } }}
            />
        </div>
    );
}
