"use client";
import React, { useState, useEffect, useMemo } from "react";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import api, { apiFetch } from "@/lib/api";
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { toast, Toaster } from "sonner";
import { Loader } from "@/components/admin_ui/loader";
import { Input } from "@/components/admin_ui/input";
import { SearchIcon } from "lucide-react";
import { Label } from "@/components/admin_ui/label";

const StatusRenderer = (params: any) => {
    const status = params.value?.toLowerCase();
    let badgeClass = "bg-gray-100 text-gray-800";
    if (status === "sent") badgeClass = "bg-green-100 text-green-800";
    else if (status === "failed") badgeClass = "bg-red-100 text-red-800";
    else if (status === "bounced") badgeClass = "bg-orange-100 text-orange-800";
    else if (status === "processing") badgeClass = "bg-blue-100 text-blue-800 animate-pulse";
    else if (status === "pending") badgeClass = "bg-gray-100 text-gray-800 text-xs";
    return <Badge className={badgeClass}>{params.value?.toUpperCase()}</Badge>;
};

export default function CampaignEmailsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await cachedApiFetch("/campaign-emails/");
            const rawData = Array.isArray(res) ? res : (res?.data ?? []);
            const sortedData = rawData.slice().sort((a: any, b: any) => b.id - a.id);
            setData(sortedData);
            setFilteredData(sortedData);
        } catch (err: any) {
            const msg = err?.body || err?.message || "Failed to fetch campaign emails";
            toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
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
            const idMatch = row.id?.toString().includes(lower);
            const workflowMatch = row.workflow_id?.toString().includes(lower);
            const candidateMatch = row.candidate_id?.toString().includes(lower);
            const emailMatch = row.vendor_email?.toLowerCase().includes(lower);
            const statusMatch = row.status?.toLowerCase().includes(lower);

            return idMatch || workflowMatch || candidateMatch || emailMatch || statusMatch;
        });

        setFilteredData(filtered);
    }, [searchTerm, data]);

    const handleRowAdded = async (newData: any) => {
        try {
            const formData = {
                workflow_id: Number(newData.workflow_id),
                candidate_id: Number(newData.candidate_id),
                vendor_email: newData.vendor_email,
                status: newData.status || "pending",
                bounce_type: newData.bounce_type || "none",
                retry_count: Number(newData.retry_count || 0),
                scheduler_id: newData.scheduler_id ? Number(newData.scheduler_id) : null,
                run_log_id: newData.run_log_id ? Number(newData.run_log_id) : null,
                credential_id: newData.credential_id ? Number(newData.credential_id) : null,
                message_id: newData.message_id || null,
                error_message: newData.error_message || null,
            };
            const res = await api.post("/campaign-emails/", formData);
            await invalidateCache("/campaign-emails/");
            const newEmail = res?.data?.data || res?.data || res;
            setData((prev) => [newEmail, ...prev]);
            toast.success("Campaign email created.");
        } catch (err: any) {
            toast.error("Create failed: " + (err.body?.detail || err.message || "Unknown error"));
        }
    };

    const handleRowUpdated = async (updatedData: any) => {
        try {
            const formData = {
                status: updatedData.status,
                bounce_type: updatedData.bounce_type || "none",
                retry_count: Number(updatedData.retry_count || 0),
                scheduler_id: updatedData.scheduler_id ? Number(updatedData.scheduler_id) : null,
                run_log_id: updatedData.run_log_id ? Number(updatedData.run_log_id) : null,
                credential_id: updatedData.credential_id ? Number(updatedData.credential_id) : null,
                message_id: updatedData.message_id || null,
                error_message: updatedData.error_message || null
            };
            await api.put(`/campaign-emails/${updatedData.id}`, formData);
            await invalidateCache("/campaign-emails/");
            setData((prev) =>
                prev.map((item: any) => (item.id === updatedData.id ? { ...item, ...updatedData } : item))
            );
            toast.success(`Campaign email ${updatedData.id} updated.`);
        } catch (err: any) {
            toast.error("Update failed: " + (err.body?.detail || err.message || "Unknown error"));
        }
    };

    const handleRowDeleted = async (id: number) => {
        try {
            await api.delete(`/campaign-emails/${id}`);
            await invalidateCache("/campaign-emails/");
            setData(prev => prev.filter((item: any) => item.id !== id));
            toast.success(`Campaign email ${id} deleted.`);
        } catch (err: any) {
            toast.error("Delete failed");
        }
    };

    const columnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", width: 80, sortable: true, pinned: "left" },
        { field: "workflow_id", headerName: "Workflow ID", width: 130, sortable: true, editable: true },
        { field: "candidate_id", headerName: "Candidate ID", width: 130, sortable: true, editable: true },
        { field: "vendor_email", headerName: "Vendor Email", width: 250, sortable: true, editable: true },
        { field: "scheduler_id", headerName: "Scheduler ID", width: 130, sortable: true, editable: true },
        { field: "status", headerName: "Status", cellRenderer: StatusRenderer, width: 140, sortable: true, editable: true },
        { field: "bounce_type", headerName: "Bounce Type", width: 130, sortable: true, editable: true },
        { field: "retry_count", headerName: "Retries", width: 100, sortable: true, editable: true },
        { field: "run_log_id", headerName: "Run Log ID", width: 130, sortable: true, editable: true },
        { field: "credential_id", headerName: "Credential ID", width: 130, sortable: true, editable: true },
        { field: "message_id", headerName: "Message ID", width: 200, sortable: true, editable: true },
        { field: "error_message", headerName: "Error", width: 250, sortable: true, editable: true },
        { field: "last_attempt_at", headerName: "Last Attempt", width: 180, sortable: true, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : "-" },
        { 
            field: "created_at", 
            headerName: "Created Date", 
            width: 180, 
            sortable: true, 
            filter: "agDateColumnFilter",
            valueFormatter: ({ value }: ValueFormatterParams) => {
                if (!value) return "-";
                const datePart = typeof value === 'string' ? value.split('T')[0] : new Date(value).toISOString().split('T')[0];
                const [year, month, day] = datePart.split('-');
                return `${month ?? ''}/${day ?? ''}/${year ?? ''}`;
            }
        },
        { 
            field: "updated_at", 
            headerName: "Updated Date", 
            width: 180, 
            sortable: true, 
            filter: "agDateColumnFilter",
            valueFormatter: ({ value }: ValueFormatterParams) => {
                if (!value) return "-";
                const datePart = typeof value === 'string' ? value.split('T')[0] : new Date(value).toISOString().split('T')[0];
                const [year, month, day] = datePart.split('-');
                return `${month ?? ''}/${day ?? ''}/${year ?? ''}`;
            }
        },
    ], []);

    if (loading && data.length === 0) return <Loader />;

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Campaign Emails
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Detailed logs of all weekly outreach emails sent to vendors</p>
                </div>
            </div>

            {/* Search bar */}
            <div className="max-w-md">
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by ID, Workflow, Candidate, Email, or Status..."
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="flex w-full justify-center">
                <AGGridTable
                    title={`Campaign Emails (${filteredData.length})`}
                    rowData={filteredData}
                    columnDefs={columnDefs}
                    height="calc(75vh)"
                    onRowAdded={handleRowAdded}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    showSearch={false}
                    showAddButton={true}
                />
            </div>
        </div>
    );
}
