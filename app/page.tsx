"use client";

import Features from "@/components/Features";
import Hero from "@/components/Hero";
import HomeAIPrep from "@/components/HomeAIPrep";
import AiCurriculum from "@/components/AiCurriculum";
import CallToAction from "@/components/Home/CallToAction";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/AuthContext";


const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuth();

  // Removed auto-redirect so user can manually click Avatar/My App on the home page



  return (
    <div className="w-full min-h-screen pt-0">
      <Hero />
      <AiCurriculum />
      <HomeAIPrep />
      <Features />
      <CallToAction />
    </div>
  );
}

