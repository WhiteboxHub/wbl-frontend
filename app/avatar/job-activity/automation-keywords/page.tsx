"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { EditModal } from "@/components/EditModal";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Badge } from "@/components/admin_ui/badge";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch, smartUpdate } from "@/lib/api.js";

const StatusRenderer = (params: any) => {
    const isActive = params.value;
    let badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";

    if (isActive) {
        badgeClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    } else {
        badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }

    return <Badge className={badgeClass}>{isActive ? "ACTIVE" : "INACTIVE"}</Badge>;
};

const ActionRenderer = (params: any) => {
    const action = params.value || "block";
    let badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

    if (action === "allow") {
        badgeClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    }

    return <Badge className={badgeClass}>{action.toUpperCase()}</Badge>;
};

const PriorityRenderer = (params: any) => {
    const priority = params.value || 100;
    let badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";

    if (priority <= 10) {
        badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    } else if (priority <= 50) {
        badgeClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    }

    return <Badge className={badgeClass}>{priority}</Badge>;
};

export default function JobAutomationKeywordsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [keywords, setKeywords] = useState<any[]>([]);
    const [filteredKeywords, setFilteredKeywords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchData = async (showSuccessToast = false) => {
        try {
            if (showSuccessToast) {
                setLoading(true);
            }
            setError("");

            const res = await apiFetch("/api/job-automation-keywords");
            const data = res?.keywords || [];
            const sorted = data.slice().sort((a: any, b: any) => a.priority - b.priority || b.id - a.id);

            setKeywords(sorted);
            setFilteredKeywords(sorted);

            if (showSuccessToast) {
                toast.success("Data refreshed successfully");
            }
        } catch (e: any) {
            const msg =
                e?.body?.detail ||
                e?.detail ||
                e?.message ||
                e?.body ||
                "Failed to fetch data";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
            toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            if (showSuccessToast) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchData(true);
    }, []);

    const columnDefs: ColDef[] = [
        {
            field: "id",
            headerName: "ID",
            width: 100,
            pinned: "left",
            editable: false,
            sort: "asc"
        },
        {
            field: "category",
            headerName: "Category",
            width: 220,
            editable: false,
        },
        {
            field: "source",
            headerName: "Source",
            width: 150,
            editable: false,
        },
        {
            field: "keywords",
            headerName: "Keywords",
            width: 350,
            editable: false,
            cellRenderer: (params: any) => {
                const keywords = params.value || "";
                const truncated = keywords.length > 50 ? keywords.substring(0, 50) + "..." : keywords;
                return <span title={keywords}>{truncated}</span>;
            },
        },
        {
            field: "match_type",
            headerName: "Match Type",
            width: 160,
            editable: false,
            cellRenderer: (params: any) => {
                const val = params.value || "contains";
                return val.charAt(0).toUpperCase() + val.slice(1);
            },
        },
        {
            field: "action",
            headerName: "Action",
            width: 100,
            editable: false,
            cellRenderer: ActionRenderer,
        },
        {
            field: "priority",
            headerName: "Priority",
            width: 130,
            editable: false,
            cellRenderer: PriorityRenderer,
        },
        {
            field: "is_active",
            headerName: "Status",
            width: 120,
            editable: false,
            cellRenderer: StatusRenderer,
        },
        {
            field: "context",
            headerName: "Context",
            width: 300,
            editable: false,
        },
        {
            field: "created_at",
            headerName: "Created",
            width: 150,
            editable: false,
            valueFormatter: (params: any) => {
                if (!params.value) return "";
                return new Date(params.value).toLocaleDateString();
            },
        },
    ];

    useEffect(() => {
        const lower = searchTerm.trim().toLowerCase();
        if (!lower) return setFilteredKeywords(keywords);

        const filtered = keywords.filter((row) => {
            const idMatch = row.id?.toString().includes(lower);
            const categoryMatch = row.category?.toLowerCase().includes(lower);
            const sourceMatch = row.source?.toLowerCase().includes(lower);
            const keywordsMatch = row.keywords?.toLowerCase().includes(lower);
            const matchTypeMatch = row.match_type?.toLowerCase().includes(lower);
            const actionMatch = row.action?.toLowerCase().includes(lower);
            const contextMatch = row.context?.toLowerCase().includes(lower);

            return (
                idMatch ||
                categoryMatch ||
                sourceMatch ||
                keywordsMatch ||
                matchTypeMatch ||
                actionMatch ||
                contextMatch
            );
        });

        setFilteredKeywords(filtered);
    }, [searchTerm, keywords]);

    const getErrorMessage = (e: any) => {
        return (
            e?.body?.detail ||
            e?.detail ||
            e?.message ||
            (typeof e?.body === "string" ? e.body : "An error occurred")
        );
    };

    const handleRowDeleted = async (id: number) => {
        try {
            await apiFetch(`/api/job-automation-keywords/${id}`, { method: "DELETE" });

            const updated = keywords.filter((kw) => kw.id !== id);
            setKeywords(updated);
            setFilteredKeywords(updated);

            toast.success(`Keyword ${id} deleted successfully`);
        } catch (e: any) {
            toast.error(getErrorMessage(e));
        }
    };

    const handleAddKeyword = () => {
        setIsAddModalOpen(true);
    };

    // Use smartUpdate for inline editing (when user edits a cell directly in the grid)
    const handleEditSave = async (updatedRow: any) => {
        try {
            // Convert is_active from string to boolean if needed
            const isActiveValue = updatedRow.is_active === "true" || updatedRow.is_active === true;

            const payload = {
                ...updatedRow,
                is_active: isActiveValue,
            };

            const updatedKeyword = await smartUpdate("job-automation-keywords", updatedRow.id, payload);

            setKeywords((prev) => prev.map((kw) => (kw.id === updatedRow.id ? updatedKeyword : kw)));
            setFilteredKeywords((prev) => prev.map((kw) => (kw.id === updatedRow.id ? updatedKeyword : kw)));

            toast.success("Keyword updated successfully");
        } catch (e: any) {
            toast.error(getErrorMessage(e));
        }
    };

    // For modal-based add (when user clicks Add button)
    const handleAddSave = async (data: any) => {
        try {
            // Convert is_active from string to boolean
            const isActiveValue = data.is_active === "true" || data.is_active === true;

            const payload = {
                category: data.category?.trim() || "",
                source: data.source?.trim() || "email_extractor",
                keywords: data.keywords?.trim() || "",
                match_type: data.match_type || "contains",
                action: data.action || "block",
                priority: data.priority ? parseInt(data.priority) : 100,
                context: data.context?.trim() || "",
                is_active: isActiveValue,
            };

            // Validate required fields
            if (!payload.category) {
                toast.error("Category is required");
                return;
            }
            if (!payload.keywords) {
                toast.error("Keywords are required");
                return;
            }

            await apiFetch("/api/job-automation-keywords", { method: "POST", body: payload });

            await fetchData(false);
            toast.success("Keyword created successfully");
            setIsAddModalOpen(false);
        } catch (e: any) {
            toast.error(getErrorMessage(e));
        }
    };

    const getAddInitialData = () => {
        return {
            category: "",
            source: "email_extractor",
            keywords: "",
            match_type: "contains",
            action: "block",
            priority: 100,
            context: "",
            is_active: "true", // String for EditModal dropdown
        };
    };

    if (loading) return <p className="mt-8 text-center">Loading...</p>;
    if (error) return <p className="mt-8 text-center text-red-600">{error}</p>;

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Job Automation Keywords</h1>
                    <p>Manage automation keywords for email extraction and filtering.</p>
                </div>
            </div>

            <div className="max-w-md">
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by category, keywords, or context..."
                        className="pl-10"
                    />
                </div>
            </div>

            <AGGridTable
                rowData={filteredKeywords}
                columnDefs={columnDefs}
                title={`Automation Keyword (${filteredKeywords.length})`}
                height="calc(70vh)"
                onAddClick={handleAddKeyword}
                onRowUpdated={handleEditSave}
                onRowDeleted={handleRowDeleted}
                showSearch={false}
            />

            {isAddModalOpen && (
                <EditModal
                    isOpen={true}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleAddSave}
                    data={getAddInitialData()}
                    title="Automation Keyword"
                    batches={[]}
                    isAddMode={true}
                />
            )}
        </div>
    );
}
