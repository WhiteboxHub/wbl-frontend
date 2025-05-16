// import React, { useState, useRef, useCallback, useEffect } from "react";
// import { debounce } from "lodash";
// import axios from "axios";
// import { useSearchParams } from "next/navigation";

// interface Video {
//   id: number;
//   batchname: string;
//   classdate: string;
//   course: string;
//   description: string;
//   filename: string;
//   forallcourses: string;
//   link: string;
//   status: string;
//   subject: string | null;
//   subjectid: number | null;
//   type: string;
//   videoid: string;
// }

// const SearchComp: React.FC = () => {
//   const searchParams = useSearchParams();

//   const course = searchParams.get("course") as string; // Get 'course' parameter from URL

//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [searchResults, setSearchResults] = useState<Video[]>([]);
//   const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
//   const [showSearchBox, setShowSearchBox] = useState<boolean>(false);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null); // State for error message
//   const cancelTokenRef = useRef<any>(null);

//   useEffect(() => {
//     if (!course) {
//       setError("Course parameter is missing from the URL.");
//     }
//   }, [course]);

//   const debouncedSearch = useCallback(
//     debounce(async (query: string) => {
//       if (query.trim() === "") {
//         setSearchResults([]);
//         setShowSearchBox(false);
//         setLoading(false);
//         setError(null); // Clear error state
//       } else {
//         setLoading(true);
//         setError(null); // Clear error state before making a new request

//         if (cancelTokenRef.current) {
//           cancelTokenRef.current.cancel("New search triggered");
//         }
//         cancelTokenRef.current = axios.CancelToken.source();

//         try {
//           const response = await axios.get(
//             `${process.env.NEXT_PUBLIC_API_URL}/recording`,
//             {
//               params: { course, search: query },
//               cancelToken: cancelTokenRef.current.token,
//             }
//           );

//           const filteredVideos = response.data.batch_recordings;
//           setSearchResults(filteredVideos);
//           setShowSearchBox(filteredVideos.length > 0);
//           setLoading(false);
//         } catch (error) {
//           setLoading(false);
//           if (axios.isAxiosError(error)) {
//             setError(error.response?.data.detail || "An error occurred");
//           } else {
//             setError("An error occurred");
//           }
//           setSearchResults([]);
//           setShowSearchBox(false);
//         }
//       }
//     }, 500),
//     [course]
//   );

//   const handleSearchInputChange = (
//     event: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const query = event.target.value || "";
//     setSearchQuery(query);
//     setLoading(true); // Set loading to true immediately when input changes
//     debouncedSearch(query);
//   };

//   const handleVideoSelect = (video: Video) => {
//     setSelectedVideo(video);
//     setShowSearchBox(false);
//   };

//   // added logic for removing the extra spaces in the title names 

//   /// Helper function to format the title
// const formatVideoTitle = (filename: string) => {
//   // Remove the "Class" and any variations (case insensitive) from anywhere in the filename
//   filename = filename.replace(/class_/gi, ""); // Remove Class_ prefix
//   filename = filename.replace(/class/gi, ""); // Remove Class from anywhere
  
//   // Remove any sequence numbers like _152_, _123_
//   filename = filename.replace(/_\d+_/g, "_");

//   // Replace all underscores with spaces
//   filename = filename.replace(/_/g, " ");

//   // Remove any file extensions (.mp4, .wmv, etc.)
//   filename = filename.replace(/\.(mp4|wmv|avi|mov|mpg|mkv)$/i, "");

//   // Trim any extra spaces around the filename
//   filename = filename.trim();

//   // Match and extract the date in the format YYYY-MM-DD
//   const dateRegex = /\d{4}-\d{2}-\d{2}/;
//   const dateMatch = filename.match(dateRegex);

//   if (dateMatch) {
//     const date = dateMatch[0]; // Extract the date part
//     const restOfTitle = filename.replace(dateRegex, "").trim(); // Get the rest of the title after the date

//     // The rest should include the tutor's name and subject name
//     return `${date} ${restOfTitle}`;
//   }

//   // If the filename doesn't contain a valid date, return the original formatted string
//   return filename;
// };


// // ---------------********************--------------------------------

//   const renderVideoPlayer = (video: Video) => {
//     if (video.link.includes("youtu.be") || video.link.includes("youtube.com")) {
//       const youtubeId = video.videoid;
//       const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`;
//       return (
//         <iframe
//           width="100%"
//           height="250"
//           src={youtubeEmbedUrl}
//           title={video.description}
//           frameBorder="0"
//           allowFullScreen
//           className="rounded-xl border-2 border-gray-500"
//         ></iframe>
//       );
//     } else {
//       return <video src={video.link} controls className="mb-2 w-full" />;
//     }
//   };

//   return (
//     <div className="mx-auto mt-8 max-w-3xl px-4">
//       <input
//         type="text"
//         value={searchQuery}
//         onChange={handleSearchInputChange}
//         placeholder="Search for videos..."
//         className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-black dark:bg-white"
//       />
//       {loading ? (
//         <p className="text-center text-xl">
//           Loading{" "}
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             viewBox="0 0 24 24"
//             className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[50px] sm:w-[50px]"
//           >
//             <circle cx="4" cy="12" r="3" fill="currentColor">
//               <animate
//                 id="svgSpinners3DotsScale0"
//                 attributeName="r"
//                 begin="0;svgSpinners3DotsScale1.end-0.2s"
//                 dur="0.6s"
//                 values="3;.2;3"
//               />
//             </circle>
//             <circle cx="12" cy="12" r="3" fill="currentColor">
//               <animate
//                 attributeName="r"
//                 begin="svgSpinners3DotsScale0.end-0.48s"
//                 dur="0.6s"
//                 values="3;.2;3"
//               />
//             </circle>
//             <circle cx="20" cy="12" r="3" fill="currentColor">
//               <animate
//                 id="svgSpinners3DotsScale1"
//                 attributeName="r"
//                 begin="svgSpinners3DotsScale0.end-0.36s"
//                 dur="0.6s"
//                 values="3;.2;3"
//               />
//             </circle>
//           </svg>
//         </p>
//       ) : (
//         <>
//           {error && <p className="text-red-500">{error}</p>}
//           {showSearchBox && searchResults.length > 0 && (
//             <div className="mb-4 max-h-40 overflow-y-auto rounded-md bg-gray-100 p-4 dark:text-black">
//               {searchResults.map((video) => (
//                 <div
//                   key={video.id}
//                   onClick={() => handleVideoSelect(video)}
//                   className="mb-2 mr-2 cursor-pointer rounded-md px-3 py-2 hover:bg-primarylight"
//                 >
//                   {/* {video.description} */}
//                   {formatVideoTitle(video.description)}
//                 </div>
//               ))}
//             </div>
//           )}
//           {selectedVideo && (
//             <div>{renderVideoPlayer(selectedVideo)}</div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default SearchComp;


// import React, { useState, useRef, useCallback, useEffect } from "react";
// import { debounce } from "lodash";
// import axios from "axios";
// import { useSearchParams } from "next/navigation";

// interface Video {
//   id: number;
//   batchname: string;
//   classdate: string;
//   course: string;
//   description: string;
//   filename: string;
//   forallcourses: string;
//   link: string;
//   status: string;
//   subject: string | null;
//   subjectid: number | null;
//   type: string;
//   videoid: string;
// }

// const SearchComp: React.FC = () => {
//   const searchParams = useSearchParams();
//   const course = searchParams.get("course") as string; // Get 'course' parameter from URL

//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [searchResults, setSearchResults] = useState<Video[]>([]);
//   const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
//   const [showSearchBox, setShowSearchBox] = useState<boolean>(false);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const cancelTokenRef = useRef<any>(null);

//   useEffect(() => {
//     if (!course) {
//       setError("Course parameter is missing from the URL.");
//       return;
//     }

//     // Reset search query and results when the course changes
//     setSearchQuery("");
//     setSearchResults([]);
//     setShowSearchBox(false);
//     setError(null); // Clear any previous error
//   }, [course]);

//   const debouncedSearch = useCallback(
//     debounce(async (query: string) => {
//       if (query.trim() === "") {
//         setSearchResults([]);
//         setShowSearchBox(false);
//         setLoading(false);
//         setError(null);
//       } else {
//         setLoading(true);
//         setError(null); // Clear error state before making a new request

//         if (cancelTokenRef.current) {
//           cancelTokenRef.current.cancel("New search triggered");
//         }
//         cancelTokenRef.current = axios.CancelToken.source();

//         try {
//           const response = await axios.get(
//             `${process.env.NEXT_PUBLIC_API_URL}/recording`,
//             {
//               params: { course, search: query },
//               cancelToken: cancelTokenRef.current.token,
//             }
//           );

//           const filteredVideos = response.data.batch_recordings;
//           setSearchResults(filteredVideos);
//           setShowSearchBox(filteredVideos.length > 0);
//           setLoading(false);
//         } catch (error) {
//           setLoading(false);
//           if (axios.isAxiosError(error)) {
//             setError(error.response?.data.detail || "An error occurred");
//           } else {
//             setError("An error occurred");
//           }
//           setSearchResults([]);
//           setShowSearchBox(false);
//         }
//       }
//     }, 500),
//     [course]
//   );

//   const handleSearchInputChange = (
//     event: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const query = event.target.value || "";
//     setSearchQuery(query);
//     setLoading(true);
//     debouncedSearch(query);
//   };

//   const handleVideoSelect = (video: Video) => {
//     setSelectedVideo(video);
//     setShowSearchBox(false);
//   };

//   const formatVideoTitle = (filename: string) => {
//     // Remove "Class" and variations from filename
//     filename = filename.replace(/class_/gi, "");
//     filename = filename.replace(/class/gi, "");
//     filename = filename.replace(/_\d+_/g, "_");
//     filename = filename.replace(/_/g, " ");
//     filename = filename.replace(/\.(mp4|wmv|avi|mov|mpg|mkv)$/i, "");
//     filename = filename.trim();
//     const dateRegex = /\d{4}-\d{2}-\d{2}/;
//     const dateMatch = filename.match(dateRegex);

//     if (dateMatch) {
//       const date = dateMatch[0];
//       const restOfTitle = filename.replace(dateRegex, "").trim();
//       return `${date} ${restOfTitle}`;
//     }

//     return filename;
//   };

//   const renderVideoPlayer = (video: Video) => {
//     if (video.link.includes("youtu.be") || video.link.includes("youtube.com")) {
//       const youtubeId = video.videoid;
//       const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`;
//       return (
//         <iframe
//           width="100%"
//           height="250"
//           src={youtubeEmbedUrl}
//           title={video.description}
//           frameBorder="0"
//           allowFullScreen
//           className="rounded-xl border-2 border-gray-500"
//         ></iframe>
//       );
//     } else {
//       return <video src={video.link} controls className="mb-2 w-full" />;
//     }
//   };

//   return (
//     <div className="mx-auto mt-8 max-w-3xl px-4">
//       <input
//         type="text"
//         value={searchQuery}
//         onChange={handleSearchInputChange}
//         placeholder="Search for videos..."
//         className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-black dark:bg-white"
//       />
//       {loading ? (
//         <p className="text-center text-xl">
//           Loading{" "}
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             viewBox="0 0 24 24"
//             className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[50px] sm:w-[50px]"
//           >
//             <circle cx="4" cy="12" r="3" fill="currentColor">
//               <animate
//                 id="svgSpinners3DotsScale0"
//                 attributeName="r"
//                 begin="0;svgSpinners3DotsScale1.end-0.2s"
//                 dur="0.6s"
//                 values="3;.2;3"
//               />
//             </circle>
//             <circle cx="12" cy="12" r="3" fill="currentColor">
//               <animate
//                 attributeName="r"
//                 begin="svgSpinners3DotsScale0.end-0.48s"
//                 dur="0.6s"
//                 values="3;.2;3"
//               />
//             </circle>
//             <circle cx="20" cy="12" r="3" fill="currentColor">
//               <animate
//                 id="svgSpinners3DotsScale1"
//                 attributeName="r"
//                 begin="svgSpinners3DotsScale0.end-0.36s"
//                 dur="0.6s"
//                 values="3;.2;3"
//               />
//             </circle>
//           </svg>
//         </p>
//       ) : (
//         <>
//           {error && <p className="text-red-500">{error}</p>}
//           {showSearchBox && searchResults.length > 0 && (
//             <div className="mb-4 max-h-40 overflow-y-auto rounded-md bg-gray-100 p-4 dark:text-black">
//               {searchResults.map((video) => (
//                 <div
//                   key={video.id}
//                   onClick={() => handleVideoSelect(video)}
//                   className="mb-2 mr-2 cursor-pointer rounded-md px-3 py-2 hover:bg-primarylight"
//                 >
//                   {formatVideoTitle(video.description)}
//                 </div>
//               ))}
//             </div>
//           )}
//           {selectedVideo && <div>{renderVideoPlayer(selectedVideo)}</div>}
//         </>
//       )}
//     </div>
//   );
// };

// export default SearchComp;









// import React, { useState, useRef, useCallback, useEffect } from "react";
// import { debounce } from "lodash";
// import axios from "axios";
// import { useSearchParams } from "next/navigation";

// interface Video {
//   id: number;
//   batchname: string;
//   classdate: string;
//   course: string;
//   description: string;
//   filename: string;
//   forallcourses: string;
//   link: string;
//   status: string;
//   subject: string | null;
//   subjectid: number | null;
//   type: string;
//   videoid: string;
// }

// const SearchComp: React.FC = () => {
//   const searchParams = useSearchParams();
//   const course = searchParams.get("course") as string;

//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [searchResults, setSearchResults] = useState<Video[]>([]);
//   const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
//   const [showSearchBox, setShowSearchBox] = useState<boolean>(false);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const cancelTokenRef = useRef<any>(null);

//   useEffect(() => {
//     if (!course) {
//       setError("Course parameter is missing from the URL.");
//       return;
//     }

//     // Reset state when the course changes
//     setSearchQuery("");
//     setSearchResults([]);
//     setShowSearchBox(false);
//     setSelectedVideo(null);
//     setError(null);
//   }, [course]);

//   const debouncedSearch = useCallback(
//     debounce(async (query: string) => {
//       if (query.trim() === "") {
//         setSearchResults([]);
//         setShowSearchBox(false);
//         setLoading(false);
//         setError(null);
//         setSelectedVideo(null); // Clear selected video on empty query
//       } else {
//         setLoading(true);
//         setError(null);

//         if (cancelTokenRef.current) {
//           cancelTokenRef.current.cancel("New search triggered");
//         }
//         cancelTokenRef.current = axios.CancelToken.source();

//         try {
//           const response = await axios.get(
//             `${process.env.NEXT_PUBLIC_API_URL}/recording`,
//             {
//               params: { course, search: query },
//               cancelToken: cancelTokenRef.current.token,
//             }
//           );

//           const filteredVideos = response.data.batch_recordings;
//           setSearchResults(filteredVideos);
//           setShowSearchBox(filteredVideos.length > 0);
//           setLoading(false);
//         } catch (error) {
//           setLoading(false);
//           if (axios.isAxiosError(error)) {
//             setError(error.response?.data.detail || "An error occurred");
//           } else {
//             setError("An error occurred");
//           }
//           setSearchResults([]);
//           setShowSearchBox(false);
//         }
//       }
//     }, 500),
//     [course]
//   );

//   const handleSearchInputChange = (
//     event: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const query = event.target.value || "";
//     setSearchQuery(query);
//     setLoading(true);
//     setSelectedVideo(null); // Reset selected video when typing a new search
//     debouncedSearch(query);
//   };

//   const handleVideoSelect = (video: Video) => {
//     setSelectedVideo(video);
//     setShowSearchBox(false);
//   };

//   const formatVideoTitle = (filename: string) => {
//     filename = filename.replace(/class_/gi, "");
//     filename = filename.replace(/class/gi, "");
//     filename = filename.replace(/_\d+_/g, "_");
//     filename = filename.replace(/_/g, " ");
//     filename = filename.replace(/\.(mp4|wmv|avi|mov|mpg|mkv)$/i, "");
//     filename = filename.trim();
//     const dateRegex = /\d{4}-\d{2}-\d{2}/;
//     const dateMatch = filename.match(dateRegex);

//     if (dateMatch) {
//       const date = dateMatch[0];
//       const restOfTitle = filename.replace(dateRegex, "").trim();
//       return `${date} ${restOfTitle}`;
//     }

//     return filename;
//   };

//   const renderVideoPlayer = (video: Video) => {
//     if (video.link.includes("youtu.be") || video.link.includes("youtube.com")) {
//       const youtubeId = video.videoid;
//       const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`;
//       return (
//         <div>
//           <iframe
//             width="100%"
//             height="250"
//             src={youtubeEmbedUrl}
//             title={video.description}
//             frameBorder="0"
//             allowFullScreen
//             className="rounded-xl border-2 border-gray-500"
//           ></iframe>
//           <button
//             onClick={() => setSelectedVideo(null)}
//             className="mt-2 block w-full rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
//           >
//             Close Video
//           </button>
//         </div>
//       );
//     } else {
//       return (
//         <div>
//           <video src={video.link} controls className="mb-2 w-full" />
//           <button
//             onClick={() => setSelectedVideo(null)}
//             className="mt-2 block w-full rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
//           >
//             Close Video
//           </button>
//         </div>
//       );
//     }
//   };

//   return (
//     <div className="mx-auto mt-8 max-w-3xl px-4">
//       <input
//         type="text"
//         value={searchQuery}
//         onChange={handleSearchInputChange}
//         placeholder="Search for videos..."
//         className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-black dark:bg-white"
//       />
//       {loading ? (
//         <p className="text-center text-xl">Loading...</p>
//       ) : (
//         <>
//           {error && <p className="text-red-500">{error}</p>}
//           {showSearchBox && searchResults.length > 0 && (
//             <div className="mb-4 max-h-40 overflow-y-auto rounded-md bg-gray-100 p-4 dark:text-black">
//               {searchResults.map((video) => (
//                 <div
//                   key={video.id}
//                   onClick={() => handleVideoSelect(video)}
//                   className="mb-2 mr-2 cursor-pointer rounded-md px-3 py-2 hover:bg-primarylight"
//                 >
//                   {formatVideoTitle(video.description)}
//                 </div>
//               ))}
//             </div>
//           )}
//           {selectedVideo && <div>{renderVideoPlayer(selectedVideo)}</div>}
//         </>
//       )}
//     </div>
//   );
// };

// export default SearchComp;




import React, { useState, useRef, useCallback, useEffect } from "react";
import { debounce } from "lodash";
import axios from "axios";
import { useSearchParams } from "next/navigation";

interface Video {
  id: number;
  batchname: string;
  classdate: string;
  course: string;
  description: string;
  filename: string;
  forallcourses: string;
  link: string;
  status: string;
  subject: string | null;
  subjectid: number | null;
  type: string;
  videoid: string;
}

const SearchComp: React.FC = () => {
  const searchParams = useSearchParams();
  const course = searchParams.get("course") as string;

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showSearchBox, setShowSearchBox] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const cancelTokenRef = useRef<any>(null);

  useEffect(() => {
    if (!course) {
      setError("Course parameter is missing from the URL.");
      return;
    }

    // Reset state when the course changes
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchBox(false);
    setSelectedVideo(null);
    setError(null);
  }, [course]);

  // Effect to reset selectedVideo when searchQuery changes
  useEffect(() => {
    setSelectedVideo(null); // Reset selected video when search query changes
  }, [searchQuery]);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim() === "") {
        setSearchResults([]);
        setShowSearchBox(false);
        setLoading(false);
        setError(null);
        // selectedVideo will be reset by the useEffect above
      } else {
        setLoading(true);
        setError(null);

        if (cancelTokenRef.current) {
          cancelTokenRef.current.cancel("New search triggered");
        }
        cancelTokenRef.current = axios.CancelToken.source();

        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/recording`,
            {
              params: { course, search: query },
              cancelToken: cancelTokenRef.current.token,
            }
          );

          const filteredVideos = response.data.batch_recordings;
          setSearchResults(filteredVideos);
          setShowSearchBox(filteredVideos.length > 0);
          setLoading(false);
        } catch (error) {
          setLoading(false);
          if (axios.isAxiosError(error)) {
            setError(error.response?.data.detail || "An error occurred");
          } else {
            setError("An error occurred");
          }
          setSearchResults([]);
          setShowSearchBox(false);
        }
      }
    }, 500),
    [course]
  );

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = event.target.value || "";
    setSearchQuery(query);
    setLoading(true);
    // selectedVideo will be reset by the useEffect above
    debouncedSearch(query);
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setShowSearchBox(false);
  };

  const formatVideoTitle = (filename: string) => {
    filename = filename.replace(/class_/gi, "");
    filename = filename.replace(/class/gi, "");
    filename = filename.replace(/_\d+_/g, "_");
    filename = filename.replace(/_/g, " ");
    filename = filename.replace(/\.(mp4|wmv|avi|mov|mpg|mkv)$/i, "");
    filename = filename.trim();
    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    const dateMatch = filename.match(dateRegex);

    if (dateMatch) {
      const date = dateMatch[0];
      const restOfTitle = filename.replace(dateRegex, "").trim();
      return `${date} ${restOfTitle}`;
    }

    return filename;
  };

  const renderVideoPlayer = (video: Video) => {
    if (video.link.includes("youtu.be") || video.link.includes("youtube.com")) {
      const youtubeId = video.videoid;
      const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}`;
      return (
        <div>
          <iframe
            width="100%"
            height="250"
            src={youtubeEmbedUrl}
            title={video.description}
            frameBorder="0"
            allowFullScreen
            className="rounded-xl border-2 border-gray-500"
          ></iframe>
          {/* <button
            onClick={() => setSelectedVideo(null)}
            className="mt-2 block w-full rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Close Video
          </button> */}
        </div>
      );
    } else {
      return (
        <div>
          <video src={video.link} controls className="mb-2 w-full" />
          <button
            onClick={() => setSelectedVideo(null)}
            className="mt-2 block w-full rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Close Video
          </button>
        </div>
      );
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-3xl px-4">
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchInputChange}
        placeholder="Search for videos..."
        className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-black dark:bg-white"
      />
      {loading ? (
        <p className="text-center text-xl">Loading...</p>
      ) : (
        <>
          {error && <p className="text-red-500">{error}</p>}
          {showSearchBox && searchResults.length > 0 && (
            <div className="mb-4 max-h-40 overflow-y-auto rounded-md bg-gray-100 p-4 dark:text-black">
              {searchResults.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className="mb-2 mr-2 cursor-pointer rounded-md px-3 py-2 hover:bg-primarylight"
                >
                  {formatVideoTitle(video.description)}
                </div>
              ))}
            </div>
          )}
          {selectedVideo && <div>{renderVideoPlayer(selectedVideo)}</div>}
        </>
      )}
    </div>
  );
};

export default SearchComp;
