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
    else if (status === "draft") badgeClass = "bg-yellow-100 text-yellow-800";
    else if (status === "inactive") badgeClass = "bg-red-100 text-red-800";
    return <Badge className={badgeClass}>{params.value?.toUpperCase()}</Badge>;
};

export default function EmailTemplatesPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get("/email-template/");
            setData(res.data);
        } catch (err) {
            toast.error("Failed to fetch email templates");
        } finally {
            setLoading(false);
        }
    };

    const columnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", width: 80, sortable: true },
        { field: "template_key", headerName: "Template Key", width: 180, editable: true, sortable: true },
        { field: "name", headerName: "Name", width: 220, editable: true, sortable: true },
        { field: "subject", headerName: "Subject", width: 250, editable: true, sortable: true },
        { field: "status", headerName: "Status", cellRenderer: StatusRenderer, width: 120, editable: true, sortable: true },
        { field: "version", headerName: "v.", width: 80, editable: true, sortable: true },
        {
            field: "last_mod_time",
            headerName: "Updated Date",
            width: 180,
            sortable: true,
            valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : ""
        },
    ], []);

    const handleRowAdded = async (newRow: any) => {
        try {
            if (!newRow.template_key || !newRow.name || !newRow.subject || !newRow.content_html) {
                toast.error("Template Key, Name, Subject, and Content HTML are required");
                return;
            }
            const res = await api.post("/email-template/", newRow);
            setData((prev: any) => [res.data, ...prev]);
            toast.success("Email template created successfully");
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to create template");
        }
    };

    const handleRowUpdated = async (row: any) => {
        try {
            await api.put(`/email-template/${row.id}`, row);
            toast.success("Email template updated");
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleRowDeleted = async (id: any) => {
        try {
            await api.delete(`/email-template/${id}`);
            setData(prev => prev.filter((item: any) => item.id !== id));
            toast.success("Email template deleted");
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
                        Email Templates Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage and version your outreach content</p>
                </div>
            </div>

            <div className="flex w-full justify-center">
                <AGGridTable
                    title={`Email Templates (${data.length})`}
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
