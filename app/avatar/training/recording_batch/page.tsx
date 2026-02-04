"use client";

import React, { useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";

export default function RecordingBatchPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [recordingBatches, setRecordingBatches] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [recordings, setRecordings] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const columnDefs: ColDef[] = [
        {
            field: "recording_id",
            headerName: "Recording ID",
            width: 150,
            editable: true,
        },
        {
            field: "recording_name",
            headerName: "Recording Name",
            width: 300,
            editable: false,
        },
        {
            field: "batch_id",
            headerName: "Batch ID",
            width: 150,
            editable: true,
        },
        {
            field: "batch_name",
            headerName: "Batch Name",
            width: 250,
            editable: false,
        },
    ];

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError("");

            const [rbRes, recRes, batchRes] = await Promise.all([
                apiFetch("/recording-batches"),
                apiFetch("/recordings"),
                apiFetch("/batch")
            ]);

            const rbArr = Array.isArray(rbRes) ? rbRes : rbRes?.data ?? [];
            const recArr = Array.isArray(recRes) ? recRes : recRes?.data ?? [];
            const batchArr = Array.isArray(batchRes) ? batchRes : batchRes?.data ?? [];

            setRecordings(recArr);
            setBatches(batchArr);

            const recMap = new Map(recArr.map((r: any) => [r.id, r.description || r.subject || `Recording ${r.id}`]));
            const batchMap = new Map(batchArr.map((b: any) => [b.batchid, b.batchname || `Batch ${b.batchid}`]));

            const enriched = (rbArr || []).map((item: any) => ({
                ...item,
                id: `${item.recording_id}-${item.batch_id}`, // Unique ID for AG Grid
                recording_name: recMap.get(item.recording_id) || "Unknown",
                batch_name: batchMap.get(item.batch_id) || "Unknown",
            }));

            setRecordingBatches(enriched);
            setFilteredData(enriched);
            toast.success("Data fetched successfully.");
        } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to fetch data";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
            toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        const lower = searchTerm.trim().toLowerCase();
        if (!lower) return setFilteredData(recordingBatches);

        const filtered = recordingBatches.filter((row) => {
            const recIdMatch = row.recording_id?.toString().includes(lower);
            const batchIdMatch = row.batch_id?.toString().includes(lower);
            const recNameMatch = row.recording_name?.toLowerCase().includes(lower);
            const batchNameMatch = row.batch_name?.toLowerCase().includes(lower);

            return recIdMatch || batchIdMatch || recNameMatch || batchNameMatch;
        });

        setFilteredData(filtered);
    }, [searchTerm, recordingBatches]);

    const handleRowDeleted = async (compositeId: any) => {
        try {
            if (typeof compositeId !== "string" || !compositeId.includes("-")) {
                toast.error("Invalid mapping ID");
                return;
            }
            const [recordingId, batchId] = compositeId.split("-");
            await apiFetch(`/recording-batches/${recordingId}/${batchId}`, { method: "DELETE" });

            const updated = recordingBatches.filter((c) => c.id !== compositeId);
            setRecordingBatches(updated);
            setFilteredData(updated);
            toast.success(`Mapping deleted successfully.`);
        } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to delete mapping";
            toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        }
    };

    if (loading) return <p className="text-center mt-8">Loading...</p>;
    if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Recording Batch Mappings</h1>
                    <p>Manage recordings assigned to batches.</p>
                </div>
            </div>

            <div className="max-w-md">
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by ID or name..."
                        className="pl-10"
                    />
                </div>
            </div>

            <AGGridTable
                rowData={filteredData}
                columnDefs={columnDefs}
                title={`Recording Batches (${filteredData.length})`}
                height="calc(70vh)"
                onRowAdded={async (newRow: any) => {
                    try {
                        const payload = {
                            recording_id: parseInt(newRow.recording_id),
                            batch_id: parseInt(newRow.batch_id),
                        };
                        if (!payload.recording_id || !payload.batch_id) {
                            toast.error("Both Recording ID and Batch ID are required");
                            return;
                        }
                        const res = await apiFetch("/recording-batches", { method: "POST", body: payload });
                        const created = Array.isArray(res) ? res : (res?.data ?? res);

                        // Re-fetch or manually enrich
                        const recName = recordings.find(r => r.id === created.recording_id)?.description || recordings.find(r => r.id === created.recording_id)?.subject || "Unknown";
                        const batchName = batches.find(b => b.batchid === created.batch_id)?.batchname || "Unknown";

                        const enriched = {
                            ...created,
                            id: `${created.recording_id}-${created.batch_id}`,
                            recording_name: recName,
                            batch_name: batchName
                        };

                        const updated = [enriched, ...recordingBatches];
                        setRecordingBatches(updated);
                        setFilteredData(updated);
                        toast.success("Mapping created");
                    } catch (e: any) {
                        const msg = e?.body || e?.message || "Failed to create mapping";
                        toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
                    }
                }}
                onRowDeleted={handleRowDeleted}
                showSearch={false}
            />
        </div>
    );
}
