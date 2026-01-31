
"use client";

import React from "react";
import { useAuth } from "@/utils/AuthContext";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import CandidateDashboard from "@/components/CandidateDashboard";
import { User, Phone, Mail, Activity, Clock } from "lucide-react";

interface UserProfile {
  uname: string;
  full_name: string;
  phone: string;
  login_count: number;
}

export default function UserDashboardPage() {
  const { userRole, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // If regular user (not candidate/employee), load profile
    if (isAuthenticated && !["employee", "candidate"].includes(userRole || "")) {
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

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view this page.</div>;
  }

  // Render Role-Based Dashboards
  if (userRole === "employee") {
    return (
      <div className="pt-24 pb-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <EmployeeDashboard />
      </div>
    );
  }

  if (userRole === "candidate") {
    return (
      <div className="pt-24 pb-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <CandidateDashboard />
      </div>
    );
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
              <p className="text-gray-600 dark:text-gray-400">Here's your account overview</p>
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
