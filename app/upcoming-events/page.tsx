"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/AuthContext';
import { ArrowLeft, Calendar, Clock, MapPin, ExternalLink, Users, Star, Eye } from 'lucide-react';

const UpcomingEventsPage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Sample events data
  const events = [
    {
      id: 1,
      title: "Orientation for Aug Batch 2025",
      date: "August 9th, 2025",
      time: "10:00 AM - 12:00 PM PST",
      program: "AI/ML Training Program",
      batchStart: "August 11th, 2025",
      description: "Join us for an informative orientation session for our upcoming AI/ML training batch.",
      registerLink: "https://attendee.gotowebinar.com/register/1612459539742295386",
      whatsappLink: "https://chat.whatsapp.com/JDfFb0sAaHmDcYvCz3dE4S"
    },
    // {
    //   id: 2,
    //   title: "Data Science Workshop",
    //   date: "August 15th, 2025",
    //   time: "2:00 PM - 4:00 PM PST",
    //   program: "Data Science Program",
    //   batchStart: "August 18th, 2025",
    //   description: "Hands-on workshop covering data analysis, machine learning, and visualization techniques.",
    //   registerLink: "https://example.com/register",
    //   whatsappLink: "https://chat.whatsapp.com/JDfFb0sAaHmDcYvCz3dE4S"
    // },
    // {
    //   id: 3,
    //   title: "Machine Learning Bootcamp",
    //   date: "August 22nd, 2025",
    //   time: "11:00 AM - 1:00 PM PST",
    //   program: "ML Advanced Program",
    //   batchStart: "August 25th, 2025",
    //   description: "Intensive bootcamp focusing on advanced machine learning algorithms and real-world applications.",
    //   registerLink: "https://example.com/register",
    //   whatsappLink: "https://chat.whatsapp.com/JDfFb0sAaHmDcYvCz3dE4S"
    // }
  ];

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleBack = () => {
    router.back();
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <>
      <main className="container px-4 py-6 sm:px-6">
        {/* Header */}
        <nav className="mt-5 flex h-16 flex-col items-start justify-center sm:mt-8 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
        </nav>

        {/* Main Content */}
        <section className="relative flex h-full justify-center lg:min-h-[600px]">
          <div className="flex w-full flex-col justify-center rounded-3xl bg-gradient-to-tl from-sky-300 via-purple-300 to-indigo-400 p-8 px-10 py-15 text-white shadow-lg dark:bg-gradient-to-br dark:from-dark/50 dark:to-primarylight/25 sm:w-4/5 lg:w-3/4">
            {!selectedEvent ? (
              // Events List View
              <>
                {/* Header Section */}
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <div className="bg-white/20 rounded-full p-4">
                      <Calendar size={40} className="text-white" />
                    </div>
                  </div>
                  <h2 className="mb-4 text-center text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                    📢 Upcoming Events
                  </h2>
                  <p className="text-gray-700 dark:text-gray-200 text-lg">
                    Discover our latest training programs and workshops
                  </p>
                </div>

                {/* Events List */}
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white/10 rounded-lg p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 mb-4 sm:mb-0">
                          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                            {event.title}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                            <div className="flex items-center space-x-2">
                              <Calendar size={14} className="text-blue-500" />
                              <span>{event.date} • {event.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users size={14} className="text-green-500" />
                              <span>{event.program}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewDetails(event)}
                          className="flex items-center space-x-2 bg-gradient-to-br from-indigo-900 to-purple-400 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-gradient-to-tl hover:from-indigo-900 hover:to-purple-400 transition-all duration-300 transform hover:scale-105"
                        >
                          <Eye size={16} />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Event Details View
              <>
                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handleCloseDetails}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">Back to Events</span>
                  </button>
                </div>

                {/* Event Details */}
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <div className="bg-white/20 rounded-full p-4">
                      <Calendar size={40} className="text-white" />
                    </div>
                  </div>
                  <h2 className="mb-4 text-center text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                    📢 {selectedEvent.title}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-200 text-lg">
                    {selectedEvent.program} - Batch starts {selectedEvent.batchStart}
                  </p>
                </div>

                {/* Event Details */}
                <div className="mb-8 bg-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                    <Calendar className="mr-2" size={24} />
                    Event Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4">
                      <Calendar className="text-blue-500" size={20} />
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-white">Date & Time</span>
                        <p className="text-gray-700 dark:text-gray-200 text-sm">{selectedEvent.date} • {selectedEvent.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4">
                      <Users className="text-green-500" size={20} />
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-white">Program</span>
                        <p className="text-gray-700 dark:text-gray-200 text-sm">{selectedEvent.program}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4">
                      <Star className="text-yellow-500" size={20} />
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-white">Batch Start</span>
                        <p className="text-gray-700 dark:text-gray-200 text-sm">{selectedEvent.batchStart}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Description */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                    About This Event
                  </h3>
                  <div className="bg-white/10 rounded-lg p-6">
                    <p className="text-gray-700 dark:text-gray-200 text-lg">
                      {selectedEvent.description}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                    Join the Event
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => window.open(selectedEvent.registerLink, '_blank')}
                      className="w-full rounded-full bg-gradient-to-br from-indigo-900 to-purple-400 py-3 px-6 text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 hover:bg-gradient-to-tl hover:from-indigo-900 hover:to-purple-400 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Register for Event
                    </button>
                    
                    <button
                      onClick={() => window.open(selectedEvent.whatsappLink, '_blank')}
                      className="w-full rounded-full bg-gradient-to-br from-green-600 to-emerald-500 py-3 px-6 text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 hover:bg-gradient-to-tl hover:from-green-600 hover:to-emerald-500 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Join WhatsApp Group
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Background Decoration */}
          <div className="absolute top-1/2 left-1/2 -z-10 hidden w-full -translate-x-1/2 -translate-y-1/2 transform md:block">
            <svg
              className="h-full w-full"
              viewBox="0 0 1440 969"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <mask
                id="mask0_95:1005"
                style={{ maskType: "alpha" }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="1440"
                height="969"
              >
                <rect width="1440" height="969" fill="#090E34" />
              </mask>
              <g mask="url(#mask0_95:1005)">
                <path
                  opacity="0.1"
                  d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
                  fill="url(#paint0_linear_95:1005)"
                />
                <path
                  opacity="0.1"
                  d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
                  fill="url(#paint1_linear_95:1005)"
                />
              </g>
              <defs>
                <linearGradient
                  id="paint0_linear_95:1005"
                  x1="1178.4"
                  y1="151.853"
                  x2="780.959"
                  y2="453.581"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#4A6CF7" />
                  <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_95:1005"
                  x1="160.5"
                  y1="220"
                  x2="1099.45"
                  y2="1192.04"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#4A6CF7" />
                  <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </section>
      </main>
    </>
  );
};

export default UpcomingEventsPage; 