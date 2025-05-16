

// // *****************old code**************


// import React, { useState, useEffect } from "react";

// type Session = {
//   sessionid: number;
//   title: string;
//   type: string;
//   link: string; // Ensure this matches the database structure
// };

// type SessionResponse = {
//   sessions: Session[];
// };

// export default function SessionComp() {
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [selectedType, setSelectedType] = useState<string>("");
//   const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
//   const [selectedSession, setSelectedSession] = useState<Session | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const sessionsDataFromStorage = sessionStorage.getItem("sessions_data");
//     const sessionsDataTimestamp = sessionStorage.getItem(
//       "sessions_data_timestamp"
//     );
//     const dataAge =
//       Date.now() -
//       (sessionsDataTimestamp ? parseInt(sessionsDataTimestamp, 10) : 0);

//     if (sessionsDataFromStorage && dataAge < 86400000) {
//       // Data is valid for 24 hours
//       const parsedSessions = JSON.parse(sessionsDataFromStorage);
//       setSessions(parsedSessions);
//       setIsLoading(false);
//     } else {
//       fetchSessions();
//     }
//   }, []);

//   useEffect(() => {
//     if (selectedType) {
//       setFilteredSessions(
//         sessions.filter((session) => session.type === selectedType)
//       );
//     } else {
//       setFilteredSessions([]);
//     }
//   }, [selectedType, sessions]);

//   const fetchSessions = async () => {
//     try {
//       setIsLoading(true);
//       const accessToken = localStorage.getItem("access_token");
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/sessions`,
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to fetch sessions");
//       }

//       const data: SessionResponse = await response.json();
//       setSessions(data.sessions);
//       sessionStorage.setItem("sessions_data", JSON.stringify(data.sessions));
//       sessionStorage.setItem("sessions_data_timestamp", Date.now().toString());
//       setError(null);
//     } catch (error) {
//       console.error("Error fetching sessions:", error);
//       setError("Failed to load sessions. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedType(e.target.value);
//     setSelectedSession(null); // Reset the selected session when type changes
//   };

//   const handleSessionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const sessionId = parseInt(e.target.value);
//     const selected = sessions.find(
//       (session) => session.sessionid === sessionId
//     );
//     setSelectedSession(selected || null);
//   };

//   const renderVideoPlayer = (session: Session) => {
//     if (
//       session.link.includes("youtu.be") ||
//       session.link.includes("youtube.com")
//     ) {
//       const youtubeId = session.link.split("/").pop();
//       const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`;
//       return (
//         <iframe
//           width="100%"
//           height="350"
//           src={youtubeEmbedUrl}
//           title={session.title}
//           frameBorder="0"
//           allowFullScreen
//           className="h-[350px] rounded-xl border-2 border-gray-500"
//         ></iframe>
//       );
//     } else {
//       return <video src={session.link} controls className="mb-2 w-full" />;
//     }
//   };

//   if (isLoading) {
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

//   return (
//     <div className="mx-auto mt-6 max-w-full flex-grow space-y-4 sm:mt-0 sm:max-w-3xl">
//       <div className="flex flex-grow flex-col">
//         <label htmlFor="dropdown1">Session Type:</label>
//         <select
//           id="dropdown1"
//           className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
//           value={selectedType}
//           onChange={handleTypeChange}
//         >
//           <option value="" disabled>
//             Please select a session type...
//           </option>
//           {Array.from(new Set(sessions.map((session) => session.type))).map(
//             (type) =>
//               type && (
//                 <option key={type} value={type}>
//                   {type}
//                 </option>
//               )
//           )}
//         </select>
//       </div>
//       <div className="flex flex-grow flex-col">
//         <label htmlFor="dropdown2">Session Name:</label>
//         <select
//           id="dropdown2"
//           className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
//           value={selectedSession ? selectedSession.sessionid.toString() : ""}
//           onChange={handleSessionSelect}
//           disabled={!selectedType || filteredSessions.length === 0}
//         >
//           <option value="" disabled>
//             Please select a session name...
//           </option>
//           {filteredSessions.map((session) => (
//             <option key={session.sessionid} value={String(session.sessionid)}>
//               {session.title}
//             </option>
//           ))}
//         </select>
//       </div>
//       {error && <p className="text-red-500">{error}</p>}
//       {selectedSession && <div>{renderVideoPlayer(selectedSession)}</div>}
//     </div>
//   );
// }




// import React, { useState, useEffect } from "react";
// import { useSearchParams } from "next/navigation";

// type Session = {
//   sessionid: number;
//   title: string;
//   type: string;
//   link: string;
// };

// type SessionResponse = {
//   sessions: Session[];
// };

// type TypeResponse = {
//   types: string[];
// };

// export default function SessionComp() {
//   const searchParams = useSearchParams();
//   const course = searchParams.get("course"); // Get course from URL params

//   const [types, setTypes] = useState<string[]>([]);
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [selectedType, setSelectedType] = useState<string>("");
//   const [selectedSession, setSelectedSession] = useState<Session | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchTypes();
//   }, []);

//   useEffect(() => {
//     if (selectedType) {
//       fetchSessions();
//     } else {
//       setSessions([]);
//       setSelectedSession(null);
//     }
//   }, [selectedType]);

//   const fetchTypes = async () => {
//     try {
//       setIsLoading(true);
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/types`);
//       if (!response.ok) {
//         throw new Error("Failed to fetch types");
//       }
//       const data: TypeResponse = await response.json();
//       // Map over the array of objects and extract the 'type' field to set as an array of strings
//       setTypes(data.types.map((typeObj) => typeObj.type)); 
//       setError(null);
//       console.log("Fetched types:", data.types); // Debug log
//     } catch (error) {
//       console.error("Error fetching types:", error);
//       setError("Failed to load types. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
  

//   const fetchSessions = async () => {
//     try {
//       setIsLoading(true);
//       const accessToken = localStorage.getItem("access_token");
  
//       // Map the course name to the course_id
//       const courseMapping = {
//         "QA": 1,
//         "UI": 2,
//         "ML": 3,
//       };
  
//       // Get the course_id from the courseMapping
//       const courseId = courseMapping[course];  // 'course' is the selected course name
  
//       if (!courseId) {
//         throw new Error("Invalid course name");
//       }
  
//       // Construct the URL with course_id and selectedType
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/sessions?course_id=${courseId}&type=${selectedType}`,
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );
  
//       if (!response.ok) {
//         throw new Error("Failed to fetch sessions");
//       }
  
//       const data: SessionResponse = await response.json();
//       setSessions(data.sessions);
//       setError(null);
//       console.log("Fetched sessions:", data.sessions); // Debug log
//     } catch (error) {
//       //console.error("Error fetching sessions:", error);
//       setError("Failed to load sessions. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedType(e.target.value);
//     setSelectedSession(null); // Reset the selected session when type changes
//   };

//   const handleSessionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const sessionId = parseInt(e.target.value);
//     const selected = sessions.find((session) => session.sessionid === sessionId);
//     setSelectedSession(selected || null);
//     console.log("Selected session:", selected); // Debug log
//   };

//   const renderVideoPlayer = (session: Session) => {
//     if (session.link.includes("youtu.be") || session.link.includes("youtube.com")) {
//       const youtubeId = session.link.split("/").pop();
//       const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`;
//       return (
//         <iframe
//           width="100%"
//           height="350"
//           src={youtubeEmbedUrl}
//           title={session.title}
//           frameBorder="0"
//           allowFullScreen
//           className="h-[350px] rounded-xl border-2 border-gray-500"
//         ></iframe>
//       );
//     } else {
//       return <video src={session.link} controls className="mb-2 w-full" />;
//     }
//   };

//   if (isLoading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="mx-auto mt-6 max-w-full flex-grow space-y-4 sm:mt-0 sm:max-w-3xl">
//       <div className="flex flex-grow flex-col">
//         <label htmlFor="typeDropdown">Session Type:</label>
//         <select
//           id="typeDropdown"
//           className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
//           value={selectedType}
//           onChange={handleTypeChange}
//         >
//           <option value="" disabled>
//             Please select a session type...
//           </option>
//           {types.map((type) => (
//   <option key={type} value={type}>
//     {type}
//   </option>
// ))}

//         </select>
//       </div>
//       <div className="flex flex-grow flex-col">
//         <label htmlFor="sessionDropdown">Session Name:</label>
//         <select
//           id="sessionDropdown"
//           className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
//           value={selectedSession ? selectedSession.sessionid.toString() : ""}
//           onChange={handleSessionSelect}
//           disabled={!selectedType || sessions.length === 0}
//         >
//           <option value="" disabled>
//             Please select a session name...
//           </option>
//           {sessions.map((session) => (
//             <option key={session.sessionid} value={String(session.sessionid)}>
//               {session.title}
//             </option>
//           ))}
//         </select>
//       </div>
//       {error && <p className="text-red-500">{error}</p>}
//       {selectedSession && <div>{renderVideoPlayer(selectedSession)}</div>}
//     </div>
//   );
// }

// ----------------------------------------------------------------

// import { useState, useEffect } from "react";
// import { useSearchParams } from "next/navigation";

// interface SessionType {
//   type: string;
// }

// interface Session {
//   sessionid: number;
//   title: string;
//   status: string;
//   sessiondate: string;
//   type: string;
//   link: string;
// }

// const SessionComp = () => {
//   const searchParams = useSearchParams();
//   const course = searchParams.get("course") || "ML"; // Default to 'ML' if course is not in URL

//   // Loading state for session types and sessions
//   const [isLoadingSessionTypes, setIsLoadingSessionTypes] = useState<boolean>(true);
//   const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true);

//   const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [selectedType, setSelectedType] = useState<string>("Resume Session");
//   const [selectedSession, setSelectedSession] = useState<Session | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch session types when the component mounts
//   useEffect(() => {
//     setIsLoadingSessionTypes(true); // Start loading session types
//     fetch(`${process.env.NEXT_PUBLIC_API_URL}/session-types`)
//       .then((res) => res.json())
//       .then((data) => {
//         setSessionTypes(data.types);
//         setIsLoadingSessionTypes(false); // Stop loading when data is fetched
//       })
//       .catch((error) => {
//         setError("Error fetching session types.");
//         setIsLoadingSessionTypes(false); // Stop loading even if there's an error
//       });
//   }, []);

//   // Fetch sessions based on the selected session type and course name
//   const fetchSessions = () => {
//     setIsLoadingSessions(true); // Start loading sessions
//     fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/sessions?course_name=${course}&session_type=${selectedType}`
//     )
//       .then((res) => res.json())
//       .then((data) => {
//         setSessions(data.sessions);
//         setIsLoadingSessions(false); // Stop loading when data is fetched
//       })
//       .catch((error) => {
//         setError("Error fetching sessions.");
//         setIsLoadingSessions(false); // Stop loading even if there's an error
//       });
//   };

//   // Run fetchSessions whenever sessionType or courseName changes
//   useEffect(() => {
//     setSessions([]); // Clear previous sessions when the course or session type changes
//     setSelectedSession(null); // Reset selected session
//     setError(null); // Reset errors
//     fetchSessions(); // Fetch new sessions based on selected course and type
//   }, [course, selectedType]);

//   // Handle session selection
//   const handleSessionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = parseInt(e.target.value);
//     const selected = sessions.find((session) => session.sessionid === selectedId);
//     if (selected) {
//       setSelectedSession(selected);
//       setError(null); // Clear any errors when a session is selected
//     } else {
//       setSelectedSession(null);
//       setError("Selected session not found.");
//     }
//   };

//   const renderVideoPlayer = (session: Session) => {
//     return (
//       <iframe
//         width="100%"
//         height="350"
//         src={session.link}
//         title={session.title}
//         frameBorder="0"
//         allowFullScreen
//         className="h-[350px] rounded-xl border-2 border-gray-500"
//       ></iframe>
//     );
//   };

//   return (
//     <div className="mx-auto mt-6 max-w-full flex-grow space-y-4 sm:mt-0 sm:max-w-3xl">
//       <div className="flex flex-grow flex-col">
//         <label htmlFor="session-type">Select Session Type:</label>
//         <select
//           id="session-type"
//           className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
//           value={selectedType}
//           onChange={(e) => setSelectedType(e.target.value)}
//         >
//           {isLoadingSessionTypes ? (
//             <option disabled>Loading session types...</option>
//           ) : (
//             sessionTypes.map((type) => (
//               <option key={type.type} value={type.type}>
//                 {type.type || "No Type"}
//               </option>
//             ))
//           )}
//         </select>
//       </div>

//       <div className="flex flex-grow flex-col">
//         <label htmlFor="session-dropdown">Sessions:</label>
//         <select
//           id="session-dropdown"
//           className="mb-5 rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
//           onChange={handleSessionSelect}
//           disabled={isLoadingSessions}
//         >
//           {isLoadingSessions ? (
//             <option disabled>Loading session videos...</option>
//           ) : (
//             <>
//               <option value="">Please select a session...</option>
//               {sessions.map((session) => (
//                 <option key={session.sessionid} value={String(session.sessionid)}>
//                   {session.title}
//                 </option>
//               ))}
//             </>
//           )}
//         </select>
//       </div>

//       {error && <p className="text-red-500">{error}</p>}

//       {selectedSession && (
//         <div className="mt-4">
//           <h3 className="text-xl font-semibold">{selectedSession.title}</h3>
//           <p className="text-sm text-gray-600">Status: {selectedSession.status}</p>
//           <p className="text-sm text-gray-600">Date: {selectedSession.sessiondate}</p>
//           <div className="mt-2">{renderVideoPlayer(selectedSession)}</div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SessionComp;


//_______________________mani sai ___________________________________

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface SessionType {
  type: string;
}

interface Video {
  // id: number;
  description: string;
  link: string;
  videoid: string;
}

interface Session {
  sessionid: number;
  title: string;
  status: string;
  sessiondate: string;
  type: string;
  link: string;
  videoid: string; // Add the videoid if needed
  description: string; // Add description if needed
}
interface Video {
  link: string;
  videoid: string; // Adjust if `videoid` can be null or undefined
  description: string;
}

// Helper function to format the title
const formatVideoTitle = (filename: string) => {
  // Remove the "Class" and any variations (case insensitive) from anywhere in the filename
  filename = filename.replace(/session_/gi, ""); // Remove Class_ prefix
  filename = filename.replace(/session_/gi, ""); // Remove Class from anywhere
  
  // Remove any sequence numbers like _152_, _123_
  filename = filename.replace(/_\d+_/g, "_");

  // Replace all underscores with spaces
  filename = filename.replace(/_/g, " ");

  // Remove any file extensions (.mp4, .wmv, etc.)
  filename = filename.replace(/\.(mp4|wmv|avi|mov|mpg|mkv)$/i, "");

  // Trim any extra spaces around the filename
  filename = filename.trim();

  // Match and extract the date in the format YYYY-MM-DD
  const dateRegex = /\d{4}-\d{2}-\d{2}/;
  const dateMatch = filename.match(dateRegex);

  if (dateMatch) {
    const date = dateMatch[0]; // Extract the date part
    const restOfTitle = filename.replace(dateRegex, "").trim(); // Get the rest of the title after the date

    // The rest should include the tutor's name and subject name
    return `${date} ${restOfTitle}`;
  }

  // If the filename doesn't contain a valid date, return the original formatted string
  return filename;
};

// Desired order of session types
const desiredOrder = [
  "Group Mock",
  "Individual Mock",
  "Resume Session",
  "Interview Prep",
  "Job Help",
  "Misc",
  "Internal Sessions"
];

// const sortSessionTypes = (types: SessionType[]) => {
//   return types.sort(
//     (a, b) => desiredOrder.indexOf(a.type) - desiredOrder.indexOf(b.type)
//   );
// };
const sortSessionTypes = (types: SessionType[]) => {
  return types.sort((a, b) => {
    if (a.type === "Internal Session") return 1; // Push "Internal Session" to the end
    if (b.type === "Internal Session") return -1; // Push "Internal Session" to the end
    return desiredOrder.indexOf(a.type) - desiredOrder.indexOf(b.type);
  });
};

const SessionComp = () => {
  const searchParams = useSearchParams();
  const course = searchParams.get("course") || "ML"; // Default to 'ML' if course is not in URL

  // Loading state for session types and sessions
  const [isLoadingSessionTypes, setIsLoadingSessionTypes] = useState<boolean>(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true);

  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedType, setSelectedType] = useState<string>("Group Mock");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingSessionTypes(true); // Start loading session types
    const token = localStorage.getItem('access_token'); // Get the token from local storage

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/session-types`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the header
        },
    })
    .then((res) => {
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        return res.json();
    })
    .then((data) => {
        const sortedTypes = sortSessionTypes(data.types); // Apply sorting
        setSessionTypes(sortedTypes);
        setIsLoadingSessionTypes(false); // Stop loading when data is fetched
    })
    .catch((error) => {
        console.error('Error fetching session types:', error); // Log the error for debugging
        setError("Error fetching session types.");
        setIsLoadingSessionTypes(false); // Stop loading even if there's an error
    });
}, []);

  const fetchSessions = () => {
    setIsLoadingSessions(true); // Start loading sessions
    const token = localStorage.getItem('access_token'); // Get the token from local storage

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sessions?course_name=${course}&session_type=${selectedType}`, 
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Include the token in the header
        },
      }
    )
      .then((res) => {
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setSessions(data.sessions);
        setIsLoadingSessions(false); // Stop loading when data is fetched
      })
      .catch((error) => {
        console.error('Error fetching sessions:', error); // Log the error for debugging
        setError("Error fetching sessions.");
        setIsLoadingSessions(false); // Stop loading even if there's an error
      });
};

  
  
  // Run fetchSessions whenever sessionType or courseName changes
  useEffect(() => {
    setSessions([]); // Clear previous sessions when the course or session type changes
    setSelectedSession(null); // Reset selected session
    setError(null); // Reset errors
    fetchSessions(); // Fetch new sessions based on selected course and type
  }, [course, selectedType]);

  // Handle session selection
  const handleSessionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = sessions.find((session) => session.sessionid === selectedId);
    if (selected) {
      setSelectedSession(selected);
      setError(null); // Clear any errors when a session is selected
    } else {
      setSelectedSession(null);
      setError("Selected session not found.");
    }
  };

  const renderVideoPlayer = (video: Video) => {
    if (video.link.includes("youtu.be") || video.link.includes("youtube.com")) {
      const youtubeId = video.videoid;
      const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`;
      return (
        <iframe
          width="100%"
          height="350"
          src={youtubeEmbedUrl}
          title={video.description}
          frameBorder="0"
          allowFullScreen
          className="h-[350px] rounded-xl border-2 border-gray-500"
        ></iframe>
      );
    } else {
      return <video src={video.link} controls className="mb-2 w-full" />;
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-full flex-grow space-y-4 sm:mt-0 sm:max-w-3xl">
      {/* Session Type Dropdown */}
      <div className="flex flex-grow flex-col">
        <label htmlFor="session-type">Select Session Type:</label>
        <select
          id="session-type"
          className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          disabled={isLoadingSessionTypes} // Disable until session types are loaded
        >
          {isLoadingSessionTypes ? (
            <option disabled className="text-gray-500">
              Loading session types...
            </option> // Show Loading message with styled color
          ) : (
            <>
              {/* <option value="">Please select a session type...</option> */}
              {sessionTypes.map((type) => (
                <option key={type.type} value={type.type}>
                  {type.type || "No Type"}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Session Videos Dropdown */}
     {/* Session Videos Dropdown */}
<div className="flex flex-grow flex-col">
  <label htmlFor="session-dropdown">Sessions:</label>
  <select
    id="session-dropdown"
    className="mb-5 rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
    onChange={handleSessionSelect}
    disabled={isLoadingSessions} // Disable until session videos are loaded
  >
    {isLoadingSessions ? (
      <option disabled className="text-gray-500">
        Loading session videos...
      </option> // Show Loading message with styled color
    ) : (
      <>
        <option value="">Please select a session...</option>
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <option key={session.sessionid} value={String(session.sessionid)}>
              {formatVideoTitle(session.title)}
            </option>
          ))
        ) : (
          <option disabled className="text-red-500">
            No sessions found for this Session Type Please try again.
          </option>
        )}
      </>
    )}
  </select>
</div>


      {/* Error Message */}
      {/* {error && <p className="text-red-500">{error}</p>} */}

      {/* Render selected session details and video */}
      {selectedSession && (
        <div className="mt-4">              
          <div className="mt-2">{renderVideoPlayer(selectedSession)}</div>
        </div>
      )}
    </div>
  );
};

export default SessionComp;



// 858585*********************************
// import { useState, useEffect } from "react";
// import { useSearchParams } from "next/navigation";

// interface SessionType {
//   type: string;
// }

// interface Video {
//   description: string;
//   link: string;
//   videoid: string;
// }

// interface Session {
//   sessionid: number;
//   title: string;
//   status: string;
//   sessiondate: string;
//   type: string;
//   link: string;
//   videoid: string;
//   description: string;
// }

// const formatVideoTitle = (filename: string) => {
//   filename = filename.replace(/session_/gi, "");
//   filename = filename.replace(/_\d+_/g, "_");
//   filename = filename.replace(/_/g, " ");
//   filename = filename.replace(/\.(mp4|wmv|avi|mov|mpg|mkv)$/i, "");
//   filename = filename.trim();
//   const dateRegex = /\d{4}-\d{2}-\d{2}/;
//   const dateMatch = filename.match(dateRegex);

//   if (dateMatch) {
//     const date = dateMatch[0];
//     const restOfTitle = filename.replace(dateRegex, "").trim();
//     return `${date} ${restOfTitle}`;
//   }

//   return filename;
// };

// const desiredOrder = [
//   "Group Mock",
//   "Individual Mock",
//   "Resume Session",
//   "Interview Prep",
//   "Job Help",
//   "Misc",
// ];

// const sortSessionTypes = (types: SessionType[]) =>
//   types.sort((a, b) => desiredOrder.indexOf(a.type) - desiredOrder.indexOf(b.type));

// const SessionComp = () => {
//   const searchParams = useSearchParams();
//   const course = searchParams.get("course") || "ML";

//   const [isLoadingSessionTypes, setIsLoadingSessionTypes] = useState<boolean>(true);
//   const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);

//   const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [selectedType, setSelectedType] = useState<string>("Group Mock");
//   const [selectedSession, setSelectedSession] = useState<Session | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     setIsLoadingSessionTypes(true);
//     const token = localStorage.getItem("access_token");

//     fetch(`${process.env.NEXT_PUBLIC_API_URL}/session-types`, {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         const sortedTypes = sortSessionTypes(data.types);
//         setSessionTypes(sortedTypes);
//         setIsLoadingSessionTypes(false);
//       })
//       .catch((error) => {
//         console.error("Error fetching session types:", error);
//         setError("Error fetching session types.");
//         setIsLoadingSessionTypes(false);
//       });
//   }, []);

//   const fetchSessions = () => {
//     if (!selectedType) return;

//     setIsLoadingSessions(true);
//     const token = localStorage.getItem("access_token");

//     fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/sessions?course_name=${course}&session_type=${selectedType}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     )
//       .then((res) => {
//         if (!res.ok) throw new Error("Network response was not ok");
//         return res.json();
//       })
//       .then((data) => {
//         setSessions(data.sessions);
//         setIsLoadingSessions(false);
//       })
//       .catch((error) => {
//         console.error("Error fetching sessions:", error);
//         setError("Error fetching sessions.");
//         setIsLoadingSessions(false);
//       });
//   };

//   useEffect(() => {
//     if (!isLoadingSessionTypes && selectedType) {
//       setSessions([]);
//       setSelectedSession(null);
//       setError(null);
//       fetchSessions();
//     }
//   }, [isLoadingSessionTypes, selectedType]);

//   const handleSessionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = parseInt(e.target.value);
//     const selected = sessions.find((session) => session.sessionid === selectedId);
//     if (selected) {
//       setSelectedSession(selected);
//       setError(null);
//     } else {
//       setSelectedSession(null);
//       setError("Selected session not found.");
//     }
//   };

//   const renderVideoPlayer = (video: Video) => {
//     if (video.link.includes("youtube")) {
//       const youtubeEmbedUrl = `https://www.youtube.com/embed/${video.videoid}`;
//       return (
//         <iframe
//           width="100%"
//           height="350"
//           src={youtubeEmbedUrl}
//           title={video.description}
//           frameBorder="0"
//           allowFullScreen
//           className="h-[350px] rounded-xl border-2 border-gray-500"
//         ></iframe>
//       );
//     } else {
//       return <video src={video.link} controls className="mb-2 w-full" />;
//     }
//   };

//   return (
//     <div className="mx-auto mt-6 max-w-full flex-grow space-y-4 sm:mt-0 sm:max-w-3xl">
//       <div className="flex flex-grow flex-col">
//         <label htmlFor="session-type">Select Session Type:</label>
//         <select
//           id="session-type"
//           className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
//           value={selectedType}
//           onChange={(e) => setSelectedType(e.target.value)}
//           disabled={isLoadingSessionTypes}
//         >
//           {isLoadingSessionTypes ? (
//             <option disabled>Loading session types...</option>
//           ) : (
//             sessionTypes.map((type) => (
//               <option key={type.type} value={type.type}>
//                 {type.type || "No Type"}
//               </option>
//             ))
//           )}
//         </select>
//       </div>

//       <div className="flex flex-grow flex-col">
//         <label htmlFor="session-dropdown">Sessions:</label>
//         <select
//           id="session-dropdown"
//           className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
//           onChange={handleSessionSelect}
//           disabled={isLoadingSessions || !selectedType}
//         >
//           {isLoadingSessions ? (
//             <option disabled>Loading sessions...</option>
//           ) : (
//             <>
//               <option value="">Please select a session...</option>
//               {sessions.length > 0 ? (
//                 sessions.map((session) => (
//                   <option key={session.sessionid} value={session.sessionid}>
//                     {formatVideoTitle(session.title)}
//                   </option>
//                 ))
//               ) : (
//                 <option disabled>No sessions found.</option>
//               )}
//             </>
//           )}
//         </select>
//       </div>

//       {selectedSession && (
//         <div className="mt-4">
//           <div className="mt-2">{renderVideoPlayer(selectedSession)}</div>
//         </div>
//       )}

//       {error && <p className="text-red-500">{error}</p>}
//     </div>
//   );
// };

// export default SessionComp;




//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// Fetch sessions based on the selected session type and course name
  // const fetchSessions = () => {
  //   setIsLoadingSessions(true); // Start loading sessions
  //   fetch(
  //     `${process.env.NEXT_PUBLIC_API_URL}/sessions?course_name=${course}&session_type=${selectedType}`
  //   )
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setSessions(data.sessions);
  //       setIsLoadingSessions(false); // Stop loading when data is fetched
  //     })
  //     .catch((error) => {
  //       setError("Error fetching sessions.");
  //       setIsLoadingSessions(false); // Stop loading even if there's an error
  //     });
  // };


  // /   // Fetch session types when the component mounts
//   useEffect(() => {
//     setIsLoadingSessionTypes(true); // Start loading session types
//     fetch(`${process.env.NEXT_PUBLIC_API_URL}/session-types`)
//       .then((res) => res.json())
//       .then((data) => {
//         setSessionTypes(data.types);
//         setIsLoadingSessionTypes(false); // Stop loading when data is fetched
//       })
//       .catch((error) => {
//         setError("Error fetching session types.");
//         setIsLoadingSessionTypes(false); // Stop loading even if there's an error
//       });
//   }, []);