// app/avatar/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Layers3,
  CalendarDays,
  UserPlus,
  CalendarPlus,
  PieChart as PieChartIcon,
  Wallet,
  Banknote,
  TrendingUp,
  Briefcase,
  Award,
  CheckCircle2,
  Clock,
  Mic,
  BarChart2,
  ClipboardList,
  XCircle,
  Target,
  Cake,
  PiggyBank,
  Handshake,
  Trophy,
  Notebook,
  Pen,
  Pencil,
} from "lucide-react";
import { EnhancedMetricCard } from "@/components/EnhancedMetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin_ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin_ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { authFetch, API_BASE_URL } from "@/lib/api";

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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const d = parseInt(day || "0", 10);
  const mIdx = Math.max(0, Math.min(11, parseInt(month || "1", 10) - 1));
  return `${d} ${months[mIdx]}`;
}

/* ---------- Interfaces (same as before) ---------- */
interface DashboardMetrics {
  batch_metrics: {
    current_active_batches?: string;
    current_active_batches_count?: number;
    enrolled_candidates_current: number;
    total_candidates: number;
    candidates_previous_batch: number;
    new_enrollments_month: number;
    candidate_status_breakdown: {
      active?: number;
      break?: number;
      discontinued?: number;
      [key: string]: number | undefined;
    };
  };
  financial_metrics: {
    total_fee_current_batch: number;
    fee_collected_previous_batch: number;
    top_batches_fee: Array<{
      batch_name: string;
      total_fee: number;
      candidate_count?: number;
    }>;
  };
  placement_metrics: {
    total_placements: number;
    placements_year: number;
    placements_last_month: number;
    last_placement:
      | {
          candidate_name: string;
          company: string;
          placement_date: string;
          position: string;
        }
      | null;
    active_placements: number;
  };
  interview_metrics: {
    upcoming_interviews: number;
    total_interviews: number;
    interviews_month: number;
    marketing_candidates: number;
    feedback_breakdown: {
      Positive?: number;
      Negative?: number;
      No_Response?: number;
      [key: string]: number | undefined;
    };
  };
}

interface UpcomingBatch {
  name: string;
  startdate: string;
  end_date?: string;
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
  message?: string;
}

interface CandidateInterviewPerformance {
  candidate_id: number;
  candidate_name: string;
  total_interviews: number;
  success_count: number;
}

interface PreparationMetrics {
  total_preparation_candidates: number;
  preparation_candidates?: number;
  active_candidates: number;
  inactive_candidates: number;
}

/* ---------- Typed wrapper to avoid authFetch<T> misuse ---------- */
/**
 * fetcher<T>(endpoint)
 * - calls authFetch which isn't a generic function
 * - normalizes APIs that return either:
 *    - raw body (T)
 *    - { data: T }
 */
async function fetcher<T = any>(endpoint: string): Promise<T> {
  const res: any = await authFetch(endpoint);
  return (res && (res.data ?? res)) as T;
}

/* ---------- small counter hook ---------- */
function useCounter(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    if (!target || target <= 0) {
      setCount(0);
      return;
    }
    const step = Math.max(1, Math.ceil(target / Math.max(1, Math.round(duration / 16))));
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

/* ---------- Page component (uses fetcher<T> instead of authFetch<T>) ---------- */
export default function Index() {
  const [data, setData] = useState<CandidateInterviewPerformance[]>([]);
  const [time, setTime] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [upcomingBatches, setUpcomingBatches] = useState<UpcomingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [birthdays, setBirthdays] = useState<BirthdayResponse>({ today: [], upcoming: [] });
  const [preparationMetrics, setPreparationMetrics] = useState<PreparationMetrics | null>(null);
  const [leadMetrics, setLeadMetrics] = useState<LeadMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<string>("batch");

  useEffect(() => {
    const fetchInterviewPerformance = async () => {
      try {
        const res: any = await authFetch("/interview/performance");
        if (res?.success && res.data) setData(res.data);
        else if (Array.isArray(res)) setData(res);
        else if (Array.isArray(res?.data)) setData(res.data);
      } catch (err) {
        console.error("Error fetching interview performance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviewPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchEmployeeBirthdays = async () => {
      try {
        const data = await authFetch("/employee-birthdays");
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
        const data = await authFetch("/leads/metrics");
        if (data?.success && data.data) setLeadMetrics(data.data);
        else if (data?.data) setLeadMetrics(data.data);
        else setLeadMetrics(data);
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
        // use the typed wrapper here
        const metricsData = await fetcher<DashboardMetrics>("/metrics/all");
        const batchesData = await fetcher<UpcomingBatch[]>("/upcoming-batches?limit=3");

        setMetrics(metricsData ?? null);
        setUpcomingBatches(Array.isArray(batchesData) ? batchesData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
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
        const preparationData = await fetcher<PreparationMetrics>("/candidate/preparation/metrics");
        setPreparationMetrics(preparationData ?? null);
      } catch (error) {
        console.error("Error fetching preparation metrics:", error);
      }
    };
    fetchPreparationMetrics();
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
  const totalLeads = useCounter(leadMetrics?.total_leads || 0);
  const leadsThisMonth = useCounter(leadMetrics?.leads_this_month || 0);
  const leads_this_week = useCounter(leadMetrics?.leads_this_week || 0);
  const open_leads = useCounter(leadMetrics?.open_leads || 0);
  const closed_leads = useCounter(leadMetrics?.closed_leads || 0);
  const future_leads = useCounter(leadMetrics?.future_leads || 0);
  const total_preparation_candidates = useCounter(preparationMetrics?.total_preparation_candidates || 0);
  const active_candidates = useCounter(preparationMetrics?.active_candidates || 0);
  const inactive_candidates = useCounter(preparationMetrics?.inactive_candidates || 0);

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();

  const averageFeePerCandidate = metrics
    ? Math.round(metrics.financial_metrics.total_fee_current_batch / Math.max(1, metrics.batch_metrics.enrolled_candidates_current || 1))
    : 0;

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

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4">
      <Tabs defaultValue="batch" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="border-2 border-gray-200 rounded-xl bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-2 shadow-sm">
          <TabsTrigger value="batch" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800">
            Batch
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-800">
            Leads
          </TabsTrigger>
          <TabsTrigger
            value="preparation"
            className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800"
          >
            Preparation
          </TabsTrigger>
          <TabsTrigger value="interview" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
            Interview
          </TabsTrigger>
          <TabsTrigger value="marketing" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
            Marketing
          </TabsTrigger>
          <TabsTrigger value="placement" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
            Placement
          </TabsTrigger>
          <TabsTrigger value="employee" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
            Employee
          </TabsTrigger>
          <TabsTrigger value="finance" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
            Finance
          </TabsTrigger>
        </TabsList>

        {/* Batch Tab */}
        <TabsContent value="batch">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard
              title="Current Active Batch"
              value={metrics?.batch_metrics.current_active_batches || "No active batches"}
              icon={<Layers3 className="size-4" />}
              variant="purple"
            />
            <EnhancedMetricCard title="Enrolled in Current Batch" value={enrolledCandidates} icon={<Users />} variant="purple" />
            <EnhancedMetricCard
              title="Candidates Enrolled in previous Batch"
              value={metrics?.batch_metrics.candidates_previous_batch || 0}
              icon={<UserPlus />}
              variant="purple"
            />
            <EnhancedMetricCard
              title="New Enrollments In This Month"
              value={metrics?.batch_metrics.new_enrollments_month || 0}
              icon={<CalendarPlus />}
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
                      <span className="text-xs text-muted-foreground">{formatDateFromDB(batch.startdate)}</span>
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
                <div className="mt-2 text-lg font-medium text-purple-600">Total Candidates: {totalCandidates}</div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-40 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Active", value: metrics?.batch_metrics.candidate_status_breakdown.active || 0, color: "#4f46e5" },
                            { name: "Break", value: metrics?.batch_metrics.candidate_status_breakdown.break || 0, color: "#f59e0b" },
                            { name: "Discontinued", value: metrics?.batch_metrics.candidate_status_breakdown.discontinued || 0, color: "#ef4444" },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={52}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {[
                            { name: "Active", value: metrics?.batch_metrics.candidate_status_breakdown.active || 0, color: "#4f46e5" },
                            { name: "Break", value: metrics?.batch_metrics.candidate_status_breakdown.break || 0, color: "#f59e0b" },
                            { name: "Discontinued", value: metrics?.batch_metrics.candidate_status_breakdown.discontinued || 0, color: "#ef4444" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4f46e5" }} />
                      <span className="text-sm">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                      <span className="text-sm">Break</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                      <span className="text-sm">Discontinued</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Finance */}
        <TabsContent value="finance">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard
              title="Total Fee in Current Batch"
              value={formatUSD(metrics?.financial_metrics.total_fee_current_batch || 0)}
              icon={<Wallet />}
              variant="green"
            />
            <EnhancedMetricCard
              title="Fee Collected In Previous Batch"
              value={formatUSD(metrics?.financial_metrics.fee_collected_previous_batch || 0)}
              icon={<Banknote />}
              variant="green"
            />
            <EnhancedMetricCard
              title="Average Fee per Candidate"
              value={formatUSD(averageFeePerCandidate)}
              icon={<PiggyBank />}
              variant="green"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-green-300">
              <CardHeader className="p-3 pb-1 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Top 5 Batches by Fee Collection</CardTitle>
                  <TrendingUp />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {metrics?.financial_metrics.top_batches_fee?.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={metrics.financial_metrics.top_batches_fee.slice(0, 5).map((batch) => {
                          const calculatedCandidateCount =
                            averageFeePerCandidate > 0 ? Math.round(batch.total_fee / averageFeePerCandidate) : 0;
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
                        <YAxis tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(1)}k`} />
                        <Tooltip formatter={(value: number) => `$${Number(value).toLocaleString()}`} />
                        <Bar dataKey="total_fee" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">No fee data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Placement */}
        <TabsContent value="placement">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard title="Total Placements (All Time)" value={totalPlacements} icon={<Briefcase />} variant="blue" />
            <EnhancedMetricCard title={`Placements (${currentYear})`} value={placementsYear} icon={<Award />} variant="blue" />
            <EnhancedMetricCard title="Placements Last Month" value={placementsMonth} icon={<Clock />} variant="blue" />
            <EnhancedMetricCard title="Active Placements" value={activePlacements} icon={<CheckCircle2 />} variant="blue" />

            {metrics?.placement_metrics?.last_placement && (
              <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-blue-200">
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Last Placement</CardTitle>
                    <Handshake />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex items-center justify-between p-2 bg-violet-50 rounded-md">
                    <div>
                      <div className="font-medium">{metrics.placement_metrics.last_placement.candidate_name}</div>
                      <div className="text-sm text-muted-foreground">{metrics.placement_metrics.last_placement.position}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{metrics.placement_metrics.last_placement.company}</div>
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

        {/* Interview */}
        <TabsContent value="interview">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard title="Upcoming Interviews (Next 7 Days)" value={upcomingInterviews} icon={<CalendarDays />} variant="orange" />
            <EnhancedMetricCard title="Total Interviews Scheduled" value={totalInterviews} icon={<ClipboardList />} variant="orange" />
            <EnhancedMetricCard title={`Interviews This Month (${currentMonth})`} value={interviewsThisMonth} icon={<BarChart2 />} variant="orange" />

            <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-orange-300">
              <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between border-b border-orange-200">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Interview Feedback Breakdown</CardTitle>
                  <PieChartIcon />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-40 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Positive", value: metrics?.interview_metrics?.feedback_breakdown?.Positive || 0, color: "#22c55e" },
                            { name: "Negative", value: metrics?.interview_metrics?.feedback_breakdown?.Negative || 0, color: "#ef4444" },
                            { name: "No Response", value: metrics?.interview_metrics?.feedback_breakdown?.No_Response || 0, color: "#6b7280" },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={52}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {[
                            { name: "Positive", value: metrics?.interview_metrics?.feedback_breakdown?.Positive || 0, color: "#22c55e" },
                            { name: "Negative", value: metrics?.interview_metrics?.feedback_breakdown?.Negative || 0, color: "#ef4444" },
                            { name: "No Response", value: metrics?.interview_metrics?.feedback_breakdown?.No_Response || 0, color: "#6b7280" },
                          ].map((entry, index) => (
                            <Cell key={`cell-f-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                      <span className="text-sm">Positive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                      <span className="text-sm">Negative</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#6b7280" }} />
                      <span className="text-sm">No Response</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-4 border border-orange-300">
              <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Candidate Interview Performance</CardTitle>
                  <Trophy />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {loading ? (
                  <p className="text-center text-gray-500">Loading...</p>
                ) : data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border text-sm">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="p-2 text-left">Candidate</th>
                          <th className="p-2 text-center">Total Interviews</th>
                          <th className="p-2 text-center">Success</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((c) => (
                          <tr key={c.candidate_id} className="border-t">
                            <td className="p-2">{c.candidate_name}</td>
                            <td className="p-2 text-center">{c.total_interviews}</td>
                            <td
                              className={`p-2 text-center font-semibold ${
                                c.success_count > 0 ? "text-green-600" : "text-gray-500"
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
          </div>
        </TabsContent>

        {/* Marketing */}
        <TabsContent value="marketing">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard
              title="Active Marketing Candidates"
              value={metrics?.interview_metrics?.marketing_candidates || 0}
              icon={<Mic />}
              variant="default"
            />
          </div>
        </TabsContent>

        {/* Leads */}
        <TabsContent value="leads">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard title="Total Leads" value={totalLeads} icon={<Users />} variant="teal" />
            <EnhancedMetricCard title="Leads In This Month" value={leadsThisMonth} icon={<CalendarDays />} variant="teal" />
            <EnhancedMetricCard title="Lead In This Week" value={leads_this_week} icon={<Target />} variant="teal" />
            {leadMetrics?.latest_lead && (
              <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-teal-200">
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground ">Latest Lead</CardTitle>
                    <UserPlus />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex items-center justify-between p-2 bg-sky-50 rounded-md">
                    <div>
                      <div className="font-medium">{leadMetrics.latest_lead.full_name}</div>
                      <div className="text-sm text-muted-foreground">{leadMetrics.latest_lead.email}</div>
                    </div>
                    <div className="text-right">
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
                  <PieChartIcon />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-40 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Open", value: open_leads || 0, color: "#11bfeb" },
                            { name: "Closed", value: closed_leads || 0, color: "#0bf50b" },
                            { name: "Future", value: future_leads || 0, color: "#e7c500" },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={52}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {[
                            { name: "Open", value: open_leads || 0, color: "#11bfeb" },
                            { name: "Closed", value: closed_leads || 0, color: "#0bf50b" },
                            { name: "Future", value: future_leads || 0, color: "#e7c500" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#11bfeb" }} />
                      <span className="text-sm">Open</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#0bf50b" }} />
                      <span className="text-sm">Closed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#e7c500" }} />
                      <span className="text-sm">Future</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employee */}
        <TabsContent value="employee">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <Card className="sm:col-span-2 lg:col-span-2 xl:col-span-2 border-b border-red-200">
              <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Employee Birthdays</CardTitle>
                  <Cake />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {birthdays?.today?.length > 0 ? (
                  <div className="space-y-4">
                    {birthdays.today.map((emp, idx) => (
                      <div
                        key={emp.id ?? idx}
                        className="p-4 bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 rounded-lg border border-pink-200 shadow-md text-center"
                      >
                        <h3 className="text-lg font-bold text-indigo-700">
                          {emp.wish || `🎂 🎉 Happy Birthday ${emp.name}! 🎂 🎉`}
                        </h3>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {birthdays?.upcoming?.length > 0 ? (
                      birthdays.upcoming.map((emp, idx) => (
                        <div key={emp.id ?? idx} className="flex justify-between items-center p-3 bg-purple-50 rounded border border-purple-100">
                          <span className="font-medium">{emp.name}</span>
                          <span className="text-purple-600 font-semibold">{formatDateWithMonth(emp.dob)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">No Upcoming Birthdays This Month</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preparation */}
        <TabsContent value="preparation">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            <EnhancedMetricCard title="Total Preparation Candidates" value={total_preparation_candidates} icon={<Notebook />} variant="pink" />
            <EnhancedMetricCard title="Active Candidates" value={active_candidates} icon={<Pen />} variant="pink" />
            <EnhancedMetricCard title="Inactive Candidates" value={inactive_candidates} icon={<Pencil />} variant="pink" />
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
