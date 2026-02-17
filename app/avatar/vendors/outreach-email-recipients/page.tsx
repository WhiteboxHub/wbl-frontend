"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/admin_ui/badge";
import { ColDef } from "ag-grid-community";
import { toast, Toaster } from "sonner";
import { AGGridTable } from "@/components/AGGridTable";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import api from "@/lib/api";
import { Loader } from "@/components/admin_ui/loader";



type OutreachEmailRecipient = {
    id: number;
    email: string;
    email_invalid: boolean;
    domain_invalid: boolean;
    email_lc?: string | null;
    source_type: string;
    source_id?: number | null;
    status: string;
    unsubscribe_flag: boolean;
    unsubscribe_at?: string | null;
    unsubscribe_reason?: string | null;
    bounce_flag: boolean;
    bounce_type?: string | null;
    bounce_reason?: string | null;
    bounce_code?: string | null;
    bounced_at?: string | null;
    complaint_flag: boolean;
    complained_at?: string | null;
    created_at: string;
    updated_at?: string | null;
};


const StatusRenderer = (params: any) => {
    const status = params.value?.toLowerCase();
    let badgeClass =
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    if (status === "active") {
        badgeClass =
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    } else if (status === "inactive") {
        badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }
    return <Badge className={badgeClass}>{params.value?.toUpperCase()}</Badge>;
};


const BooleanRenderer = (params: any) => {
    const value = params.value;
    let badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    let text = "NO";

    if (value === true || value === "true") {
        badgeClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        text = "YES";
    } else {
        badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }

    return <Badge className={badgeClass}>{text}</Badge>;
};


export default function OutreachEmailRecipientsPage() {
    const [allRecipients, setAllRecipients] = useState<OutreachEmailRecipient[]>([]);
    const [filteredRecipients, setFilteredRecipients] = useState<OutreachEmailRecipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchRecipients = useCallback(async () => {
        setLoading(true);
        try {
            const pageSize = 5000;
            let allData: OutreachEmailRecipient[] = [];
            let currentPage = 1;
            let hasNext = true;

            while (hasNext) {
                const response = await api.get(`/outreach-email-recipients/paginated?page=${currentPage}&page_size=${pageSize}`);
                const { data, has_next } = response.data;
                allData = [...allData, ...data];
                hasNext = has_next;
                currentPage++;
                if (currentPage > 100) break;
            }

            setAllRecipients(allData);
            setFilteredRecipients(allData);
        } catch (error) {
            console.error("Error fetching recipients:", error);
            toast.error("Failed to load recipients");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecipients();
    }, [fetchRecipients]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredRecipients(allRecipients);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = allRecipients.filter((r) => {
                return (
                    (r.email.toLowerCase().includes(lower)) ||
                    (r.source_type.toLowerCase().includes(lower)) ||
                    (r.status.toLowerCase().includes(lower))
                );
            });
            setFilteredRecipients(filtered);
        }
    }, [searchTerm, allRecipients]);

    const handleRowUpdated = async (updatedData: any) => {
        try {
            const id = updatedData.id;
            const { id: _, created_at, updated_at, email_lc, ...dataToSave } = updatedData;
            const response = await api.put(`/outreach-email-recipients/${id}`, dataToSave);
            const updatedRecord = response.data;
            setAllRecipients((prev) =>
                prev.map((row) => (row.id === id ? { ...row, ...updatedRecord } : row))
            );
            toast.success("Recipient updated successfully");
        } catch (error: any) {
            console.error("Error updating recipient:", error);
            toast.error("Failed to update recipient");
        }
    };

    const handleRowDeleted = async (id: string | number) => {
        try {
            await api.delete(`/outreach-email-recipients/${id}`);
            setAllRecipients((prev) => prev.filter((row) => row.id !== id));
            toast.success("Recipient deleted successfully");
        } catch (error: any) {
            console.error("Error deleting recipient:", error);
            toast.error("Failed to delete recipient");
        }
    };

    const handleRowAdded = async (newData: any) => {
        try {
            const response = await api.post("/outreach-email-recipients/", newData);
            const addedRecord = response.data;
            setAllRecipients((prev) => [addedRecord, ...prev]);
            toast.success("Recipient added successfully");
        } catch (error: any) {
            console.error("Error adding recipient:", error);
            toast.error("Failed to add recipient");
        }
    };

    const columnDefs: ColDef[] = useMemo(
        () => [
            { field: "id", headerName: "ID", width: 80, sortable: true, filter: "agNumberColumnFilter", pinned: "left" },
            { field: "email", headerName: "Email", width: 220, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "status", headerName: "Status", width: 120, sortable: true, filter: "agTextColumnFilter", cellRenderer: StatusRenderer, editable: true },
            { field: "source_type", headerName: "Source Type", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "email_invalid", headerName: "Invalid Email", width: 130, sortable: true, filter: "agSetColumnFilter", cellRenderer: BooleanRenderer, editable: true },
            { field: "domain_invalid", headerName: "Invalid Domain", width: 140, sortable: true, filter: "agSetColumnFilter", cellRenderer: BooleanRenderer, editable: true },
            { field: "unsubscribe_flag", headerName: "Unsubscribed", width: 140, sortable: true, filter: "agSetColumnFilter", cellRenderer: BooleanRenderer, editable: true },
            { field: "bounce_flag", headerName: "Bounced", width: 120, sortable: true, filter: "agSetColumnFilter", cellRenderer: BooleanRenderer, editable: true },
            { field: "complaint_flag", headerName: "Complaint", width: 120, sortable: true, filter: "agSetColumnFilter", cellRenderer: BooleanRenderer, editable: true },
            { field: "unsubscribe_reason", headerName: "Unsub Reason", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true, valueParser: (params) => params.newValue === "" ? null : params.newValue },
            { field: "bounce_reason", headerName: "Bounce Reason", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true, valueParser: (params) => params.newValue === "" ? null : params.newValue },
        ],
        []
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Outreach Email Recipients</h1>
                    <p className="text-muted-foreground">Manage outreach email recipients and statuses.</p>
                </div>
            </div>

            <div className="max-w-md">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</Label>
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        type="text"
                        value={searchTerm}
                        placeholder="Search by email, source type, status..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader />
                </div>
            ) : (
                <AGGridTable
                    rowData={filteredRecipients}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    onRowAdded={handleRowAdded}
                    title={`Recipients (${filteredRecipients.length})`}
                    showAddButton={true}
                />
            )}
        </div>
    );
}
