
"use client";
import { useEffect, useState } from "react";
import { EnhancedMetricCard } from "@/components/EnhancedMetricCard";
import {
  Users, GraduationCap, DollarSign, Building, Calendar, TrendingUp,
  UserCheck, Clock, Target, Briefcase, MessageSquare, UserPlus,
  CalendarCheck, Award, Star, BookOpen, Activity, CheckCircle,
  XCircle, BarChart3, Percent, CreditCard, PiggyBank, Trophy,
  Handshake, Phone, Mail, ThumbsUp, ThumbsDown, HelpCircle,
  CakeIcon,
} from "lucide-react";
import { motion } from "framer-motion";

// This is Hook for animated counters---
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

//This are types for API responses---
interface DashboardMetrics {
  batch_metrics: {
    current_active_batches: string;
    current_active_batches_count: number;
    enrolled_candidates_current: number;
    total_candidates: number;
    candidates_last_batch: number;
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
    fee_collected_last_batch: number;
    top_batches_fee: Array<{
      batch_name: string;
      total_fee: number;
    }>;
  };
  placement_metrics: {
    total_placements: number;
    placements_year: number;
    placements_last_month: number;
    last_placement: {
      candidate_name: string;
      company: string;
      placement_date: string;
      position:string;
    } | null;
    active_placements: number;
  };
  interview_metrics: {
    upcoming_interviews: number;
    total_interviews: number;
    interviews_month: number;
    marketing_candidates: number;
    feedback_breakdown: {
      Positive: number;
      Negative: number;
      No_Response: number;
      [key: string]: number;
    };
  };
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
}

interface LeadMetricsResponse {
  success: boolean;
  data: LeadMetrics;
  message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

export default function Index() {
  const [time, setTime] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [upcomingBatches, setUpcomingBatches] = useState<UpcomingBatch[]>([]);
  const [topBatches, setTopBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [birthdays, setBirthdays] = useState<BirthdayResponse>({  
    today: [],
    upcoming: [],
  });
  const [leadMetrics, setLeadMetrics] = useState<LeadMetrics | null>(null);

  
  useEffect(() => {
    fetch(`${API_BASE_URL}/employee-birthdays`)
      .then((res) => res.json())
      .then((data) => setBirthdays(data))
      .catch((err) => console.error("Error fetching birthdays:", err));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/leads/metrics`)
      .then((res) => res.json())
      .then((data: LeadMetricsResponse) => {
        if (data.success) {
          setLeadMetrics(data.data);
        }
      })
      .catch((err) => console.error("Error fetching lead metrics:", err));
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
        const [metricsResponse, batchesResponse, topBatchesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/metrics/all`),
          fetch(`${API_BASE_URL}/upcoming-batches?limit=3`),
          fetch(`${API_BASE_URL}/top-batches-revenue?limit=5`)
        ]);

        if (!metricsResponse.ok || !batchesResponse.ok || !topBatchesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const metricsData = await metricsResponse.json();
        const batchesData = await batchesResponse.json();
        const topBatchesData = await topBatchesResponse.json();

        setMetrics(metricsData);
        setUpcomingBatches(batchesData);
        setTopBatches(topBatchesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

// This are Animated counters-----
  const activeBatches = useCounter(+(metrics?.batch_metrics.current_active_batches) || 0);
  const enrolledCandidates = useCounter(metrics?.batch_metrics.enrolled_candidates_current || 0);
  const totalCandidates = useCounter(metrics?.batch_metrics.total_candidates || 0);
  const feeCollected = useCounter(metrics?.financial_metrics.fee_collected_last_batch || 0);
  const totalPlacements = useCounter(metrics?.placement_metrics.total_placements || 0);
  const placementsYear = useCounter(metrics?.placement_metrics.placements_year || 0);
  const placementsMonth = useCounter(metrics?.placement_metrics.placements_last_month || 0);
  const activePlacements = useCounter(metrics?.placement_metrics.active_placements || 0);
  const upcomingInterviews = useCounter(metrics?.interview_metrics.upcoming_interviews || 0); 
  const totalInterviews = useCounter(metrics?.interview_metrics.total_interviews || 0);
  const interviewsThisMonth = useCounter(metrics?.interview_metrics.interviews_month || 0);
  const totalLeads = useCounter(leadMetrics?.total_leads || 0);
  const leadsThisMonth = useCounter(leadMetrics?.leads_this_month || 0);
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
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
      </div>
    );
  }

//This code is to Calculate derived metrics -----
  const placementRate = metrics ? Math.round((metrics.placement_metrics.total_placements / Math.max(1, metrics.batch_metrics.total_candidates) * 100)) : 0;
  const interviewSuccessRate = metrics ? Math.round((metrics.interview_metrics.feedback_breakdown.Positive / Math.max(1, metrics.interview_metrics.total_interviews) * 100)) : 0;
  const averageFeePerCandidate = metrics ? Math.round((metrics.financial_metrics.total_fee_current_batch / Math.max(1, metrics.batch_metrics.enrolled_candidates_current))) : 0;
  const leadConversionRate = leadMetrics ? Math.round((leadMetrics.leads_this_month / Math.max(1, leadMetrics.total_leads) * 100)) : 0;

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">

      {/* Welcome Section */}
      <motion.div
        className="relative overflow-hidden rounded-3xl p-10 mb-10 shadow-md text-center border border-pink-100 bg-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-extrabold">Welcome To Admin Dashboard</h1>
        {time && (
        <p className="mt-4 text-sm font-medium">
          {time.toLocaleDateString("en-GB")} • {time.toLocaleTimeString()}
        </p>
        )}
      </motion.div>

      {/* Employee Birthdays*/}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-indigo-100 mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-pink-100 p-2 rounded-lg">
            <CakeIcon className="h-5 w-5 text-pink-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
             Employee Birthdays
          </h2>
        </div>

        {birthdays?.today?.length > 0 ? (
          <div className="space-y-4">
            {birthdays.today.map((emp, idx) => (
              <div
                key={idx}
                className="p-4 bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 rounded-lg border border-pink-200 shadow-md text-center"
              >
                <h3 className="text-lg font-bold text-indigo-700">
                  {emp.wish ||`🎂 🎉 Happy Birthday ${emp.name}! 🎂 🎉`}
                </h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {birthdays?.upcoming?.length > 0 ? (
              birthdays.upcoming.map((emp, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-purple-50 rounded border border-purple-100"
                >
                  <span className="font-medium">{emp.name}</span>
                  <span className="text-purple-600 font-semibold">
                    {new Date(emp.dob).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No Upcoming Birthdays On This Month
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Lead Metrics Section*/}
      <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-pink-100 mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <UserPlus className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Leads</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <EnhancedMetricCard 
            title="Total Leads" 
            value={totalLeads.toLocaleString()} 
            icon={<Users />} 
            variant="blue" 
          />
          <EnhancedMetricCard 
            title="Leads This Month" 
            value={leadsThisMonth.toLocaleString()} 
            icon={<TrendingUp />} 
            variant="green" 
          />
          <EnhancedMetricCard 
            title="Lead Conversion Rate" 
            value={`${leadConversionRate}%`} 
            icon={<Percent />} 
            variant="orange" 
          />
        </div>

        {/* Latest Lead */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-indigo-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Lead</h3>
          </div>
          {leadMetrics?.latest_lead ? (
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {leadMetrics.latest_lead.full_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {leadMetrics.latest_lead.email}
                  </div>
                  <div className="text-sm text-gray-500">
                    {leadMetrics.latest_lead.phone}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-indigo-600 font-medium">
                  Added on {new Date(leadMetrics.latest_lead.entry_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  Status: {leadMetrics.latest_lead.status || 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No leads available
            </div>
          )}
        </div>
      </motion.div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <motion.div whileHover={{ scale: 1.05 }}>
          <EnhancedMetricCard 
            title="Current Active Batches" 
            value={metrics?.batch_metrics.current_active_batches || "No active batches"}
            icon={<GraduationCap />} 
            variant="purple"
          />
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }}>
          <EnhancedMetricCard 
            title="Current Batches Enrollments" 
            value={enrolledCandidates} 
            icon={<Users />} 
            variant="blue" 
          />
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }}>
          <EnhancedMetricCard 
            title="Total Candidates(All Time)" 
            value={totalCandidates.toLocaleString()} 
            icon={<UserCheck />} 
            variant="green" 
          />
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }}>
          <EnhancedMetricCard 
            title="Fee Collected In Last Batch" 
            value={`$${feeCollected.toLocaleString()}`} 
            icon={<DollarSign />} 
            variant="orange" 
          />
        </motion.div>
      </div>

      {/* Batch & Enrollment */}
      <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-purple-100 mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-purple-100 p-2 rounded-lg">
            <BookOpen className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Batch & Enrollments</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <EnhancedMetricCard 
            title="Candidates in Enrolled Last Batch" 
            value={metrics?.batch_metrics.candidates_last_batch || 0} 
            icon={<UserPlus />} 
            variant="purple" 
          />
          <EnhancedMetricCard 
            title="Current Month Enrollments" 
            value={metrics?.batch_metrics.new_enrollments_month || 0} 
            icon={<TrendingUp />} 
            variant="blue" 
          />
          <EnhancedMetricCard 
            title="No.of Upcoming Batches" 
            value={upcomingBatches.length} 
            icon={<Calendar />} 
            variant="orange" 
          />
        </div>

        {/* Upcoming Batch Start Dates Details */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mb-6 border border-purple-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <CalendarCheck className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Batch Start Date</h3>
          </div>
          <div className="space-y-3">
            {upcomingBatches.map((batch, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-purple-50 rounded border border-purple-100">
                <span className="font-medium">{batch.name}</span>
                <span className="text-purple-600 font-semibold">
                  {new Date(batch.startdate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>
            ))}
            {upcomingBatches.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No upcoming batches
              </div>
            )}
          </div>
        </div>

        {/* Candidate Status Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mb-6 border border-green-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Candidate Status Breakdown</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {metrics?.batch_metrics.candidate_status_breakdown.active || 0}
              </div>
              <div className="text-sm text-green-700 font-medium">Active</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">
                {metrics?.batch_metrics.candidate_status_breakdown.break || 0}
              </div>
              <div className="text-sm text-yellow-700 font-medium">On Break</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {metrics?.batch_metrics.candidate_status_breakdown.discontinued || 0}
              </div>
              <div className="text-sm text-red-700 font-medium">Discontinued</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Financial Metrics */}
      <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-orange-100 mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-orange-100 p-2 rounded-lg">
            <DollarSign className="h-5 w-5 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Company Revenue</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <EnhancedMetricCard 
            title="Total Fee (Current Batch)" 
            value={`$${(metrics?.financial_metrics.total_fee_current_batch || 0).toLocaleString()}`} 
            icon={<CreditCard />} 
            variant="orange" 
          />
          <EnhancedMetricCard 
            title="Average Fee per Candidate" 
            value={`$${averageFeePerCandidate.toLocaleString()}`} 
            icon={<PiggyBank />} 
            variant="blue" 
          />
          <EnhancedMetricCard 
            title="Top Batch Revenue" 
            value={`$${(metrics?.financial_metrics.top_batches_fee[0]?.total_fee || 0).toLocaleString()}`} 
            icon={<Trophy />} 
            variant="green" 
          />
        </div>

        {/* Top 5 Batches by Fee Collection */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-orange-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top 5 Batches by Fee Collection</h3>
          </div>
          <div className="space-y-3">
            {topBatches.map((batch, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border rounded border-orange-100 hover:bg-orange-50 transition">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-1.5 rounded">
                    <Trophy className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <span className="font-medium">{batch.batch_name}</span>
                    <span className="text-sm text-gray-500 ml-2"> ({(batch.candidate_count || batch.candidate_count)} candidates)</span>
                  </div>
                </div>
                <span className="text-orange-600 font-semibold">${batch.total_revenue.toLocaleString()}</span>
              </div>
            ))}
            {topBatches.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No fee data available
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Placement Metrics */}
      <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-green-100 mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-100 p-2 rounded-lg">
            <Building className="h-5 w-5 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Placements</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <EnhancedMetricCard title="Total Placements" value={totalPlacements} icon={<Award />} variant="green" />
          <EnhancedMetricCard title={`Placements (${currentYear})`} value={placementsYear} icon={<TrendingUp />} variant="blue" />
          <EnhancedMetricCard title="Placements(LastMonth)" value={placementsMonth} icon={<CalendarCheck />} variant="purple" />
          <EnhancedMetricCard title="Active Placements" value={activePlacements} icon={<Briefcase />} variant="green" />
          <EnhancedMetricCard 
            title="Placement Rate" 
            value={`${placementRate}%`} 
            icon={<Percent />} 
            variant="orange" 
          />
        </div>

        {/* Latest Placement */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-green-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Handshake className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Placement</h3>
          </div>
          {metrics?.placement_metrics.last_placement ? (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {metrics.placement_metrics.last_placement.candidate_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {metrics.placement_metrics.last_placement.position}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  {metrics.placement_metrics.last_placement.company}
                </div>
                <div className="text-sm text-green-600">
                  Placed on {new Date(metrics.placement_metrics.last_placement.placement_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No placement data available
            </div>
          )}
        </div>
      </motion.div>

      {/*Interview & Marketing */}
      <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-blue-100 mb-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-90 dark:text-white">Interview & Marketing</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <EnhancedMetricCard title="Upcoming Interviews" value={upcomingInterviews} icon={<Clock />} variant="orange" />
          <EnhancedMetricCard title="Total Interviews" value={totalInterviews} icon={<Calendar />} variant="blue" />
          <EnhancedMetricCard title={`Interviews (${currentMonth})`} value={interviewsThisMonth} icon={<CalendarCheck />} variant="purple" />
          <EnhancedMetricCard title="Marketing Candidates" value={metrics?.interview_metrics.marketing_candidates || 0} icon={<Mail />} variant="green" />
          <EnhancedMetricCard 
            title="Interview Success Rate" 
            value={`${interviewSuccessRate}%`} 
            icon={<Target />} 
            variant="orange" 
          />
        </div>

        {/* Interview Feedback Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-blue-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Phone className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interview Feedback Breakdown</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <ThumbsUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {metrics?.interview_metrics.feedback_breakdown.Positive || 0}
              </div>
              <div className="text-sm text-green-700 font-medium">Positive</div>
              <div className="text-xs text-green-600 mt-1">
                {Math.round((metrics?.interview_metrics.feedback_breakdown.Positive || 0) / Math.max(1, metrics?.interview_metrics.total_interviews || 1) * 100)}%
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <ThumbsDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {metrics?.interview_metrics.feedback_breakdown.Negative || 0}
              </div>
              <div className="text-sm text-red-700 font-medium">Negative</div>
              <div className="text-xs text-red-600 mt-1">
                {Math.round((metrics?.interview_metrics.feedback_breakdown.Negative || 0) / Math.max(1, metrics?.interview_metrics.total_interviews || 1) * 100)}%
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <HelpCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-600">
                {metrics?.interview_metrics.feedback_breakdown.No_Response || 0}
              </div>
              <div className="text-sm text-gray-700 font-medium">No Response</div>
              <div className="text-xs text-gray-600 mt-1">
                {Math.round((metrics?.interview_metrics.feedback_breakdown.No_Response || 0) / Math.max(1, metrics?.interview_metrics.total_interviews || 1) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
