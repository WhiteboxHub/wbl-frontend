"use client";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { ColDef } from "ag-grid-community";
import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Loader } from "@/components/admin_ui/loader";

const StatusRenderer = (params: any) => {
    const status = params.value?.toLowerCase();
    let badgeClass = "bg-gray-100 text-gray-800";
    if (status === "success") badgeClass = "bg-green-100 text-green-800";
    else if (status === "failed") badgeClass = "bg-red-100 text-red-800";
    else if (status === "running") badgeClass = "bg-blue-100 text-blue-800 animate-pulse";
    else if (status === "partial_success") badgeClass = "bg-orange-100 text-orange-800";
    else if (status === "queued") badgeClass = "bg-gray-100 text-gray-800";
    else if (status === "timed_out") badgeClass = "bg-purple-100 text-purple-800";
    return <Badge className={badgeClass}>{params.value?.toUpperCase()}</Badge>;
};

export default function AutomationWorkflowLogsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get("/automation-workflow-log/");
            setData(res.data);
        } catch (err) {
            toast.error("Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    };

    const columnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", width: 80, sortable: true, pinned: "left" },
        {
            field: "workflow.name",
            headerName: "Workflow",
            width: 200,
            sortable: true,
            valueGetter: (p) => p.data.workflow?.name || "None"
        },
        { field: "run_id", headerName: "Run ID", width: 140, sortable: true },
        { field: "schedule_id", headerName: "Schedule ID", width: 120, sortable: true },
        { field: "status", headerName: "Status", cellRenderer: StatusRenderer, width: 140, sortable: true },
        { field: "records_processed", headerName: "Processed", width: 120, sortable: true },
        { field: "records_failed", headerName: "Failed", width: 120, sortable: true },
        {
            field: "parameters_used",
            headerName: "Parameters Used",
            width: 250,
            sortable: true,
            valueFormatter: (p) => p.value ? JSON.stringify(p.value) : ""
        },
        {
            field: "execution_metadata",
            headerName: "Exec Metadata",
            width: 250,
            sortable: true,
            valueFormatter: (p) => p.value ? JSON.stringify(p.value) : ""
        },
        { field: "error_summary", headerName: "Error Summary", width: 250, sortable: true },
        { field: "started_at", headerName: "Started", width: 180, sortable: true, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : "" },
        { field: "finished_at", headerName: "Finished", width: 180, sortable: true, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : "" },
        { field: "created_at", headerName: "Created Date", width: 180, sortable: true, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : "" },
        { field: "updated_at", headerName: "Updated Date", width: 180, sortable: true, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : "" },
    ], []);

    const handleRowDeleted = async (id: any) => {
        try {
            await api.delete(`/automation-workflow-log/${id}`);
            setData(prev => prev.filter((item: any) => item.id !== id));
            toast.success("Log entry deleted");
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
                        Workflows Execution History
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Detailed logs of all automated runs</p>
                </div>
            </div>

            <div className="flex w-full justify-center">
                <AGGridTable
                    title={`Execution Logs (${data.length})`}
                    rowData={data}
                    columnDefs={columnDefs}
                    height="600px"
                    onRowDeleted={handleRowDeleted}
                />
            </div>
        </div>
    );
}
