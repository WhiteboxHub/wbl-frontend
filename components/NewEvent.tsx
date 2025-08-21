"use client";

import React, { useState, useEffect } from 'react';
import { X, Bell, ChevronRight, Calendar, Clock, MapPin, ExternalLink, Brain, Cpu } from 'lucide-react';

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

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 lg:bottom-20 lg:right-4 z-50 animate-slide-in-right">
      {isMinimized ? (
        // Minimized state - just a bell icon with event count
        <div 
          className="bg-gradient-to-br from-indigo-900 to-purple-400 hover:bg-gradient-to-tl hover:from-indigo-900 hover:to-purple-400 text-white p-2.5 sm:p-3 rounded-full shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-110 relative shadow-purple-500/50 shadow-xl"
          onClick={handleMinimize}
        >
          <Bell size={18} className="sm:w-5 sm:h-5" />
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
            1
          </div>
        </div>
      ) : isExpanded ? (
        // Expanded state - full event details card
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-72 sm:w-80 md:w-96 max-w-[90vw] animate-slide-up shadow-purple-500/20 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Orientation Event Details
              </h3>
            </div>
            <button
              onClick={handleExpand}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Event Content */}
          <div className="p-3 sm:p-4 space-y-3">
            {/* Main Event Info */}
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Orientation for Aug Batch 2025
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                AI/ML Program - New batch begins August 11th, 2025
              </p>
            </div>

            {/* Orientation Details */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 space-y-1">
              <div className="flex items-center space-x-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                <Calendar size={14} />
                <span>August 9th, 2025 • 10:00 AM - 12:00 PM PST</span>
              </div>
            </div>



            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => window.open('https://attendee.gotowebinar.com/register/1612459539742295386', '_blank')}
                className="w-full rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 py-2.5 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 hover:bg-gradient-to-tl hover:from-indigo-900 hover:to-purple-400 lg:text-base shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Register
              </button>
              
              <button
                onClick={() => window.open('https://chat.whatsapp.com/JDfFb0sAaHmDcYvCz3dE4S', '_blank')}
                className="w-full rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 py-2.5 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 hover:bg-gradient-to-tl hover:from-indigo-900 hover:to-purple-400 lg:text-base shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                WhatsApp Group
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Collapsed state - purple pill with calendar icon
        <div 
          className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-full shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 relative flex items-center space-x-2 sm:space-x-3 min-w-48 sm:min-w-56 md:min-w-64 animate-pulse shadow-purple-500/50 shadow-xl"
          onClick={handleExpand}
        >
          {/* Calendar Icon Circle */}
          <div className="bg-purple-500 rounded-full p-1.5 sm:p-2 flex-shrink-0">
            <Calendar size={14} className="sm:w-4 sm:h-4 text-white" />
          </div>
          
          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs sm:text-sm truncate">Upcoming Event!</div>
            <div className="text-xs opacity-90 truncate">New Batch</div>
          </div>
          
          {/* Red Notification Dot */}
          <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3"></div>
        </div>
      )}


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