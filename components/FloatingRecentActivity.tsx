"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/utils/AuthContext";
import { InfiniteMovingCards } from "./ui/infinite-moving-cards";
import { HoverEffect } from "./ui/card-hover-effect";

export default function FloatingRecentActivity() {
  const { isAuthenticated } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [active, setActive] = useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const [interviewsRes, placementsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/interviews`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/candidate/placements`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const sortedInterviews = (interviewsRes.data || []).sort((a: any, b: any) => 
        new Date(b.interview_date).getTime() - new Date(a.interview_date).getTime()
      ).map((item: any) => ({
        name: item.candidate?.full_name?.split(" ")[0] || "Unknown",
        date: formatDateUS(item.interview_date),
        client: item.company || "N/A",
      }));

      const rawPlacements = placementsRes.data.data || placementsRes.data || [];
      const sortedPlacements = [...rawPlacements].sort((a: any, b: any) => 
        new Date(b.placement_date).getTime() - new Date(a.placement_date).getTime()
      ).map((item: any) => ({
        name: item.candidate_name?.split(" ")[0] || "Unknown",
        date: formatDateUS(item.placement_date),
        client: item.company || "N/A",
      }));

      setInterviews(sortedInterviews);
      setPlacements(sortedPlacements);
    } catch (err) {
      console.error("Error fetching activity data:", err);
    }
  };

  const formatDateUS = (dateString: string) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("-");
    return `${month}-${day}-${year}`;
  };

  const handleHoverChange = (item: { key: string } | null) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (item) {
      setActive(item.key as any);
    } else {
      // Delay closing to allow moving cursor into the popover
      timeoutRef.current = setTimeout(() => {
        setActive(null);
      }, 300);
    }
  };

  const handlePopoverEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
  
  const handlePopoverLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActive(null);
    }, 300);
  };

  if (!isAuthenticated) return null;
  const triggerItems = [
    { title: "Recent Interviews", description: "", key: "interviews" },
    { title: "Recent Placements", description: "", key: "placements" },
  ];

  return (
    <div className="fixed bottom-10 left-10 z-[9999] pointer-events-none">
      <div className="relative pointer-events-auto">
        {/* Floating cards container */}
        {active && (
          <div 
            className="absolute bottom-full mb-4 left-0 w-64 h-[380px] fade-in"
            onMouseEnter={handlePopoverEnter}
            onMouseLeave={handlePopoverLeave}
          >
            <div className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 overflow-hidden h-full flex flex-col">
              <div className="mb-4 px-4 flex justify-between items-center shrink-0">
                <span className="text-[12px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                  {active === "interviews" ? "Recent Interviews" : "Recent Placements"}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Live Feed</span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <InfiniteMovingCards
                  key={active}
                  items={active === "interviews" ? interviews : placements}
                  direction="up"
                  speed="slow"
                  orientation="vertical"
                  className="h-full"
                />
              </div>
            </div>
            {/* Pointer Arrow */}
            <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white/95 dark:bg-gray-950/95 border-r border-b border-gray-200/50 dark:border-gray-800/50 rotate-45" />
          </div>
        )}



        {/* Floating Trigger Buttons */}
        <div className="floating-activity-glow">
          <HoverEffect
            items={triggerItems}
            onHoverChange={handleHoverChange}
          />
        </div>
      </div>
    </div>
  );
}
