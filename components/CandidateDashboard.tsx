"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
    Mail,
    Phone,
    Calendar,
    Award,
    TrendingUp,
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
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/utils/AuthContext";
import CandidateGrid from "./CandidateGrid";
import { ColDef } from "ag-grid-community";

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

type TabType = 'overview' | 'journey' | 'team' | 'sessions' | 'interviews' | 'jobs';

const extractErrorMessage = (err: ApiError, defaultMessage: string): string => {
    return err.body?.detail || err.body?.message || err.detail || err.message || defaultMessage;
};

const interviewColumnDefs: ColDef[] = [
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
        cellRenderer: (params: any) => {
            if (!params.value) return (
                <div className="flex items-center h-full text-gray-400 text-xs italic">Not set</div>
            );
            try {
                const dateStr = format(parseISO(params.value), "MMM dd, yyyy");
                return (
                    <div className="flex items-center h-full gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{dateStr}</span>
                    </div>
                );
            } catch (e) {
                return <div className="flex items-center h-full text-xs font-medium">{params.value}</div>;
            }
        }
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
];

const jobColumnDefs: ColDef[] = [
    { field: "source_job_id", headerName: "LinkedIn Job ID", flex: 1.5, minWidth: 160, pinned: 'left' },
    { field: "title", headerName: "Position", flex: 2, minWidth: 200 },
    { field: "company_name", headerName: "Company", flex: 1.5, minWidth: 150 },
    { field: "location", headerName: "Location", flex: 1.5, minWidth: 150 },

    {
        field: "source_job_id",
        headerName: "Link",
        flex: 1,
        minWidth: 100,
        cellRenderer: (params: any) => {
            if (!params.value) return <span className="text-gray-400">-</span>;
            return (
                <div className="flex items-center h-full">
                    <a
                        href={params.data.job_url || `https://www.linkedin.com/jobs/view/${params.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-500 hover:text-blue-700 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-xs">View</span>
                    </a>
                </div>
            );
        }
    }
];

export default function CandidateDashboard() {
    const router = useRouter();
    const { userRole } = useAuth() as { userRole: string };

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [candidateId, setCandidateId] = useState<number | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Sessions state
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionSearchTerm, setSessionSearchTerm] = useState("");

    // Jobs state
    const [positions, setPositions] = useState<any[]>([]);
    const [positionsLoading, setPositionsLoading] = useState(false);

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

            const searchQuery = sessionSearchTerm.trim()
                ? `${firstName} ${sessionSearchTerm}`.toLowerCase()
                : firstName.toLowerCase();

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

            // Filter to only show jobs with a numeric LinkedIn Job ID AND source is linkedin
            const filteredData = (posData || []).filter((pos: any) =>
                pos.source_job_id &&
                /^\d+$/.test(String(pos.source_job_id)) &&
                pos.source?.toLowerCase() === 'linkedin'
            );

            setPositions(filteredData);
        } catch (err) {
            console.error("Error loading positions:", err);
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
    }, [data, sessionSearchTerm]);

    useEffect(() => {
        if (activeTab === 'jobs' && positions.length === 0) {
            loadPositions();
        }
    }, [activeTab]);

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
        { id: 'overview' as TabType, name: 'Overview', icon: Home },
        { id: 'journey' as TabType, name: 'Journey', icon: TrendingUp },
        { id: 'team' as TabType, name: 'My Team', icon: Users },
        { id: 'sessions' as TabType, name: 'Sessions', icon: PlayCircle },
        { id: 'interviews' as TabType, name: 'Interviews', icon: MessageSquare },
        { id: 'jobs' as TabType, name: 'LinkedIn Jobs', icon: Briefcase },
    ];

    return (
        <div className="w-full overflow-x-hidden">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ==================== ALERTS ==================== */}
                {data.alerts && data.alerts.length > 0 && (
                    <div className="mb-6 space-y-3">
                        {data.alerts.map((alert, index) => (
                            <div
                                key={index}
                                className={`flex items-center space-x-3 p-4 rounded-xl border backdrop-blur-sm ${alert.type === "warning"
                                    ? "bg-yellow-50/80 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                                    : "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                    }`}
                            >
                                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{alert.message}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Phase: {alert.phase}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ==================== PROFILE CARD ==================== */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
                    <div className="p-6">
                        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold shadow-inner border border-blue-100 dark:border-blue-800">
                                    {data.basic_info.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-md">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                </div>
                            </div>

                            <div className="flex-1 text-center lg:text-left">
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    Welcome back, {firstName}! 👋
                                </h1>

                                <div className="flex flex-col lg:flex-row gap-4 mb-4 text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center justify-center lg:justify-start gap-2">
                                        <Mail size={16} className="text-blue-500" />
                                        <span className="text-sm font-medium">{data.basic_info.email}</span>
                                    </div>
                                    <div className="flex items-center justify-center lg:justify-start gap-2">
                                        <Phone size={16} className="text-blue-500" />
                                        <span className="text-sm font-medium">{data.basic_info.phone}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Award className="w-4 h-4 text-yellow-500 transition-transform group-hover:scale-110" />
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Batch</p>
                                        </div>
                                        <p className="text-md font-bold text-gray-900 dark:text-gray-100">{data.basic_info.batch_name || "N/A"}</p>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="w-4 h-4 text-blue-500 transition-transform group-hover:scale-110" />
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Enrolled</p>
                                        </div>
                                        <p className="text-md font-bold text-gray-900 dark:text-gray-100">
                                            {data.basic_info.enrolled_date ? format(parseISO(data.basic_info.enrolled_date), "MMM dd, yyyy") : "N/A"}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Activity className="w-4 h-4 text-green-500 transition-transform group-hover:scale-110" />
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Login Count</p>
                                        </div>
                                        <p className="text-md font-bold text-gray-900 dark:text-gray-100">{userProfile?.login_count || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ==================== NAVIGATION TABS ==================== */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1.5">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-gray-400"}`} />
                                    <span className="truncate">{tab.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ==================== TAB CONTENT ==================== */}
                <div className="animate-fadeIn">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        </div>
                    )}

                    {/* JOURNEY TAB */}
                    {/* JOURNEY TAB */}
                    {activeTab === 'journey' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-8">
                            <div className="mb-10 text-center">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    Your Career Journey
                                </h2>
                                <p className="text-sm text-gray-500 max-w-lg mx-auto">
                                    Track your progress from enrollment to your dream job placement.
                                </p>
                            </div>

                            <div className="relative max-w-4xl mx-auto px-4 py-8">
                                {/* Connecting Line Background */}
                                <div className="hidden md:block absolute top-[26px] left-8 right-8 h-1 bg-gray-100 dark:bg-gray-700 rounded-full z-0"></div>

                                {/* Active Progress Line (Dynamic width based on completed steps) */}
                                <div
                                    className="hidden md:block absolute top-[26px] left-8 h-1 bg-blue-500 rounded-full z-0 transition-all duration-1000 ease-out"
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
                                ></div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
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
                                            {/* Vertical Line for Mobile */}
                                            {idx !== 3 && (
                                                <div className="md:hidden absolute left-[19px] top-10 bottom-[-32px] w-0.5 bg-gray-100 dark:bg-gray-700 -z-10"></div>
                                            )}

                                            {/* Icon Circle */}
                                            <div
                                                className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm border-4 ${step.status === 'completed'
                                                    ? 'bg-blue-500 border-blue-100 dark:border-blue-900/30 text-white transform group-hover:scale-110'
                                                    : step.status === 'active'
                                                        ? 'bg-white dark:bg-gray-800 border-blue-500 text-blue-500 shadow-blue-200 dark:shadow-blue-900/20 shadow-lg ring-4 ring-blue-50 dark:ring-blue-900/10'
                                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600'
                                                    }`}
                                            >
                                                <step.icon className={`w-6 h-6 ${step.status === 'active' ? 'animate-pulse' : ''}`} />
                                            </div>

                                            {/* Text Content */}
                                            <div className="ml-6 md:ml-0 md:mt-6 text-left md:text-center flex-1">
                                                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${step.status === 'completed' ? 'text-blue-600 dark:text-blue-400' :
                                                    step.status === 'active' ? 'text-blue-500' : 'text-gray-400'
                                                    }`}>
                                                    Step 0{idx + 1}
                                                </div>
                                                <h3 className={`text-lg font-bold mb-1 ${step.status === 'upcoming' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
                                                    }`}>
                                                    {step.title}
                                                </h3>

                                                <div className="min-h-[40px] flex flex-col justify-start md:justify-center">
                                                    {step.date ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 mx-auto">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(parseISO(step.date), "MMM dd, yyyy")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            {step.status === 'upcoming' ? 'Upcoming' : 'Pending'}
                                                        </span>
                                                    )}

                                                    {/* Extra Metadata */}
                                                    {step.status === 'active' && step.duration && (
                                                        <span className="mt-1 text-[10px] font-bold text-orange-500 uppercase tracking-wide">
                                                            Day {step.duration}
                                                        </span>
                                                    )}
                                                    {step.company && (
                                                        <span className="mt-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                                                            {step.company}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-8">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                                My Professional Team
                            </h2>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Preparation & Training</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {data.team_info.preparation.instructors.map((instructor, idx) => (
                                            <div key={idx} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-all">
                                                <div className="w-12 h-12 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center text-gray-400 font-bold text-lg shadow-sm">
                                                    {instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{instructor.name}</h4>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {data.team_info.marketing.manager && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Marketing & Placement</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-all">
                                                <div className="w-12 h-12 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center text-gray-400 font-bold text-lg shadow-sm">
                                                    {data.team_info.marketing.manager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{data.team_info.marketing.manager.name}</h4>
                                                    <p className="text-xs text-gray-500 font-medium truncate">Marketing Manager</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                <PlayCircle className="w-5 h-5 mr-2 text-blue-500" />
                                My Sessions & Videos
                            </h2>

                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={sessionSearchTerm}
                                        onChange={(e) => setSessionSearchTerm(e.target.value)}
                                        placeholder={`Search in your sessions...`}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    💡 Showing only sessions for {firstName}. Search by: "Mock", "Session", subject, etc.
                                </p>
                            </div>

                            {sessionsLoading ? (
                                <div className="text-center py-12">
                                    <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-600 dark:text-gray-400">Loading your sessions...</p>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-16">
                                    <PlayCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Sessions Found</h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {sessionSearchTerm.trim()
                                            ? `No sessions found matching "${sessionSearchTerm}" for ${firstName}`
                                            : `No sessions found for ${firstName} yet`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Found <span className="font-semibold text-blue-600 dark:text-blue-400">{sessions.length}</span> session{sessions.length !== 1 ? 's' : ''} for {firstName}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {sessions.map((session) => (
                                            <div key={session.sessionid} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2">
                                                            {session.title || "Untitled Session"}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {session.sessiondate ? format(parseISO(session.sessiondate), "MMM dd, yyyy") : "No date"}
                                                        </p>
                                                    </div>
                                                    <PlayCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                </div>

                                                <div className="flex items-center justify-between text-xs mb-3">
                                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                                        {session.type || "Session"}
                                                    </span>
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {session.subject || "N/A"}
                                                    </span>
                                                </div>

                                                {session.link && (
                                                    <a
                                                        href={session.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium text-sm"
                                                    >
                                                        <PlayCircle className="w-4 h-4" />
                                                        <span>Watch Now</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'interviews' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                                {/* <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-blue-500" />
                                        Interviews
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Manage and track your interview rounds</p>
                                </div> */}

                                <div className="space-y-8">
                                    {/* Upcoming Interviews Section */}
                                    {data.interviews.filter(i => i.interview_date && new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0))).length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Upcoming Rounds</h3>
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

                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Interview History</h3>

                                            {/* Stats moved to header to avoid pagination overlap */}
                                            <div className="hidden sm:flex items-center gap-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Upcoming</span>
                                                    <span className={`text-sm font-bold ${data.interviews.filter(i => i.interview_date && new Date(i.interview_date) >= new Date(new Date().setHours(0, 0, 0, 0))).length > 0 ? "text-green-600" : "text-gray-400"}`}>
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
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                                <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
                                LinkedIn Job Board
                            </h2>

                            <div className="h-[500px]">
                                <CandidateGrid
                                    rowData={positions}
                                    columnDefs={jobColumnDefs}
                                    loading={positionsLoading}
                                    height="500px"
                                />
                            </div>
                        </div>
                    )}

                </div>
            </main>
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
        <div className={`bg-white dark:bg-gray-800 border ${borderColor} rounded-xl p-6 shadow-sm transition-all duration-200`}>
            <div className="flex items-center gap-4 mb-4">
                <div className={`${accentColor}`}>{icon}</div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h3>
            </div>

            <div className="space-y-3">
                <div className="flex items-center h-5">
                    {active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            Current Stage
                        </span>
                    ) : completed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                            Done
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 dark:text-gray-600">
                            Upcoming
                        </span>
                    )}
                </div>

                <div className="pt-2 border-t border-gray-50 dark:border-gray-700 space-y-1.5">
                    {daysSince !== undefined && daysSince !== null && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{daysSince} days total</p>
                    )}
                    {durationDays !== undefined && durationDays !== null && (
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{durationDays} days in phase</p>
                    )}
                    {date && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {date}
                        </p>
                    )}
                    {batchName && <p className="text-xs text-gray-500 dark:text-gray-400">📚 {batchName}</p>}
                    {company && (
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            🏢 {company}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
