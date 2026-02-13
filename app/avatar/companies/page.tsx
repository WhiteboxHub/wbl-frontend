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
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

type Company = {
    id: number;
    name?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    phone?: string | null;
    phone_ext?: string | null;
    domain?: string | null;
    notes?: string | null;
    created_datetime: string;
    created_userid: string;
    lastmod_datetime: string;
    lastmod_userid: string;
};

export default function CompaniesPage() {
    const [allCompanies, setAllCompanies] = useState<Company[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const showLoader = useMinimumLoadingTime(loading);

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const pageSize = 5000;
            let allData: Company[] = [];
            let currentPage = 1;
            let hasNext = true;

            while (hasNext) {
                const response = await api.get(`/companies/paginated?page=${currentPage}&page_size=${pageSize}`);
                const { data, has_next } = response.data;

                allData = [...allData, ...data];

                hasNext = has_next;
                currentPage++;

                // Safety break to prevent infinite loops if something goes wrong
                if (currentPage > 100) break;
            }

            setAllCompanies(allData);
            setFilteredCompanies(allData);
        } catch (error) {
            console.error("Error fetching companies:", error);
            toast.error("Failed to load companies");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredCompanies(allCompanies);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = allCompanies.filter((c) => {
                return (
                    (c.name?.toLowerCase().includes(lower)) ||
                    (c.domain?.toLowerCase().includes(lower)) ||
                    (c.city?.toLowerCase().includes(lower)) ||
                    (c.state?.toLowerCase().includes(lower)) ||
                    (c.phone?.toLowerCase().includes(lower))
                );
            });
            setFilteredCompanies(filtered);
        }
    }, [searchTerm, allCompanies]);

    const handleRowUpdated = async (updatedData: any) => {
        try {
            const id = updatedData.id;
            // Filter out internal fields
            const { id: _, created_datetime, created_userid, lastmod_datetime, lastmod_userid, ...dataToSave } = updatedData;

            const response = await api.put(`/companies/${id}`, dataToSave);
            const updatedRecord = response.data;

            setAllCompanies((prev) =>
                prev.map((row) => (row.id === id ? { ...row, ...updatedRecord } : row))
            );
            toast.success("Company updated successfully");
        } catch (error: any) {
            console.error("Error updating company:", error);
            toast.error("Failed to update company");
        }
    };

    const handleRowDeleted = async (id: string | number) => {
        try {
            await api.delete(`/companies/${id}`);
            setAllCompanies((prev) => prev.filter((row) => row.id !== id));
            toast.success("Company deleted successfully");
        } catch (error: any) {
            console.error("Error deleting company:", error);
            toast.error("Failed to delete company");
        }
    };

    const handleRowAdded = async (newData: any) => {
        try {
            const response = await api.post("/companies/", newData);
            const addedRecord = response.data;
            setAllCompanies((prev) => [addedRecord, ...prev]);
            toast.success("Company added successfully");
        } catch (error: any) {
            console.error("Error adding company:", error);
            toast.error("Failed to add company");
        }
    };

    const columnDefs: ColDef[] = useMemo(
        () => [
            { field: "id", headerName: "ID", width: 80, sortable: true, filter: "agNumberColumnFilter", pinned: "left" },
            { field: "name", headerName: "Company Name", width: 220, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "domain", headerName: "Domain", width: 180, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "phone", headerName: "Phone", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "city", headerName: "City", width: 120, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "state", headerName: "State", width: 100, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "country", headerName: "Country", width: 120, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "address1", headerName: "Address 1", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "address2", headerName: "Address 2", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "postal_code", headerName: "Postal Code", width: 120, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "phone_ext", headerName: "Phone Ext", width: 100, sortable: true, filter: "agTextColumnFilter", editable: true },
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
                    <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
                    <p className="text-muted-foreground">Manage company information and details.</p>
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
                        placeholder="Search by name, domain, city..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {showLoader ? (
                <Loader />
            ) : (
                <AGGridTable
                    rowData={filteredCompanies}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    onRowAdded={handleRowAdded}
                    title={`Companies (${filteredCompanies.length})`}
                    showAddButton={true}
                />
            )}
        </div>
    );
}
