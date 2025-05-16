import React from "react";

const CourseContentTable = (props: any) => {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full table-auto border-collapse border border-gray-500 shadow-2xl shadow-gray-800">
        <thead>
          <tr className="text-md sm:text-lg lg:text-xl">
            <th className="mb-1 w-1/4 border border-gray-500 bg-primary px-4 py-2 text-white">
              Fundamentals
            </th>
            <th className="mb-1 w-1/4 border border-gray-500 bg-primary px-4 py-2 text-white">
              AIML (Artificial Intelligence & Machine Learning)
            </th>
            <th className="mb-1 w-1/4 border border-gray-500 bg-primary px-4 py-2 text-white">
              Fullstack Development
            </th>
            <th className="mb-1 w-1/4 border border-gray-500 bg-primary px-4 py-2 text-white">
              Quality Engineering
            </th>
          </tr>
        </thead>
        <tbody>
          {props.subjects.map((subject: any, index: any) => (
            <tr
              key={subject.id}
              className={`text-[11px] hover:bg-gray-200 dark:hover:bg-blue-500 sm:text-base lg:text-lg ${
                index % 2 === 0
                  ? "bg-gray-100 dark:bg-transparent"
                  : "bg-gray-200 dark:bg-transparent"
              }`} // Alternate row colors
            >
              <td className="border border-primary px-4 py-2 text-center text-black dark:border-blue-900 dark:text-white">
                <p>{subject.Fundamentals}</p>
              </td>
              <td className="border border-primary px-4 py-2 text-center text-black dark:border-blue-900 dark:text-white">
                <p>{subject.AIML}</p>
              </td>
              <td className="border border-primary px-4 py-2 text-center text-black dark:border-blue-900 dark:text-white">
                <p>{subject.UI}</p>
              </td>
              <td className="border border-primary px-4 py-2 text-center text-black dark:border-blue-900 dark:text-white">
                <p>{subject.QE}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseContentTable;
