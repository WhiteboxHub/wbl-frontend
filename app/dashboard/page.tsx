
// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { format, parseISO } from "date-fns";
// import {
//   BookOpen,
//   Target,
//   Briefcase,
//   Calendar,
//   BarChart3,
//   Clock,
//   TrendingUp,
//   Users,
//   AlertTriangle,
//   CheckCircle,
//   FileText,
//   ExternalLink,
//   PlayCircle,
//   Search,
//   Mail,
//   Phone,
//   Award,
//   Activity,
//   LogIn,
//   UserCheck,
//   Edit,
//   X,
//   Save,
//   User,
// } from "lucide-react";
// import { apiFetch } from "@/lib/api";


// interface CandidateBasicInfo {
//   id: number;
//   full_name: string;
//   email: string;
//   phone: string;
//   status: string;
//   enrolled_date: string;
//   batch_name: string;
//   profile_image?: string;
// }

// interface UserProfile {
//   uname: string;
//   full_name: string;
//   phone: string;
//   login_count: number;
//   last_login?: string;
// }

// interface JourneyPhase {
//   completed: boolean;
//   active: boolean;
//   date?: string;
//   start_date?: string;
//   duration_days?: number;
//   days_since?: number;
//   status?: string;
//   company?: string;
//   position?: string;
// }

// interface PhaseMetrics {
//   enrolled: {
//     date: string;
//     batch_name: string;
//     status: string;
//   };
//   preparation?: {
//     status: string;
//     start_date: string;
//     duration_days: number;
//     rating: string;
//     communication: string;
//   };
//   marketing?: {
//     status: string;
//     start_date: string;
//     duration_days: number;
//     total_interviews: number;
//     positive_interviews: number;
//     success_rate: number;
//   };
//   placement?: {
//     company: string;
//     position: string;
//     placement_date: string;
//     base_salary: number;
//   };
// }

// interface TeamInfo {
//   preparation: { instructors: Array<{ id: number; name: string; email?: string; role: string }> };
//   marketing: { manager?: { id: number; name: string; email?: string } };
// }

// interface InterviewStats {
//   total: number;
//   positive: number;
//   pending: number;
//   negative: number;
//   success_rate: number;
// }

// interface InterviewSummary {
//   id: number;
//   company: string;
//   interview_date: string;
//   type_of_interview: string;
//   feedback: string;
// }

// interface Alert {
//   type: string;
//   phase: string;
//   message: string;
// }

// interface DashboardData {
//   basic_info: CandidateBasicInfo;
//   journey: {
//     enrolled: JourneyPhase;
//     preparation: JourneyPhase;
//     marketing: JourneyPhase;
//     placement: JourneyPhase;
//   };
//   phase_metrics: PhaseMetrics;
//   team_info: TeamInfo;
//   interview_stats: InterviewStats;
//   recent_interviews: InterviewSummary[];
//   alerts: Alert[];
// }

// interface Session {
//   sessionid: number;
//   title: string;
//   sessiondate: string;
//   link?: string;
//   videoid?: string;
//   type: string;
//   subject: string;
// }

// interface ApiError {
//   message?: string;
//   detail?: string;
//   body?: {
//     detail?: string;
//     message?: string;
//   };
//   status?: number;
// }

// type TabId = "overview" | "preparation" | "marketing" | "placement";

// // Helper function to extract error messages
// const extractErrorMessage = (err: ApiError, defaultMessage: string): string => {
//   return err.body?.detail || err.body?.message || err.detail || err.message || defaultMessage;
// };

// export default function CandidateDashboardPage() {
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState<TabId>("overview");
//   const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [candidateId, setCandidateId] = useState<number | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [sessionsLoading, setSessionsLoading] = useState(false);
//   const [sessionSearchTerm, setSessionSearchTerm] = useState("");
//   const [showEditModal, setShowEditModal] = useState(false);

//   // Load user profile with login data
//   const loadUserProfile = async () => {
//     try {
//       const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       console.log("Fetching user profile...");
//       const data = await apiFetch("user_dashboard", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       console.log("User profile data:", data);
//       setUserProfile(data);
//       return data;
//     } catch (err: any) {
//       console.error("Error loading user profile:", err);
//       return null;
//     }
//   };

//   // Get candidate ID from logged-in user
//   const getCandidateId = async (): Promise<number> => {
//     try {
//       const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       console.log("Fetching user dashboard info...");
//       const userResponse = await apiFetch("user_dashboard", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       console.log("User dashboard response:", userResponse);

//       if (!userResponse || !userResponse.uname) {
//         throw new Error("User information not found");
//       }

//       const userEmail = userResponse.uname;
//       console.log("User email from dashboard:", userEmail);

//       try {
//         console.log(`Searching for candidate with email: ${userEmail}`);
//         const candidateResponse = await apiFetch(`candidates/search-names/${encodeURIComponent(userEmail)}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         console.log("Candidate search response:", candidateResponse);

//         let candidates = [];
//         if (Array.isArray(candidateResponse)) {
//           candidates = candidateResponse;
//         } else if (candidateResponse?.data && Array.isArray(candidateResponse.data)) {
//           candidates = candidateResponse.data;
//         } else if (candidateResponse?.candidates && Array.isArray(candidateResponse.candidates)) {
//           candidates = candidateResponse.candidates;
//         }

//         console.log("Parsed candidates array:", candidates);

//         if (candidates.length > 0) {
//           const exactMatch = candidates.find((c: any) => c.email?.toLowerCase() === userEmail.toLowerCase());
//           if (exactMatch && exactMatch.id) {
//             console.log("Found exact match candidate ID:", exactMatch.id);
//             return exactMatch.id;
//           }
//           if (candidates[0] && candidates[0].id) {
//             console.log("Using first candidate ID:", candidates[0].id);
//             return candidates[0].id;
//           }
//         }
//       } catch (searchErr: any) {
//         console.warn("Candidate search by email failed:", searchErr);
//       }

//       if (userResponse.candidate_id) {
//         console.log("Using candidate_id from user response:", userResponse.candidate_id);
//         return userResponse.candidate_id;
//       }

//       throw new Error("Candidate ID not found. Please ensure your account is linked to a candidate profile.");
//     } catch (err: any) {
//       console.error("Error getting candidate ID:", err);
//       throw new Error(extractErrorMessage(err, "Failed to get candidate ID. Please log in again."));
//     }
//   };

//   // Load dashboard overview
//   const loadDashboardData = async (retryCount = 0) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//       if (!token) {
//         console.error("No token found, redirecting to login");
//         router.push("/login");
//         return;
//       }

//       console.log("Loading dashboard data...");

//       // Load user profile first (contains login data)
//       const profileData = await loadUserProfile();

//       console.log("Getting candidate ID...");
//       const id = await getCandidateId();
//       console.log("Candidate ID:", id);
//       setCandidateId(id);

//       if (!id) {
//         throw new Error("Could not retrieve candidate ID");
//       }

//       console.log(`Fetching dashboard data for candidate ${id}...`);
//       const data = await apiFetch(`candidates/${id}/dashboard/overview`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       console.log("Dashboard data received:", data);

//       if (!data) {
//         throw new Error("No data received from server");
//       }

//       setDashboardData(data);
//     } catch (err: any) {
//       console.error("Dashboard loading error:", err);

//       const errorMessage = extractErrorMessage(err, "Failed to load dashboard");
//       setError(errorMessage);

//       // Auto-retry once on server errors
//       if (retryCount === 0 && err.status >= 500) {
//         console.log("Retrying due to server error...");
//         setTimeout(() => loadDashboardData(1), 2000);
//         return;
//       }

//       if (err.status === 401 || err.status === 403) {
//         console.error("Authentication failed, redirecting to login");
//         router.push("/login");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Load sessions with search
//   const loadSessions = async () => {
//     const fullName = dashboardData?.basic_info?.full_name;
//     if (!fullName) return;

//     const token =
//       localStorage.getItem("access_token") || localStorage.getItem("token");
//     const searchTerm = sessionSearchTerm.trim() || fullName.split(" ")[0];
//     if (!searchTerm) return;

//     try {
//       setSessionsLoading(true);
//       const params = new URLSearchParams({ search_title: searchTerm.toLowerCase() });
//       const data = await apiFetch(`session?${params}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const sessionsList =
//         data?.sessions || data?.data || (Array.isArray(data) ? data : []);

//       setSessions(Array.isArray(sessionsList) ? sessionsList : []);
//     } catch (err) {
//       console.error("Error loading sessions:", err);
//       setSessions([]);
//     } finally {
//       setSessionsLoading(false);
//     }
//   };


//   // Debounced search effect
//   useEffect(() => {
//     if (dashboardData && activeTab === "overview") {
//       const timeoutId = setTimeout(() => {
//         loadSessions();
//       }, 500);

//       return () => clearTimeout(timeoutId);
//     }
//   }, [dashboardData, activeTab, sessionSearchTerm]);

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   // Auth check on mount
//   useEffect(() => {
//     const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//     if (!token) {
//       router.push("/login");
//     }
//   }, [router]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center pt-24">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Loading Dashboard...</h2>
//           <div className="flex items-center justify-center space-x-1">
//             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
//             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//             <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error || !dashboardData) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center pt-24 px-4">
//         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 text-center max-w-md">
//           <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//           <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Connection Failed</h3>
//           <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "Unable to load dashboard data"}</p>
//           <button
//             onClick={() => loadDashboardData()}
//             className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-semibold"
//           >
//             Retry Connection
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const getFirstName = (fullName: string) => fullName.split(" ")[0];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pt-24">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Alerts Banner */}
//         {dashboardData.alerts && dashboardData.alerts.length > 0 && (
//           <div className="mb-6 space-y-3">
//             {dashboardData.alerts.map((alert, index) => (
//               <div
//                 key={index}
//                 className={`flex items-center space-x-3 p-4 rounded-xl border ${alert.type === "warning"
//                   ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
//                   : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
//                   }`}
//               >
//                 <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
//                 <div className="flex-1">
//                   <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{alert.message}</p>
//                   <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Phase: {alert.phase}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Profile Card with Login Data */}
//         <ProfileCard
//           data={dashboardData.basic_info}
//           userProfile={userProfile}
//           onEditClick={() => setShowEditModal(true)}
//         />

//         {/* Edit Profile Modal */}
//         {showEditModal && (
//           <EditProfileModal
//             data={dashboardData.basic_info}
//             candidateId={candidateId}
//             onClose={() => setShowEditModal(false)}
//             onSave={() => {
//               setShowEditModal(false);
//               loadDashboardData();
//             }}
//           />
//         )}

//         {/* Phase Progress Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//           <PhaseCard
//             title="Enrolled"
//             icon={<CheckCircle className="w-6 h-6" />}
//             color="blue"
//             completed={dashboardData.journey.enrolled.completed}
//             daysSince={dashboardData.journey.enrolled.days_since}
//             batchName={dashboardData.basic_info.batch_name}
//           />
//           <PhaseCard
//             title="Preparation"
//             icon={<BookOpen className="w-6 h-6" />}
//             color="purple"
//             active={dashboardData.journey.preparation.active}
//             completed={dashboardData.journey.preparation.completed}
//             durationDays={dashboardData.journey.preparation.duration_days}
//             rating={dashboardData.phase_metrics.preparation?.rating}
//           />
//           <PhaseCard
//             title="Marketing"
//             icon={<Target className="w-6 h-6" />}
//             color="green"
//             active={dashboardData.journey.marketing.active}
//             completed={dashboardData.journey.marketing.completed}
//             durationDays={dashboardData.journey.marketing.duration_days}
//             interviews={dashboardData.phase_metrics.marketing?.total_interviews}
//             successRate={dashboardData.phase_metrics.marketing?.success_rate}
//           />
//           <PhaseCard
//             title="Placement"
//             icon={<Briefcase className="w-6 h-6" />}
//             color="orange"
//             active={dashboardData.journey.placement.active}
//             completed={dashboardData.journey.placement.completed}
//             company={dashboardData.phase_metrics.placement?.company}
//           />
//         </div>

//         {/* Main Content with Tabs */}
//         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
//           {/* Tab Navigation */}
//           <div className="border-b border-gray-200 dark:border-gray-700">
//             <div className="flex overflow-x-auto">
//               {[
//                 { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
//                 { id: "preparation", label: "Preparation", icon: <BookOpen className="w-4 h-4" /> },
//                 { id: "marketing", label: "Marketing", icon: <Target className="w-4 h-4" /> },
//                 { id: "placement", label: "Placement", icon: <Briefcase className="w-4 h-4" /> },
//               ].map((tab) => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id as TabId)}
//                   className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
//                     ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
//                     : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
//                     }`}
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
//                 sessions={sessions}
//                 sessionsLoading={sessionsLoading}
//                 sessionSearchTerm={sessionSearchTerm}
//                 setSessionSearchTerm={setSessionSearchTerm}
//                 onRefresh={loadDashboardData}
//               />
//             )}
//             {activeTab === "preparation" && (
//               <PreparationTab candidateId={candidateId} onRefresh={loadDashboardData} />
//             )}
//             {activeTab === "marketing" && (
//               <MarketingTab candidateId={candidateId} onRefresh={loadDashboardData} />
//             )}
//             {activeTab === "placement" && (
//               <PlacementTab candidateId={candidateId} onRefresh={loadDashboardData} />
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Edit Profile Modal Component
// const EditProfileModal = ({
//   data,
//   candidateId,
//   onClose,
//   onSave
// }: {
//   data: CandidateBasicInfo;
//   candidateId: number | null;
//   onClose: () => void;
//   onSave: () => void;
// }) => {
//   const [formData, setFormData] = useState({
//     full_name: data.full_name,
//     email: data.email,
//     phone: data.phone,
//   });
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!candidateId) {
//       setError("Candidate ID not found");
//       return;
//     }

//     try {
//       setSaving(true);
//       setError(null);
//       const token = localStorage.getItem("access_token") || localStorage.getItem("token");

//       await apiFetch(`candidates/${candidateId}`, {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       });

//       onSave();
//     } catch (err: any) {
//       console.error("Error updating profile:", err);
//       setError(extractErrorMessage(err, "Failed to update profile"));
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
//           <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
//             <Edit className="w-5 h-5 mr-2" />
//             Edit Profile
//           </h3>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
//           >
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="p-6 space-y-4">
//           {error && (
//             <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
//               {error}
//             </div>
//           )}

//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Full Name
//             </label>
//             <input
//               type="text"
//               value={formData.full_name}
//               onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
//               className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Email
//             </label>
//             <input
//               type="email"
//               value={formData.email}
//               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//               className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Phone
//             </label>
//             <input
//               type="tel"
//               value={formData.phone}
//               onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//               className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               required
//             />
//           </div>

//           {/* Buttons */}
//           <div className="flex gap-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={saving}
//               className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//             >
//               {saving ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//                   Saving...
//                 </>
//               ) : (
//                 <>
//                   <Save className="w-4 h-4 mr-2" />
//                   Save Changes
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// // Profile Card Component with Login Data
// const ProfileCard = ({
//   data,
//   userProfile,
//   onEditClick
// }: {
//   data: CandidateBasicInfo;
//   userProfile: UserProfile | null;
//   onEditClick: () => void;
// }) => {
//   const getInitials = (name: string) => {
//     return name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const getStatusColor = (status: string) => {
//     const statusLower = status?.toLowerCase() || "";
//     if (statusLower.includes("active") || statusLower.includes("placed")) {
//       return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
//     }
//     if (statusLower.includes("progress") || statusLower.includes("marketing")) {
//       return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
//     }
//     if (statusLower.includes("preparation")) {
//       return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
//     }
//     return "bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
//   };

//   return (
//     <div className="mb-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl overflow-hidden">
//       {/* Background Pattern */}
//       <div className="relative">
//         <div className="absolute inset-0 bg-black/10"></div>
//         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

//         {/* Content */}
//         <div className="relative p-8">
//           <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
//             {/* Profile Image/Avatar */}
//             <div className="relative">
//               <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white/30">
//                 {data.profile_image ? (
//                   <img
//                     src={data.profile_image}
//                     alt={data.full_name}
//                     className="w-full h-full rounded-2xl object-cover"
//                   />
//                 ) : (
//                   getInitials(data.full_name)
//                 )}
//               </div>
//               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
//                 <div className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"></div>
//               </div>
//             </div>

//             {/* Profile Info */}
//             <div className="flex-1 text-center lg:text-left">
//               <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-3">
//                 <h2 className="text-3xl font-bold text-white">{data.full_name}</h2>
//                 <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(data.status)}`}>
//                   <Activity className="w-4 h-4 mr-1.5" />
//                   {data.status}
//                 </span>
//               </div>

//               {/* Contact Info */}
//               <div className="flex flex-col lg:flex-row gap-4 mb-4 text-white/90">
//                 <div className="flex items-center justify-center lg:justify-start gap-2">
//                   <Mail className="w-4 h-4" />
//                   <span className="text-sm">{data.email}</span>
//                 </div>
//                 <div className="flex items-center justify-center lg:justify-start gap-2">
//                   <Phone className="w-4 h-4" />
//                   <span className="text-sm">{data.phone}</span>
//                 </div>
//               </div>

//               {/* Stats Grid */}
//               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
//                 <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
//                   <div className="flex items-center gap-2 mb-1">
//                     <Award className="w-4 h-4 text-yellow-300" />
//                     <p className="text-xs text-white/70 font-medium">Batch</p>
//                   </div>
//                   <p className="text-lg font-bold text-white">{data.batch_name || "N/A"}</p>
//                 </div>

//                 <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
//                   <div className="flex items-center gap-2 mb-1">
//                     <Calendar className="w-4 h-4 text-blue-300" />
//                     <p className="text-xs text-white/70 font-medium">Enrolled</p>
//                   </div>
//                   <p className="text-sm font-bold text-white">
//                     {data.enrolled_date ? format(parseISO(data.enrolled_date), "MMM dd, yyyy") : "N/A"}
//                   </p>
//                 </div>

//                 <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
//                   <div className="flex items-center gap-2 mb-1">
//                     <LogIn className="w-4 h-4 text-green-300" />
//                     <p className="text-xs text-white/70 font-medium">Login Count</p>
//                   </div>
//                   <p className="text-2xl font-bold text-white">{userProfile?.login_count || 0}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Edit Button */}
//             <div className="lg:ml-auto">
//               <button
//                 onClick={onEditClick}
//                 className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 transition-all duration-300 font-medium hover:scale-105 transform"
//               >
//                 <Edit className="w-4 h-4" />
//                 Edit Profile
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ... (rest of the components remain the same: PhaseCard, StatusBadge, OverviewTab, StatCard, TeamSection, PreparationTab, MarketingTab, PlacementTab, InfoCard, LoadingState, ErrorState, EmptyState)

// // I'll include the remaining components below for completeness:

// const PhaseCard = ({
//   title, icon, color, completed, active, daysSince, durationDays, batchName, rating, interviews, successRate, company,
// }: {
//   title: string; icon: React.ReactNode; color: string; completed?: boolean; active?: boolean; daysSince?: number;
//   durationDays?: number; batchName?: string; rating?: string; interviews?: number; successRate?: number; company?: string;
// }) => {
//   const colorClasses: Record<string, string> = {
//     blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
//     purple: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
//     green: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
//     orange: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
//         <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>{icon}</div>
//       </div>
//       <div className="space-y-2">
//         {active && <StatusBadge label="Active" type="active" />}
//         {completed && <StatusBadge label="Completed" type="completed" />}
//         {!active && !completed && <StatusBadge label="Not Started" type="pending" />}
//         {daysSince !== undefined && daysSince !== null && (
//           <p className="text-sm text-gray-600 dark:text-gray-400">{daysSince} days since start</p>
//         )}
//         {durationDays !== undefined && durationDays !== null && (
//           <p className="text-sm text-gray-600 dark:text-gray-400">{durationDays} days in phase</p>
//         )}
//         {batchName && <p className="text-sm text-gray-600 dark:text-gray-400">Batch: {batchName}</p>}
//         {rating && <p className="text-sm text-gray-600 dark:text-gray-400">Rating: {rating}</p>}
//         {interviews !== undefined && interviews !== null && (
//           <p className="text-sm text-gray-600 dark:text-gray-400">{interviews} interviews</p>
//         )}
//         {successRate !== undefined && successRate !== null && (
//           <p className="text-sm font-semibold text-green-600 dark:text-green-400">
//             {successRate.toFixed(1)}% success rate
//           </p>
//         )}
//         {company && <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{company}</p>}
//       </div>
//     </div>
//   );
// };

// const StatusBadge = ({ label, type }: { label: string; type: "active" | "completed" | "pending" }) => {
//   const styles = {
//     active: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
//     completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
//     pending: "bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300",
//   };
//   return <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[type]}`}>{label}</span>;
// };

// const OverviewTab = ({
//   data, sessions, sessionsLoading, sessionSearchTerm, setSessionSearchTerm, onRefresh,
// }: {
//   data: DashboardData; sessions: Session[]; sessionsLoading: boolean;
//   sessionSearchTerm: string; setSessionSearchTerm: (term: string) => void; onRefresh: () => void;
// }) => {
//   const firstName = data.basic_info.full_name.split(" ")[0];

//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <StatCard label="Total Interviews" value={data.interview_stats.total} color="blue" />
//         <StatCard label="Positive" value={data.interview_stats.positive} color="green" />
//         <StatCard label="Pending" value={data.interview_stats.pending} color="yellow" />
//         <StatCard label="Success Rate" value={`${data.interview_stats.success_rate}%`} color="purple" />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <TeamSection title="Preparation Team" icon={<Users className="w-5 h-5" />} members={data.team_info.preparation.instructors} />
//         <TeamSection title="Marketing Team" icon={<Target className="w-5 h-5" />} manager={data.team_info.marketing.manager} />
//       </div>

//       <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
//         <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
//           <Calendar className="w-5 h-5 mr-2" />
//           Recent Interviews
//         </h4>
//         <div className="space-y-3">
//           {data.recent_interviews.length === 0 ? (
//             <EmptyState icon={Calendar} title="No Interviews Yet" message="Your scheduled interviews will appear here" />
//           ) : (
//             data.recent_interviews.map((interview) => (
//               <div key={interview.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-600/50 rounded-lg border border-gray-200 dark:border-gray-500 hover:shadow-md transition-all">
//                 <div>
//                   <p className="font-medium text-gray-900 dark:text-gray-100">{interview.company}</p>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">
//                     {format(parseISO(interview.interview_date), "MMM dd, yyyy")} • {interview.type_of_interview}
//                   </p>
//                 </div>
//                 <span className={`px-3 py-1 rounded-full text-sm font-medium ${interview.feedback === "Positive" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
//                   interview.feedback === "Negative" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
//                     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
//                   }`}>
//                   {interview.feedback || "Pending"}
//                 </span>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
//         <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
//           <PlayCircle className="w-5 h-5 mr-2" />
//           Sessions
//         </h4>
//         <div className="mb-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//             <input
//               type="text"
//               value={sessionSearchTerm}
//               onChange={(e) => setSessionSearchTerm(e.target.value)}
//               placeholder={`Search by name, mock, session... (default: ${firstName})`}
//               className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>
//           <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
//             Try searching: "Mock Interview", "Session", your name, or subject name
//           </p>
//         </div>
//         {sessionsLoading ? (
//           <LoadingState message="Searching sessions..." />
//         ) : sessions.length === 0 ? (
//           <EmptyState icon={PlayCircle} title="No Sessions Found" message={`No sessions found for "${sessionSearchTerm || firstName}". Try different keywords.`} />
//         ) : (
//           <div className="space-y-3 max-h-96 overflow-y-auto">
//             {sessions.map((session) => (
//               <div key={session.sessionid} className="flex items-center justify-between p-4 bg-white dark:bg-gray-600/50 rounded-lg border border-gray-200 dark:border-gray-500 hover:shadow-md transition-all">
//                 <div className="flex-1">
//                   <p className="font-medium text-gray-900 dark:text-gray-100">{session.title}</p>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">
//                     {format(parseISO(session.sessiondate), "MMM dd, yyyy")} • {session.type} • {session.subject}
//                   </p>
//                 </div>
//                 {session.link && (
//                   <a href={session.link} target="_blank" rel="noopener noreferrer"
//                     className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center space-x-2 font-medium">
//                     <ExternalLink className="w-4 h-4" />
//                     <span>Watch</span>
//                   </a>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => {
//   const colorClasses: Record<string, string> = {
//     blue: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
//     green: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
//     yellow: "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
//     purple: "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
//   };
//   return (
//     <div className={`border-2 rounded-xl p-5 text-center ${colorClasses[color] || colorClasses.blue}`}>
//       <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{value}</div>
//       <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
//     </div>
//   );
// };

// const TeamSection = ({
//   title, icon, members, manager,
// }: {
//   title: string; icon: React.ReactNode;
//   members?: Array<{ id: number; name: string; email?: string; role: string }>;
//   manager?: { id: number; name: string; email?: string };
// }) => {
//   return (
//     <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
//       <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
//         {icon}<span className="ml-2">{title}</span>
//       </h4>
//       <div className="space-y-3">
//         {members && members.length > 0 ? (
//           members.map((member) => (
//             <div key={member.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600/50 rounded-lg">
//               <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
//                 {member.name.split(" ").map((n) => n[0]).join("")}
//               </div>
//               <div className="flex-1">
//                 <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
//               </div>
//             </div>
//           ))
//         ) : manager ? (
//           <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600/50 rounded-lg">
//             <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
//               {manager.name.split(" ").map((n) => n[0]).join("")}
//             </div>
//             <div className="flex-1">
//               <p className="font-medium text-gray-900 dark:text-gray-100">{manager.name}</p>
//               <p className="text-sm text-gray-500 dark:text-gray-400">Marketing Manager</p>
//             </div>
//           </div>
//         ) : (
//           <EmptyState icon={Users} title="No Team Members" message="Team members will be assigned soon" />
//         )}
//       </div>
//     </div>
//   );
// };

// const PreparationTab = ({ candidateId, onRefresh }: { candidateId: number | null; onRefresh: () => void }) => {
//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!candidateId) return;
//     const loadData = async () => {
//       try {
//         setLoading(true); setError(null);
//         const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//         const result = await apiFetch(`candidates/${candidateId}/preparation`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setData(result);
//       } catch (err: any) {
//         console.error("Preparation data error:", err);
//         setError(extractErrorMessage(err, "Failed to load preparation data"));
//         setData(null);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadData();
//   }, [candidateId]);

//   if (loading) return <LoadingState message="Loading preparation data..." />;
//   if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
//   if (!data) return <EmptyState icon={BookOpen} title="No Data Available" message="Preparation data will appear here once available" />;

//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <InfoCard title="Status" value={data.status || "N/A"} />
//         <InfoCard title="Start Date" value={data.start_date ? format(parseISO(data.start_date), "MMM dd, yyyy") : "N/A"} />
//         <InfoCard title="Duration" value={data.duration_days ? `${data.duration_days} days` : "N/A"} />
//         <InfoCard title="Tech Rating" value={data.rating || "N/A"} />
//         <InfoCard title="Communication" value={data.communication || "N/A"} />
//         <InfoCard title="Batch" value={data.batch_name || "N/A"} />
//       </div>
//       {data.instructors && data.instructors.length > 0 && (
//         <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
//           <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
//             <Users className="w-5 h-5 mr-2" />Instructors
//           </h4>
//           <div className="space-y-3">
//             {data.instructors.map((instructor: any) => (
//               <div key={instructor.id} className="p-4 bg-white dark:bg-gray-600/50 rounded-lg border border-gray-200 dark:border-gray-500">
//                 <p className="font-medium text-gray-900 dark:text-gray-100">{instructor.name}</p>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">{instructor.role}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const MarketingTab = ({ candidateId, onRefresh }: { candidateId: number | null; onRefresh: () => void }) => {
//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!candidateId) return;
//     const loadData = async () => {
//       try {
//         setLoading(true); setError(null);
//         const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//         const result = await apiFetch(`candidates/${candidateId}/marketing`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setData(result);
//       } catch (err: any) {
//         console.error("Marketing data error:", err);
//         setError(extractErrorMessage(err, "Failed to load marketing data"));
//         setData(null);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadData();
//   }, [candidateId]);

//   if (loading) return <LoadingState message="Loading marketing data..." />;
//   if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
//   if (!data) return <EmptyState icon={Target} title="No Data Available" message="Marketing data will appear here once available" />;

//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <InfoCard title="Status" value={data.status || "N/A"} />
//         <InfoCard title="Start Date" value={data.start_date ? format(parseISO(data.start_date), "MMM dd, yyyy") : "N/A"} />
//         <InfoCard title="Duration" value={data.duration_days ? `${data.duration_days} days` : "N/A"} />
//         <InfoCard title="Total Interviews" value={data.interview_stats?.total || 0} />
//         <InfoCard title="Success Rate" value={`${data.interview_stats?.success_rate || 0}%`} />
//       </div>
//       {data.marketing_manager && (
//         <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
//           <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
//             <Users className="w-5 h-5 mr-2" />Marketing Manager
//           </h4>
//           <div className="p-4 bg-white dark:bg-gray-600/50 rounded-lg border border-gray-200 dark:border-gray-500">
//             <p className="font-medium text-gray-900 dark:text-gray-100">{data.marketing_manager.name}</p>
//             {data.marketing_manager.email && (
//               <p className="text-sm text-gray-500 dark:text-gray-400">{data.marketing_manager.email}</p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const PlacementTab = ({ candidateId, onRefresh }: { candidateId: number | null; onRefresh: () => void }) => {
//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!candidateId) return;
//     const loadData = async () => {
//       try {
//         setLoading(true); setError(null);
//         const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//         const result = await apiFetch(`candidates/${candidateId}/placement`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setData(result);
//       } catch (err: any) {
//         console.error("Placement data error:", err);
//         setError(extractErrorMessage(err, "Failed to load placement data"));
//         setData(null);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadData();
//   }, [candidateId]);

//   if (loading) return <LoadingState message="Loading placement data..." />;
//   if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
//   if (!data || !data.has_placements) {
//     return <EmptyState icon={Briefcase} title="No Placement Yet" message="You haven't been placed yet. Keep working hard!" />;
//   }

//   const placement = data.active_placement;
//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <InfoCard title="Company" value={placement.company || "N/A"} />
//         <InfoCard title="Position" value={placement.position || "N/A"} />
//         <InfoCard title="Placement Date" value={placement.placement_date ? format(parseISO(placement.placement_date), "MMM dd, yyyy") : "N/A"} />
//         <InfoCard title="Status" value={placement.status || "N/A"} />
//         {placement.base_salary_offered && <InfoCard title="Base Salary" value={`$${placement.base_salary_offered.toLocaleString()}`} />}
//         {placement.type && <InfoCard title="Type" value={placement.type} />}
//       </div>
//     </div>
//   );
// };

// const InfoCard = ({ title, value }: { title: string; value: string | number }) => (
//   <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
//     <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</p>
//     <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
//   </div>
// );

// const LoadingState = ({ message = "Loading..." }: { message?: string }) => (
//   <div className="text-center py-16">
//     <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
//     <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
//   </div>
// );

// const ErrorState = ({ message = "No records found", onRetry }: { message?: string; onRetry?: () => void }) => (
//   <div className="text-center py-20 px-4">
//     <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
//       {message}
//     </p>
//     {onRetry && (
//       <button
//         onClick={onRetry}
//         className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
//       >
//         Retry
//       </button>
//     )}
//   </div>
// );


// const EmptyState = ({ icon: Icon, title, message }: { icon: any; title: string; message: string; }) => (
//   <div className="text-center py-12 px-4">
//     <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full mb-4">
//       <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
//     </div>
//     <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
//     <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{message}</p>
//   </div>
// );



"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  BookOpen,
  Target,
  Briefcase,
  Calendar,
  BarChart3,
  Clock,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  FileText,
  ExternalLink,
  PlayCircle,
  Search,
  Mail,
  Phone,
  Award,
  Activity,
  LogIn,
  UserCheck,
  Edit,
  X,
  Save,
  User,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CandidateBasicInfo {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  enrolled_date: string;
  batch_name: string;
  profile_image?: string;
}

interface UserProfile {
  uname: string;
  full_name: string;
  phone: string;
  login_count: number;
  last_login?: string;
}

interface JourneyPhase {
  completed: boolean;
  active: boolean;
  date?: string;
  start_date?: string;
  duration_days?: number;
  days_since?: number;
  status?: string;
  company?: string;
  position?: string;
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

interface TeamInfo {
  preparation: { instructors: Array<{ id: number; name: string; email?: string; role: string }> };
  marketing: { manager?: { id: number; name: string; email?: string } };
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

interface Session {
  sessionid: number;
  title: string;
  sessiondate: string;
  link?: string;
  videoid?: string;
  type: string;
  subject: string;
}

interface ApiError {
  message?: string;
  detail?: string;
  body?: {
    detail?: string;
    message?: string;
  };
  status?: number;
}

type TabId = "overview" | "preparation" | "marketing" | "placement";

// Helper function to extract error messages
const extractErrorMessage = (err: ApiError, defaultMessage: string): string => {
  return err.body?.detail || err.body?.message || err.detail || err.message || defaultMessage;
};

export default function CandidateDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionSearchTerm, setSessionSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // Load user profile with login data
  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      console.log("Fetching user profile...");
      const data = await apiFetch("user_dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("User profile data:", data);
      setUserProfile(data);
      return data;
    } catch (err: any) {
      console.error("Error loading user profile:", err);
      return null;
    }
  };

  // Get candidate ID from logged-in user
  const getCandidateId = async (): Promise<number> => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      console.log("Fetching user dashboard info...");
      const userResponse = await apiFetch("user_dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("User dashboard response:", userResponse);

      if (!userResponse || !userResponse.uname) {
        throw new Error("User information not found");
      }

      const userEmail = userResponse.uname;
      console.log("User email from dashboard:", userEmail);

      try {
        console.log(`Searching for candidate with email: ${userEmail}`);
        const candidateResponse = await apiFetch(`candidates/search-names/${encodeURIComponent(userEmail)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Candidate search response:", candidateResponse);

        let candidates = [];
        if (Array.isArray(candidateResponse)) {
          candidates = candidateResponse;
        } else if (candidateResponse?.data && Array.isArray(candidateResponse.data)) {
          candidates = candidateResponse.data;
        } else if (candidateResponse?.candidates && Array.isArray(candidateResponse.candidates)) {
          candidates = candidateResponse.candidates;
        }

        console.log("Parsed candidates array:", candidates);

        if (candidates.length > 0) {
          const exactMatch = candidates.find((c: any) => c.email?.toLowerCase() === userEmail.toLowerCase());
          if (exactMatch && exactMatch.id) {
            console.log("Found exact match candidate ID:", exactMatch.id);
            return exactMatch.id;
          }
          if (candidates[0] && candidates[0].id) {
            console.log("Using first candidate ID:", candidates[0].id);
            return candidates[0].id;
          }
        }
      } catch (searchErr: any) {
        console.warn("Candidate search by email failed:", searchErr);
      }

      if (userResponse.candidate_id) {
        console.log("Using candidate_id from user response:", userResponse.candidate_id);
        return userResponse.candidate_id;
      }

      throw new Error("Candidate ID not found. Please ensure your account is linked to a candidate profile.");
    } catch (err: any) {
      console.error("Error getting candidate ID:", err);
      throw new Error(extractErrorMessage(err, "Failed to get candidate ID. Please log in again."));
    }
  };

  // Load dashboard overview
  const loadDashboardData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) {
        console.error("No token found, redirecting to login");
        router.push("/login");
        return;
      }

      console.log("Loading dashboard data...");

      // Load user profile first (contains login data)
      const profileData = await loadUserProfile();

      console.log("Getting candidate ID...");
      const id = await getCandidateId();
      console.log("Candidate ID:", id);
      setCandidateId(id);

      if (!id) {
        throw new Error("Could not retrieve candidate ID");
      }

      console.log(`Fetching dashboard data for candidate ${id}...`);
      const data = await apiFetch(`candidates/${id}/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Dashboard data received:", data);

      if (!data) {
        throw new Error("No data received from server");
      }

      setDashboardData(data);
    } catch (err: any) {
      console.error("Dashboard loading error:", err);

      const errorMessage = extractErrorMessage(err, "Failed to load dashboard");
      setError(errorMessage);

      // Auto-retry once on server errors
      if (retryCount === 0 && err.status >= 500) {
        console.log("Retrying due to server error...");
        setTimeout(() => loadDashboardData(1), 2000);
        return;
      }

      if (err.status === 401 || err.status === 403) {
        console.error("Authentication failed, redirecting to login");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load sessions with search - ✅ FIXED VERSION
  const loadSessions = async () => {
    const fullName = dashboardData?.basic_info?.full_name;
    if (!fullName) return;

    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    const searchTerm = sessionSearchTerm.trim() || fullName.split(" ")[0];
    if (!searchTerm) return;

    try {
      setSessionsLoading(true);
      const params = new URLSearchParams({ search_title: searchTerm.toLowerCase() });
      const data = await apiFetch(`session?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const sessionsList =
        data?.sessions || data?.data || (Array.isArray(data) ? data : []);

      // ✅ FILTER OUT INVALID SESSIONS
      const validSessions = Array.isArray(sessionsList) 
        ? sessionsList.filter(session => 
            session && 
            session.sessiondate && 
            session.title
          )
        : [];

      setSessions(validSessions);
    } catch (err) {
      console.error("Error loading sessions:", err);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (dashboardData && activeTab === "overview") {
      const timeoutId = setTimeout(() => {
        loadSessions();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [dashboardData, activeTab, sessionSearchTerm]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auth check on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Loading Dashboard...</h2>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center pt-24 px-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Connection Failed</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "Unable to load dashboard data"}</p>
          <button
            onClick={() => loadDashboardData()}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const getFirstName = (fullName: string) => fullName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts Banner */}
        {dashboardData.alerts && dashboardData.alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {dashboardData.alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-4 rounded-xl border ${
                  alert.type === "warning"
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{alert.message}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Phase: {alert.phase}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Card with Login Data */}
        <ProfileCard
          data={dashboardData.basic_info}
          userProfile={userProfile}
          onEditClick={() => setShowEditModal(true)}
        />

        {/* Edit Profile Modal */}
        {showEditModal && (
          <EditProfileModal
            data={dashboardData.basic_info}
            candidateId={candidateId}
            onClose={() => setShowEditModal(false)}
            onSave={() => {
              setShowEditModal(false);
              loadDashboardData();
            }}
          />
        )}

        {/* Phase Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <PhaseCard
            title="Enrolled"
            icon={<CheckCircle className="w-6 h-6" />}
            color="blue"
            completed={dashboardData.journey.enrolled.completed}
            daysSince={dashboardData.journey.enrolled.days_since}
            batchName={dashboardData.basic_info.batch_name}
          />
          <PhaseCard
            title="Preparation"
            icon={<BookOpen className="w-6 h-6" />}
            color="purple"
            active={dashboardData.journey.preparation.active}
            completed={dashboardData.journey.preparation.completed}
            durationDays={dashboardData.journey.preparation.duration_days}
            rating={dashboardData.phase_metrics.preparation?.rating}
          />
          <PhaseCard
            title="Marketing"
            icon={<Target className="w-6 h-6" />}
            color="green"
            active={dashboardData.journey.marketing.active}
            completed={dashboardData.journey.marketing.completed}
            durationDays={dashboardData.journey.marketing.duration_days}
            interviews={dashboardData.phase_metrics.marketing?.total_interviews}
            successRate={dashboardData.phase_metrics.marketing?.success_rate}
          />
          <PhaseCard
            title="Placement"
            icon={<Briefcase className="w-6 h-6" />}
            color="orange"
            active={dashboardData.journey.placement.active}
            completed={dashboardData.journey.placement.completed}
            company={dashboardData.phase_metrics.placement?.company}
          />
        </div>

        {/* Main Content with Tabs */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
                { id: "preparation", label: "Preparation", icon: <BookOpen className="w-4 h-4" /> },
                { id: "marketing", label: "Marketing", icon: <Target className="w-4 h-4" /> },
                { id: "placement", label: "Placement", icon: <Briefcase className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
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
                sessions={sessions}
                sessionsLoading={sessionsLoading}
                sessionSearchTerm={sessionSearchTerm}
                setSessionSearchTerm={setSessionSearchTerm}
                onRefresh={loadDashboardData}
              />
            )}
            {activeTab === "preparation" && (
              <PreparationTab candidateId={candidateId} onRefresh={loadDashboardData} />
            )}
            {activeTab === "marketing" && (
              <MarketingTab candidateId={candidateId} onRefresh={loadDashboardData} />
            )}
            {activeTab === "placement" && (
              <PlacementTab candidateId={candidateId} onRefresh={loadDashboardData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Profile Modal Component
const EditProfileModal = ({
  data,
  candidateId,
  onClose,
  onSave
}: {
  data: CandidateBasicInfo;
  candidateId: number | null;
  onClose: () => void;
  onSave: () => void;
}) => {
  const [formData, setFormData] = useState({
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!candidateId) {
      setError("Candidate ID not found");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");

      await apiFetch(`candidates/${candidateId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      onSave();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(extractErrorMessage(err, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Edit className="w-5 h-5 mr-2" />
            Edit Profile
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Profile Card Component with Login Data
const ProfileCard = ({
  data,
  userProfile,
  onEditClick
}: {
  data: CandidateBasicInfo;
  userProfile: UserProfile | null;
  onEditClick: () => void;
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("active") || statusLower.includes("placed")) {
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
    }
    if (statusLower.includes("progress") || statusLower.includes("marketing")) {
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    }
    if (statusLower.includes("preparation")) {
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    }
    return "bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
  };

  return (
    <div className="mb-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl overflow-hidden">
      {/* Background Pattern */}
      <div className="relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

        {/* Content */}
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Profile Image/Avatar */}
            <div className="relative">
              <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white/30">
                {data.profile_image ? (
                  <img
                    src={data.profile_image}
                    alt={data.full_name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  getInitials(data.full_name)
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
                <div className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"></div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-white">{data.full_name}</h2>
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(data.status)}`}>
                  <Activity className="w-4 h-4 mr-1.5" />
                  {data.status}
                </span>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col lg:flex-row gap-4 mb-4 text-white/90">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{data.email}</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{data.phone}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-yellow-300" />
                    <p className="text-xs text-white/70 font-medium">Batch</p>
                  </div>
                  <p className="text-lg font-bold text-white">{data.batch_name || "N/A"}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-300" />
                    <p className="text-xs text-white/70 font-medium">Enrolled</p>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {data.enrolled_date ? format(parseISO(data.enrolled_date), "MMM dd, yyyy") : "N/A"}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <LogIn className="w-4 h-4 text-green-300" />
                    <p className="text-xs text-white/70 font-medium">Login Count</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{userProfile?.login_count || 0}</p>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="lg:ml-auto">
              <button
                onClick={onEditClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 transition-all duration-300 font-medium hover:scale-105 transform"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PhaseCard = ({
  title, icon, color, completed, active, daysSince, durationDays, batchName, rating, interviews, successRate, company,
}: {
  title: string; icon: React.ReactNode; color: string; completed?: boolean; active?: boolean; daysSince?: number;
  durationDays?: number; batchName?: string; rating?: string; interviews?: number; successRate?: number; company?: string;
}) => {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
    green: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    orange: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>{icon}</div>
      </div>
      <div className="space-y-2">
        {active && <StatusBadge label="Active" type="active" />}
        {completed && <StatusBadge label="Completed" type="completed" />}
        {!active && !completed && <StatusBadge label="Not Started" type="pending" />}
        {daysSince !== undefined && daysSince !== null && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{daysSince} days since start</p>
        )}
        {durationDays !== undefined && durationDays !== null && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{durationDays} days in phase</p>
        )}
        {batchName && <p className="text-sm text-gray-600 dark:text-gray-400">Batch: {batchName}</p>}
        {rating && <p className="text-sm text-gray-600 dark:text-gray-400">Rating: {rating}</p>}
        {interviews !== undefined && interviews !== null && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{interviews} interviews</p>
        )}
        {successRate !== undefined && successRate !== null && (
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            {successRate.toFixed(1)}% success rate
          </p>
        )}
        {company && <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{company}</p>}
      </div>
    </div>
  );
};

const StatusBadge = ({ label, type }: { label: string; type: "active" | "completed" | "pending" }) => {
  const styles = {
    active: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    pending: "bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300",
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[type]}`}>{label}</span>;
};

const OverviewTab = ({
  data, sessions, sessionsLoading, sessionSearchTerm, setSessionSearchTerm, onRefresh,
}: {
  data: DashboardData; sessions: Session[]; sessionsLoading: boolean;
  sessionSearchTerm: string; setSessionSearchTerm: (term: string) => void; onRefresh: () => void;
}) => {
  const firstName = data.basic_info.full_name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Interviews" value={data.interview_stats.total} color="blue" />
        <StatCard label="Positive" value={data.interview_stats.positive} color="green" />
        <StatCard label="Pending" value={data.interview_stats.pending} color="yellow" />
        <StatCard label="Success Rate" value={`${data.interview_stats.success_rate}%`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamSection title="Preparation Team" icon={<Users className="w-5 h-5" />} members={data.team_info.preparation.instructors} />
        <TeamSection title="Marketing Team" icon={<Target className="w-5 h-5" />} manager={data.team_info.marketing.manager} />
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Recent Interviews
        </h4>
        <div className="space-y-3">
          {data.recent_interviews.length === 0 ? (
            <EmptyState icon={Calendar} title="No Interviews Yet" message="Your scheduled interviews will appear here" />
          ) : (
            data.recent_interviews.map((interview) => (
              <div key={interview.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-600/50 rounded-lg border border-gray-200 dark:border-gray-500 hover:shadow-md transition-all">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{interview.company}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(parseISO(interview.interview_date), "MMM dd, yyyy")} • {interview.type_of_interview}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  interview.feedback === "Positive" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                  interview.feedback === "Negative" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                }`}>
                  {interview.feedback || "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ✅ SESSIONS SECTION WITH SAFE RENDERING */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <PlayCircle className="w-5 h-5 mr-2" />
          Sessions
        </h4>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={sessionSearchTerm}
              onChange={(e) => setSessionSearchTerm(e.target.value)}
              placeholder={`Search by name, mock, session... (default: ${firstName})`}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Try searching: "Mock Interview", "Session", your name, or subject name
          </p>
        </div>
        {sessionsLoading ? (
          <LoadingState message="Searching sessions..." />
        ) : sessions.length === 0 ? (
          <EmptyState icon={PlayCircle} title="No Sessions Found" message={`No sessions found for "${sessionSearchTerm || firstName}". Try different keywords.`} />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessions.map((session) => (
              <div key={session.sessionid} className="flex items-center justify-between p-4 bg-white dark:bg-gray-600/50 rounded-lg border border-gray-200 dark:border-gray-500 hover:shadow-md transition-all">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{session.title || "Untitled Session"}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {/* ✅ SAFE DATE RENDERING */}
                    {session.sessiondate ? format(parseISO(session.sessiondate), "MMM dd, yyyy") : "No date"} • 
                    {session.type || "N/A"} • 
                    {session.subject || "N/A"}
                  </p>
                </div>
                {session.link && (
                  <a href={session.link} target="_blank" rel="noopener noreferrer"
                    className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center space-x-2 font-medium">
                    <ExternalLink className="w-4 h-4" />
                    <span>Watch</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => {
  const colorClasses: Record<string, string> = {
    blue: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    green: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    yellow: "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    purple: "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  };
  return (
    <div className={`border-2 rounded-xl p-5 text-center ${colorClasses[color] || colorClasses.blue}`}>
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
};

const TeamSection = ({
  title, icon, members, manager,
}: {
  title: string; icon: React.ReactNode;
  members?: Array<{ id: number; name: string; email?: string; role: string }>;
  manager?: { id: number; name: string; email?: string };
}) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
        {icon}<span className="ml-2">{title}</span>
      </h4>
      <div className="space-y-3">
        {members && members.length > 0 ? (
          members.map((member) => (
            <div key={member.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600/50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
              </div>
            </div>
          ))
        ) : manager ? (
          <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-600/50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {manager.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">{manager.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Marketing Manager</p>
            </div>
          </div>
        ) : (
          <EmptyState icon={Users} title="No Team Members" message="Team members will be assigned soon" />
        )}
      </div>
    </div>
  );
};

const PreparationTab = ({ candidateId, onRefresh }: { candidateId: number | null; onRefresh: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    const loadData = async () => {
      try {
        setLoading(true); setError(null);
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const result = await apiFetch(`candidates/${candidateId}/preparation`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(result);
      } catch (err: any) {
        console.error("Preparation data error:", err);
        setError(extractErrorMessage(err, "Failed to load preparation data"));
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [candidateId]);

  if (loading) return <LoadingState message="Loading preparation data..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return <EmptyState icon={BookOpen} title="No Data Available" message="Preparation data will appear here once available" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Status" value={data.status || "N/A"} />
        <InfoCard title="Start Date" value={data.start_date ? format(parseISO(data.start_date), "MMM dd, yyyy") : "N/A"} />
        <InfoCard title="Duration" value={data.duration_days ? `${data.duration_days} days` : "N/A"} />
        <InfoCard title="Tech Rating" value={data.rating || "N/A"} />
        <InfoCard title="Communication" value={data.communication || "N/A"} />
        <InfoCard title="Batch" value={data.batch_name || "N/A"} />
      </div>
      {data.instructors && data.instructors.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />Instructors
          </h4>
          <div className="space-y-3">
            {data.instructors.map((instructor: any) => (
              <div key={instructor.id} className="p-4 bg-white dark:bg-gray-600/50 rounded-lg border border-gray-200 dark:border-gray-500">
                <p className="font-medium text-gray-900 dark:text-gray-100">{instructor.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{instructor.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MarketingTab = ({ candidateId, onRefresh }: { candidateId: number | null; onRefresh: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    const loadData = async () => {
      try {
        setLoading(true); setError(null);
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const result = await apiFetch(`candidates/${candidateId}/marketing`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(result);
      } catch (err: any) {
        console.error("Marketing data error:", err);
        setError(extractErrorMessage(err, "Failed to load marketing data"));
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [candidateId]);

  if (loading) return <LoadingState message="Loading marketing data..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return <EmptyState icon={Target} title="No Data Available" message="Marketing data will appear here once available" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Status" value={data.status || "N/A"} />
        <InfoCard title="Start Date" value={data.start_date ? format(parseISO(data.start_date), "MMM dd, yyyy") : "N/A"} />
        <InfoCard title="Duration" value={data.duration_days ? `${data.duration_days} days` : "N/A"} />
        <InfoCard title="Total Interviews" value={data.interview_stats?.total || 0} />
        <InfoCard title="Success Rate" value={`${data.interview_stats?.success_rate || 0}%`} />
      </div>
      {data.marketing_manager && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />Marketing Manager
          </h4>
          <div className="p-4 bg-white dark:bg-gray-600/50 rounded-lg border border-gray-200 dark:border-gray-500">
            <p className="font-medium text-gray-900 dark:text-gray-100">{data.marketing_manager.name}</p>
            {data.marketing_manager.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{data.marketing_manager.email}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PlacementTab = ({ candidateId, onRefresh }: { candidateId: number | null; onRefresh: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    const loadData = async () => {
      try {
        setLoading(true); setError(null);
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const result = await apiFetch(`candidates/${candidateId}/placement`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(result);
      } catch (err: any) {
        console.error("Placement data error:", err);
        setError(extractErrorMessage(err, "Failed to load placement data"));
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [candidateId]);

  if (loading) return <LoadingState message="Loading placement data..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data || !data.has_placements) {
    return <EmptyState icon={Briefcase} title="No Placement Yet" message="You haven't been placed yet. Keep working hard!" />;
  }

  const placement = data.active_placement;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Company" value={placement.company || "N/A"} />
        <InfoCard title="Position" value={placement.position || "N/A"} />
        <InfoCard title="Placement Date" value={placement.placement_date ? format(parseISO(placement.placement_date), "MMM dd, yyyy") : "N/A"} />
        <InfoCard title="Status" value={placement.status || "N/A"} />
        {placement.base_salary_offered && <InfoCard title="Base Salary" value={`$${placement.base_salary_offered.toLocaleString()}`} />}
        {placement.type && <InfoCard title="Type" value={placement.type} />}
      </div>
    </div>
  );
};

const InfoCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</p>
    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
  </div>
);

const LoadingState = ({ message = "Loading..." }: { message?: string }) => (
  <div className="text-center py-16">
    <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
  </div>
);

const ErrorState = ({ message = "No records found", onRetry }: { message?: string; onRetry?: () => void }) => (
  <div className="text-center py-20 px-4">
    <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
      {message}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
      >
        Retry
      </button>
    )}
  </div>
);

const EmptyState = ({ icon: Icon, title, message }: { icon: any; title: string; message: string; }) => (
  <div className="text-center py-12 px-4">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full mb-4">
      <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{message}</p>
  </div>
);