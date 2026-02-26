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

export default function CommissionSchedulePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [schedulers, setSchedulers] = useState<any[]>([]);
    const [filteredSchedulers, setFilteredSchedulers] = useState<any[]>([]);
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
            width: 170,
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
            field: "installment_no",
            headerName: "Installment #",
            width: 130,
            editable: false,
        },
        {
            field: "installment_amount",
            headerName: "Amount",
            width: 130,
            editable: true,
        },
        {
            field: "scheduled_date",
            headerName: "Scheduled Date",
            width: 160,
            editable: true,
            valueFormatter: (p) =>
                p.value ? new Date(p.value).toLocaleDateString() : "",
        },
        {
            field: "payment_status",
            headerName: "Payment Status",
            width: 120,
            editable: true,
            cellEditor: "agSelectCellEditor",
            cellEditorParams: { values: ["Pending", "Paid"] },
        },
        {
            field: "created_at",
            headerName: "Created At",
            width: 160,
            editable: false,
            valueFormatter: (p) =>
                p.value ? new Date(p.value).toLocaleDateString() : "",
        },
        {
            field: "placement_commission_id",
            headerName: "Commission ID",
            width: 140,
            editable: false,
            hide: true,
        },
    ];

    // Fetch all commissions, then flatten their scheduler_entries
    const fetchSchedulers = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await apiFetch("/placement-commission");
            const commissions: any[] = Array.isArray(res) ? res : res?.data ?? [];

            // Flatten scheduler_entries and enrich with parent commission names
            const flat: any[] = [];
            commissions.forEach((commission) => {
                (commission.scheduler_entries || []).forEach((entry: any) => {
                    flat.push({
                        ...entry,
                        candidate_name: commission.candidate_name,
                        company_name: commission.company_name,
                        employee_name: commission.employee_name,
                    });
                });
            });

            const sorted = flat.slice().sort((a, b) => {
                if (a.placement_commission_id !== b.placement_commission_id)
                    return b.placement_commission_id - a.placement_commission_id; // latest first
                return a.installment_no - b.installment_no; // 1, 2, 3 within each group
            });
            setSchedulers(sorted);
            setFilteredSchedulers(sorted);
            toast.success("Fetched commission schedule successfully.");
        } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to fetch commission schedule";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
            toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedulers();
    }, []);

    // Search filter
    useEffect(() => {
        const lower = searchTerm.trim().toLowerCase();
        if (!lower) return setFilteredSchedulers(schedulers);

        const filtered = schedulers.filter((row) => {
            return (
                row.candidate_name?.toLowerCase().includes(lower) ||
                row.company_name?.toLowerCase().includes(lower) ||
                row.employee_name?.toLowerCase().includes(lower)
            );
        });

        setFilteredSchedulers(filtered);
    }, [searchTerm, schedulers]);

    // Update
    const handleRowUpdated = async (updatedRow: any) => {
        try {
            await apiFetch(`/placement-commission-scheduler/${updatedRow.id}`, {
                method: "PUT",
                body: {
                    installment_amount: updatedRow.installment_amount,
                    scheduled_date: updatedRow.scheduled_date,
                    payment_status: updatedRow.payment_status,
                },
            });

            const updated = schedulers
                .map((s) => (s.id === updatedRow.id ? updatedRow : s))
                .slice()
                .sort((a, b) => b.id - a.id);

            setSchedulers(updated);
            setFilteredSchedulers(updated);
            toast.success("Schedule entry updated successfully.");
        } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to update schedule entry";
            toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        }
    };

    // Delete
    const handleRowDeleted = async (id: number) => {
        try {
            await apiFetch(`/placement-commission-scheduler/${id}`, {
                method: "DELETE",
            });
            const updated = schedulers.filter((s) => s.id !== id);
            setSchedulers(updated);
            setFilteredSchedulers(updated);
            toast.success(`Schedule entry ${id} deleted.`);
        } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to delete schedule entry";
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
                    <h1 className="text-2xl font-bold">Commission Schedule</h1>
                    <p>View and manage installment schedules for all commissions.</p>
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
                rowData={filteredSchedulers}
                columnDefs={columnDefs}
                title={`Commission Schedule (${filteredSchedulers.length})`}
                height="calc(70vh)"
                onRowAdded={async (newRow: any) => {
                    try {
                        const payload = {
                            placement_commission_id: Number(newRow.placement_commission_id),
                            installment_no: Number(newRow.installment_no),
                            installment_amount: Number(newRow.installment_amount),
                            scheduled_date: newRow.scheduled_date,
                            payment_status: newRow.payment_status || "Pending",
                        };
                        if (
                            !payload.placement_commission_id ||
                            !payload.installment_no ||
                            !payload.installment_amount ||
                            !payload.scheduled_date
                        ) {
                            toast.error(
                                "Commission ID, Installment #, Amount and Date are required"
                            );
                            return;
                        }
                        const res = await apiFetch("/placement-commission-scheduler", {
                            method: "POST",
                            body: payload,
                        });
                        const created = Array.isArray(res) ? res : res?.data ?? res;
                        const updated = [created, ...schedulers]
                            .slice()
                            .sort((a: any, b: any) => b.id - a.id);
                        setSchedulers(updated);
                        setFilteredSchedulers(updated);
                        toast.success("Schedule entry created.");
                    } catch (e: any) {
                        const msg =
                            e?.body || e?.message || "Failed to create schedule entry";
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
