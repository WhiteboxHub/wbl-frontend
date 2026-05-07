"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import {
    Mail,
    Phone,
    Calendar,
    Award,
    TrendingUp,
    Filter,
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    Briefcase,
    Target,
    Activity,
    BarChart3,
    Home,
    PlayCircle,
    Search,
    ExternalLink,
    MessageSquare,
    Video,
    Check,
    ChevronRight,
    LogOut,
    Settings,
    LayoutDashboard,
    Puzzle,
    Sparkles,
} from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/admin_ui/dropdown-menu";
import { apiFetch, API_BASE_URL, setupApi } from "@/lib/api";
import { useAuth } from "@/utils/AuthContext";
import CandidateGrid from "./CandidateGrid";
import { ColDef, ValueFormatterParams } from "ag-grid-community";

interface DashboardData {
    basic_info: {
        id: number;
        full_name: string;
        email: string;
        phone: string;
        status: string;
        enrolled_date: string;
        batch_name: string;
        login_count: number;
    };
    journey: {
        enrolled: { completed: boolean; date: string; days_since: number };
        preparation: { completed: boolean; active: boolean; start_date: string; duration_days: number };
        marketing: { completed: boolean; active: boolean; start_date: string; duration_days: number };
        placement: { completed: boolean; active: boolean; company: string; position: string; date?: string };
    };
    phase_metrics: {
        enrolled: { date: string; batch_name: string; status: string };
        preparation?: { status: string; rating: string; communication: string; duration_days: number };
        marketing?: { total_interviews: number; positive_interviews: number; success_rate: number; duration_days: number };
        placement?: { company: string; position: string; base_salary: number; placement_date?: string };
    };
    team_info: {
        preparation: { instructors: Array<{ name: string; email: string; role: string }> };
        marketing: { manager?: { name: string; email: string } };
    };
    interview_stats: {
        total: number;
        positive: number;
        pending: number;
        negative: number;
        success_rate: number;
    };
    interviews: Array<{
        id: number;
        company: string;
        interview_date: string;
        type_of_interview: string;
        feedback: string;
        source_job_id?: string;
    }>;
    alerts: Array<{ type: string; phase: string; message: string }>;
}

interface UserProfile {
    uname: string;
    full_name: string;
    phone: string;
    login_count: number;
    last_login?: string;
    candidate_id?: number;
}

interface Session {
    sessionid: number;
    title: string;
    sessiondate: string;
    link?: string;
    videoid?: string;
    type: string;
    subject: string;
}

interface ApiError {
    message?: string;
    detail?: string;
    body?: {
        detail?: string;
        message?: string;
    };
    status?: number;
}

type TabType = 'overview' | 'sessions' | 'interviews' | 'jobs';

const extractErrorMessage = (err: ApiError, defaultMessage: string): string => {
    return err.body?.detail || err.body?.message || err.detail || err.message || defaultMessage;
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
                            className={`${colorMap[color]} min-w-[20px] rounded-full px-2 py-0.5 text-center text-[10px] text-white`}
                            style={{ marginRight: "4px" }}
                        >
                            {selectedItems.length}
                        </span>
                    )}
                    <Filter className="h-3.5 w-3.5" style={{ color: selectedItems.length > 0 ? "#3b82f6" : "#9ca3af" }} />
                </div>
            </div>

            {filterVisible &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="filter-dropdown pointer-events-auto fixed flex w-40 flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                        style={{
                            top: dropdownPos.top + 8,
                            left: dropdownPos.left,
                            zIndex: 9999,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="max-h-[300px] overflow-y-auto p-1.5">
                            {options.map((option) => {
                                const value = getOptionValue(option);
                                const isSelected = selectedItems.some((i) => getOptionValue(i) === value);
                                return (
                                    <div
                                        key={value}
                                        onClick={() => handleItemChange(option)}
                                        className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${isSelected
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <span>{renderOption(option)}</span>
                                        {isSelected && <Check className="h-4 w-4" />}
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

const StatusRenderer = ({ value }: { value?: string }) => {
    const status = value?.toLowerCase() || "";
    const variantMap: Record<string, string> = {
        open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
        closed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
        on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        duplicate: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
        invalid: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
        default: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    };
    const formatted = (value || "")
        .toString()
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

    return (
        <div className="flex items-center h-full">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${variantMap[status] || variantMap.default}`}>
                {formatted || "N/A"}
            </span>
        </div>
    );
};

export default function CandidateDashboard() {
    const router = useRouter();
    const { userRole } = useAuth() as { userRole: string };

    // --- CLICK TRACKING LOGIC (SW EDITION) ---
    const handleJobClick = async (jobListingId: number, url: string) => {
        // 1. Save to local IndexedDB instantly (main thread)
        const { trackLocalClick } = await import('@/utils/clickTracker');
        await trackLocalClick(jobListingId);

        // 2. Notify Service Worker (runs in background)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'TRACK_CLICK',
                id: jobListingId
            });
        }

        // 3. Open link
        window.open(url, '_blank');
    };

    // Register SW and handle lifecycle
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/api/sw.js', { scope: '/' })
                .then(registration => {
                    console.log('✅ Click Tracking SW Registered');
                    setSwStatus("active");

                    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
                    const config = { token, url: API_BASE_URL };

                    // Function to send config to a specific worker
                    const sendConfig = (worker: ServiceWorker | null) => {
                        if (!worker) return;
                        worker.postMessage({ type: 'SET_API_URL', url: config.url });
                        if (config.token) worker.postMessage({ type: 'SET_TOKEN', token: config.token });
                    };

                    // Send to whichever worker is available
                    sendConfig(registration.active);
                    sendConfig(registration.waiting);
                    sendConfig(registration.installing);
                })
                .catch(err => console.error('SW Registration failed:', err));

            // Sync token if it changes or when SW becomes active
            navigator.serviceWorker.oncontrollerchange = () => {
                const token = localStorage.getItem("access_token") || localStorage.getItem("token");
                if (navigator.serviceWorker.controller) {
                    console.log('🔄 SW Control changed, sending config...');
                    navigator.serviceWorker.controller.postMessage({ type: 'SET_API_URL', url: API_BASE_URL });
                    if (token) navigator.serviceWorker.controller.postMessage({ type: 'SET_TOKEN', token });
                }
            };

            // Periodic config sync
            const intervalToken = setInterval(() => {
                const token =
                    localStorage.getItem("access_token") ||
                    localStorage.getItem("token") ||
                    localStorage.getItem("auth_token") ||
                    localStorage.getItem("bearer_token");

                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'SET_API_URL', url: API_BASE_URL });
                    if (token) navigator.serviceWorker.controller.postMessage({ type: 'SET_TOKEN', token });
                }
            }, 30000); // every 30s

            return () => clearInterval(intervalToken);
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && navigator.serviceWorker.controller) {
                console.log(' Dashboard visible (tab focused), evaluating sync...');
                navigator.serviceWorker.controller.postMessage({ type: 'FLUSH' });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Every time dashboard loads or rerenders
    useEffect(() => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'FLUSH' });
        }
    }, []);
    // ----------------------------

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [candidateId, setCandidateId] = useState<number | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('jobs');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Sessions state
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);


    // Jobs state
    const [positions, setPositions] = useState<any[]>([]);
    const [filteredPositions, setFilteredPositions] = useState<any[]>([]);
    const [positionsLoading, setPositionsLoading] = useState(false);
    const [selectedModes, setSelectedModes] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [jobSearchTerm, setJobSearchTerm] = useState("");
    const [swStatus, setSwStatus] = useState<string>("initializing");
    const [setupStatus, setSetupStatus] = useState<{ resume_uploaded: boolean; api_keys_configured: boolean; setup_complete: boolean } | null>(null);

    useEffect(() => {
        setupApi.getStatus()
            .then((d: any) => setSetupStatus(d))
            .catch(() => setSetupStatus(null));
    }, []);

    const statusOptions = ['open', 'closed', 'on_hold', 'duplicate', 'invalid'];
    const typeOptions = ['full_time', 'contract', 'contract_to_hire', 'internship'];
    const modeOptions = ['All', 'Onsite', 'Hybrid', 'Remote'];
    const interviewColumnDefs: ColDef[] = useMemo(() => [
        {
            field: "company",
            headerName: "Company",
            flex: 2,
            minWidth: 200,
            pinned: 'left',
            cellRenderer: (params: any) => (
                <div className="flex items-center h-full">
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-[13px]">{params.value}</span>
                </div>
            )
        },
        {
            field: "type_of_interview",
            headerName: "Interview Round",
            flex: 1.5,
            minWidth: 160,
            cellRenderer: (params: any) => (
                <div className="flex items-center h-full gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        <Target className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{params.value || "Technical Round"}</span>
                </div>
            )
        },
        {
            field: "interview_date",
            headerName: "Schedule",
            flex: 1.5,
            minWidth: 160,
            cellRenderer: (params: any) => (
                <div className="flex items-center h-full gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {params.value ? format(parseISO(params.value), 'MMM dd, yyyy') : "TBD"}
                    </span>
                </div>
            )
        },
        {
            field: "mode_of_interview",
            headerName: "Mode",
            flex: 1,
            minWidth: 130,
            cellRenderer: (params: any) => (
                <div className="flex items-center h-full gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        <Video className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{params.value || "Virtual"}</span>
                </div>
            )
        },
        {
            field: "feedback",
            headerName: "Feedback",
            flex: 1,
            minWidth: 130,
            cellRenderer: (params: any) => {
            const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const newVal = e.target.value;
                    try {
                        await apiFetch(`/api/candidates/interviews/${params.data.id}/feedback?feedback=${newVal}`, {
                            method: "PATCH"
                        });
                        params.data.feedback = newVal;
                        params.api.refreshCells({ rowNodes: [params.node], force: true });
                    } catch (err) {
                        console.error("Failed to update feedback", err);
                    }
                };


                return (
                    <div className="flex items-center h-full gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <select
                            defaultValue={params.value || "Pending"}
                            onChange={handleChange}
                            className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Positive">Positive</option>
                            <option value="Negative">Negative</option>
                        </select>
                    </div>
                );
            }
        }
    ], [candidateId]);

    const jobColumnDefs: ColDef[] = useMemo(() => [
        { field: "id", headerName: "ID", width: 80, sortable: true, filter: "agNumberColumnFilter" },
        {
            field: "title",
            headerName: "Title",
            flex: 2,
            minWidth: 200,
            sortable: true,
            filter: "agTextColumnFilter",
            cellRenderer: (params: any) => {
                const jobId = params.data.source_job_id || params.data.source_uid;
                const source = params.data.source?.toLowerCase() || "";
                const url = params.data.job_url ||
                    (source.includes('trueup')
                        ? `https://trueup.io/jobs/${jobId}`
                        : source.includes('hiring') || source.includes('cafe')
                            ? `https://hiring.cafe/viewjob/${jobId}`
                            : source.includes('jobright')
                                ? `https://jobright.ai/jobs/info/${jobId}`
                                : `https://www.linkedin.com/jobs/view/${jobId}`);

                if (!url) {
                    return (
                        <div className="flex items-center h-full">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{params.value}</span>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center h-full">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                                e.preventDefault();
                                handleJobClick(params.data.id, url);
                            }}
                            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline decoration-blue-400 group flex items-center gap-1.5"
                        >
                            <span>{params.value}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    </div>
                );
            }
        },
        {
            field: "employment_mode",
            headerName: "Mode",
            width: 130,
            sortable: true,
            filter: false,
            headerComponent: FilterHeaderComponent,
            headerComponentParams: {
                selectedItems: selectedModes,
                setSelectedItems: (val: any) => {
                    const arr = typeof val === 'function' ? val(selectedModes) : val;
                    setSelectedModes(arr.includes('All') ? [] : arr);
                },
                options: modeOptions,
                label: "Mode",
                displayName: "Mode",
                color: "purple",
                renderOption: (opt: string) => opt
            },
            cellRenderer: (params: any) => {
                if (!params.value) return <span className="text-gray-400">-</span>;
                const mode = params.value.toLowerCase();
                const config: any = {
                    remote: {
                        bg: "bg-green-50 dark:bg-green-900/20",
                        text: "text-green-700 dark:text-green-400",
                        border: "border-green-100 dark:border-green-800/50",
                        dot: "bg-green-500"
                    },
                    hybrid: {
                        bg: "bg-blue-50 dark:bg-blue-900/20",
                        text: "text-blue-700 dark:text-blue-400",
                        border: "border-blue-100 dark:border-blue-800/50",
                        dot: "bg-blue-500"
                    },
                    onsite: {
                        bg: "bg-orange-50 dark:bg-orange-900/20",
                        text: "text-orange-700 dark:text-orange-400",
                        border: "border-orange-100 dark:border-orange-800/50",
                        dot: "bg-orange-500"
                    }
                };
                const style = config[mode] || {
                    bg: "bg-gray-50 dark:bg-gray-800",
                    text: "text-gray-600 dark:text-gray-400",
                    border: "border-gray-100 dark:border-gray-700",
                    dot: "bg-gray-400"
                };

                const formattedValue = params.value.charAt(0).toUpperCase() + params.value.slice(1).toLowerCase();

                return (
                    <div className="flex items-center h-full">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${style.bg} ${style.text} ${style.border}`}>
                            {formattedValue}
                        </span>
                    </div>
                );
            }
        },
        { field: "company_name", headerName: "Company", flex: 1.5, minWidth: 150, sortable: true, filter: "agTextColumnFilter" },
        {
            field: "position_type",
            headerName: "Type",
            width: 140,
            sortable: true,
            filter: false,
            headerComponent: FilterHeaderComponent,
            headerComponentParams: {
                selectedItems: selectedTypes,
                setSelectedItems: setSelectedTypes,
                options: typeOptions,
                label: "Type",
                displayName: "Type",
                color: "blue",
                renderOption: (opt: string) => opt.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            },
            valueFormatter: (params) => params.value ? params.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : "",
        },
        {
            field: "job_url_type",
            headerName: "Job URL Type",
            width: 130,
            sortable: true,
            filter: "agTextColumnFilter"
        },
        {
            headerName: "Location",
            flex: 1.5,
            minWidth: 150,
            sortable: true,
            filter: "agTextColumnFilter",
            valueGetter: (params: any) => {
                const city = params.data.city;
                const loc = params.data.location;
                if (city && loc) {
                    if (loc.toLowerCase().includes(city.toLowerCase())) return loc;
                    return `${city}, ${loc}`;
                }
                return city || loc || "";
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
        {
            headerName: "Apply",
            width: 100,
            cellRenderer: (params: any) => {
                const jobId = params.data.source_job_id || params.data.source_uid;
                if (!jobId && !params.data.job_url) return <span className="text-gray-400">-</span>;

                const source = params.data.source?.toLowerCase() || "";
                const url = params.data.job_url ||
                    (source.includes('trueup')
                        ? `https://trueup.io/jobs/${jobId}`
                        : source.includes('hiring') || source.includes('cafe')
                            ? `https://hiring.cafe/viewjob/${jobId}`
                            : source.includes('jobright')
                                ? `https://jobright.ai/jobs/info/${jobId}`
                                : `https://www.linkedin.com/jobs/view/${jobId}`);

                return (
                    <div className="flex items-center h-full">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                                e.preventDefault();
                                handleJobClick(params.data.id, url);
                            }}
                            className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs"
                        >
                            <span>Apply</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                );
            }
        },
    ], [selectedModes, selectedStatuses, selectedTypes]);

    useEffect(() => {
        let filtered = [...positions];

        // Apply Mode Filter — empty means 'All'
        if (selectedModes.length > 0 && !selectedModes.includes('All')) {
            filtered = filtered.filter(p =>
                p.employment_mode && selectedModes.some(m => p.employment_mode.toLowerCase() === m.toLowerCase())
            );
        }

        // Apply Status Filter
        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(p =>
                p.status && selectedStatuses.some(s => p.status.toLowerCase() === s.toLowerCase())
            );
        }

        // Apply Type Filter
        if (selectedTypes.length > 0) {
            filtered = filtered.filter(p =>
                p.position_type && selectedTypes.some(t => p.position_type.toLowerCase() === t.toLowerCase())
            );
        }

        // Apply Source Filter

        // Apply Search Term Filter
        if (jobSearchTerm.trim() !== "") {
            const lower = jobSearchTerm.toLowerCase();
            filtered = filtered.filter((p) =>
                (p.title?.toLowerCase().includes(lower)) ||
                (p.company_name?.toLowerCase().includes(lower)) ||
                (p.location?.toLowerCase().includes(lower))
            );
        }

        setFilteredPositions(filtered);
    }, [positions, selectedModes, selectedStatuses, selectedTypes, jobSearchTerm]);

    const loadUserProfile = async () => {
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (!token) throw new Error("No token found");

            const data = await apiFetch("user_dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUserProfile(data);
            return data;
        } catch (err: any) {
            console.error("Error loading user profile:", err);
            return null;
        }
    };



    const getCandidateId = async (): Promise<number> => {
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            if (!token) throw new Error("No token found");

            const userResponse = await apiFetch("user_dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!userResponse || !userResponse.uname) {
                throw new Error("User information not found");
            }

            if (userResponse.candidate_id) {
                return userResponse.candidate_id;
            }

            const userEmail = userResponse.uname;

            try {
                const candidateResponse = await apiFetch(
                    `candidates/search-names/${encodeURIComponent(userEmail)}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                let candidates = [];
                if (Array.isArray(candidateResponse)) {
                    candidates = candidateResponse;
                } else if (candidateResponse?.data && Array.isArray(candidateResponse.data)) {
                    candidates = candidateResponse.data;
                } else if (candidateResponse?.candidates && Array.isArray(candidateResponse.candidates)) {
                    candidates = candidateResponse.candidates;
                }

                if (candidates.length > 0) {
                    const exactMatch = candidates.find(
                        (c: any) => c.email?.toLowerCase() === userEmail.toLowerCase()
                    );

                    if (exactMatch && exactMatch.id) {
                        return exactMatch.id;
                    }

                    if (candidates[0] && candidates[0].id) {
                        return candidates[0].id;
                    }
                }
            } catch (searchErr: any) {
                console.warn(" Candidate search by email failed:", searchErr);
            }

            throw new Error("Candidate ID not found. Please ensure your account is linked to a candidate profile.");
        } catch (err: any) {
            console.error(" Error getting candidate ID:", err);
            throw new Error(extractErrorMessage(err, "Failed to get candidate ID. Please log in again."));
        }
    };

    const loadSessions = async () => {
        const fullName = data?.basic_info?.full_name;
        if (!fullName) return;

        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const firstName = fullName.split(" ")[0];

        try {
            setSessionsLoading(true);

            const searchQuery = firstName.toLowerCase();
            const params = new URLSearchParams({ search_title: searchQuery });
            const sessionData = await apiFetch(`session?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const sessionsList =
                sessionData?.sessions || sessionData?.data || (Array.isArray(sessionData) ? sessionData : []);

            const candidateSessions = Array.isArray(sessionsList)
                ? sessionsList.filter((session: Session) => {
                    if (!session || !session.sessiondate || !session.title) return false;

                    const titleLower = session.title.toLowerCase();
                    const firstNameLower = firstName.toLowerCase();
                    const fullNameLower = fullName.toLowerCase();

                    return titleLower.includes(firstNameLower) || titleLower.includes(fullNameLower);
                })
                : [];

            setSessions(candidateSessions);
        } catch (err) {
            console.error("Error loading sessions:", err);
            setSessions([]);
        } finally {
            setSessionsLoading(false);
        }
    };

    const loadPositions = async () => {
        try {
            setPositionsLoading(true);
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const posData = await apiFetch("positions/?limit=500", {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("🔍 API Response - Total jobs received:", posData?.length || 0);
            console.log("🔍 API Response - Sample job data:", posData?.[0] || {});

            // Filter to show jobs from LinkedIn, Hiring Cafe, TrueUp, or Jobright
            const filteredData = (posData || []).filter((pos: any) => {
                const src = pos.source?.toLowerCase() || "";
                const shouldInclude = src.includes('linkedin') || src.includes('hiring') || src.includes('cafe') || src.includes('trueup') || src.includes('jobright');

                // Add a check to confirm the job actually has an actionable link id or url
                const hasLink = Boolean(pos.source_job_id || pos.source_uid || pos.job_url);
                return shouldInclude && hasLink;
            });

            console.log("📊 Final filtered positions count:", filteredData.length);

            // Debug: Show source distribution
            const sourceCounts = filteredData.reduce((acc: any, pos: any) => {
                const src = pos.source?.toLowerCase() || 'unknown';
                acc[src] = (acc[src] || 0) + 1;
                return acc;
            }, {});

            console.log("📈 Source distribution:", sourceCounts);

            setPositions(filteredData);
        } catch (err) {
            console.error("❌ Error loading positions:", err);
        } finally {
            setPositionsLoading(false);
        }
    };


    const loadDashboard = async (retryCount = 0) => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("access_token") || localStorage.getItem("token");

            if (!token) {
                router.push("/login");
                return;
            }

            await loadUserProfile();

            const id = await getCandidateId();
            setCandidateId(id);

            if (!id) {
                throw new Error("Could not retrieve candidate ID");
            }

            const dashboardData = await apiFetch(`candidates/${id}/dashboard/overview`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!dashboardData) {
                throw new Error("No data received from server");
            }

            setData(dashboardData);
        } catch (err: any) {
            console.error("Dashboard loading error:", err);

            const errorMessage = extractErrorMessage(err, "Failed to load dashboard");
            setError(errorMessage);

            if (retryCount === 0 && err.status >= 500) {
                setTimeout(() => loadDashboard(1), 2000);
                return;
            }

            if (err.status === 401 || err.status === 403) {
                localStorage.clear();
                router.push("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data) {
            const timeoutId = setTimeout(() => {
                loadSessions();
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    }, [data]);

    useEffect(() => {
        if (activeTab === 'jobs' && positions.length === 0) {
            loadPositions();
        }
    }, [activeTab]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        if (isProfileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileOpen]);

    useEffect(() => {
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Loading Dashboard...</h2>
                    <div className="flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[400px] flex items-center justify-center px-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 text-center max-w-md">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Connection Failed</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "Unable to load dashboard data"}</p>
                    <button
                        onClick={() => loadDashboard()}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-semibold"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    const firstName = data.basic_info.full_name.split(" ")[0];


    const tabs = [
        { id: 'jobs' as TabType, name: 'Job Board', icon: Briefcase },
        { id: 'overview' as TabType, name: 'Overview', icon: Home },
        { id: 'sessions' as TabType, name: 'Sessions', icon: PlayCircle },
        { id: 'interviews' as TabType, name: 'Interviews', icon: MessageSquare },
    ];

    return (
        <div className="flex h-screen bg-[#f4f6f9] dark:bg-gray-950 overflow-hidden">

            {/* ==================== SIDEBAR ==================== */}
            <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30 shadow-sm">
                {/* Logo */}
                <div className="p-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">Whitebox</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navigation</p>
                        <div className="space-y-0.5">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${isActive
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
                                        <span>{tab.name}</span>
                                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                    </button>
                                );
                            })}
                            <a
                                href="/coderpad"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white group"
                            >
                                <Puzzle className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                                <span>CoderPad</span>
                            </a>
                        </div>
                    </div>

                </nav>

            </aside>

            {/* ==================== MAIN CONTENT ==================== */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Top Bar */}
                <header className="min-h-[80px] lg:min-h-[100px] flex items-center justify-between px-4 lg:px-6 bg-[#f4f6f9] dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 z-20 flex-shrink-0 py-3">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Mobile logo */}
                        <div className="lg:hidden flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Briefcase className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        {/* Candidate Details Card */}
                        <div className="hidden sm:flex items-center gap-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-8 py-5 shadow-sm">
                            {/* Greeting + Name + Email */}
                            <div className="flex items-center gap-4 pr-6 border-r border-gray-100 dark:border-gray-700">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md">
                                    {data.basic_info.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-0.5">Welcome back</p>
                                    <h1 className="text-lg font-extrabold text-gray-900 dark:text-white leading-none whitespace-nowrap">Hi, {firstName}</h1>
                                    <p className="text-xs text-gray-400 mt-1 truncate">{data.basic_info.email}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            {[
                                { icon: Award, label: "Batch", value: data.basic_info.batch_name || "N/A", color: "text-purple-500", widthClass: "w-40" },
                                { icon: Calendar, label: "Enrolled", value: data.basic_info.enrolled_date ? format(parseISO(data.basic_info.enrolled_date), "MMM dd, yyyy") : "N/A", color: "text-green-500", widthClass: "w-36" },
                                { icon: Activity, label: "Logins", value: `${userProfile?.login_count || 0}`, color: "text-orange-500", widthClass: "w-24" },
                            ].map(({ icon: Icon, label, value, color, widthClass }) => (
                                <div key={label} className={`hidden lg:flex flex-col gap-1 ${widthClass || "min-w-0"}`}>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                                    <div className="flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                                >
                                    <Puzzle className="w-4 h-4 text-blue-500" />
                                    Autofill Extension
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <DropdownMenuItem asChild>
                                    <a
                                        href="https://chromewebstore.google.com/detail/talentscreen-autofill/bebdlhhpgmegdebdballinfmfnlpmeio"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 cursor-pointer w-full"
                                    >
                                        <ExternalLink className="w-4 h-4 text-blue-500" />
                                        <span>Link</span>
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a
                                        href="https://www.youtube.com/watch?v=ToCU1H25TTY"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 cursor-pointer w-full"
                                    >
                                        <Video className="w-4 h-4 text-red-500" />
                                        <span>Video Tutorial</span>
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                </header>

                {/* Mobile Tab Bar */}
                <div className="lg:hidden flex gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-x-auto flex-shrink-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-bold transition-all flex-shrink-0 ${isActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.name}
                            </button>
                        );
                    })}
                </div>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-hidden flex flex-col">

                    {/* Setup Status Banner */}
                    {setupStatus && (
                        <div className="px-4 lg:px-6 pt-4 flex-shrink-0 animate-in fade-in slide-in-from-top-2">
                            <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-3 border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-sm bg-white dark:bg-gray-900 group">
                                {/* Radiant Background Effect (matches the glowing corner effect from the reference) */}
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-indigo-100/50 via-white to-white dark:from-indigo-900/20 dark:via-gray-900 dark:to-gray-900 opacity-100"></div>

                                {/* Left Section: Branding + Divider + Message */}
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 flex-1">
                                    {/* Brand Label */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-xl font-extrabold text-indigo-950 dark:text-indigo-100 tracking-tight">WBL <span className="text-indigo-600 dark:text-indigo-400 font-black">SmartPrep</span></span>
                                    </div>

                                    {/* Vertical Divider (Hidden on small screens) */}
                                    <div className="hidden md:block w-px h-8 bg-indigo-200 dark:bg-indigo-800"></div>

                                    {/* Messaging */}
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-x-1.5 leading-tight">
                                            <p className="text-gray-900 dark:text-gray-100 font-bold text-sm lg:text-[15px]">
                                                Your AI-powered interview practice
                                            </p>
                                        </div>
                                        {!setupStatus.setup_complete && (
                                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mt-0.5">
                                                Missing: {!setupStatus.resume_uploaded ? "Resume" : ""}
                                                {!setupStatus.resume_uploaded && !setupStatus.api_keys_configured ? " & " : ""}
                                                {!setupStatus.api_keys_configured ? "API Keys" : ""}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Section: Action Button */}
                                <div className="relative z-10 shrink-0">
                                    {setupStatus.setup_complete ? (
                                        <button
                                            onClick={async () => {
                                                const getAiPrepUrl = () => {
                                                    return "https://ai-prep.whitebox-learning.com";
                                                    // return "http://localhost:3001";
                                                };
                                                const baseUrl = getAiPrepUrl();

                                                try {
                                                    const response = await apiFetch("candidate/generate-prep-token", {
                                                        method: "POST"
                                                    });
                                                    if (response && response.token) {
                                                        window.open(`${baseUrl}/?prep_token=${response.token}`, '_blank');
                                                    } else {
                                                        window.open(baseUrl, '_blank');
                                                    }
                                                } catch (err) {
                                                    console.error("Failed to generate prep token:", err);
                                                    window.open(baseUrl, '_blank');
                                                }
                                            }}
                                            className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-full text-sm transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                                        >
                                            <PlayCircle className="w-3.5 h-3.5" />
                                            Start Preparation
                                        </button>
                                    ) : (
                                        <Link
                                            href="/setup"
                                            className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-gradient-to-br from-indigo-900 to-purple-600 hover:from-indigo-800 hover:to-purple-500 text-white font-bold rounded-full text-sm transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Complete Setup
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alerts Banner */}
                    {data.alerts && data.alerts.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-4 lg:px-6 pt-4">
                            {data.alerts.map((alert, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium flex-1 min-w-[200px] ${alert.type === "warning"
                                        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300"
                                        }`}
                                >
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{alert.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ==================== TAB CONTENT ==================== */}
                    <div className="flex-1 overflow-hidden flex flex-col animate-fadeIn">
                        {activeTab === 'overview' && (
                            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                                {/* Phase Cards Row */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <PhaseCard
                                        title="Enrolled"
                                        icon={<CheckCircle className="w-5 h-5" />}
                                        color="gray"
                                        completed={data.journey.enrolled.completed}
                                        daysSince={data.journey.enrolled.days_since}
                                        batchName={data.basic_info.batch_name}
                                        date={data.journey.enrolled.date ? format(parseISO(data.journey.enrolled.date), "MMM dd, yyyy") : undefined}
                                    />
                                    <PhaseCard
                                        title="Preparation"
                                        icon={<Target className="w-5 h-5" />}
                                        color="gray"
                                        active={data.journey.preparation.active}
                                        completed={data.journey.preparation.completed}
                                        durationDays={data.journey.preparation.duration_days}
                                    />
                                    <PhaseCard
                                        title="Marketing"
                                        icon={<TrendingUp className="w-5 h-5" />}
                                        color="gray"
                                        active={data.journey.marketing.active}
                                        completed={data.journey.marketing.completed}
                                        durationDays={data.journey.marketing.duration_days}
                                    />
                                    <PhaseCard
                                        title="Placement"
                                        icon={<Briefcase className="w-5 h-5" />}
                                        color="gray"
                                        active={data.journey.placement.active}
                                        completed={data.journey.placement.completed}
                                        company={data.phase_metrics.placement?.company}
                                        date={data.journey.placement.date ? format(parseISO(data.journey.placement.date), "MMM dd, yyyy") : undefined}
                                    />
                                </div>

                                {/* AI Setup Status Card */}
                                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                                                <Settings className="w-4 h-4 text-violet-500" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-800 dark:text-white">AI Profile Setup</span>
                                        </div>
                                        <Link
                                            href="/setup"
                                            className="text-xs font-bold text-violet-500 hover:text-violet-700 transition-colors flex items-center gap-1"
                                        >
                                            {setupStatus?.setup_complete ? "Manage" : "Complete Setup"}
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Resume Status */}
                                        <div className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl border transition-all ${setupStatus === null
                                                ? "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                                                : setupStatus.resume_uploaded
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50"
                                                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50"
                                            }`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${setupStatus === null
                                                    ? "bg-gray-100 dark:bg-gray-700"
                                                    : setupStatus.resume_uploaded
                                                        ? "bg-emerald-100 dark:bg-emerald-900/40"
                                                        : "bg-amber-100 dark:bg-amber-900/40"
                                                }`}>
                                                {setupStatus === null ? (
                                                    <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                                                ) : setupStatus.resume_uploaded ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resume</p>
                                                <p className={`text-xs font-bold mt-0.5 ${setupStatus === null ? "text-gray-400" :
                                                        setupStatus.resume_uploaded ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                                    }`}>
                                                    {setupStatus === null ? "Loading..." : setupStatus.resume_uploaded ? "Uploaded ✓" : "Not added"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* API Keys Status */}
                                        <div className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl border transition-all ${setupStatus === null
                                                ? "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                                                : setupStatus.api_keys_configured
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50"
                                                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50"
                                            }`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${setupStatus === null
                                                    ? "bg-gray-100 dark:bg-gray-700"
                                                    : setupStatus.api_keys_configured
                                                        ? "bg-emerald-100 dark:bg-emerald-900/40"
                                                        : "bg-amber-100 dark:bg-amber-900/40"
                                                }`}>
                                                {setupStatus === null ? (
                                                    <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                                                ) : setupStatus.api_keys_configured ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">API Keys</p>
                                                <p className={`text-xs font-bold mt-0.5 ${setupStatus === null ? "text-gray-400" :
                                                        setupStatus.api_keys_configured ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                                    }`}>
                                                    {setupStatus === null ? "Loading..." : setupStatus.api_keys_configured ? "Configured ✓" : "Not added"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                    {/* JOURNEY SECTION */}
                                    <div className="lg:col-span-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                        <div className="mb-5">
                                            <h2 className="text-base font-bold text-gray-900 dark:text-white">Your Career Journey</h2>
                                            <p className="text-xs text-gray-400 mt-0.5">Track your progress from enrollment to placement.</p>
                                        </div>

                                        <div className="relative px-2 py-1">
                                            {/* Line Background */}
                                            <div className="hidden md:block absolute top-[18px] left-8 right-8 h-0.5 bg-gray-100 dark:bg-gray-800 rounded-full z-0" />
                                            {/* Active Progress Line */}
                                            <div
                                                className="hidden md:block absolute top-[18px] left-8 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full z-0 transition-all duration-1000"
                                                style={{
                                                    width: `calc(${(data.journey.placement.completed ? 100 :
                                                        data.journey.placement.active ? 87.5 :
                                                            data.journey.marketing.completed ? 75 :
                                                                data.journey.marketing.active ? 62.5 :
                                                                    data.journey.preparation.completed ? 50 :
                                                                        data.journey.preparation.active ? 37.5 :
                                                                            data.journey.enrolled.completed ? 25 : 0)
                                                        }% - 4rem)`
                                                }}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-10">
                                                {[
                                                    {
                                                        id: 'enrolled',
                                                        title: 'Enrolled',
                                                        date: data.journey.enrolled.date,
                                                        status: (data.journey.enrolled.completed || data.journey.preparation.active || data.journey.preparation.completed) ? 'completed' : 'active',
                                                        icon: CheckCircle,
                                                        description: data.basic_info.batch_name
                                                    },
                                                    {
                                                        id: 'preparation',
                                                        title: 'Preparation',
                                                        date: data.journey.preparation.start_date,
                                                        status: (data.journey.preparation.completed || data.journey.marketing.active || data.journey.marketing.completed) ? 'completed' : data.journey.preparation.active ? 'active' : 'upcoming',
                                                        icon: Target,
                                                        duration: data.journey.preparation.duration_days
                                                    },
                                                    {
                                                        id: 'marketing',
                                                        title: 'Marketing',
                                                        date: data.journey.marketing.start_date,
                                                        status: (data.journey.marketing.completed || data.journey.placement.active || data.journey.placement.completed) ? 'completed' : data.journey.marketing.active ? 'active' : 'upcoming',
                                                        icon: TrendingUp,
                                                        duration: data.journey.marketing.duration_days
                                                    },
                                                    {
                                                        id: 'placement',
                                                        title: 'Placement',
                                                        date: data.journey.placement.date,
                                                        status: data.journey.placement.completed ? 'completed' : data.journey.placement.active ? 'active' : 'upcoming',
                                                        icon: Briefcase,
                                                        company: data.phase_metrics?.placement?.company
                                                    }
                                                ].map((step, idx) => (
                                                    <div key={idx} className="flex flex-row md:flex-col items-center group relative">
                                                        {idx !== 3 && (
                                                            <div className="md:hidden absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-700 -z-10" />
                                                        )}
                                                        <div
                                                            className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm border-2 ${step.status === 'completed'
                                                                ? 'bg-blue-500 border-blue-400 text-white group-hover:scale-110'
                                                                : step.status === 'active'
                                                                    ? 'bg-white dark:bg-gray-900 border-blue-500 text-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30'
                                                                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300'
                                                                }`}
                                                        >
                                                            <step.icon className={`w-4 h-4 ${step.status === 'active' ? 'animate-pulse' : ''}`} />
                                                        </div>
                                                        <div className="ml-4 md:ml-0 md:mt-3 text-left md:text-center flex-1">
                                                            <div className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${step.status === 'completed' ? 'text-blue-500' : step.status === 'active' ? 'text-blue-400' : 'text-gray-300'}`}>
                                                                Step 0{idx + 1}
                                                            </div>
                                                            <h3 className={`text-xs font-bold mb-1 ${step.status === 'upcoming' ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                                {step.title}
                                                            </h3>
                                                            <div className="min-h-[28px] flex flex-col justify-start md:items-center">
                                                                {step.date ? (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-[9px] font-medium text-gray-500">
                                                                        <Calendar className="w-2.5 h-2.5" />
                                                                        {format(parseISO(step.date), "MMM dd, yyyy")}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] text-gray-300 italic">{step.status === 'upcoming' ? 'Upcoming' : 'Pending'}</span>
                                                                )}
                                                                {step.status === 'active' && step.duration && (
                                                                    <span className="mt-0.5 text-[9px] font-bold text-orange-500 uppercase tracking-wide">Day {step.duration}</span>
                                                                )}
                                                                {step.company && (
                                                                    <span className="mt-0.5 text-[9px] font-bold text-blue-500 truncate">{step.company}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* MY TEAM SECTION */}
                                    <div className="lg:col-span-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">My Team</h2>
                                        <p className="text-xs text-gray-400 mb-4">Your professional support network.</p>

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Instructors</h3>
                                                <div className="space-y-2">
                                                    {data.team_info.preparation.instructors.map((instructor, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs flex-shrink-0">
                                                                {instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{instructor.name}</h4>
                                                                <p className="text-[10px] text-gray-400 truncate">{instructor.role || "Instructor"}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {data.team_info.marketing.manager && (
                                                <div>
                                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Marketing</h3>
                                                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs flex-shrink-0">
                                                            {data.team_info.marketing.manager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{data.team_info.marketing.manager.name}</h4>
                                                            <p className="text-[10px] text-gray-400">Marketing Manager</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sessions' && (
                            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <PlayCircle className="w-4 h-4 text-blue-500" />
                                                Sessions
                                            </h2>
                                            <p className="text-xs text-gray-400 mt-0.5">Your recorded and upcoming sessions.</p>
                                        </div>
                                    </div>

                                    {sessionsLoading ? (
                                        <div className="text-center py-12">
                                            <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                                            <p className="text-sm text-gray-400">Loading your sessions...</p>
                                        </div>
                                    ) : sessions.length === 0 ? (
                                        <div className="text-center py-16">
                                            <PlayCircle className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">No Sessions Found</h3>
                                            <p className="text-sm text-gray-400">
                                                {`No sessions found for ${firstName} yet`}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-xs text-gray-400 mb-3">Found <span className="font-bold text-blue-600">{sessions.length}</span> sessions</p>
                                            <div className="overflow-hidden border border-gray-100 dark:border-gray-800 rounded-xl">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                                            <th className="px-4 py-2.5">Session Title</th>
                                                            <th className="px-4 py-2.5 hidden sm:table-cell">Date</th>
                                                            <th className="px-4 py-2.5 text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                                        {sessions.map((session) => (
                                                            <tr key={session.sessionid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                                <td className="px-4 py-2.5 max-w-xs sm:max-w-md">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{session.title || "Untitled"}</span>
                                                                        <span className="text-[10px] text-gray-400 sm:hidden">
                                                                            {session.sessiondate ? format(parseISO(session.sessiondate), "MMM dd, yyyy") : "N/A"}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-gray-500">
                                                                    {session.sessiondate ? format(parseISO(session.sessiondate), "MMM dd, yyyy") : "N/A"}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-right">
                                                                    {session.link ? (
                                                                        <a href={session.link} target="_blank" rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors text-[11px] font-bold">
                                                                            <PlayCircle size={13} />
                                                                            Watch
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-[10px] text-gray-300">N/A</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'interviews' && (
                            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                    <div className="space-y-4">
                                        {data.interviews.filter(i => i.interview_date && new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0))).length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Upcoming Rounds</h3>
                                                </div>
                                                <div className="h-[300px]">
                                                    <CandidateGrid
                                                        rowData={data.interviews.filter(i => i.interview_date && new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0))).sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())}
                                                        columnDefs={interviewColumnDefs}
                                                        height="300px"
                                                        rowHeight={60}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Interview History</h3>
                                                <div className="hidden sm:flex items-center gap-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upcoming</span>
                                                        <span className={`text-sm font-bold ${data.interviews.filter(i => i.interview_date && new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0))).length > 0 ? "text-green-600" : "text-gray-300"}`}>
                                                            {data.interviews.filter(i => i.interview_date && new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0))).length}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-[400px]">
                                                <CandidateGrid
                                                    rowData={data.interviews.filter(i => !i.interview_date || new Date(i.interview_date) < new Date(new Date().setHours(0, 0, 0, 0))).sort((a, b) => new Date(b.interview_date).getTime() - new Date(a.interview_date).getTime())}
                                                    columnDefs={interviewColumnDefs}
                                                    height="400px"
                                                    rowHeight={60}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'jobs' && (
                            <div className="flex-1 flex flex-col px-4 lg:px-6 mt-4 sm:mt-8 pb-8 w-full min-h-0">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-6 pt-4 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                                            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            Jobs <span className="text-gray-400 font-medium">({positions.length})</span>
                                        </h2>
                                    </div>
                                    <div className="w-full sm:w-[400px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="job-search"
                                                type="text"
                                                value={jobSearchTerm}
                                                placeholder="Search by title, company, location..."
                                                onChange={(e) => setJobSearchTerm(e.target.value)}
                                                className="pl-10 h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl"
                                            />
                                        </div>
                                    </div>

                                </div>
                                <div className="flex-1 w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 min-h-0 flex flex-col">
                                    <CandidateGrid
                                        rowData={filteredPositions}
                                        columnDefs={jobColumnDefs}
                                        loading={positionsLoading}
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}
const PhaseCard = ({
    title, icon, color, completed, active, daysSince, durationDays, batchName, rating, company, date,
}: {
    title: string; icon: React.ReactNode; color: string; completed?: boolean; active?: boolean; daysSince?: number;
    durationDays?: number; batchName?: string; rating?: string; company?: string; date?: string;
}) => {
    // Highly simplified color mapping - just for the icon/line color
    const accentColor = active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500";
    const borderColor = active ? "border-blue-200 dark:border-blue-800" : "border-gray-100 dark:border-gray-800";

    return (
        <div className={`bg-white dark:bg-gray-800 border ${borderColor} rounded-xl p-3 shadow-sm transition-all duration-200`}>
            <div className="flex items-center gap-2.5 mb-3">
                <div className={`${accentColor}`}>{icon}</div>
                <h3 className="text-xs font-extrabold text-gray-900 dark:text-gray-100 tracking-tight uppercase leading-tight">{title}</h3>
            </div>

            <div className="space-y-3">
                <div className="flex items-center h-5">
                    {active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-blue-500 text-white shadow-sm shadow-blue-500/20 animate-pulse">
                            Active Now
                        </span>
                    ) : completed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                            Completed
                        </span>
                    ) : (
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300 dark:text-gray-600">
                            Upcoming Step
                        </span>
                    )}
                </div>

                <div className="pt-2 border-t border-gray-50 dark:border-gray-700 space-y-1.5">
                    {daysSince !== undefined && daysSince !== null && (
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{daysSince} days total</p>
                    )}
                    {durationDays !== undefined && durationDays !== null && (
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{durationDays} days duration</p>
                    )}
                    {date && (
                        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {date}
                        </p>
                    )}
                    {batchName && <p className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate flex items-center gap-1.5">
                        <span className="text-blue-500">📚</span> {batchName}
                    </p>}
                    {company && (
                        <p className="text-xs font-extrabold text-blue-700 dark:text-blue-300 mt-2 p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl truncate flex items-center gap-1.5">
                            <span>🏢</span> {company}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
