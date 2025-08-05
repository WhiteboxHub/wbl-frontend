"use client";

import React, { useState, useEffect } from 'react';
import { X, Bell, ChevronRight, Calendar, Clock, MapPin, ExternalLink, Brain, Cpu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface NewEventProps {
  title?: string;
  message?: string;
  ctaText?: string;
  ctaLink?: string;
  autoHide?: boolean;
  autoHideDelay?: number;
  onClose?: () => void;
  onCtaClick?: () => void;
}

const NewEvent: React.FC<NewEventProps> = ({
  title = "Upcoming Events",
  message = "Check out our latest events and updates!",
  ctaText = "Learn More",
  ctaLink = "#",
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
    router.push('/upcoming-events');
  };

  // Hide component if user is on the upcoming-events page
  if (!isVisible || pathname === '/upcoming-events') return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 lg:bottom-20 lg:right-4 z-50 animate-slide-in-right">
      {/* Direct navigation button - no expanded state */}
      <div 
        className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-full shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 relative flex items-center space-x-2 sm:space-x-3 min-w-32 sm:min-w-40 md:min-w-48 animate-pulse shadow-purple-500/50 shadow-xl"
        onClick={handleExpand}
      >
        {/* Calendar Icon Circle */}
        <div className="bg-purple-500 rounded-full p-1.5 sm:p-2 flex-shrink-0">
          <Calendar size={14} className="sm:w-4 sm:h-4 text-white" />
        </div>
        
        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xs sm:text-sm truncate">Upcoming Event!</div>
          <div className="text-xs opacity-90 truncate">View Details</div>
        </div>
        
        {/* Red Notification Dot */}
        <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3"></div>
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
        
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
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

export default NewEvent; 