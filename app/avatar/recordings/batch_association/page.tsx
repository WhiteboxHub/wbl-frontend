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

const sortRecordingBatches = (rows: any[] = []) =>
    [...rows].sort((a, b) => {
        const recordingDiff = Number(b.recording_id || 0) - Number(a.recording_id || 0);
        if (recordingDiff !== 0) return recordingDiff;
        return Number(b.batch_id || 0) - Number(a.batch_id || 0);
    });

export default function RecordingBatchPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [recordingBatches, setRecordingBatches] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [recordings, setRecordings] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);
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
                original_recording_id: item.recording_id,
                original_batch_id: item.batch_id,
                recording_name: recMap.get(item.recording_id) || "Unknown",
                batch_name: batchMap.get(item.batch_id) || "Unknown",
            }));

            const sortedEnriched = sortRecordingBatches(enriched);
            setRecordingBatches(sortedEnriched);
            setFilteredData(sortedEnriched);
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

    const handleRowUpdated = async (updatedRow: any) => {
        try {
            const oldRecordingId = Number(updatedRow.original_recording_id ?? updatedRow.recording_id);
            const oldBatchId = Number(updatedRow.original_batch_id ?? updatedRow.batch_id);
            const oldCompositeId = `${oldRecordingId}-${oldBatchId}`;
            const newRecordingId = Number(updatedRow.recording_id);
            const newBatchId = Number(updatedRow.batch_id);

            if (!Number.isInteger(newRecordingId) || newRecordingId <= 0 || !Number.isInteger(newBatchId) || newBatchId <= 0) {
                toast.error("Recording ID and Batch ID must be valid positive numbers");
                return;
            }

            const res = await apiFetch(`/recording-batches/${oldRecordingId}/${oldBatchId}`, {
                method: "PUT",
                body: {
                    recording_id: newRecordingId,
                    batch_id: newBatchId,
                },
            });

            const saved = Array.isArray(res) ? res[0] : (res?.data ?? res);
            const recName = recordings.find((r) => r.id === saved.recording_id)?.description
                || recordings.find((r) => r.id === saved.recording_id)?.subject
                || "Unknown";
            const batchName = batches.find((b) => b.batchid === saved.batch_id)?.batchname || "Unknown";

            const normalized = {
                ...updatedRow,
                ...saved,
                id: `${saved.recording_id}-${saved.batch_id}`,
                original_recording_id: saved.recording_id,
                original_batch_id: saved.batch_id,
                recording_name: recName,
                batch_name: batchName,
            };

            updatedRow.original_recording_id = saved.recording_id;
            updatedRow.original_batch_id = saved.batch_id;
            updatedRow.id = `${saved.recording_id}-${saved.batch_id}`;

            setRecordingBatches((prev) => {
                let replaced = false;
                let mapped = prev.map((row) => {
                    const rowOriginalRecordingId = Number(row.original_recording_id ?? row.recording_id);
                    const rowOriginalBatchId = Number(row.original_batch_id ?? row.batch_id);
                    if (rowOriginalRecordingId === oldRecordingId && rowOriginalBatchId === oldBatchId) {
                        replaced = true;
                        return normalized;
                    }
                    return row;
                });

                if (!replaced) {
                    mapped = mapped.map((row) => (row.id === oldCompositeId ? normalized : row));
                }

                const updated = sortRecordingBatches(
                    mapped
                );
                setFilteredData(updated);
                return updated;
            });

            toast.success("Mapping updated successfully.");
        } catch (e: any) {
            const msg = e?.body || e?.message || "Failed to update mapping";
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
                            original_recording_id: created.recording_id,
                            original_batch_id: created.batch_id,
                            recording_name: recName,
                            batch_name: batchName
                        };

                        const updated = sortRecordingBatches([enriched, ...recordingBatches]);
                        setRecordingBatches(updated);
                        setFilteredData(updated);
                        toast.success("Mapping created");
                    } catch (e: any) {
                        const msg = e?.body || e?.message || "Failed to create mapping";
                        toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
                    }
                }}
                onRowUpdated={handleRowUpdated}
                onRowDeleted={handleRowDeleted}
                showSearch={false}
            />
        </div>
    );
}