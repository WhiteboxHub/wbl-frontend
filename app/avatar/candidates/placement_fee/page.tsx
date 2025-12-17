// app/avatar/placement-fees/page.tsx
"use client";

import Link from "next/link";
import "@/styles/admin.css";
import "@/styles/App.css";

import { AGGridTable } from "@/components/AGGridTable";
import { Badge } from "@/components/admin_ui/badge";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";

interface PlacementFee {
    id?: number;
    placement_id?: number | string;
    installment_id?: number | string | null;
    deposit_date?: string | null;
    deposit_amount?: number | string | null;
    amount_collected?: "yes" | "no" | string | null;
    lastmod_user_id?: number | string | null;
    lastmod_user_name?: string | null;
    last_mod_date?: string | null;
    candidate_name?: string | null;
}

export default function PlacementFeeCollectionPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [allFees, setAllFees] = useState<PlacementFee[]>([]);
    const [filteredFees, setFilteredFees] = useState<PlacementFee[]>([]);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    const [loading, setLoading] = useState(false);

    // Renderers
    const DateRenderer = (params: any) => {
        const v = params.value;
        if (!v) return <span className="text-gray-500">N/A</span>;
        return <span>{String(v).split("T")[0]}</span>;
    };


    const AmountRenderer = (params: any) =>
        params.value == null ? "$0.00" : `$${Number(params.value).toLocaleString()}`;

    const CollectedRenderer = (params: any) => {
        const val = (params.value || "no").toString().toLowerCase();
        const cls = val === "yes" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
        const displayVal = val === "yes" ? "Yes" : "No";
        return <Badge className={cls}>{displayVal}</Badge>;
    };

    const PlacementLinkRenderer = (params: any) => {
        const placementId = params.data?.placement_id ?? params.value;
        const candidateName = params.data?.candidate_name;
        if (!placementId) return <span className="text-gray-500">N/A</span>;
        return (
            <Link
                href={`/avatar/placements/${placementId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 font-medium"
            >
                {candidateName || placementId}
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

                const normalized = fees.map((f: any) => ({
                    id: f.id,
                    placement_id: f.placement_id,
                    installment_id: f.installment_id ?? null,
                    deposit_date: f.deposit_date ?? null,
                    deposit_amount: f.deposit_amount ?? null,
                    amount_collected: f.amount_collected ?? "no",
                    lastmod_user_id: f.lastmod_user_id ?? null,
                    lastmod_user_name: f.lastmod_user_name ?? null,
                    last_mod_date: f.last_mod_date ?? null,
                    candidate_name: f.candidate_name ?? null,
                }));

                setAllFees(normalized);
                setFilteredFees(normalized);

                if (normalized.length > 0) {
                    const cols: ColDef[] = [
                        { field: "id", headerName: "ID", width: 80, pinned: "left" },
                        {
                            field: "placement_id",
                            headerName: "Placement",
                            minWidth: 180,
                            cellRenderer: PlacementLinkRenderer,
                        },

                        {
                            field: "installment_id",
                            headerName: "Installment",
                            minWidth: 120,
                            editable: true,
                        },

                        {
                            field: "deposit_date",
                            headerName: "Deposit Date",
                            minWidth: 140,
                            cellRenderer: DateRenderer,
                        },

                        {
                            field: "deposit_amount",
                            headerName: "Deposit Amount",
                            minWidth: 140,
                            cellRenderer: AmountRenderer,
                            editable: true,
                        },

                        {
                            field: "amount_collected",
                            headerName: "Collected",
                            minWidth: 120,
                            cellRenderer: CollectedRenderer,
                            editable: true,
                            cellEditor: "agSelectCellEditor",
                            cellEditorParams: { values: ["yes", "no"] },
                        },

                        {
                            field: "lastmod_user_name",
                            headerName: "Last Modified By",
                            minWidth: 140,
                        },

                        {
                            field: "last_mod_date",
                            headerName: "Last Modified At",
                            minWidth: 180,
                            cellRenderer: DateRenderer,
                        },
                    ];

                    setColumnDefs(cols);
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

    useEffect(() => {
        const lower = searchTerm.toLowerCase();
        setFilteredFees(
            allFees.filter((f) =>
                Object.values(f)
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(lower))
            )
        );
    }, [searchTerm, allFees]);

    const handleRowUpdated = async (updatedRow: PlacementFee) => {
        try {
            if (!updatedRow.id) return toast.error("Missing record ID");
            const res = await api.put(`/placement-fee/${updatedRow.id}`, updatedRow);
            const updated = res.data ?? res;

            const normalized = {
                id: updated.id,
                placement_id: updated.placement_id,
                installment_id: updated.installment_id ?? null,
                deposit_date: updated.deposit_date ?? null,
                deposit_amount: updated.deposit_amount ?? null,
                amount_collected: updated.amount_collected ?? "no",
                lastmod_user_id: updated.lastmod_user_id ?? null,
                lastmod_user_name: updated.lastmod_user_name ?? null,
                last_mod_date: updated.last_mod_date ?? null,
                candidate_name: updated.candidate_name ?? null,
            };

            setAllFees((prev) => prev.map((r) => (r.id === updatedRow.id ? normalized : r)));
            toast.success("Updated successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update");
        }
    };

    // Row delete (DELETE)
    const handleRowDeleted = async (id: number) => {
        try {
            await api.delete(`/placement-fee/${id}`);
            setAllFees((prev) => prev.filter((p) => p.id !== id));
            toast.success("Successfully Deleted");
        } catch (err) {
            console.error(err);
            toast.error("Delete failed");
        }
    };


    const handleRowAdded = async (newData: any) => {
        try {
            const payload = { ...newData };

            if (payload.placement_id) {
                payload.placement_id = Number(payload.placement_id);
            }
            ['installment_id', 'lastmod_user_id'].forEach(key => {
                if (payload[key]) payload[key] = Number(payload[key]);
                else payload[key] = null;
            });

            if (payload.deposit_amount) {
                payload.deposit_amount = Number(payload.deposit_amount);
            } else {
                payload.deposit_amount = null;
            }

            if (!payload.deposit_date || payload.deposit_date === "") {
                payload.deposit_date = null;
            }

            if (!payload.amount_collected) {
                payload.amount_collected = "no";
            }

            Object.keys(payload).forEach(key => {
                if (payload[key] === "") payload[key] = null;
            });

            const res = await api.post("/placement-fee", payload);
            const created = res.data ?? res;
            const newFee: PlacementFee = {
                id: created.id,
                placement_id: created.placement_id,
                installment_id: created.installment_id,
                deposit_date: created.deposit_date,
                deposit_amount: created.deposit_amount,
                amount_collected: created.amount_collected,
                lastmod_user_id: created.lastmod_user_id,
                lastmod_user_name: created.lastmod_user_name ?? null,
                last_mod_date: created.last_mod_date,
                candidate_name: created.candidate_name ?? null,
            };

            setAllFees((prev) => [newFee, ...prev]);
            toast.success("Added successfully");
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.detail || "Failed to add";
            toast.error(msg);
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
                <Label htmlFor="search">Search Fees</Label>
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {loading ? (
                <p className="text-center text-gray-500">Loading...</p>
            ) : (
                <div className="w-full flex justify-center">
                    <div className="w-full max-w-7xl">
                        <AGGridTable
                            rowData={filteredFees}
                            columnDefs={columnDefs}
                            title={`Placement Fees (${filteredFees.length})`}
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
