"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/AuthContext";
import {
  Users, Layers3, CalendarDays, GraduationCap, UserPlus, CalendarPlus, PieChart as PieChartIcon, Wallet, Banknote, TrendingUp, Briefcase, Award, CheckCircle2, Clock, Mic, BarChart2,
  ClipboardList, XCircle, Target, CakeIcon, PiggyBank, Handshake, Trophy, NotebookIcon, Pen, PencilOff,
  PenIcon, ChevronDown,
} from "lucide-react";
import { EnhancedMetricCard } from "@/components/EnhancedMetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin_ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin_ui/tabs";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import axios from "axios";
import { apiFetch } from "@/lib/api";

function formatDateFromDB(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

function normalizeDateString(dateStr: string | null | undefined) {
  if (!dateStr) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 10);
  }

  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    const [month, day, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
  }

  return dateStr;
}

function formatDateWithMonth(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const normalized = normalizeDateString(dateStr);
  const [year, month, day] = normalized.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
}


// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

// Types for API responses
interface EmployeeTask {
  id: number;
  employee_id: number;
  employee_name: string | null;
  task: string;
  assigned_date: string;
  due_date: string;
  status: string;
  priority: string;
  notes: string | null;
}

interface DashboardMetrics {
  batch_metrics: {
    current_active_batches: string;
    current_active_batches_count: number;
    enrolled_candidates_current: number;
    total_candidates: number;
    candidates_previous_batch: number;
    new_enrollments_month: number;
    candidate_status_breakdown: {
      active: number;
      break: number;
      discontinued: number;
      [key: string]: number;
    };
  };
  financial_metrics: {
    total_fee_current_batch: number;
    fee_collected_previous_batch: number;
    top_batches_fee: Array<{
      batch_name: string;
      total_fee: number;
      candidate_count: number;
    }>;
    placement_fee_metrics: {
      total_expected: number;
      total_collected: number;
      total_pending: number;
      collected_this_month: number;
      installment_stats?: {
        completed: number;
        pending: number;
      };
    };
  };
  placement_metrics: {
    total_placements: number;
    placements_year: number;
    placements_last_month: number;
    last_placement: {
      candidate_name: string;
      company: string;
      placement_date: string;
      position: string;
    } | null;
    active_placements: number;
  };
  interview_metrics: {
    upcoming_interviews: number;
    total_interviews: number;
    interviews_month: number;
    interviews_today: number;
    marketing_candidates: number;
    priority_1_candidates: number;
    priority_2_candidates: number;
    priority_3_candidates: number;
    feedback_breakdown: {
      Positive: number;
      Negative: number;
      No_Response: number;
      [key: string]: number;
    };
  };
  employee_task_metrics: {
    total_tasks: number;
    pending_tasks: number;
    in_progress_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
  };
  jobs_metrics: {
    total_job_types: number;
    total_activities: number;
    activities_today: number;
    activities_this_week: number;
    recent_activities: Array<{
      id: number;
      job_name: string;
      activity_date: string;
      activity_count: number;
      notes: string | null;
    }>;
  };
  my_tasks: EmployeeTask[] | null;
  my_jobs: any[] | null;
  employee_name: string | null;
}

interface UpcomingBatch {
  name: string;
  startdate: string;
  end_date: string;
}

interface Birthday {
  id: number;
  name: string;
  dob: string;
  wish?: string;
}

interface BirthdayResponse {
  today: Birthday[];
  upcoming: Birthday[];
}

interface Lead {
  id: number;
  full_name: string;
  entry_date: string;
  phone: string;
  email: string;
  workstatus?: string;
  status?: string;
}

interface LeadMetrics {
  total_leads: number;
  leads_this_month: number;
  latest_lead: Lead | null;
  leads_this_week: number;
  open_leads: number;
  closed_leads: number;
  future_leads: number;
}

interface LeadMetricsResponse {
  success: boolean;
  data: LeadMetrics;
  message: string;
}
interface CandidateInterviewPerformance {
  candidate_id: number;
  candidate_name: string;
  total_interviews: number;
  success_count: number;
}
interface PreparationMetrics {
  total_preparation_candidates: number;
  preparation_candidates: number;
  active_candidates: number;
  inactive_candidates: number;
}

interface VendorMetrics {
  total_vendors: number;
  today_extracted: number;
  week_extracted: number;
}


interface BatchClasses {
  batchname: string;
  classes_count: number;
}
// Hook for animated counters
function useCounter(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [target, duration]);
  return count;
}

export default function Index() {
  const router = useRouter();
  const { userRole } = useAuth() as { userRole: string };

  const [data, setData] = useState<CandidateInterviewPerformance[]>([]);
  const [time, setTime] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [upcomingBatches, setUpcomingBatches] = useState<UpcomingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [birthdays, setBirthdays] = useState<BirthdayResponse>({
    today: [],
    upcoming: [],
  });
  const [preparationMetrics, setPreparationMetrics] = useState<PreparationMetrics | null>(null);

  const [leadMetrics, setLeadMetrics] = useState<LeadMetrics | null>(null);
  const [activeTab, setActiveTab] = useState("batch");
  const [vendorMetrics, setVendorMetrics] = useState<VendorMetrics | null>(null);
  // const [emailReads, setEmailReads] = useState<EmailExtraction[]>([]);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  useEffect(() => {
    if (metrics?.employee_name && !loading) {
      // If we have an employee name but we are on the global dashboard, 
      // we might want to stay here if it's mixed, but the user requested 
      // to display the employee dashboard on login.
    }
  }, [metrics, loading]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileDropdownOpen && !target.closest('.mobile-dropdown')) {
        setIsMobileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileDropdownOpen]);

  useEffect(() => {
    const fetchInterviewPerformance = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/performance`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success) setData(data.data);
      } catch (err) {
        console.error("Error fetching interview performance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewPerformance();
  }, []);

  useEffect(() => {
    const fetchEmployeeBirthdays = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/employee-birthdays`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setBirthdays(data);
      } catch (err) {
        console.error("Error fetching birthdays:", err);
      }
    };

    fetchEmployeeBirthdays();
  }, []);

  useEffect(() => {
    const fetchLeadMetrics = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/leads/metrics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data: LeadMetricsResponse = await res.json();
        if (data.success) setLeadMetrics(data.data);
      } catch (err) {
        console.error("Error fetching lead metrics:", err);
      }
    };

    fetchLeadMetrics();
  }, []);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsData, batchesData] = await Promise.all([
          apiFetch("/metrics/all"),
          apiFetch("/upcoming-batches?limit=3")
        ]);

        setMetrics(metricsData);
        setUpcomingBatches(batchesData);
      } catch (err: any) {
        setError(err?.message || "An error occurred");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  useEffect(() => {
    const fetchPreparationMetrics = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const res = await axios.get(`${API_BASE_URL}/candidate/preparation/metrics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPreparationMetrics(res.data);
      } catch (error) {
        console.error("Error fetching preparation metrics:", error);
      }
    };

    fetchPreparationMetrics();
  }, []);

  useEffect(() => {
    const fetchVendorMetrics = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE_URL}/vendors/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setVendorMetrics(data);
      } catch (err) {
        console.error("Error fetching vendor metrics:", err);
      }
    };
    fetchVendorMetrics();
  }, []);



  useEffect(() => {
    const fetchBatchClasses = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await axios.get(`${API_BASE_URL}/batches/latest/classes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setBatchClasses(res.data);
      } catch (error) {
        console.error("Error fetching batch classes:", error);
      }
    };

    fetchBatchClasses();
  }, []);


  // Animated counters
  const enrolledCandidates = useCounter(metrics?.batch_metrics?.enrolled_candidates_current || 0);
  const totalCandidates = useCounter(metrics?.batch_metrics?.total_candidates || 0);
  const totalPlacements = useCounter(metrics?.placement_metrics?.total_placements || 0);
  const placementsYear = useCounter(metrics?.placement_metrics?.placements_year || 0);
  const placementsMonth = useCounter(metrics?.placement_metrics?.placements_last_month || 0);
  const activePlacements = useCounter(metrics?.placement_metrics?.active_placements || 0);
  const upcomingInterviews = useCounter(metrics?.interview_metrics?.upcoming_interviews || 0);
  const totalInterviews = useCounter(metrics?.interview_metrics?.total_interviews || 0);
  const interviewsThisMonth = useCounter(metrics?.interview_metrics?.interviews_month || 0);
  const interviewsToday = useCounter(metrics?.interview_metrics?.interviews_today || 0);
  const marketing_candidates = useCounter(metrics?.interview_metrics?.marketing_candidates || 0);
  const priority_1_candidates = useCounter(metrics?.interview_metrics?.priority_1_candidates || 0);
  const priority_2_candidates = useCounter(metrics?.interview_metrics?.priority_2_candidates || 0);
  const priority_3_candidates = useCounter(metrics?.interview_metrics?.priority_3_candidates || 0);
  const totalLeads = useCounter(leadMetrics?.total_leads || 0);
  const leadsThisMonth = useCounter(leadMetrics?.leads_this_month || 0);
  const leads_this_week = useCounter(leadMetrics?.leads_this_week || 0);
  const open_leads = useCounter(leadMetrics?.open_leads || 0);
  const closed_leads = useCounter(leadMetrics?.closed_leads || 0);
  const future_leads = useCounter(leadMetrics?.future_leads || 0);
  const total_preparation_candidates = useCounter(preparationMetrics?.total_preparation_candidates || 0);
  const active_candidates = useCounter(preparationMetrics?.active_candidates || 0);
  const inactive_candidates = useCounter(preparationMetrics?.inactive_candidates || 0);

  const totalExpectedFee = useCounter(metrics?.financial_metrics?.placement_fee_metrics?.total_expected || 0);
  const totalCollectedFee = useCounter(metrics?.financial_metrics?.placement_fee_metrics?.total_collected || 0);
  const totalPendingFee = useCounter(metrics?.financial_metrics?.placement_fee_metrics?.total_pending || 0);
  const collectedThisMonthFee = useCounter(metrics?.financial_metrics?.placement_fee_metrics?.collected_this_month || 0);
  const completedInstallmentsCount = useCounter(metrics?.financial_metrics?.placement_fee_metrics?.installment_stats?.completed || 0);
  const pendingInstallmentsCount = useCounter(metrics?.financial_metrics?.placement_fee_metrics?.installment_stats?.pending || 0);

  const totalTasks = useCounter(metrics?.employee_task_metrics?.total_tasks || 0);
  const pendingTasks = useCounter(metrics?.employee_task_metrics?.pending_tasks || 0);
  const inProgressTasks = useCounter(metrics?.employee_task_metrics?.in_progress_tasks || 0);
  const completedTasks = useCounter(metrics?.employee_task_metrics?.completed_tasks || 0);
  const overdueTasks = useCounter(metrics?.employee_task_metrics?.overdue_tasks || 0);
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();
  const todayextracted = useCounter(vendorMetrics?.today_extracted || 0);
  const weekextracted = useCounter(vendorMetrics?.week_extracted || 0);
  const totalJobTypes = useCounter(metrics?.jobs_metrics?.total_job_types || 0);
  const totalJobActivities = useCounter(metrics?.jobs_metrics?.total_activities || 0);
  const activitiesToday = useCounter(metrics?.jobs_metrics?.activities_today || 0);
  const activitiesThisWeek = useCounter(metrics?.jobs_metrics?.activities_this_week || 0);
  const [batchClasses, setBatchClasses] = useState<BatchClasses[]>([]);



  // Calculate derived metrics
  const averageFeePerCandidate = metrics ? Math.round((metrics.financial_metrics.total_fee_current_batch / Math.max(1, metrics.batch_metrics.enrolled_candidates_current))) : 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-2xl space-y-6 p-4">
        <div className="text-center">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-screen-2xl space-y-6 p-4">
        <div className="bg-red-100 p-4 rounded-lg max-w-md mx-auto">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
          <h2 className="text-xl font-semibold text-red-800">Error Loading Data</h2>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Tab labels for mobile dropdown
  const tabLabels = {
    batch: "Batch & Enrollment",
    leads: "Leads",
    preparation: "Preparation",
    marketing: "Marketing",
    interview: "Interview",
    placement: "Placement",
    employee: "Employee",
    vendor: "Vendor",
    jobs: "Jobs",
    finance: "Finance"
  };

  const currentTabLabel = tabLabels[activeTab as keyof typeof tabLabels] || "Select Tab";

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4">
      <Tabs defaultValue="batch" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {isMobile && (
          <div className="mobile-dropdown">
            <div className="relative mb-4 w-full">
              <button
                onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                className="w-full flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="font-semibold text-gray-700 text-sm">{currentTabLabel}</span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isMobileDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {isMobileDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                  {Object.entries(tabLabels).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setActiveTab(value);
                        setIsMobileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 active:bg-gray-50 touch-manipulation ${activeTab === value
                        ? 'bg-blue-50 text-blue-700 font-semibold border-blue-100'
                        : 'text-gray-700'
                        }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <div className="flex items-center">
                        <span className="text-sm">{label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!isMobile && (
          <TabsList className="border-2 border-gray-200 rounded-xl bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-2 shadow-sm">
            <TabsTrigger value="batch" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800">Batch</TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-800">Leads</TabsTrigger>
            <TabsTrigger value="preparation" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">Preparation</TabsTrigger>
            <TabsTrigger value="marketing" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-800">Marketing</TabsTrigger>
            <TabsTrigger value="interview" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">Interview</TabsTrigger>
            <TabsTrigger value="placement" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">Placement</TabsTrigger>
            <TabsTrigger value="employee" className="data-[state=active]:bg-fuchsia-100 data-[state=active]:text-fuchsia-800">Employee</TabsTrigger>
            <TabsTrigger value="vendor" className="data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-800">Vendor</TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800">Jobs</TabsTrigger>
            <TabsTrigger value="finance" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">Finance</TabsTrigger>
          </TabsList>
        )}


        <TabsContent value="batch" className="mt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard
              title="Current Active Batch"
              value={metrics?.batch_metrics.current_active_batches || "No active batches"}
              icon={<Layers3 className="size-4" />}
              variant="purple"
            />
            <EnhancedMetricCard
              title="Enrolled in Current Batch"
              value={enrolledCandidates}
              icon={<Users className="size-4" />}
              variant="purple"
            />
            <EnhancedMetricCard
              title="Candidates Enrolled in previous Batch"
              value={metrics?.batch_metrics.candidates_previous_batch || 0}
              icon={<UserPlus className="size-4" />}
              variant="purple"
            />
            <EnhancedMetricCard
              title="New Enrollments In This Month"
              value={metrics?.batch_metrics.new_enrollments_month || 0}
              icon={<CalendarPlus className="size-4" />}
              variant="purple"
            />
            <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-1 border-b border-purple-300">
              <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Batch Start Dates</CardTitle>
                  <CalendarDays className="size-4 text-indigo-600" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <ul className="divide-y rounded-md border">
                  {upcomingBatches.map((batch) => (
                    <li key={batch.name} className="flex items-center justify-between p-2">
                      <span className="text-sm font-medium border-b border-purple-200">{batch.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateFromDB(batch.startdate)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-purple-300">
              <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground border-b border-purple-200">
                    Candidate Status Breakdown
                  </CardTitle>
                  <PieChartIcon className="size-4 text-indigo-600" />
                </div>
                <div className="mt-2 text-lg font-medium text-purple-600">
                  Total Candidates: {totalCandidates}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="h-48 w-48 mx-auto sm:mx-0 sm:flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Active", value: metrics?.batch_metrics.candidate_status_breakdown.active || 0, color: "#4f46e5" },
                            { name: "Break", value: metrics?.batch_metrics.candidate_status_breakdown.break || 0, color: "#f59e0b" },
                            { name: "Discontinued", value: metrics?.batch_metrics.candidate_status_breakdown.discontinued || 0, color: "#ef4444" },
                            { name: "Placements", value: metrics?.batch_metrics.candidate_status_breakdown.Placements || 0, color: "#10b981" },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 35 : 28}
                          outerRadius={isMobile ? 65 : 52}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {[
                            { name: "Active", value: metrics?.batch_metrics.candidate_status_breakdown.active || 0, color: "#4f46e5" },
                            { name: "Break", value: metrics?.batch_metrics.candidate_status_breakdown.break || 0, color: "#f59e0b" },
                            { name: "Discontinued", value: metrics?.batch_metrics.candidate_status_breakdown.discontinued || 0, color: "#ef4444" },
                            { name: "Placements", value: metrics?.batch_metrics.candidate_status_breakdown.Placements || 0, color: "#10b981" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value} candidates`, 'Count']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>


                  <div className="flex flex-col justify-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4f46e5" }}></span>
                      <span className="text-sm">Active: {metrics?.batch_metrics.candidate_status_breakdown.active || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }}></span>
                      <span className="text-sm">Break: {metrics?.batch_metrics.candidate_status_breakdown.break || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }}></span>
                      <span className="text-sm">Discontinued: {metrics?.batch_metrics.candidate_status_breakdown.discontinued || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#10b981" }}></span>
                      <span className="text-sm">Placements: {metrics?.batch_metrics.candidate_status_breakdown.Placements || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-1 border-b border-purple-300">
              <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-1 p-2">
                <Layers3 className="size-4 text-purple-500" />
                Classes Count
              </CardTitle>
              <CardContent className="p-2">
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300 rounded-md text-xs">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="text-left px-2 py-1 font-bold text-gray-700 border-b w-2/3">
                          Batch Name
                        </th>
                        <th className="text-left px-2 py-1 font-bold text-gray-700 border-b w-1/3">
                          Classes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchClasses.map((b) => (
                        <tr key={b.batchname} className="hover:bg-purple-50">
                          <td className="px-2 py-1 border-b">{b.batchname}</td>
                          <td className="px-2 py-1 border-b text-center">{b.classes_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Financial */}
        <TabsContent value="finance" className="mt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard
              title="Total Fee in Current Batch"
              value={formatUSD(metrics?.financial_metrics.total_fee_current_batch || 0)}
              icon={<Wallet className="size-4" />}
              variant="green"
            />
            <EnhancedMetricCard
              title="Fee Collected In Previous Batch"
              value={formatUSD(metrics?.financial_metrics.fee_collected_previous_batch || 0)}
              icon={<Banknote className="size-4" />}
              variant="green"
            />
            <EnhancedMetricCard
              title="Average Fee per Candidate"
              value={formatUSD(averageFeePerCandidate)}
              icon={<PiggyBank className="size-4" />}
              variant="green"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard
              title="Total Expected Placement Fee"
              value={formatUSD(totalExpectedFee)}
              icon={<TrendingUp className="size-4" />}
              variant="emerald"
            />
            <EnhancedMetricCard
              title="Total Placement Fee Collected"
              value={formatUSD(totalCollectedFee)}
              icon={<CheckCircle2 className="size-4" />}
              variant="emerald"
            />
            <EnhancedMetricCard
              title="Total Pending Placement Fee"
              value={formatUSD(totalPendingFee)}
              icon={<Clock className="size-4" />}
              variant="emerald"
            />
            <EnhancedMetricCard
              title="Placement Fee Collected This Month"
              value={formatUSD(collectedThisMonthFee)}
              icon={<CalendarDays className="size-4" />}
              variant="emerald"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-green-300">
              <CardHeader className="p-3 pb-1 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Latest 5 batch's fee collection
                  </CardTitle>
                  <TrendingUp className="size-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {metrics?.financial_metrics.top_batches_fee?.length > 0 ? (
                  <div className="h-64 min-h-[256px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={metrics.financial_metrics.top_batches_fee.slice(0, 5).map((batch) => {
                          const calculatedCandidateCount =
                            averageFeePerCandidate > 0
                              ? Math.round(batch.total_fee / averageFeePerCandidate)
                              : 0;
                          return {
                            batch_name: batch.batch_name,
                            candidates: batch.candidate_count || calculatedCandidateCount,
                            total_fee: batch.total_fee,
                          };
                        })}
                        margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="batch_name" tick={{ fontSize: 9 }} interval={0} angle={-8} />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                        <Bar dataKey="total_fee" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No fee data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-emerald-300">
              <CardHeader className="p-3 pb-1 border-b border-emerald-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground border-b border-emerald-200">
                    Placement Installments Status
                  </CardTitle>
                  <Briefcase className="size-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-lg font-medium text-emerald-600">
                  Total Installments: {(metrics?.financial_metrics?.placement_fee_metrics?.installment_stats?.completed || 0) + (metrics?.financial_metrics?.placement_fee_metrics?.installment_stats?.pending || 0)}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {metrics?.financial_metrics.placement_fee_metrics.installment_stats ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="h-48 w-48 mx-auto sm:mx-0 sm:flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Completed', value: completedInstallmentsCount },
                              { name: 'Pending', value: pendingInstallmentsCount },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={isMobile ? 35 : 28}
                            outerRadius={isMobile ? 65 : 52}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            <Cell key={`cell-0`} fill="#10b981" />
                            <Cell key={`cell-1`} fill="#ef4444" />
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} installments`, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex flex-col justify-center gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#10b981" }}></span>
                        <span className="text-sm">Completed: {completedInstallmentsCount}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }}></span>
                        <span className="text-sm">Pending: {pendingInstallmentsCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No installment data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. Placement */}
        <TabsContent value="placement" className="mt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard title="Total Placements (All Time)" value={totalPlacements} icon={<Briefcase className="size-4" />} variant="blue" />
            <EnhancedMetricCard title={`Placements (${currentYear})`} value={placementsYear} icon={<Award className="size-4" />} variant="blue" />
            <EnhancedMetricCard title="Placements Last Month" value={placementsMonth} icon={<Clock className="size-4" />} variant="blue" />
            <EnhancedMetricCard title="Active Placements" value={activePlacements} icon={<CheckCircle2 className="size-4" />} variant="blue" />

            {metrics?.placement_metrics.last_placement && (
              <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-blue-200">
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Last Placement</CardTitle>
                    <Handshake className="size-4 text-violet-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex flex-col sm:flex-row items-center justify-between p-2 bg-violet-50 rounded-md gap-2">
                    <div className="text-center sm:text-left">
                      <div className="font-medium text-sm">{metrics.placement_metrics.last_placement.candidate_name}</div>
                      <div className="text-xs text-muted-foreground">{metrics.placement_metrics.last_placement.position}</div>
                    </div>
                    <div className="text-center sm:text-right">
                      <div className="font-medium text-sm">{metrics.placement_metrics.last_placement.company}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateWithMonth(metrics.placement_metrics.last_placement.placement_date)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 4. Interview */}
        <TabsContent value="interview" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <EnhancedMetricCard title="Upcoming Interviews (7 Days)" value={upcomingInterviews} icon={<CalendarDays className="size-4" />} variant="orange" />
            <EnhancedMetricCard title="Total Interviews" value={totalInterviews} icon={<ClipboardList className="size-4" />} variant="orange" />
            <EnhancedMetricCard title="Interviews Month" value={interviewsThisMonth} icon={<BarChart2 className="size-4" />} variant="orange" />
            <EnhancedMetricCard title="Interviews Today" value={interviewsToday} icon={<CalendarPlus className="size-4" />} variant="orange" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-b border-orange-300">
              <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Candidate Interview Performance
                  </CardTitle>
                  <Trophy className="size-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {loading ? (
                  <p className="text-center text-gray-500">Loading...</p>
                ) : data.length > 0 ? (
                  <div className="overflow-x-auto max-h-[250px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm border-separate border-spacing-0 border border-orange-100 rounded-lg">
                      <thead className="bg-orange-50/90 text-orange-900 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                        <tr>
                          <th className="p-3 text-left font-semibold min-w-[200px] border-b border-orange-100">Candidate</th>
                          <th className="p-3 text-center font-semibold w-32 border-b border-orange-100">Interviews</th>
                          <th className="p-3 text-center font-semibold w-32 border-b border-orange-100">Success</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.map((c) => (
                          <tr key={c.candidate_id} className="hover:bg-orange-50/30 transition-colors">
                            <td className="p-3 font-medium text-gray-700">{c.candidate_name}</td>
                            <td className="p-3 text-center text-gray-600 font-semibold">{c.total_interviews}</td>
                            <td
                              className={`p-3 text-center font-bold ${c.success_count > 0 ? "text-green-600 bg-green-50/50" : "text-gray-400"
                                }`}
                            >
                              {c.success_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">No candidates found</p>
                )}
              </CardContent>
            </Card>

            {/* Breakdown Chart */}
            <Card className="border-b border-orange-300">
              <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground border-b border-orange-200">
                    Interview Feedback Breakdown
                  </CardTitle>
                  <PieChartIcon className="size-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {(() => {
                  const positive = metrics?.interview_metrics.feedback_breakdown.Positive || 0;
                  const negative = metrics?.interview_metrics.feedback_breakdown.Negative || 0;
                  const total = metrics?.interview_metrics.total_interviews || 0;
                  const pending = Math.max(0, total - (positive + negative));

                  return (
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="h-48 w-48 mx-auto sm:mx-0 sm:flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Positive", value: positive, color: "#10b981" },
                                { name: "Negative", value: negative, color: "#ef4444" },
                                { name: "Pending", value: pending, color: "#f59e0b" },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={isMobile ? 65 : 28}
                              outerRadius={isMobile ? 70 : 52}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#ef4444" />
                              <Cell fill="#f59e0b" />
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value} Interviews`, 'Count']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col justify-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#10b981" }}></span>
                          <span className="text-sm font-medium">Positive: {positive}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }}></span>
                          <span className="text-sm font-medium">Negative: {negative}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }}></span>
                          <span className="text-sm font-medium">Pending: {pending}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="mt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard title="Total Candidates" value={marketing_candidates} icon={<Users className="size-4" />} variant="indigo" />
            <EnhancedMetricCard title="First Priority" value={priority_1_candidates} icon={<TrendingUp className="size-4" />} variant="indigo" />
            <EnhancedMetricCard title="Second Priority" value={priority_2_candidates} icon={<BarChart2 className="size-4" />} variant="indigo" />
            <EnhancedMetricCard title="Third Priority" value={priority_3_candidates} icon={<Target className="size-4" />} variant="indigo" />
          </div>
        </TabsContent>


        <TabsContent value="leads" className="mt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard title="Total Leads" value={totalLeads} icon={<Users className="size-4" />} variant="teal" />
            <EnhancedMetricCard title="Leads In This Month" value={leadsThisMonth} icon={<CalendarDays className="size-4" />} variant="teal" />
            <EnhancedMetricCard title="Lead In This Week" value={leads_this_week} icon={<Target className="size-4" />} variant="teal" />
            {leadMetrics?.latest_lead && (
              <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-teal-200">
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground ">Latest Lead</CardTitle>
                    <UserPlus className="size-4 text-sky-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex flex-col sm:flex-row items-center justify-between p-2 bg-sky-50 rounded-md gap-2">
                    <div className="text-center sm:text-left">
                      <div className="font-medium text-sm">{leadMetrics.latest_lead.full_name}</div>
                      <div className="text-sm text-muted-foreground">{leadMetrics.latest_lead.email}</div>
                    </div>
                    <div className="text-center sm:text-right">
                      <div className="text-xs text-muted-foreground">{leadMetrics.latest_lead.phone}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateFromDB(leadMetrics.latest_lead.entry_date)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-teal-300">
              <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground border-b border-teal-200">
                    Leads Status Breakdown
                  </CardTitle>
                  <PieChartIcon className="size-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="h-48 w-48 mx-auto sm:mx-0 sm:flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Open", value: open_leads || 0, color: "#11bfebff" },
                            { name: "Closed", value: closed_leads || 0, color: "#0bf50bff" },
                            { name: "Future", value: future_leads || 0, color: "#e7c500ff" },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 35 : 28}
                          outerRadius={isMobile ? 65 : 52}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {[
                            { name: "Open", value: open_leads || 0, color: "#11bfebff" },
                            { name: "Closed", value: closed_leads || 0, color: "#0bf50bff" },
                            { name: "Future", value: future_leads || 0, color: "#e7c500ff" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value} leads`, 'Count']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col justify-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#11bfebff" }}></span>
                      <span className="text-sm">Open: {open_leads}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#0bf50bff" }}></span>
                      <span className="text-sm">Closed: {closed_leads}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#e7c500ff" }}></span>
                      <span className="text-sm">Future: {future_leads}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* 6. Employee metrics */}
        <TabsContent value="employee" className="mt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard
              title="Total Employee Tasks"
              value={totalTasks}
              icon={<ClipboardList className="size-4" />}
              variant="fuchsia"
            />
            <EnhancedMetricCard
              title="Pending Tasks"
              value={pendingTasks}
              icon={<Clock className="size-4" />}
              variant="orange"
            />
            <EnhancedMetricCard
              title="In Progress Tasks"
              value={inProgressTasks}
              icon={<BarChart2 className="size-4" />}
              variant="blue"
            />
            <EnhancedMetricCard
              title="Completed Tasks"
              value={completedTasks}
              icon={<CheckCircle2 className="size-4" />}
              variant="green"
            />
            <EnhancedMetricCard
              title="Overdue Tasks"
              value={overdueTasks}
              icon={<XCircle className="size-4" />}
              variant="red"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* My Assigned Tasks Section */}
            {metrics?.my_tasks && metrics.my_tasks.length > 0 && (
              <Card className="border-b border-indigo-200">
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metrics?.employee_name ? `${metrics.employee_name}'s Tasks` : "My Assigned Tasks"}
                    </CardTitle>
                    <ClipboardList className="size-4 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <tbody>
                        {metrics.my_tasks.map((task) => (
                          <tr key={task.id} className="border-b transition-colors hover:bg-muted/30">
                            <td className="px-3 py-2 font-medium">{task.task}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className={metrics?.my_tasks && metrics.my_tasks.length > 0 ? "" : "lg:col-span-2"}>
              <Card className="border-b border-red-200 h-full">
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Employee Birthdays</CardTitle>
                    <CakeIcon className="size-4 text-pink-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {birthdays?.today?.length > 0 ? (
                    <div className="space-y-4">
                      {birthdays.today.map((emp, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 rounded-lg border border-pink-200 shadow-md text-center"
                        >
                          <h3 className="text-lg font-bold text-indigo-700">
                            {emp.wish || `🎂 🎉 Happy Birthday ${emp.name}! 🎂 🎉`}
                          </h3>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {birthdays?.upcoming?.length > 0 ? (
                        birthdays.upcoming.map((emp, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-3 bg-purple-50 rounded border border-purple-100"
                          >
                            <span className="font-medium">{emp.name}</span>
                            <span className="text-purple-600 font-semibold">
                              {formatDateWithMonth(emp.dob)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500 col-span-full">
                          No Upcoming Birthdays This Month
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        {/* 7.Preparation */}
        <TabsContent value="preparation" className="mt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard
              title="Total Preparation Candidates"
              value={total_preparation_candidates}
              icon={<NotebookIcon className="size-4" />}
              variant="pink"
            />
            <EnhancedMetricCard
              title="Active Candidates"
              value={active_candidates}
              icon={<PenIcon className="size-4" />}
              variant="pink"
            />
            <EnhancedMetricCard
              title="Inactive Candidates"
              value={inactive_candidates}
              icon={<PencilOff className="size-4" />}
              variant="pink"
            />
          </div>
        </TabsContent>
        {/* 8.Vendors */}
        <TabsContent value="vendor" className="mt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard title="Total Vendors" value={vendorMetrics?.total_vendors || 0} icon={<Layers3 className="size-4" />} variant="cyan" />
            <EnhancedMetricCard title="Extracted Today" value={vendorMetrics?.today_extracted || 0} icon={<CalendarDays className="size-4" />} variant="cyan" />
            <EnhancedMetricCard title="Extracted This Week" value={vendorMetrics?.week_extracted || 0} icon={<TrendingUp className="size-4" />} variant="cyan" />
          </div>
        </TabsContent>

        {/* 9. Jobs */}
        <TabsContent value="jobs" className="mt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard
              title={metrics?.my_jobs?.length ? "Total Job Types" : "Total Job Types"}
              value={totalJobTypes}
              icon={<Briefcase className="size-4" />}
              variant="amber"
            />
            <EnhancedMetricCard
              title="Total Activities"
              value={totalJobActivities}
              icon={<TrendingUp className="size-4" />}
              variant="amber"
            />
            <EnhancedMetricCard
              title="Activities Today"
              value={activitiesToday}
              icon={<Clock className="size-4" />}
              variant="amber"
            />
            <EnhancedMetricCard
              title="Activities This Week"
              value={activitiesThisWeek}
              icon={<CalendarDays className="size-4" />}
              variant="amber"
            />
          </div>

          <div className="mt-4 max-w-md">
            {/* My Assigned Jobs Section */}
            {metrics?.my_jobs && metrics.my_jobs.length > 0 && (
              <Card className="border-b border-blue-200">
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metrics?.employee_name ? `${metrics.employee_name}'s Jobs` : "My Assigned Jobs"}
                    </CardTitle>
                    <Briefcase className="size-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-blue-50 text-xs font-semibold text-blue-700">
                        <tr>
                          <th className="px-3 py-2">Job Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.my_jobs.map((job) => (
                          <tr key={job.id} className="border-b transition-colors hover:bg-muted/30">
                            <td className="px-3 py-2 font-medium">{job.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
