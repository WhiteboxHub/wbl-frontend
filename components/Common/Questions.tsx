import React from "react";

const data = [
  {
    id: 1,
    name: "Top Interview Questions",
    link:
      "https://drive.google.com/file/d/1MmIUaKiECdLpi4ZeSPWzO-rICTwJBaUI/view?usp=sharing",
  },
];

const QuestionsTable = () => {
  return (
    <div className="overflow-x-auto sm:w-4/5">
      <table className="w-full table-auto border-collapse border border-gray-500 shadow-2xl shadow-gray-800">
        <thead>
          <tr>
            <th className="mb-1 w-1/4 border border-gray-500  bg-primary px-4 py-2 text-xl text-blue-300 sm:w-1/6 md:w-1/6 lg:w-1/4">
              Serial No.
            </th>
            <th className="mb-1 w-3/4 border border-gray-500 bg-primary px-4 py-2 text-xl text-blue-300 sm:w-5/6 md:w-5/6 lg:w-3/4">
              Subject Name
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((subject, index) => (
            <tr
              key={subject.id}
              className={`hover:bg-gray-200 dark:hover:bg-blue-500  ${
                index % 2 === 0
                  ? "bg-gray-100 dark:bg-transparent"
                  : "bg-gray-200 dark:bg-transparent"
              }`}
            >
              <td className="border border-primary px-4 py-2    text-center text-black dark:border-blue-900 dark:text-white">
                {index + 1}
              </td>
              <td className="border border-primary px-4 py-2   text-center text-blue-600 dark:border-blue-900 dark:text-white">
                <a href={subject.link} target="_blank" rel="noreferrer">
                  {subject.name}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuestionsTable;