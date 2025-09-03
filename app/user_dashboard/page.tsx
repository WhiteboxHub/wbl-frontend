// // whiteboxLearning-wbl\app\user_dashboard\page.tsx
// "use client";
// import Layout from "@/components/Common/Layout";
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// // Define the User interface
// interface User {
//   lastlogin: string | number;
//   full_name: string;
//   phone: string;
//   uname: string;
//   logincount: number;
// }
// const UserDashboard = () => {
//   const router = useRouter();
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     const fetchUserDetails = async () => {
//       try {
//         const response = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/user_dashboard`,
//           {
//             method: "GET",
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("access_token")}`,
//             },
//           }
//         );

//         if (!response.ok) {
//           throw new Error("Failed to fetch user details");
//         }

//         const userData = await response.json();
//         // console.log(userData);

//         sessionStorage.setItem("user_data", JSON.stringify(userData));
//         sessionStorage.setItem("user_data_timestamp", Date.now().toString());
//         setUser(userData);
//       } catch (error) {
//         // console.error("Error fetching user details:", error);
//         localStorage.removeItem("access_token");
//         sessionStorage.clear();
//         router.push("/login");
//       }
//     };

//     const userDataFromStorage = sessionStorage.getItem("user_data");
//     const userDataTimestamp = sessionStorage.getItem("user_data_timestamp");
//     const dataAge =
//       Date.now() - (userDataTimestamp ? parseInt(userDataTimestamp, 10) : 0);

//     if (userDataFromStorage && dataAge < 86400000) {
//       // Use data if it's less than a day old
//       setUser(JSON.parse(userDataFromStorage));
//     } else {
//       fetchUserDetails();
//     }
//   }, []);

//   if (!user) {
//     return (
//       <div className="mt-32 flex h-screen items-center justify-center pb-24 text-xl text-dark dark:text-white sm:text-4xl md:text-5xl lg:text-6xl">
//         <div className="text-md mb-4 text-center font-medium text-black dark:text-white sm:text-2xl">
//           Loading&nbsp;
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             viewBox="0 0 24 24"
//             className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[50px] sm:w-[50px]"
//           >
//             <circle cx="4" cy="12" r="3" fill="currentColor">
//               <animate
//                 id="svgSpinners3DotsScale0"
//                 attributeName="r"
//                 begin="0;svgSpinners3DotsScale1.end-0.2s"
//                 dur="0.6s"
//                 values="3;.2;3"
//               />
//             </circle>
//             <circle cx="12" cy="12" r="3" fill="currentColor">
//               <animate
//                 attributeName="r"
//                 begin="svgSpinners3DotsScale0.end-0.48s"
//                 dur="0.6s"
//                 values="3;.2;3"
//               />
//             </circle>
//             <circle cx="20" cy="12" r="3" fill="currentColor">
//               <animate
//                 id="svgSpinners3DotsScale1"
//                 attributeName="r"
//                 begin="svgSpinners3DotsScale0.end-0.36s"
//                 dur="0.6s"
//                 values="3;.2;3"
//               />
//             </circle>
//           </svg>
//         </div>
//       </div>
//     );
//   }

//   const lastLogin = user.lastlogin
//     ? new Date(user.lastlogin).toLocaleString()
//     : "Data not present";

//   const data = [
//     { label: "Name", value: user.full_name || "-- No Data --" },
//     { label: "Phone", value: user.phone || "-- No Data --" },
//     { label: "Email", value: user.uname || "-- No Data --" },
//     // { label: "Last Login", value: lastLogin },
//   ];

//   const TableRow = ({ label, value, isEven }: { label: string; value: string; isEven: boolean }) => (
//     <tr className="">
//       <td className="px-3 py-2 text-xs font-bold text-black dark:text-white sm:px-6 sm:py-4 md:text-base">
//         {label}
//       </td>
//       {/* <td className="rounded-4xl px-3 py-2 text-xs font-bold text-black dark:text-white sm:px-6 sm:py-4 md:text-base">
//         {value}
//       </td> */}
//       <td className="rounded-4xl px-3 py-2 text-xs font-bold text-black dark:text-white sm:px-6 sm:py-4 md:text-base">
//         {label === "Email" ? (
//           <a
//             href={`mailto:${value}`}
//             className="no-underline hover:underline"
//           >
//             {value}
//           </a>
//         ) : (
//           value
//         )}
//       </td>
//     </tr>
//   );

//   return (
//     <>
//       <main className="container px-4 py-6 sm:px-6">
//         <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mt-28 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
//           <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
//             User Dashboard
//           </h1>
//           <div className="hidden sm:block">
//             <Layout currentPage="Dashboard" />
//           </div>
//         </nav>
//         <section className="relative flex h-full justify-center lg:h-[430px]">
//           <div className="flex w-65 flex-col justify-center rounded-3xl bg-gradient-to-tl from-sky-300 via-purple-300 to-indigo-400 p-8 px-10 py-15 text-white shadow-lg dark:bg-gradient-to-br dark:from-dark/50 dark:to-primarylight/25 sm:w-2/3">
//             <h2 className="mb-8 text-center text-lg font-bold text-gray-800 dark:text-white sm:text-2xl">
//               My Details
//             </h2>
//             <div className="flex w-full justify-center overflow-x-auto">
//               <div className="overflow-x-scroll rounded-2xl bg-gradient-to-br from-sky-300 via-purple-300 to-indigo-400 text-white shadow-2xl dark:bg-gradient-to-tl dark:from-dark/50 dark:to-primarylight/25 sm:overflow-hidden px-3 py-5 lg:px-24 lg:py-8 xl:px-28 xl:py-10">
//                 <table className="divide-y divide-gray-200 dark:divide-gray-700">
//                   <tbody>
//                     {data.map((item, index) => (
//                       <TableRow
//                         key={index}
//                         label={item.label}
//                         value={item.value}
//                         isEven={index % 2 === 0}
//                       />
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//           <div className="absolute top-1/2 left-1/2 -z-10 hidden w-full -translate-x-1/2 -translate-y-1/2 transform md:block">
//             <svg
//               className="h-full w-full"
//               viewBox="0 0 1440 969"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <mask
//                 id="mask0_95:1005"
//                 style={{ maskType: "alpha" }}
//                 maskUnits="userSpaceOnUse"
//                 x="0"
//                 y="0"
//                 width="1440"
//                 height="969"
//               >
//                 <rect width="1440" height="969" fill="#090E34" />
//               </mask>
//               <g mask="url(#mask0_95:1005)">
//                 <path
//                   opacity="0.1"
//                   d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
//                   fill="url(#paint0_linear_95:1005)"
//                 />
//                 <path
//                   opacity="0.1"
//                   d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
//                   fill="url(#paint1_linear_95:1005)"
//                 />
//               </g>
//               <defs>
//                 <linearGradient
//                   id="paint0_linear_95:1005"
//                   x1="1178.4"
//                   y1="151.853"
//                   x2="780.959"
//                   y2="453.581"
//                   gradientUnits="userSpaceOnUse"
//                 >
//                   <stop stopColor="#4A6CF7" />
//                   <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
//                 </linearGradient>
//                 <linearGradient
//                   id="paint1_linear_95:1005"
//                   x1="160.5"
//                   y1="220"
//                   x2="1099.45"
//                   y2="1192.04"
//                   gradientUnits="userSpaceOnUse"
//                 >
//                   <stop stopColor="#4A6CF7" />
//                   <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
//                 </linearGradient>
//               </defs>
//             </svg>
//           </div>
//         </section>
//       </main>
//     </>
//   );
// };

// export default UserDashboard;



"use client";
import React, { useState, useEffect } from "react";
import { User, Phone, Mail, Activity, Clock } from "lucide-react";


interface UserProfile {
  uname: string;        // email
  full_name: string;
  phone: string;
  login_count: number;
}

export default function UserDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user_dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user dashboard");
      }

      const data = await res.json();
      setUserProfile(data);
    } catch (error) {
      console.error(error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Loading Profile</h2>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Connection Failed</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Unable to retrieve your profile data. Please check your connection and try again.</p>
          <button
            onClick={loadUserProfile}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24">
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {getFirstName(userProfile.full_name).charAt(0)}
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <div className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"></div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hello, {getFirstName(userProfile.full_name)}!</h2>
              <p className="text-gray-600 dark:text-gray-400">Here's your account overview</p>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-blue-500">Last updated: Just now</span>
              </div>
            </div>
          </div>
        </div>

        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile Details</h2>
            <p className="text-gray-600 dark:text-gray-400">Complete information overview</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{userProfile.full_name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 break-all">{userProfile.uname}</p>
                </div>
              </div>
            </div>

            
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                  <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{userProfile.phone}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Total Login Count</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{userProfile.login_count}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
}
