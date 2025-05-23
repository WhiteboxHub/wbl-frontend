"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Common/Layout";
import ClassComp from "@/components/Recording/ClassComp";
import SearchComp from "@/components/Recording/SearchComp";
import SessionComp from "@/components/Recording/SessionComp";
import CourseNavigation from "@/components/Common/CourseNavigation";

type ComponentType = "class" | "search" | "session";

export default function RecordingsClient() {
  const [activeComponent, setActiveComponent] = useState<ComponentType>("class");

  const handleTabClick = (component: ComponentType) => {
    setActiveComponent(component);
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "class":
        return <ClassComp />;
      case "search":
        return <SearchComp />;
      case "session":
        return <SessionComp />;
      default:
        return null;
    }
  };

  return (
    <main className="container ">
      <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mt-28 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
          Recording <span className="text-lg font-light sm:text-2xl">(Classes)</span>
        </h1>
        <div className="hidden sm:block">
          <Layout currentPage="Recordings" />
        </div>
      </nav>
      <section className="mb-8 min-h-[500px]">
        <div className="flex flex-col items-center justify-around sm:flex-row md:justify-between">
          <CourseNavigation />
          <div className="mt-5 flex h-1/2 justify-center sm:mt-0 lg:w-1/2">
            <div className="text-md sm:text-md flex justify-center border-gray-200 dark:text-blue-500 lg:text-xl">
              <nav className="flex gap-5">
                {["class", "search", "session"].map((component) => (
                  <button
                    key={component}
                    className={`${
                      activeComponent === component
                        ? "bg-slate-300 text-indigo-700 dark:bg-slate-700 dark:text-primary"
                        : "bg-transparent text-gray-800 hover:bg-slate-100 hover:text-blue-600 dark:bg-transparent dark:text-white dark:hover:bg-blue-800"
                    } rounded-2xl border-2 border-gray-300 px-4 py-2 font-medium transition-colors duration-100 dark:border-gray-600`}
                    onClick={() => handleTabClick(component as ComponentType)}
                  >
                    {component.charAt(0).toUpperCase() + component.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <div className="mt-6">{renderComponent()}</div>
      </section>
    </main>
  );
}
