// // whiteboxLearning-wbl\components\Sidebar.js
// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useAuth } from "@/utils/AuthContext";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useTheme } from "next-themes";

// const Sidebar = ({ isOpen: propIsOpen, toggleSidebar: propToggleSidebar }) => {
//   const { isAuthenticated } = useAuth();
//   const router = useRouter();
//   const { theme } = useTheme();
//   const [internalIsOpen, setInternalIsOpen] = useState(false);
//   const [isFirstLogin, setIsFirstLogin] = useState(false);
//   const [hasCheckedLogin, setHasCheckedLogin] = useState(false);
//   const [activeSection, setActiveSection] = useState("placements");
//   const [mounted, setMounted] = useState(false);
//   const sidebarRef = useRef(null);
//   const toggleBtnRef = useRef(null);
//   const prevAuthState = useRef(isAuthenticated);

//   const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
//   const toggleSidebar = propToggleSidebar !== undefined ? propToggleSidebar : () => setInternalIsOpen(!internalIsOpen);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (prevAuthState.current === true && isAuthenticated === false) {
//       localStorage.removeItem("hasLoggedIn");
//       setIsFirstLogin(false);
//       setHasCheckedLogin(false);
//     }
//     prevAuthState.current = isAuthenticated;
//   }, [isAuthenticated]);

//   useEffect(() => {
//     if (typeof window !== "undefined" && isAuthenticated && !hasCheckedLogin) {
//       const hasLoggedInBefore = localStorage.getItem("hasLoggedIn");

//       if (!hasLoggedInBefore) {
//         setInternalIsOpen(true);
//         localStorage.setItem("hasLoggedIn", "true");
//         setIsFirstLogin(true);
//       } else {
//         const savedSidebarState = localStorage.getItem("sidebarOpen");
//         setInternalIsOpen(savedSidebarState === "true");
//       }
//       setHasCheckedLogin(true);
//     }
//   }, [isAuthenticated, hasCheckedLogin]);

//   useEffect(() => {
//     if (isAuthenticated && typeof window !== "undefined" && hasCheckedLogin) {
//       localStorage.setItem("sidebarOpen", isOpen.toString());
//     }
//   }, [isOpen, isAuthenticated, hasCheckedLogin]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (!isOpen || !hasCheckedLogin) return;

//       if (
//         sidebarRef.current &&
//         !sidebarRef.current.contains(event.target) &&
//         toggleBtnRef.current &&
//         !toggleBtnRef.current.contains(event.target)
//       ) {
//         toggleSidebar();
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isOpen, hasCheckedLogin, toggleSidebar]);

//   if (!isAuthenticated) {
//     return null;
//   }

//   const isDark = mounted && (theme === "dark");

//   const placementsData = [
//     {
//       id: 1,
//       name: "Malathi",
//       company: "Wipro",
//       role: "AIML Engineer",
//       date: "05/2025",
//       batch: "2025",
//     },
//     {
//       id: 2,
//       name: "Malathi",
//       company: "Cognizant",
//       role: "AI Engineer",
//       date: "04/2025",
//       batch: "2025",
//     },
//     {
//       id: 3,
//       name: "Deepa",
//       company: "Walmart",
//       role: "ML Engineer",
//       date: "01/2025",
//       batch: "2025",
//     },
//     {
//       id: 4,
//       name: "Nimmy",
//       company: "Alo Yoga",
//       role: "Frontend Developer",
//       date: "01/2025",
//       batch: "2025",
//     },
//     {
//       id: 5,
//       name: "Ayesha",
//       company: "Franklin Templeton",
//       role: "Frontend React Developer",
//       date: "01/2025",
//       batch: "2025",
//     }
//   ];

//   const announcementsData = []; // <- Empty for demo

//   return (
//     <>
//       <button
//         ref={toggleBtnRef}
//         onClick={toggleSidebar}
//         className={`fixed top-1/2 -translate-y-1/2 z-[9999] ${
//           isDark ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
//         } py-4 px-2 rounded-r-xl shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl focus:outline-none ${!isOpen && 'pulse-animation'} border-r-0 border-2 ${isDark ? 'border-indigo-400' : 'border-purple-300'}`}
//         aria-label="Toggle Sidebar"
//         style={{ left: isOpen ? '280px' : '0' }}
//       >
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className={`transition-transform duration-500 h-8 w-8 ${isOpen ? 'rotate-180' : ''}`}
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//           strokeWidth={2.5}
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
//         </svg>
//       </button>

//       <div
//         ref={sidebarRef}
//         className={`fixed left-0 top-0 ${
//           isDark ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-gray-100' : 'bg-gradient-to-b from-indigo-900 to-purple-800 text-white'
//         } h-full transition-all duration-500 ease-in-out z-[9999] shadow-2xl ${isOpen ? "w-80" : "w-0"}`}
//         style={{
//           transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
//           opacity: isOpen ? 1 : 0,
//           overflowY: 'auto',
//           overflowX: 'hidden',
//         }}
//       >
//         <div className="flex flex-col h-full pb-32">
//           <div className={`py-4 text-center border-b ${isDark ? 'border-gray-700 bg-black/30' : 'border-white/10 bg-black/20'} backdrop-blur-sm sticky top-0 z-10`}>
//             <h2 className={`font-bold text-2xl ${isDark ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent'}`}>Dashboard</h2>
//           </div>

//           <nav className="mt-6 flex-grow px-6">
//             <div className="space-y-1.5">
//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "placements" ? `${isDark ? 'bg-white/10' : 'bg-white/20'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-300 hover:bg-white/10'}`
//                 }`}
//                 onClick={() => setActiveSection("placements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                 </svg>
//                 <span>Recent Placements</span>
//               </button>

//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "announcements" ? `${isDark ? 'bg-white/10' : 'bg-white/20'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-300 hover:bg-white/10'}`
//                 }`}
//                 onClick={() => setActiveSection("announcements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//                 </svg>
//                 <span>Recent Interviews</span>
//               </button>
//             </div>

//             <hr className={`my-6 ${isDark ? 'border-gray-700' : 'border-white/20'}`} />

//             <div className="mt-4">
//               {activeSection === "placements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <div className="flex items-center justify-between">
//                     <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-white'}`}>Recent Placements</h3>
//                   </div>

//                   <div className="relative">
//                     <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-pink-500 to-red-500 rounded-full"></div>
//                     {placementsData.map((placement, index) => (
//                       <div
//                         key={placement.id}
//                         className={`${isDark ? 'bg-gray-800/40' : 'bg-white/10'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/20'} transition-all cursor-pointer backdrop-blur-sm mb-3 border-l-2 ${
//                           index === 0 ? 'border-red-400 shadow-lg shadow-red-500/20' : 'border-transparent'
//                         }`}
//                         style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//                       >
//                         <div className="flex justify-between">
//                           <h4 className={`font-medium ${isDark ? 'text-gray-100' : 'text-white'}`}>{placement.name}</h4>
//                           <span className={`${index === 0 ? 'bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded' : 'text-emerald-400'} text-sm`}>{placement.date}</span>
//                         </div>
//                         <p className={`${isDark ? 'text-blue-300' : 'text-blue-200'} font-medium`}>{placement.company}</p>
//                         <div className="mt-1">
//                           <span className={`${isDark ? 'text-gray-400' : 'text-gray-300'} text-sm`}>as a {placement.role}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {activeSection === "announcements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-white'}`}>Announcements</h3>

//                   {announcementsData.length === 0 ? (
//                     <p className={`${isDark ? 'text-gray-400' : 'text-gray-300'} italic text-sm`}>
//                       No announcements yet.
//                     </p>
//                   ) : (
//                     announcementsData.map((announcement, index) => (
//                       <div
//                         key={announcement.id}
//                         className={`${isDark ? 'bg-gray-800/40' : 'bg-white/10'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/20'} transition-all cursor-pointer backdrop-blur-sm`}
//                         style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//                       >
//                         <div className="flex justify-between items-start">
//                           <h4 className={`font-medium ${isDark ? 'text-gray-100' : 'text-white'} flex items-center`}>
//                             {announcement.title}
//                             {announcement.important && <span className="ml-2 bg-red-500 h-2 w-2 rounded-full inline-block"></span>}
//                           </h4>
//                           <span className={`${isDark ? 'text-blue-300' : 'text-blue-200'} text-xs`}>{announcement.date}</span>
//                         </div>
//                         <p className={`${isDark ? 'text-gray-400' : 'text-gray-300'} mt-1 text-sm`}>{announcement.description}</p>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               )}
//             </div>
//           </nav>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;





// // components/Sidebar.js
// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useAuth } from "@/utils/AuthContext";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useTheme } from "next-themes";
// import axios from 'axios';

// const Sidebar = ({ isOpen: propIsOpen, toggleSidebar: propToggleSidebar }) => {
//   const { isAuthenticated } = useAuth();
//   const router = useRouter();
//   const { theme } = useTheme();
//   const [internalIsOpen, setInternalIsOpen] = useState(false);
//   const [isFirstLogin, setIsFirstLogin] = useState(false);
//   const [hasCheckedLogin, setHasCheckedLogin] = useState(false);
//   const [activeSection, setActiveSection] = useState("placements");
//   const [mounted, setMounted] = useState(false);
//   const [placementsData, setPlacementsData] = useState([]);
//   const [interviewsData, setInterviewsData] = useState([]);
//   const sidebarRef = useRef(null);
//   const toggleBtnRef = useRef(null);
//   const prevAuthState = useRef(isAuthenticated);

//   const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
//   const toggleSidebar = propToggleSidebar !== undefined ? propToggleSidebar : () => setInternalIsOpen(!internalIsOpen);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (prevAuthState.current === true && isAuthenticated === false) {
//       localStorage.removeItem("hasLoggedIn");
//       setIsFirstLogin(false);
//       setHasCheckedLogin(false);
//     }
//     prevAuthState.current = isAuthenticated;
//   }, [isAuthenticated]);

//   useEffect(() => {
//     if (typeof window !== "undefined" && isAuthenticated && !hasCheckedLogin) {
//       const hasLoggedInBefore = localStorage.getItem("hasLoggedIn");

//       if (!hasLoggedInBefore) {
//         setInternalIsOpen(true);
//         localStorage.setItem("hasLoggedIn", "true");
//         setIsFirstLogin(true);
//       } else {
//         const savedSidebarState = localStorage.getItem("sidebarOpen");
//         setInternalIsOpen(savedSidebarState === "true");
//       }
//       setHasCheckedLogin(true);
//     }
//   }, [isAuthenticated, hasCheckedLogin]);

//   useEffect(() => {
//     if (isAuthenticated && typeof window !== "undefined" && hasCheckedLogin) {
//       localStorage.setItem("sidebarOpen", isOpen.toString());
//     }
//   }, [isOpen, isAuthenticated, hasCheckedLogin]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (!isOpen || !hasCheckedLogin) return;

//       if (
//         sidebarRef.current &&
//         !sidebarRef.current.contains(event.target) &&
//         toggleBtnRef.current &&
//         !toggleBtnRef.current.contains(event.target)
//       ) {
//         toggleSidebar();
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isOpen, hasCheckedLogin, toggleSidebar]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const placementsResponse = await axios.get('http://localhost:8000/api/recent-placements');
//         setPlacementsData(placementsResponse.data);

//         const interviewsResponse = await axios.get('http://localhost:8000/api/recent-interviews');
//         setInterviewsData(interviewsResponse.data);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     if (isAuthenticated) {
//       fetchData();
//     }
//   }, [isAuthenticated]);

//   if (!isAuthenticated) {
//     return null;
//   }

//   const isDark = mounted && (theme === "dark");

//   return (
//     <>
//       <button
//         ref={toggleBtnRef}
//         onClick={toggleSidebar}
//         className={`fixed top-1/2 -translate-y-1/2 z-[9999] ${
//           isDark ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
//         } py-4 px-2 rounded-r-xl shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl focus:outline-none ${!isOpen && 'pulse-animation'} border-r-0 border-2 ${isDark ? 'border-indigo-400' : 'border-purple-300'}`}
//         aria-label="Toggle Sidebar"
//         style={{ left: isOpen ? '280px' : '0' }}
//       >
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className={`transition-transform duration-500 h-8 w-8 ${isOpen ? 'rotate-180' : ''}`}
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//           strokeWidth={2.5}
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
//         </svg>
//       </button>

//       <div
//         ref={sidebarRef}
//         className={`fixed left-0 top-0 ${
//           isDark ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-gray-100' : 'bg-gradient-to-b from-indigo-900 to-purple-800 text-white'
//         } h-full transition-all duration-500 ease-in-out z-[9999] shadow-2xl ${isOpen ? "w-80" : "w-0"}`}
//         style={{
//           transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
//           opacity: isOpen ? 1 : 0,
//           overflowY: 'auto',
//           overflowX: 'hidden',
//         }}
//       >
//         <div className="flex flex-col h-full pb-32">
//           <div className={`py-4 text-center border-b ${isDark ? 'border-gray-700 bg-black/30' : 'border-white/10 bg-black/20'} backdrop-blur-sm sticky top-0 z-10`}>
//             <h2 className={`font-bold text-2xl ${isDark ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent'}`}>Dashboard</h2>
//           </div>

//           <nav className="mt-6 flex-grow px-6">
//             <div className="space-y-1.5">
//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "placements" ? `${isDark ? 'bg-white/10' : 'bg-white/20'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-300 hover:bg-white/10'}`
//                 }`}
//                 onClick={() => setActiveSection("placements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                 </svg>
//                 <span>Recent Placements</span>
//               </button>

//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "announcements" ? `${isDark ? 'bg-white/10' : 'bg-white/20'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-300 hover:bg-white/10'}`
//                 }`}
//                 onClick={() => setActiveSection("announcements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//                 </svg>
//                 <span>Recent Interviews</span>
//               </button>
//             </div>

//             <hr className={`my-6 ${isDark ? 'border-gray-700' : 'border-white/20'}`} />

//             <div className="mt-4">
//               {activeSection === "placements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <div className="flex items-center justify-between">
//                     <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-white'}`}>Recent Placements</h3>
//                   </div>

//                   <div className="relative">
//                     <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-pink-500 to-red-500 rounded-full"></div>
//                     {placementsData.map((placement, index) => (
//                       <div
//                         key={placement.id}
//                         className={`${isDark ? 'bg-gray-800/40' : 'bg-white/10'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/20'} transition-all cursor-pointer backdrop-blur-sm mb-3 border-l-2 ${
//                           index === 0 ? 'border-red-400 shadow-lg shadow-red-500/20' : 'border-transparent'
//                         }`}
//                         style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//                       >
//                         <div className="flex justify-between">
//                           <h4 className={`font-medium ${isDark ? 'text-gray-100' : 'text-white'}`}>{placement.candidate_name}</h4>
//                           <span className={`${index === 0 ? 'bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded' : 'text-emerald-400'} text-sm`}>{new Date(placement.placement_date).toLocaleDateString()}</span>
//                         </div>
//                         <p className={`${isDark ? 'text-blue-300' : 'text-blue-200'} font-medium`}>{placement.company}</p>
//                         <div className="mt-1">
//                           <span className={`${isDark ? 'text-gray-400' : 'text-gray-300'} text-sm`}>as a {placement.position}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {activeSection === "announcements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-white'}`}>Recent Interviews</h3>

//                   {interviewsData.length === 0 ? (
//                     <p className={`${isDark ? 'text-gray-400' : 'text-gray-300'} italic text-sm`}>
//                       No interviews yet.
//                     </p>
//                   ) : (
//                     interviewsData.map((interview, index) => (
//                       <div
//                         key={interview.id}
//                         className={`${isDark ? 'bg-gray-800/40' : 'bg-white/10'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/20'} transition-all cursor-pointer backdrop-blur-sm`}
//                         style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//                       >
//                         <div className="flex justify-between items-start">
//                           <h4 className={`font-medium ${isDark ? 'text-gray-100' : 'text-white'} flex items-center`}>
//                             {interview.candidate_name}
//                           </h4>
//                           <span className={`${isDark ? 'text-blue-300' : 'text-blue-200'} text-xs`}>{new Date(interview.interview_date).toLocaleDateString()}</span>
//                         </div>
//                         <p className={`${isDark ? 'text-gray-400' : 'text-gray-300'} mt-1 text-sm`}>{interview.candidate_role}</p>
//                         <p className={`${isDark ? 'text-gray-400' : 'text-gray-300'} mt-1 text-sm`}>{interview.client_name}</p>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               )}
//             </div>
//           </nav>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;


///// below code is testing purpose ////////////////

// // components/Sidebar.js
// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useAuth } from "@/utils/AuthContext";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useTheme } from "next-themes";
// import axios from 'axios';

// const Sidebar = ({ isOpen: propIsOpen, toggleSidebar: propToggleSidebar }) => {
//   const { isAuthenticated } = useAuth();
//   const router = useRouter();
//   const { theme } = useTheme();
//   const [internalIsOpen, setInternalIsOpen] = useState(false);
//   const [isFirstLogin, setIsFirstLogin] = useState(false);
//   const [hasCheckedLogin, setHasCheckedLogin] = useState(false);
//   const [activeSection, setActiveSection] = useState("placements");
//   const [mounted, setMounted] = useState(false);
//   const [placementsData, setPlacementsData] = useState([]);
//   const [interviewsData, setInterviewsData] = useState([]);
//   const sidebarRef = useRef(null);
//   const toggleBtnRef = useRef(null);
//   const prevAuthState = useRef(isAuthenticated);

//   const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
//   const toggleSidebar = propToggleSidebar !== undefined ? propToggleSidebar : () => setInternalIsOpen(!internalIsOpen);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (prevAuthState.current === true && isAuthenticated === false) {
//       localStorage.removeItem("hasLoggedIn");
//       setIsFirstLogin(false);
//       setHasCheckedLogin(false);
//     }
//     prevAuthState.current = isAuthenticated;
//   }, [isAuthenticated]);

//   useEffect(() => {
//     if (typeof window !== "undefined" && isAuthenticated && !hasCheckedLogin) {
//       const hasLoggedInBefore = localStorage.getItem("hasLoggedIn");

//       if (!hasLoggedInBefore) {
//         setInternalIsOpen(true);
//         localStorage.setItem("hasLoggedIn", "true");
//         setIsFirstLogin(true);
//       } else {
//         const savedSidebarState = localStorage.getItem("sidebarOpen");
//         setInternalIsOpen(savedSidebarState === "true");
//       }
//       setHasCheckedLogin(true);
//     }
//   }, [isAuthenticated, hasCheckedLogin]);

//   useEffect(() => {
//     if (isAuthenticated && typeof window !== "undefined" && hasCheckedLogin) {
//       localStorage.setItem("sidebarOpen", isOpen.toString());
//     }
//   }, [isOpen, isAuthenticated, hasCheckedLogin]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (!isOpen || !hasCheckedLogin) return;

//       if (
//         sidebarRef.current &&
//         !sidebarRef.current.contains(event.target) &&
//         toggleBtnRef.current &&
//         !toggleBtnRef.current.contains(event.target)
//       ) {
//         toggleSidebar();
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isOpen, hasCheckedLogin, toggleSidebar]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const placementsResponse = await axios.get('http://localhost:8000/api/recent-placements');
//         setPlacementsData(placementsResponse.data);

//         const interviewsResponse = await axios.get('http://localhost:8000/api/recent-interviews');
//         setInterviewsData(interviewsResponse.data);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     if (isAuthenticated) {
//       fetchData();
//     }
//   }, [isAuthenticated]);

//   if (!isAuthenticated) {
//     return null;
//   }

//   const isDark = mounted && (theme === "dark");

//   return (
//     <>
//       <button
//         ref={toggleBtnRef}
//         onClick={toggleSidebar}
//         className={`fixed top-1/2 -translate-y-1/2 z-[9999] ${
//           isDark ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
//         } py-4 px-2 rounded-r-xl shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl focus:outline-none ${!isOpen && 'pulse-animation'} border-r-0 border-2 ${
//           isDark ? 'border-indigo-400' : 'border-purple-500'
//         }`}
//         aria-label="Toggle Sidebar"
//         style={{ left: isOpen ? '280px' : '0' }}
//       >
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className={`transition-transform duration-500 h-8 w-8 ${isOpen ? 'rotate-180' : ''}`}
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//           strokeWidth={2.5}
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
//         </svg>
//       </button>

//       <div
//         ref={sidebarRef}
//         className={`fixed left-0 top-0 ${
//           isDark ? 'bg-gradient-to-b from-gray-900 to-indigo-900 text-gray-100' : 'bg-gradient-to-b from-purple-500 to-indigo-600 text-white'
//         } h-full transition-all duration-500 ease-in-out z-[9999] shadow-2xl ${isOpen ? "w-80" : "w-0"}`}
//         style={{
//           transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
//           opacity: isOpen ? 1 : 0,
//           overflowY: 'auto',
//           overflowX: 'hidden',
//         }}
//       >
//         {/* <div className="flex flex-col h-full pb-32">
//           <div className={`py-4 text-center border-b ${isDark ? 'border-gray-700 bg-black/30' : 'border-white/10 bg-black/20'} backdrop-blur-sm sticky top-0 z-10`}>
//             <h2 className={`font-bold text-2xl ${
//               isDark ? 'bg-gradient-to-r from-White-500 to-indigo-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-White-600 to-indigo-600 bg-clip-text text-transparent'
//             }`}>Dashboard</h2>
//           </div> */}

//                 <div className="flex flex-col h-full pb-32">
//           <div className={`py-4 text-center border-b ${isDark ? 'border-gray-700 bg-black/30' : 'border-white/10 bg-black/20'} backdrop-blur-sm sticky top-0 z-10`}>
//             <h2 className={`font-bold text-2xl ${
//               isDark ? 'bg-gradient-to-r from-gray-300 to-indigo-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-white via-purple-300 to-indigo-600 bg-clip-text text-transparent'
//             }`}>Dashboard</h2>
//           </div>

//           <nav className="mt-6 flex-grow px-6">
//             <div className="space-y-1.5">
//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "placements" ? `${isDark ? 'bg-white/10' : 'bg-white/20'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-800 hover:bg-white/10'}`
//                 }`}
//                 onClick={() => setActiveSection("placements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                 </svg>
//                 <span className="font-semibold">Recent Placements</span>
//               </button>

//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "announcements" ? `${isDark ? 'bg-white/10' : 'bg-white/20'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-800 hover:bg-white/10'}`
//                 }`}
//                 onClick={() => setActiveSection("announcements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//                 </svg>
//                 <span className="font-semibold">Recent Interviews</span>
//               </button>
//             </div>

//             <hr className={`my-6 ${isDark ? 'border-gray-700' : 'border-white/20'}`} />

//             <div className="mt-4">
//               {activeSection === "placements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <div className="flex items-center justify-between">
//                     <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Placements</h3>
//                   </div>

//                   <div className="relative">
//                     <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-pink-500 to-white-500 rounded-full"></div>
//                     {placementsData.map((placement, index) => (
//                       <div
//                         key={placement.id}
//                         className={`${isDark ? 'bg-gray-800/40' : 'bg-white/10'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/20'} transition-all cursor-pointer backdrop-blur-sm mb-3 border-l-2 ${
//                           index === 0 ? 'border-wgite-400 shadow-lg shadow-white-500/20' : 'border-transparent'
//                         }`}
//                         style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//                       >
//                         <div className="flex justify-between">
//                           <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{placement.candidate_name}</h4>
//                           <span className={`${index === 0 ? 'bg-white-500/20 text-white-500 px-1.5 py-0.5 rounded' : 'text-white-500'} text-sm font-semibold`}>{new Date(placement.placement_date).toLocaleDateString()}</span>
//                         </div>
//                         <p className={`${isDark ? 'text-navy blue-300' : 'text-blue-600'} font-semibold`}>{placement.company}</p>
//                         <div className="mt-1">
//                           <span className={`${isDark ? 'text-gray-400' : 'text-gray-700'} text-sm font-semibold`}>as a {placement.position}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {activeSection === "announcements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Interviews</h3>

//                   {interviewsData.length === 0 ? (
//                     <p className={`${isDark ? 'text-gray-400' : 'text-gray-700'} italic text-sm font-semibold`}>
//                       No interviews yet.
//                     </p>
//                   ) : (
//                     interviewsData.map((interview, index) => (
//                       <div
//                         key={interview.id}
//                         className={`${isDark ? 'bg-gray-800/40' : 'bg-white/10'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/20'} transition-all cursor-pointer backdrop-blur-sm`}
//                         style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//                       >
//                         <div className="flex justify-between items-start">
//                           <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center`}>
//                             {interview.candidate_name}
//                           </h4>
//                           <span className={`${isDark ? 'text-blue-300' : 'text-blue-600'} text-xs font-semibold`}>{new Date(interview.interview_date).toLocaleDateString()}</span>
//                         </div>
//                         <p className={`${isDark ? 'text-gray-400' : 'text-gray-700'} mt-1 text-sm font-semibold`}>{interview.candidate_role}</p>
//                         <p className={`${isDark ? 'text-gray-400' : 'text-gray-700'} mt-1 text-sm font-semibold`}>{interview.client_name}</p>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               )}
//             </div>
//           </nav>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;



// // components/Sidebar.js
// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useAuth } from "@/utils/AuthContext";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useTheme } from "next-themes";
// import axios from 'axios';

// const Sidebar = ({ isOpen: propIsOpen, toggleSidebar: propToggleSidebar }) => {
//   const { isAuthenticated } = useAuth();
//   const router = useRouter();
//   const { theme } = useTheme();
//   const [internalIsOpen, setInternalIsOpen] = useState(false);
//   const [isFirstLogin, setIsFirstLogin] = useState(false);
//   const [hasCheckedLogin, setHasCheckedLogin] = useState(false);
//   const [activeSection, setActiveSection] = useState("placements");
//   const [mounted, setMounted] = useState(false);
//   const [placementsData, setPlacementsData] = useState([]);
//   const [interviewsData, setInterviewsData] = useState([]);
//   const sidebarRef = useRef(null);
//   const toggleBtnRef = useRef(null);
//   const prevAuthState = useRef(isAuthenticated);

//   const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
//   const toggleSidebar = propToggleSidebar !== undefined ? propToggleSidebar : () => setInternalIsOpen(!internalIsOpen);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (prevAuthState.current === true && isAuthenticated === false) {
//       localStorage.removeItem("hasLoggedIn");
//       setIsFirstLogin(false);
//       setHasCheckedLogin(false);
//     }
//     prevAuthState.current = isAuthenticated;
//   }, [isAuthenticated]);

//   useEffect(() => {
//     if (typeof window !== "undefined" && isAuthenticated && !hasCheckedLogin) {
//       const hasLoggedInBefore = localStorage.getItem("hasLoggedIn");

//       if (!hasLoggedInBefore) {
//         setInternalIsOpen(true);
//         localStorage.setItem("hasLoggedIn", "true");
//         setIsFirstLogin(true);
//       } else {
//         const savedSidebarState = localStorage.getItem("sidebarOpen");
//         setInternalIsOpen(savedSidebarState === "true");
//       }
//       setHasCheckedLogin(true);
//     }
//   }, [isAuthenticated, hasCheckedLogin]);

//   useEffect(() => {
//     if (isAuthenticated && typeof window !== "undefined" && hasCheckedLogin) {
//       localStorage.setItem("sidebarOpen", isOpen.toString());
//     }
//   }, [isOpen, isAuthenticated, hasCheckedLogin]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (!isOpen || !hasCheckedLogin) return;

//       if (
//         sidebarRef.current &&
//         !sidebarRef.current.contains(event.target) &&
//         toggleBtnRef.current &&
//         !toggleBtnRef.current.contains(event.target)
//       ) {
//         toggleSidebar();
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isOpen, hasCheckedLogin, toggleSidebar]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const placementsResponse = await axios.get('http://localhost:8000/api/recent-placements');
//         setPlacementsData(placementsResponse.data);

//         const interviewsResponse = await axios.get('http://localhost:8000/api/recent-interviews');
//         setInterviewsData(interviewsResponse.data);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     if (isAuthenticated) {
//       fetchData();
//     }
//   }, [isAuthenticated]);

//   if (!isAuthenticated) {
//     return null;
//   }

//   const isDark = mounted && (theme === "dark");

//   return (
//     <>
//       <button
//         ref={toggleBtnRef}
//         onClick={toggleSidebar}
//         className={`fixed top-1/2 -translate-y-1/2 z-[9999] ${
//           isDark
//             ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white'
//             : 'bg-gradient-to-r from-purple-300 to-indigo-400 text-white'
//         } py-4 px-2 rounded-r-xl shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl focus:outline-none ${!isOpen && 'pulse-animation'} border-r-0 border-2 ${
//           isDark ? 'border-indigo-400' : 'border-purple-300'
//         }`}
//         aria-label="Toggle Sidebar"
//         style={{ left: isOpen ? '280px' : '0' }}
//       >
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className={`transition-transform duration-500 h-8 w-8 ${isOpen ? 'rotate-180' : ''}`}
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//           strokeWidth={2.5}
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
//         </svg>
//       </button>

//       <div
//         ref={sidebarRef}
//         className={`fixed left-0 top-0 ${
//           isDark
//             ? 'bg-gradient-to-b from-gray-900 to-indigo-800 text-gray-100'
//             : 'bg-gradient-to-b from-purple-200 via-purple-300 to-indigo-300 text-gray-900'
//         } h-full transition-all duration-500 ease-in-out z-[9999] shadow-2xl ${isOpen ? "w-80" : "w-0"}`}
//         style={{
//           transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
//           opacity: isOpen ? 1 : 0,
//           overflowY: 'auto',
//           overflowX: 'hidden',
//         }}
//       >
//         <div className="flex flex-col h-full pb-32">
//           <div className={`py-4 text-center border-b ${isDark ? 'border-gray-700 bg-black/30' : 'border-white/10 bg-black/10'} backdrop-blur-sm sticky top-0 z-10`}>
//             <h2 className={`font-bold text-2xl ${
//               isDark ? 'bg-gradient-to-r from-gray-300 to-indigo-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-indigo-600 bg-clip-text text-transparent'
//             }`}>Dashboard</h2>
//           </div>

//           <nav className="mt-6 flex-grow px-6">
//             <div className="space-y-1.5">
//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "placements" ? `${isDark ? 'bg-white/10' : 'bg-white/30'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-800 hover:bg-white/20'}`
//                 }`}
//                 onClick={() => setActiveSection("placements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                 </svg>
//                 <span className="font-semibold">Recent Placements</span>
//               </button>

//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "announcements" ? `${isDark ? 'bg-white/10' : 'bg-white/30'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-800 hover:bg-white/20'}`
//                 }`}
//                 onClick={() => setActiveSection("announcements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//                 </svg>
//                 <span className="font-semibold">Recent Interviews</span>
//               </button>
//             </div>

//             <hr className={`my-6 ${isDark ? 'border-gray-700' : 'border-white/20'}`} />

//             <div className="mt-4">
//               {activeSection === "placements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <div className="flex items-center justify-between">
//                     <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Placements</h3>
//                   </div>

//                   <div className="relative">
//                     <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-pink-400 to-indigo-300 rounded-full"></div>
//                     {placementsData.map((placement, index) => (
//                       <div
//                         key={placement.id}
//                         className={`${isDark ? 'bg-gray-800/40' : 'bg-white/20'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/30'} transition-all cursor-pointer backdrop-blur-sm mb-3`}
//                         style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//                       >
//                         <div className="flex justify-between">
//                           <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{placement.candidate_name}</h4>
//                           <span className="text-sm font-semibold">{new Date(placement.placement_date).toLocaleDateString()}</span>
//                         </div>
//                         <p className="text-blue-500 font-semibold">{placement.company}</p>
//                         <div className="mt-1">
//                           <span className="text-sm font-semibold">{placement.position}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {activeSection === "announcements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Interviews</h3>

//                   {interviewsData.length === 0 ? (
//                     <p className="italic text-sm font-semibold">No interviews yet.</p>
//                   ) : (
//                     interviewsData.map((interview, index) => (
//                       <div
//                         key={interview.id}
//                         className={`${isDark ? 'bg-gray-800/40' : 'bg-white/20'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/30'} transition-all cursor-pointer backdrop-blur-sm`}
//                         style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//                       >
//                         <div className="flex justify-between items-start">
//                           <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center`}>
//                             {interview.candidate_name}
//                           </h4>
//                           <span className="text-xs font-semibold text-blue-500">{new Date(interview.interview_date).toLocaleDateString()}</span>
//                         </div>
//                         <p className="mt-1 text-sm font-semibold">{interview.candidate_role}</p>
//                         <p className="mt-1 text-sm font-semibold">{interview.client_name}</p>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               )}
//             </div>
//           </nav>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;


///////////// above is working below is testing 17-6-2025 ///////////////



// // components/Sidebar.js
// "use client";

// import { useState, useEffect, useRef } from "react";
// import { useAuth } from "@/utils/AuthContext";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useTheme } from "next-themes";
// import axios from 'axios';

// const Sidebar = ({ isOpen: propIsOpen, toggleSidebar: propToggleSidebar }) => {
//   const { isAuthenticated } = useAuth();
//   const router = useRouter();
//   const { theme } = useTheme();
//   const [internalIsOpen, setInternalIsOpen] = useState(false);
//   const [isFirstLogin, setIsFirstLogin] = useState(false);
//   const [hasCheckedLogin, setHasCheckedLogin] = useState(false);
//   const [activeSection, setActiveSection] = useState("placements");
//   const [mounted, setMounted] = useState(false);
//   const [placementsData, setPlacementsData] = useState([]);
//   const [interviewsData, setInterviewsData] = useState([]);
//   const sidebarRef = useRef(null);
//   const toggleBtnRef = useRef(null);
//   const prevAuthState = useRef(isAuthenticated);

//   const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
//   const toggleSidebar = propToggleSidebar !== undefined ? propToggleSidebar : () => setInternalIsOpen(!internalIsOpen);

//   useEffect(() => setMounted(true), []);

//   useEffect(() => {
//     if (prevAuthState.current === true && isAuthenticated === false) {
//       localStorage.removeItem("hasLoggedIn");
//       setIsFirstLogin(false);
//       setHasCheckedLogin(false);
//     }
//     prevAuthState.current = isAuthenticated;
//   }, [isAuthenticated]);

//   useEffect(() => {
//     if (typeof window !== "undefined" && isAuthenticated && !hasCheckedLogin) {
//       const hasLoggedInBefore = localStorage.getItem("hasLoggedIn");

//       if (!hasLoggedInBefore) {
//         setInternalIsOpen(true);
//         localStorage.setItem("hasLoggedIn", "true");
//         setIsFirstLogin(true);
//       } else {
//         const savedSidebarState = localStorage.getItem("sidebarOpen");
//         setInternalIsOpen(savedSidebarState === "true");
//       }
//       setHasCheckedLogin(true);
//     }
//   }, [isAuthenticated, hasCheckedLogin]);

//   useEffect(() => {
//     if (isAuthenticated && typeof window !== "undefined" && hasCheckedLogin) {
//       localStorage.setItem("sidebarOpen", isOpen.toString());
//     }
//   }, [isOpen, isAuthenticated, hasCheckedLogin]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (!isOpen || !hasCheckedLogin) return;

//       if (
//         sidebarRef.current &&
//         !sidebarRef.current.contains(event.target) &&
//         toggleBtnRef.current &&
//         !toggleBtnRef.current.contains(event.target)
//       ) {
//         toggleSidebar();
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isOpen, hasCheckedLogin, toggleSidebar]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const placementsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/placements`);
//         setPlacementsData(placementsResponse.data);
//         console.log(placementsResponse.data);

//         const interviewsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/interviews`);
//         setInterviewsData(interviewsResponse.data);
//         console.log(interviewsResponse.data);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     if (isAuthenticated) {
//       fetchData();
//     }
//   }, [isAuthenticated]);

//   if (!isAuthenticated) return null;

//   const isDark = mounted && (theme === "dark");

//   return (
//     <>
//       <button
//         ref={toggleBtnRef}
//         onClick={toggleSidebar}
//         className={`fixed top-1/2 -translate-y-1/2 z-[9999] ${
//           isDark
//             ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white'
//             : 'bg-gradient-to-r from-purple-300 to-indigo-400 text-white'
//         } py-4 px-2 rounded-r-xl shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl focus:outline-none ${!isOpen && 'pulse-animation'} border-r-0 border-2 ${
//           isDark ? 'border-indigo-400' : 'border-purple-300'
//         }`}
//         aria-label="Toggle Sidebar"
//         style={{ left: isOpen ? '280px' : '0' }}
//       >
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className={`transition-transform duration-500 h-8 w-8 ${isOpen ? 'rotate-180' : ''}`}
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//           strokeWidth={2.5}
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
//         </svg>
//       </button>

//       <div
//         ref={sidebarRef}
//         className={`fixed left-0 top-0 ${
//           isDark
//             ? 'bg-gradient-to-b from-gray-900 to-indigo-800 text-gray-100'
//             : 'bg-gradient-to-b from-purple-200 via-purple-300 to-indigo-300 text-gray-900'
//         } h-full transition-all duration-500 ease-in-out z-[9999] shadow-2xl ${isOpen ? "w-80" : "w-0"}`}
//         style={{
//           transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
//           opacity: isOpen ? 1 : 0,
//           overflowY: 'auto',
//           overflowX: 'hidden',
//         }}
//       >
//         <div className="flex flex-col h-full pb-32">
//           <div className={`py-4 text-center border-b ${isDark ? 'border-gray-700 bg-black/30' : 'border-white/10 bg-black/10'} backdrop-blur-sm sticky top-0 z-10`}>
//             <h2 className={`font-bold text-2xl ${
//               isDark ? 'bg-gradient-to-r from-gray-300 to-indigo-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-indigo-600 bg-clip-text text-transparent'
//             }`}>Dashboard</h2>
//           </div>

//           <nav className="mt-6 flex-grow px-6">
//             <div className="space-y-1.5">
//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "placements" ? `${isDark ? 'bg-white/10' : 'bg-white/30'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-800 hover:bg-white/20'}`
//                 }`}
//                 onClick={() => setActiveSection("placements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                 </svg>
//                 <span className="font-semibold">Recent Placements</span>
//               </button>

//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "announcements" ? `${isDark ? 'bg-white/10' : 'bg-white/30'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-800 hover:bg-white/20'}`
//                 }`}
//                 onClick={() => setActiveSection("announcements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//                 </svg>
//                 <span className="font-semibold">Recent Interviews</span>
//               </button>
//             </div>

//             <hr className={`my-6 ${isDark ? 'border-gray-700' : 'border-white/20'}`} />

//             <div className="mt-4">
//               {activeSection === "placements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <div className="flex items-center justify-between">
//                     <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Placements</h3>
//                   </div>

//                   <div className="relative">
//                     <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-pink-400 to-indigo-300 rounded-full"></div>
//                     {placementsData.map((placement, index) => (
//                       <div
//                         key={placement.id}
//                         className={`${isDark ? 'bg-gray-800/40' : 'bg-white/20'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/30'} transition-all cursor-pointer backdrop-blur-sm mb-3`}
//                         style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//                       >
//                         <div className="flex justify-between">
//                           <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{placement.candidate_name}</h4>
//                           <span className="text-sm font-semibold">{new Date(placement.placement_date).toLocaleDateString()}</span>
//                         </div>
//                         <p className="text-blue-500 font-semibold">{placement.company}</p>
//                         <div className="mt-1">
//                           <span className="text-sm font-semibold">{placement.position}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* {activeSection === "announcements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Interviews</h3>

//                   {interviewsData.length === 0 ? (
//                     <p className="italic text-sm font-semibold">No interviews yet.</p>
//                   ) : (
//                     <div className="relative">
//                       <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-green-400 to-indigo-300 rounded-full"></div>
//                       {interviewsData.map((interview, index) => (
//                         <div
//                           key={interview.id}
//                           className={`${isDark ? 'bg-gray-800/40' : 'bg-white/20'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/30'} transition-all cursor-pointer backdrop-blur-sm mb-3`}
//                           style={{ animationDelay: `${0.1 + index * 0.1}s` }}
//                         >
//                           <div className="flex justify-between">
//                             <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{interview.candidate_name}</h4>
//                             <span className="text-sm font-semibold">{new Date(interview.interview_date).toLocaleDateString()}</span>
//                           </div>
//                           <p className="text-blue-500 font-semibold">{interview.client_name}</p>
//                           <div className="mt-1">
//                             <span className="text-sm font-semibold">{interview.candidate_role}</span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )} */}

//                  {activeSection === "announcements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Interviews</h3>
//                   <p className="italic text-sm font-semibold">Coming Soon...</p>
//                 </div>
//               )}

//             </div>
//           </nav>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;


// ---------------------------------------------------------------------------------------------

// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useAuth } from "@/utils/AuthContext";
// import { useTheme } from "next-themes";
// import axios from "axios";

// const Sidebar = () => {
//   const { isAuthenticated, sidebarOpen, setSidebarOpen } = useAuth();
//   const { theme } = useTheme();

//   const [hasCheckedLogin, setHasCheckedLogin] = useState(false);
//   const [activeSection, setActiveSection] = useState("placements");
//   const [placementsData, setPlacementsData] = useState([]);
//   const [interviewsData, setInterviewsData] = useState([]);
//   const [mounted, setMounted] = useState(false);
//   const sidebarRef = useRef(null);
//   const toggleBtnRef = useRef(null);

//   const isDark = mounted && theme === "dark";

//   useEffect(() => setMounted(true), []);

//   // Auto-open on first login
//   useEffect(() => {
//     if (typeof window !== "undefined" && isAuthenticated && !hasCheckedLogin) {
//       const hasLoggedInBefore = localStorage.getItem("hasLoggedIn");

//       if (!hasLoggedInBefore) {
//         localStorage.setItem("hasLoggedIn", "true");
//         setSidebarOpen(true);
//       } else {
//         const saved = localStorage.getItem("sidebarOpen");
//         setSidebarOpen(saved === "true");
//       }

//       setHasCheckedLogin(true);
//     }
//   }, [isAuthenticated, hasCheckedLogin, setSidebarOpen]);

//   // Persist sidebar state
//   useEffect(() => {
//     if (typeof window !== "undefined" && isAuthenticated) {
//       localStorage.setItem("sidebarOpen", sidebarOpen.toString());
//     }
//   }, [sidebarOpen, isAuthenticated]);

//   // Close sidebar on outside click
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         sidebarRef.current &&
//         !sidebarRef.current.contains(event.target) &&
//         toggleBtnRef.current &&
//         !toggleBtnRef.current.contains(event.target)
//       ) {
//         setSidebarOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [setSidebarOpen]);

//   // Fetch placements and interviews
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const placementsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/placements`);
//         const interviewsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/interviews`);
//         setPlacementsData(placementsRes.data);
//         setInterviewsData(interviewsRes.data);
//       } catch (err) {
//         console.error("Error fetching data:", err);
//       }
//     };

//     if (isAuthenticated) {
//       fetchData();
//     }
//   }, [isAuthenticated]);

//   if (!isAuthenticated) return null;

//   return (
//     <>
//       <button
//         ref={toggleBtnRef}
//         onClick={() => setSidebarOpen(!sidebarOpen)}
//         className={`fixed top-1/2 -translate-y-1/2 z-[9999] ${
//           isDark
//             ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white'
//             : 'bg-gradient-to-r from-purple-300 to-indigo-400 text-white'
//         } py-4 px-2 rounded-r-xl shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl focus:outline-none ${
//           !sidebarOpen && 'pulse-animation'
//         } border-r-0 border-2 ${
//           isDark ? 'border-indigo-400' : 'border-purple-300'
//         }`}
//         aria-label="Toggle Sidebar"
//         style={{ left: sidebarOpen ? '280px' : '0' }}
//       >
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className={`transition-transform duration-500 h-8 w-8 ${sidebarOpen ? 'rotate-180' : ''}`}
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//           strokeWidth={2.5}
//         >
//           <path strokeLinecap="round" strokeLinejoin="round" d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
//         </svg>
//       </button>

//       <div
//         ref={sidebarRef}
//         className={`fixed left-0 top-0 ${
//           isDark
//             ? 'bg-gradient-to-b from-gray-900 to-indigo-800 text-gray-100'
//             : 'bg-gradient-to-b from-purple-200 via-purple-300 to-indigo-300 text-gray-900'
//         } h-full transition-all duration-500 ease-in-out z-[9999] shadow-2xl ${sidebarOpen ? "w-80" : "w-0"}`}
//         style={{
//           transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
//           opacity: sidebarOpen ? 1 : 0,
//           overflowY: 'auto',
//           overflowX: 'hidden',
//         }}
//       >
//         <div className="flex flex-col h-full pb-32">
//           <div className={`py-4 text-center border-b ${isDark ? 'border-gray-700 bg-black/30' : 'border-white/10 bg-black/10'} backdrop-blur-sm sticky top-0 z-10`}>
//             <h2 className={`font-bold text-2xl ${
//               isDark ? 'bg-gradient-to-r from-gray-300 to-indigo-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-indigo-600 bg-clip-text text-transparent'
//             }`}>Dashboard</h2>
//           </div>

//           <nav className="mt-6 flex-grow px-6">
//             <div className="space-y-1.5">
//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "placements" ? `${isDark ? 'bg-white/10' : 'bg-white/30'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-800 hover:bg-white/20'}`
//                 }`}
//                 onClick={() => setActiveSection("placements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                 </svg>
//                 <span className="font-semibold">Recent Placements</span>
//               </button>

//               <button
//                 className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
//                   activeSection === "announcements" ? `${isDark ? 'bg-white/10' : 'bg-white/30'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-800 hover:bg-white/20'}`
//                 }`}
//                 onClick={() => setActiveSection("announcements")}
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//                 </svg>
//                 <span className="font-semibold">Recent Interviews</span>
//               </button>
//             </div>

//             <hr className={`my-6 ${isDark ? 'border-gray-700' : 'border-white/20'}`} />

//             <div className="mt-4">
//               {activeSection === "placements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Placements</h3>
//                   <div className="relative">
//                     <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-pink-400 to-indigo-300 rounded-full"></div>
//                     {placementsData.map((placement, index) => (
//                       <div
//                         key={placement.id}
//                         className={`${isDark ? 'bg-gray-800/40' : 'bg-white/20'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/30'} transition-all cursor-pointer backdrop-blur-sm mb-3`}
//                       >
//                         <div className="flex justify-between">
//                           <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{placement.candidate_name}</h4>
//                           <span className="text-sm font-semibold">{new Date(placement.placement_date).toLocaleDateString()}</span>
//                         </div>
//                         <p className="text-blue-500 font-semibold">{placement.company}</p>
//                         <div className="mt-1">
//                           <span className="text-sm font-semibold">{placement.position}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {activeSection === "announcements" && (
//                 <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
//                   <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Interviews</h3>
//                   <p className="italic text-sm font-semibold">Coming Soon...</p>
//                 </div>
//               )}
//             </div>
//           </nav>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;





"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import { useTheme } from "next-themes";
import axios from "axios";
import { motion } from "framer-motion";

const Sidebar = () => {
  const { isAuthenticated, sidebarOpen, setSidebarOpen } = useAuth();
  const { theme } = useTheme();

  const [hasCheckedLogin, setHasCheckedLogin] = useState(false);
  const [activeSection, setActiveSection] = useState("placements");
  const [placementsData, setPlacementsData] = useState([]);
  const [interviewsData, setInterviewsData] = useState([]);
  const [mounted, setMounted] = useState(false);
  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);

  const isDark = mounted && theme === "dark";

  useEffect(() => setMounted(true), []);

  // Auto-open on first login with animation
  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated && !hasCheckedLogin) {
      const hasLoggedInBefore = localStorage.getItem("hasLoggedIn");

      if (!hasLoggedInBefore) {
        localStorage.setItem("hasLoggedIn", "true");
        // Delay to trigger animation
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

  // Fetch placements and interviews
  useEffect(() => {
    const fetchData = async () => {
      try {
        const placementsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/placements`);
        const interviewsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/interviews`);
        setPlacementsData(placementsRes.data);
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
      <button
        ref={toggleBtnRef}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-[9999] ${
          isDark
            ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white'
            : 'bg-gradient-to-r from-purple-300 to-indigo-400 text-white'
        } py-4 px-2 rounded-r-xl shadow-lg transform transition-all duration-500 hover:scale-110 hover:shadow-xl focus:outline-none ${
          !sidebarOpen && 'pulse-animation'
        } border-r-0 border-2 ${
          isDark ? 'border-indigo-400' : 'border-purple-300'
        }`}
        aria-label="Toggle Sidebar"
        style={{ left: sidebarOpen ? '280px' : '0' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 h-8 w-8 ${sidebarOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
        </svg>
      </button>

      <motion.div
        ref={sidebarRef}
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: sidebarOpen ? 0 : "-100%", opacity: sidebarOpen ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 70, damping: 15 }}
        className={`fixed left-0 top-0 ${
          isDark
            ? 'bg-gradient-to-b from-gray-900 to-indigo-800 text-gray-100'
            : 'bg-gradient-to-b from-purple-200 via-purple-300 to-indigo-300 text-gray-900'
        } h-full z-[9999] shadow-2xl ${sidebarOpen ? "w-80" : "w-0"}`}
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div className="flex flex-col h-full pb-32">
          <div className={`py-4 text-center border-b ${isDark ? 'border-gray-700 bg-black/30' : 'border-white/10 bg-black/10'} backdrop-blur-sm sticky top-0 z-10`}>
            <h2 className={`font-bold text-2xl ${
              isDark ? 'bg-gradient-to-r from-gray-300 to-indigo-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-indigo-600 bg-clip-text text-transparent'
            }`}>Dashboard</h2>
          </div>

          <nav className="mt-6 flex-grow px-6">
            <div className="space-y-1.5">
              <button
                className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
                  activeSection === "placements" ? `${isDark ? 'bg-white/10' : 'bg-white/30'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-800 hover:bg-white/20'}`
                }`}
                onClick={() => setActiveSection("placements")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold">Recent Placements</span>
              </button>

              <button
                className={`sidebar-item w-full flex items-center p-2.5 rounded-lg transition-all duration-300 ${
                  activeSection === "announcements" ? `${isDark ? 'bg-white/10' : 'bg-white/30'} font-medium` : `${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-800 hover:bg-white/20'}`
                }`}
                onClick={() => setActiveSection("announcements")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="font-semibold">Recent Interviews</span>
              </button>
            </div>

            <hr className={`my-6 ${isDark ? 'border-gray-700' : 'border-white/20'}`} />

            <div className="mt-4">
              {activeSection === "placements" && (
                <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                  <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Placements</h3>
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-pink-400 to-indigo-300 rounded-full"></div>
                    {placementsData.map((placement, index) => (
                      <div
                        key={placement.id}
                        className={`${isDark ? 'bg-gray-800/40' : 'bg-white/20'} p-3 rounded-lg ${isDark ? 'hover:bg-gray-700/40' : 'hover:bg-white/30'} transition-all cursor-pointer backdrop-blur-sm mb-3`}
                      >
                        <div className="flex justify-between">
                          <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{placement.candidate_name}</h4>
                          <span className="text-sm font-semibold">{new Date(placement.placement_date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-blue-500 font-semibold">{placement.company}</p>
                        <div className="mt-1">
                          <span className="text-sm font-semibold">{placement.position}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "announcements" && (
                <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                  <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Interviews</h3>
                  <p className="italic text-sm font-semibold">Coming Soon...</p>
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
