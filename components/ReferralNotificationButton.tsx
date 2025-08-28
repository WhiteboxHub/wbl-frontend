"use client";
import { useAuth } from "@/utils/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const ReferralNotificationButton = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

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
        className="group relative flex items-center gap-2 px-6 py-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer z-10"
        aria-label="Refer and Earn"
        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
      >
        {/* Gift Icon */}
        <svg
          className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>
      
        {/* Button Text */}
        <span className="text-base font-semibold">Refer & Earn</span>

        {/* Notification Badge */}
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          !
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

      {/* Pulse Animation */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 opacity-75 animate-ping pointer-events-none"></div>
    </div>
  );
};

export default ReferralNotificationButton;
