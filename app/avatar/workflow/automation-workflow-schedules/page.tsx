"use client";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { ColDef } from "ag-grid-community";
import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Loader } from "@/components/admin_ui/loader";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";

const EnabledRenderer = (params: any) => {
    const enabled = params.value;
    return (
        <Badge className={enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {enabled ? "ENABLED" : "DISABLED"}
        </Badge>
    );
};

export default function AutomationWorkflowSchedulesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get("/automation-workflow-schedule/");
            setData(res.data);
            setFilteredData(res.data);
        } catch (err) {
            toast.error("Failed to fetch schedules");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const lower = searchTerm.trim().toLowerCase();
        if (!lower) {
            setFilteredData(data);
            return;
        }

        const filtered = data.filter((row: any) => {
            const idMatch = row.automation_workflow_id?.toString().includes(lower);
            const freqMatch = row.frequency?.toLowerCase().includes(lower);
            const cronMatch = row.cron_expression?.toLowerCase().includes(lower);
            return idMatch || freqMatch || cronMatch;
        });

        setFilteredData(filtered);
    }, [searchTerm, data]);

    const columnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", width: 80, sortable: true, pinned: "left" },
        {
            field: "automation_workflow_id",
            headerName: "Workflow ID",
            width: 140,
            editable: true,
            sortable: true
        },
        { field: "frequency", headerName: "Frequency", width: 140, editable: true, sortable: true },
        { field: "cron_expression", headerName: "Cron", width: 160, editable: true, sortable: true },
        { field: "timezone", headerName: "Timezone", width: 160, editable: true, sortable: true },
        { field: "interval_value", headerName: "Interval Value", width: 120, editable: true, sortable: true },
        {
            field: "run_parameters",
            headerName: "Run Parameters",
            width: 250,
            editable: true,
            sortable: true,
            valueFormatter: (p) => p.value ? JSON.stringify(p.value) : ""
        },
        { field: "enabled", headerName: "Status", cellRenderer: EnabledRenderer, width: 120, editable: true, sortable: true },
        { field: "is_running", headerName: "State", width: 140, sortable: true, cellRenderer: (p: any) => p.value ? <span className="animate-pulse text-green-600 font-bold text-xs">● RUNNING</span> : <span className="text-gray-400 text-xs text-center">IDLE</span> },
        { field: "next_run_at", headerName: "Next Run", width: 180, sortable: true, editable: true, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : "Never" },
        { field: "last_run_at", headerName: "Last Run", width: 180, sortable: true, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : "Never" },
        {
            field: "created_at",
            headerName: "Created Date",
            width: 180,
            sortable: true,
            valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : ""
        },
        {
            field: "updated_at",
            headerName: "Updated Date",
            width: 180,
            sortable: true,
            valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : ""
        },
    ], []);

    const handleRowAdded = async (newRow: any) => {
        try {
            if (!newRow.automation_workflow_id || !newRow.frequency) {
                toast.error("Workflow ID and Frequency are required");
                return;
            }
            const res = await api.post("/automation-workflow-schedule/", newRow);
            setData((prev: any) => [res.data, ...prev]);
            toast.success("Schedule created successfully");
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to create schedule");
        }
    };

    const handleRowUpdated = async (row: any) => {
        try {
            await api.put(`/automation-workflow-schedule/${row.id}`, row);
            toast.success("Schedule updated");
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleRowDeleted = async (id: any) => {
        try {
            await api.delete(`/automation-workflow-schedule/${id}`);
            setData(prev => prev.filter((item: any) => item.id !== id));
            toast.success("Schedule deleted");
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Workflows Scheduler
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage execution intervals and cron settings</p>
                </div>
            </div>

            {/* Search bar */}
            <div className="max-w-md">
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Workflow ID, Frequency or Cron..."
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="flex w-full justify-center">
                <AGGridTable
                    title={`Schedules (${filteredData.length})`}
                    rowData={filteredData}
                    columnDefs={columnDefs}
                    height="600px"
                    onRowAdded={handleRowAdded}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                />
            </div>
        </div>
    );
}
