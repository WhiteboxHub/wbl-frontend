"use client";

import Features from "@/components/Features";
import Hero from "@/components/Hero";
import { Inter } from "next/font/google";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/AuthContext";


const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuth();

  // Removed forced redirect to allow admins to visit the home page
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     if (userRole === "admin") {
  //       router.push("/avatar");
  //     }
  //   }
  // }, [isAuthenticated, userRole, router]);



  return (
    <div className="w-full min-h-screen pt-0">
      <Hero />
      <Features />
    </div>
  );
}
