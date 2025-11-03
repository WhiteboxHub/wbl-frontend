
// // "use client";
// // import React, { useState, useEffect } from "react";
// // import { User, Phone, Mail, Activity, Clock } from "lucide-react";


// // interface UserProfile {
// //   uname: string;        // email
// //   full_name: string;
// //   phone: string;
// //   login_count: number;
// // }

// // export default function UserDashboard() {
// //   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
// //   const [loading, setLoading] = useState(false);

// //   useEffect(() => {
// //     loadUserProfile();
// //   }, []);

// //   const loadUserProfile = async () => {
// //     try {
// //       setLoading(true);

// //       const token = localStorage.getItem("access_token");
// //       if (!token) {
// //         throw new Error("No token found. Please log in.");
// //       }

// //       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user_dashboard`, {
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //         },
// //       });

// //       if (!res.ok) {
// //         throw new Error("Failed to fetch user dashboard");
// //       }

// //       const data = await res.json();
// //       setUserProfile(data);
// //     } catch (error) {
// //       console.error(error);
// //       setUserProfile(null);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
// //         <div className="text-center">
// //           <div className="relative mb-6">
// //           </div>
// //           <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Loading Profile</h2>
// //           <div className="flex items-center justify-center space-x-1">
// //             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
// //             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
// //             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (!userProfile) {
// //     return (
// //       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
// //         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 text-center max-w-md">
// //           <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
// //             <User className="h-8 w-8 text-red-500 dark:text-red-400" />
// //           </div>
// //           <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Connection Failed</h3>
// //           <p className="text-gray-600 dark:text-gray-400 mb-6">Unable to retrieve your profile data. Please check your connection and try again.</p>
// //           <button
// //             onClick={loadUserProfile}
// //             className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 font-semibold"
// //           >
// //             Retry Connection
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   };

// //   const getFirstName = (fullName: string) => {
// //     return fullName.split(' ')[0];
// //   };

// //   return (
// //     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
      
// //       <div className="max-w-4xl mx-auto px-6 py-8">
        
// //         <div className="mb-8">
// //           <div className="flex items-center space-x-4 mb-6">
// //             <div className="relative">
// //               <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
// //                 {getFirstName(userProfile.full_name).charAt(0)}
// //               </div>
// //               <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
// //                 <div className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"></div>
// //               </div>
// //             </div>
// //             <div>
// //               <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hello, {getFirstName(userProfile.full_name)}!</h2>
// //               <p className="text-gray-600 dark:text-gray-400">Here's your account overview</p>
// //               <div className="flex items-center space-x-2 mt-1">
// //                 <Clock className="h-3 w-3 text-blue-500" />
// //                 <span className="text-xs text-blue-500">Last updated: Just now</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

        
// //         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-8">
// //           <div className="mb-8">
// //             <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile Details</h2>
// //             <p className="text-gray-600 dark:text-gray-400">Complete information overview</p>
// //           </div>

// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           
// //             <div className="space-y-6">
// //               <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
// //                 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
// //                   <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
// //                 </div>
// //                 <div className="flex-1">
// //                   <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
// //                   <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{userProfile.full_name}</p>
// //                 </div>
// //               </div>

// //               <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
// //                 <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
// //                   <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
// //                 </div>
// //                 <div className="flex-1">
// //                   <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
// //                   <p className="text-lg font-bold text-green-600 dark:text-green-400 break-all">{userProfile.uname}</p>
// //                 </div>
// //               </div>
// //             </div>

            
// //             <div className="space-y-6">
// //               <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
// //                 <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
// //                   <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
// //                 </div>
// //                 <div className="flex-1">
// //                   <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
// //                   <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{userProfile.phone}</p>
// //                 </div>
// //               </div>

// //               <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
// //                 <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
// //                   <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
// //                 </div>
// //                 <div className="flex-1">
// //                   <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Total Login Count</p>
// //                   <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{userProfile.login_count}</p>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
  
// // }



// // app/candidate/dashboard/page.tsx
// "use client";
// import React, { useState, useEffect } from "react";
// import { 
//   User, 
//   Phone, 
//   Mail, 
//   Activity, 
//   Clock, 
//   BookOpen, 
//   Target, 
//   Briefcase,
//   TrendingUp,
//   Calendar,
//   FileText,
//   Users,
//   Award,
//   BarChart3
// } from "lucide-react";

// interface CandidateProfile {
//   id: number;
//   full_name: string;
//   email: string;
//   phone: string;
//   status: string;
//   enrolled_date: string;
//   batch_name: string;
// }

// interface DashboardData {
//   candidate: CandidateProfile;
//   phase_summary: {
//     enrolled: {
//       days_enrolled: number;
//       batch: string;
//       fee_status: string;
//     };
//     preparation: {
//       status: string;
//       duration_days: number;
//       rating: string;
//       communication_rating: string;
//     };
//     marketing: {
//       status: string;
//       days_in_marketing: number;
//       total_interviews: number;
//       positive_feedback: number;
//       priority: number;
//     };
//     placement: {
//       status: string;
//       company: string;
//       salary: number;
//       placement_date: string;
//     };
//   };
//   recent_interviews: Array<{
//     id: number;
//     company: string;
//     interview_date: string;
//     type: string;
//     feedback: string;
//     mode: string;
//   }>;
//   statistics: {
//     days_in_system: number;
//     days_in_preparation: number;
//     days_in_marketing: number;
//     interview_conversion_rate: number;
//     average_response_time: number;
//   };
//   alerts: Array<{
//     type: string;
//     message: string;
//   }>;
// }

// interface TabConfig {
//   id: string;
//   label: string;
//   icon: React.ReactNode;
// }

// export default function CandidateDashboard() {
//   const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("overview");

//   const tabs: TabConfig[] = [
//     { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
//     { id: "preparation", label: "Preparation", icon: <BookOpen className="w-4 h-4" /> },
//     { id: "marketing", label: "Marketing", icon: <Target className="w-4 h-4" /> },
//     { id: "placement", label: "Placement", icon: <Briefcase className="w-4 h-4" /> },
//     { id: "interviews", label: "Interviews", icon: <Calendar className="w-4 h-4" /> },
//     { id: "documents", label: "Documents", icon: <FileText className="w-4 h-4" /> },
//   ];

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("access_token");
//       if (!token) {
//         throw new Error("No token found. Please log in.");
//       }

//       // Get candidate ID from user context or API
//       const candidateId = await getCandidateId(token);
      
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/api/candidates/${candidateId}/dashboard/overview`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!res.ok) {
//         throw new Error("Failed to fetch dashboard data");
//       }

//       const data = await res.json();
//       setDashboardData(data);
//     } catch (error) {
//       console.error(error);
//       setDashboardData(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getCandidateId = async (token: string): Promise<number> => {
//     // This should be implemented based on your auth system
//     // For now, return a default or get from user profile
//     return 1; // Replace with actual candidate ID logic
//   };

//   if (loading) {
//     return <LoadingSpinner />;
//   }

//   if (!dashboardData) {
//     return <ErrorState onRetry={loadDashboardData} />;
//   }

//   const getFirstName = (fullName: string) => {
//     return fullName.split(' ')[0];
//   };

//   const getStatusColor = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case 'active': return 'bg-green-500';
//       case 'completed': return 'bg-blue-500';
//       case 'pending': return 'bg-yellow-500';
//       default: return 'bg-gray-500';
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         {/* Header Section */}
//         <DashboardHeader 
//           candidate={dashboardData.candidate}
//           getFirstName={getFirstName}
//         />
        
//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <SummaryCard
//             title="Days Enrolled"
//             value={dashboardData.phase_summary.enrolled.days_enrolled.toString()}
//             subtitle="In System"
//             icon={<Clock className="w-6 h-6" />}
//             color="blue"
//           />
//           <SummaryCard
//             title="Interviews"
//             value={dashboardData.phase_summary.marketing.total_interviews.toString()}
//             subtitle="Total Conducted"
//             icon={<Calendar className="w-6 h-6" />}
//             color="green"
//           />
//           <SummaryCard
//             title="Success Rate"
//             value={`${dashboardData.statistics.interview_conversion_rate}%`}
//             subtitle="Positive Feedback"
//             icon={<TrendingUp className="w-6 h-6" />}
//             color="purple"
//           />
//           <SummaryCard
//             title="Current Phase"
//             value={getCurrentPhase(dashboardData.phase_summary)}
//             subtitle="Status"
//             icon={<Activity className="w-6 h-6" />}
//             color="orange"
//           />
//         </div>

//         {/* Progress Tracker */}
//         <ProgressTracker phaseSummary={dashboardData.phase_summary} />

//         {/* Main Content with Tabs */}
//         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg overflow-hidden">
//           {/* Tab Navigation */}
//           <div className="border-b border-gray-200 dark:border-gray-700">
//             <div className="flex overflow-x-auto">
//               {tabs.map((tab) => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-all duration-200 ${
//                     activeTab === tab.id
//                       ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
//                       : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
//                   }`}
//                 >
//                   {tab.icon}
//                   <span>{tab.label}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Tab Content */}
//           <div className="p-6">
//             {activeTab === "overview" && (
//               <OverviewTab 
//                 data={dashboardData}
//                 getStatusColor={getStatusColor}
//               />
//             )}
//             {activeTab === "preparation" && (
//               <PreparationTab candidateId={dashboardData.candidate.id} />
//             )}
//             {activeTab === "marketing" && (
//               <MarketingTab candidateId={dashboardData.candidate.id} />
//             )}
//             {activeTab === "placement" && (
//               <PlacementTab candidateId={dashboardData.candidate.id} />
//             )}
//             {activeTab === "interviews" && (
//               <InterviewsTab candidateId={dashboardData.candidate.id} />
//             )}
//             {activeTab === "documents" && (
//               <DocumentsTab candidateId={dashboardData.candidate.id} />
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Header Component
// const DashboardHeader = ({ candidate, getFirstName }: { candidate: CandidateProfile; getFirstName: (name: string) => string }) => (
//   <div className="mb-8">
//     <div className="flex items-center space-x-4 mb-6">
//       <div className="relative">
//         <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
//           {getFirstName(candidate.full_name).charAt(0)}
//         </div>
//         <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
//           <div className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"></div>
//         </div>
//       </div>
//       <div>
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//           Welcome back, {getFirstName(candidate.full_name)}!
//         </h2>
//         <p className="text-gray-600 dark:text-gray-400">
//           {candidate.batch_name} • Enrolled {candidate.enrolled_date}
//         </p>
//         <div className="flex items-center space-x-2 mt-1">
//           <Clock className="h-3 w-3 text-blue-500" />
//           <span className="text-xs text-blue-500">Last updated: Just now</span>
//         </div>
//       </div>
//     </div>
//   </div>
// );

// // Summary Card Component
// const SummaryCard = ({ 
//   title, 
//   value, 
//   subtitle, 
//   icon, 
//   color 
// }: { 
//   title: string;
//   value: string;
//   subtitle: string;
//   icon: React.ReactNode;
//   color: string;
// }) => {
//   const colorClasses = {
//     blue: "bg-blue-500",
//     green: "bg-green-500",
//     purple: "bg-purple-500",
//     orange: "bg-orange-500",
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
//             {title}
//           </p>
//           <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
//             {value}
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//             {subtitle}
//           </p>
//         </div>
//         <div className={`p-3 rounded-xl ${colorClasses[color]} bg-opacity-10`}>
//           <div className={`text-${color}-600 dark:text-${color}-400`}>
//             {icon}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Progress Tracker Component
// const ProgressTracker = ({ phaseSummary }: { phaseSummary: DashboardData['phase_summary'] }) => {
//   const phases = [
//     { name: "Enrolled", status: "completed", data: phaseSummary.enrolled },
//     { name: "Preparation", status: phaseSummary.preparation.status, data: phaseSummary.preparation },
//     { name: "Marketing", status: phaseSummary.marketing.status, data: phaseSummary.marketing },
//     { name: "Placement", status: phaseSummary.placement.status, data: phaseSummary.placement },
//   ];

//   return (
//     <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-8">
//       <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
//         Candidate Journey
//       </h3>
//       <div className="flex items-center justify-between">
//         {phases.map((phase, index) => (
//           <React.Fragment key={phase.name}>
//             <div className="flex flex-col items-center">
//               <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
//                 phase.status === 'completed' ? 'bg-green-500 text-white' :
//                 phase.status === 'active' ? 'bg-blue-500 text-white' :
//                 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
//               }`}>
//                 {index + 1}
//               </div>
//               <span className="text-sm font-medium mt-2 text-gray-900 dark:text-gray-100">
//                 {phase.name}
//               </span>
//               <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                 {phase.data.days_in_marketing || phase.data.days_enrolled || 0} days
//               </span>
//             </div>
//             {index < phases.length - 1 && (
//               <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2">
//                 <div className={`h-full ${
//                   phases[index + 1].status !== 'upcoming' ? 'bg-green-500' : 'bg-gray-300'
//                 }`}></div>
//               </div>
//             )}
//           </React.Fragment>
//         ))}
//       </div>
//     </div>
//   );
// };

// // Overview Tab Component
// const OverviewTab = ({ data, getStatusColor }: { data: DashboardData; getStatusColor: (status: string) => string }) => (
//   <div className="space-y-6">
//     {/* Alerts Section */}
//     {data.alerts.length > 0 && (
//       <div className="space-y-3">
//         {data.alerts.map((alert, index) => (
//           <div
//             key={index}
//             className={`p-4 rounded-xl border ${
//               alert.type === 'error' 
//                 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
//                 : alert.type === 'warning'
//                 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
//                 : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
//             }`}
//           >
//             <div className="flex items-center space-x-3">
//               <div className={`w-3 h-3 rounded-full ${
//                 alert.type === 'error' ? 'bg-red-500' :
//                 alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
//               }`}></div>
//               <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                 {alert.message}
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>
//     )}

//     {/* Recent Interviews */}
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//       <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
//         <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
//           Recent Interviews
//         </h4>
//         <div className="space-y-3">
//           {data.recent_interviews.map((interview) => (
//             <div
//               key={interview.id}
//               className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-500"
//             >
//               <div>
//                 <p className="font-medium text-gray-900 dark:text-gray-100">
//                   {interview.company}
//                 </p>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   {new Date(interview.interview_date).toLocaleDateString()} • {interview.type}
//                 </p>
//               </div>
//               <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                 interview.feedback === 'Positive' 
//                   ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
//                   : interview.feedback === 'Negative'
//                   ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
//                   : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
//               }`}>
//                 {interview.feedback || 'Pending'}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Statistics */}
//       <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
//         <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
//           Performance Metrics
//         </h4>
//         <div className="space-y-4">
//           <MetricItem
//             label="Days in System"
//             value={data.statistics.days_in_system.toString()}
//           />
//           <MetricItem
//             label="Interview Conversion Rate"
//             value={`${data.statistics.interview_conversion_rate}%`}
//           />
//           <MetricItem
//             label="Average Response Time"
//             value={data.statistics.average_response_time ? `${data.statistics.average_response_time} days` : 'N/A'}
//           />
//           <MetricItem
//             label="Positive Feedback"
//             value={data.phase_summary.marketing.positive_feedback.toString()}
//           />
//         </div>
//       </div>
//     </div>
//   </div>
// );

// // Metric Item Component
// const MetricItem = ({ label, value }: { label: string; value: string }) => (
//   <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-0">
//     <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
//     <span className="font-semibold text-gray-900 dark:text-gray-100">{value}</span>
//   </div>
// );

// // Loading Spinner Component
// const LoadingSpinner = () => (
//   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
//     <div className="text-center">
//       <div className="relative mb-6">
//         <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
//       </div>
//       <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
//         Loading Dashboard
//       </h2>
//       <div className="flex items-center justify-center space-x-1">
//         <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
//         <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//         <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//       </div>
//     </div>
//   </div>
// );

// // Error State Component
// const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
//   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
//     <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 text-center max-w-md">
//       <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
//         <User className="h-8 w-8 text-red-500 dark:text-red-400" />
//       </div>
//       <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
//         Connection Failed
//       </h3>
//       <p className="text-gray-600 dark:text-gray-400 mb-6">
//         Unable to retrieve dashboard data. Please check your connection and try again.
//       </p>
//       <button
//         onClick={onRetry}
//         className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 font-semibold"
//       >
//         Retry Connection
//       </button>
//     </div>
//   </div>
// );

// // Helper function to get current phase
// const getCurrentPhase = (phaseSummary: DashboardData['phase_summary']) => {
//   if (phaseSummary.placement.status === 'Active') return 'Placement';
//   if (phaseSummary.marketing.status === 'active') return 'Marketing';
//   if (phaseSummary.preparation.status === 'active') return 'Preparation';
//   return 'Enrolled';
// };

// // Placeholder components for other tabs (to be implemented)
// const PreparationTab = ({ candidateId }: { candidateId: number }) => (
//   <div className="text-center py-8">
//     <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//     <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
//       Preparation Details
//     </h3>
//     <p className="text-gray-500 dark:text-gray-400">
//       Preparation phase information will be displayed here.
//     </p>
//   </div>
// );

// const MarketingTab = ({ candidateId }: { candidateId: number }) => (
//   <div className="text-center py-8">
//     <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//     <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
//       Marketing Details
//     </h3>
//     <p className="text-gray-500 dark:text-gray-400">
//       Marketing phase information will be displayed here.
//     </p>
//   </div>
// );

// const PlacementTab = ({ candidateId }: { candidateId: number }) => (
//   <div className="text-center py-8">
//     <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//     <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
//       Placement Details
//     </h3>
//     <p className="text-gray-500 dark:text-gray-400">
//       Placement information will be displayed here.
//     </p>
//   </div>
// );

// const InterviewsTab = ({ candidateId }: { candidateId: number }) => (
//   <div className="text-center py-8">
//     <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//     <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
//       Interview History
//     </h3>
//     <p className="text-gray-500 dark:text-gray-400">
//       Complete interview history will be displayed here.
//     </p>
//   </div>
// );

// const DocumentsTab = ({ candidateId }: { candidateId: number }) => (
//   <div className="text-center py-8">
//     <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//     <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
//       Documents & Resources
//     </h3>
//     <p className="text-gray-500 dark:text-gray-400">
//       Candidate documents and resources will be displayed here.
//     </p>
//   </div>
// );


// app/candidate/dashboard/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { 
  User, 
  Phone, 
  Mail, 
  Activity, 
  Clock, 
  BookOpen, 
  Target, 
  Briefcase,
  TrendingUp,
  Calendar,
  FileText,
  Users,
  Award,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  PlayCircle
} from "lucide-react";

// Types based on your backend response structure
interface CandidateBasicInfo {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  work_status?: string;
  education?: string;
  linkedin_id?: string;
  github_link?: string;
  enrolled_date: string;
  batch_id: number;
  batch_name: string;
}

interface JourneyPhase {
  completed: boolean;
  active: boolean;
  date?: string;
  start_date?: string;
  duration_days?: number;
  status?: string;
  company?: string;
  position?: string;
  days_since?: number;
}

interface PhaseMetrics {
  enrolled: {
    date: string;
    batch_name: string;
    status: string;
  };
  preparation?: {
    status: string;
    start_date: string;
    duration_days: number;
    rating: string;
    communication: string;
  };
  marketing?: {
    status: string;
    start_date: string;
    duration_days: number;
    total_interviews: number;
    positive_interviews: number;
    success_rate: number;
  };
  placement?: {
    company: string;
    position: string;
    placement_date: string;
    base_salary: number;
  };
}

interface TeamMember {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: string;
}

interface TeamInfo {
  preparation: {
    instructors: TeamMember[];
  };
  marketing: {
    manager?: TeamMember;
  };
}

interface InterviewStats {
  total: number;
  positive: number;
  pending: number;
  negative: number;
  success_rate: number;
}

interface InterviewSummary {
  id: number;
  company: string;
  interview_date: string;
  type_of_interview: string;
  feedback: string;
}

interface Alert {
  type: string;
  phase: string;
  message: string;
}

interface DashboardData {
  basic_info: CandidateBasicInfo;
  journey: {
    enrolled: JourneyPhase;
    preparation: JourneyPhase;
    marketing: JourneyPhase;
    placement: JourneyPhase;
  };
  phase_metrics: PhaseMetrics;
  team_info: TeamInfo;
  interview_stats: InterviewStats;
  recent_interviews: InterviewSummary[];
  alerts: Alert[];
  
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function CandidateDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs: TabConfig[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "preparation", label: "Preparation", icon: <BookOpen className="w-4 h-4" /> },
    { id: "marketing", label: "Marketing", icon: <Target className="w-4 h-4" /> },
    { id: "placement", label: "Placement", icon: <Briefcase className="w-4 h-4" /> },
    { id: "interviews", label: "Interviews", icon: <Calendar className="w-4 h-4" /> },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      // Get candidate ID from the current user
      const candidateId = await getCandidateId(token);
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/${candidateId}/dashboard/overview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard data: ${res.statusText}`);
      }

      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Dashboard loading error:", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const getCandidateId = async (token: string): Promise<number> => {
    // In a real implementation, you might get this from user context or decode JWT
    // For now, we'll assume the first API call returns the candidate ID in the response
    // You may need to adjust this based on your auth system
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user_dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await response.json();
      return userData.candidate_id || 1; // Fallback to 1 if not found
    } catch {
      return 1; // Fallback for demo
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!dashboardData) {
    return <ErrorState onRetry={loadDashboardData} />;
  }

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const getPhaseProgress = () => {
    const phases = [
      { name: "enrolled", data: dashboardData.journey.enrolled },
      { name: "preparation", data: dashboardData.journey.preparation },
      { name: "marketing", data: dashboardData.journey.marketing },
      { name: "placement", data: dashboardData.journey.placement },
    ];
    
    const completedPhases = phases.filter(phase => 
      phase.data.completed || phase.data.active
    ).length;
    
    return (completedPhases / phases.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <DashboardHeader 
          candidate={dashboardData.basic_info}
          getFirstName={getFirstName}
          progress={getPhaseProgress()}
        />
        
        {/* Alert Banner */}
        <AlertBanner alerts={dashboardData.alerts} />
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Days Enrolled"
            value={dashboardData.journey.enrolled.days_since?.toString() || "0"}
            subtitle="In System"
            icon={<Clock className="w-6 h-6" />}
            color="blue"
          />
          <SummaryCard
            title="Total Interviews"
            value={dashboardData.interview_stats.total.toString()}
            subtitle="Completed"
            icon={<Calendar className="w-6 h-6" />}
            color="green"
          />
          <SummaryCard
            title="Success Rate"
            value={`${dashboardData.interview_stats.success_rate}%`}
            subtitle="Positive Feedback"
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
          <SummaryCard
            title="Current Phase"
            value={getCurrentPhase(dashboardData.journey)}
            subtitle="Status"
            icon={<Activity className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* Progress Tracker */}
        <JourneyProgress journey={dashboardData.journey} />

        {/* Main Content with Tabs */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <OverviewTab 
                data={dashboardData}
                onDataUpdate={loadDashboardData}
              />
            )}
            {activeTab === "preparation" && (
              <PreparationTab 
                candidateId={dashboardData.basic_info.id}
                onDataUpdate={loadDashboardData}
              />
            )}
            {activeTab === "marketing" && (
              <MarketingTab 
                candidateId={dashboardData.basic_info.id}
                onDataUpdate={loadDashboardData}
              />
            )}
            {activeTab === "placement" && (
              <PlacementTab 
                candidateId={dashboardData.basic_info.id}
                onDataUpdate={loadDashboardData}
              />
            )}
            {activeTab === "interviews" && (
              <InterviewsTab 
                candidateId={dashboardData.basic_info.id}
                onDataUpdate={loadDashboardData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Header Component
const DashboardHeader = ({ 
  candidate, 
  getFirstName, 
  progress 
}: { 
  candidate: CandidateBasicInfo; 
  getFirstName: (name: string) => string;
  progress: number;
}) => (
  <div className="mb-8">
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {getFirstName(candidate.full_name).charAt(0)}
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
            <div className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"></div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {getFirstName(candidate.full_name)}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {candidate.batch_name} • Enrolled {new Date(candidate.enrolled_date).toLocaleDateString()}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Clock className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-blue-500">Last updated: Just now</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Program Progress</p>
      </div>
    </div>
  </div>
);

// Alert Banner Component
const AlertBanner = ({ alerts }: { alerts: Alert[] }) => {
  if (alerts.length === 0) return null;

  const criticalAlerts = alerts.filter(alert => alert.type === 'warning');
  
  return (
    <div className="mb-6 space-y-3">
      {criticalAlerts.map((alert, index) => (
        <div
          key={index}
          className="flex items-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {alert.message}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Phase: {alert.phase}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color 
}: { 
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) => {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20",
    green: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20",
    orange: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20",
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Journey Progress Component
const JourneyProgress = ({ journey }: { journey: DashboardData['journey'] }) => {
  const phases = [
    { 
      name: "Enrolled", 
      key: "enrolled" as const,
      icon: <CheckCircle className="w-5 h-5" />,
      description: "Candidate registration completed"
    },
    { 
      name: "Preparation", 
      key: "preparation" as const,
      icon: <BookOpen className="w-5 h-5" />,
      description: "Technical training & skill development"
    },
    { 
      name: "Marketing", 
      key: "marketing" as const,
      icon: <Target className="w-5 h-5" />,
      description: "Interview scheduling & client engagement"
    },
    { 
      name: "Placement", 
      key: "placement" as const,
      icon: <Briefcase className="w-5 h-5" />,
      description: "Job placement & onboarding"
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Candidate Journey
      </h3>
      <div className="space-y-4">
        {phases.map((phase, index) => {
          const phaseData = journey[phase.key];
          const isCompleted = phaseData.completed;
          const isActive = phaseData.active;
          const isUpcoming = !isCompleted && !isActive;

          return (
            <div key={phase.name} className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isActive 
                  ? 'bg-blue-500 text-white animate-pulse' 
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : phase.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-lg font-medium ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {phase.name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {phaseData.duration_days && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {phaseData.duration_days} days
                      </span>
                    )}
                    {isActive && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-full font-medium">
                        Active
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs rounded-full font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {phase.description}
                </p>
                
                {phaseData.start_date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Started: {new Date(phaseData.start_date).toLocaleDateString()}
                  </p>
                )}
                {phaseData.date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Date: {new Date(phaseData.date).toLocaleDateString()}
                  </p>
                )}
                {phaseData.company && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {phaseData.company} • {phaseData.position}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data, onDataUpdate }: { data: DashboardData; onDataUpdate: () => void }) => (
  <div className="space-y-6">
    {/* Team Information */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preparation Team */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Preparation Team
        </h4>
        <div className="space-y-3">
          {data.team_info.preparation.instructors.map((instructor, index) => (
            <div key={instructor.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {instructor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {instructor.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {instructor.role}
                </p>
              </div>
            </div>
          ))}
          {data.team_info.preparation.instructors.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No instructors assigned yet
            </p>
          )}
        </div>
      </div>

      {/* Marketing Team */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Marketing Team
        </h4>
        <div className="space-y-3">
          {data.team_info.marketing.manager ? (
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {data.team_info.marketing.manager.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {data.team_info.marketing.manager.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  Marketing Manager
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No marketing manager assigned yet
            </p>
          )}
        </div>
      </div>
    </div>

    {/* Recent Interviews */}
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        Recent Interviews
      </h4>
      <div className="space-y-3">
        {data.recent_interviews.map((interview) => (
          <div
            key={interview.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {interview.company}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(interview.interview_date).toLocaleDateString()} • {interview.type_of_interview}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              interview.feedback === 'Positive' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : interview.feedback === 'Negative'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {interview.feedback || 'Pending'}
            </span>
          </div>
        ))}
        {data.recent_interviews.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No interviews scheduled yet
          </p>
        )}
      </div>
    </div>

    {/* Interview Statistics */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Total Interviews"
        value={data.interview_stats.total}
        color="blue"
      />
      <StatCard
        label="Positive"
        value={data.interview_stats.positive}
        color="green"
      />
      <StatCard
        label="Pending"
        value={data.interview_stats.pending}
        color="yellow"
      />
      <StatCard
        label="Success Rate"
        value={`${data.interview_stats.success_rate}%`}
        color="purple"
      />
    </div>
  </div>
);

// Stat Card Component
const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => {
  const colorClasses = {
    blue: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20",
    green: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20",
    yellow: "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20",
    purple: "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20",
  };

  return (
    <div className={`border rounded-2xl p-4 text-center ${colorClasses[color]}`}>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {label}
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Loading Dashboard
      </h2>
      <div className="flex items-center justify-center space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

// Error State Component
const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 text-center max-w-md">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
        <User className="h-8 w-8 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        Connection Failed
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Unable to retrieve dashboard data. Please check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 font-semibold"
      >
        Retry Connection
      </button>
    </div>
  </div>
);

// Helper function to get current phase
const getCurrentPhase = (journey: DashboardData['journey']) => {
  if (journey.placement.active) return 'Placement';
  if (journey.marketing.active) return 'Marketing';
  if (journey.preparation.active) return 'Preparation';
  return 'Enrolled';
};

// Placeholder components for other tabs (implement based on your API endpoints)
const PreparationTab = ({ candidateId, onDataUpdate }: { candidateId: number; onDataUpdate: () => void }) => (
  <div className="text-center py-8">
    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
      Preparation Details
    </h3>
    <p className="text-gray-500 dark:text-gray-400">
      Preparation phase information will be displayed here.
    </p>
  </div>
);

const MarketingTab = ({ candidateId, onDataUpdate }: { candidateId: number; onDataUpdate: () => void }) => (
  <div className="text-center py-8">
    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
      Marketing Details
    </h3>
    <p className="text-gray-500 dark:text-gray-400">
      Marketing phase information will be displayed here.
    </p>
  </div>
);

const PlacementTab = ({ candidateId, onDataUpdate }: { candidateId: number; onDataUpdate: () => void }) => (
  <div className="text-center py-8">
    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
      Placement Details
    </h3>
    <p className="text-gray-500 dark:text-gray-400">
      Placement information will be displayed here.
    </p>
  </div>
);

const InterviewsTab = ({ candidateId, onDataUpdate }: { candidateId: number; onDataUpdate: () => void }) => (
  <div className="text-center py-8">
    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
      Interview History
    </h3>
    <p className="text-gray-500 dark:text-gray-400">
      Complete interview history will be displayed here.
    </p>
  </div>
);