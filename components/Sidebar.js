"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/utils/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const Sidebar = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false); // Start closed by default
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [hasCheckedLogin, setHasCheckedLogin] = useState(false);
  const [activeSection, setActiveSection] = useState("placements");
  const [mounted, setMounted] = useState(false);
  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const prevAuthState = useRef(isAuthenticated);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset login flags when user logs out
  useEffect(() => {
    // If user was authenticated and now is not (logout occurred)
    if (prevAuthState.current === true && isAuthenticated === false) {
      // console.log("Logout detected - resetting first login flags");
      localStorage.removeItem("hasLoggedIn");
      setIsFirstLogin(false);
      setHasCheckedLogin(false);
    }
    
    // Update previous auth state
    prevAuthState.current = isAuthenticated;
  }, [isAuthenticated]);

  // Check for first login or returning user
  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated && !hasCheckedLogin) {
      // Check if this is a first login or user has logged in before
      const hasLoggedInBefore = localStorage.getItem("hasLoggedIn");
      
      if (!hasLoggedInBefore) {
        // First time login - sidebar should be open
        // console.log("First time login detected - opening sidebar");
        setIsOpen(true);
        localStorage.setItem("hasLoggedIn", "true");
        setIsFirstLogin(true);
      } else {
        // Returning user - get their previous sidebar state
        const savedSidebarState = localStorage.getItem("sidebarOpen");
        // console.log("Returning user - sidebar state:", savedSidebarState);
        setIsOpen(savedSidebarState === "true");
      }
      
      // Mark that we've checked login status
      setHasCheckedLogin(true);
    }
  }, [isAuthenticated, hasCheckedLogin]);

  // Save sidebar state when it changes (but only after initial login check)
  useEffect(() => {
    if (isAuthenticated && typeof window !== "undefined" && hasCheckedLogin) {
      localStorage.setItem("sidebarOpen", isOpen.toString());
    }
  }, [isOpen, isAuthenticated, hasCheckedLogin]);

  // Handle clicks outside sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only process if sidebar is open and we're past the initial login check
      if (!isOpen || !hasCheckedLogin) return;
      
      // Check if click is outside sidebar and not on toggle button
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target) && 
        toggleBtnRef.current && 
        !toggleBtnRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, hasCheckedLogin]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  if (!isAuthenticated) {
    return null; // Don't render sidebar for non-authenticated users
  }

  // Determine color scheme based on theme
  const isDark = mounted && (theme === "dark");

  // Dummy data for placements
  const placementsData = [
    {
      id: 1,
      name: "Malathi",
      company: "Wipro",
      role: "AIML Engineer",
      date: "05/2025",
      batch: "2025",
    },
    {
      id: 2,
      name: "Deepa",
      company: "Walmart",
      role: "ML Engineer",
      date: "01/2025",
      batch: "2025",
    },
    {
      id: 3,
      name: "Nimmy",
      company: "Alo Yoga",
      role: "Frontend Developer",
      date: "01/2025",
      batch: "2025",
    },
    {
      id: 4,
      name: "Ayesha",
      company: "Franklin Templeton",
      role: "Frontend React Developer",
      date: "01/2025",
      batch: "2025",
    }
   
  ];

  // Dummy data for announcements
  const announcementsData = [
    {
      id: 1,
      title: "Today's Class",
      description: "Advanced React Patterns at 2:00 PM",
      date: "Today",
      important: true,
    },
    {
      id: 2,
      title: "Mock Interview",
      description: "Prepare for technical round with FAANG companies",
      date: "Tomorrow, 11:00 AM",
      important: false,
    },
    {
      id: 3,
      title: "Session",
      description: "Industry expert session on Cloud Architecture",
      date: "Feb 28, 3:00 PM",
      important: true,
    },
    {
      id: 4,
      title: "Assignment Deadline",
      description: "Submit your project by midnight",
      date: "Feb 29",
      important: true,
    }
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        ref={toggleBtnRef}
        onClick={toggleSidebar}
        className={`fixed top-1/2 -translate-y-1/2 z-[9999] ${
          isDark 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
            : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
        } py-4 px-2 rounded-r-xl shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl focus:outline-none ${!isOpen && 'pulse-animation'} border-r-0 border-2 ${isDark ? 'border-indigo-400' : 'border-purple-300'}`}
        aria-label="Toggle Sidebar"
        style={{
          left: isOpen ? '280px' : '0',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 h-8 w-8 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
          />
        </svg>
      </button>
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed left-0 top-0 ${
          isDark 
            ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-gray-100' 
            : 'bg-gradient-to-b from-indigo-900 to-purple-800 text-white'
        } h-full transition-all duration-500 ease-in-out z-[9999] shadow-2xl ${
          isOpen ? "w-80" : "w-0"
        } scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent scrollbar-thumb-rounded-full hover:scrollbar-thumb-gray-300`}
        style={{ 
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isOpen ? 1 : 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div className="flex flex-col h-full pb-32">
          {/* Dashboard header - moved to very top with no padding */}
          <div className={`py-4 text-center border-b ${isDark ? 'border-gray-700 bg-black/30' : 'border-white/10 bg-black/20'} backdrop-blur-sm sticky top-0 z-10`}>
            <h2 className={`font-bold text-2xl ${
              isDark 
                ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent'
            }`}>Dashboard</h2>
          </div>
          
          <nav className="mt-6 flex-grow px-6">
            <div className="space-y-1.5">
              <button 
                className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
                  activeSection === "placements" ? 
                  `${isDark ? 'bg-white/10' : 'bg-white/20'} font-medium` : 
                  `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-300 hover:bg-white/10'}`
                }`}
                onClick={() => setActiveSection("placements")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Placements</span>
                <div className="ml-auto flex items-center space-x-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className={`bg-gradient-to-r ${isDark ? 'from-pink-500 to-purple-500' : 'from-red-500 to-pink-500'} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                    NEW
                  </span>
                </div>
              </button>
              
              <button 
                className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
                  activeSection === "announcements" ? 
                  `${isDark ? 'bg-white/10' : 'bg-white/20'} font-medium` : 
                  `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-300 hover:bg-white/10'}`
                }`}
                onClick={() => setActiveSection("announcements")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Announcements</span>
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  New
                </span>
              </button>
            </div>
            
            <hr className={`my-6 ${isDark ? 'border-gray-700' : 'border-white/20'}`} />
            
            {/* Content based on active section */}
            <div className="mt-4">
              {activeSection === "placements" && (
                <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-white'}`}>
                      Recent Placements
                    </h3>
                    <div className="px-2 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-md mb-3 animate-pulse">
                      New Additions
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-pink-500 to-red-500 rounded-full"></div>
                    
                    {placementsData.map((placement, index) => (
                      <div 
                        key={placement.id} 
                        className={`${isDark ? 'bg-gray-800/40' : 'bg-white/10'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/20'} transition-all cursor-pointer backdrop-blur-sm mb-3 border-l-2 ${
                          index === 0 ? 'border-red-400 shadow-lg shadow-red-500/20' : 'border-transparent'
                        }`}
                        style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                      >
                        <div className="flex justify-between">
                          <h4 className={`font-medium ${isDark ? 'text-gray-100' : 'text-white'}`}>{placement.name}</h4>
                          <span className={`${index === 0 ? 'bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded' : 'text-emerald-400'} text-sm`}>{placement.date}</span>
                        </div>
                        <p className={`${isDark ? 'text-blue-300' : 'text-blue-200'} font-medium`}>{placement.company}</p>
                        <div className="mt-1">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-300'} text-sm`}>as a {placement.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeSection === "announcements" && (
                <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                  <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-white'}`}>Announcements</h3>
                  {announcementsData.map((announcement, index) => (
                    <div 
                      key={announcement.id} 
                      className={`${isDark ? 'bg-gray-800/40' : 'bg-white/10'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/20'} transition-all cursor-pointer backdrop-blur-sm`}
                      style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className={`font-medium ${isDark ? 'text-gray-100' : 'text-white'} flex items-center`}>
                          {announcement.title}
                          {announcement.important && (
                            <span className="ml-2 bg-red-500 h-2 w-2 rounded-full inline-block"></span>
                          )}
                        </h4>
                        <span className={`${isDark ? 'text-blue-300' : 'text-blue-200'} text-xs`}>{announcement.date}</span>
                      </div>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-300'} mt-1 text-sm`}>{announcement.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Added large empty space for bottom padding */}
            <div className="h-20"></div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 