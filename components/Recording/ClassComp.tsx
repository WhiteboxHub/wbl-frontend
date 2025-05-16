import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";

interface Video {
  id: number;
  description: string;
  link: string;
  videoid: string;
}

interface Batch {
  batchname: string;
  batchid: number;
}

const RecordingComp: React.FC = () => {
  const searchParams = useSearchParams();
  const course = searchParams.get("course") as string; // Get 'course' parameter from URL

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [recordings, setRecordings] = useState<Video[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(false);
  const [isLoadingRecordings, setIsLoadingRecordings] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (course) {
      setSelectedBatch(null);
      setRecordings([]);
      setSelectedVideo(null);
      setError(null);
      fetchBatches(course);
    }
  }, [course]);

  useEffect(() => {
    if (selectedBatch) {
      setSelectedVideo(null); // Clear the selected video
      setError(null); // Clear any existing errors
      setRecordings([]); // Clear previous recordings
      fetchRecordings(selectedBatch.batchid);
    }
  }, [selectedBatch]);

  const fetchBatches = async (course: string) => {
    try {
      setIsLoadingBatches(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batches?course=${course}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch batches");
      }
      const data = await response.json();
      sessionStorage.setItem("batches_data", JSON.stringify(data.batches));
      sessionStorage.setItem("batches_data_timestamp", Date.now().toString());
      setBatches(data.batches);
      if (data.batches.length > 0) {
        setSelectedBatch(data.batches[0]);
      }
    } catch (error) {
      // console.error("Error fetching batches:", error);
      setError("Failed to load batches. Please try again.");
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const fetchRecordings = async (batchid: number) => {
    try {
      setIsLoadingRecordings(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recording?course=${course}&batchid=${batchid}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch recordings");
      }
      const data = await response.json();
      setRecordings(data.batch_recordings || []);
      if (data.batch_recordings.length === 0) {
        setError("No recordings found for this batch.");
      }
    } catch (error) {
      // console.error("Error fetching recordings:", error);
      setError("No recordings found for this batch. Please try again.");
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = batches.find((batch) => batch.batchid === selectedId);
    if (!selected) {
      setError("Selected batch not found.");
    } else {
      setSelectedBatch(selected);
      setError(null); // Clear any error when a batch is selected
      setSelectedVideo(null); // Clear selected video
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = recordings.find(
      (recording) => recording.id === selectedId
    );
    if (!selected) {
      setError("Selected recording not found.");
      // setSelectedVideo(null); // Ensure video is cleared if not found
    } else {
      setSelectedVideo(selected);
      setError(null); // Clear any error when a video is selected
    }
  };

//*************** */ added logic for formatting the video titles**************
  const formatVideoTitle = (filename: string) => {
    // Remove the "Class" and any variations (case insensitive) from anywhere in the filename
    filename = filename.replace(/class_/gi, ""); // Remove Class_ prefix
    filename = filename.replace(/class/gi, ""); // Remove Class from anywhere
    
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

  // ----------------****************---------------------------------------------------
  
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
      <div className="flex flex-grow flex-col">
        <label htmlFor="dropdown1">Batch:</label>

         {/* updated code */}
        <select
          id="dropdown1"
          className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
          value={selectedBatch ? selectedBatch.batchid : ""}
          onChange={handleBatchChange}
          disabled={isLoadingBatches}
        >
          {isLoadingBatches ? (
            <option disabled>Loading batches...</option>
          ) : (
            <>
              <option value="" disabled>
                Please Select a batch...
              </option>
              {batches.map((batch, index) => (
                <option key={index} value={batch.batchid}>
                  {batch.batchname}
                </option>
              ))}
            </>
          )}
        </select>
        {/* ---------ended------------------ */}
      </div>
      <div className="flex flex-grow flex-col justify-between">
        <label htmlFor="dropdown2">Recordings:</label>
        <select
         id="dropdown2"
         className="mb-5 rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
         onChange={handleVideoSelect}
         disabled={!selectedBatch || isLoadingRecordings}
       >
  {isLoadingRecordings ? (
    <option disabled>Loading recordings...</option>
  ) : (
    <>
      <option value="">Please select a recording...</option>
      {recordings.map((recording) => (
        <option key={recording.id} value={String(recording.id)}>
          {formatVideoTitle(recording.description)}
        </option>
      ))}
    </>
  )}
</select>

      </div>
      {error && <p className="text-red-500">{error}</p>}
      {selectedVideo && <div>{renderVideoPlayer(selectedVideo)}</div>}
    </div>
  );
};

export default RecordingComp;




/* old code  */
        {/* 
         <select
          id="dropdown2"
          className="mb-5 rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
          onChange={handleVideoSelect}
          disabled={!selectedBatch || isLoadingRecordings}
        >
          {isLoadingRecordings ? (
            <option disabled>Loading recordings...</option>
          ) : (
            <>
              <option value="">Please select a recording...</option>
              {recordings.map((recording) => (
                <option key={recording.id} value={String(recording.id)}>
                  {recording.description}
                </option>
              ))}
            </>
          )}
        </select>
         */}