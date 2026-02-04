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

type JobDefinition = {
    id: number;
    job_type: string;
    status: string;
    candidate_marketing_id: number;
    config_json?: string | null;
    created_at: string;
    updated_at?: string | null;
};

type FormData = {
    job_type: string;
    status: string;
    candidate_marketing_id: number;
    config_json: string;
};

const initialFormData: FormData = {
    job_type: "",
    status: "ACTIVE",
    candidate_marketing_id: 0,
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
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [jobDefinitions, setJobDefinitions] = useState<JobDefinition[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newJobForm, setNewJobForm] = useState(false);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [formSaveLoading, setFormSaveLoading] = useState(false);

    const apiEndpoint = useMemo(() => "/job-definition", []);

    const fetchJobDefinitions = useCallback(
        async (forceRefresh: boolean = false) => {
            setLoading(true);
            try {
                const url = apiEndpoint;
                const data = forceRefresh ? await apiFetch(url) : await cachedApiFetch(url);
                const jobsData = Array.isArray(data) ? data : (data?.data || []);
                setJobDefinitions(jobsData);
            } catch (err) {
                const error = err instanceof Error ? err.message : "Failed to load job definitions";
                setError(error);
                toast.error(error);
            } finally {
                setLoading(false);
            }
        },
        [apiEndpoint]
    );

    useEffect(() => {
        fetchJobDefinitions();
    }, [fetchJobDefinitions]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSaveLoading(true);
        try {
            await apiFetch(apiEndpoint, { method: "POST", body: formData });
            await invalidateCache(apiEndpoint);
            await fetchJobDefinitions(true);
            toast.success("Job definition created successfully!");
            setNewJobForm(false);
            setFormData(initialFormData);
        } catch (error) {
            toast.error("Failed to create job definition");
            console.error("Error creating job definition:", error);
        } finally {
            setFormSaveLoading(false);
        }
    };

    const handleRowUpdated = useCallback(
        async (updatedRow: JobDefinition) => {
            try {
                const { id, created_at, updated_at, ...payload } = updatedRow;
                await apiFetch(`${apiEndpoint}/${id}`, { method: "PUT", body: payload });
                setJobDefinitions(prevJobs =>
                    prevJobs.map(job =>
                        job.id === id ? { ...job, ...payload } : job
                    )
                );
                toast.success("Job definition updated successfully");
            } catch (error) {
                toast.error("Failed to update job definition");
                console.error(error);
            }
        },
        [apiEndpoint]
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
                filter: "agNumberColumnFilter",
            },
            {
                field: "job_type",
                headerName: "Job Type",
                width: 150,
                editable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "status",
                headerName: "Status",
                width: 120,
                editable: true,
                cellRenderer: StatusRenderer,
                cellEditor: "agSelectCellEditor",
                cellEditorParams: {
                    values: ["ACTIVE", "INACTIVE", "PAUSED"],
                },
            },
            {
                headerName: "Progress (Offset)",
                width: 150,
                editable: true,
                valueGetter: (params: any) => {
                    try {
                        const config = typeof params.data.config_json === 'string'
                            ? JSON.parse(params.data.config_json)
                            : params.data.config_json;
                        return config?.csv_offset || 0;
                    } catch { return 0; }
                },
                valueSetter: (params: any) => {
                    try {
                        let config = typeof params.data.config_json === 'string'
                            ? JSON.parse(params.data.config_json)
                            : (params.data.config_json || {});
                        config.csv_offset = parseInt(params.newValue);
                        params.data.config_json = JSON.stringify(config);
                        return true;
                    } catch { return false; }
                },
                cellStyle: { fontWeight: 'bold', color: '#3b82f6' }
            },
            {
                headerName: "Batch Size",
                width: 120,
                editable: true,
                valueGetter: (params: any) => {
                    try {
                        const config = typeof params.data.config_json === 'string'
                            ? JSON.parse(params.data.config_json)
                            : params.data.config_json;
                        return config?.batch_size || 10;
                    } catch { return 10; }
                },
                valueSetter: (params: any) => {
                    try {
                        let config = typeof params.data.config_json === 'string'
                            ? JSON.parse(params.data.config_json)
                            : (params.data.config_json || {});
                        config.batch_size = parseInt(params.newValue);
                        params.data.config_json = JSON.stringify(config);
                        return true;
                    } catch { return false; }
                }
            },
            {
                field: "candidate_marketing_id",
                headerName: "Candidate ID",
                width: 120,
                editable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "config_json",
                headerName: "Config JSON",
                width: 300,
                editable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "updated_at",
                headerName: "Last Progress",
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

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Job Definitions</h1>
                <Button onClick={() => setNewJobForm(!newJobForm)}>
                    {newJobForm ? "Cancel" : "New Job Definition"}
                </Button>
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
                                placeholder="e.g. MASS_EMAIL"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleFormChange}
                                className="w-full h-10 border rounded-md px-3 py-2 bg-background"
                            >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                                <option value="PAUSED">PAUSED</option>
                            </select>
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

                        <div className="p-4 border rounded-md bg-gray-50/50 dark:bg-gray-900/20 space-y-4 col-span-2">
                            <h3 className="text-sm font-semibold border-b pb-2">🎯 Smart Config Builder</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Recipient Source</label>
                                    <select
                                        className="w-full h-9 border rounded px-3 py-1 text-sm bg-white dark:bg-gray-800"
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            try {
                                                const config = formData.config_json ? JSON.parse(formData.config_json) : {};
                                                config.recipient_source = val;
                                                if (val === "CSV") delete config.date_filter;
                                                setFormData({ ...formData, config_json: JSON.stringify(config, null, 2) });
                                            } catch {
                                                setFormData({ ...formData, config_json: JSON.stringify({ recipient_source: val }, null, 2) });
                                            }
                                        }}
                                        defaultValue="CSV"
                                    >
                                        <option value="CSV">Local CSV File (Standard)</option>
                                        <option value="OUTREACH_DB">Live Outreach Database (Smart)</option>
                                    </select>
                                </div>

                                {(() => {
                                    try {
                                        const config = JSON.parse(formData.config_json || "{}");
                                        if (config.recipient_source === "OUTREACH_DB") {
                                            return (
                                                <>
                                                    <div>
                                                        <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Date Filter</label>
                                                        <select
                                                            className="w-full h-9 border rounded px-3 py-1 text-sm bg-white dark:bg-gray-800"
                                                            onChange={(e) => {
                                                                config.date_filter = e.target.value;
                                                                setFormData({ ...formData, config_json: JSON.stringify(config, null, 2) });
                                                            }}
                                                            value={config.date_filter || "ALL_ACTIVE"}
                                                        >
                                                            <option value="ALL_ACTIVE">All Active Contacts</option>
                                                            <option value="TODAY">Added Today Only</option>
                                                            <option value="LAST_N_DAYS">Added in Last N Days</option>
                                                        </select>
                                                    </div>
                                                    {config.date_filter === "LAST_N_DAYS" && (
                                                        <div>
                                                            <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Lookback Days</label>
                                                            <Input
                                                                type="number"
                                                                className="h-9"
                                                                value={config.lookback_days || 7}
                                                                onChange={(e) => {
                                                                    config.lookback_days = parseInt(e.target.value);
                                                                    setFormData({ ...formData, config_json: JSON.stringify(config, null, 2) });
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        }
                                    } catch { return null; }
                                })()}

                                <div>
                                    <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Batch Size</label>
                                    <Input
                                        type="number"
                                        className="h-9"
                                        placeholder="200"
                                        onChange={(e) => {
                                            try {
                                                const config = formData.config_json ? JSON.parse(formData.config_json) : {};
                                                config.batch_size = parseInt(e.target.value);
                                                setFormData({ ...formData, config_json: JSON.stringify(config, null, 2) });
                                            } catch {
                                                setFormData({ ...formData, config_json: JSON.stringify({ batch_size: parseInt(e.target.value) }, null, 2) });
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium uppercase text-gray-500 mb-1">Generated Config (Raw JSON)</label>
                                <textarea
                                    name="config_json"
                                    value={formData.config_json}
                                    onChange={handleFormChange}
                                    className="w-full border rounded-md px-3 py-2 font-mono text-xs bg-gray-50 dark:bg-gray-900/50"
                                    rows={3}
                                    placeholder='{"recipient_source": "CSV"}'
                                />
                            </div>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={formSaveLoading}>
                        {formSaveLoading ? "Creating..." : "🚀 Create Job Definition"}
                    </Button>
                </form>
            )}

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search job definitions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    onClick={() => fetchJobDefinitions(true)}
                    variant="outline"
                    size="icon"
                >
                    <RefreshCw className={loading ? "animate-spin" : ""} size={20} />
                </Button>
            </div>

            <AGGridTable
                title="Job Definitions"
                rowData={filteredData}
                columnDefs={columnDefs}
                onRowUpdated={handleRowUpdated}
                onRowDeleted={handleRowDeleted}
                loading={loading}
                showTotalCount={true}
            />
        </div>
    );
}
