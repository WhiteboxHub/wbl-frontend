"use client";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { ColDef } from "ag-grid-community";
import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { toast, Toaster } from "sonner";
import { Loader } from "@/components/admin_ui/loader";

const StatusRenderer = (params: any) => {
    const status = params.value?.toLowerCase();
    let badgeClass = "bg-gray-100 text-gray-800";
    if (status === "active") badgeClass = "bg-green-100 text-green-800";
    else if (status === "inactive") badgeClass = "bg-red-100 text-red-800";
    return <Badge className={badgeClass}>{params.value?.toUpperCase()}</Badge>;
};

const BooleanRenderer = (params: any) => {
    const val = params.value;
    return (
        <Badge className={val ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
            {val ? "YES" : "NO"}
        </Badge>
    );
};

export default function OutreachContactsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const data = await cachedApiFetch("/outreach-contact/");
            setData(data);
        } catch (err) {
            toast.error("Failed to fetch outreach contacts");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const columnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", width: 80, sortable: true },
        { field: "email", headerName: "Email Address", width: 220, editable: true, sortable: true },
        { field: "source_type", headerName: "Source", width: 140, editable: true, sortable: true },
        { field: "status", headerName: "Status", cellRenderer: StatusRenderer, width: 120, editable: true, sortable: true },
        { field: "unsubscribe_flag", headerName: "Unsubscribed", cellRenderer: BooleanRenderer, width: 140, editable: true, sortable: true },
        { field: "bounce_flag", headerName: "Bounced", cellRenderer: BooleanRenderer, width: 120, editable: true, sortable: true },
        { field: "complaint_flag", headerName: "Complaint", cellRenderer: BooleanRenderer, width: 120, editable: true, sortable: true },
        { field: "created_at", headerName: "Added Date", width: 180, sortable: true, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : "" },
        { field: "updated_at", headerName: "Updated Date", width: 180, sortable: true, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : "" },
    ], []);

    const handleRowAdded = async (newRow: any) => {
        try {
            if (!newRow.email || !newRow.source_type) {
                toast.error("Email and Source Type are required");
                return;
            }
            const res = await api.post("/outreach-contact/", newRow);
            await invalidateCache("/outreach-contact/");
            setData((prev: any) => [res.data, ...prev]);
            toast.success("Outreach contact added successfully");
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to add contact");
        }
    };

    const handleRowUpdated = async (row: any) => {
        try {
            await api.put(`/outreach-contact/${row.id}`, row);
            await invalidateCache("/outreach-contact/");
            toast.success("Outreach contact updated");
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleRowDeleted = async (id: any) => {
        try {
            await api.delete(`/outreach-contact/${id}`);
            await invalidateCache("/outreach-contact/");
            setData(prev => prev.filter((item: any) => item.id !== id));
            toast.success("Outreach contact deleted");
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
                        Outreach Contacts Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage vendor engagement and suppression lists</p>
                </div>
            </div>

            <div className="flex w-full justify-center">
                <AGGridTable
                    title={`Outreach Contacts (${data.length})`}
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
