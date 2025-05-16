import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseContentTable from "@/components/Common/CourseContentTable";

const CourseContent = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/coursecontent`
        );
        setSubjects(response.data.coursecontent);
      } catch (error) {
        //console.error("Error fetching course content:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

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
    );
  }

  return (
    <>
      {/* <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"> */}
      <div className="container mx-auto">
        <CourseContentTable subjects={subjects} />
      </div>
    </>
  );
};

export default CourseContent;
