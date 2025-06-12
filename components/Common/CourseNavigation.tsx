import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const CourseNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Machine Learning");
  const router = useRouter();
  const path = usePathname();

  


  const courseOptions = [
    { short: "ML", full: "Machine Learning" },
    { short: "UI", full: "UI Fullstack" },
    { short: "QA", full: "Quality Engineer" },
  ];
 
  
  // useEffect(() => {
  //   // Check if a course is already stored in session storage
  //   const storedCourse = sessionStorage.getItem('courseShortName');
  //   if (!storedCourse) {
  //     // Store default course short name in session storage on component mount
  //     sessionStorage.setItem('courseShortName', 'ML');
  //   } else {
  //     // Set the selected option to the stored course
  //     const selectedCourse = courseOptions.find((opt) => opt.short === storedCourse);
  //     if (selectedCourse) {
  //       setSelectedOption(selectedCourse.full);
  //     }
  //   }
  // }, []);

  const handleNavigation = (course: string) => {
    const selectedCourse = courseOptions.find((opt) => opt.short === course);
    setSelectedOption(selectedCourse.full);
    setIsOpen(false); // Close the dropdown after selection
    // Store course short name in session storage
    // sessionStorage.setItem('courseShortName', course);
    router.push(`${path}?course=${course}`);
  };

  return (
    <div className="flex justify-center sm:w-1/4">
      <div className="flex flex-col items-center">
        {/* "Select Course" Text */}
        <div className="mb-3 text-center text-lg font-semibold lg:text-xl xl:sm:text-[28px] ">
          Please select a Course
        </div>
        <div className="relative ">
          <button
            className="flex items-center justify-between rounded-md bg-gradient-to-br from-primary to-blue-300 px-4 py-2 font-bold text-black hover:bg-gradient-to-tl hover:from-primary hover:to-blue-300 sm:w-52 "
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedOption}
            <span className="pl-3">
              <svg width="15" height="14" viewBox="0 0 15 14">
                <path
                  d="M7.81602 9.97495C7.68477 9.97495 7.57539 9.9312 7.46602 9.8437L2.43477 4.89995C2.23789 4.70308 2.23789 4.39683 2.43477 4.19995C2.63164 4.00308 2.93789 4.00308 3.13477 4.19995L7.81602 8.77183L12.4973 4.1562C12.6941 3.95933 13.0004 3.95933 13.1973 4.1562C13.3941 4.35308 13.3941 4.65933 13.1973 4.8562L8.16601 9.79995C8.05664 9.90933 7.94727 9.97495 7.81602 9.97495Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </button>
          {isOpen && (
            <div className="absolute z-10 mt-2 rounded-md bg-white shadow-lg sm:w-44">
              {courseOptions.map((option) => (
                <button
                  key={option.short}
                  className="block w-full px-4 py-2 text-left text-black hover:bg-blue-100"
                  onClick={() => handleNavigation(option.short)}
                >
                  {option.full}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseNavigation;
