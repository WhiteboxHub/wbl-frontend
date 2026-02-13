"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { ColDef } from "ag-grid-community";
import { toast, Toaster } from "sonner";
import { AGGridTable } from "@/components/AGGridTable";
import { SearchIcon, Linkedin } from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import api from "@/lib/api";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

type CompanyContact = {
    id: number;
    company_id: number;
    name?: string | null;
    job_title?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    phone?: string | null;
    phone_ext?: string | null;
    email?: string | null;
    notes?: string | null;
    linkedin_id?: string | null;
    linkedin_internal_id?: string | null;
    created_datetime: string;
    created_userid: string;
    lastmod_datetime: string;
    lastmod_userid: string;
};

const LinkedinCellRenderer = (params: any) => {
    let url = (params.value || "").trim();
    if (!url) return <span className="text-gray-400 opacity-60">N/A</span>;
    if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
    }
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="View LinkedIn Profile"
            onClick={(e) => e.stopPropagation()}
        >
            <Linkedin className="h-4 w-4 text-[#0a66c2]" />
        </a>
    );
};

export default function CompanyContactsPage() {
    const [allContacts, setAllContacts] = useState<CompanyContact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const showLoader = useMinimumLoadingTime(loading);

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const pageSize = 5000;
            let allData: CompanyContact[] = [];
            let currentPage = 1;
            let hasNext = true;

            while (hasNext) {
                const response = await api.get(`/company-contacts/paginated?page=${currentPage}&page_size=${pageSize}`);
                const { data, has_next } = response.data;

                allData = [...allData, ...data];

                hasNext = has_next;
                currentPage++;

                // Safety break to prevent infinite loops (40 pages for 200k records at 5k/page, 100 is safe)
                if (currentPage > 100) break;
            }

            setAllContacts(allData);
            setFilteredContacts(allData);
        } catch (error) {
            console.error("Error fetching company contacts:", error);
            toast.error("Failed to load company contacts");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredContacts(allContacts);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = allContacts.filter((c) => {
                return (
                    (c.name?.toLowerCase().includes(lower)) ||
                    (c.email?.toLowerCase().includes(lower)) ||
                    (c.job_title?.toLowerCase().includes(lower)) ||
                    (c.city?.toLowerCase().includes(lower)) ||
                    (c.phone?.toLowerCase().includes(lower))
                );
            });
            setFilteredContacts(filtered);
        }
    }, [searchTerm, allContacts]);

    const handleRowUpdated = async (updatedData: any) => {
        try {
            const id = updatedData.id;
            const { id: _, created_datetime, created_userid, lastmod_datetime, lastmod_userid, ...dataToSave } = updatedData;

            const response = await api.put(`/company-contacts/${id}`, dataToSave);
            const updatedRecord = response.data;

            setAllContacts((prev) =>
                prev.map((row) => (row.id === id ? { ...row, ...updatedRecord } : row))
            );
            toast.success("Contact updated successfully");
        } catch (error: any) {
            console.error("Error updating contact:", error);
            toast.error("Failed to update contact");
        }
    };

    const handleRowDeleted = async (id: string | number) => {
        try {
            await api.delete(`/company-contacts/${id}`);
            setAllContacts((prev) => prev.filter((row) => row.id !== id));
            toast.success("Contact deleted successfully");
        } catch (error: any) {
            console.error("Error deleting contact:", error);
            toast.error("Failed to delete contact");
        }
    };

    const handleRowAdded = async (newData: any) => {
        try {
            const response = await api.post("/company-contacts/", newData);
            const addedRecord = response.data;
            setAllContacts((prev) => [addedRecord, ...prev]);
            toast.success("Contact added successfully");
        } catch (error: any) {
            console.error("Error adding contact:", error);
            toast.error("Failed to add contact");
        }
    };

    const columnDefs: ColDef[] = useMemo(
        () => [
            { field: "id", headerName: "ID", width: 80, sortable: true, filter: "agNumberColumnFilter", pinned: "left" },
            { field: "company_id", headerName: "Company ID", width: 120, sortable: true, filter: "agNumberColumnFilter", editable: true },
            { field: "name", headerName: "Name", width: 220, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "job_title", headerName: "Job Title", width: 180, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "email", headerName: "Email", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "phone", headerName: "Phone", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "linkedin_id", headerName: "LinkedIn", width: 100, sortable: true, filter: "agTextColumnFilter", editable: true, cellRenderer: LinkedinCellRenderer },
            { field: "city", headerName: "City", width: 120, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "state", headerName: "State", width: 100, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "address1", headerName: "Address 1", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "notes", headerName: "Notes", width: 300, sortable: true, filter: "agTextColumnFilter", editable: true },
            // { field: "created_datetime", headerName: "Created On", width: 180, sortable: true, filter: "agDateColumnFilter", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "" },
            // { field: "lastmod_datetime", headerName: "Last Modified", width: 180, sortable: true, filter: "agDateColumnFilter", valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "" },
        ],
        []
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Company Contacts</h1>
                    <p className="text-muted-foreground">Manage contacts for companies.</p>
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
                        placeholder="Search by name, email, job title..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {showLoader ? (
                <Loader />
            ) : (
                <AGGridTable
                    rowData={filteredContacts}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    onRowAdded={handleRowAdded}
                    title={`Company Contacts (${filteredContacts.length})`}
                    showAddButton={true}
                />
            )}
        </div>
    );
}
