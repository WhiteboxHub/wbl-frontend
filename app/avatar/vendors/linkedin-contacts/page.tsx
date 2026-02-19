"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { ColDef } from "ag-grid-community";
import { toast, Toaster } from "sonner";
import { AGGridTable } from "@/components/AGGridTable";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import api from "@/lib/api";
import { Loader } from "@/components/admin_ui/loader";
import { formatLinkedInUrl } from "@/lib/utils";

type LinkedinOnlyContact = {
    id: number;
    name?: string | null;
    job_title?: string | null;
    city?: string | null;
    postal_code?: string | null;
    country?: string | null;
    phone?: string | null;
    linkedin_id?: string | null;
    linkedin_internal_id?: string | null;
    notes?: string | null;
    created_datetime: string;
    created_userid: string;
    lastmod_datetime: string;
    lastmod_userid: string;
};

export default function LinkedinOnlyContactsPage() {
    const [allContacts, setAllContacts] = useState<LinkedinOnlyContact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<LinkedinOnlyContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const pageSize = 5000;
            let allData: LinkedinOnlyContact[] = [];
            let currentPage = 1;
            let hasNext = true;

            // Using paginated endpoint logic from backend routing
            while (hasNext) {
                const response = await api.get(`/linkedin-only-contacts/paginated?page=${currentPage}&page_size=${pageSize}`);
                const { data, has_next } = response.data;
                allData = [...allData, ...data];
                hasNext = has_next;
                currentPage++;
                if (currentPage > 100) break;
            }

            setAllContacts(allData);
            setFilteredContacts(allData);
        } catch (error) {
            console.error("Error fetching contacts:", error);
            toast.error("Failed to load contacts");
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
                    (c.job_title?.toLowerCase().includes(lower)) ||
                    (c.linkedin_id?.toLowerCase().includes(lower))
                );
            });
            setFilteredContacts(filtered);
        }
    }, [searchTerm, allContacts]);

    const handleRowUpdated = async (updatedData: any) => {
        try {
            const id = updatedData.id;
            const { id: _, created_datetime, created_userid, lastmod_datetime, lastmod_userid, ...dataToSave } = updatedData;

            const response = await api.put(`/linkedin-only-contacts/${id}`, dataToSave);
            const updatedRecord = response.data;
            setAllContacts((prev) =>
                prev.map((row) => (row.id === id ? { ...row, ...updatedRecord } : row))
            );
            toast.success("Contact updated successfully");
        } catch (error: any) {
            console.error("Error updating contact:", error);
            toast.error("Failed to update contact");
            fetchContacts();
        }
    };

    const handleRowDeleted = async (id: string | number) => {
        try {
            await api.delete(`/linkedin-only-contacts/${id}`);
            setAllContacts((prev) => prev.filter((row) => row.id !== id));
            toast.success("Contact deleted successfully");
        } catch (error: any) {
            console.error("Error deleting contact:", error);
            toast.error("Failed to delete contact");
        }
    };

    const handleRowAdded = async (newData: any) => {
        try {
            const response = await api.post("/linkedin-only-contacts/", newData);
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
            { field: "name", headerName: "Name", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true, valueParser: (params) => params.newValue === "" ? null : params.newValue },
            { field: "job_title", headerName: "Job Title", width: 180, sortable: true, filter: "agTextColumnFilter", editable: true, valueParser: (params) => params.newValue === "" ? null : params.newValue },
            { field: "phone", headerName: "Phone", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true, valueParser: (params) => params.newValue === "" ? null : params.newValue },
            { field: "city", headerName: "City", width: 120, sortable: true, filter: "agTextColumnFilter", editable: true, valueParser: (params) => params.newValue === "" ? null : params.newValue },
            { field: "postal_code", headerName: "Postal Code", width: 120, sortable: true, filter: "agTextColumnFilter", editable: true, valueParser: (params) => params.newValue === "" ? null : params.newValue },
            { field: "country", headerName: "Country", width: 120, sortable: true, filter: "agTextColumnFilter", editable: true, valueParser: (params) => params.newValue === "" ? null : params.newValue },
            {
                field: "linkedin_id",
                headerName: "LinkedIn ID",
                width: 150,
                sortable: true,
                filter: "agTextColumnFilter",
                editable: true,
                valueParser: (params) => params.newValue === "" ? null : params.newValue,
                cellRenderer: (params: any) => {
                    if (!params.value) return null;
                    const url = formatLinkedInUrl(params.value);
                    if (!url) return params.value;
                    return (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                            {params.value}
                        </a>
                    );
                }
            },
            { field: "linkedin_internal_id", headerName: "LinkedIn Internal ID", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true, valueParser: (params) => params.newValue === "" ? null : params.newValue },
            { field: "notes", headerName: "Notes", width: 250, sortable: true, filter: "agTextColumnFilter", editable: true, valueParser: (params) => params.newValue === "" ? null : params.newValue },
        ],
        []
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Linkedin Only Contacts</h1>
                    <p className="text-muted-foreground">Manage Linkedin only contact details.</p>
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
                        placeholder="Search by name, job title, linkedin..."
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
                    rowData={filteredContacts}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    onRowAdded={handleRowAdded}
                    title={`Linkedin Only Contacts (${filteredContacts.length})`}
                    showAddButton={true}
                />
            )}
        </div>
    );
}
