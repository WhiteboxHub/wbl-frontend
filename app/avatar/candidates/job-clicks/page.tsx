"use client";

import Link from "next/link";
import "@/styles/admin.css";
import "@/styles/App.css";

import { AGGridTable } from "@/components/AGGridTable";
import { Input } from "@/components/admin_ui/input";
import { SearchIcon, ChevronRight, ChevronDown } from "lucide-react";
import { ColDef } from "ag-grid-community";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";
import { cachedApiFetch, invalidateCache } from "@/lib/apiCache";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

interface ClickRecord {
    id: number;
    job_listing_id: number;
    full_name: string | null;
    email: string;
    job_title: string;
    company_name: string;
    click_count: number;
    first_clicked_at: string;
    last_clicked_at: string;
    isGroup?: boolean;
    isExpanded?: boolean;
    totalClicks?: number;
    jobCount?: number;
    lastActive?: string;
}

export default function JobClickTrackingPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rawClicks, setRawClicks] = useState<ClickRecord[]>([]);
    const [gridRows, setGridRows] = useState<ClickRecord[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const showLoader = useMinimumLoadingTime(loading);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

    useEffect(() => {
        if (!rawClicks.length) {
            setGridRows([]);
            return;
        }

        const lowerSearch = searchTerm.toLowerCase();
        const filteredRaw = rawClicks.filter(c => {
            if (!searchTerm) return true;
            return Object.values(c).some(v => String(v).toLowerCase().includes(lowerSearch));
        });

        // Group by Candidate Email
        const groups: Record<string, ClickRecord[]> = {};
        filteredRaw.forEach(click => {
            const email = click.email || "Unknown";
            if (!groups[email]) groups[email] = [];
            groups[email].push(click);
        });

        const newGridRows: ClickRecord[] = [];

        Object.entries(groups).forEach(([email, children]) => {
            const total = children.reduce((sum, item) => sum + Number(item.click_count || 0), 0);
            const isExpanded = expandedGroups.has(email) || searchTerm.length > 0;
            const fullName = children[0].full_name || "Unknown Candidate";

            // Find last active date
            const lastActive = children
                .map(c => c.last_clicked_at)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

            newGridRows.push({
                id: `group-${email}`,
                email: email,
                full_name: fullName,
                isGroup: true,
                isExpanded: isExpanded,
                totalClicks: total,
                jobCount: children.length,
                lastActive: lastActive,
                click_count: total,
                job_title: `${children.length} Jobs Tracked`,
                company_name: "",
                last_clicked_at: lastActive,
                job_listing_id: 0,
                first_clicked_at: ""
            } as any);

            if (isExpanded) {
                children.forEach(child => {
                    newGridRows.push({
                        ...child,
                        isGroup: false,
                    });
                });
            }
        });

        setGridRows(newGridRows);

    }, [rawClicks, expandedGroups, searchTerm]);

    const toggleGroup = useCallback((email: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(email)) next.delete(email);
            else next.add(email);
            return next;
        });
    }, []);

    const handleRowDeleted = async (id: string | number) => {
        try {
            if (typeof id === 'string' && id.startsWith('group-')) {
                toast.error("Cannot delete a candidate group directly");
                return;
            }
            await api.delete(`/candidates/click-analytics/${id}`);
            await invalidateCache("/candidates/click-analytics");
            setRawClicks((prev) => prev.filter((row) => row.id !== id));
            toast.success("Click record deleted successfully");
        } catch (error: any) {
            console.error("Error deleting click record:", error);
            toast.error("Failed to delete click record");
        }
    };

    const CandidateRenderer = (params: any) => {
        const { data } = params;
        if (!data) return null;

        if (data.isGroup) {
            return (
                <div
                    className="flex items-center cursor-pointer font-medium text-gray-900 dark:text-gray-100 h-full"
                    onClick={() => toggleGroup(data.email)}
                >
                    {data.isExpanded || searchTerm ? (
                        <ChevronDown className="w-4 h-4 mr-2 text-gray-400" />
                    ) : (
                        <ChevronRight className="w-4 h-4 mr-2 text-gray-400" />
                    )}
                    <div className="flex flex-col leading-tight mt-1">
                        <span className="text-sm">{data.full_name}</span>
                        <span className="text-xs text-gray-500 font-normal">{data.email}</span>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="pl-6 text-sm text-gray-600 dark:text-gray-400">
                    ↳ {data.company_name || <span className="text-gray-400">N/A</span>}
                </div>
            );
        }
    };

    const JobTitleRenderer = (params: any) => {
        if (params.data.isGroup) return <span className="text-sm text-gray-400 italic">Expand for details</span>;
        return <span className="text-sm text-gray-700 dark:text-gray-300">{params.value}</span>;
    };

    const ActivityRenderer = (params: any) => {
        if (params.data.isGroup) {
            return <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{params.data.totalClicks} clicks</span>;
        }
        return <span className="text-sm text-gray-800 dark:text-gray-200">{params.value}</span>;
    };

    const DateRenderer = (params: any) => {
        const dateStr = params.value;
        if (!dateStr) return null;
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return <span className="text-sm">{dateStr}</span>;

        const dateFormatted = date.toLocaleDateString("en-US", {
            timeZone: "America/Los_Angeles",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
        
        const timeFormatted = date.toLocaleTimeString("en-US", {
            timeZone: "America/Los_Angeles",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });

        return (
            <div className={`flex flex-col leading-tight mt-1 ${params.data.isGroup ? 'font-medium' : 'text-sm text-gray-500'}`}>
                <span className="text-sm">{dateFormatted}</span>
                <span className="text-xs text-gray-400">{timeFormatted}</span>
            </div>
        );
    };

    useEffect(() => {
        const fetchClicks = async () => {
            setLoading(true);
            try {
                const pageSize = 5000;
                let allData: any[] = [];
                let currentPage = 1;
                let hasNext = true;

                while (hasNext) {
                    const res: any = await cachedApiFetch(`/candidates/click-analytics/paginated?page=${currentPage}&page_size=${pageSize}`);
                    
                    // The backend either wraps in .data or responds cleanly with the dict. 
                    // Let's safely extract it:
                    const payload = res?.data || res;
                    const pageData = payload?.data || [];
                    const has_next_page = payload?.has_next || false;

                    allData = [...allData, ...pageData];

                    hasNext = has_next_page;
                    currentPage++;

                    // Safety exit
                    if (currentPage > 100) break;
                }

                setRawClicks(allData);

                setColumnDefs([
                    {
                        headerName: "Candidate / Company",
                        field: "full_name",
                        width: 450,
                        editable: false,
                        cellRenderer: CandidateRenderer,
                        pinned: 'left'
                    },
                    {
                        headerName: "Job Title",
                        field: "job_title",
                        width: 466,
                        editable: false,
                        cellRenderer: JobTitleRenderer
                    },
                    {
                        headerName: "Activity",
                        field: "click_count",
                        width: 200,
                        editable: false,
                        cellRenderer: ActivityRenderer
                    },
                    {
                        headerName: "Last Clicked",
                        field: "last_clicked_at",
                        width: 200,
                        editable: false,
                        cellRenderer: DateRenderer
                    }
                ]);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load click analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchClicks();
    }, []);

    // Summary Stats
    const stats = useMemo(() => [
        { label: "Active Candidates", value: new Set(rawClicks.map(c => c.email)).size },
        { label: "Unique Jobs", value: new Set(rawClicks.map(c => c.job_listing_id)).size },
        { label: "Total Clicks", value: rawClicks.reduce((s, c) => s + c.click_count, 0) },
        { label: "Sync Status", value: "Live" },
    ], [rawClicks]);

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                        Activity Tracking
                    </h1>
                </div>

                <div className="w-full md:w-80">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Main Table */}
            <div className="w-full">
                <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {showLoader ? (
                        <div className="h-[500px] flex items-center justify-center">
                            <Loader />
                        </div>
                    ) : (
                        <AGGridTable
                            rowData={gridRows}
                            columnDefs={columnDefs}
                            height="calc(100vh - 300px)"
                            showSearch={false}
                            onRowDeleted={handleRowDeleted}
                        />
                    )}
                </div>
            </div>

            <style jsx global>{`
                .ag-theme-alpine {
                    --ag-header-background-color: #f9fafb !important;
                    --ag-header-height: 48px !important;
                    --ag-row-height: 48px !important;
                    --ag-font-size: 14px !important;
                    --ag-border-color: #e5e7eb !important;
                }
                .dark .ag-theme-alpine {
                    --ag-header-background-color: #111827 !important;
                    --ag-border-color: #1f2937 !important;
                }
                .ag-row-group {
                    background-color: #f9fafb !important;
                }
                .dark .ag-row-group {
                    background-color: #111827 !important;
                }
                .ag-header-cell-label {
                    font-weight: 600 !important;
                    color: #4b5563 !important;
                }
            `}</style>
        </div>
    );
}