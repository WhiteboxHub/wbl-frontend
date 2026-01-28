"use client";

import Features from "@/components/Features";
import Hero from "@/components/Hero";
import { Inter } from "next/font/google";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/AuthContext";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import CandidateDashboard from "@/components/CandidateDashboard";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === "admin") {
        router.push("/avatar");
      }
    }
  }, [isAuthenticated, userRole, router]);

  if (isAuthenticated) {
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
  }

  return (
    <div className="w-full min-h-screen pt-0">
      <Hero />
      <Features />
    </div>
  );
}
