"use client";

import React from "react";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import { useAuth } from "@/utils/AuthContext";
import { useRouter } from "next/navigation";

export default function EmployeeDashboardAvatarPage() {
    const { userRole, isAuthenticated } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const checkAuth = async () => {
            if (localStorage.getItem("access_token") && !isAuthenticated) {
                return;
            }

            if (!isAuthenticated && !localStorage.getItem("access_token")) {
                router.push("/login");
                return;
            }

            setLoading(false);
        };

        checkAuth();
    }, [isAuthenticated, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-xl text-blue-600 font-bold">Loading Dashboard...</div>
            </div>
        )
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
        )
    }

    return (
        <div className="bg-gray-50 pt-8 pb-12">
            <EmployeeDashboard />
        </div>
    );
}
