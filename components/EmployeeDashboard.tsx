"use client";

import React, { useEffect, useState } from "react";
import {
    Briefcase, GraduationCap, ClipboardList,
    HelpingHand, Video, Calendar,
    Mail, Phone, Activity, Award, TrendingUp,
    CheckCircle, Bell, PlayCircle,
    Home, Users, Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin_ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin_ui/tabs";
import { apiFetch } from "@/lib/api";

// Types
interface EmployeeInfo {
    id: number;
    name: string;
    email: string;
    phone?: string;
}

interface Placement {
    id: number;
    candidate_name?: string;
    company: string;
    position: string;
    placement_date: string;
    status: string;
}

interface Candidate {
    id: number;
    candidate_id: number;
    candidate_name?: string;
    full_name?: string;
    status: string;
    start_date?: string;
}

interface Task {
    id: number;
    task: string;
    assigned_date: string;
    due_date?: string;
    status: string;
    priority: string;
}

interface Recording {
    id: number;
    description: string;
    classdate: string;
    link: string;
}

interface DB_Session {
    sessionid: number;
    title: string;
    sessiondate: string;
    link: string;
}

interface EmployeeDashboardData {
    employee_info: EmployeeInfo;
    placements: Placement[];
    assigned_prep_candidates: Candidate[];
    assigned_marketing_candidates: Candidate[];
    pending_tasks: Task[];
    job_help_candidates: Placement[];
    classes: Recording[];
    sessions: DB_Session[];
    is_birthday: boolean;
}

const DashboardPhaseCard = ({
    title, icon, color, value, subtitle, status,
}: {
    title: string; icon: React.ReactNode; color: 'blue' | 'purple' | 'green' | 'orange';
    value: number; subtitle: string; status: 'active' | 'completed' | 'pending';
}) => {
    const colorClasses = {
        blue: {
            bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20",
            border: "border-blue-200 dark:border-blue-800",
            icon: "bg-blue-500 text-white",
            badge: "bg-blue-100 text-blue-700"
        },
        purple: {
            bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20",
            border: "border-purple-200 dark:border-purple-800",
            icon: "bg-purple-500 text-white",
            badge: "bg-purple-100 text-purple-700"
        },
        green: {
            bg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20",
            border: "border-green-200 dark:border-green-800",
            icon: "bg-green-500 text-white",
            badge: "bg-green-100 text-green-700"
        },
        orange: {
            bg: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20",
            border: "border-orange-200 dark:border-orange-800",
            icon: "bg-orange-500 text-white",
            badge: "bg-orange-100 text-orange-700"
        },
    };

    const colors = colorClasses[color];

    return (
        <div className={`${colors.bg} ${colors.border} border-2 rounded-[32px] p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]`}>
            <div className="absolute -top-4 -right-4 w-24 h-24 opacity-5 group-hover:scale-150 transition-transform duration-700">
                {icon}
            </div>

            <div className="relative">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-black text-gray-800 tracking-tight">{title}</h3>
                    <div className={`p-4 rounded-2xl ${colors.icon} shadow-xl transform group-hover:rotate-12 transition-transform`}>
                        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
                    </div>
                </div>

                <div className="mb-4">
                    {status === 'active' ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colors.badge}`}>
                            <div className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></div>
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700">
                            <CheckCircle size={10} className="mr-1" />
                            Completed
                        </span>
                    )}
                </div>
            </div>

            <div className="relative">
                <p className="text-4xl font-black tracking-tighter text-gray-900 mb-1">{value}</p>
                <p className="text-xs font-bold text-gray-500 tracking-wide">{subtitle}</p>
            </div>
        </div>
    );
};

export default function EmployeeDashboard() {
    const [data, setData] = useState<EmployeeDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                console.log("🔄 Fetching employee dashboard data...");
                setLoading(true);
                setError(null);

                const metrics = await apiFetch("/metrics/employee");
                console.log("✅ Employee dashboard data received:", metrics);

                setData(metrics);
            } catch (err: any) {
                console.error("❌ Dashboard error:", err);
                console.error("Error details:", {
                    message: err?.message,
                    status: err?.status,
                    body: err?.body
                });

                const errorMessage = err?.body?.detail
                    || err?.body?.message
                    || err?.message
                    || "Failed to fetch employee dashboard data";

                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-xl font-semibold animate-pulse text-gray-500 flex items-center gap-3 justify-center mb-4">
                        <Activity className="animate-spin text-blue-500" /> Loading Dashboard...
                    </div>
                    <p className="text-sm text-gray-400">Please wait while we fetch your data</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-3xl border-2 border-red-100 max-w-2xl mx-auto mt-12">
                <h2 className="text-2xl font-black mb-4 flex items-center justify-center gap-2">
                    <Award size={32} /> Unable to Load Dashboard
                </h2>
                <p className="font-medium mb-4">{error || "No data available"}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                >
                    Retry
                </button>
            </div>
        );
    }

    const {
        employee_info,
        placements,
        assigned_prep_candidates,
        assigned_marketing_candidates,
        pending_tasks,
        job_help_candidates,
        classes,
        sessions,
        is_birthday
    } = data;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
            {/* ==================== WELCOME BANNER (Matches Candidate Dashboard) ==================== */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] shadow-2xl overflow-hidden relative border-4 border-white/20">
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="relative p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-8">
                    {/* User Initials Circle */}
                    <div className="relative">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl border-2 border-white/30">
                            {employee_info.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    <div className="flex-1 text-center lg:text-left text-white">
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-2">
                            Welcome back, {employee_info.name.split(' ')[0]}! 👋
                        </h1>
                        <div className="flex flex-col lg:flex-row gap-4 text-white/90 text-sm font-medium">
                            <div className="flex items-center justify-center lg:justify-start gap-2 group transition-colors hover:text-white cursor-default">
                                <div className="p-1.5 bg-white/10 rounded-lg"><Mail size={14} /></div>
                                <span>{employee_info.email}</span>
                            </div>
                            <div className="flex items-center justify-center lg:justify-start gap-2 group transition-colors hover:text-white cursor-default">
                                <div className="p-1.5 bg-white/10 rounded-lg"><Phone size={14} /></div>
                                <span>{employee_info.phone || "No phone provided"}</span>
                            </div>
                        </div>

                        {/* Banner Metrics */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                                <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Award size={10} className="text-yellow-300" /> Experience
                                </p>
                                <p className="text-xl font-bold text-white uppercase tracking-tighter">Active Member</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                                <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <TrendingUp size={10} className="text-cyan-300" /> Impact
                                </p>
                                <p className="text-xl font-bold text-white text-nowrap tracking-tighter">{placements.length} Total Placements</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                                <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Activity size={10} className="text-green-300" /> Productivity
                                </p>
                                <p className="text-xl font-bold text-white tracking-tighter">{pending_tasks.length} Pending Tasks</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {is_birthday && (
                <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-8 rounded-3xl shadow-xl animate-pulse border-4 border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">🎁</div>
                    <div className="flex items-center justify-between text-white relative z-10">
                        <div className="flex items-center gap-6">
                            <span className="text-6xl hidden sm:block">🎂</span>
                            <div>
                                <h2 className="text-4xl font-black tracking-tight drop-shadow-md">It's Your Special Day! 🎈</h2>
                                <p className="text-xl font-bold opacity-90 mt-1 max-w-2xl">Happy Birthday, {employee_info.name}! Wishing you a year of immense growth and happiness. Enjoy every moment! 🥳✨</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-1 grid grid-cols-3 lg:grid-cols-6 h-auto mb-8 shadow-sm">
                    <TabsTrigger value="overview" className="rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                        <div className="flex items-center gap-2">
                            <Home size={14} /> <span className="hidden sm:inline">Overview</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="candidates" className="rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                        <div className="flex items-center gap-2">
                            <Users size={14} /> <span className="hidden sm:inline">Candidates</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                        <div className="flex items-center gap-2">
                            <ClipboardList size={14} /> <span className="hidden sm:inline">Tasks</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="placements" className="rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                        <div className="flex items-center gap-2">
                            <Briefcase size={14} /> <span className="hidden sm:inline">Placements</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="job-help" className="rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                        <div className="flex items-center gap-2">
                            <HelpingHand size={14} /> <span className="hidden sm:inline">Job Help</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="classes" className="rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                        <div className="flex items-center gap-2">
                            <PlayCircle size={14} /> <span className="hidden sm:inline">Sessions</span>
                        </div>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab Content (Matches Candidate Phase Cards) */}
                <TabsContent value="overview" className="mt-0 space-y-8 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DashboardPhaseCard
                            title="Placements"
                            icon={<Briefcase />}
                            color="blue"
                            value={placements.length}
                            subtitle="Total Successfully Managed"
                            status="active"
                        />
                        <DashboardPhaseCard
                            title="Preparation"
                            icon={<GraduationCap />}
                            color="purple"
                            value={assigned_prep_candidates.length}
                            subtitle="Active Prep Candidates"
                            status="completed"
                        />
                        <DashboardPhaseCard
                            title="Marketing"
                            icon={<Target />}
                            color="green"
                            value={assigned_marketing_candidates.length}
                            subtitle="Candidates in Marketing"
                            status="completed"
                        />
                        <DashboardPhaseCard
                            title="Tasks"
                            icon={<ClipboardList />}
                            color="orange"
                            value={pending_tasks.length}
                            subtitle="Open Action Items"
                            status="active"
                        />
                    </div>
                </TabsContent>

                {/* Candidates Tab */}
                <TabsContent value="candidates" className="outline-none">
                    <Card className="rounded-[32px] border-2 border-gray-100 shadow-xl overflow-hidden bg-white/70 backdrop-blur-sm">
                        <CardHeader className="bg-purple-50/50 p-8 border-b border-purple-100">
                            <CardTitle className="text-2xl font-black text-purple-800 italic flex items-center gap-3">
                                <GraduationCap className="text-purple-600" /> Prep Candidates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead className="sticky top-0 bg-white border-b text-xs font-black uppercase text-gray-400 tracking-widest">
                                        <tr>
                                            <th className="text-left p-6 w-1/4">Candidate</th>
                                            <th className="text-left p-6 w-1/4">Prep Status</th>
                                            <th className="text-left p-6 w-1/4">Marketing Status</th>
                                            <th className="text-right p-6 w-1/4">Joined</th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="overflow-y-auto max-h-[500px]">
                                    <table className="w-full table-fixed">
                                        <tbody className="divide-y divide-gray-50">
                                            {assigned_prep_candidates.map(c => {
                                                // Check if this candidate is in marketing
                                                const inMarketing = assigned_marketing_candidates.some(
                                                    mc => mc.candidate_id === c.candidate_id
                                                );

                                                return (
                                                    <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                                                        <td className="p-6 font-bold text-gray-800 w-1/4">{c.full_name || c.candidate_name || 'N/A'}</td>
                                                        <td className="p-6 w-1/4">
                                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase">
                                                                {c.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-6 w-1/4">
                                                            {inMarketing ? (
                                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">
                                                                    In Marketing
                                                                </span>
                                                            ) : (
                                                                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase">
                                                                    Not in Marketing
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-6 text-right font-medium text-gray-400 w-1/4">{c.start_date || 'N/A'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pending_tasks.map(task => (
                            <div key={task.id} className="group p-8 rounded-[32px] bg-white border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between min-h-[280px]">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${task.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {task.priority} Priority
                                        </span>
                                        <div className={`p-3 rounded-xl ${task.status === 'in_progress' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <ClipboardList size={18} />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-800 leading-tight mb-4 group-hover:text-blue-600 transition-colors">{task.task}</h3>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter text-gray-400 pt-6 border-t border-dashed">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} />
                                        {task.due_date ? `Deadline: ${task.due_date}` : 'No deadline'}
                                    </div>
                                    <span className="opacity-40">#{task.id}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* Placements Tab */}
                <TabsContent value="placements" className="outline-none">
                    <Card className="rounded-[40px] border-2 border-gray-100 shadow-2xl overflow-hidden bg-white/70 backdrop-blur-md">
                        <CardHeader className="p-10 border-b border-gray-100">
                            <CardTitle className="text-3xl font-black italic tracking-tighter text-gray-900">Historical Honors</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            <th className="text-left p-8">Candidate</th>
                                            <th className="text-left p-8">Company</th>
                                            <th className="text-left p-8">Role</th>
                                            <th className="text-left p-8">Status</th>
                                            <th className="text-right p-8">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {placements.map(p => (
                                            <tr key={p.id} className="hover:bg-blue-50/30 transition-all group">
                                                <td className="p-8 font-black text-gray-800">{p.candidate_name || 'Anonymous'}</td>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:bg-white group-hover:shadow-md transition-all">🏢</div>
                                                        <span className="font-bold text-gray-700">{p.company}</span>
                                                    </div>
                                                </td>
                                                <td className="p-8 font-bold text-blue-600">{p.position}</td>
                                                <td className="p-8">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="p-8 text-right font-bold text-gray-400">{p.placement_date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Job Help Tab */}
                <TabsContent value="job-help" className="outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {job_help_candidates.map(job => (
                            <div key={job.id} className="group relative bg-white p-10 rounded-[40px] border-2 border-gray-100 hover:border-green-400 transition-all duration-500 shadow-xl hover:shadow-2xl overflow-hidden min-h-[350px] flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-12 opacity-5 -mr-4 -mt-4 rotate-12 group-hover:scale-125 transition-transform duration-700">
                                    <HelpingHand size={160} />
                                </div>
                                <div className="relative">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="bg-green-100 p-5 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-green-100 group-hover:shadow-green-200">
                                            <HelpingHand size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-2xl text-gray-800 group-hover:text-green-700 transition-colors tracking-tighter">{job.candidate_name || 'Anonymous'}</h4>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Live Support Mode</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-8 border-t border-dashed border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Company</span>
                                            <span className="font-bold text-gray-700">{job.company}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Role</span>
                                            <span className="font-bold text-blue-600">{job.position}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 flex justify-end">
                                    <div className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-all">EST. {job.placement_date}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* Sessions Tab */}
                <TabsContent value="classes" className="outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px]">
                        <Card className="rounded-[40px] border-2 border-gray-100 shadow-2xl overflow-hidden bg-white h-full flex flex-col">
                            <CardHeader className="bg-indigo-50/50 p-8 border-b border-indigo-100">
                                <CardTitle className="text-2xl font-black text-indigo-800 italic flex items-center gap-3">
                                    <Video className="text-indigo-600" /> Archive Records
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-0">
                                <div className="divide-y divide-gray-50">
                                    {classes.map(c => (
                                        <div key={c.id} className="p-8 hover:bg-indigo-50/30 transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl group-hover:bg-white group-hover:shadow-md transition-all">📺</div>
                                                <div>
                                                    <p className="font-black text-gray-800 leading-tight mb-1">{c.description}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{c.classdate}</p>
                                                </div>
                                            </div>
                                            <a href={c.link} target="_blank" className="px-6 py-2 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                                                Play
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[40px] border-2 border-gray-100 shadow-2xl overflow-hidden bg-white h-full flex flex-col">
                            <CardHeader className="bg-pink-50/50 p-8 border-b border-pink-100">
                                <CardTitle className="text-2xl font-black text-pink-800 italic flex items-center gap-3">
                                    <Calendar className="text-pink-600" /> Operational Ops
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-0">
                                <div className="divide-y divide-gray-50">
                                    {sessions.map(s => (
                                        <div key={s.sessionid} className="p-8 hover:bg-pink-50/30 transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl group-hover:bg-white group-hover:shadow-md transition-all">📡</div>
                                                <div>
                                                    <p className="font-black text-gray-800 leading-tight mb-1">{s.title}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.sessiondate}</p>
                                                </div>
                                            </div>
                                            {s.link && (
                                                <a href={s.link} target="_blank" className="px-6 py-2 bg-white text-pink-600 border-2 border-pink-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-all shadow-sm">
                                                    Join Ops
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
