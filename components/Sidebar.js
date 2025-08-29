
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import { useTheme } from "next-themes";
import axios from "axios";
import { motion } from "framer-motion";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { isAuthenticated, sidebarOpen, setSidebarOpen } = useAuth();
  const { theme } = useTheme();

  const [hasCheckedLogin, setHasCheckedLogin] = useState(false);
  const [activeSection, setActiveSection] = useState("placements");
  const [placementsData, setPlacementsData] = useState([]);
  const [interviewsData, setInterviewsData] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [showPulse, setShowPulse] = useState(true);
  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);

  const isDark = mounted && theme === "dark";

  useEffect(() => setMounted(true), []);

  // Limit pulse animation to 3 blinks then stop - must be before any returns
  useEffect(() => {
    if (pulseCount < 3 && showPulse && !sidebarOpen) {
      const timer = setTimeout(() => {
        setPulseCount(prev => prev + 1);
        if (pulseCount >= 2) {
          setShowPulse(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pulseCount, showPulse, sidebarOpen]);

  // Auto-open on first login with animation
  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated && !hasCheckedLogin) {
      const hasLoggedInBefore = localStorage.getItem("hasLoggedIn");

      if (!hasLoggedInBefore) {
        localStorage.setItem("hasLoggedIn", "true");
        setTimeout(() => setSidebarOpen(true), 100);
      } else {
        const saved = localStorage.getItem("sidebarOpen");
        setSidebarOpen(saved === "true");
      }

      setHasCheckedLogin(true);
    }
  }, [isAuthenticated, hasCheckedLogin, setSidebarOpen]);

  // Persist sidebar state
  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated) {
      localStorage.setItem("sidebarOpen", sidebarOpen.toString());
    }
  }, [sidebarOpen, isAuthenticated]);

  // Close sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setSidebarOpen]);

  // Fetch placements (DESC order) and interviews
  useEffect(() => {
    const fetchData = async () => {
      try {
        const placementsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/candidate/placements`
        );
        setPlacementsData(placementsRes.data.data || placementsRes.data);

        const interviewsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/interviews` // ✅ fixed route
        );
        setInterviewsData(interviewsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        ref={toggleBtnRef}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-[9999] ${
          isDark
            ? "bg-gradient-to-r from-purple-400 to-indigo-500 text-white"
            : "bg-gradient-to-r from-purple-300 to-indigo-400 text-white"
        } py-4 px-2 rounded-r-xl shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl focus:outline-none ${
          !sidebarOpen && showPulse && "pulse-animation"
        } border-r-0 border-2 ${
          isDark ? "border-indigo-400" : "border-purple-300"
        }`}
        aria-label="Toggle Sidebar"
        style={{ left: sidebarOpen ? "280px" : "0" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 h-8 w-8 ${
            sidebarOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={
              sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"
            }
          />
        </svg>
      </button>

      {/* Sidebar */}
      <motion.div
        ref={sidebarRef}
        initial={{ x: "-100%", opacity: 0 }}
        animate={{
          x: sidebarOpen ? 0 : "-100%",
          opacity: sidebarOpen ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 70, damping: 15 }}
        className={`fixed left-0 top-0 ${
          isDark
            ? "bg-gradient-to-b from-gray-900 to-indigo-800 text-gray-100"
            : "bg-gradient-to-b from-purple-200 via-purple-300 to-indigo-300 text-gray-900"
        } h-full z-[9999] shadow-2xl ${
          sidebarOpen ? "w-80" : "w-0"
        }`}
        style={{
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div className="flex flex-col h-full pb-32">
          {/* Header */}
          <div
            className={`py-4 text-center border-b ${
              isDark
                ? "border-gray-700 bg-black/30"
                : "border-white/10 bg-black/10"
            } backdrop-blur-sm sticky top-0 z-10`}
          >
            <h2
              className={`font-bold text-2xl ${
                isDark
                  ? "bg-gradient-to-r from-gray-300 to-indigo-500 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-purple-500 via-indigo-500 to-indigo-600 bg-clip-text text-transparent"
              }`}
            >
              Dashboard
            </h2>
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex-grow px-6">
            <div className="space-y-1.5">
              <button
                className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
                  activeSection === "placements"
                    ? `${
                        isDark ? "bg-white/10" : "bg-white/30"
                      } font-medium`
                    : `${
                        isDark
                          ? "text-gray-300 hover:bg-white/5"
                          : "text-gray-800 hover:bg-white/20"
                      }`
                }`}
                onClick={() => setActiveSection("placements")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-semibold">Recent Placements</span>
              </button>

              <button
                className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
                  activeSection === "announcements"
                    ? `${
                        isDark ? "bg-white/10" : "bg-white/30"
                      } font-medium`
                    : `${
                        isDark
                          ? "text-gray-300 hover:bg-white/5"
                          : "text-gray-800 hover:bg-white/20"
                      }`
                }`}
                onClick={() => setActiveSection("announcements")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="font-semibold">Recent Interviews</span>
              </button>
            </div>

            <hr
              className={`my-6 ${
                isDark ? "border-gray-700" : "border-white/20"
              }`}
            />

            {/* Content */}
            <div className="mt-4">
              {activeSection === "placements" && (
                <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                  <h3
                    className={`text-xl font-bold mb-4 ${
                      isDark ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    Recent Placements
                  </h3>
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-pink-400 to-indigo-300 rounded-full"></div>
                    {placementsData.map((placement) => (
                      <div
                        key={placement.id}
                        className={`${
                          isDark ? "bg-gray-800/40" : "bg-white/20"
                        } p-3 rounded-lg ${
                          isDark
                            ? "hover:bg-gray-700/40"
                            : "hover:bg-white/30"
                        } transition-all cursor-pointer backdrop-blur-sm mb-3`}
                      >
                        <div className="flex justify-between">
                          <h4
                            className={`font-semibold ${
                              isDark ? "text-gray-100" : "text-gray-800"
                            }`}
                          >
                            {placement.candidate_name}
                          </h4>
                          <span className="text-sm font-semibold">
                            {new Date(
                              placement.placement_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-blue-500 font-semibold">
                          {placement.company}
                        </p>
                        <div className="mt-1">
                          <span className="text-sm font-semibold">
                            {placement.position}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "announcements" && (
                <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                  <h3
                    className={`text-xl font-bold mb-4 ${
                      isDark ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    Recent Interviews
                  </h3>
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-300 rounded-full"></div>
                    {interviewsData.slice(0, 6).map((interview) => (
                      <div
                        key={interview.id}
                        className={`${
                          isDark ? "bg-gray-800/40" : "bg-white/20"
                        } p-3 rounded-lg ${
                          isDark
                            ? "hover:bg-gray-700/40"
                            : "hover:bg-white/30"
                        } transition-all cursor-pointer backdrop-blur-sm mb-3`}
                      >
                        <div className="flex justify-between">
                          <h4
                            className={`font-semibold ${
                              isDark ? "text-gray-100" : "text-gray-800"
                            }`}
                          >
                            {interview.candidate_name}
                          </h4>
                          <span className="text-sm font-semibold">
                            {interview.interview_date
                              ? new Date(
                                  interview.interview_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        <p className="text-blue-500 font-semibold">
                          {interview.company}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
