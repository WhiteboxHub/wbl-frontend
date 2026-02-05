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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/admin_ui/dialog";


type JobSchedule = {
    id: number;
    job_definition_id: number;
    timezone: string;
    frequency: string;
    interval_value: number;
    next_run_at: string;
    last_run_at?: string | null;
    lock_token?: string | null;
    lock_expires_at?: string | null;
    enabled: boolean;
    manually_triggered: boolean;
    created_at: string;
    updated_at?: string | null;
};

type FormData = {
    job_definition_id: number;
    timezone: string;
    frequency: string;
    interval_value: number;
    next_run_at: string;
    enabled: boolean;
};

const initialFormData: FormData = {
    job_definition_id: 0,
    timezone: "America/Los_Angeles",
    frequency: "DAILY",
    interval_value: 1,
    next_run_at: "",
    enabled: true,
};

const EnabledRenderer = ({ value }: { value?: boolean }) => {
    return (
        <Badge className={value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {value ? "Enabled" : "Disabled"}
        </Badge>
    );
};

const ExecutionStatusRenderer = (params: any) => {
    const isManual = params.value; // manually_triggered
    const isEnabled = params.data.enabled;

    if (isManual) {
        return (
            <Badge className="bg-red-100 text-red-800 animate-pulse">
                Run Now
            </Badge>
        );
    }
    if (isEnabled) {
        return (
            <Badge className="bg-blue-100 text-blue-800">
                Scheduled
            </Badge>
        );
    }
    return (
        <Badge className="bg-gray-100 text-gray-800">
            Disabled
        </Badge>
    );
};

const ScheduleActionsRenderer = (params: any) => {
    const [loading, setLoading] = useState(false);
    const [confirmRunNowOpen, setConfirmRunNowOpen] = useState(false);
    const [confirmStopOpen, setConfirmStopOpen] = useState(false);
    const isArmed = params.data.manually_triggered;

    const handleRunNow = async () => {
        setLoading(true);
        try {
            await apiFetch(`/job-schedule/${params.data.id}/run-now`, { method: "POST" });
            toast.success("Job armed successfully!");
            params.context.componentParent.fetchJobSchedules(true);
        } catch (error) {
            toast.error("Failed to arm job");
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        setLoading(true);
        try {
            await apiFetch(`/job-schedule/${params.data.id}`, {
                method: "PUT",
                body: { manually_triggered: false, enabled: false }
            });
            toast.success("Job stopped and disabled.");
            params.context.componentParent.fetchJobSchedules(true);
        } catch (error) {
            toast.error("Failed to stop job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {isArmed ? (
                <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setConfirmStopOpen(true)}
                    disabled={loading}
                >
                    {loading ? "Stopping..." : "Stop"}
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex items-center gap-1"
                    onClick={() => setConfirmRunNowOpen(true)}
                    disabled={loading}
                >
                    <RefreshCw className={loading ? "animate-spin w-3 h-3" : "w-3 h-3"} />
                    {loading ? "Starting..." : "Run Now"}
                </Button>
            )}

            <ConfirmDialog
                isOpen={confirmRunNowOpen}
                onClose={() => setConfirmRunNowOpen(false)}
                onConfirm={handleRunNow}
                title="Run Job Now"
                message="Are you sure you want to ARM this job for immediate execution?"
                confirmText="Run Now"
            />

            <ConfirmDialog
                isOpen={confirmStopOpen}
                onClose={() => setConfirmStopOpen(false)}
                onConfirm={handleStop}
                title="Stop Job"
                message="Are you sure you want to STOP this job? This will Disable the schedule."
                confirmText="Stop"
            />
        </>
    );
};

export default function JobSchedulePage() {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [jobSchedules, setJobSchedules] = useState<JobSchedule[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);
    const [error, setError] = useState<string | null>(null);
    const [newJobForm, setNewJobForm] = useState(false);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [formSaveLoading, setFormSaveLoading] = useState(false);

    const apiEndpoint = useMemo(() => "/job-schedule", []);

    const fetchJobSchedules = useCallback(
        async (forceRefresh: boolean = false) => {
            setLoading(true);
            try {
                const url = apiEndpoint;
                const data = forceRefresh ? await apiFetch(url) : await cachedApiFetch(url);
                const schedulesData = Array.isArray(data) ? data : (data?.data || []);
                setJobSchedules(schedulesData);
            } catch (err) {
                const error = err instanceof Error ? err.message : "Failed to load job schedules";
                setError(error);
                toast.error(error);
            } finally {
                setLoading(false);
            }
        },
        [apiEndpoint]
    );

    useEffect(() => {
        fetchJobSchedules();
    }, [fetchJobSchedules]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
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
            await fetchJobSchedules(true);
            toast.success("Job schedule created successfully!");
            setNewJobForm(false);
            setFormData(initialFormData);
        } catch (error) {
            toast.error("Failed to create job schedule");
            console.error("Error creating job schedule:", error);
        } finally {
            setFormSaveLoading(false);
        }
    };

    const handleRowUpdated = useCallback(
        async (updatedRow: JobSchedule) => {
            try {
                const { id, created_at, updated_at, ...payload } = updatedRow;
                await apiFetch(`${apiEndpoint}/${id}`, { method: "PUT", body: payload });
                setJobSchedules(prevSchedules =>
                    prevSchedules.map(schedule =>
                        schedule.id === id ? { ...schedule, ...payload } : schedule
                    )
                );
                toast.success("Job schedule updated successfully");
            } catch (error) {
                toast.error("Failed to update job schedule");
                console.error(error);
            }
        },
        [apiEndpoint]
    );

    const handleRowDeleted = useCallback(
        async (id: number) => {
            try {
                await apiFetch(`${apiEndpoint}/${id}`, { method: "DELETE" });
                setJobSchedules(prev => prev.filter(schedule => schedule.id !== id));
                toast.success("Job schedule deleted successfully");
            } catch (error) {
                toast.error("Failed to delete job schedule");
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
                editable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "frequency",
                headerName: "Frequency",
                width: 150,
                editable: true,
                cellEditor: "agSelectCellEditor",
                cellEditorParams: {
                    values: ["ONCE", "HOURLY", "DAILY", "WEEKLY", "MONTHLY"],
                },
            },
            {
                field: "interval_value",
                headerName: "Interval",
                width: 120,
                editable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "timezone",
                headerName: "Timezone",
                width: 200,
                editable: true,
            },
            {
                field: "next_run_at",
                headerName: "Next Run",
                width: 180,
                editable: true,
                valueFormatter: (params: any) => {
                    if (!params.value) return "";
                    return new Date(params.value).toLocaleString();
                },
            },
            {
                field: "last_run_at",
                headerName: "Last Run",
                width: 180,
                valueFormatter: (params: any) => {
                    if (!params.value) return "Never";
                    return new Date(params.value).toLocaleString();
                },
            },
            {
                field: "enabled",
                headerName: "Enabled",
                width: 120,
                editable: true,
                cellRenderer: EnabledRenderer,
                cellEditor: "agSelectCellEditor",
                cellEditorParams: {
                    values: [true, false],
                },
            },
            {
                field: "manually_triggered",
                headerName: "Execution Status",
                width: 140,
                cellRenderer: ExecutionStatusRenderer,
            },
            {
                field: "lock_token",
                headerName: "Lock Token",
                width: 150,
                filter: "agTextColumnFilter",
            },
            {
                field: "lock_expires_at",
                headerName: "Lock Expires",
                width: 180,
                valueFormatter: (params: any) => {
                    if (!params.value) return "";
                    return new Date(params.value).toLocaleString();
                },
            },
            {
                field: "created_at",
                headerName: "Created At",
                width: 180,
                valueFormatter: (params: any) => {
                    if (!params.value) return "";
                    return new Date(params.value).toLocaleString();
                },
            },
            {
                field: "updated_at",
                headerName: "Updated At",
                width: 180,
                valueFormatter: (params: any) => {
                    if (!params.value) return "";
                    return new Date(params.value).toLocaleString();
                },
            },
            {
                headerName: "Actions",
                width: 120,
                cellRenderer: ScheduleActionsRenderer,
                pinned: "right",
            },
        ],
        []
    );

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return jobSchedules;
        const term = searchTerm.toLowerCase();
        return jobSchedules.filter(schedule =>
            schedule.frequency?.toLowerCase().includes(term) ||
            schedule.timezone?.toLowerCase().includes(term) ||
            schedule.id.toString().includes(term)
        );
    }, [jobSchedules, searchTerm]);

    return (
        <div className="p-6 space-y-4">
            <Toaster position="top-right" richColors />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Job Schedules
                    </h1>
                    <div className="max-w-md">
                        <div className="relative mt-1">
                            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search job schedules..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-96"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={newJobForm} onOpenChange={setNewJobForm}>
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-0 overflow-hidden border border-gray-200 dark:border-gray-700">
                    <DialogHeader className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <DialogTitle>Create New Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border rounded-md bg-blue-50/50 dark:bg-blue-900/10 col-span-2 space-y-4">
                                    <h3 className="text-sm font-semibold border-b border-blue-100 pb-2 flex items-center gap-2">
                                        ⏱️ Scheduling Strategy
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">Repeat Frequency</label>
                                            <select
                                                name="frequency"
                                                value={formData.frequency}
                                                onChange={handleFormChange}
                                                className="w-full h-10 border rounded-md px-3 py-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            >
                                                <option value="ONCE">🚀 Once (One-time Run)</option>
                                                <option value="HOURLY">🕒 Hourly (Repeats every X hours)</option>
                                                <option value="DAILY">📅 Daily (Repeats every X days)</option>
                                                <option value="WEEKLY">🗓️ Weekly (Repeats every X weeks)</option>
                                                <option value="MONTHLY">🌑 Monthly (Repeats every X months)</option>
                                            </select>
                                            {formData.frequency && (
                                                <p className="mt-1 text-[10px] text-gray-400 italic">
                                                    {formData.frequency === "ONCE" && "Run once at the scheduled time and then disable."}
                                                    {formData.frequency === "HOURLY" && "Great for sending small batches throughout the day."}
                                                    {formData.frequency === "DAILY" && "Standard daily outreach strategy."}
                                                </p>
                                            )}
                                        </div>

                                        {formData.frequency !== "ONCE" && (
                                            <div>
                                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">
                                                    Repeat Every
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <Input
                                                        name="interval_value"
                                                        type="number"
                                                        value={formData.interval_value}
                                                        onChange={handleFormChange}
                                                        className="w-24 h-10"
                                                        min="1"
                                                        required
                                                    />
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {formData.frequency === "HOURLY" && (formData.interval_value === 1 ? "Hour" : "Hours")}
                                                        {formData.frequency === "DAILY" && (formData.interval_value === 1 ? "Day" : "Days")}
                                                        {formData.frequency === "WEEKLY" && (formData.interval_value === 1 ? "Week" : "Weeks")}
                                                        {formData.frequency === "MONTHLY" && (formData.interval_value === 1 ? "Month" : "Months")}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Job Definition ID</label>
                                    <Input
                                        name="job_definition_id"
                                        type="number"
                                        value={formData.job_definition_id}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Timezone</label>
                                    <Input
                                        name="timezone"
                                        value={formData.timezone}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">First Execution Time (Start At)</label>
                                    <Input
                                        name="next_run_at"
                                        type="datetime-local"
                                        value={formData.next_run_at}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>

                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${formData.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            <div className={`bg-white w-3 h-3 rounded-full transition-transform ${formData.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                        <input
                                            type="checkbox"
                                            name="enabled"
                                            checked={formData.enabled}
                                            onChange={handleFormChange}
                                            className="hidden"
                                        />
                                        <span className="text-sm font-semibold group-hover:text-blue-500 transition-colors">Enabled</span>
                                    </label>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12" disabled={formSaveLoading}>
                                {formSaveLoading ? "🚀 Creating Schedule..." : "✅ Confirm & Start Schedule"}
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>


            {showLoader ? (
                <Loader />
            ) : (
                <AGGridTable
                    title={`Job Schedules (${filteredData.length})`}
                    rowData={filteredData}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    showAddButton={true}
                    onAddClick={() => setNewJobForm(!newJobForm)}
                    context={{ componentParent: { fetchJobSchedules } }}
                />
            )}
        </div>
    );
}
