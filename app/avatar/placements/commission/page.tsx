"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

export default function CommissionPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [commissions, setCommissions] = useState<any[]>([]);
    const [filteredCommissions, setFilteredCommissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);
    const [error, setError] = useState("");

    const columnDefs: ColDef[] = [
        {
            field: "id",
            headerName: "ID",
            width: 90,
            pinned: "left",
            editable: false,
        },
        {
            field: "candidate_name",
            headerName: "Candidate",
            width: 180,
            editable: false,
        },
        {
            field: "company_name",
            headerName: "Company",
            width: 180,
            editable: false,
        },
        {
            field: "employee_name",
            headerName: "Employee",
            width: 180,
            editable: false,
        },
        {
            field: "placement_id",
            headerName: "Placement ID",
            width: 130,
            editable: true,
            hide: true,
        },
        {
            field: "employee_id",
            headerName: "Employee ID",
            width: 130,
            editable: true,
            hide: true,
        },
        {
            field: "amount",
            headerName: "Amount ($)",
            width: 140,
            editable: true,
        },
        {
            field: "created_at",
            headerName: "Created At",
            width: 180,
            editable: false,
            valueFormatter: (p) =>
                p.value ? new Date(p.value).toLocaleDateString() : "",
        },
        {
            field: "lastmod_datetime",
            headerName: "Last Modified",
            width: 180,
            editable: false,
            valueFormatter: (p) =>
                p.value ? new Date(p.value).toLocaleDateString() : "",
        },
    ];

    // Fetch commissions
    const fetchCommissions = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await apiFetch("/placement-commission");
            const arr = Array.isArray(res) ? res : res?.data ?? [];
            const sorted = (arr || []).slice().sort((a: any, b: any) => b.id - a.id);
            setCommissions(sorted);
            setFilteredCommissions(sorted);
            toast.success("Fetched commissions successfully.");
        } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to fetch commissions";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
            toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommissions();
    }, []);

    // Search filter
    useEffect(() => {
        const lower = searchTerm.trim().toLowerCase();
        if (!lower) return setFilteredCommissions(commissions);

        const filtered = commissions.filter((row) => {
            return (
                row.candidate_name?.toLowerCase().includes(lower) ||
                row.company_name?.toLowerCase().includes(lower) ||
                row.employee_name?.toLowerCase().includes(lower)
            );
        });

        setFilteredCommissions(filtered);
    }, [searchTerm, commissions]);

    // Update
    const handleRowUpdated = async (updatedRow: any) => {
        try {
            await apiFetch(`/placement-commission/${updatedRow.id}`, {
                method: "PUT",
                body: { amount: updatedRow.amount, employee_id: updatedRow.employee_id },
            });

            const updated = commissions
                .map((c) => (c.id === updatedRow.id ? updatedRow : c))
                .slice()
                .sort((a, b) => b.id - a.id);

            setCommissions(updated);
            setFilteredCommissions(updated);
            toast.success("Commission updated successfully.");
        } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to update commission";
            toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        }
    };

    // Delete
    const handleRowDeleted = async (id: number) => {
        try {
            await apiFetch(`/placement-commission/${id}`, { method: "DELETE" });
            const updated = commissions.filter((c) => c.id !== id);
            setCommissions(updated);
            setFilteredCommissions(updated);
            toast.success(`Commission ${id} deleted.`);
        } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to delete commission";
            toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        }
    };

    if (showLoader) return <Loader />;
    if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Commission</h1>
                    <p>Manage all placement commissions here.</p>
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
                        placeholder="Search by candidate, company or employee..."
                        className="pl-10"
                    />
                </div>
            </div>

            <AGGridTable
                rowData={filteredCommissions}
                columnDefs={columnDefs}
                title={`Commissions (${filteredCommissions.length})`}
                height="calc(70vh)"
                onRowAdded={async (newRow: any) => {
                    try {
                        const payload = {
                            placement_id: Number(newRow.placement_id),
                            employee_id: Number(newRow.employee_id),
                            amount: Number(newRow.amount),
                        };
                        if (!payload.placement_id || !payload.employee_id || !payload.amount) {
                            toast.error("Placement ID, Employee ID and Amount are required");
                            return;
                        }
                        const res = await apiFetch("/placement-commission", {
                            method: "POST",
                            body: payload,
                        });
                        const created = Array.isArray(res) ? res : (res?.data ?? res);
                        const updated = [created, ...commissions]
                            .slice()
                            .sort((a: any, b: any) => b.id - a.id);
                        setCommissions(updated);
                        setFilteredCommissions(updated);
                        toast.success("Commission created.");
                    } catch (e: any) {
                        const msg = e?.body || e?.message || "Failed to create commission";
                        toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
                    }
                }}
                onRowUpdated={handleRowUpdated}
                onRowDeleted={handleRowDeleted}
                showSearch={false}
            />
        </div>
    );
}
