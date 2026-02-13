"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { SearchIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/admin_ui/button";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { AGGridTable } from "@/components/AGGridTable";
import { AgGridReact } from "ag-grid-react";
import { apiFetch, smartUpdate } from "@/lib/api";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

type PotentialLead = {
    id: number;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    profession?: string | null;
    linkedin_id?: string | null;
    internal_linkedin_id?: string | null;
    entry_date?: string | Date | null;
    work_status?: string | null;
    location?: string | null;
    notes?: string | null;
    lastmoddatetime?: string | Date | null;
};

const workStatusOptions = [
    "US_CITIZEN",
    "GREEN_CARD",
    "GC_EAD",
    "I485_EAD",
    "I140_APPROVED",
    "F1",
    "F1_OPT",
    "F1_CPT",
    "J1",
    "H1B",
    "H4_EAD",
    "L1A",
    "L1B",
    "O1",
    "TN",
    "E3",
    "Other"
];

const WorkStatusRenderer = ({ value }: { value?: string }) => {
    if (!value) return null;
    return (
        <Badge className="bg-blue-100 text-blue-800 capitalize">
            {value}
        </Badge>
    );
};

export default function PotentialLeadsPage() {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [leads, setLeads] = useState<PotentialLead[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<PotentialLead[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const showLoader = useMinimumLoadingTime(loading);
    const [error, setError] = useState<string | null>(null);

    const apiEndpoint = "/potential-leads";

    const fetchLeads = useCallback(async (search?: string) => {
        setLoading(true);
        try {
            let url = apiEndpoint;
            if (search) {
                url += `?search=${encodeURIComponent(search)}&search_by=all`;
            }
            const data = await apiFetch(url);
            const leadsData = Array.isArray(data) ? data : (data?.data || []);
            setLeads(leadsData);
        } catch (err) {
            const error = err instanceof Error ? err.message : "Failed to load potential leads";
            setError(error);
            toast.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredLeads(leads);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredLeads(
                leads.filter(
                    (lead) =>
                        lead.full_name?.toLowerCase().includes(term) ||
                        lead.email?.toLowerCase().includes(term) ||
                        lead.phone?.toLowerCase().includes(term) ||
                        lead.profession?.toLowerCase().includes(term) ||
                        lead.linkedin_id?.toLowerCase().includes(term)
                )
            );
        }
    }, [leads, searchTerm]);

    const handleRowUpdated = useCallback(async (updatedRow: PotentialLead) => {
        try {
            const { id, lastmoddatetime, entry_date, ...payload } = updatedRow;
            await smartUpdate("potential-leads", id, payload);
            setLeads((prev) =>
                prev.map((l) => (l.id === id ? { ...l, ...payload } : l))
            );
            toast.success("Lead updated successfully");
        } catch (error) {
            toast.error("Failed to update lead");
            console.error(error);
        }
    }, []);

    const handleRowDeleted = useCallback(async (id: number) => {
        try {
            await apiFetch(`${apiEndpoint}/${id}`, { method: "DELETE" });
            setLeads((prev) => prev.filter((l) => l.id !== id));
            toast.success("Lead deleted successfully");
        } catch (error) {
            toast.error("Failed to delete lead");
            console.error(error);
        }
    }, []);

    const formatPhoneNumber = (phoneNumberString: string) => {
        const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
        return phoneNumberString;
    };

    const columnDefs: ColDef<any, any>[] = useMemo(
        () => [
            { field: "id", headerName: "ID", width: 80, pinned: "left", sortable: true },
            { field: "full_name", headerName: "Full Name", width: 180, sortable: true, editable: true },
            {
                field: "email",
                headerName: "Email",
                width: 200,
                editable: true,
                sortable: true,
                cellRenderer: (params: any) => {
                    if (!params.value) return "";
                    return (
                        <a href={`mailto:${params.value}`} className="text-blue-600 underline hover:text-blue-800">
                            {params.value}
                        </a>
                    );
                },
            },
            {
                field: "phone",
                headerName: "Phone",
                width: 150,
                editable: true,
                sortable: true,
                cellRenderer: (params: any) => {
                    if (!params.value) return "";
                    return (
                        <a href={`tel:${params.value}`} className="text-blue-600 underline hover:text-blue-800">
                            {formatPhoneNumber(params.value)}
                        </a>
                    );
                },
            },
            { field: "profession", headerName: "Profession", width: 150, sortable: true, editable: true },
            {
                field: "linkedin_id",
                headerName: "LinkedIn ID",
                width: 200,
                editable: true,
                sortable: true,
                cellRenderer: (params: any) => {
                    if (!params.value) return "";
                    return (
                        <a
                            href={params.value.startsWith("http") ? params.value : `https://linkedin.com/in/${params.value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                        >
                            {params.value}
                        </a>
                    );
                },
            },
            { field: "work_status", headerName: "Work Status", width: 150, sortable: true, editable: true, cellEditor: "agSelectCellEditor", cellEditorParams: { values: workStatusOptions }, cellRenderer: WorkStatusRenderer },
            { field: "location", headerName: "Location", width: 150, sortable: true, editable: true },
            {
                field: "entry_date",
                headerName: "Entry Date",
                width: 150,
                sortable: true,
                valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : "-"
            },
            { field: "notes", headerName: "Notes", width: 300, sortable: true, editable: true, cellEditor: "agLargeTextCellEditor" },
        ],
        []
    );

    if (showLoader) return <Loader />;

    if (error) {
        return (
            <div className="flex h-64 flex-col items-center justify-center space-y-4">
                <div className="text-red-500">{error}</div>
                <Button variant="outline" onClick={() => fetchLeads()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Potential Leads</h1>
                    <div className="relative mt-2">
                        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-96"
                        />
                    </div>
                </div>
            </div>
            <div className="flex w-full justify-center">
                <AGGridTable
                    title={`Potential Leads (${filteredLeads.length})`}
                    rowData={filteredLeads}
                    columnDefs={columnDefs}
                    onRowAdded={async (newRow) => {
                        try {
                            const res = await apiFetch(apiEndpoint, { method: "POST", body: newRow });
                            setLeads((prev) => [res, ...prev]);
                            toast.success("Lead added successfully");
                        } catch (err) {
                            toast.error("Failed to add lead");
                        }
                    }}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    loading={loading}
                    height="600px"
                />
            </div>
        </div>
    );
}