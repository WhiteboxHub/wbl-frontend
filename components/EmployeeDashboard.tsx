"use client";

import React, { useEffect, useState } from "react";
import {
    Briefcase, GraduationCap, ClipboardList,
    HelpingHand, Video, Activity, Award,
    CheckCircle, PlayCircle,
    Home, Users, Loader, Layers
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
    startdate?: string;
    dob?: string;
    status: number;
    state?: string;
    aadhaar?: string;
    instructor?: number;
    address?: string;
    notes?: string;
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

interface Job {
    id: number;
    unique_id: string;
    name: string;
    category: string;
    description?: string;
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
    candidate_metrics: {
        prep_count: number;
        marketing_count: number;
        placement_count: number;
    };
    task_metrics: {
        total_completed: number;
        total_pending: number;
        total_in_progress: number;
    };
    jobs: Job[];
    jobs_count: number;
    pending_tasks: Task[];
    completed_task_count: number;
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
                    <h3 className="text-xl font-black text-black-800 tracking-tight">{title}</h3>
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
                <p className="text-4xl font-black tracking-tighter text-black-900 mb-1">{value}</p>
                <p className="text-xs font-bold text-black-500 tracking-wide">{subtitle}</p>
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
                console.log(" Fetching employee dashboard data...");
                setLoading(true);
                setError(null);

                const metrics = await apiFetch("/metrics/employee");
                console.log(" Employee dashboard data received:", metrics);

                setData(metrics);
            } catch (err: any) {
                console.error(" Dashboard error:", err);
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

    const calculateExperience = (startDateStr?: string) => {
        if (!startDateStr) return "Active Member";
        try {
            const start = new Date(startDateStr);
            const now = new Date();

            let years = now.getFullYear() - start.getFullYear();
            let months = now.getMonth() - start.getMonth();

            if (months < 0) {
                years--;
                months += 12;
            }

            if (years === 0) {
                return `${months} ${months === 1 ? 'Month' : 'Months'}`;
            }
            return `${years} ${years === 1 ? 'Year' : 'Years'} ${months > 0 ? `${months}m` : ''}`;
        } catch (e) {
            return "Active Member";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-xl font-semibold animate-pulse text-black-500 flex items-center gap-3 justify-center mb-4">
                        <Loader className="animate-spin text-blue-500" /> Loading Dashboard...
                    </div>
                    <p className="text-sm text-black-400">Please wait while we fetch your data</p>
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
        candidate_metrics,
        task_metrics,
        jobs,
        jobs_count,
        pending_tasks,
        completed_task_count,
        job_help_candidates,
        classes,
        sessions,
        is_birthday
    } = data;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] shadow-2xl overflow-hidden relative border-4 border-white/20">
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="relative p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl border-2 border-white/30">
                            {employee_info.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                    </div>
                    <div className="flex-1 text-center lg:text-left text-white">
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-2">
                            Welcome, {employee_info.name}
                        </h1>
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
                <TabsList className="bg-white/50 dark:bg-black-800/50 backdrop-blur-md border border-black-200 dark:border-black-700 rounded-2xl p-1 grid grid-cols-3 lg:grid-cols-6 h-auto mb-8 shadow-sm">
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
                    <TabsTrigger value="jobs" className="rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                        <div className="flex items-center gap-2">
                            <Briefcase size={14} /> <span className="hidden sm:inline">Jobs</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                        <div className="flex items-center gap-2">
                            <ClipboardList size={14} /> <span className="hidden sm:inline">Tasks</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="placements" className="rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                        <div className="flex items-center gap-2">
                            <Layers size={14} /> <span className="hidden sm:inline">Placements</span>
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

                {/* Overview Tab Content (Detailed Employee Info) */}
                <TabsContent value="overview" className="mt-0 space-y-8 outline-none">
                    <Card className="rounded-[32px] border-2 border-black-100 shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-black-50 to-white p-6 border-b border-black-100">
                            <CardTitle className="text-lg font-black text-black-800 flex items-center gap-3">
                                <Users className="text-indigo-500" size={20} /> Personal Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
                                <div className="space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Employment Status</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-bold text-gray-800   uppercase tracking-tight">{employee_info.status === 1 ? 'Active' : 'Inactive'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Professional Email</p>
                                    <p className="text-lg font-bold text-gray-800  ">{employee_info.email}</p>
                                </div>
                                <div className="space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Contact Number</p>
                                    <p className="text-lg font-bold text-gray-800  ">{employee_info.phone || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Joining Date</p>
                                    <p className="text-lg font-bold text-gray-800  ">{employee_info.startdate ? new Date(employee_info.startdate).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div className="space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Date of Birth</p>
                                    <p className="text-lg font-bold text-gray-800  ">{employee_info.dob ? new Date(employee_info.dob).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div className="space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Base Location</p>
                                    <p className="text-lg font-bold text-gray-800  ">{employee_info.state || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Current Experience</p>
                                    <p className="text-lg font-bold text-gray-600   tracking-tight">{calculateExperience(employee_info.startdate)}</p>
                                </div>
                                <div className="space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Tasks Completed</p>
                                    <p className="text-lg font-bold text-gray-600  ">{completed_task_count}</p>
                                </div>
                                <div className="space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Aadhaar</p>
                                    <p className="text-lg font-bold text-gray-800  tracking-widest">{employee_info.aadhaar || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Instructor</p>
                                    <p className="text-lg font-bold text-gray-800 ">{employee_info.instructor === 1 ? 'YES' : 'NO'}</p>
                                </div>
                                <div className="md:col-span-1 lg:col-span-1 space-y-1 group">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black-400 group-hover:text-indigo-500 transition-colors">Permanent Address</p>
                                    <p className="text-base font-bold text-gray-800 leading-snug">{employee_info.address || 'No address on file'}</p>
                                </div>

                                {/* Metrics Section Divider */}
                                <div className="md:col-span-2 lg:col-span-3 pt-6 border-t border-black-50">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Placements</p>
                                            <p className="text-2xl font-black text-blue-600">{candidate_metrics.placement_count}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Preparation</p>
                                            <p className="text-2xl font-black text-purple-600">{candidate_metrics.prep_count}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Marketing</p>
                                            <p className="text-2xl font-black text-green-600">{candidate_metrics.marketing_count}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Pending Tasks</p>
                                            <p className="text-2xl font-black text-orange-600">{task_metrics.total_pending}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">In Progress</p>
                                            <p className="text-2xl font-black text-cyan-600">{task_metrics.total_in_progress}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Jobs</p>
                                            <p className="text-2xl font-black text-indigo-600">{jobs_count}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Jobs Tab */}
                <TabsContent value="jobs" className="outline-none">
                    <Card className="rounded-[32px] border-2 border-black-100 shadow-xl overflow-hidden bg-white/70 backdrop-blur-sm">
                        <CardHeader className="bg-blue-50/50 p-8 border-b border-blue-100">
                            <CardTitle className="text-2xl font-black text-blue-800 flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center gap-3">
                                    <Briefcase className="text-blue-600" /> My Jobs Management
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead className="sticky top-0 bg-white border-b text-xs font-black uppercase text-black-400 tracking-widest">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-bold">Unique ID</th>
                                            <th className="text-left px-5 py-5 font-bold ">Job Name</th>
                                            <th className="text-left px-4 py-3 font-bold">Category</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black-50">
                                        {jobs.length > 0 ? jobs.map(j => (
                                            <tr key={j.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-4 py-3 font-medium text-black-500 text-sm uppercase">{j.unique_id}</td>
                                                <td className="px-4 py-3 font-medium text-black-800 text-sm">{j.name}</td>
                                                <td className="px-4 py-3 text-left   ">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${j.category === 'automation' ? 'bg-cyan-100 text-cyan-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {j.category}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="p-12 text-center text-black-400 font-medium ">No jobs assigned to your profile</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Candidates Tab */}
                <TabsContent value="candidates" className="outline-none">
                    <Card className="rounded-[32px] border-2 border-black-100 shadow-xl overflow-hidden bg-white/70 backdrop-blur-sm">
                        <CardHeader className="bg-purple-50/50 p-8 border-b border-purple-100">
                            <CardTitle className="text-2xl font-black text-purple-600 flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="text-purple-500" /> Prep & Marketing
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead className="sticky top-0 bg-white border-b text-xs font-black uppercase text-black-400 tracking-widest">
                                        <tr>
                                            <th className="text-left px-4 py-3">Candidate</th>
                                            <th className="text-left px-4 py-3">Prep Status</th>
                                            <th className="text-left px-4 py-3">Marketing Status</th>
                                            <th className="text-left px-4 py-2">Joined</th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="overflow-y-auto max-h-[500px]">
                                    <table className="w-full table-fixed">
                                        <tbody className="divide-y divide-black-50">
                                            {assigned_prep_candidates.map(c => {
                                                const inMarketing = assigned_marketing_candidates.some(
                                                    mc => {
                                                        const mcId = Number(mc.candidate_id);
                                                        const cId = Number(c.candidate_id);
                                                        return mcId === cId;
                                                    }
                                                );

                                                return (
                                                    <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-black-800 text-sm">{c.full_name || c.candidate_name || 'N/A'}</td>
                                                        <td className="px-4 py-3   ">
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[9px] font-black uppercase">
                                                                {c.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3   ">
                                                            {inMarketing ? (
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase">
                                                                    In Marketing
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-black-100 text-black-500 rounded-full text-[9px] font-black uppercase">
                                                                    Not in Marketing
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-left font-medium text-black-400 text-sm">{c.start_date || 'N/A'}</td>
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
                    <Card className="rounded-[32px] border-2 border-black-100 shadow-xl overflow-hidden bg-white/70 backdrop-blur-sm">
                        <CardHeader className="bg-blue-50/50 p-6 border-b border-blue-100">
                            <CardTitle className="text-xl font-black text-blue-800 flex items-center gap-3">
                                <ClipboardList className="text-blue-600" size={20} /> My Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead className="sticky top-0 bg-white border-b text-xs font-black uppercase text-black-400 tracking-widest">
                                        <tr>
                                            <th className="text-left px-4 py-3 w-2/5">Task Name</th>
                                            <th className="text-left px-4 py-3 w-1/5">Status</th>
                                            <th className="text-left px-4 py-3 w-1/5">Overdue</th>
                                            <th className="text-left px-4 py-3 w-1/5">Due Date</th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="overflow-y-auto max-h-[400px]">
                                    <table className="w-full table-fixed">
                                        <tbody className="divide-y divide-black-50">
                                            {pending_tasks.length > 0 ? (
                                                pending_tasks.map(task => {
                                                    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                                                    return (
                                                        <tr key={task.id} className="hover:bg-blue-50/30 transition-colors">
                                                            <td className="px-4 py-3 font-semibold text-black-800 w-2/5 text-sm">{task.task}</td>
                                                            <td className="px-4 py-3 w-1/5">
                                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${task.status === 'in_progress'
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : task.status === 'completed'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-blue-100 text-blue-700'
                                                                    }`}>
                                                                    {task.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 w-1/5">
                                                                {task.due_date ? (
                                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${isOverdue
                                                                        ? 'bg-red-100 text-red-700'
                                                                        : 'bg-green-100 text-green-700'
                                                                        }`}>
                                                                        {isOverdue ? 'Overdue' : 'On Track'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-black-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-left font-medium text-black-600 w-1/5 text-sm">
                                                                {task.due_date || 'No deadline'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-black-400 font-medium text-sm">
                                                        No pending tasks
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Placements Tab */}
                <TabsContent value="placements" className="outline-none">
                    <Card className="rounded-[40px] border-2 border-black-100 shadow-2xl overflow-hidden bg-white/70 backdrop-blur-md">
                        <CardHeader className="p-10 border-b border-black-100">
                            <CardTitle className="text-3xl font-black  tracking-tighter text-black-900">Placements</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-white border-b text-[10px] font-black uppercase tracking-[0.2em] text-black-400">
                                        <tr>
                                            <th className="text-left px-4 py-3">Candidate</th>
                                            <th className="text-left px-4 py-3">Company</th>
                                            <th className="text-left px-4 py-3">Role</th>
                                            <th className="text-left px-4 py-3">Status</th>
                                            <th className="text-right px-4 py-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black-100">
                                        {placements.map(p => (
                                            <tr key={p.id} className="hover:bg-blue-50/30 transition-all group font-medium text-sm">
                                                <td className="px-4 py-3 font-black text-black-800">{p.candidate_name || 'Anonymous'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-black-700">{p.company}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-blue-600">{p.position}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-black-100 text-black-500'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-black-400">{p.placement_date}</td>
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
                            <div key={job.id} className="group relative bg-white p-10 rounded-[40px] border-2 border-black-100 hover:border-green-400 transition-all duration-500 shadow-xl hover:shadow-2xl overflow-hidden min-h-[350px] flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-12 opacity-5 -mr-4 -mt-4 rotate-12 group-hover:scale-125 transition-transform duration-700">
                                    <HelpingHand size={100} />
                                </div>
                                <div className="relative">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="bg-green-100 p-5 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-green-100 group-hover:shadow-green-200">
                                            <HelpingHand size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-2xl text-black-800 group-hover:text-green-700 transition-colors tracking-tighter">{job.candidate_name || 'Anonymous'}</h4>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Live Support Mode</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-8 border-t border-dashed border-black-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-black-300 tracking-widest">Company</span>
                                            <span className="font-bold text-black-700">{job.company}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-black-300 tracking-widest">Role</span>
                                            <span className="font-bold text-blue-600">{job.position}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 flex justify-end">
                                    <div className="px-4 py-2 bg-black-50 rounded-xl text-[10px] font-black text-black-400 group-hover:bg-green-50 group-hover:text-green-600 transition-all">EST. {job.placement_date}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* Sessions Tab */}
                <TabsContent value="classes" className="outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                        <Card className="rounded-[32px] border-2 border-black-100 shadow-xl overflow-hidden bg-white h-full flex flex-col">
                            <CardHeader className="bg-indigo-50/50 p-6 border-b border-indigo-100">
                                <CardTitle className="text-xl font-black text-indigo-800  flex items-center gap-3">
                                    <Video className="text-indigo-600" size={20} /> Classes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-0">
                                <div className="divide-y divide-black-50">
                                    {classes.length > 0 ? classes.map(c => (
                                        <div key={c.id} className="p-4 hover:bg-indigo-50/30 transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-sm font-bold group-hover:bg-white group-hover:shadow-sm transition-all">C</div>
                                                <div>
                                                    <p className="font-bold text-black-800 leading-tight mb-0.5 text-sm">{c.description}</p>
                                                </div>
                                            </div>
                                            <a href={c.link} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 bg-white text-indigo-600 border-2 border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
                                                View
                                            </a>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-black-400 text-sm text-nowrap">No class records found</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[32px] border-2 border-black-100 shadow-xl overflow-hidden bg-white h-full flex flex-col">
                            <CardHeader className="bg-purple-50/50 p-6 border-b border-purple-100">
                                <CardTitle className="text-xl font-black text-purple-800 flex items-center gap-3">
                                    <Activity className="text-purple-600" size={20} /> Sessions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-0">
                                <div className="divide-y divide-black-50">
                                    {sessions.length > 0 ? sessions.map(s => (
                                        <div key={s.sessionid} className="p-4 hover:bg-purple-50/30 transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-sm font-bold group-hover:bg-white group-hover:shadow-sm transition-all">S</div>
                                                <div>
                                                    <p className="font-bold text-black-800 leading-tight mb-0.5 text-sm">{s.title}</p>
                                                </div>
                                            </div>
                                            {s.link && (
                                                <a href={s.link} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 bg-white text-purple-600 border-2 border-purple-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all">
                                                    View
                                                </a>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-black-400 text-sm text-nowrap">No sessions found</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
