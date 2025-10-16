
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";

interface Video {
  id: number;
  description: string;
  link: string;
  videoid: string;
  subject: string;
  classdate: string;
  filename: string;
}

interface Batch {
  batchname: string;
  batchid: number;
}

const RecordingComp: React.FC = () => {
  const searchParams = useSearchParams();
  const course = searchParams.get("course") as string;

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [recordings, setRecordings] = useState<Video[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch batches when course changes
  useEffect(() => {
    if (course) {
      setSelectedBatch(null);
      setRecordings([]);
      setSelectedVideo(null);
      setError(null);
      fetchBatches(course);
    }
  }, [course]);

  // Fetch recordings when batch changes
  useEffect(() => {
    if (selectedBatch) {
      fetchRecordings(selectedBatch.batchid);
    }
  }, [selectedBatch]);

  // Fetch batches from backend (adds Kumar batch)
  const fetchBatches = async (course: string) => {
    try {
      setIsLoadingBatches(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batches?course=${course}`
      );

      if (!response.ok) throw new Error("Failed to fetch batches");

      const data = await response.json();
      const batchList = data.batches || data; // handles both wrapped & raw arrays

      //  Always include the special Kumar batch (99999)
      if (!batchList.some((b: Batch) => b.batchid === 99999)) {
        batchList.unshift({ batchname: "Kumar Recordings", batchid: 99999 });
      }

      setBatches(batchList);

      //  Automatically select Kumar batch if available
      const defaultBatch =
        batchList.find((b: Batch) => b.batchid === 99999) || batchList[0];
      setSelectedBatch(defaultBatch);
    } catch (err) {
      console.error("Error loading batches:", err);
      setError("Failed to load batches. Please try again.");
    } finally {
      setIsLoadingBatches(false);
    }
  };

  //  Fetch recordings from backend (works for normal + Kumar batch)
  const fetchRecordings = async (batchid: number) => {
    try {
      setIsLoadingRecordings(true);
      setError(null);

      console.log("Fetching recordings for batch:", batchid);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recording?course=${course}&batchid=${batchid}`
      );
      if (!response.ok) throw new Error("Failed to fetch recordings");

      const data = await response.json();
      console.log("Recording API Response:", data);

      const recList = Array.isArray(data)
        ? data
        : data.batch_recordings || data.recordings || [];

      setRecordings(recList);

      if (recList.length === 0) {
        setError("No recordings found for this batch.");
      }
    } catch (err) {
      console.error("Error fetching recordings:", err);
      setError("No recordings found for this batch. Please try again.");
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  //  Handle dropdown changes
  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = batches.find((batch) => batch.batchid === selectedId);
    if (!selected) {
      setError("Selected batch not found.");
    } else {
      setSelectedBatch(selected);
      setError(null);
      setSelectedVideo(null);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = recordings.find((rec) => rec.id === selectedId);
    if (!selected) {
      setError("Selected recording not found.");
    } else {
      setSelectedVideo(selected);
      setError(null);
    }
  };

  //  Format recording title neatly
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

  //  Display YouTube or video link
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
      return (
        <video
          src={video.link}
          controls
          className="mb-2 w-full rounded-xl border-2 border-gray-500"
        />
      );
    }
  };

  //  Render UI
  return (
    <div className="mx-auto mt-6 max-w-full flex-grow space-y-4 sm:mt-0 sm:max-w-3xl">
      {/* Batch Dropdown */}
      <div className="flex flex-grow flex-col">
        <label htmlFor="dropdown1">Batch:</label>
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
              {batches.map((batch) => (
                <option key={batch.batchid} value={batch.batchid}>
                  {batch.batchid === 99999
                    ? "Kumar Recordings"
                    : batch.batchname}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Recording Dropdown */}
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
                <option key={recording.id} value={recording.id}>
                  {formatVideoTitle(
                    recording.description || recording.filename
                  )}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Video Player */}
      {selectedVideo && <div>{renderVideoPlayer(selectedVideo)}</div>}
    </div>
  );
};

export default RecordingComp;