"use client";
import { useAuth } from "@/utils/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const ReferralNotificationButton = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [showPulse, setShowPulse] = useState(true);

  // Limit pulse animation to 2 blinks then stop
  useEffect(() => {
    if (pulseCount < 2 && showPulse) {
      const timer = setTimeout(() => {
        setPulseCount(prev => prev + 1);
        if (pulseCount >= 1) {
          setShowPulse(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pulseCount, showPulse]);

  // Hide button on refer-and-earn page
  if (pathname === "/refer-and-earn") {
    return null;
  }

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  console.log("ReferralNotificationButton: Rendering button for authenticated user");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Button clicked, navigating to /refer-and-earn");
    
    // Try router.push first, then fallback to window.location
    try {
      router.push("/refer-and-earn");
    } catch (error) {
      console.error("Router navigation failed, using window.location:", error);
      window.location.href = "/refer-and-earn";
    }
  };

  const handleMainButtonClick = (e: React.MouseEvent) => {
    console.log("MAIN BUTTON CLICKED - this should appear in console");
    handleClick(e);
  };

  return (
    <div className="fixed bottom-20 right-6 z-[9999]">
      <button
        onClick={handleMainButtonClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer z-10"
        aria-label="Refer and Earn"
        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
      >
        {/* Gift Icon */}
        <svg
          className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.193c1.035 0 1.875.84 1.875 1.875v.75C22.5 10.747 21.66 11.25 20.625 11.25H12.75v-4.5h1.875a1.875 1.875 0 100-3.75c-1.036 0-1.875.84-1.875 1.875v.375h-1.5V4.125C11.25 3.089 10.41 3 9.375 3z"/>
          <path d="M11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z"/>
        </svg>
      

        {/* Notification Badge */}
        <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500">
        </div>

        {/* Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full right-0 mb-2 w-max rounded-lg bg-gray-800 px-3 py-2 text-sm text-white shadow-lg">
            <div className="relative">
              Refer someone and earn rewards!
              <div className="absolute top-full right-4 h-0 w-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        )}
      </button>

      {/* Limited Pulse Animation */}
      {showPulse && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 opacity-75 animate-ping pointer-events-none"></div>
      )}
    </div>
  );
};

export default ReferralNotificationButton;
