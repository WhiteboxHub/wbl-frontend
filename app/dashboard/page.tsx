"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  BookOpen,
  Target,
  Briefcase,
  Calendar,
  BarChart3,
  Clock,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  FileText,
  ExternalLink,
  PlayCircle,
  Search,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

// Types based on backend API responses
interface CandidateBasicInfo {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  enrolled_date: string;
  batch_name: string;
}

interface JourneyPhase {
  completed: boolean;
  active: boolean;
  date?: string;
  start_date?: string;
  duration_days?: number;
  days_since?: number;
  status?: string;
  company?: string;
  position?: string;
}

interface PhaseMetrics {
  enrolled: {
    date: string;
    batch_name: string;
    status: string;
  };
  preparation?: {
    status: string;
    start_date: string;
    duration_days: number;
    rating: string;
    communication: string;
  };
  marketing?: {
    status: string;
    start_date: string;
    duration_days: number;
    total_interviews: number;
    positive_interviews: number;
    success_rate: number;
  };
  placement?: {
    company: string;
    position: string;
    placement_date: string;
    base_salary: number;
  };
}

interface TeamInfo {
  preparation: { instructors: Array<{ id: number; name: string; email?: string; role: string }> };
  marketing: { manager?: { id: number; name: string; email?: string } };
}

interface InterviewStats {
  total: number;
  positive: number;
  pending: number;
  negative: number;
  success_rate: number;
}

interface InterviewSummary {
  id: number;
  company: string;
  interview_date: string;
  type_of_interview: string;
  feedback: string;
}

interface Alert {
  type: string;
  phase: string;
  message: string;
}

interface DashboardData {
  basic_info: CandidateBasicInfo;
  journey: {
    enrolled: JourneyPhase;
    preparation: JourneyPhase;
    marketing: JourneyPhase;
    placement: JourneyPhase;
  };
  phase_metrics: PhaseMetrics;
  team_info: TeamInfo;
  interview_stats: InterviewStats;
  recent_interviews: InterviewSummary[];
  alerts: Alert[];
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

type TabId = "overview" | "preparation" | "marketing" | "placement";

export default function CandidateDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionSearchTerm, setSessionSearchTerm] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || 
                   process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

  // Get candidate ID from logged-in user
  const getCandidateId = async (): Promise<number> => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      console.log("Fetching user dashboard info...");
      // First, get user info to get email
      // Note: apiFetch already prepends baseUrl (which includes /api), so we don't need /api/ prefix
      const userResponse = await apiFetch("user_dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("User dashboard response:", userResponse);

      if (!userResponse || !userResponse.uname) {
        throw new Error("User information not found");
      }

      const userEmail = userResponse.uname; // uname is the email
      console.log("User email from dashboard:", userEmail);

      // Search for candidate by email using search-names endpoint
      try {
        console.log(`Searching for candidate with email: ${userEmail}`);
        // apiFetch handles baseUrl prepending, so use path without leading /
        const candidateResponse = await apiFetch(`candidates/search-names/${encodeURIComponent(userEmail)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Candidate search response:", candidateResponse);

        // Handle different response formats
        let candidates = [];
        if (Array.isArray(candidateResponse)) {
          candidates = candidateResponse;
        } else if (candidateResponse?.data && Array.isArray(candidateResponse.data)) {
          candidates = candidateResponse.data;
        } else if (candidateResponse?.candidates && Array.isArray(candidateResponse.candidates)) {
          candidates = candidateResponse.candidates;
        }

        console.log("Parsed candidates array:", candidates);

        if (candidates.length > 0) {
          // Find exact email match first, then fallback to first result
          const exactMatch = candidates.find((c: any) => c.email?.toLowerCase() === userEmail.toLowerCase());
          if (exactMatch && exactMatch.id) {
            console.log("Found exact match candidate ID:", exactMatch.id);
            return exactMatch.id;
          }
          if (candidates[0] && candidates[0].id) {
            console.log("Using first candidate ID:", candidates[0].id);
            return candidates[0].id;
          }
        }
      } catch (searchErr: any) {
        console.warn("Candidate search by email failed:", searchErr);
        console.warn("Error details:", searchErr.message, searchErr.status);
      }

      // Alternative: Try to decode token or use user_dashboard if it has candidate_id
      if (userResponse.candidate_id) {
        console.log("Using candidate_id from user response:", userResponse.candidate_id);
        return userResponse.candidate_id;
      }

      throw new Error("Candidate ID not found. Please ensure your account is linked to a candidate profile.");
    } catch (err: any) {
      console.error("Error getting candidate ID:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.status,
        body: err.body
      });
      throw new Error(err.message || "Failed to get candidate ID. Please log in again.");
    }
  };

  // Load dashboard overview
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) {
        console.error("No token found, redirecting to login");
        router.push("/login");
        return;
      }

      console.log("Loading dashboard data...");
      
      // Get candidate ID first
      console.log("Getting candidate ID...");
      const id = await getCandidateId();
      console.log("Candidate ID:", id);
      setCandidateId(id);

      if (!id) {
        throw new Error("Could not retrieve candidate ID");
      }

      // Fetch dashboard overview
      // Note: candidate_dashboard router has prefix="/api/candidates" in router definition
      // apiFetch will prepend baseUrl (which includes /api), so we need: api/candidates/{id}/dashboard/overview
      // But since baseUrl already has /api, we use: candidates/{id}/dashboard/overview
      console.log(`Fetching dashboard data for candidate ${id}...`);
      const data = await apiFetch(`candidates/${id}/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Dashboard data received:", data);
      
      if (!data) {
        throw new Error("No data received from server");
      }

      setDashboardData(data);
    } catch (err: any) {
      console.error("Dashboard loading error:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.status,
        body: err.body,
        stack: err.stack
      });
      
      const errorMessage = err.message || err.body?.detail || "Failed to load dashboard";
      setError(errorMessage);
      
      if (err.status === 401 || err.status === 403) {
        console.error("Authentication failed, redirecting to login");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load sessions filtered by candidate name
  const loadSessions = async () => {
    if (!dashboardData?.basic_info?.full_name) return;

    try {
      setSessionsLoading(true);
      const firstName = dashboardData.basic_info.full_name.split(" ")[0];
      const searchTerm = sessionSearchTerm || firstName;

      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const params = new URLSearchParams({ search_title: searchTerm });
      
      // Session router has prefix "/api" in main.py, so use: session?params
      const data = await apiFetch(`session?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const sessionsList = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setSessions(sessionsList);
    } catch (err) {
      console.error("Error loading sessions:", err);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData && activeTab === "overview") {
      loadSessions();
    }
  }, [dashboardData, activeTab, sessionSearchTerm]);

  // Auth check on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-24 px-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Connection Failed</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "Unable to load dashboard data"}</p>
          <button
            onClick={loadDashboardData}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const getFirstName = (fullName: string) => fullName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {getFirstName(dashboardData.basic_info.full_name).charAt(0)}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Welcome back, {getFirstName(dashboardData.basic_info.full_name)}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {dashboardData.basic_info.batch_name} • Enrolled{" "}
                  {dashboardData.basic_info.enrolled_date
                    ? format(parseISO(dashboardData.basic_info.enrolled_date), "MMM dd, yyyy")
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Banner */}
        {dashboardData.alerts && dashboardData.alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {dashboardData.alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-4 rounded-xl border ${
                  alert.type === "warning"
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{alert.message}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Phase: {alert.phase}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Phase Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <PhaseCard
            title="Enrolled"
            icon={<CheckCircle className="w-6 h-6" />}
            color="blue"
            completed={dashboardData.journey.enrolled.completed}
            daysSince={dashboardData.journey.enrolled.days_since}
            batchName={dashboardData.basic_info.batch_name}
          />
          <PhaseCard
            title="Preparation"
            icon={<BookOpen className="w-6 h-6" />}
            color="purple"
            active={dashboardData.journey.preparation.active}
            completed={dashboardData.journey.preparation.completed}
            durationDays={dashboardData.journey.preparation.duration_days}
            rating={dashboardData.phase_metrics.preparation?.rating}
          />
          <PhaseCard
            title="Marketing"
            icon={<Target className="w-6 h-6" />}
            color="green"
            active={dashboardData.journey.marketing.active}
            completed={dashboardData.journey.marketing.completed}
            durationDays={dashboardData.journey.marketing.duration_days}
            interviews={dashboardData.phase_metrics.marketing?.total_interviews}
            successRate={dashboardData.phase_metrics.marketing?.success_rate}
          />
          <PhaseCard
            title="Placement"
            icon={<Briefcase className="w-6 h-6" />}
            color="orange"
            active={dashboardData.journey.placement.active}
            completed={dashboardData.journey.placement.completed}
            company={dashboardData.phase_metrics.placement?.company}
          />
        </div>

        {/* Main Content with Tabs */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
                { id: "preparation", label: "Preparation", icon: <BookOpen className="w-4 h-4" /> },
                { id: "marketing", label: "Marketing", icon: <Target className="w-4 h-4" /> },
                { id: "placement", label: "Placement", icon: <Briefcase className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-3">
            {activeTab === "overview" && (
              <OverviewTab
                data={dashboardData}
                sessions={sessions}
                sessionsLoading={sessionsLoading}
                sessionSearchTerm={sessionSearchTerm}
                setSessionSearchTerm={setSessionSearchTerm}
                onRefresh={loadDashboardData}
              />
            )}
            {activeTab === "preparation" && (
              <PreparationTab candidateId={candidateId} onRefresh={loadDashboardData} />
            )}
            {activeTab === "marketing" && (
              <MarketingTab candidateId={candidateId} onRefresh={loadDashboardData} />
            )}
            {activeTab === "placement" && (
              <PlacementTab candidateId={candidateId} onRefresh={loadDashboardData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Phase Card Component
const PhaseCard = ({
  title,
  icon,
  color,
  completed,
  active,
  daysSince,
  durationDays,
  batchName,
  rating,
  interviews,
  successRate,
  company,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  completed?: boolean;
  active?: boolean;
  daysSince?: number;
  durationDays?: number;
  batchName?: string;
  rating?: string;
  interviews?: number;
  successRate?: number;
  company?: string;
}) => {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20",
    green: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20",
    orange: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20",
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
      </div>
      <div className="space-y-2">
        {active && <StatusBadge label="Active" type="active" />}
        {completed && <StatusBadge label="Completed" type="completed" />}
        {!active && !completed && <StatusBadge label="Not Started" type="pending" />}
        {daysSince !== undefined && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{daysSince} days since start</p>
        )}
        {durationDays !== undefined && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{durationDays} days in phase</p>
        )}
        {batchName && <p className="text-sm text-gray-600 dark:text-gray-400">Batch: {batchName}</p>}
        {rating && <p className="text-sm text-gray-600 dark:text-gray-400">Rating: {rating}</p>}
        {interviews !== undefined && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{interviews} interviews</p>
        )}
        {successRate !== undefined && (
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">{successRate}% success rate</p>
        )}
        {company && <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{company}</p>}
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ label, type }: { label: string; type: "active" | "completed" | "pending" }) => {
  const styles = {
    active: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    completed: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    pending: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
  };

  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>{label}</span>;
};

// Overview Tab Component
const OverviewTab = ({
  data,
  sessions,
  sessionsLoading,
  sessionSearchTerm,
  setSessionSearchTerm,
  onRefresh,
}: {
  data: DashboardData;
  sessions: Session[];
  sessionsLoading: boolean;
  sessionSearchTerm: string;
  setSessionSearchTerm: (term: string) => void;
  onRefresh: () => void;
}) => {
  const firstName = data.basic_info.full_name.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Interviews" value={data.interview_stats.total} color="blue" />
        <StatCard label="Positive" value={data.interview_stats.positive} color="green" />
        <StatCard label="Pending" value={data.interview_stats.pending} color="yellow" />
        <StatCard label="Success Rate" value={`${data.interview_stats.success_rate}%`} color="purple" />
      </div>

      {/* Team Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamSection
          title="Preparation Team"
          icon={<Users className="w-5 h-5" />}
          members={data.team_info.preparation.instructors}
        />
        <TeamSection
          title="Marketing Team"
          icon={<Target className="w-5 h-5" />}
          manager={data.team_info.marketing.manager}
        />
      </div>

      {/* Recent Interviews */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Recent Interviews
        </h4>
        <div className="space-y-3">
          {data.recent_interviews.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No interviews scheduled yet</p>
          ) : (
            data.recent_interviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{interview.company}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(parseISO(interview.interview_date), "MMM dd, yyyy")} • {interview.type_of_interview}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    interview.feedback === "Positive"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : interview.feedback === "Negative"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {interview.feedback || "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sessions Section */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <PlayCircle className="w-5 h-5 mr-2" />
            Sessions
          </h4>
        </div>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={sessionSearchTerm}
              onChange={(e) => setSessionSearchTerm(e.target.value)}
              placeholder={`Search sessions (default: ${firstName})...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        {sessionsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No sessions found. Try searching with your name or other keywords.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.sessionid}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{session.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(parseISO(session.sessiondate), "MMM dd, yyyy")} • {session.type} • {session.subject}
                  </p>
                </div>
                {session.link && (
                  <a
                    href={session.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Watch</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => {
  const colorClasses = {
    blue: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20",
    green: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20",
    yellow: "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20",
    purple: "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20",
  };

  return (
    <div className={`border rounded-2xl p-4 text-center ${colorClasses[color]}`}>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
};

// Team Section Component
const TeamSection = ({
  title,
  icon,
  members,
  manager,
}: {
  title: string;
  icon: React.ReactNode;
  members?: Array<{ id: number; name: string; email?: string; role: string }>;
  manager?: { id: number; name: string; email?: string };
}) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </h4>
      <div className="space-y-3">
        {members && members.length > 0 ? (
          members.map((member) => (
              <div key={member.id} className="flex items-center space-x-3 p-2.5 bg-white dark:bg-gray-600 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
              </div>
            </div>
          ))
        ) : manager ? (
          <div className="flex items-center space-x-3 p-2.5 bg-white dark:bg-gray-600 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {manager.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">{manager.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Marketing Manager</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No team members assigned yet</p>
        )}
      </div>
    </div>
  );
};

// Preparation Tab Component
const PreparationTab = ({ candidateId, onRefresh }: { candidateId: number | null; onRefresh: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const result = await apiFetch(`candidates/${candidateId}/preparation`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load preparation data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [candidateId]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState message={error || "No preparation data found"} onRetry={() => candidateId && window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Status" value={data.status} />
        <InfoCard title="Start Date" value={data.start_date ? format(parseISO(data.start_date), "MMM dd, yyyy") : "N/A"} />
        <InfoCard title="Duration" value={data.duration_days ? `${data.duration_days} days` : "N/A"} />
        <InfoCard title="Tech Rating" value={data.rating || "N/A"} />
        <InfoCard title="Communication" value={data.communication || "N/A"} />
      </div>

      {data.instructors && data.instructors.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Instructors</h4>
          <div className="space-y-3">
            {data.instructors.map((instructor: any) => (
              <div key={instructor.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-gray-100">{instructor.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{instructor.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Marketing Tab Component
const MarketingTab = ({ candidateId, onRefresh }: { candidateId: number | null; onRefresh: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const result = await apiFetch(`candidates/${candidateId}/marketing`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load marketing data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [candidateId]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState message={error || "No marketing data found"} onRetry={() => candidateId && window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Status" value={data.status} />
        <InfoCard title="Start Date" value={data.start_date ? format(parseISO(data.start_date), "MMM dd, yyyy") : "N/A"} />
        <InfoCard title="Duration" value={data.duration_days ? `${data.duration_days} days` : "N/A"} />
        <InfoCard
          title="Total Interviews"
          value={data.interview_stats?.total || 0}
        />
        <InfoCard title="Success Rate" value={`${data.interview_stats?.success_rate || 0}%`} />
      </div>

      {data.marketing_manager && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Marketing Manager</h4>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <p className="font-medium text-gray-900 dark:text-gray-100">{data.marketing_manager.name}</p>
            {data.marketing_manager.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{data.marketing_manager.email}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Placement Tab Component
const PlacementTab = ({ candidateId, onRefresh }: { candidateId: number | null; onRefresh: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const result = await apiFetch(`candidates/${candidateId}/placement`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load placement data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [candidateId]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data || !data.has_placements) {
    return (
      <ErrorState
        message={error || "No placement data found. You haven't been placed yet."}
        onRetry={() => candidateId && window.location.reload()}
      />
    );
  }

  const placement = data.active_placement;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Company" value={placement.company} />
        <InfoCard title="Position" value={placement.position} />
        <InfoCard title="Placement Date" value={placement.placement_date ? format(parseISO(placement.placement_date), "MMM dd, yyyy") : "N/A"} />
        <InfoCard title="Status" value={placement.status} />
        {placement.base_salary_offered && (
          <InfoCard title="Base Salary" value={`$${placement.base_salary_offered.toLocaleString()}`} />
        )}
        {placement.type && <InfoCard title="Type" value={placement.type} />}
      </div>
    </div>
  );
};

// Helper Components
const InfoCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl">
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
  </div>
);

const LoadingState = () => (
  <div className="text-center py-12">
    <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="text-center py-12">
    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
    <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

