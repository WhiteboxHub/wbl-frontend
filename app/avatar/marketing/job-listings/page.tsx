"use client";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { toast, Toaster } from "sonner";
import { AGGridTable } from "@/components/AGGridTable";
import { Check, Filter, X, SearchIcon, Linkedin, Puzzle, ChevronDown, Download, Video } from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import api, { apiFetch } from "@/lib/api";
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

type JobListing = {
    id: number;
    title: string;
    normalized_title?: string | null;
    company_name: string;
    company_id?: number | null;
    position_type?: string | null;
    employment_mode?: string | null;
    source: string;
    source_uid?: string | null;
    source_job_id?: string | null;
    location?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    contact_linkedin?: string | null;
    job_url?: string | null;
    description?: string | null;
    notes?: string | null;
    status: string;
    confidence_score?: number | null;
    created_from_raw_id?: number | null;
    created_at: string;
    updated_at: string;
};

const StatusRenderer = ({ value }: { value?: string }) => {
    const status = value?.toLowerCase() || "";
    const variantMap: Record<string, string> = {
        open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        closed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        duplicate: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        invalid: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
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
    const filterButtonRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [filterVisible, setFilterVisible] = useState(false);

    const toggleFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (filterButtonRef.current) {
            const rect = filterButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 250;
            let left = rect.left;

            if (left + dropdownWidth > window.innerWidth) {
                left = window.innerWidth - dropdownWidth - 10;
            }
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

const LinkCellRenderer = (params: any) => {
    let url = (params.value || "").trim();

    if (!url) return <span className="text-gray-400 opacity-60">N/A</span>;
    if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            View Link
        </a>
    );
};

const LinkedinCellRenderer = (params: any) => {
    let url = (params.value || "").trim();

    if (!url) return <span className="text-gray-400 opacity-60">N/A</span>;
    if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="View LinkedIn Profile"
            onClick={(e) => e.stopPropagation()}
        >
            <Linkedin className="h-4 w-4 text-[#0a66c2]" />
        </a>
    );
};

export default function JobListingsPage() {
    const [allJobListings, setAllJobListings] = useState<JobListing[]>([]);
    const [filteredJobListings, setFilteredJobListings] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);

    // Filter states
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedModes, setSelectedModes] = useState<string[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAutofillOpen, setIsAutofillOpen] = useState(false);
    const autofillRef = useRef<HTMLDivElement>(null);

    const statusOptions = ['open', 'closed', 'on_hold', 'duplicate', 'invalid'];
    const typeOptions = ['full_time', 'contract', 'contract_to_hire', 'internship'];
    const modeOptions = ['onsite', 'hybrid', 'remote'];
    const sourceOptions = ['bot_linkedin_post_contact_extractor', 'bot_linkedin_message_extraction', 'email', 'linkedin', 'job_board', 'scraper', 'hiring.cafe', 'interview_modal', 'email_bot_llm_local'];

    const fetchJobListings = useCallback(async () => {
        setLoading(true);
        try {
            const pageSize = 5000;
            let allData: JobListing[] = [];
            let currentPage = 1;
            let hasNext = true;

            while (hasNext) {
                const response = await cachedApiFetch(`/positions/paginated?page=${currentPage}&page_size=${pageSize}`);
                const { data, has_next } = response.data;

                allData = [...allData, ...data];

                hasNext = has_next;
                currentPage++;

                // Safety break to prevent infinite loops if something goes wrong
                if (currentPage > 100) break;
            }

            setAllJobListings(allData);
        } catch (error) {
            console.error("Error fetching job listings:", error);
            toast.error("Failed to load job listings");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobListings();
    }, [fetchJobListings]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (autofillRef.current && !autofillRef.current.contains(event.target as Node)) {
                setIsAutofillOpen(false);
            }
        };
        if (isAutofillOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isAutofillOpen]);

    useEffect(() => {
        let filtered = [...allJobListings];

        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(p => selectedStatuses.includes(p.status));
        }
        if (selectedTypes.length > 0) {
            filtered = filtered.filter(p => p.position_type && selectedTypes.includes(p.position_type));
        }
        if (selectedModes.length > 0) {
            filtered = filtered.filter(p => p.employment_mode && selectedModes.includes(p.employment_mode));
        }
        if (selectedSources.length > 0) {
            filtered = filtered.filter(p => selectedSources.includes(p.source));
        }

        if (searchTerm.trim() !== "") {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter((p) => {
                return (
                    (p.title?.toLowerCase().includes(lower)) ||
                    (p.company_name?.toLowerCase().includes(lower)) ||
                    (p.location?.toLowerCase().includes(lower)) ||
                    (p.contact_email?.toLowerCase().includes(lower)) ||
                    (p.description?.toLowerCase().includes(lower))
                );
            });
        }

        setFilteredJobListings(filtered);
    }, [allJobListings, selectedStatuses, selectedTypes, selectedModes, selectedSources, searchTerm]);

    // Helper to filter to only valid job listing fields
    const getJobListingPayload = (data: any) => {
        const allowedFields = [
            "title", "normalized_title", "company_name", "company_id",
            "position_type", "employment_mode", "source",
            "source_uid", "source_job_id",
            "location", "city", "state", "zip", "country",
            "contact_email", "contact_phone", "contact_linkedin",
            "job_url", "description", "notes", "status",
            "confidence_score", "created_from_raw_id"
        ];

        // Helper to check if HTML content is effectively empty
        const isEmptyHtml = (html: string): boolean => {
            if (!html) return true;
            // Remove all HTML tags and check if there's any actual content
            const textContent = html.replace(/<[^>]*>/g, '').trim();
            return textContent === '';
        };

        const payload: Record<string, any> = {};
        allowedFields.forEach(field => {
            if (field in data) {
                let value = data[field];

                // Sanitize HTML fields (description, notes)
                if ((field === 'description' || field === 'notes') && typeof value === 'string') {
                    if (isEmptyHtml(value)) {
                        value = null;
                    }
                }

                if (value === "" || value === undefined) {
                    const requiredFields = ["title", "company_name", "source", "position_type", "employment_mode", "status"];
                    if (!requiredFields.includes(field)) {
                        payload[field] = null;
                    }
                } else {
                    payload[field] = value;
                    if (field === "company_id" || field === "created_from_raw_id") {
                        payload[field] = parseInt(value) || null;
                    }
                    if (field === "confidence_score") {
                        payload[field] = parseFloat(value) || null;
                    }
                }
            }
        });
        return payload;
    };

    const handleRowUpdated = async (updatedData: any) => {
        try {
            const id = updatedData.id;
            const dataToSave = getJobListingPayload(updatedData);

            const response = await api.put(`/positions/${id}`, dataToSave);
            await invalidateCache("/positions/paginated");
            const updatedRecord = response.data;

            setAllJobListings((prev) =>
                prev.map((row) => (row.id === id ? { ...row, ...updatedRecord } : row))
            );
            toast.success("Job listing updated successfully");
        } catch (error: any) {
            console.error("Error updating job listing:", error);
            let errorMessage = "Failed to update job listing";
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
            await api.delete(`/positions/${id}`);
            await invalidateCache("/positions/paginated");
            setAllJobListings((prev) => prev.filter((row) => row.id !== id));
            toast.success("Job listing deleted successfully");
        } catch (error: any) {
            console.error("Error deleting job listing:", error);
            toast.error("Failed to delete job listing");
        }
    };

    const handleRowAdded = async (newData: any) => {
        try {
            const filteredNewData = Object.fromEntries(
                Object.entries(newData).filter(([_, v]) => v !== "" && v !== undefined)
            );
            const dataWithDefaults = {
                source: "linkedin",
                status: "open",
                position_type: "full_time",
                employment_mode: "hybrid",
                ...filteredNewData
            };
            const dataToSave = getJobListingPayload(dataWithDefaults);
            const response = await api.post("/positions/", dataToSave);
            await invalidateCache("/positions/paginated");
            const addedRecord = response.data;
            setAllJobListings((prev) => [addedRecord, ...prev]);
            toast.success("Job listing added successfully");
        } catch (error: any) {
            console.error("Error adding job listing:", error);
            let errorMessage = "Failed to add job listing";
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
            {
                field: "title",
                headerName: "Title",
                width: 220,
                sortable: true,
                filter: "agTextColumnFilter",
                editable: true,
                cellRenderer: (params: any) => {
                    const url = params.data.job_url;
                    if (!url) return <span>{params.value}</span>;

                    let formattedUrl = url.trim();
                    if (!/^https?:\/\//i.test(formattedUrl)) {
                        formattedUrl = `https://${formattedUrl}`;
                    }

                    return (
                        <a
                            href={formattedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {params.value}
                        </a>
                    );
                }
            },
            { field: "company_name", headerName: "Company", width: 180, sortable: true, filter: "agTextColumnFilter", editable: true },
            {
                field: "position_type",
                headerName: "Type",
                width: 140,
                sortable: true,
                filter: false,
                editable: true,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: { values: typeOptions },
                valueFormatter: (params) => params.value ? params.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : "",
                headerComponent: FilterHeaderComponent,
                headerComponentParams: {
                    selectedItems: selectedTypes,
                    setSelectedItems: setSelectedTypes,
                    options: typeOptions,
                    label: "Type",
                    displayName: "Type",
                    color: "blue",
                    renderOption: (opt: string) => opt.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                }
            },
            {
                field: "employment_mode",
                headerName: "Mode",
                width: 130,
                sortable: true,
                filter: false,
                editable: true,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: { values: modeOptions },
                valueFormatter: (params) => params.value ? params.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : "",
                headerComponent: FilterHeaderComponent,
                headerComponentParams: {
                    selectedItems: selectedModes,
                    setSelectedItems: setSelectedModes,
                    options: modeOptions,
                    label: "Mode",
                    displayName: "Mode",
                    color: "purple",
                    renderOption: (opt: string) => opt.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                }
            },
            {
                field: "status",
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
                    renderOption: (opt: string) => opt.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                }
            },
            {
                field: "source",
                headerName: "Source",
                width: 100,
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
            {
                field: "created_at",
                headerName: "Date",
                width: 120,
                sortable: true,
                filter: "agDateColumnFilter",
                filterParams: {
                    comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
                        if (!cellValue) return -1;
                        const datePart = typeof cellValue === 'string' ? cellValue.split('T')[0] : new Date(cellValue).toISOString().split('T')[0];
                        const [year, month, day] = datePart.split('-');
                        const cellDate = new Date(Number(year), Number(month) - 1, Number(day));

                        if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                            return 0;
                        }
                        if (cellDate < filterLocalDateAtMidnight) {
                            return -1;
                        }
                        if (cellDate > filterLocalDateAtMidnight) {
                            return 1;
                        }
                    },
                },
                valueFormatter: ({ value }: ValueFormatterParams) => {
                    if (!value) return "-";
                    const datePart = typeof value === 'string' ? value.split('T')[0] : new Date(value).toISOString().split('T')[0];
                    const [year, month, day] = datePart.split('-');
                    return `${month ?? ''}/${day ?? ''}/${year ?? ''}`;
                }
            },
            { field: "location", headerName: "Location", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "city", headerName: "City", width: 120, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "state", headerName: "State", width: 100, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "zip", headerName: "Zip", width: 100, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "country", headerName: "Country", width: 120, sortable: true, filter: "agTextColumnFilter", editable: true },
            {
                field: "contact_email",
                headerName: "Contact Email",
                width: 200,
                sortable: true,
                filter: "agTextColumnFilter",
                editable: true,
                cellRenderer: (params: any) => {
                    if (!params.value) return "";
                    return (
                        <a
                            href={`mailto:${params.value}`}
                            className="text-blue-600 underline hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {params.value}
                        </a>
                    );
                }
            },
            { field: "contact_phone", headerName: "Contact Phone", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "contact_linkedin", headerName: "Contact LinkedIn", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true, cellRenderer: LinkedinCellRenderer },
            { field: "job_url", headerName: "Job URL", width: 250, sortable: true, filter: "agTextColumnFilter", editable: true, cellRenderer: LinkCellRenderer },
            { field: "source_job_id", headerName: "Source Job ID", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "normalized_title", headerName: "Normalized Title", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "company_id", headerName: "Company ID", width: 130, sortable: true, filter: "agNumberColumnFilter", editable: true },
            { field: "confidence_score", headerName: "Conf. Score", width: 130, sortable: true, filter: "agNumberColumnFilter", editable: true },
            { field: "description", headerName: "Description", width: 300, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "notes", headerName: "Notes", width: 300, sortable: true, filter: "agTextColumnFilter", editable: true },
        ],
        [selectedStatuses, selectedTypes, selectedModes, selectedSources]
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
                    <p className="text-muted-foreground">Manage job listings and their details.</p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex-1 max-w-sm">
                    <Label htmlFor="search" className="sr-only">Search</Label>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="search"
                            type="text"
                            value={searchTerm}
                            placeholder="Search jobs..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm w-full"
                        />
                    </div>
                </div>
            </div>

            {showLoader ? (
                <Loader />
            ) : (
                <AGGridTable
                    rowData={filteredJobListings}
                    columnDefs={columnDefs}
                    onRowUpdated={handleRowUpdated}
                    onRowDeleted={handleRowDeleted}
                    onRowAdded={handleRowAdded}
                    title={`Job Listings (${filteredJobListings.length})`}
                    showAddButton={true}
                    extraToolbarContent={
                        <div className="relative mr-2" ref={autofillRef}>
                            <button
                                onClick={() => setIsAutofillOpen(!isAutofillOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm h-8"
                            >
                                <Puzzle className="w-4 h-4 text-blue-500" />
                                <span className="hidden sm:inline">Autofill Extension</span>
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isAutofillOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isAutofillOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-1.5">
                                        <a
                                            href="https://drive.google.com/file/d/1usVGPq3iaygfewTAZ8lR46rJDnLSRGtQ/view?usp=sharing"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200 rounded-xl transition-colors group"
                                            onClick={() => setIsAutofillOpen(false)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-left text-blue-600">Download Extension</span>
                                                <span className="text-[10px] text-gray-400 font-medium text-left">Zip file for Chrome</span>
                                            </div>
                                        </a>
                                        <a
                                            href="https://drive.google.com/file/d/1iUcs6myGnNwetCQggxhvLabSeeLWufCF/view?usp=sharing"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-200 rounded-xl transition-colors group"
                                            onClick={() => setIsAutofillOpen(false)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                                                <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-left text-purple-600">Video Guide</span>
                                                <span className="text-[10px] text-gray-400 font-medium text-left">How to install & use</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                />
            )}
        </div>
    );
}
