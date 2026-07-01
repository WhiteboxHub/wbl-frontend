"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { ColDef } from "ag-grid-community";
import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { SearchIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { apiFetch } from "@/lib/api.js";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";
const FilterHeaderComponent = ({
    selectedItems,
    setSelectedItems,
    options,
    label,
    color = "blue",
    displayName,
    renderOption = (option: any) => option,
    getOptionValue = (option: any) => option,
    getOptionKey = (option: any) => option,
}: {
    selectedItems: any[];
    setSelectedItems: React.Dispatch<React.SetStateAction<any[]>>;
    options: any[];
    label: string;
    color?: string;
    displayName?: string;
    renderOption?: (option: any) => React.ReactNode;
    getOptionValue?: (option: any) => any;
    getOptionKey?: (option: any) => any;
}) => {
    const handleItemChange = (item: any) => {
        const value = getOptionValue(item);
        setSelectedItems((prev: any[]) => {
            const isSelected = prev.some((i) => getOptionValue(i) === value);
            return isSelected
                ? prev.filter((i) => getOptionValue(i) !== value)
                : [...prev, item];
        });
    };

    const filterButtonRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [filterVisible, setFilterVisible] = useState(false);
    const toggleFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        const targetRef = filterButtonRef.current;
        if (targetRef) {
            const rect = targetRef.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 8,
                left: rect.left,
            });
        }
        setFilterVisible((v) => !v);
    };
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setSelectedItems(e.target.checked ? [...options] : []);
    };
    const isAllSelected = selectedItems.length === options.length && options.length > 0;
    const isIndeterminate = selectedItems.length > 0 && selectedItems.length < options.length;
    const colorMap: Record<string, string> = {
        blue: "bg-blue-500",
        green: "bg-green-500",
        purple: "bg-purple-500",
        red: "bg-red-500",
        orange: "bg-orange-500",
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                filterButtonRef.current &&
                !filterButtonRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setFilterVisible(false);
            }
        };
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setFilterVisible(false);
            }
        };
        if (filterVisible) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [filterVisible]);

    return (
        <div className="ag-cell-label-container" role="presentation">
            <div className="ag-header-cell-label" role="presentation">
                <span className="ag-header-cell-text">{displayName || label}</span>
                <div
                    ref={filterButtonRef}
                    className="ag-header-icon ag-header-label-icon"
                    onClick={toggleFilter}
                    style={{
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        marginLeft: "4px",
                    }}
                >
                    {selectedItems.length > 0 && (
                        <span
                            className={`${colorMap[color]} min-w-[20px] rounded-full px-2 py-0.5 text-center text-xs text-white`}
                            style={{ marginRight: "4px" }}
                        >
                            {selectedItems.length}
                        </span>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: selectedItems.length > 0 ? "#8b5cf6" : "#6b7280" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z" />
                    </svg>
                </div>
            </div>
            {filterVisible &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="filter-dropdown pointer-events-auto fixed flex w-56 flex-col space-y-2 rounded-lg border bg-white p-3 text-sm shadow-xl dark:border-gray-600 dark:bg-gray-800"
                        style={{
                            top: dropdownPos.top + 5, left: dropdownPos.left, zIndex: 99999, maxHeight: "300px", overflowY: "auto",
                        }} onClick={(e) => e.stopPropagation()} >
                        <div className="mb-2 border-b pb-2">
                            <label className="font-medium text-sm flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={(e) => e.stopPropagation()}  >
                                <input type="checkbox" checked={isAllSelected} ref={(el) => {
                                    if (el) el.indeterminate = isIndeterminate;
                                }}
                                    onChange={handleSelectAll}
                                    className="mr-3"
                                />  Select All
                            </label>
                        </div>
                        {options.map((option) => {
                            const value = getOptionValue(option);
                            const key = getOptionKey(option);
                            const isSelected = selectedItems.some((i) => getOptionValue(i) === value);
                            return (
                                <label key={key} className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={(e) => e.stopPropagation()}
                                >
                                    <input type="checkbox" checked={isSelected} onChange={() => handleItemChange(option)} className="mr-3" /> {renderOption(option)}
                                </label>
                            );
                        })}
                        {selectedItems.length > 0 && (
                            <div className="mt-2 border-t pt-2">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedItems([]); }} className="w-full py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"> Clear All</button>
                            </div>
                        )}
                    </div>,
                    document.body
                )}
        </div>
    );
};
export default function RecordingBatchPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [recordingBatches, setRecordingBatches] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [recordings, setRecordings] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);
    const [error, setError] = useState("");
    const [selectedBatchNames, setSelectedBatchNames] = useState<string[]>([]);

    const batchNameOptions = useMemo(() => {
        const names = [...new Set(recordingBatches.map((r) => r.batch_name?.trim()).filter(Boolean))];
        return names.sort((a, b) => b.localeCompare(a))
    }, [recordingBatches]);
        const context = useMemo(() => ({
             selectedBatchNames,
                setSelectedBatchNames,
                      batchNameOptions
                 }), [selectedBatchNames, setSelectedBatchNames, batchNameOptions]);
    const columnDefs: ColDef[] = useMemo(() => [
        {
            field: "recording_id",
            headerName: "Recording ID",
            width: 150,
            editable: true,
        },
        {
            field: "recording_name",
            headerName: "Recording Name",
            width: 600,
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
            filter: false,
            suppressHeaderMenuButton: true,
            headerComponent: FilterHeaderComponent,
            headerComponentParams: {
                selectedItems: selectedBatchNames,
                setSelectedItems: setSelectedBatchNames,
                options: batchNameOptions,
                label: "Batch Name",
                displayName: "Batch Name",
                color: "purple",
                renderOption: (option: string) => option,
                getOptionValue: (option: string) => option,
                getOptionKey: (option: string) => option,
            },
        },
    ], [selectedBatchNames, batchNameOptions]);

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
        let filtered = recordingBatches;

        // Filter by selected batch names
        if (selectedBatchNames.length > 0) {
            filtered = filtered.filter((row) =>
                selectedBatchNames.includes(row.batch_name)
            );
        }

        // Filter by search term
        const lower = searchTerm.trim().toLowerCase();
        if (lower) {
            filtered = filtered.filter((row) => {
                const recIdMatch = row.recording_id?.toString().includes(lower);
                const batchIdMatch = row.batch_id?.toString().includes(lower);
                const recNameMatch = row.recording_name?.toLowerCase().includes(lower);
                const batchNameMatch = row.batch_name?.toLowerCase().includes(lower);

                return recIdMatch || batchIdMatch || recNameMatch || batchNameMatch;
            });
        }

        setFilteredData(filtered);
    }, [searchTerm, recordingBatches, selectedBatchNames, setFilteredData]);

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
