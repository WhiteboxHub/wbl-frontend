"use client";
import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { ColDef } from "ag-grid-community";
import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Loader } from "@/components/admin_ui/loader";
import { Input } from "@/components/admin_ui/input";
import { SearchIcon } from "lucide-react";

const ActiveRenderer = (params: any) => {
    return params.value ? (
        <Badge className="bg-green-100 text-green-800">Yes</Badge>
    ) : (
        <Badge className="bg-red-100 text-red-800">No</Badge>
    );
};

export default function EmailSmtpCredentialsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get("/email-smtp-credentials");
            // Inject empty password fields so EditModal renders them
            const processedData = res.data.map((item: any) => ({
                ...item,
                password: item.password ?? "",
                app_password: item.app_password ?? ""
            }));
            setData(processedData);
            setFilteredData(processedData);
        } catch (err) {
            toast.error("Failed to fetch credentials");
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
            const nameMatch = row.name?.toLowerCase().includes(lower);
            const emailMatch = row.email?.toLowerCase().includes(lower);
            const noteMatch = row.note?.toLowerCase().includes(lower);
            return nameMatch || emailMatch || noteMatch;
        });

        setFilteredData(filtered);
    }, [searchTerm, data]);

    const columnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", pinned: "left", width: 80 },
        { field: "name", headerName: "Name", width: 200, editable: true, sortable: true },
        { field: "email", headerName: "Email", width: 250, editable: true, sortable: true },
        {
            field: "password",
            headerName: "Password",
            width: 150,
            editable: true,
            cellRenderer: (params: any) => params.value ?? ""
        },
        {
            field: "app_password",
            headerName: "App Password",
            width: 150,
            editable: true,
            cellRenderer: (params: any) => params.value ?? ""
        },
        { field: "daily_limit", headerName: "Daily Limit", width: 120, editable: true, sortable: true },
        { field: "note", headerName: "Note", width: 300, editable: true, sortable: true },
        {
            field: "is_active",
            headerName: "Active",
            width: 100,
            editable: true,
            sortable: true,
            cellRenderer: ActiveRenderer,
            cellEditor: "agSelectCellEditor",
            cellEditorParams: {
                values: [true, false]
            }
        },
        {
            field: "created_at",
            headerName: "Created At",
            width: 180,
            sortable: true,
            valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : ""
        },
        {
            field: "updated_at",
            headerName: "Last Modified",
            width: 180,
            sortable: true,
            valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : ""
        },
    ], []);

    const handleRowAdded = async (newRow: any) => {
        try {
            // Remove empty optional fields
            const payload = { ...newRow };
            if (!payload.app_password) delete payload.app_password;
            if (!payload.note) delete payload.note;

            const res = await api.post("/email-smtp-credentials", payload);
            const savedRow = { ...res.data, password: "", app_password: "" };
            setData((prev: any) => [savedRow, ...prev]);
            toast.success("Credential added successfully");
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to add credential");
        }
    };

    const handleRowUpdated = async (row: any) => {
        try {
            const payload = { ...row };
            // Only send passwords if they are not empty (meaning user changed them)
            if (!payload.password) delete payload.password;
            if (!payload.app_password) delete payload.app_password;

            // Remove readonly fields
            delete payload.id;
            delete payload.created_at;
            delete payload.updated_at;

            const res = await api.put(`/email-smtp-credentials/${row.id}`, payload);
            // Update local state with response, resetting password fields
            const updatedRow = { ...res.data, password: "", app_password: "" };
            setData(prev => prev.map((item: any) => item.id === row.id ? updatedRow : item));

            toast.success("Credential updated successfully");
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Update failed");
            fetchData(); // Revert changes on error
        }
    };

    const handleRowDeleted = async (id: any) => {
        try {
            await api.delete(`/email-smtp-credentials/${id}`);
            setData(prev => prev.filter((item: any) => item.id !== id));
            toast.success("Credential deleted");
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
                        Email SMTP Credentials
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400"></p>
                </div>
            </div>

            {/* Search bar */}
            <div className="max-w-md">
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email or note..."
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="flex w-full justify-center">
                <AGGridTable
                    title={`SMTP Credentials (${filteredData.length})`}
                    rowData={filteredData}
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
