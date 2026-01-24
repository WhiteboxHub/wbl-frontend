// // "use client";
// // import React, { useState, useEffect } from "react";
// // import { useRouter, useSearchParams } from "next/navigation";
// // import { isAuthenticated } from "@/utils/auth";
// // import Layout from "@/components/Common/Layout";
// // import ResourcesTable from "@/components/Common/resourcesTable";
// // import CourseNavigation from "@/components/Common/CourseNavigation";

// // type ComponentType =
// //   | "Presentations"
// //   | "Must See Youtube Videos"
// //   | "Cheatsheets"
// //   | "Study Guides"
// //   | "Diagrams"
// //   | "Interactive Visual Explainers"
// //   | "Newsletters"
// //   | "Books"
// //   | "Softwares"
// //   | "Assignments";

// // export default function Presentation() {
// //   const router = useRouter();
// //   const searchParams = useSearchParams();
// //   const [course, setCourse] = useState("ML");
// //   const [loading, setLoading] = useState(true);
// //   const [activeComponent, setActiveComponent] =
// //     useState<ComponentType>("Presentations");

// //   const buttons = [
// //     { type: "Presentations", label: "Presentations" },
// //     { type: "Must See Youtube Videos", label: "Must See Youtube Videos" },
// //     { type: "Cheatsheets", label: "Cheatsheets" },
// //     { type: "Study Guides", label: "Study Guides" },
// //     { type: "Diagrams", label: "Diagrams" },
// //     { type: "Softwares", label: "Softwares" },
// //     { type: "Interactive Visual Explainers", label: "VisualIntuition" },
// //     { type: "Books", label: "O'Reilly Playlist" },
// //     { type: "Newsletters", label: "Newsletters" },
// //     { type: "Assignments", label: "Assignments" },
// //   ];

// //   const handleButtonClick = (component: ComponentType) => {
// //     setActiveComponent(component);
// //   };

// //   useEffect(() => {
// //     router.push(`/presentation?course=ML`);
// //   }, [router]);

// //   useEffect(() => {
// //     const checkAuthentication = async () => {
// //       try {
// //         await new Promise((resolve) => setTimeout(resolve, 200));
// //         const { valid } = await isAuthenticated();
// //         if (!valid) {
// //           router.push("/login");
// //         } else {
// //           const selectedCourse = searchParams.get("course") || "ML";
// //           setCourse(selectedCourse);
// //           setLoading(false);
// //         }
// //       } catch (error) {
// //         router.push("/login");
// //       }
// //     };

// //     checkAuthentication();
// //   }, [router, searchParams]);

// //   if (loading) {
// //     return (
// //       <div className="flex h-screen w-screen items-center justify-center">
// //         <p className="text-lg text-gray-500">Loading...</p>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div>
// //       <main className="container">
// //         <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mb-10 sm:mt-28 sm:flex-row sm:items-center sm:justify-between">
// //           <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
// //             Course Material
// //             <span className="text-lg font-light sm:text-2xl"> (PDF)</span>
// //           </h1>
// //           <div className="hidden sm:block">
// //             <Layout currentPage="Schedule" />
// //           </div>
// //         </nav>

// //         <CourseNavigation />

// //         <section className="mb-8 flex flex-col justify-start sm:flex-row">
// //           <div className="mt-10 flex justify-center sm:w-1/4">
// //             <div className="flex flex-col">
// //               {buttons.map((button) => (
// //                 <button
// //                   key={button.type}
// //                   className={`mb-1 w-full rounded-md px-4 py-2 font-bold text-black hover:bg-gradient-to-tl hover:from-primary hover:to-blue-300 sm:w-36 ${
// //                     activeComponent === button.type
// //                       ? "border-2 border-blue-600 bg-gradient-to-br from-primary to-blue-400 text-white shadow-lg"
// //                       : "bg-gradient-to-br from-primary to-blue-300"
// //                   }`}
// //                   onClick={() =>
// //                     handleButtonClick(button.type as ComponentType)
// //                   }
// //                 >
// //                   {button.label}
// //                 </button>
// //               ))}
// //             </div>
// //           </div>
// //           <div className="mt-10 flex justify-center sm:-mt-10 sm:w-4/5">
// //             <ResourcesTable course={course} type={activeComponent} />
// //           </div>
// //         </section>
// //       </main>
// //     </div>
// //   );
// // }



// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { isAuthenticated } from "@/utils/auth";
// import Layout from "@/components/Common/Layout";
// import ResourcesTable from "@/components/Common/resourcesTable";
// import CourseNavigation from "@/components/Common/CourseNavigation";

// import {
//   Presentation as PresentationIcon,
//   Youtube,
//   FileText,
//   BookOpen,
//   Network,
//   Cpu,
//   Sparkles,
//   Library,
//   Mail,
//   ClipboardList,
// } from "lucide-react";

// type ComponentType =
//   | "Presentations"
//   | "Must See Youtube Videos"
//   | "Cheatsheets"
//   | "Study Guides"
//   | "Diagrams"
//   | "Softwares"
//   | "Interactive Visual Explainers"
//   | "Newsletters"
//   | "Books"
//   | "Assignments";

// export default function Presentation() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const [course, setCourse] = useState("ML");
//   const [loading, setLoading] = useState(true);
//   const [activeComponent, setActiveComponent] =
//     useState<ComponentType>("Presentations");

//   const buttons = [
//     {
//       type: "Presentations",
//       label: "Presentations",
//       icon: <PresentationIcon size={18} className="text-indigo-600" />,
//     },
//     {
//       type: "Must See Youtube Videos",
//       label: "Must See Youtube Videos",
//       icon: <Youtube size={18} className="text-red-600" />,
//     },
//     {
//       type: "Cheatsheets",
//       label: "Cheatsheets",
//       icon: <FileText size={18} className="text-emerald-600" />,
//     },
//     {
//       type: "Study Guides",
//       label: "Study Guides",
//       icon: <BookOpen size={18} className="text-blue-600" />,
//     },
//     {
//       type: "Diagrams",
//       label: "Diagrams",
//       icon: <Network size={18} className="text-purple-600" />,
//     },
//     {
//       type: "Softwares",
//       label: "Softwares",
//       icon: <Cpu size={18} className="text-orange-600" />,
//     },
//     {
//       type: "Interactive Visual Explainers",
//       label: "VisualIntuition",
//       icon: <Sparkles size={18} className="text-pink-600" />,
//     },
//     {
//       type: "Books",
//       label: "O'Reilly Playlist",
//       icon: <Library size={18} className="text-cyan-600" />,
//     },
//     {
//       type: "Newsletters",
//       label: "Newsletters",
//       icon: <Mail size={18} className="text-teal-600" />,
//     },
//     {
//       type: "Assignments",
//       label: "Assignments",
//       icon: <ClipboardList size={18} className="text-yellow-600" />,
//     },
//   ];

//   const handleButtonClick = (component: ComponentType) => {
//     setActiveComponent(component);
//   };

//   useEffect(() => {
//     router.push(`/presentation?course=ML`);
//   }, [router]);

//   useEffect(() => {
//     const checkAuthentication = async () => {
//       try {
//         await new Promise((resolve) => setTimeout(resolve, 200));
//         const { valid } = await isAuthenticated();
//         if (!valid) {
//           router.push("/login");
//         } else {
//           const selectedCourse = searchParams.get("course") || "ML";
//           setCourse(selectedCourse);
//           setLoading(false);
//         }
//       } catch {
//         router.push("/login");
//       }
//     };

//     checkAuthentication();
//   }, [router, searchParams]);

//   if (loading) {
//     return (
//       <div className="flex h-screen w-screen items-center justify-center">
//         <p className="text-lg text-gray-500">Loading...</p>
//       </div>
//     );
//   }

//   return (
//     <main className="container">
//       <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mb-10 sm:mt-28 sm:flex-row sm:items-center sm:justify-between">
//         <h1 className="text-center text-2xl font-bold sm:text-start sm:text-3xl lg:text-4xl">
//           Course Material
//           <span className="text-lg font-light sm:text-2xl"> (PDF)</span>
//         </h1>
//         <div className="hidden sm:block">
//           <Layout currentPage="Schedule" />
//         </div>
//       </nav>

//       <CourseNavigation />

//       <section className="mb-8 flex flex-col sm:flex-row">
//         {/* SIDEBAR */}
//         <div className="mt-10 flex justify-center sm:w-1/4">
//           <div className="flex flex-col">
//             {buttons.map((button) => (
//               <button
//                 key={button.type}
//                 onClick={() =>
//                   handleButtonClick(button.type as ComponentType)
//                 }
//                 className={`mb-1 w-full rounded-md px-4 font-bold text-black
//                   hover:bg-gradient-to-tl hover:from-primary hover:to-blue-300
//                   sm:w-44
//                   ${
//                     activeComponent === button.type
//                       ? "border-2 border-blue-600 bg-gradient-to-br from-primary to-blue-400 text-white shadow-lg"
//                       : "bg-gradient-to-br from-primary to-blue-300"
//                   }`}
//               >
//                 {/* FIXED HEIGHT CONTAINER */}
//                 <div className="flex h-[56px] items-center gap-2">
//                   {/* FIXED ICON WIDTH */}
//                   <span className="flex w-6 justify-center">
//                     {button.icon}
//                   </span>

//                   {/* TEXT */}
//                   <span className="line-clamp-2 leading-tight">
//                     {button.label}
//                   </span>
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div className="mt-10 flex justify-center sm:-mt-10 sm:w-4/5">
//           <ResourcesTable course={course} type={activeComponent} />
//         </div>
//       </section>
//     </main>
//   );
// }

"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAuthenticated } from "@/utils/auth";
import Layout from "@/components/Common/Layout";
import ResourcesTable from "@/components/Common/resourcesTable";
import CourseNavigation from "@/components/Common/CourseNavigation";

import {
  Presentation,
  Youtube,
  FileText,
  BookOpen,
  Network,
  Sparkles,
  Library,
  Mail,
  Cpu,
  ClipboardList,
} from "lucide-react";

type ComponentType =
  | "Presentations"
  | "Must See Youtube Videos"
  | "Cheatsheets"
  | "Study Guides"
  | "Diagrams"
  | "Interactive Visual Explainers"
  | "Newsletters"
  | "Books"
  | "Softwares"
  | "Assignments";

export default function PresentationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [course, setCourse] = useState("ML");
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] =
    useState<ComponentType>("Presentations");

  const buttons = [
    { type: "Presentations", label: "Presentations", icon: Presentation },
    {
      type: "Must See Youtube Videos",
      label: "Must See Youtube Videos",
      icon: Youtube,
    },
    { type: "Cheatsheets", label: "Cheatsheets", icon: FileText },
    { type: "Study Guides", label: "Study Guides", icon: BookOpen },
    {
      type: "Interactive Visual Explainers",
      label: "Visual Intuition",
      icon: Sparkles,
    },
    { type: "Books", label: "O'Reilly Playlist", icon: Library },
    { type: "Diagrams", label: "Diagrams", icon: Network },
    { type: "Softwares", label: "Softwares", icon: Cpu },
    { type: "Newsletters", label: "Newsletters", icon: Mail },
    { type: "Assignments", label: "Assignments", icon: ClipboardList },
  ];

  const handleButtonClick = (component: ComponentType) => {
    setActiveComponent(component);
  };

  useEffect(() => {
    router.push(`/presentation?course=ML`);
  }, [router]);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const { valid } = await isAuthenticated();
        if (!valid) {
          router.push("/login");
        } else {
          const selectedCourse = searchParams.get("course") || "ML";
          setCourse(selectedCourse);
          setLoading(false);
        }
      } catch {
        router.push("/login");
      }
    };

    checkAuthentication();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <main className="container">
        <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mb-10 sm:mt-28 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
            Course Material
            <span className="text-lg font-light sm:text-2xl"> (PDF)</span>
          </h1>
          <div className="hidden sm:block">
            <Layout currentPage="Schedule" />
          </div>
        </nav>

        <CourseNavigation />

        <section className="mb-8 flex flex-col justify-start sm:flex-row">
          {/* SIDEBAR */}
          <div className="mt-10 flex justify-center sm:w-1/4">
            <div className="flex flex-col">
              {buttons.map(({ type, label, icon: Icon }) => {
                const isActive = activeComponent === type;

                return (
                  <button
                    key={type}
                    onClick={() =>
                      handleButtonClick(type as ComponentType)
                    }
                    className={`mb-1 w-full rounded-md px-4 font-bold text-black
                      hover:bg-gradient-to-tl hover:from-primary hover:to-blue-300
                      sm:w-44
                      ${
                        isActive
                          ? "border-2 border-blue-600 bg-gradient-to-br from-primary to-blue-400 text-white shadow-lg"
                          : "bg-gradient-to-br from-primary to-blue-300"
                      }`}
                  >
                    <div className="flex h-[56px] items-center gap-3">
                      <span className="flex w-6 shrink-0 justify-center">
                        <Icon size={16} />
                      </span>
                      <span className="text-left text-sm leading-tight whitespace-normal break-words">
                        {label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTENT */}
          <div className="mt-10 flex justify-center sm:-mt-10 sm:w-4/5">
            <ResourcesTable course={course} type={activeComponent} />
          </div>
        </section>
      </main>
    </div>
  );
}
