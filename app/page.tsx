"use client";

import Features from "@/components/Features";
import Hero from "@/components/Hero";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <div className="w-full min-h-screen pt-0">
      <Hero />
      <Features />
    </div>
  );
}
