import React, { useState, useEffect } from "react";

// TypeScript Interface for Assignment data
interface Assignment {
  id: string | number;
  name: string;
  link: string | null;
}

const fetchAssignmentsData = async (
  course: string
): Promise<Assignment[] | null> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/materials?course=${course}&search=Assignments`
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
};

const Assignments = ({ course }: { course: string }) => {
  const [data, setData] = useState<Assignment[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [clickError, setClickError] = useState<string | null>(null);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      setError(null);

      const sessionData = sessionStorage.getItem(`data_${course}_Assignments`);
      const sessionDataTimestamp = sessionStorage.getItem(
        `data_${course}_Assignments_timestamp`
      );
      const dataAge =
        Date.now() -
        (sessionDataTimestamp ? parseInt(sessionDataTimestamp, 10) : 0);

      if (sessionData && dataAge < 86400000) {
        setData(JSON.parse(sessionData));
      } else {
        const fetchedData = await fetchAssignmentsData(course);

        if (fetchedData) {
          setData(fetchedData);
          sessionStorage.setItem(
            `data_${course}_Assignments`,
            JSON.stringify(fetchedData)
          );
          sessionStorage.setItem(
            `data_${course}_Assignments_timestamp`,
            Date.now().toString()
          );
        } else {
          setError("No data found");
        }
      }

      setLoading(false);
    };
    getData();
  }, [course]);

  const handleSubjectClick = (link: string | null, assignmentName: string) => {
    if (!link) {
      setClickError("Oops !! No data found");
      setTimeout(() => setClickError(null), 3000); // Clear message after 3 seconds
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="overflow-x-auto sm:w-4/5">
        <table className="w-full table-auto border-collapse border border-gray-500 shadow-2xl shadow-gray-800">
          <thead>
            <tr>
              <th className="mb-1 w-1/4 border border-gray-500 bg-primary px-4 py-2 text-xl text-blue-300 sm:w-1/6 md:w-1/6 lg:w-1/4">
                <div className="mx-auto h-6 w-24 animate-pulse rounded bg-blue-200"></div>
              </th>
              <th className="mb-1 w-3/4 border border-gray-500 bg-primary px-4 py-2 text-xl text-blue-300 sm:w-5/6 md:w-5/6 lg:w-3/4">
                <div className="mx-auto h-6 w-32 animate-pulse rounded bg-blue-200"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((index) => (
              <tr
                key={index}
                className={`${
                  index % 2 === 0
                    ? "bg-gray-100 dark:bg-transparent"
                    : "bg-gray-200 dark:bg-transparent"
                }`}
              >
                <td className="border border-primary px-4 py-2 text-center dark:border-blue-900">
                  <div className="mx-auto h-5 w-8 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                </td>
                <td className="border border-primary px-4 py-2 text-center dark:border-blue-900">
                  <div className="mx-auto h-5 w-3/4 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-x-auto sm:w-4/5">
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-8 text-center dark:bg-red-900/20">
          <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="overflow-x-auto sm:w-4/5">
        <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No assignments to display
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto sm:w-4/5">
      {clickError && (
        <div
          className="mb-4 rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-center text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-400"
          role="alert"
          aria-live="assertive"
        >
          {clickError}
        </div>
      )}
      <table className="w-full table-auto border-collapse border border-gray-500 shadow-2xl shadow-gray-800">
        <thead>
          <tr>
            <th
              className="mb-1 w-1/4 border border-gray-500 bg-primary px-4 py-2 text-xl text-blue-300 sm:w-1/6 md:w-1/6 lg:w-1/4"
              scope="col"
            >
              Serial No.
            </th>
            <th
              className="mb-1 w-3/4 border border-gray-500 bg-primary px-4 py-2 text-xl text-blue-300 sm:w-5/6 md:w-5/6 lg:w-3/4"
              scope="col"
            >
              Assignment
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((assignment, index) => (
            <tr
              key={assignment.id || index}
              className={`transition-colors duration-150 hover:bg-gray-200 dark:hover:bg-blue-500 ${
                index % 2 === 0
                  ? "bg-gray-100 dark:bg-transparent"
                  : "bg-gray-200 dark:bg-transparent"
              }`}
            >
              <td className="border border-primary px-4 py-2 text-center text-black dark:border-blue-900 dark:text-white">
                {index + 1}
              </td>
              <td className="border border-primary px-4 py-2 text-center text-blue-600 dark:border-blue-900 dark:text-white">
                <button
                  onClick={() =>
                    handleSubjectClick(assignment.link, assignment.name)
                  }

                  className="w-full text-blue-600 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
                  aria-label={`Open ${assignment.name} in new tab`}
                  disabled={!assignment.link}
                  type="button"
                >
                  {assignment.name}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Assignments;
