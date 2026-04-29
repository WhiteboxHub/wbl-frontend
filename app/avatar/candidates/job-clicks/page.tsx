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
    id: number | string;
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
    candidateCount?: number;
    jobCount?: number;
    lastActive?: string;
    dateKey?: string;
    hideCandidateDetails?: boolean;
    candidateDayJobCount?: number;
    candidateCompanies?: string[];
    isCandidateGroup?: boolean;
    candidateGroupKey?: string;
    candidateEmail?: string;
    parentDateKey?: string;
}

export default function JobClickTrackingPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rawClicks, setRawClicks] = useState<ClickRecord[]>([]);
    const [gridRows, setGridRows] = useState<ClickRecord[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [expandedCandidateGroups, setExpandedCandidateGroups] = useState<Set<string>>(new Set());
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

        // Group by Day (using last_clicked_at)
        const groups: Record<string, ClickRecord[]> = {};
        
        filteredRaw.forEach(click => {
            let dateStr = click.last_clicked_at;
            let dateKey = "Unknown Date";
            
            if (dateStr) {
                // Force UTC if the string lacks a timezone indicator (e.g. from DB)
                if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
                    dateStr = dateStr.replace(' ', 'T') + 'Z';
                }
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    // Group by the localized date string to ensure days match the visual output
                    dateKey = date.toLocaleDateString("en-US", {
                        timeZone: "America/Los_Angeles",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                    });
                }
            }

            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(click);
        });

        const newGridRows: ClickRecord[] = [];

        // Sort groups by date descending
        const sortedDates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        sortedDates.forEach(dateKey => {
            const children = groups[dateKey];
            const total = children.reduce((sum, item) => sum + Number(item.click_count || 0), 0);
            const candidateCount = new Set(
                children.map(({ full_name, email }) => `${full_name || ""}::${email || ""}`.toLowerCase())
            ).size;
            const isExpanded = expandedGroups.has(dateKey) || searchTerm.length > 0;

            // Group Row
            newGridRows.push({
                id: `group-${dateKey}`,
                dateKey: dateKey,
                isGroup: true,
                isExpanded: isExpanded,
                totalClicks: total,
                candidateCount,
                jobCount: children.length,
                click_count: total,
                job_title: `${children.length} Records`,
                // Fill required fields with defaults for the group row
                email: "",
                full_name: dateKey, 
                company_name: "",
                last_clicked_at: children[0]?.last_clicked_at || "", 
                job_listing_id: 0,
                first_clicked_at: ""
            } as any);

            // Child Rows
            if (isExpanded) {
                const sortedChildren = [...children].sort((a, b) => {
                    const candidateA = `${a.full_name || ""} ${a.email || ""}`.toLowerCase();
                    const candidateB = `${b.full_name || ""} ${b.email || ""}`.toLowerCase();

                    if (candidateA !== candidateB) {
                        return candidateA.localeCompare(candidateB);
                    }

                    return new Date(b.last_clicked_at).getTime() - new Date(a.last_clicked_at).getTime();
                });

                let candidateJobCountMap: Record<string, number> = {};
                let candidateCompanyMap: Record<string, string[]> = {};
                let candidateRowsMap: Record<string, ClickRecord[]> = {};

                sortedChildren.forEach(child => {
                    const candidateKey = `${child.full_name || ""}::${child.email || ""}`.toLowerCase();

                    candidateJobCountMap[candidateKey] = (candidateJobCountMap[candidateKey] || 0) + 1;

                    if (!candidateCompanyMap[candidateKey]) {
                        candidateCompanyMap[candidateKey] = [];
                    }

                    if (child.company_name && !candidateCompanyMap[candidateKey].includes(child.company_name)) {
                        candidateCompanyMap[candidateKey].push(child.company_name);
                    }

                    if (!candidateRowsMap[candidateKey]) {
                        candidateRowsMap[candidateKey] = [];
                    }

                    candidateRowsMap[candidateKey].push(child);
                });

                Object.entries(candidateRowsMap).forEach(([candidateKey, candidateRows]) => {
                    const firstRow = candidateRows[0];
                    const candidateGroupKey = `${dateKey}::${candidateKey}`;
                    const candidateJobCount = candidateJobCountMap[candidateKey] || 1;
                    const hasMultipleJobs = candidateJobCount > 1;
                    const isCandidateExpanded = expandedCandidateGroups.has(candidateGroupKey) || searchTerm.length > 0;

                    newGridRows.push({
                        ...firstRow,
                        id: `candidate-${candidateGroupKey}`,
                        isGroup: false,
                        isCandidateGroup: hasMultipleJobs,
                        isExpanded: hasMultipleJobs ? isCandidateExpanded : true,
                        candidateGroupKey,
                        parentDateKey: dateKey,
                        candidateDayJobCount: candidateJobCount,
                        candidateCompanies: candidateCompanyMap[candidateKey] || [],
                        candidateEmail: firstRow.email,
                    });

                    if (hasMultipleJobs && isCandidateExpanded) {
                        const jobRows = [...candidateRows].sort(
                            (a, b) => new Date(b.last_clicked_at).getTime() - new Date(a.last_clicked_at).getTime()
                        );

                        jobRows.forEach(child => {
                            newGridRows.push({
                                ...child,
                                isGroup: false,
                                isCandidateGroup: false,
                                hideCandidateDetails: true,
                                candidateGroupKey,
                                parentDateKey: dateKey,
                                candidateDayJobCount: candidateJobCount,
                                candidateCompanies: candidateCompanyMap[candidateKey] || [],
                            });
                        });
                    }
                });
            }
        });

        setGridRows(newGridRows);

    }, [rawClicks, expandedGroups, expandedCandidateGroups, searchTerm]);

    const toggleGroup = useCallback((dateKey: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(dateKey)) {
                next.delete(dateKey);
                setExpandedCandidateGroups(candidatePrev => {
                    const candidateNext = new Set(candidatePrev);
                    Array.from(candidateNext).forEach((candidateKey) => {
                        if (candidateKey.startsWith(`${dateKey}::`)) {
                            candidateNext.delete(candidateKey);
                        }
                    });
                    return candidateNext;
                });
            } else {
                next.add(dateKey);
            }
            return next;
        });
    }, []);

    const toggleCandidateGroup = useCallback((candidateGroupKey: string) => {
        setExpandedCandidateGroups(prev => {
            const next = new Set(prev);
            if (next.has(candidateGroupKey)) next.delete(candidateGroupKey);
            else next.add(candidateGroupKey);
            return next;
        });
    }, []);

    const closeWholeDateFromCandidate = useCallback((dateKey: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            next.delete(dateKey);
            return next;
        });

        setExpandedCandidateGroups(prev => {
            const next = new Set(prev);
            Array.from(next).forEach((candidateKey) => {
                if (candidateKey.startsWith(`${dateKey}::`)) {
                    next.delete(candidateKey);
                }
            });
            return next;
        });
    }, []);

    const handleRowDeleted = async (id: string | number) => {
        try {
            if (typeof id === 'string' && id.startsWith('group-')) {
                toast.error("Cannot delete a date group directly");
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

    const GroupCellRenderer = (params: any) => {
        const { data } = params;
        if (!data) return null;

        if (data.isGroup) {
            // Format the group header date nicely
            let formattedDate = data.dateKey;
            const d = new Date(data.dateKey);
            if (!isNaN(d.getTime())) {
                formattedDate = d.toLocaleDateString("en-US", {
                    weekday: 'long',
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                });
            }

            return (
                <div
                    className="flex items-center cursor-pointer font-medium text-gray-900 dark:text-gray-100 h-full"
                    onClick={() => toggleGroup(data.dateKey)}
                >
                    {data.isExpanded || searchTerm ? (
                        <ChevronDown className="w-4 h-4 mr-2 text-gray-400" />
                    ) : (
                        <ChevronRight className="w-4 h-4 mr-2 text-gray-400" />
                    )}
                    <div className="flex flex-col leading-tight mt-1">
                        <span className="text-sm font-semibold">{formattedDate}</span>
                        <span className="text-xs text-gray-500 font-normal">
                            {data.candidateCount} {data.candidateCount === 1 ? "Candidate Interaction" : "Candidate Interactions"}
                        </span>
                    </div>
                </div>
            );
        } else {
            const candidateCompanies: string[] = (data.candidateCompanies && data.candidateCompanies.length > 0)
                ? data.candidateCompanies
                : (data.company_name ? [data.company_name] : []);
            const companyPreview = candidateCompanies.slice(0, 2).join(", ");
            const remainingCompanies = candidateCompanies.length - 2;

            if (data.isCandidateGroup) {
                return (
                    <div className="pl-6 py-2">
                        <div
                            className="cursor-pointer rounded-md border border-gray-200 bg-gray-50 px-3 py-3 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800"
                            onClick={() => {
                                if (data.isExpanded && data.parentDateKey) {
                                    closeWholeDateFromCandidate(data.parentDateKey);
                                    return;
                                }

                                toggleCandidateGroup(data.candidateGroupKey);
                            }}
                        >
                            <div className="flex items-start gap-3">
                                {data.isExpanded || searchTerm ? (
                                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                ) : (
                                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                )}

                                <div className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold leading-5 text-gray-900 dark:text-gray-100">
                                        {data.full_name || "Unknown Candidate"}
                                    </span>
                                    <span className="mt-1 block break-words text-xs font-medium text-gray-600 dark:text-gray-300">
                                        {data.email || "No email"}
                                    </span>

                                    {candidateCompanies.length > 0 && (
                                        <div className="mt-2 rounded-sm bg-white/80 px-2 py-1.5 text-xs text-gray-600 dark:bg-gray-900/70 dark:text-gray-300">
                                            <span className="mr-1 font-semibold text-gray-500 dark:text-gray-400">
                                                {candidateCompanies.length === 1 ? "Company:" : "Companies:"}
                                            </span>
                                            <span className="break-words">
                                                {companyPreview}
                                                {remainingCompanies > 0 ? ` +${remainingCompanies} more` : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            if (data.hideCandidateDetails) {
                return (
                    <div className="pl-6 py-2">
                        <div
                            className="cursor-pointer rounded-md border border-gray-200/80 bg-gray-50/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/40"
                            onClick={() => {
                                if (data.parentDateKey) {
                                    closeWholeDateFromCandidate(data.parentDateKey);
                                }
                            }}
                        >
                            <span className="block text-sm font-medium leading-5 text-gray-900 dark:text-gray-100">
                                {data.full_name || "Unknown Candidate"}
                            </span>
                            <div className="mt-1 flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300">
                                <span className="break-words">{data.email || "No email"}</span>
                                {data.company_name && (
                                    <span className="break-words">
                                        <span className="font-semibold text-gray-500 dark:text-gray-400">Company:</span>{" "}
                                        {data.company_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div className="pl-6 py-2">
                    <div
                        className="cursor-pointer rounded-md border border-gray-200 bg-gray-50 px-3 py-3 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800"
                        onClick={() => {
                            if (data.parentDateKey) {
                                closeWholeDateFromCandidate(data.parentDateKey);
                            }
                        }}
                    >
                        <div className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold leading-5 text-gray-900 dark:text-gray-100">
                                {data.full_name || "Unknown Candidate"}
                            </span>
                            <span className="mt-1 block break-words text-xs font-medium text-gray-600 dark:text-gray-300">
                                {data.email || "No email"}
                            </span>
                        </div>

                        {candidateCompanies.length > 0 && (
                            <div className="mt-2 rounded-sm bg-white/80 px-2 py-1.5 text-xs text-gray-600 dark:bg-gray-900/70 dark:text-gray-300">
                                <span className="mr-1 font-semibold text-gray-500 dark:text-gray-400">
                                    {candidateCompanies.length === 1 ? "Company:" : "Companies:"}
                                </span>
                                <span className="break-words">
                                    {companyPreview}
                                    {remainingCompanies > 0 ? ` +${remainingCompanies} more` : ""}
                                </span>
                            </div>
                        )}

                    </div>
                </div>
            );
        }
    };

    const JobTitleRenderer = (params: any) => {
        if (params.data.isGroup || params.data.isCandidateGroup) {
            return <span className="text-sm text-gray-400 italic">Expand for details</span>;
        }
        return <span className="text-sm text-gray-700 dark:text-gray-300">{params.value}</span>;
    };

    const ActivityRenderer = (params: any) => {
        if (params.data.isGroup) {
            return <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{params.data.totalClicks} total clicks</span>;
        }

        if (params.data.isCandidateGroup) {
            const jobCount = params.data.candidateDayJobCount || 1;
            return (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {jobCount} {jobCount === 1 ? "job" : "jobs"} that day
                </span>
            );
        }

        return <span className="text-sm text-gray-800 dark:text-gray-200">{params.value}</span>;
    };

    const DateRenderer = (params: any) => {
        if (params.data.isGroup || params.data.isCandidateGroup) return null; // Hide exact time for summary rows
        
        let dateStr = params.value;
        if (!dateStr) return null;
        
        // Force UTC if the string lacks a timezone indicator (e.g. from DB)
        if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
            dateStr = dateStr.replace(' ', 'T') + 'Z';
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return <span className="text-sm">{params.value}</span>;

        const timeFormatted = date.toLocaleTimeString("en-US", {
            timeZone: "America/Los_Angeles",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });

        return (
            <div className="flex items-center h-full">
                <span className="text-sm text-gray-500">{timeFormatted}</span>
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
                    
                    const payload = res?.data || res;
                    const pageData = payload?.data || [];
                    const has_next_page = payload?.has_next || false;

                    allData = [...allData, ...pageData];

                    hasNext = has_next_page;
                    currentPage++;

                    if (currentPage > 100) break;
                }

                setRawClicks(allData);

                setColumnDefs([
                    {
                        headerName: "Date / Candidate Details",
                        field: "full_name",
                        width: 400,
                        editable: false,
                        cellRenderer: GroupCellRenderer,
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
                        headerName: "Time Clicked",
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
                        Job Listings Tracking
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
                    --ag-row-height: 96px !important;
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
