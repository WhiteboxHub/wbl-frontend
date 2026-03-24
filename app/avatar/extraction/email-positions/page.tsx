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
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

type EmailPosition = {
    id: number;
    candidate_id?: number | null;
    source: string;
    source_uid?: string | null;
    extracted_at: string;
    extractor_version?: string | null;
    title?: string | null;
    company?: string | null;
    location?: string | null;
    zip?: string | null;
    description?: string | null;
    contact_info?: string | null;
    notes?: string | null;
    payload?: any;
    error_message?: string | null;
    processed_at?: string | null;
    created_at: string;
};
 
function formatDateTime(params_dateStr: string | null | undefined) {
    let dateStr = params_dateStr;
    if (!dateStr) return "";

    // Force UTC if the string lacks a timezone indicator (e.g. from DB)
    if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
        dateStr = dateStr.replace(' ', 'T') + 'Z';
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return params_dateStr || "";

    return date.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}





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
    const filterButtonRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [filterVisible, setFilterVisible] = useState(false);

    const toggleFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (filterButtonRef.current) {
            const rect = filterButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 220; // Approximated width for calculation
            let left = rect.left;

            // Prevent going off-screen to the right
            if (left + dropdownWidth > window.innerWidth) {
                left = window.innerWidth - dropdownWidth - 10;
            }
            // Prevent going off-screen to the left
            if (left < 10) left = 10;

            setDropdownPos({
                top: rect.bottom + 8,
                left: left,
            });
        }
        setFilterVisible((v) => !v);
    };

    const handleItemChange = (item: any) => {
        const value = getOptionValue(item);
        setSelectedItems((prev: any[]) => {
            const isSelected = prev.some((i) => getOptionValue(i) === value);
            return isSelected
                ? prev.filter((i) => getOptionValue(i) !== value)
                : [...prev, item];
        });
        // We don't close it immediately for multi-select
    };

    const clearFilters = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedItems([]);
        setFilterVisible(false);
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
        const handleScroll = () => {
            if (filterVisible) setFilterVisible(false);
        };
        if (filterVisible) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, { capture: true });
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
                        className="filter-dropdown pointer-events-auto fixed flex w-70 flex-col rounded-xl border border-gray-200 bg-white shadow-2xl animate-in fade-in zoom-in duration-200 dark:border-gray-700 dark:bg-gray-900"
                        style={{
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            zIndex: 99999,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-1.5 h-auto">
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
                                        <div className="flex items-center space-x-2 truncate mr-2">
                                            {renderOption(option)}
                                        </div>
                                        {isSelected && <Check className="h-4 w-4 flex-shrink-0 animate-in zoom-in duration-300" />}
                                    </div>
                                );
                            })}
                        </div>
                        {selectedItems.length > 0 && (
                            <div className="border-t p-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-center">
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium py-1 w-full"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default function EmailPositionsPage() {
    const [allEmailPositions, setAllEmailPositions] = useState<EmailPosition[]>([]);
    const [filteredEmailPositions, setFilteredEmailPositions] = useState<EmailPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);

    // Filter states
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const sourceOptions = ['bot_linkedin_post_contact_extractor', 'bot_linkedin_message_extraction', 'email', 'linkedin', 'job_board', 'scraper', 'hiring.cafe', 'email_bot_llm_local'];

    const fetchEmailPositions = useCallback(async () => {
        setLoading(true);
        try {
            const pageSize = 5000;
            let allData: EmailPosition[] = [];
            let currentPage = 1;
            let hasNext = true;

            while (hasNext) {
                const response = await cachedApiFetch(`/email-positions/paginated?page=${currentPage}&page_size=${pageSize}`);
                const { data, has_next } = response.data;

                allData = [...allData, ...data];

                hasNext = has_next;
                currentPage++;

                // Safety break to prevent infinite loops if something goes wrong
                if (currentPage > 100) break;
            }

            setAllEmailPositions(allData);
        } catch (error) {
            console.error("Error fetching email positions:", error);
            toast.error("Failed to load email positions");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmailPositions();
    }, [fetchEmailPositions]);

    useEffect(() => {
        let filtered = [...allEmailPositions];

        if (selectedSources.length > 0) {
            filtered = filtered.filter(p => selectedSources.includes(p.source));
        }

        if (searchTerm.trim() !== "") {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter((p) => {
                return (
                    (p.title?.toLowerCase().includes(lower)) ||
                    (p.company?.toLowerCase().includes(lower)) ||
                    (p.location?.toLowerCase().includes(lower)) ||
                    (p.source_uid?.toLowerCase().includes(lower)) ||
                    (p.description?.toLowerCase().includes(lower))
                );
            });
        }

        setFilteredEmailPositions(filtered);
    }, [allEmailPositions, selectedSources, searchTerm]);

    const getEmailPositionPayload = (data: any) => {
        const allowedFields = [
            "candidate_id", "source", "source_uid", "extractor_version",
            "title", "company", "location", "zip",
            "description", "contact_info", "notes", "payload",
            "error_message", "processed_at"
        ];

        const payload: Record<string, any> = {};
        allowedFields.forEach(field => {
            if (field in data) {
                let value = data[field];
                if (value === "" || value === undefined) {
                    const requiredFields = ["source"];
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
            const dataToSave = getEmailPositionPayload(updatedData);

            const response = await api.put(`/email-positions/${id}`, dataToSave);
            await invalidateCache("/email-positions/paginated");
            const updatedRecord = response.data;

            setAllEmailPositions((prev) =>
                prev.map((row) => (row.id === id ? { ...row, ...updatedRecord } : row))
            );
            toast.success("Email position updated successfully");
        } catch (error: any) {
            console.error("Error updating email position:", error);
            let errorMessage = "Failed to update email position";
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
            await api.delete(`/email-positions/${id}`);
            await invalidateCache("/email-positions/paginated");
            setAllEmailPositions((prev) => prev.filter((row) => row.id !== id));
            toast.success("Email position deleted successfully");
        } catch (error: any) {
            console.error("Error deleting email position:", error);
            toast.error("Failed to delete email position");
        }
    };

    const handleRowAdded = async (newData: any) => {
        try {
            const filteredNewData = Object.fromEntries(
                Object.entries(newData).filter(([_, v]) => v !== "" && v !== undefined)
            );
            const dataWithDefaults = {
                source: "email",
                ...filteredNewData
            };
            const dataToSave = getEmailPositionPayload(dataWithDefaults);
            const response = await api.post("/email-positions/", dataToSave);
            await invalidateCache("/email-positions/paginated");
            const addedRecord = response.data;
            setAllEmailPositions((prev) => [addedRecord, ...prev]);
            toast.success("Email position added successfully");
        } catch (error: any) {
            console.error("Error adding email position:", error);
            let errorMessage = "Failed to add email position";
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
            { field: "id", headerName: "ID", width: 80, sortable: true, filter: "agNumberColumnFilter", pinned: "left", editable: false },
            { field: "title", headerName: "Title", width: 220, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "company", headerName: "Company", width: 180, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "location", headerName: "Location", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            {
                field: "source",
                headerName: "Source",
                width: 220,
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
            { field: "candidate_id", headerName: "Candidate ID", width: 130, sortable: true, filter: "agNumberColumnFilter", editable: false },
            { field: "zip", headerName: "Zip", width: 100, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "contact_info", headerName: "Contact Info", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
            {
                field: "payload",
                headerName: "Payload",
                width: 200,
                sortable: true,
                filter: "agTextColumnFilter",
                editable: true,
                valueFormatter: (params) => {
                    if (params.value && typeof params.value === 'object') {
                        try {
                            return JSON.stringify(params.value);
                        } catch (e) {
                            return String(params.value);
                        }
                    }
                    return params.value;
                }
            },
            { field: "extractor_version", headerName: "Extractor Version", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "error_message", headerName: "Error Message", width: 250, sortable: true, filter: "agTextColumnFilter", editable: true },
            {
                field: "extracted_at",
                headerName: "Extracted At",
                width: 180,
                sortable: true,
                filter: "agDateColumnFilter",
                editable: false,
                valueFormatter: (params) => formatDateTime(params.value)
            },
            {
                field: "processed_at",
                headerName: "Processed At",
                width: 180,
                sortable: true,
                filter: "agDateColumnFilter",
                editable: false,
                valueFormatter: (params) => formatDateTime(params.value)
            },
            { field: "description", headerName: "Description", width: 300, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "notes", headerName: "Notes", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
        ],
        [selectedSources]
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Email Positions</h1>
                    <p className="text-muted-foreground">Manage extracted job positions from emails.</p>
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
                    rowData={filteredEmailPositions}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    onRowAdded={handleRowAdded}
                    title={`Email Positions (${filteredEmailPositions.length})`}
                    showAddButton={true}
                />
            )}
        </div>
    );
}
