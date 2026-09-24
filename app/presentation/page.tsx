"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/utils/AuthContext";
import Layout from "@/components/Common/Layout";
import ResourcesTable from "@/components/Common/resourcesTable";
import CourseNavigation from "@/components/Common/CourseNavigation";

import {
  Presentation,
  Youtube,
  FileText,
  BookOpen,
  Sparkles,
  Library,
  Mail,
  ClipboardList,
  Github,
} from "lucide-react";

type ComponentType =
  | "Presentations"
  | "Must Watch"
  | "Cheatsheets"
  | "Study Guides"
  | "Interactive Visual Explainers"
  | "Newsletters"
  | "Books"
  | "Questions"
  | "Git Repo's";

export default function PresentationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use the project-wide auth context instead of a one-off isAuthenticated()
  // call so we reuse the same auth state as the rest of the application.
  // Unauthenticated users are intentionally NOT redirected — they may browse
  // the catalogue; actual material links are withheld by the backend and the
  // click handler in ResourcesTable will prompt them to log in.
  const { isAuthenticated, authToken } = useAuth();

  const [course, setCourse] = useState("ML");
  const [mounted, setMounted] = useState(false);
  const [activeComponent, setActiveComponent] =
    useState<ComponentType>("Presentations");

  const buttons = [
    { type: "Presentations", label: "Presentations", icon: Presentation },
    { type: "Questions", label: "Questions", icon: ClipboardList },
    { type: "Study Guides", label: "Study Guides", icon: BookOpen },
    { type: "Cheatsheets", label: "Cheatsheets", icon: FileText },
    { type: "Books", label: "O'Reilly Books", icon: Library },
    { type: "Must Watch", label: "Must Watch", icon: Youtube },
    { type: "Newsletters", label: "Newsletters", icon: Mail },
    {
      type: "Interactive Visual Explainers",
      label: "Visual Intuition",
      icon: Sparkles,
    },
    { type: "Git Repo's", label: "Git Repo's", icon: Github },
  ];

  const handleButtonClick = (component: ComponentType) => {
    setActiveComponent(component);
  };

  // Read the course from the URL on mount. Only redirect if an explicitly
  // invalid course (QA/UI) is present — do NOT push ML unconditionally on
  // every render, as that caused cascading re-renders and multiple simultaneous
  // API fetches for every material type.
  useEffect(() => {
    setMounted(true);
    let selectedCourse = searchParams.get("course") || "ML";
    if (
      selectedCourse.toUpperCase() === "UI" ||
      selectedCourse.toUpperCase() === "QA"
    ) {
      selectedCourse = "ML";
      router.replace("/presentation?course=ML");
    } else if (!searchParams.get("course")) {
      router.replace("/presentation?course=ML");
    }
    setCourse(selectedCourse);
  }, [router, searchParams]);


  // Show a brief loading screen until the component has mounted on the client
  // (prevents hydration mismatch and a flash of incorrect content).
  if (!mounted) {
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
                      ${isActive
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
            <ResourcesTable
              course={course}
              type={activeComponent}
              authToken={authToken}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
