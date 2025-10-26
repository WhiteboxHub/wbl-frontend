
// export default CourseContent;
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { apiFetch, API_BASE_URL } from "@/lib/api"; // adjust import if needed
import CourseContentTable from "@/components/Common/CourseContentTable";
import { toast } from "sonner";

const CourseContent = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  const fetchCourseContent = useCallback(async () => {
    setLoading(true);

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
      // 1) Try apiFetch first
      if (typeof apiFetch === "function") {
        for (const ep of endpointsToTry) {
          try {
            const body = await apiFetch(ep, { credentials: "include", useCookies: true });
            setSubjects(normalize(body));
            return;
          } catch (err) {
            console.warn("[fetchCourseContent] apiFetch failed for", ep, err);
          }
        }
      }

      // 2) Fallback to Axios with token
      for (const ep of endpointsToTry) {
        try {
          const fullUrl = base + (ep.startsWith("/") ? ep : `/${ep}`);
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("access_token") || localStorage.getItem("token") || localStorage.getItem("auth_token")
              : null;

          const headers: any = { Accept: "application/json" };
          if (token) headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

          const res = await axios.get(fullUrl, { headers, withCredentials: true });
          setSubjects(normalize(res.data));
          return;
        } catch (err: any) {
          console.warn("[fetchCourseContent] Axios failed for", ep, err?.response?.status ?? err?.message ?? err);
        }
      }

      toast.error("Failed to load course content — check console/network for details.");
    } catch (err: any) {
      console.error("[fetchCourseContent] unexpected", err);
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
