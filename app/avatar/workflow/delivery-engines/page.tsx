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
    if (status === "active") badgeClass = "bg-green-100 text-green-800";
    else if (status === "inactive") badgeClass = "bg-red-100 text-red-800";
    else if (status === "deprecated") badgeClass = "bg-orange-100 text-orange-800";
    return <Badge className={badgeClass}>{params.value?.toUpperCase()}</Badge>;
};

export default function DeliveryEnginesPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get("/delivery-engine/");
            setData(res.data);
        } catch (err) {
            toast.error("Failed to fetch delivery engines");
        } finally {
            setLoading(false);
        }
    };

    const columnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", width: 80, sortable: true, pinned: "left" },
        { field: "name", headerName: "Name", width: 200, editable: true, sortable: true },
        { field: "engine_type", headerName: "Type", width: 140, editable: true, sortable: true },
        { field: "host", headerName: "Host", width: 200, editable: true, sortable: true },
        { field: "port", headerName: "Port", width: 100, editable: true, sortable: true },
        { field: "username", headerName: "Username", width: 200, editable: true, sortable: true },
        { field: "password", headerName: "Password", width: 200, editable: true, sortable: true },
        { field: "api_key", headerName: "API Key", width: 200, editable: true, sortable: true },
        { field: "from_email", headerName: "From Email", width: 220, editable: true, sortable: true },
        { field: "from_name", headerName: "From Name", width: 180, editable: true, sortable: true },
        { field: "status", headerName: "Status", cellRenderer: StatusRenderer, width: 120, editable: true, sortable: true },
        { field: "max_recipients_per_run", headerName: "Max Recips/Run", width: 150, editable: true, sortable: true },
        { field: "batch_size", headerName: "Batch Size", width: 120, editable: true, sortable: true },
        { field: "rate_limit_per_minute", headerName: "Rate Limit", width: 120, editable: true, sortable: true },
        { field: "dedupe_window_minutes", headerName: "Dedupe Window", width: 150, editable: true, sortable: true },
        {
            field: "retry_policy",
            headerName: "Retry Policy",
            width: 250,
            editable: true,
            sortable: true,
            valueFormatter: (p) => p.value ? JSON.stringify(p.value) : ""
        },
        { field: "max_retries", headerName: "Max Retries", width: 120, editable: true, sortable: true },
        { field: "timeout_seconds", headerName: "Timeout (s)", width: 120, editable: true, sortable: true },
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
            const res = await api.post("/delivery-engine/", newRow);
            setData((prev: any) => [res.data, ...prev]);
            toast.success("Delivery engine added successfully");
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to add engine");
        }
    };

    const handleRowUpdated = async (row: any) => {
        try {
            await api.put(`/delivery-engine/${row.id}`, row);
            toast.success("Delivery engine updated");
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleRowDeleted = async (id: any) => {
        try {
            await api.delete(`/delivery-engine/${id}`);
            setData(prev => prev.filter((item: any) => item.id !== id));
            toast.success("Delivery engine deleted");
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
                        Delivery Engines Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Configure and manage your email delivery services</p>
                </div>
            </div>

            <div className="flex w-full justify-center">
                <AGGridTable
                    title={`Delivery Engines (${data.length})`}
                    rowData={data}
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
