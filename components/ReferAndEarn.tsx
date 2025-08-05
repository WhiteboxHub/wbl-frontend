"use client";

import React, { useState, useEffect } from 'react';
import { X, Gift, ChevronRight, Users, Star, ExternalLink } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface ReferAndEarnProps {
  title?: string;
  message?: string;
  ctaText?: string;
  autoHide?: boolean;
  autoHideDelay?: number;
  onClose?: () => void;
  onCtaClick?: () => void;
}

const ReferAndEarn: React.FC<ReferAndEarnProps> = ({
  title = "Refer & Earn",
  message = "Invite friends and earn rewards!",
  ctaText = "Learn More",
  autoHide = false,
  autoHideDelay = 5000,
  onClose,
  onCtaClick
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Show popup after a short delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    // Auto hide if enabled
    if (autoHide) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }

    return () => clearTimeout(showTimer);
  }, [autoHide, autoHideDelay]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  const handleReferAndEarnClick = () => {
    router.push('/refer-and-earn');
  };

  // Direct navigation without expanded state
  const handleDirectClick = () => {
    router.push('/refer-and-earn');
  };

  // Hide component if user is on the refer-and-earn page
  if (!isVisible || pathname === '/refer-and-earn') return null;

  return (
    <div className="fixed bottom-28 right-4 sm:bottom-32 sm:right-6 md:bottom-36 md:right-8 lg:bottom-40 lg:right-4 z-50 animate-slide-in-right">
      {/* Direct navigation button - no expanded state */}
      <div 
        className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-full shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 relative flex items-center space-x-2 sm:space-x-3 min-w-32 sm:min-w-40 md:min-w-48 animate-pulse shadow-purple-500/50 shadow-xl"
        onClick={handleDirectClick}
      >
        {/* Gift Icon Circle */}
        <div className="bg-purple-500 rounded-full p-1.5 sm:p-2 flex-shrink-0">
          <Gift size={14} className="sm:w-4 sm:h-4 text-white" />
        </div>
        
        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xs sm:text-sm truncate">Refer & Earn!</div>
          <div className="text-xs opacity-90 truncate">View Details</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-left 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ReferAndEarn; 