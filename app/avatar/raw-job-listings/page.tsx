"use client";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ColDef } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { toast, Toaster } from "sonner";
import { AGGridTable } from "@/components/AGGridTable";
import { Check, SearchIcon } from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import api from "@/lib/api";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

type RawJobListing = {
    id: number;
    candidate_id?: number | null;
    source: string;
    source_uid?: string | null;
    extracted_at: string;
    extractor_version?: string | null;
    raw_title?: string | null;
    raw_company?: string | null;
    raw_location?: string | null;
    raw_zip?: string | null;
    raw_description?: string | null;
    raw_contact_info?: string | null;
    raw_notes?: string | null;
    raw_payload?: any;
    processing_status: string;
    error_message?: string | null;
    processed_at?: string | null;
    created_at: string;
};

const StatusRenderer = ({ value }: { value?: string }) => {
    const status = value?.toLowerCase() || "";
    const variantMap: Record<string, string> = {
        new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        parsed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        mapped: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        discarded: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        default: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };
    const formatted = (value || "")
        .toString()
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

    return (
        <Badge className={`${variantMap[status] || variantMap.default} capitalize`}>
            {formatted || "N/A"}
        </Badge>
    );
};

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
        setFilterVisible(false);
    };

    const filterButtonRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [filterVisible, setFilterVisible] = useState(false);

    const toggleFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (filterButtonRef.current) {
            const rect = filterButtonRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + window.scrollY,
                left: Math.max(0, rect.left + window.scrollX - 100),
            });
        }
        setFilterVisible((v) => !v);
    };

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
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        style={{ color: selectedItems.length > 0 ? "#8b5cf6" : "#6b7280" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-7 8v5l-4-3v-2L3 6V4z"
                        />
                    </svg>
                </div>
            </div>

            {filterVisible &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="filter-dropdown pointer-events-auto fixed flex w-44 max-w-[20vw] flex-col rounded-xl border border-gray-200 bg-white shadow-2xl animate-in fade-in zoom-in duration-200 dark:border-gray-700 dark:bg-gray-900"
                        style={{
                            top: dropdownPos.top + 8,
                            left: dropdownPos.left,
                            zIndex: 99999,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="max-h-[300px] overflow-y-auto p-1.5 pt-0.5">
                            {options.map((option) => {
                                const value = getOptionValue(option);
                                const key = getOptionKey(option);
                                const isSelected = selectedItems.some((i) => getOptionValue(i) === value);
                                return (
                                    <div
                                        key={key}
                                        onClick={() => handleItemChange(option)}
                                        className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${isSelected
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {renderOption(option)}
                                        </div>
                                        {isSelected && <Check className="h-4 w-4 animate-in zoom-in duration-300" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default function RawJobListingsPage() {
    const [allRawJobListings, setAllRawJobListings] = useState<RawJobListing[]>([]);
    const [filteredRawJobListings, setFilteredRawJobListings] = useState<RawJobListing[]>([]);
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);

    // Filter states
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const statusOptions = ['new', 'parsed', 'mapped', 'discarded', 'error'];
    const sourceOptions = ['linkedin', 'email', 'job_board', 'scraper'];

    const fetchRawJobListings = useCallback(async () => {
        setLoading(true);
        try {
            const pageSize = 5000;
            let allData: RawJobListing[] = [];
            let currentPage = 1;
            let hasNext = true;

            while (hasNext) {
                const response = await api.get(`/raw-positions/paginated?page=${currentPage}&page_size=${pageSize}`);
                const { data, has_next } = response.data;

                allData = [...allData, ...data];

                hasNext = has_next;
                currentPage++;

                // Safety break to prevent infinite loops if something goes wrong
                if (currentPage > 100) break;
            }

            setAllRawJobListings(allData);
        } catch (error) {
            console.error("Error fetching raw job listings:", error);
            toast.error("Failed to load raw job listings");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRawJobListings();
    }, [fetchRawJobListings]);

    useEffect(() => {
        let filtered = [...allRawJobListings];

        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(p => selectedStatuses.includes(p.processing_status));
        }
        if (selectedSources.length > 0) {
            filtered = filtered.filter(p => selectedSources.includes(p.source));
        }

        if (searchTerm.trim() !== "") {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter((p) => {
                return (
                    (p.raw_title?.toLowerCase().includes(lower)) ||
                    (p.raw_company?.toLowerCase().includes(lower)) ||
                    (p.raw_location?.toLowerCase().includes(lower)) ||
                    (p.source_uid?.toLowerCase().includes(lower)) ||
                    (p.raw_description?.toLowerCase().includes(lower))
                );
            });
        }

        setFilteredRawJobListings(filtered);
    }, [allRawJobListings, selectedStatuses, selectedSources, searchTerm]);

    const getRawJobListingPayload = (data: any) => {
        const allowedFields = [
            "candidate_id", "source", "source_uid", "extractor_version",
            "raw_title", "raw_company", "raw_location", "raw_zip",
            "raw_description", "raw_contact_info", "raw_notes", "raw_payload",
            "processing_status", "error_message", "processed_at"
        ];

        const payload: Record<string, any> = {};
        allowedFields.forEach(field => {
            if (field in data) {
                let value = data[field];
                if (value === "" || value === undefined) {
                    const requiredFields = ["source", "processing_status"];
                    if (!requiredFields.includes(field)) {
                        payload[field] = null;
                    }
                } else {
                    payload[field] = value;
                    if (field === "candidate_id") {
                        payload[field] = parseInt(value) || null;
                    }
                }
            }
        });
        return payload;
    };

    const handleRowUpdated = async (updatedData: any) => {
        try {
            const id = updatedData.id;
            const dataToSave = getRawJobListingPayload(updatedData);

            const response = await api.put(`/raw-positions/${id}`, dataToSave);
            const updatedRecord = response.data;

            setAllRawJobListings((prev) =>
                prev.map((row) => (row.id === id ? { ...row, ...updatedRecord } : row))
            );
            toast.success("Raw job listing updated successfully");
        } catch (error: any) {
            console.error("Error updating raw job listing:", error);
            let errorMessage = "Failed to update raw job listing";
            if (error?.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (Array.isArray(detail)) {
                    errorMessage = detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
                } else {
                    errorMessage = detail;
                }
            }
            toast.error(errorMessage);
        }
    };

    const handleRowDeleted = async (id: string | number) => {
        try {
            await api.delete(`/raw-positions/${id}`);
            setAllRawJobListings((prev) => prev.filter((row) => row.id !== id));
            toast.success("Raw job listing deleted successfully");
        } catch (error: any) {
            console.error("Error deleting raw job listing:", error);
            toast.error("Failed to delete raw job listing");
        }
    };

    const handleRowAdded = async (newData: any) => {
        try {
            const filteredNewData = Object.fromEntries(
                Object.entries(newData).filter(([_, v]) => v !== "" && v !== undefined)
            );
            const dataWithDefaults = {
                source: "linkedin",
                processing_status: "new",
                ...filteredNewData
            };
            const dataToSave = getRawJobListingPayload(dataWithDefaults);
            const response = await api.post("/raw-positions/", dataToSave);
            const addedRecord = response.data;
            setAllRawJobListings((prev) => [addedRecord, ...prev]);
            toast.success("Raw job listing added successfully");
        } catch (error: any) {
            console.error("Error adding raw job listing:", error);
            let errorMessage = "Failed to add raw job listing";
            if (error?.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (Array.isArray(detail)) {
                    errorMessage = detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
                } else {
                    errorMessage = detail;
                }
            }
            toast.error(errorMessage);
        }
    };

    const columnDefs: ColDef[] = useMemo(
        () => [
            { field: "id", headerName: "ID", width: 80, sortable: true, filter: "agNumberColumnFilter", pinned: "left" },
            { field: "raw_title", headerName: "Title", width: 220, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "raw_company", headerName: "Company", width: 180, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "raw_location", headerName: "Location", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            {
                field: "processing_status",
                headerName: "Status",
                width: 140,
                cellRenderer: (params: any) => <StatusRenderer value={params.value} />,
                filter: false,
                editable: true,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: { values: statusOptions },
                headerComponent: FilterHeaderComponent,
                headerComponentParams: {
                    selectedItems: selectedStatuses,
                    setSelectedItems: setSelectedStatuses,
                    options: statusOptions,
                    label: "Status",
                    displayName: "Status",
                    color: "green",
                    renderOption: (opt: string) => <StatusRenderer value={opt} />
                }
            },
            {
                field: "source",
                headerName: "Source",
                width: 130,
                sortable: true,
                filter: false,
                editable: true,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: { values: sourceOptions },
                valueFormatter: (params) => params.value ? params.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : "",
                headerComponent: FilterHeaderComponent,
                headerComponentParams: {
                    selectedItems: selectedSources,
                    setSelectedItems: setSelectedSources,
                    options: sourceOptions,
                    label: "Source",
                    displayName: "Source",
                    color: "orange",
                    renderOption: (opt: string) => opt.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                }
            },
            { field: "source_uid", headerName: "Source UID", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "candidate_id", headerName: "Candidate ID", width: 130, sortable: true, filter: "agNumberColumnFilter", editable: true },
            { field: "raw_zip", headerName: "Zip", width: 100, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "raw_contact_info", headerName: "Contact Info", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
            // { field: "raw_description", headerName: "Description", width: 300, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "raw_payload", headerName: "Payload", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "extractor_version", headerName: "Extractor Version", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "error_message", headerName: "Error Message", width: 250, sortable: true, filter: "agTextColumnFilter", editable: true },
            {
                field: "processed_at",
                headerName: "Processed At",
                width: 180,
                sortable: true,
                filter: "agDateColumnFilter",
                valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : ""
            },
            { field: "raw_description", headerName: "Description", width: 300, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "raw_notes", headerName: "Notes", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
        ],
        [selectedStatuses, selectedSources]
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Raw Job Listings</h1>
                    <p className="text-muted-foreground">Manage raw extracted job listings from various sources.</p>
                </div>
            </div>

            <div className="max-w-md">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</Label>
                <div className="relative mt-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        type="text"
                        value={searchTerm}
                        placeholder="Search by title, company, location, source UID..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {showLoader ? (
                <Loader />
            ) : (
                <AGGridTable
                    rowData={filteredRawJobListings}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    onRowAdded={handleRowAdded}
                    title={`Raw Job Listings (${filteredRawJobListings.length})`}
                    showAddButton={true}
                />
            )}
        </div>
    );
}
