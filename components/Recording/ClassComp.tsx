
"use client";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

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
  const course = (searchParams.get("course") as string) || "";

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [recordings, setRecordings] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch batches when course changes
  useEffect(() => {
    if (!course) return;
    setSelectedBatch(null);
    setRecordings([]);
    setSelectedVideo(null);
    setError(null);
    fetchBatches(course);
  }, [course]);

  // Fetch recordings when batch changes
  useEffect(() => {
    if (!selectedBatch) {
      setRecordings([]);
      setSelectedVideo(null);
      return;
    }
    fetchRecordings(selectedBatch.batchid);
  }, [selectedBatch]);

  // Fetch batches
  const fetchBatches = async (courseParam: string) => {
    try {
      setIsLoadingBatches(true);
      setError(null);

      const res = await apiFetch(`/batches?course=${encodeURIComponent(courseParam)}`);
      const data = res?.data ?? res;

      let batchList: Batch[] =
        Array.isArray(data)
          ? data
          : Array.isArray(data.batches)
          ? data.batches
          : Array.isArray(data.results)
          ? data.results
          : [];

      if (!batchList.length) {
        throw new Error("No batches found for this course.");
      }

      // Always include Kumar Recordings (batchid 99999)
      if (!batchList.some((b) => b.batchid === 99999)) {
        batchList.push({ batchname: "Kumar Recordings", batchid: 99999 });
      }

      // Move Kumar to the end
      const kumarBatch = batchList.find((b) => b.batchid === 99999)!;
      const normalBatches = batchList.filter((b) => b.batchid !== 99999);
      const finalBatchList = [...normalBatches, kumarBatch];

      setBatches(finalBatchList);

      // Default selection: first normal batch
      const defaultBatch = normalBatches[0] || kumarBatch;
      setSelectedBatch(defaultBatch);
    } catch (err: any) {
      console.error("Error fetching batches:", err);
      const msg = err?.body || err?.message || "Failed to load batches.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  // Fetch recordings
  const fetchRecordings = async (batchid: number) => {
    try {
      setIsLoadingRecordings(true);
      setError(null);

      const res = await apiFetch(
        `/recording?course=${encodeURIComponent(course)}&batchid=${encodeURIComponent(String(batchid))}`
      );
      const data = res?.data ?? res;

      const recList: Video[] =
        Array.isArray(data)
          ? data
          : Array.isArray(data.batch_recordings)
          ? data.batch_recordings
          : Array.isArray(data.recordings)
          ? data.recordings
          : Array.isArray(data.results)
          ? data.results
          : [];

      if (!recList.length) {
        setRecordings([]);
        setError("No recordings found for this batch.");
        return;
      }

      setRecordings(recList);
    } catch (err: any) {
      console.error("Error fetching recordings:", err);
      const msg = err?.body || err?.message || "Failed to load recordings.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const batch = batches.find((b) => b.batchid === selectedId) || null;
    setSelectedBatch(batch);
    setSelectedVideo(null);
    setError(batch ? null : "Selected batch not found.");
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const video = recordings.find((v) => v.id === selectedId) || null;
    setSelectedVideo(video);
    setError(video ? null : "Selected recording not found.");
  };

  const formatVideoTitle = (filename: string) => {
    let title = filename
      .replace(/class_/gi, "")
      .replace(/class/gi, "")
      .replace(/_\d+_/g, "_")
      .replace(/_/g, " ")
      .replace(/\.(mp4|wmv|avi|mov|mpg|mkv)$/i, "")
      .trim();

    const dateMatch = title.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      const date = dateMatch[0];
      const rest = title.replace(/\d{4}-\d{2}-\d{2}/, "").trim();
      return `${date} ${rest}`;
    }
    return title;
  };

  const renderVideoPlayer = (video: Video) => {
    if (!video) return null;
    if (video.link.includes("youtu.be") || video.link.includes("youtube.com")) {
      const youtubeEmbedUrl = `https://www.youtube.com/embed/${video.videoid}`;
      return (
        <iframe
          width="100%"
          height="350"
          src={youtubeEmbedUrl}
          title={video.description}
          frameBorder="0"
          allowFullScreen
          className="h-[350px] rounded-xl border-2 border-gray-500"
        />
      );
    }
    return (
      <video
        src={video.link}
        controls
        className="mb-2 w-full rounded-xl border-2 border-gray-500"
      />
    );
  };

  return (
    <div className="mx-auto mt-6 max-w-full flex-grow space-y-4 sm:max-w-3xl">
      {/* Batch Dropdown */}
      <div className="flex flex-col">
        <label htmlFor="batchSelect">Batch:</label>
        <select
          id="batchSelect"
          className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
          value={selectedBatch?.batchid || ""}
          onChange={handleBatchChange}
          disabled={isLoadingBatches}
        >
          {isLoadingBatches ? (
            <option disabled>Loading batches...</option>
          ) : (
            <>
              <option value="" disabled>
                Please select a batch...
              </option>
              {batches.map((b) => (
                <option key={b.batchid} value={b.batchid}>
                  {b.batchid === 99999 ? "Kumar Recordings" : b.batchname}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Recording Dropdown */}
      <div className="flex flex-col">
        <label htmlFor="recordingSelect">Recordings:</label>
        <select
          id="recordingSelect"
          className="mb-5 rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
          onChange={handleVideoSelect}
          disabled={!selectedBatch || isLoadingRecordings}
        >
          {isLoadingRecordings ? (
            <option disabled>Loading recordings...</option>
          ) : (
            <>
              <option value="">Please select a recording...</option>
              {recordings.map((r) => (
                <option key={r.id} value={r.id}>
                  {formatVideoTitle(r.description || r.filename )}
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
