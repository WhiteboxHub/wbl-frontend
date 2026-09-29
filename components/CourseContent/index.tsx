import React, { useEffect, useState, useCallback } from "react";
import { getCourseContentData } from "@/lib/api";
import CourseContentTable from "@/components/Common/CourseContentTable";
import { toast } from "sonner";

const CourseContent = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  const fetchCourseContent = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getCourseContentData();
      setSubjects(data);
    } catch (err: any) {
      if (err.message === "unauthorized") {
        toast.error("Please log in to access course content");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;
      }
      console.error("[fetchCourseContent] unexpected error:", err);
      toast.error(err?.message || "Failed to load course content");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setSubjects]);

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