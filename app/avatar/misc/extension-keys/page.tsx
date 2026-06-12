"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { toast, Toaster } from "sonner";
import { AGGridTable } from "@/components/AGGridTable";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import api from "@/lib/api";
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

type ExtensionKey = {
    id: number;
    user_id: number;
    uname: string;
    api_key: string;
    device_name?: string | null;
    is_active: boolean;
    created_at: string;
    last_used?: string | null;
    expires_at?: string | null;
};

const ActiveRenderer = ({ value }: { value?: boolean }) => {
    return (
        <Badge className={value ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}>
            {value ? "Active" : "Inactive"}
        </Badge>
    );
};

export default function ExtensionKeysPage() {
    const [allKeys, setAllKeys] = useState<ExtensionKey[]>([]);
    const [filteredKeys, setFilteredKeys] = useState<ExtensionKey[]>([]);
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);

    const [searchTerm, setSearchTerm] = useState("");

    const fetchKeys = useCallback(async () => {
        setLoading(true);
        try {
            const pageSize = 5000;
            let allData: ExtensionKey[] = [];
            let currentPage = 1;
            let hasNext = true;

            while (hasNext) {
                const response = await cachedApiFetch(`/extension-keys/paginated?page=${currentPage}&page_size=${pageSize}`);
                const { data, has_next } = response.data;

                allData = [...allData, ...data];
                hasNext = has_next;
                currentPage++;
                if (currentPage > 100) break;
            }

            setAllKeys(allData);
        } catch (error) {
            console.error("Error fetching extension keys:", error);
            toast.error("Failed to load extension keys");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    useEffect(() => {
        let filtered = [...allKeys];

        if (searchTerm.trim() !== "") {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter((k) => {
                return (
                    (k.uname?.toLowerCase().includes(lower)) ||
                    (k.api_key?.toLowerCase().includes(lower)) ||
                    (k.device_name?.toLowerCase().includes(lower)) ||
                    (k.user_id?.toString().includes(lower))
                );
            });
        }

        setFilteredKeys(filtered);
    }, [allKeys, searchTerm]);

    const getPayload = (data: any) => {
        const allowedFields = [
            "user_id", "uname", "api_key", "device_name", "is_active"
        ];
        const payload: Record<string, any> = {};
        allowedFields.forEach(field => {
            if (field in data) {
                payload[field] = data[field];
                if (field === 'user_id') {
                    payload[field] = parseInt(data[field]) || null;
                }
                if (field === 'is_active') {
                    payload[field] = data[field] === true || data[field] === 'true' || data[field] === 1;
                }
            }
        });
        return payload;
    };

    const handleRowUpdated = async (updatedData: any) => {
        try {
            const id = updatedData.id;
            const dataToSave = getPayload(updatedData);

            const response = await api.put(`/extension-keys/${id}`, dataToSave);
            await invalidateCache("/extension-keys/paginated");
            const updatedRecord = response.data;

            setAllKeys((prev) =>
                prev.map((row) => (row.id === id ? { ...row, ...updatedRecord } : row))
            );
            toast.success("Extension Key updated successfully");
        } catch (error: any) {
            console.error("Error updating extension key:", error);
            let errorMessage = "Failed to update extension key";
            if (error?.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (Array.isArray(detail)) {
                    errorMessage = detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
                } else {
                    errorMessage = detail;
                }
            }
            toast.error(errorMessage);
        }
    };

    const handleRowDeleted = async (id: string | number) => {
        try {
            await api.delete(`/extension-keys/${id}`);
            await invalidateCache("/extension-keys/paginated");
            setAllKeys((prev) => prev.filter((row) => row.id !== id));
            toast.success("Extension Key deleted successfully");
        } catch (error: any) {
            console.error("Error deleting extension key:", error);
            toast.error("Failed to delete extension key");
        }
    };

    const handleRowAdded = async (newData: any) => {
        try {
            const dataWithDefaults = {
                is_active: true,
                ...newData
            };
            const dataToSave = getPayload(dataWithDefaults);
            const response = await api.post("/extension-keys/", dataToSave);
            await invalidateCache("/extension-keys/paginated");
            const addedRecord = response.data;
            setAllKeys((prev) => [addedRecord, ...prev]);
            toast.success("Extension Key added successfully");
        } catch (error: any) {
            console.error("Error adding extension key:", error);
            let errorMessage = "Failed to add extension key";
            if (error?.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (Array.isArray(detail)) {
                    errorMessage = detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
                } else {
                    errorMessage = detail;
                }
            }
            toast.error(errorMessage);
        }
    };

    const columnDefs: ColDef[] = useMemo(
        () => [
            { field: "id", headerName: "ID", width: 80, sortable: true, filter: "agNumberColumnFilter", pinned: "left" },
            { field: "user_id", headerName: "User ID", width: 120, sortable: true, filter: "agNumberColumnFilter", editable: true },
            { field: "uname", headerName: "Username", width: 180, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "api_key", headerName: "API Key", width: 250, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "device_name", headerName: "Device Name", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
            {
                field: "is_active",
                headerName: "Active",
                width: 120,
                cellRenderer: (params: any) => <ActiveRenderer value={params.value} />,
                editable: true,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                    values: [true, false],
                },
                valueFormatter: (params: any) => params.value ? 'True' : 'False'
            },
            {
                field: "last_used",
                headerName: "Last Used",
                width: 170,
                sortable: true,
                valueFormatter: ({ value }: ValueFormatterParams) => {
                    if (!value) return "-";
                    return new Date(value).toLocaleString();
                }
            },
            {
                field: "created_at",
                headerName: "Created At",
                width: 170,
                sortable: true,
                valueFormatter: ({ value }: ValueFormatterParams) => {
                    if (!value) return "-";
                    return new Date(value).toLocaleString();
                }
            }
        ],
        []
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Extension Keys</h1>
                    <p className="text-muted-foreground">Manage API keys and devices for extensions.</p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex-1 max-w-sm">
                    <Label htmlFor="search" className="sr-only">Search</Label>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="search"
                            type="text"
                            value={searchTerm}
                            placeholder="Search API keys, usernames..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm w-full"
                        />
                    </div>
                </div>
            </div>

            {showLoader ? (
                <Loader />
            ) : (
                <AGGridTable
                    rowData={filteredKeys}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    onRowAdded={handleRowAdded}
                    title={`Extension Keys (${filteredKeys.length})`}
                    showAddButton={true}
                />
            )}
        </div>
    );
}
