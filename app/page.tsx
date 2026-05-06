"use client";

import Features from "@/components/Features";
import Hero from "@/components/Hero";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/AuthContext";

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



  return (
    <div className="w-full min-h-screen pt-0">
      <Hero />
      <Features />
    </div>
  );
}
