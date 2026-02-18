"use client";
import React, {
    useEffect,
    useState,
    useMemo,
    useRef,
    useCallback,
} from "react";
import api, { apiFetch, API_BASE_URL } from "@/lib/api";
import "@/styles/admin.css";
import "@/styles/App.css";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Button } from "@/components/admin_ui/button";
import { SearchIcon, UserPlus, Trash2, ArrowRight } from "lucide-react";
import { ColDef } from "ag-grid-community";
import dynamic from "next/dynamic";
import { toast, Toaster } from "sonner";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

const AGGridTable = dynamic(() => import("@/components/AGGridTable"), {
    ssr: false,
});

const StatusRenderer = ({ value }: { value?: string }) => {
    if (!value) return null;
    const colorMap: Record<string, string> = {
        new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        classified: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        moved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        duplicate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    const badgeClass = colorMap[value.toLowerCase()] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200";
    return <Badge className={badgeClass}>{value.toUpperCase()}</Badge>;
};

const ClassificationRenderer = ({ value }: { value?: string }) => {
    if (!value) return null;
    const colorMap: Record<string, string> = {
        company_contact: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
        personal_domain_contact: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
        linkedin_only_contact: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800",
        company_only: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800",
        unknown: "bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-900/10 dark:text-gray-500",
    };
    const badgeClass = colorMap[value.toLowerCase()] ?? "bg-gray-50 text-gray-600";
    return <Badge variant="outline" className={badgeClass}>{value.replace(/_/g, ' ').toUpperCase()}</Badge>;
};

function formatDateTime(dateStr: string | null | undefined) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

const EmailRenderer = ({ value }: { value?: string }) => {
    if (!value) return null;
    return (
        <a
            href={`mailto:${value}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
        >
            {value}
        </a>
    );
};

const PhoneRenderer = ({ value }: { value?: string }) => {
    if (!value) return null;
    return (
        <a
            href={`tel:${value}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
        >
            {value}
        </a>
    );
};

export default function AutomationContactExtractsPage() {
    const gridRef = useRef<any>(null);
    const selectedRowsRef = useRef<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [extracts, setExtracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const showLoader = useMinimumLoadingTime(loading);
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

    const fetchExtracts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/automation-extracts");
            setExtracts(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("[fetchExtracts] Error:", err);
            toast.error(err?.message || "Failed to load extracts");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExtracts();
    }, [fetchExtracts]);

    const filteredExtracts = useMemo(() => {
        if (!searchTerm.trim()) {
            return extracts;
        }
        const term = searchTerm.toLowerCase();
        return extracts.filter(
            (e) =>
                e.full_name?.toLowerCase().includes(term) ||
                e.email?.toLowerCase().includes(term) ||
                e.phone?.toLowerCase().includes(term) ||
                e.company_name?.toLowerCase().includes(term) ||
                e.job_title?.toLowerCase().includes(term) ||
                e.city?.toLowerCase().includes(term) ||
                e.state?.toLowerCase().includes(term) ||
                e.country?.toLowerCase().includes(term) ||
                e.postal_code?.toLowerCase().includes(term) ||
                e.source_type?.toLowerCase().includes(term) ||
                e.source_reference?.toLowerCase().includes(term) ||
                e.classification?.toLowerCase().includes(term) ||
                e.processing_status?.toLowerCase().includes(term) ||
                e.target_table?.toLowerCase().includes(term) ||
                e.error_message?.toLowerCase().includes(term)
        );
    }, [searchTerm, extracts]);

    const handleRowUpdated = useCallback(async (updatedData: any) => {
        try {
            const cleanedData = { ...updatedData };
            Object.keys(cleanedData).forEach(key => {
                const val = cleanedData[key];
                if (val === "" || val === undefined || (typeof val === "string" && val.trim() === "")) {
                    delete cleanedData[key];
                }
            });

            await apiFetch(`/automation-extracts/${updatedData.id}`, {
                method: "PUT",
                body: cleanedData,
            });
            toast.success("Extract updated successfully");
            fetchExtracts();
        } catch (err: any) {
            console.error("Update error:", err);
            toast.error(err?.message || "Failed to update extract");
        }
    }, [fetchExtracts]);

    const handleRowAdded = async (newExtract: any) => {
        try {
            const cleanedExtract = { ...newExtract };
            Object.keys(cleanedExtract).forEach(key => {
                const val = cleanedExtract[key];
                if (val === "" || val === undefined || (typeof val === "string" && val.trim() === "")) {
                    delete cleanedExtract[key];
                }
            });

            await apiFetch("/automation-extracts", {
                method: "POST",
                body: cleanedExtract,
            });

            fetchExtracts();
            toast.success("Extract created successfully");
        } catch (err: any) {
            console.error("FAILED TO CREATE EXTRACT:", err);
            toast.error(err?.message || "Failed to create extract");
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

    const handleRowDeleted = useCallback(async (extractId: number | string) => {
        const visibleSelectedRows = getVisibleSelectedRows();
        const deleteCount = visibleSelectedRows.length > 1 ? visibleSelectedRows.length : 1;

        setConfirmDialog({
            isOpen: true,
            title: 'Confirm Delete',
            message: `Delete ${deleteCount} extract${deleteCount > 1 ? 's' : ''}?`,
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });

                if (visibleSelectedRows.length > 1) {
                    try {
                        const extractIds = visibleSelectedRows.map((row: any) => row.id);
                        await apiFetch(`/automation-extracts/bulk`, {
                            method: "DELETE",
                            body: extractIds
                        });

                        toast.success(`Deleted ${visibleSelectedRows.length} extracts`);
                        setSelectedRows([]);
                        fetchExtracts();
                    } catch (err: any) {
                        console.error("Bulk delete error:", err);
                        toast.error(err?.message || "Failed to delete extracts");
                    }
                } else {
                    try {
                        await apiFetch(`/automation-extracts/${extractId}`, {
                            method: "DELETE",
                        });
                        toast.success("Deleted 1 extract");
                        fetchExtracts();
                    } catch (err: any) {
                        console.error("Delete error:", err);
                        toast.error(err?.message || "Failed to delete extract");
                    }
                }
            },
        });
    }, [fetchExtracts, getVisibleSelectedRows]);

    const columnDefs: ColDef[] = useMemo<ColDef[]>(
        () => [
            { field: "id", headerName: "ID", width: 90, pinned: "left" },
            {
                field: "full_name",
                headerName: "Full Name",
                width: 180,
                editable: true,
            },
            {
                field: "email",
                headerName: "Email",
                width: 200,
                editable: true,
                cellRenderer: EmailRenderer,
            },
            {
                field: "phone",
                headerName: "Phone",
                width: 150,
                editable: true,
                cellRenderer: PhoneRenderer,
            },
            {
                field: "linkedin_id",
                headerName: "LinkedIn ID",
                width: 180,
                editable: true,
            },
            {
                field: "linkedin_internal_id",
                headerName: "LinkedIn Int ID",
                width: 180,
                editable: true,
            },
            {
                field: "company_name",
                headerName: "Company",
                width: 180,
                editable: true,
            },
            {
                field: "job_title",
                headerName: "Job Title",
                width: 180,
                editable: true,
            },
            {
                field: "city",
                headerName: "City",
                width: 120,
                editable: true,
            },
            {
                field: "state",
                headerName: "State",
                width: 100,
                editable: true,
            },
            {
                field: "country",
                headerName: "Country",
                width: 120,
                editable: true,
            },
            {
                field: "postal_code",
                headerName: "Postal Code",
                width: 120,
                editable: true,
            },
            {
                field: "source_type",
                headerName: "Source",
                width: 150,
                editable: true,
            },
            {
                field: "source_reference",
                headerName: "Reference",
                width: 180,
                editable: true,
            },
            {
                field: "classification",
                headerName: "Classification",
                width: 200,
                cellRenderer: ClassificationRenderer,
                editable: true,
            },
            {
                field: "processing_status",
                headerName: "Status",
                width: 140,
                cellRenderer: StatusRenderer,
                editable: true,
            },
            {
                field: "target_table",
                headerName: "Target Table",
                width: 150,
                editable: true,
            },
            {
                field: "target_id",
                headerName: "Target ID",
                width: 120,
                editable: true,
            },
            {
                field: "error_message",
                headerName: "Error",
                width: 250,
                editable: true,
            },
            {
                field: "processed_at",
                headerName: "Processed At",
                width: 180,
                valueFormatter: (params) => formatDateTime(params.value),
            },
            {
                field: "created_at",
                headerName: "Created At",
                width: 180,
                valueFormatter: (params) => formatDateTime(params.value),
            },
            {
                field: "raw_payload",
                headerName: "Raw Payload",
                width: 300,
                editable: false,
                valueFormatter: (params) => params.value ? JSON.stringify(params.value) : "",
            },
        ],
        []
    );

    const defaultColDef = useMemo(
        () => ({
            sortable: true,
            resizable: true,
            filter: true,
            flex: 1,
            minWidth: 100,
        }),
        []
    );

    return (
        <div className="space-y-2">
            <Toaster position="top-center" richColors />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Automation Contact Extracts
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="w-full sm:max-w-md">
                        <div className="relative mt-1">
                            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                            <Input
                                id="search"
                                type="text"
                                placeholder="Search by name, email, company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex w-full justify-center">
                <div className="w-full max-w-7xl">
                    {showLoader ? (
                        <Loader />
                    ) : (
                        <AGGridTable
                            rowData={filteredExtracts}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            height="calc(100vh - 260px)"
                            title="Automation-Contact-Extract"
                            showSearch={false}
                            onRowAdded={handleRowAdded}
                            onRowUpdated={handleRowUpdated}
                            onRowDeleted={handleRowDeleted}
                            skipDeleteConfirmation={true}
                            onFilterChanged={() => {
                                setSelectedRows([]);
                                selectedRowsRef.current = [];
                            }}
                            onSelectionChanged={(rows: any[]) => {
                                selectedRowsRef.current = rows;
                                setSelectedRows(rows);
                            }}
                        />
                    )}
                </div>

                {confirmDialog.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                {confirmDialog.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {confirmDialog.message}
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                                    className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmDialog.onConfirm}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                >
                                    Proceed
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
