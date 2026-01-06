// app/avatar/placement-fees/page.tsx
"use client";

import Link from "next/link";
import "@/styles/admin.css";
import "@/styles/App.css";

import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon, ChevronRight, ChevronDown } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";

interface PlacementFee {
    id?: number | string;
    placement_id?: number | string;
    installment_id?: number | string | null;
    deposit_date?: string | null;
    deposit_amount?: number | string | null;
    amount_collected?: "yes" | "no" | string | null;
    lastmod_user_id?: number | string | null;
    lastmod_user_name?: string | null;
    last_mod_date?: string | null;
    candidate_name?: string | null;
    isGroup?: boolean;
    isExpanded?: boolean;
    totalDeposit?: number;
    originalId?: number; // Keep track of DB ID for updates
}

export default function PlacementFeeCollectionPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rawFees, setRawFees] = useState<PlacementFee[]>([]);
    const [gridRows, setGridRows] = useState<PlacementFee[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);


    useEffect(() => {
        if (!rawFees.length) {
            setGridRows([]);
            return;
        }

        const lowerSearch = searchTerm.toLowerCase();
        const filteredRaw = rawFees.filter(f => {
            if (!searchTerm) return true;
            return Object.values(f).some(v => String(v).toLowerCase().includes(lowerSearch));
        });

        // Group by Candidate
        const groups: Record<string, PlacementFee[]> = {};
        filteredRaw.forEach(fee => {
            const name = fee.candidate_name || "Unknown";
            if (!groups[name]) groups[name] = [];
            groups[name].push(fee);
        });

        const newGridRows: PlacementFee[] = [];

        Object.entries(groups).forEach(([candidateName, children]) => {
            const total = children.reduce((sum, item) => sum + Number(item.deposit_amount || 0), 0);
            const isExpanded = expandedGroups.has(candidateName);

            newGridRows.push({
                id: `group-${candidateName}`,
                candidate_name: candidateName,
                isGroup: true,
                isExpanded: isExpanded,
                totalDeposit: total,
                placement_id: "",
                installment_id: "",
                deposit_date: null,
                deposit_amount: total,
                amount_collected: null,
            });

            const effectiveExpanded = searchTerm ? true : isExpanded;

            if (effectiveExpanded) {
                children.forEach(child => {
                    newGridRows.push({
                        ...child,
                        originalId: Number(child.id),
                        isGroup: false,
                    });
                });
            }
        });

        setGridRows(newGridRows);

    }, [rawFees, expandedGroups, searchTerm]);

    const toggleGroup = useCallback((candidateName: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(candidateName)) {
                next.delete(candidateName);
            } else {
                next.add(candidateName);
            }
            return next;
        });
    }, []);


    const CandidateGroupRenderer = (params: any) => {
        const { data } = params;
        if (!data) return null;

        if (data.isGroup) {
            return (
                <div
                    className="flex items-center cursor-pointer font-bold text-gray-800"
                    onClick={() => toggleGroup(data.candidate_name)}
                >
                    {data.isExpanded || searchTerm ? (
                        <ChevronDown className="w-4 h-4 mr-2" />
                    ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                    )}
                    {data.candidate_name}
                </div>
            );
        } else {
            return <div className="pl-6 text-gray-500 text-sm"></div>;
        }
    };

    const AmountRenderer = (params: any) => {
        const val = params.value;
        if (params.data.isGroup) {
            return (
                <span className="font-bold text-gray-900">
                    Total: ${Number(val).toLocaleString()}
                </span>
            );
        }
        return val == null ? "$0.00" : `$${Number(val).toLocaleString()}`;
    };

    const DateRenderer = (params: any) => {
        if (params.data.isGroup) return null;
        const v = params.value;
        if (!v) return <span className="text-gray-500">N/A</span>;
        return <span>{String(v).split("T")[0]}</span>;
    };

    const CollectedRenderer = (params: any) => {
        if (params.data.isGroup) return null;
        const val = (params.value || "no").toString().toLowerCase();
        const cls = val === "yes" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
        const displayVal = val === "yes" ? "Yes" : "No";
        return <Badge className={cls}>{displayVal}</Badge>;
    };

    const PlacementLinkRenderer = (params: any) => {
        if (params.data.isGroup) return null;
        const placementId = params.data?.placement_id ?? params.value;
        if (!placementId) return <span className="text-gray-500">N/A</span>;
        return (
            <Link
                href={`/avatar/placements/${placementId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 font-medium"
            >
                Placement #{placementId}
            </Link>
        );
    };

    useEffect(() => {
        const fetchFees = async () => {
            setLoading(true);
            try {
                const res = await api.get("/placement-fee");
                const body = res?.data ?? res?.raw ?? [];
                const fees = Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : body.data ?? [];
                setRawFees(fees);

                if (fees.length > 0) {
                    setupColumns();
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch placement fees");
            } finally {
                setLoading(false);
            }
        };
        fetchFees();
    }, []);

    const setupColumns = () => {
        setColumnDefs([
            { field: "id", headerName: "ID", width: 80, hide: true },
            {
                field: "candidate_name",
                headerName: "Candidate",
                width: 230,
                cellRenderer: CandidateGroupRenderer,
                pinned: 'left',
            },
            {
                field: "placement_id",
                headerName: "Placement",
                width: 150,
                cellRenderer: PlacementLinkRenderer,
                hide: true,
            },
            {
                field: "installment_id",
                headerName: "Installment",
                width: 130,
                editable: (p) => !p.data.isGroup,
            },
            {
                field: "deposit_date",
                headerName: "Deposit Date",
                width: 150,
                cellRenderer: DateRenderer,
            },
            {
                field: "deposit_amount",
                headerName: "Deposit Amount",
                width: 170,
                cellRenderer: AmountRenderer,
                editable: (p) => !p.data.isGroup,
            },
            {
                field: "amount_collected",
                headerName: "Collected",
                width: 120,
                cellRenderer: CollectedRenderer,
                editable: (p) => !p.data.isGroup,
                cellEditor: "agSelectCellEditor",
                cellEditorParams: { values: ["yes", "no"] },
            },
            {
                field: "lastmod_user_name",
                headerName: "Last Modified By",
                width: 170,
                cellRenderer: (params: any) => params.data.isGroup ? null : params.value,
            },
            {
                field: "last_mod_date",
                headerName: "Last Modified At",
                width: 170,
                cellRenderer: DateRenderer,
            }
        ]);
    };
    // CRUD 
    const handleRowUpdated = async (updatedRow: PlacementFee) => {
        if (updatedRow.isGroup) return;

        try {
            const dbId = updatedRow.originalId || updatedRow.id;
            if (!dbId) return toast.error("Missing record ID");

            await api.put(`/placement-fee/${dbId}`, updatedRow);

            setRawFees(prev => prev.map(f => f.id === dbId ? { ...f, ...updatedRow } : f));

            toast.success("Updated successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update");
        }
    };

    const handleRowDeleted = async (id: number | string) => {
        if (String(id).startsWith("group-")) return;

        try {
            await api.delete(`/placement-fee/${id}`);
            setRawFees(prev => prev.filter(f => f.id !== id));
            toast.success("Successfully Deleted");
        } catch (err) {
            console.error(err);
            toast.error("Delete failed");
        }
    };

    const handleRowAdded = async (newData: any) => {
        try {
            const payload = { ...newData };
            delete payload.isGroup;
            delete payload.isExpanded;
            delete payload.totalDeposit;

            if (payload.placement_id) payload.placement_id = Number(payload.placement_id);
            if (payload.deposit_amount) payload.deposit_amount = Number(payload.deposit_amount);

            if (!payload.amount_collected) payload.amount_collected = "no";

            const res = await api.post("/placement-fee", payload);
            const created = res.data ?? res;

            setRawFees(prev => [created, ...prev]);
            toast.success("Added successfully");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to add");
        }
    };

    return (
        <div className="space-y-6">
            <Toaster richColors position="top-center" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Placement Fee Collection
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Manage placement fee deposits</p>
            </div>

            <div className="max-w-md">
                <Label htmlFor="search">Search {searchTerm && "(Typing expands all groups)"}</Label>
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        type="text"
                        placeholder="Search Candidate..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {loading && rawFees.length === 0 ? (
                <p className="text-center text-gray-500">Loading...</p>
            ) : (
                <div className="w-full flex justify-center">
                    <div className="w-full max-w-7xl">
                        <AGGridTable
                            rowData={gridRows}
                            columnDefs={columnDefs}
                            title={`Placement Fees (${rawFees.length} records)`}
                            height="calc(60vh)"
                            showSearch={false}
                            onRowUpdated={handleRowUpdated}
                            onRowDeleted={handleRowDeleted}
                            onRowAdded={handleRowAdded}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}