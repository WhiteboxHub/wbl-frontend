// import React, { useState, useEffect } from "react";

// type ComponentType =
//   | "Presentations"
//   | "Cheatsheets"
//   | "Diagrams"
//   | "Installations"
//   | "Newsletters"
//   | "Books"
//   | "Softwares";

// const fetchPresentationData = async (course: string, type: ComponentType) => {
//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/materials?course=${course}&search=${type}`
//     );

//     if (!response.ok) {
//       throw new Error("Network response was not ok");
//     }
//     const data = await response.json();
//     console.log(data);
    
//     return data;
//   } catch (error) {
//     console.error("Failed to fetch data:", error);
//     return null;
//   }
// };

// const ResourcesTable = ({
//   course,
//   type,
// }: {
//   course: string;
//   type: ComponentType;
// }) => {
//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const getData = async () => {
//       setLoading(true);
//       setError(null);

//       const sessionData = sessionStorage.getItem(`data_${course}_${type}`);
//       const sessionDataTimestamp = sessionStorage.getItem(
//         `data_${course}_${type}_timestamp`
//       );
//       const dataAge =
//         Date.now() -
//         (sessionDataTimestamp ? parseInt(sessionDataTimestamp, 10) : 0);

//       if (sessionData && dataAge < 86400000) {
//         setData(JSON.parse(sessionData));
//       } else {
//         const fetchedData = await fetchPresentationData(course, type);

//         if (fetchedData) {
//           setData(fetchedData);
//           sessionStorage.setItem(
//             `data_${course}_${type}`,
//             JSON.stringify(fetchedData)
//           );
//           sessionStorage.setItem(
//             `data_${course}_${type}_timestamp`,
//             Date.now().toString()
//           );
//         } else {
//           setError("No data found");
//         }
//       }

//       setLoading(false);
//     };
//     getData();
//   }, [course, type]);

//   if (loading) {
//     return (
//       <div className="text-md mb-4 text-center font-medium text-black dark:text-white sm:text-2xl">
//         Loading&nbsp;
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           viewBox="0 0 24 24"
//           className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[50px] sm:w-[50px]"
//         >
//           <circle cx="4" cy="12" r="3" fill="currentColor">
//             <animate
//               id="svgSpinners3DotsScale0"
//               attributeName="r"
//               begin="0;svgSpinners3DotsScale1.end-0.2s"
//               dur="0.6s"
//               values="3;.2;3"
//             />
//           </circle>
//           <circle cx="12" cy="12" r="3" fill="currentColor">
//             <animate
//               attributeName="r"
//               begin="svgSpinners3DotsScale0.end-0.48s"
//               dur="0.6s"
//               values="3;.2;3"
//             />
//           </circle>
//           <circle cx="20" cy="12" r="3" fill="currentColor">
//             <animate
//               id="svgSpinners3DotsScale1"
//               attributeName="r"
//               begin="svgSpinners3DotsScale0.end-0.36s"
//               dur="0.6s"
//               values="3;.2;3"
//             />
//           </circle>
//         </svg>
//       </div>
//     );
//   }

//   if (error) {
//     return <p>{error}</p>;
//   }

//   if (!data) {
//     return <p>No data to display</p>;
//   }

//   return (
//     <div className="overflow-x-auto sm:w-4/5">
//       <table className="w-full table-auto border-collapse border border-gray-500 shadow-2xl shadow-gray-800">
//         <thead>
//           <tr>
//             <th className="mb-1 w-1/4 border border-gray-500  bg-primary px-4 py-2 text-xl text-blue-300 sm:w-1/6 md:w-1/6 lg:w-1/4">
//               Serial No.
//             </th>
//             <th className="mb-1 w-3/4 border border-gray-500 bg-primary px-4 py-2 text-xl text-blue-300 sm:w-5/6 md:w-5/6 lg:w-3/4">
//               Subject Name
//             </th>
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((subject: any, index: any) => {
//             return (
//               <tr
//                 key={subject.id}
//                 className={`hover:bg-gray-200 dark:hover:bg-blue-500  ${
//                   index % 2 === 0
//                     ? "bg-gray-100 dark:bg-transparent"
//                     : "bg-gray-200 dark:bg-transparent"
//                 }`}
//               >
//                 <td className="border border-primary px-4 py-2    text-center text-black dark:border-blue-900 dark:text-white">
//                   {index + 1}
//                 </td>
//                 <td className="border border-primary px-4 py-2   text-center text-blue-600 dark:border-blue-900 dark:text-white">
//                   <a href={subject.link} target="_blank" rel="noreferrer">
//                     {" "}
//                     {type === "Newsletters" ? (
//                       <span
//                         dangerouslySetInnerHTML={{ __html: subject.name }}
//                       />
//                     ) : (
//                       subject.name
//                     )}
//                   </a>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default ResourcesTable;


import React, { useState, useEffect } from "react";

type ComponentType =
  | "Presentations"
  | "Cheatsheets"
  | "Diagrams"
  | "Installations"
  | "Newsletters"
  | "Books"
  | "Softwares";

const fetchPresentationData = async (course: string, type: ComponentType) => {
  // console.log("*********************************************************",course,type);
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/materials?course=${course}&search=${type}`
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    // console.log(data);
    
    return data;
  } catch (error) {
    // console.error("Failed to fetch data:", error);
    return null;
  }
};

const ResourcesTable = ({
  course,
  type,
}: {
  course: string;
  type: ComponentType;
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [clickError, setClickError] = useState<string | null>(null);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      setError(null);

      const sessionData = sessionStorage.getItem(`data_${course}_${type}`);

      // console.log("*********************************************************",sessionData);
      
      const sessionDataTimestamp = sessionStorage.getItem(
        `data_${course}_${type}_timestamp`
      );
      const dataAge =
        Date.now() -
        (sessionDataTimestamp ? parseInt(sessionDataTimestamp, 10) : 0);

      if (sessionData && dataAge < 86400000) {
        setData(JSON.parse(sessionData));
      } else {
        const fetchedData = await fetchPresentationData(course, type);

        if (fetchedData) {
          setData(fetchedData);
          sessionStorage.setItem(
            `data_${course}_${type}`,
            JSON.stringify(fetchedData)
          );
          sessionStorage.setItem(
            `data_${course}_${type}_timestamp`,
            Date.now().toString()
          );
        } else {
          setError("No data found");
        }
      }

      setLoading(false);
    };
    getData();
  }, [course, type]);

  const handleSubjectClick = (link: string | null) => {
    if (!link) {
      setClickError("Oops !! No data found");
      setTimeout(() => setClickError(null), 3000); // Clear message after 3 seconds
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.open(link, "_blank");
  };

  if (loading) {
    return (
      <div className="text-md mb-4 text-center font-medium text-black dark:text-white sm:text-2xl">
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

  if (error) {
    return <p>{error}</p>;
  }

  if (!data) {
    return <p>No data to display</p>;
  }

  return (
    <div className="overflow-x-auto sm:w-4/5">
      {clickError && (
        <p className="mb-4 text-center text-red-600">{clickError}</p>
      )}
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
          {data.map((subject: any, index: any) => {
            return (
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
                  <button
                    onClick={() => handleSubjectClick(subject.link)}
                    className="text-blue-600  dark:text-white"
                  >
                    {type === "Newsletters" ? (
                      <span
                        dangerouslySetInnerHTML={{ __html: subject.name }}
                      />
                    ) : (
                      subject.name
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResourcesTable;
