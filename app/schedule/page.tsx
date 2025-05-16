"use client";
import React, { useState } from "react";
import Layout from "@/components/Common/Layout";
import Calendar from "@/components/Calendar";
import CourseContent from "@/components/CourseContent";

type ComponentType = "calendar" | "courseContent";

export default function Schedule() {
  const [activeComponent, setActiveComponent] = useState<ComponentType>("calendar");

  const handleButtonClick = (component: ComponentType) => {
    setActiveComponent(component);
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "calendar":
        return <Calendar />;
      case "courseContent":
        return <CourseContent />;
      default:
        return null;
    }
  };

  return (
    <div>
      <main className="container px-4 pb-6 sm:px-6">
        <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mt-28 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
            Schedule
          </h1>
          <div className="hidden sm:block">
            <Layout currentPage="Schedule" />
          </div>
        </nav>

        <section className="mb-8 flex flex-col sm:flex-row sm:justify-between">
          <div className="flex flex-row justify-center gap-5 sm:w-1/6 sm:flex-col sm:justify-start sm:gap-0">
            <button
              className={`mb-2 w-2/5 rounded-md px-4 py-2 text-sm font-bold text-black hover:bg-gradient-to-tl hover:from-primary hover:to-blue-300 sm:w-full sm:text-base lg:text-lg ${
                activeComponent === "calendar"
                  ? "bg-gradient-to-br from-primary to-blue-400 text-white border-2 border-blue-600 shadow-lg"
                  : "bg-gradient-to-br from-primary to-blue-300"
              }`}
              onClick={() => handleButtonClick("calendar")}
            >
              Calendar
            </button>
            <button
              className={`mb-2 w-2/5 rounded-md px-3 py-2 text-sm font-bold text-black hover:bg-gradient-to-tl hover:from-primary hover:to-blue-300 sm:w-full sm:text-base lg:text-lg ${
                activeComponent === "courseContent"
                  ? "bg-gradient-to-br from-primary to-blue-400 text-white border-2 border-blue-600 shadow-lg"
                  : "bg-gradient-to-br from-primary to-blue-300"
              }`}
              onClick={() => handleButtonClick("courseContent")}
            >
              Course Content
            </button>
          </div>

          <div className="mt-6 flex-grow space-y-4 sm:mt-0 sm:ml-6">
            {renderComponent()}
          </div>
        </section>
      </main>
    </div>
  );
}
