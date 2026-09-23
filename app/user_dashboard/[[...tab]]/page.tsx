"use client";

import React from "react";
import { useAuth } from "@/utils/AuthContext";
import { useRouter } from "next/navigation";
import CandidateDashboard from "@/components/CandidateDashboard";
import Link from "next/link";
import { User, Phone, Mail, Activity, Sparkles, AlertTriangle } from "lucide-react";
import { setupApi } from "@/lib/api";
import { isTokenExpired } from "@/utils/auth";
import { Toaster } from "sonner";

interface UserProfile {
  uname: string;
  full_name: string;
  phone: string;
  login_count: number;
}

// ── Candidate sub-component with setup-status banner ─────────────────────────
function CandidateDashboardWithSetupCheck({ currentTab }: { currentTab: string }) {
  const [headerCollapsed, setHeaderCollapsed] = React.useState<boolean>(false);
  const [isWizardActive, setIsWizardActive] = React.useState<boolean>(false);
  const [activeTabState, setActiveTabState] = React.useState<string>(currentTab);

  React.useEffect(() => {
    setActiveTabState(currentTab);
  }, [currentTab]);

  React.useEffect(() => {
    const handleLayoutMode = (e: any) => {
      if (e?.detail) {
        if (typeof e.detail.headerCollapsed === "boolean") {
          setHeaderCollapsed(e.detail.headerCollapsed);
        }
        if (typeof e.detail.isWizardActive === "boolean") {
          setIsWizardActive(e.detail.isWizardActive);
        }
        if (typeof e.detail.activeTab === "string") {
          setActiveTabState(e.detail.activeTab);
        }
      }
    };
    window.addEventListener("aiprep-layout-mode", handleLayoutMode);
    return () => {
      window.removeEventListener("aiprep-layout-mode", handleLayoutMode);
    };
  }, []);

  const isAssessment =
    isWizardActive ||
    activeTabState.startsWith("ai-prep") ||
    activeTabState.startsWith("aiprep") ||
    activeTabState === "wbl-smartprep";

  const containerClasses = isAssessment
    ? `w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col transition-all duration-300 ease-in-out bg-gray-50 dark:bg-gray-900 ${
        headerCollapsed ? "pt-0" : "pt-[64px] lg:pt-[70px]"
      }`
    : `pt-24 pb-12 transition-all duration-300 ease-in-out bg-gray-50 dark:bg-gray-900 min-h-screen`;

  return (
    <div className={containerClasses}>
      <Toaster richColors position="top-center" />
      <CandidateDashboard defaultTab={currentTab} />
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────
export default function UserDashboardPage({ params }: { params: { tab?: string[] } }) {
  const { userRole, isAuthenticated } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(false);

  const currentTab = Array.isArray(params.tab)
    ? params.tab.filter(Boolean).join("/") || "overview"
    : "overview";

  React.useEffect(() => {
    // If regular user (not candidate/employee), load profile
    if (isAuthenticated && userRole && !["employee", "candidate"].includes(userRole)) {
      loadUserProfile();
    }
  }, [isAuthenticated, userRole]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token found");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user_dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch user dashboard");
      const data = await res.json();
      setUserProfile(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !isAuthenticated) {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!token || isTokenExpired(token)) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          if (window.top && window.top !== window.self) {
            window.top.location.href = "/login";
          } else {
            window.location.href = "/login";
          }
        }
      } else {
        // Fallback: If token exists but auth verification fails or hangs, redirect to login after timeout
        const fallbackTimer = setTimeout(() => {
          if (!isAuthenticated) {
            if (typeof window !== "undefined") {
              if (window.top && window.top !== window.self) {
                window.top.location.href = "/login";
              } else {
                window.location.href = "/login";
              }
            }
          }
        }, 3000);
        return () => clearTimeout(fallbackTimer);
      }
    }
  }, [mounted, isAuthenticated]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-800 dark:text-gray-100 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const hasUnexpiredToken = Boolean(token && !isTokenExpired(token));
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {hasUnexpiredToken ? "Loading..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    );
  }

  // Render Role-Based Dashboards
  if (userRole === "employee" || userRole === "admin") {
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const cid = searchParams?.get("candidateId");
    if (cid) {
      return <CandidateDashboardWithSetupCheck currentTab={currentTab} />;
    }
    if (
      currentTab.startsWith("ai-prep") ||
      currentTab.startsWith("aiprep") ||
      currentTab === "wbl-smartprep"
    ) {
      router.replace("/avatar/assessments");
      return null;
    }
    if (userRole === "employee") {
      router.replace("/avatar/employee/employee-dashboard");
      return null;
    }
    if (userRole === "admin") {
      router.replace("/avatar/assessments");
      return null;
    }
  }

  if (userRole === "candidate") {
    return <CandidateDashboardWithSetupCheck currentTab={currentTab} />;
  }

  // Fallback: Default User Dashboard (Profile View)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-800 dark:text-gray-100 animate-pulse">
          Loading Profile...
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  const getFirstName = (fullName: string) => fullName.split(' ')[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {getFirstName(userProfile.full_name).charAt(0)}
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <div className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"></div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hello, {getFirstName(userProfile.full_name)}!</h2>
              <p className="text-gray-600 dark:text-gray-400">Here&apos;s your account overview</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile Details</h2>
            <p className="text-gray-600 dark:text-gray-400">Complete information overview</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{userProfile.full_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 break-all">{userProfile.uname}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                  <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{userProfile.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Total Login Count</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{userProfile.login_count}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}