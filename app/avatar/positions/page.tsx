"use client";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ColDef } from "ag-grid-community";
import { Badge } from "@/components/admin_ui/badge";
import { toast, Toaster } from "sonner";
import { AGGridTable } from "@/components/AGGridTable";
import { Check, Filter, X, SearchIcon } from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import api from "@/lib/api";

type Position = {
    id: number;
    title: string;
    normalized_title?: string | null;
    company_name: string;
    company_id?: number | null;
    position_type?: string | null;
    employment_mode?: string | null;
    source: string;
    source_uid?: string | null;
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

    const handleSelectAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAllSelected) {
            setSelectedItems([]);
        } else {
            setSelectedItems([...options]);
        }
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

const LinkCellRenderer = (params: any) => {
    let url = (params.value || "").trim();

    if (!url) return <span className="text-gray-500">N/A</span>;
    if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
        >
            Click Here
        </a>
    );
};

export default function PositionsPage() {
    const [allPositions, setAllPositions] = useState<Position[]>([]);
    const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(false);

    // Filter states
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedModes, setSelectedModes] = useState<string[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const statusOptions = ['open', 'closed', 'on_hold', 'duplicate', 'invalid'];
    const typeOptions = ['full_time', 'contract', 'contract_to_hire', 'internship'];
    const modeOptions = ['onsite', 'hybrid', 'remote'];
    const sourceOptions = ['linkedin', 'job_board', 'vendor', 'email', 'scraper'];

    const fetchPositions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/positions/");
            setAllPositions(response.data);
        } catch (error) {
            console.error("Error fetching positions:", error);
            toast.error("Failed to load positions");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPositions();
    }, [fetchPositions]);

    useEffect(() => {
        let filtered = [...allPositions];

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

        setFilteredPositions(filtered);
    }, [allPositions, selectedStatuses, selectedTypes, selectedModes, selectedSources, searchTerm]);

    // Helper to filter to only valid position fields
    const getPositionPayload = (data: any) => {
        const allowedFields = [
            "title", "normalized_title", "company_name", "company_id",
            "position_type", "employment_mode", "source", "source_uid",
            "location", "city", "state", "zip", "country",
            "contact_email", "contact_phone", "contact_linkedin",
            "job_url", "description", "notes", "status",
            "confidence_score", "created_from_raw_id"
        ];

        const payload: Record<string, any> = {};
        allowedFields.forEach(field => {
            if (field in data) {
                const value = data[field];
                if (value === "" || value === undefined) {
                    const requiredFields = ["title", "company_name", "source"];
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
            const dataToSave = getPositionPayload(updatedData);

            const response = await api.put(`/positions/${id}/`, dataToSave);
            const updatedRecord = response.data;

            setAllPositions((prev) =>
                prev.map((row) => (row.id === id ? { ...row, ...updatedRecord } : row))
            );
            toast.success("Position updated successfully");
        } catch (error: any) {
            console.error("Error updating position:", error);
            let errorMessage = "Failed to update position";
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
            await api.delete(`/positions/${id}/`);
            setAllPositions((prev) => prev.filter((row) => row.id !== id));
            toast.success("Position deleted successfully");
        } catch (error: any) {
            console.error("Error deleting position:", error);
            toast.error("Failed to delete position");
        }
    };

    const handleRowAdded = async (newData: any) => {
        try {
            const dataWithDefaults = {
                source: "linkedin",
                status: "open",
                ...newData
            };
            const dataToSave = getPositionPayload(dataWithDefaults);
            const response = await api.post("/positions/", dataToSave);
            const addedRecord = response.data;
            setAllPositions((prev) => [addedRecord, ...prev]);
            toast.success("Position added successfully");
        } catch (error: any) {
            console.error("Error adding position:", error);
            let errorMessage = "Failed to add position";
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
            { field: "title", headerName: "Title", width: 220, sortable: true, filter: "agTextColumnFilter", editable: true },
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
                    renderOption: (opt: string) => <StatusRenderer value={opt} />
                }
            },
            {
                field: "source",
                headerName: "Source",
                width: 140,
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
            { field: "location", headerName: "Location", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true },
            { field: "city", headerName: "City", width: 120, sortable: true, filter: "agTextColumnFilter", editable: true, hide: true },
            { field: "state", headerName: "State", width: 100, sortable: true, filter: "agTextColumnFilter", editable: true, hide: true },
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
            { field: "contact_phone", headerName: "Contact Phone", width: 150, sortable: true, filter: "agTextColumnFilter", editable: true, hide: true },
            { field: "contact_linkedin", headerName: "Contact LinkedIn", width: 220, sortable: true, filter: "agTextColumnFilter", editable: true, cellRenderer: LinkCellRenderer },
            { field: "job_url", headerName: "Job URL", width: 250, sortable: true, filter: "agTextColumnFilter", editable: true, cellRenderer: LinkCellRenderer },
            { field: "normalized_title", headerName: "Normalized Title", width: 200, sortable: true, filter: "agTextColumnFilter", editable: true, hide: true },
            { field: "company_id", headerName: "Company ID", width: 130, sortable: true, filter: "agNumberColumnFilter", editable: true, hide: true },
            { field: "confidence_score", headerName: "Conf. Score", width: 130, sortable: true, filter: "agNumberColumnFilter", editable: true, hide: true },
            // { field: "created_at", headerName: "Created At", width: 160, sortable: true, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "", hide: true },
            { field: "notes", headerName: "Notes", width: 300, sortable: true, filter: "agTextColumnFilter", editable: true, hide: true },
        ],
        [selectedStatuses, selectedTypes, selectedModes, selectedSources]
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Positions</h1>
                    <p className="text-muted-foreground">Manage job positions and their details.</p>
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
                        placeholder="Search by title, company, location..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <AGGridTable
                rowData={filteredPositions}
                columnDefs={columnDefs}
                loading={loading}
                onRowUpdated={handleRowUpdated}
                onRowDeleted={handleRowDeleted}
                onRowAdded={handleRowAdded}
                title="Job Positions"
                showAddButton={true}
            />
        </div>
    );
}
