import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import CourseContentTable from "@/components/Common/CourseContentTable";
import { toast } from "sonner";

const CourseContent = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  const fetchCourseContent = useCallback(async () => {
    setLoading(true);

    const token = typeof window !== "undefined"
      ? localStorage.getItem("access_token") || localStorage.getItem("token") || localStorage.getItem("auth_token")
      : null;

    if (!token) {
      toast.error("Please log in to access course content");
    
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      setLoading(false);
      return;
    }

    const base = (process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || "").replace(/\/$/, "");
    const endpointsToTry = ["/course-content", "/course-content?limit=100"];

    const normalize = (data: any) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.results)) return data.results;
      for (const k of Object.keys(data || {})) if (Array.isArray(data[k])) return data[k];
      if (typeof data === "object") return [data];
      return [];
    };

    try {
      for (const ep of endpointsToTry) {
        try {
          const fullUrl = base + (ep.startsWith("/") ? ep : `/${ep}`);
          
          const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'include',
          });

          if (response.status === 403) {
            toast.error("Access forbidden - insufficient permissions");
            continue;
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const normalizedData = normalize(data);
          setSubjects(normalizedData);
          
          if (normalizedData.length > 0) {
            return;
          }
        } catch (err) {
          console.warn(`Failed for endpoint ${ep}:`, err);
          continue;
        }
      }

      toast.error("Unable to load course content. Please check your permissions.");
      
    } catch (err: any) {
      console.error("[fetchCourseContent] unexpected error:", err);
      toast.error(err?.message || "Failed to load course content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourseContent();
  }, [fetchCourseContent]);

 
  if (loading) {
    return (
      <div className="text-md mt-32 mb-4 flex justify-center text-center font-medium text-black dark:text-white sm:text-2xl">
        Loading&nbsp;
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[50px] sm:w-[50px]"
        >
          <circle cx="4" cy="12" r="3" fill="currentColor">
            <animate attributeName="r" begin="0;svgSpinners3DotsScale1.end-0.2s" dur="0.6s" values="3;.2;3" />
          </circle>
          <circle cx="12" cy="12" r="3" fill="currentColor">
            <animate attributeName="r" begin="svgSpinners3DotsScale0.end-0.48s" dur="0.6s" values="3;.2;3" />
          </circle>
          <circle cx="20" cy="12" r="3" fill="currentColor">
            <animate attributeName="r" begin="svgSpinners3DotsScale0.end-0.36s" dur="0.6s" values="3;.2;3" />
          </circle>
        </svg>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <CourseContentTable subjects={subjects} />
    </div>
  );
};

export default CourseContent;