"use client";

import React, { useEffect, useState } from "react";
import {
    Briefcase, GraduationCap, ClipboardList,
    HelpingHand, Video, Activity, Award,
    CheckCircle, PlayCircle,
    Home, Users, Layers, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin_ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin_ui/tabs";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";
import { useAuth } from "@/utils/AuthContext";
import { useRouter } from "next/navigation";

// Types
interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

const MetricCard = ({ title, value, icon }: MetricCardProps) => (
    <div className="bg-white border border-purple-100 dark:bg-dark dark:border-darklight rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative">
        <div className="flex justify-between items-start mb-4">
            <p className="text-[13px] font-semibold text-gray-500 tracking-tight">{title}</p>
            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                {React.cloneElement(icon as React.ReactElement, { size: 18 })}
            </div>
        </div>
        <div>
            <p className="text-xl font-black text-black dark:text-white tracking-tight leading-tight">{value}</p>
        </div>
    </div>
);

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
    full_name: string;
    status: string;
    other_instructors: string;
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
    candidates: Candidate[];
    candidate_metrics: {
        total_count: number;
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

function EmployeeDashboardContent() {
    const [data, setData] = useState<EmployeeDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const showLoader = useMinimumLoadingTime(loading);
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

    if (showLoader) {
        return <Loader text="Loading Dashboard..." />;
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
        candidates,
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
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12 pt-8">
            {is_birthday && (
                <div className="bg-white p-12 rounded-3xl border border-purple-100 shadow-xl relative overflow-hidden mb-12 transform hover:scale-[1.01] transition-all">
                    <div className="absolute top-0 right-0 p-16 text-purple-600 opacity-10 rotate-12 transition-transform duration-1000">
                        <Award size={140} />
                    </div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-4xl text-purple-600"></span>
                                <div className="h-0.5 w-20 bg-purple-100"></div>
                            </div>
                            <h2 className="text-5xl font-black tracking-tighter mb-4 leading-none text-black">Happy Birthday,<br />{employee_info.name}!</h2>
                            <p className="text-gray-500 text-lg max-w-xl font-medium leading-relaxed">Wishing you a year filled with success, joy, and new milestones. Your contribution to WBL is truly valued.</p>
                        </div>
                        <div className="hidden xl:flex flex-col items-end gap-2 text-purple-600">
                            <div className="px-6 py-2 bg-purple-100 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                Special Occasion
                            </div>
                            <p className="text-4xl font-black italic opacity-20 tracking-tighter">WBL TEAM</p>
                        </div>
                    </div>
                </div>
            )}

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-gray-50 border-2 border-gray-100 dark:bg-darklight dark:border-darklight rounded-xl p-1 flex flex-wrap lg:flex-nowrap h-auto mb-10 shadow-sm gap-1 w-fit">
                    <TabsTrigger value="overview" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 transition-all font-bold text-sm text-gray-500 bg-transparent">
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="candidates" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 transition-all font-bold text-sm text-gray-500 bg-transparent">
                        Candidates
                    </TabsTrigger>
                    <TabsTrigger value="jobs" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 transition-all font-bold text-sm text-gray-500 bg-transparent">
                        Jobs
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 transition-all font-bold text-sm text-gray-500 bg-transparent">
                        Tasks
                    </TabsTrigger>
                    <TabsTrigger value="placements" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 transition-all font-bold text-sm text-gray-500 bg-transparent">
                        Placements
                    </TabsTrigger>
                    <TabsTrigger value="job-help" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 transition-all font-bold text-sm text-gray-500 bg-transparent">
                        Job Help
                    </TabsTrigger>
                    <TabsTrigger value="classes" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 transition-all font-bold text-sm text-gray-500 bg-transparent">
                        Sessions
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab Content */}
                <TabsContent value="overview" className="mt-0 space-y-8 outline-none animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <MetricCard title="Placements" value={candidate_metrics.placement_count} icon={<Award />} />
                        <MetricCard title="Preparation" value={candidate_metrics.prep_count} icon={<GraduationCap />} />
                        <MetricCard title="Marketing" value={candidate_metrics.marketing_count} icon={<TrendingUp />} />
                        <MetricCard title="Pending Tasks" value={task_metrics.total_pending} icon={<ClipboardList />} />
                        <MetricCard title="In Progress" value={task_metrics.total_in_progress} icon={<Activity />} />
                        <MetricCard title="Total Jobs" value={jobs_count} icon={<Briefcase />} />
                    </div>

                    <Card className="rounded-3xl border border-gray-100 shadow-xl bg-white dark:bg-dark dark:border-darklight overflow-hidden">
                        <CardHeader className="bg-white dark:bg-dark dark:border-darklight border-b border-gray-100 p-5">
                            <CardTitle className="text-xl font-black text-purple-700 flex items-center gap-3">
                                <Users size={24} /> Detailed Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-12">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Employment Status</p>
                                    <p className="text-lg font-bold text-black dark:text-white uppercase">{employee_info.status === 1 ? 'Active' : 'Inactive'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Professional Email</p>
                                    <p className="text-lg font-bold text-black dark:text-white">{employee_info.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Contact Number</p>
                                    <p className="text-lg font-bold text-black dark:text-white">{employee_info.phone || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Joining Date</p>
                                    <p className="text-lg font-bold text-black dark:text-white">{employee_info.startdate ? new Date(employee_info.startdate).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Date of Birth</p>
                                    <p className="text-lg font-bold text-black dark:text-white">{employee_info.dob ? new Date(employee_info.dob).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Base Location</p>
                                    <p className="text-lg font-bold text-black dark:text-white">{employee_info.state || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Current Experience</p>
                                    <p className="text-lg font-bold text-black dark:text-white">{calculateExperience(employee_info.startdate)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Tasks Completed</p>
                                    <p className="text-lg font-bold text-black dark:text-white">{completed_task_count}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Aadhaar</p>
                                    <p className="text-lg font-bold text-black dark:text-white tracking-widest">{employee_info.aadhaar || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Instructor Status</p>
                                    <p className="text-lg font-bold text-black dark:text-white">{employee_info.instructor === 1 ? 'Authorized' : 'Standard'}</p>
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Permanent Address</p>
                                    <p className="text-lg font-bold text-black dark:text-white leading-snug">{employee_info.address || 'No address on file'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Jobs Tab */}
                <TabsContent value="jobs" className="outline-none animate-fadeIn">
                    <Card className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden bg-white dark:bg-dark dark:border-darklight">
                        <CardHeader className="bg-white dark:bg-dark dark:border-dark border-b border-gray-100 p-8">
                            <CardTitle className="text-xl font-black text-purple-700 flex items-center gap-3">
                                <Briefcase size={24} /> My Jobs Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead className="sticky top-0 bg-gray-50 border-b text-[11px] font-bold uppercase dark:bg-darklight dark:text-gray-300 dark:border-dark text-gray-500 tracking-wider">
                                        <tr>
                                            <th className="text-left px-8 py-5">Unique ID</th>
                                            <th className="text-left px-8 py-5">Job Name</th>
                                            <th className="text-left px-8 py-5">Category</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {jobs.length > 0 ? jobs.map(j => (
                                            <tr key={j.id} className="hover:bg-gray-50/50 dark:hover:bg-darklight/50 transition-colors">
                                                <td className="px-8 py-4 font-medium text-black dark:text-white text-sm uppercase">{j.unique_id}</td>
                                                <td className="px-8 py-4 font-bold text-black dark:text-white text-sm">{j.name}</td>
                                                <td className="px-8 py-4 text-left">
                                                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                        {j.category}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="p-16 text-center text-gray-400 font-bold">No jobs assigned to your profile</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="candidates" className="outline-none animate-fadeIn">
                    <Card className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden bg-white dark:bg-dark dark:border-darklight">
                        <CardHeader className="bg-white dark:bg-dark dark:border-dark border-b border-gray-100 p-8">
                            <CardTitle className="text-xl font-black text-purple-700 flex items-center gap-3">
                                <GraduationCap size={24} /> Candidates Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead className="sticky top-0 bg-gray-50 border-b text-[11px] font-bold uppercase text-gray-500 dark:bg-darklight dark:text-gray-300 dark:border-dark tracking-wider">
                                        <tr>
                                            <th className="text-left px-8 py-5">Candidate</th>
                                            <th className="text-left px-8 py-5">Status</th>
                                            <th className="text-left px-8 py-5">Other Instructors</th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="overflow-y-auto max-h-[500px]">
                                    <table className="w-full table-fixed">
                                        <tbody className="divide-y divide-gray-100">
                                            {candidates.map(c => (
                                                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-darklight/50 transition-colors text-sm">
                                                    <td className="px-8 py-4 font-bold text-black dark:text-white">{c.full_name}</td>
                                                    <td className="px-8 py-4">
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${c.status === "In Marketing"
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-purple-50 text-purple-700'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4 font-medium text-black dark:text-white">
                                                        {c.other_instructors}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="outline-none animate-fadeIn">
                    <Card className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden bg-white dark:bg-dark dark:border-darklight">
                        <CardHeader className="bg-white border-b border-gray-100 p-8 dark:bg-dark dark:border-dark ">
                            <CardTitle className="text-xl font-black text-purple-700 flex items-center gap-3">
                                <ClipboardList size={24} /> Task Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead className="sticky top-0 bg-gray-50 border-b text-[11px] font-bold uppercase text-gray-500 dark:bg-darklight dark:text-gray-300 dark:border-dark tracking-wider">
                                        <tr>
                                            <th className="text-left px-8 py-5 w-2/5">Task Name</th>
                                            <th className="text-left px-8 py-5 w-1/5">Status</th>
                                            <th className="text-left px-8 py-5 w-1/5">Overdue</th>
                                            <th className="text-left px-8 py-5 w-1/5 text-right">Due Date</th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="overflow-y-auto max-h-[400px]">
                                    <table className="w-full table-fixed">
                                        <tbody className="divide-y divide-gray-100 text-sm">
                                            {pending_tasks.length > 0 ? (
                                                pending_tasks.map(task => {
                                                    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                                                    return (
                                                        <tr key={task.id} className="hover:bg-gray-50/50 dark:hover:bg-darklight/50 transition-colors">
                                                            <td className="px-8 py-4 font-bold text-black dark:text-white w-2/5">{task.task}</td>
                                                            <td className="px-8 py-4 w-1/5">
                                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${task.status === 'in_progress'
                                                                    ? 'bg-purple-600 text-white'
                                                                    : 'bg-gray-100 text-gray-500'
                                                                    }`}>
                                                                    {task.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-4 w-1/5">
                                                                {task.due_date ? (
                                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isOverdue
                                                                        ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                                                                        : 'bg-purple-100 text-purple-700'
                                                                        }`}>
                                                                        {isOverdue ? 'Overdue' : 'On Track'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-4 text-right font-medium text-gray-500 w-1/5">
                                                                {task.due_date || 'No deadline'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="p-20 text-center text-gray-400 font-bold">No active tasks</td>
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
                <TabsContent value="placements" className="outline-none animate-fadeIn">
                    <Card className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden bg-white dark:bg-dark dark:border-darklight">
                        <CardHeader className="bg-white border-b border-gray-100 dark:bg-dark dark:border-darklight p-8">
                            <CardTitle className="text-xl font-black text-purple-700 flex items-center gap-3">
                                <Layers size={24} /> Professional Placements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-gray-50 border-b text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:bg-darklight dark:text-gray-300 dark:border-dark">
                                        <tr>
                                            <th className="text-left px-8 py-5">Candidate</th>
                                            <th className="text-left px-8 py-5">Company</th>
                                            <th className="text-left px-8 py-5">Role</th>
                                            <th className="text-left px-8 py-5">Status</th>
                                            <th className="text-right px-8 py-5">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {placements.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-darklight/50 transition-all group font-medium text-sm">
                                                <td className="px-8 py-4 font-bold text-black dark:text-white">{p.candidate_name || 'Anonymous'}</td>
                                                <td className="px-8 py-4">{p.company}</td>
                                                <td className="px-8 py-4 font-bold text-black dark:text-white">{p.position}</td>
                                                <td className="px-8 py-4">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${p.status === 'Active' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-right font-bold text-gray-400">{p.placement_date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Job Help Tab */}
                <TabsContent value="job-help" className="outline-none animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {job_help_candidates.map(job => (
                            <div key={job.id} className="group relative bg-white p-10 rounded-3xl border border-purple-50 hover:border-purple-200 dark:bg-dark dark:border-darklight dark:hover:border-purple-500 transition-all duration-500 shadow-xl overflow-hidden min-h-[350px] flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-12 text-purple-600 opacity-5 -mr-4 -mt-4 rotate-12 group-hover:scale-125 transition-all">
                                    <HelpingHand size={100} />
                                </div>
                                <div className="relative">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="bg-purple-100 p-5 rounded-2xl text-purple-600">
                                            <HelpingHand size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-2xl text-black dark:text-white tracking-tighter">{job.candidate_name || 'Anonymous'}</h4>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live Member Support</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-8 border-t border-dashed border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Company</span>
                                            <span className="font-bold text-black dark:text-white">{job.company}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Role</span>
                                            <span className="font-bold text-black dark:text-white">{job.position}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 flex justify-end">
                                    <div className="px-4 py-2 bg-purple-50 rounded-xl text-[10px] font-black text-purple-700 uppercase tracking-widest leading-none">Placed: {job.placement_date}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* Sessions Tab */}
                <TabsContent value="classes" className="outline-none animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                        <Card className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden bg-white dark:bg-dark dark:border-darklight h-full flex flex-col">
                            <CardHeader className="bg-white border-b border-gray-100 dark:bg-dark dark:border-dark p-8">
                                <CardTitle className="text-xl font-black text-purple-700 flex items-center gap-3">
                                    <Video size={24} /> Training Classes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-0">
                                <div className="divide-y divide-gray-100">
                                    {classes.length > 0 ? classes.map(c => (
                                        <div key={c.id} className="px-8 py-6 hover:bg-purple-50/50 transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-sm font-black shadow-sm">C</div>
                                                <div>
                                                    <a href={c.link} target="_blank" rel="noopener noreferrer" className="font-bold text-black text-sm hover:text-purple-600 dark:text-white transition-colors">
                                                        {c.description}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No records found</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden bg-white dark:bg-dark dark:border-darklight h-full flex flex-col ">
                            <CardHeader className="bg-white border-b border-gray-100 dark:bg-dark dark:border-dark p-8">
                                <CardTitle className="text-xl font-black text-purple-700 flex items-center gap-3">
                                    <Activity size={24} /> Discussion Sessions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-0">
                                <div className="divide-y divide-gray-100">
                                    {sessions.length > 0 ? sessions.map(s => (
                                        <div key={s.sessionid} className="px-8 py-6 hover:bg-purple-50/50 transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-sm font-black shadow-sm">S</div>
                                                <div>
                                                    {s.link ? (
                                                        <a href={s.link} target="_blank" rel="noopener noreferrer" className="font-bold text-black text-sm hover:text-purple-600 transition-colors dark:text-white">
                                                            {s.title}
                                                        </a>
                                                    ) : (
                                                        <p className="font-bold text-black text-sm dark:text-white">{s.title}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No records found</div>
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

export default function EmployeeDashboardAvatarPage() {
    const { userRole, isAuthenticated } = useAuth();
    const router = useRouter();
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
            if (token && !isAuthenticated) {
                return;
            }

            if (!isAuthenticated && !token) {
                router.push("/login");
                return;
            }

            setAuthLoading(false);
        };

        checkAuth();
    }, [isAuthenticated, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-xl text-blue-600 font-bold">Checking Authentication...</div>
            </div>
        );
    }

    if (isAuthenticated && userRole !== "employee" && userRole !== "admin") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="text-gray-600">You must be an employee or admin to view this dashboard.</p>
                <button
                    onClick={() => router.push("/user_dashboard")}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Go to My Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
            <EmployeeDashboardContent />
        </div>
    );
}
