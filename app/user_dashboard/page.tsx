// "use client";
// import Layout from "@/components/Common/Layout";
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// // Define the User interface
// interface User {
//   lastlogin: string | number;
//   fullname: string;
//   phone: string;
//   uname: string;
//   logincount: number;
// }
// const UserDashboard = () => {
//   const router = useRouter();
//   const [user, setUser] = useState(null);

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
//         console.log(userData);
        
//         sessionStorage.setItem("user_data", JSON.stringify(userData));
//         sessionStorage.setItem("user_data_timestamp", Date.now().toString());
//         setUser(userData);
//       } catch (error) {
//         console.error("Error fetching user details:", error);
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

//   const lastLogin=new Date(user.lastlogin).toLocaleString(); 
//   const data = [
//     { label: "Name", value: user.fullname },
//     { label: "Phone", value: user.phone },
//     { label: "Email", value: user.uname },
//     // { label: "Logincount", value: user.logincount },
//     // { label: "Lastlogin", value: lastLogin || "Not available" },
//   ];

//   const TableRow = ({ label, value, isEven }) => (
//     <tr className="">
//       <td className="px-3 py-2 text-xs font-bold text-black dark:text-white sm:px-6  sm:py-4  md:text-base">
//         {label}
//         {/* {" :"} */}
//       </td>
//       <td className=" rounded-4xl px-3  py-2 text-xs font-bold text-black dark:text-white sm:px-6 sm:py-4 md:text-base">
//         {value}
//       </td>
//     </tr>
//   );

//   return (
//     <>
//       <main className="container px-4 py-6 sm:px-6">
//         <nav className="mt-20  flex h-28 flex-col  items-start justify-center sm:mt-28 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
//           <h1 className=" text-center  text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
//             User Dashboard
//           </h1>
//           <div className="hidden sm:block">
//             <Layout currentPage="Dashboard" />
//           </div>
//         </nav>
//         <section className="relative flex h-full justify-center lg:h-[430px]">
//           <div className="flex  w-65 flex-col justify-center rounded-3xl bg-gradient-to-tl from-sky-300 via-purple-300 to-indigo-400 p-8 px-10 py-15 text-white shadow-lg dark:bg-gradient-to-br dark:from-dark/50  dark:to-primarylight/25 sm:w-1/2">
//             <h2 className="mb-8 text-center text-lg font-bold text-gray-800 dark:text-white sm:text-2xl">
//               My Details                                                      
//             </h2>  
//             <div className="flex w-full  justify-center overflow-x-auto">
//               <div className="overflow-x-scroll rounded-2xl bg-gradient-to-br from-sky-300 via-purple-300 to-indigo-400 text-white shadow-2xl dark:bg-gradient-to-tl dark:from-dark/50  dark:to-primarylight/25 sm:overflow-hidden  px-3 py-5   lg:px-24 lg:py-8 xl:px-28 xl:py-10">
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
import Layout from "@/components/Common/Layout";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define the User interface
interface User {
  lastlogin: string | number;
  fullname: string;
  phone: string;
  uname: string;
  logincount: number;
}
const UserDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/user_dashboard`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }

        const userData = await response.json();
        // console.log(userData);

        sessionStorage.setItem("user_data", JSON.stringify(userData));
        sessionStorage.setItem("user_data_timestamp", Date.now().toString());
        setUser(userData);
      } catch (error) {
        // console.error("Error fetching user details:", error);
        localStorage.removeItem("access_token");
        sessionStorage.clear();
        router.push("/login");
      }
    };

    const userDataFromStorage = sessionStorage.getItem("user_data");
    const userDataTimestamp = sessionStorage.getItem("user_data_timestamp");
    const dataAge =
      Date.now() - (userDataTimestamp ? parseInt(userDataTimestamp, 10) : 0);

    if (userDataFromStorage && dataAge < 86400000) {
      // Use data if it's less than a day old
      setUser(JSON.parse(userDataFromStorage));
    } else {
      fetchUserDetails();
    }
  }, []);

  if (!user) {
    return (
      <div className="mt-32 flex h-screen items-center justify-center pb-24 text-xl text-dark dark:text-white sm:text-4xl md:text-5xl lg:text-6xl">
        <div className="text-md mb-4 text-center font-medium text-black dark:text-white sm:text-2xl">
          Loading&nbsp;
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[50px] sm:w-[50px]"
          >
            <circle cx="4" cy="12" r="3" fill="currentColor">
              <animate
                id="svgSpinners3DotsScale0"
                attributeName="r"
                begin="0;svgSpinners3DotsScale1.end-0.2s"
                dur="0.6s"
                values="3;.2;3"
              />
            </circle>
            <circle cx="12" cy="12" r="3" fill="currentColor">
              <animate
                attributeName="r"
                begin="svgSpinners3DotsScale0.end-0.48s"
                dur="0.6s"
                values="3;.2;3"
              />
            </circle>
            <circle cx="20" cy="12" r="3" fill="currentColor">
              <animate
                id="svgSpinners3DotsScale1"
                attributeName="r"
                begin="svgSpinners3DotsScale0.end-0.36s"
                dur="0.6s"
                values="3;.2;3"
              />
            </circle>
          </svg>
        </div>
      </div>
    );
  }

  const lastLogin = user.lastlogin
    ? new Date(user.lastlogin).toLocaleString()
    : "Data not present";

  const data = [
    { label: "Name", value: user.fullname || "-- No Data --" },
    { label: "Phone", value: user.phone || "-- No Data --" },
    { label: "Email", value: user.uname || "-- No Data --" },
    // { label: "Last Login", value: lastLogin },
  ];

  const TableRow = ({ label, value, isEven }: { label: string; value: string; isEven: boolean }) => (
    <tr className="">
      <td className="px-3 py-2 text-xs font-bold text-black dark:text-white sm:px-6 sm:py-4 md:text-base">
        {label}
      </td>
      {/* <td className="rounded-4xl px-3 py-2 text-xs font-bold text-black dark:text-white sm:px-6 sm:py-4 md:text-base">
        {value}
      </td> */}
      <td className="rounded-4xl px-3 py-2 text-xs font-bold text-black dark:text-white sm:px-6 sm:py-4 md:text-base">
        {label === "Email" ? (
          <a
            href={`mailto:${value}`}
            className="no-underline hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </td>
    </tr>
  );

  return (
    <>
      <main className="container px-4 py-6 sm:px-6">
        <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mt-28 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
            User Dashboard
          </h1>
          <div className="hidden sm:block">
            <Layout currentPage="Dashboard" />
          </div>
        </nav>
        <section className="relative flex h-full justify-center lg:h-[430px]">
          <div className="flex w-65 flex-col justify-center rounded-3xl bg-gradient-to-tl from-sky-300 via-purple-300 to-indigo-400 p-8 px-10 py-15 text-white shadow-lg dark:bg-gradient-to-br dark:from-dark/50 dark:to-primarylight/25 sm:w-2/3">
            <h2 className="mb-8 text-center text-lg font-bold text-gray-800 dark:text-white sm:text-2xl">
              My Details
            </h2>
            <div className="flex w-full justify-center overflow-x-auto">
              <div className="overflow-x-scroll rounded-2xl bg-gradient-to-br from-sky-300 via-purple-300 to-indigo-400 text-white shadow-2xl dark:bg-gradient-to-tl dark:from-dark/50 dark:to-primarylight/25 sm:overflow-hidden px-3 py-5 lg:px-24 lg:py-8 xl:px-28 xl:py-10">
                <table className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tbody>
                    {data.map((item, index) => (
                      <TableRow
                        key={index}
                        label={item.label}
                        value={item.value}
                        isEven={index % 2 === 0}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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

export default UserDashboard;
