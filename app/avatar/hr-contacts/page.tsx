"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import "@/styles/admin.css";
import "@/styles/App.css";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/api.js";
import { toast, Toaster } from "sonner";

const AGGridTable = dynamic(() => import("@/components/AGGridTable"), { ssr: false });

const BadgeRenderer = (params: any, map: Record<string, string>) => {
    const value = params?.value?.toString() || "None";
    const cls = map[value.toLowerCase()] || "bg-gray-100 text-gray-800";
    return <Badge className={cls}>{value.toUpperCase()}</Badge>;
};

const YesNoRenderer = (params: any) => {
    const map = {
        YES: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
        NO: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200",
    };
    const key = params?.value?.toString().toUpperCase();
    const displayKey = (key === "TRUE" || key === "YES") ? "YES" : "NO";
    return BadgeRenderer({ value: displayKey }, map);
};

const SelectEditor = (props: any) => {
    const { value, options } = props;
    const [current, setCurrent] = useState(value);
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => setCurrent(e.target.value);
    useEffect(() => {
        props.api.addEventListener("cellEditingStopped", () => {
            props.api.stopEditing();
        });
    }, []);
    return (
        <select
            value={current}
            onChange={handleChange}
            autoFocus
            style={{ padding: "4px", borderRadius: "6px" }}
        >
            {options.map((opt: any) => (
                <option key={opt.toString()} value={opt.toString()}>
                    {opt.toString().toUpperCase()}
                </option>
            ))}
        </select>
    );
};

const DateFormatter = (params: any) => (params.value ? new Date(params.value).toLocaleDateString() : "");
const PhoneRenderer = (params: any) =>
    params.value ? <a href={`tel:${params.value}`} className="text-blue-600 hover:underline">{params.value}</a> : "";
const EmailRenderer = (params: any) =>
    params.value ? <a href={`mailto:${params.value}`} className="text-blue-600 hover:underline">{params.value}</a> : "";

export default function HRContactPage() {
    const gridRef = useRef<any>(null);
    const selectedRowsRef = useRef<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const data = await apiFetch("/hr-contacts");
            const arr = Array.isArray(data) ? data : data?.data || [];
            console.log("[fetchContacts] Successfully loaded", arr.length, "HR contacts");
            setContacts(arr);
        } catch (e: any) {
            console.error("[fetchContacts] Error:", e);
            toast.error(e?.message || e?.body || "Failed to load HR contacts");
            setError(e?.message || e?.body || "Failed to load HR contacts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const filteredContacts = useMemo(() => {
        let filtered = contacts;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (v) =>
                    v.full_name?.toLowerCase().includes(term) ||
                    v.email?.toLowerCase().includes(term) ||
                    v.company_name?.toLowerCase().includes(term)
            );
        }
        return filtered;
    }, [contacts, searchTerm]);

    const columnDefs: ColDef[] = React.useMemo(() => [
        { field: "id", headerName: "ID", width: 80, pinned: "left", editable: false },
        { field: "full_name", headerName: "Full Name", width: 180, editable: true },
        { field: "email", headerName: "Email", width: 220, editable: true, cellRenderer: EmailRenderer },
        { field: "phone", headerName: "Phone", width: 150, editable: true, cellRenderer: PhoneRenderer },
        { field: "company_name", headerName: "Company", width: 200, editable: true },
        { field: "job_title", headerName: "Job Title", width: 180, editable: true },
        { field: "location", headerName: "Location", width: 250, editable: true },
        {
            field: "is_immigration_team",
            headerName: "Immigration Team",
            width: 160,
            cellRenderer: YesNoRenderer,
            editable: true,
            cellEditor: SelectEditor,
            cellEditorParams: { options: [true, false] },
        },
        { field: "extraction_date", headerName: "Extracted At", width: 180, valueFormatter: DateFormatter, filter: "agDateColumnFilter", editable: false },
    ], []);

    const handleRowUpdated = async (updatedRow: any) => {
        const payload = {
            ...updatedRow,
            email: updatedRow.email?.trim() === "" ? null : updatedRow.email,
            is_immigration_team: updatedRow.is_immigration_team === "true" || updatedRow.is_immigration_team === true,
        };
        try {
            await apiFetch(`/hr-contacts/${updatedRow.id}`, { method: "PUT", body: payload });
            console.log("[handleRowUpdated] Successfully updated HR contact:", updatedRow.id);
            setContacts((prev) => prev.map((row) => (row.id === updatedRow.id ? payload : row)));
            toast.success("HR Contact updated successfully");
        } catch (error: any) {
            console.error("Update failed", error);
            toast.error(error?.message || "Failed to update HR contact");
        }
    };

    const getVisibleSelectedRows = useCallback(() => {
        const currentSelectedRows = selectedRowsRef.current;
        if (!currentSelectedRows || currentSelectedRows.length === 0) return [];
        if (!gridRef.current?.api) return currentSelectedRows;

        const visibleRowIds = new Set();
        gridRef.current.api.forEachNodeAfterFilter((node: any) => {
            if (node.data?.id) visibleRowIds.add(node.data.id);
        });

        return currentSelectedRows.filter((row: any) => visibleRowIds.has(row.id));
    }, []);

    const handleRowDeleted = useCallback(async (contactId: number | string) => {
        const visibleSelectedRows = getVisibleSelectedRows();
        const deleteCount = visibleSelectedRows.length > 1 ? visibleSelectedRows.length : 1;

        setConfirmDialog({
            isOpen: true,
            title: 'Confirm Delete',
            message: `Delete ${deleteCount} HR contact${deleteCount > 1 ? 's' : ''}?`,
            onConfirm: async () => {
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

                if (visibleSelectedRows.length > 1) {
                    try {
                        const ids = visibleSelectedRows.map((row: any) => row.id);
                        await apiFetch(`/hr-contacts/bulk-delete`, {
                            method: "POST",
                            body: ids,
                        });
                        console.log("[handleRowDeleted] Successfully deleted", visibleSelectedRows.length, "HR contacts");
                        toast.success(`Deleted ${visibleSelectedRows.length} HR contacts`);
                        setSelectedRows([]);
                        fetchContacts();
                    } catch (err: any) {
                        console.error("Bulk delete error:", err);
                        toast.error(err?.message || "Failed to delete HR contacts");
                    }
                } else {
                    try {
                        await apiFetch(`/hr-contacts/${contactId}`, { method: "DELETE" });
                        console.log("[handleRowDeleted] Successfully deleted HR contact:", contactId);
                        toast.success("Deleted 1 HR contact");
                        fetchContacts();
                    } catch (error: any) {
                        console.error("Delete failed", error);
                        toast.error(error?.message || "Failed to delete HR contact");
                    }
                }
            },
        });
    }, [fetchContacts, getVisibleSelectedRows]);

    if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">HR Contacts</h1>
            </div>
            <div className="max-w-md">
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, or company..."
                        className="pl-10"
                    />
                </div>
                {searchTerm && <p className="text-sm mt-1 text-gray-500">{filteredContacts.length} found</p>}
            </div>

            <div className="flex w-full justify-center">
                <div className="w-full max-w-7xl">
                    <AGGridTable
                        loading={loading}
                        rowData={filteredContacts}
                        columnDefs={columnDefs}
                        title={`All HR Contacts (${filteredContacts.length})`}
                        height="calc(70vh)"
                        onRowUpdated={handleRowUpdated}
                        onRowDeleted={handleRowDeleted}
                        skipDeleteConfirmation={true}
                        showSearch={false}
                        onFilterChanged={() => {
                            if (gridRef.current?.api) {
                                gridRef.current.api.deselectAll();
                            }
                            setSelectedRows([]);
                            selectedRowsRef.current = [];
                        }}
                        onSelectionChanged={(rows: any[]) => {
                            selectedRowsRef.current = rows;
                            setSelectedRows(rows);
                        }}
                        onRowAdded={async (newRow: any) => {
                            try {
                                const payload = {
                                    full_name: newRow.full_name || newRow.name || "",
                                    email: newRow.email || null,
                                    phone: newRow.phone || null,
                                    company_name: newRow.company_name || newRow.company || null,
                                    location: newRow.location || null,
                                    job_title: newRow.job_title || null,
                                    is_immigration_team: newRow.is_immigration_team === "true" || newRow.is_immigration_team === true,
                                };
                                if (!payload.full_name) {
                                    console.warn('HR Contact name required');
                                    return;
                                }
                                const res = await apiFetch("/hr-contacts", { method: "POST", body: payload });
                                const created = Array.isArray(res) ? res : (res?.data ?? res);
                                console.log("[onRowAdded] Successfully created HR contact:", created);
                                setContacts((prev: any[]) => [created, ...prev]);
                                toast.success("HR Contact created successfully");
                            } catch (e: any) {
                                console.error('Failed to create HR contact', e);
                                toast.error(e?.message || "Failed to create HR contact");
                            }
                        }}
                    />

                    {confirmDialog.isOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                                <h3 className="text-lg font-semibold mb-2">{confirmDialog.title}</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">{confirmDialog.message}</p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDialog.onConfirm}
                                        className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <Toaster position="top-center" richColors />
                </div>
            </div>
        </div>
    );
}
