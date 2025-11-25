


"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  User,
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
  Bell,
  Settings,
  LogOut,
  BookOpen,
  PlayCircle,
  Search,
  ExternalLink,
  FileText,
  Home,
  Video,
  MessageSquare,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

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
    placement: { completed: boolean; active: boolean; company: string; position: string };
  };
  phase_metrics: {
    enrolled: { date: string; batch_name: string; status: string };
    preparation?: { status: string; rating: string; communication: string; duration_days: number };
    marketing?: { total_interviews: number; positive_interviews: number; success_rate: number; duration_days: number };
    placement?: { company: string; position: string; base_salary: number };
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
  recent_interviews: Array<{
    company: string;
    interview_date: string;
    type_of_interview: string;
    feedback: string;
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

type TabType = 'overview' | 'journey' | 'team' | 'sessions' | 'interviews' | 'statistics';

const extractErrorMessage = (err: ApiError, defaultMessage: string): string => {
  return err.body?.detail || err.body?.message || err.detail || err.message || defaultMessage;
};

export default function CandidateDashboard() {
  const router = useRouter();
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


  // Update the loadSessions function in your React component
  const loadDashboard = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token") || localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const profileData = await loadUserProfile();
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
    loadDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center px-4">
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

  // Navigation tabs configuration
  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: Home },
    { id: 'journey' as TabType, name: 'Journey', icon: TrendingUp },
    { id: 'team' as TabType, name: 'My Team', icon: Users },
    { id: 'sessions' as TabType, name: 'Sessions', icon: PlayCircle },
    { id: 'interviews' as TabType, name: 'Interviews', icon: MessageSquare },
    { id: 'statistics' as TabType, name: 'Statistics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* ==================== HEADER ==================== */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
            </div>
          </div>
        </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
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
        <div className="mb-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                <div className="relative">
                  <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white/30">
                    {data.basic_info.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                    Welcome back, {firstName}! 👋
                  </h1>

                  <div className="flex flex-col lg:flex-row gap-4 mb-4 text-white/90">
                    <div className="flex items-center justify-center lg:justify-start gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{data.basic_info.email}</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{data.basic_info.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-4 h-4 text-yellow-300" />
                        <p className="text-xs text-white/70 font-medium">Batch</p>
                      </div>
                      <p className="text-lg font-bold text-white">{data.basic_info.batch_name || "N/A"}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-300" />
                        <p className="text-xs text-white/70 font-medium">Enrolled</p>
                      </div>
                      <p className="text-sm font-bold text-white">
                        {data.basic_info.enrolled_date ? format(parseISO(data.basic_info.enrolled_date), "MMM dd, yyyy") : "N/A"}
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-green-300" />
                        <p className="text-xs text-white/70 font-medium">Login Count</p>
                      </div>
                      <p className="text-2xl font-bold text-white">{userProfile?.login_count || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== NAVIGATION TABS ==================== */}
        <div className="mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-2">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-center">{tab.name}</span>
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
                  icon={<CheckCircle className="w-6 h-6" />}
                  color="blue"
                  completed={data.journey.enrolled.completed}
                  daysSince={data.journey.enrolled.days_since}
                  batchName={data.basic_info.batch_name}
                />
                <PhaseCard
                  title="Preparation"
                  icon={<BookOpen className="w-6 h-6" />}
                  color="purple"
                  active={data.journey.preparation.active}
                  completed={data.journey.preparation.completed}
                  durationDays={data.journey.preparation.duration_days}
                  rating={data.phase_metrics.preparation?.rating}
                />
                <PhaseCard
                  title="Marketing"
                  icon={<Target className="w-6 h-6" />}
                  color="green"
                  active={data.journey.marketing.active}
                  completed={data.journey.marketing.completed}
                  durationDays={data.journey.marketing.duration_days}
                  interviews={data.phase_metrics.marketing?.total_interviews}
                  successRate={data.phase_metrics.marketing?.success_rate}
                />
                <PhaseCard
                  title="Placement"
                  icon={<Briefcase className="w-6 h-6" />}
                  color="orange"
                  active={data.journey.placement.active}
                  completed={data.journey.placement.completed}
                  company={data.phase_metrics.placement?.company}
                />
              </div>
            </div>
          )}

          {/* JOURNEY TAB */}
          {activeTab === 'journey' && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                Journey Timeline
              </h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${data.journey.enrolled.completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Enrolled</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {data.journey.enrolled.date ? format(parseISO(data.journey.enrolled.date), "MMM dd, yyyy") : "N/A"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{data.journey.enrolled.days_since} days ago</p>
                  </div>
                </div>

                <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 h-8"></div>

                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${data.journey.preparation.active ? 'bg-blue-500' :
                    data.journey.preparation.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    {data.journey.preparation.active ? (
                      <Clock className="w-5 h-5 text-white animate-pulse" />
                    ) : data.journey.preparation.completed ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Clock className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Preparation</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {data.journey.preparation.start_date ? format(parseISO(data.journey.preparation.start_date), "MMM dd, yyyy") : "Not Started"}
                    </p>
                    {data.journey.preparation.active && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                        Active - {data.journey.preparation.duration_days} days
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 h-8"></div>

                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${data.journey.marketing.active ? 'bg-orange-500' :
                    data.journey.marketing.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    {data.journey.marketing.active ? (
                      <Target className="w-5 h-5 text-white animate-pulse" />
                    ) : data.journey.marketing.completed ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Clock className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Marketing</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {data.journey.marketing.start_date ? format(parseISO(data.journey.marketing.start_date), "MMM dd, yyyy") : "Not Started"}
                    </p>
                    {data.journey.marketing.active && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                        Active - {data.journey.marketing.duration_days} days
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 h-8"></div>

                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${data.journey.placement.completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {data.journey.placement.completed ? (
                      <Briefcase className="w-5 h-5 text-white" />
                    ) : (
                      <Clock className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Placement</h4>
                    {data.journey.placement.completed ? (
                      <>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{data.journey.placement.company}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{data.journey.placement.position}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Not Placed Yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                My Team
              </h2>

              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Preparation Team</h3>
                {data.team_info.preparation.instructors.map((instructor, idx) => (
                  <div key={idx} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {instructor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{instructor.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{instructor.role}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{instructor.email}</p>
                    </div>
                  </div>
                ))}

                {data.team_info.marketing.manager && (
                  <>
                    <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Marketing Team</h3>
                    <div className="flex items-center space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:shadow-md transition-all">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {data.team_info.marketing.manager.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{data.team_info.marketing.manager.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Marketing Manager</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{data.team_info.marketing.manager.email}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
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
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-500" />
                Interview History
              </h2>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.recent_interviews.length > 0 ? (
                  data.recent_interviews.map((interview, idx) => (
                    <div key={idx} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:shadow-md transition-all">
                      <div className={`w-3 h-3 rounded-full mt-2 ${interview.feedback === 'Positive' ? 'bg-green-500' :
                        interview.feedback === 'Negative' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{interview.company}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{interview.type_of_interview}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {format(parseISO(interview.interview_date), "MMM dd, yyyy")}
                          </span>
                          <span className={`text-xs px-3 py-1 rounded-full ${interview.feedback === 'Positive' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            interview.feedback === 'Negative' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            }`}>
                            {interview.feedback}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No recent interviews</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-4xl font-bold mb-2">{data.interview_stats.total}</div>
                  <div className="text-sm opacity-90">Total Interviews</div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-4xl font-bold mb-2">{data.interview_stats.success_rate}%</div>
                  <div className="text-sm opacity-90">Success Rate</div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-4xl font-bold mb-2">
                    {data.journey.placement.completed ? '100%' : '0%'}
                  </div>
                  <div className="text-sm opacity-90">Placement Status</div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-4xl font-bold mb-2">{data.interview_stats.positive}</div>
                  <div className="text-sm opacity-90">Positive Interviews</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 text-center border-2 border-green-200 dark:border-green-800">
                  <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">{data.interview_stats.positive}</div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">Positive Feedbacks</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 text-center border-2 border-yellow-200 dark:border-yellow-800">
                  <div className="text-5xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{data.interview_stats.pending}</div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">Pending Results</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const PhaseCard = ({
  title, icon, color, completed, active, daysSince, durationDays, batchName, rating, interviews, successRate, company,
}: {
  title: string; icon: React.ReactNode; color: string; completed?: boolean; active?: boolean; daysSince?: number;
  durationDays?: number; batchName?: string; rating?: string; interviews?: number; successRate?: number; company?: string;
}) => {
  const colorClasses: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      border: "border-blue-200 dark:border-blue-800",
      icon: "bg-blue-500 text-white",
      badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      border: "border-purple-200 dark:border-purple-800",
      icon: "bg-purple-500 text-white",
      badge: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      border: "border-green-200 dark:border-green-800",
      icon: "bg-green-500 text-white",
      badge: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
      border: "border-orange-200 dark:border-orange-800",
      icon: "bg-orange-500 text-white",
      badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className={`p-3 rounded-xl ${colors.icon} shadow-md`}>{icon}</div>
      </div>

      <div className="space-y-2">
        {active && (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
            <div className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></div>
            Active
          </span>
        )}
        {completed && !active && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        )}
        {!active && !completed && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            Pending
          </span>
        )}

        {daysSince !== undefined && daysSince !== null && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{daysSince} days since start</p>
        )}
        {durationDays !== undefined && durationDays !== null && (
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{durationDays} days in phase</p>
        )}
        {batchName && <p className="text-sm text-gray-600 dark:text-gray-400">📚 {batchName}</p>}
        {rating && (
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">⭐ Rating: {rating}</p>
        )}
        {interviews !== undefined && interviews !== null && (
          <p className="text-sm text-gray-600 dark:text-gray-400">🎯 {interviews} interviews</p>
        )}
        {successRate !== undefined && successRate !== null && (
          <p className="text-sm font-bold text-green-600 dark:text-green-400">
             {successRate.toFixed(1)}% success
          </p>
        )}
        {company && (
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">🏢 {company}</p>
        )}
      </div>
    </div>
  );
};



