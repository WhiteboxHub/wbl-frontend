
"use client";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";

interface Video {
  id: number;
  description: string;
  link: string;
  videoid: string;
  classdate?: string;
}

interface ClassType {
  id: number;
  name: string;
}

const MyRecordings: React.FC = () => {
  const searchParams = useSearchParams();
  const course = searchParams.get("course") as string;

  const [mainOption, setMainOption] = useState<string>("ML");
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [recordings, setRecordings] = useState<Video[]>([]);
  const [isLoadingClassTypes, setIsLoadingClassTypes] = useState(false);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch class types when course loads
  useEffect(() => {
    if (course) {
      setSelectedClassType(null);
      setRecordings([]);
      setSelectedVideo(null);
      setError(null);
      fetchClassTypes();
    }
  }, [course]);

  // Fetch recordings when class type changes
  useEffect(() => {
    if (selectedClassType) {
      setSelectedVideo(null);
      setError(null);
      setRecordings([]);
      fetchRecordings(selectedClassType);
    }
  }, [selectedClassType]);

  // Static class types list
  const fetchClassTypes = async () => {
    setIsLoadingClassTypes(true);
    const fixedClassTypes: ClassType[] = [
      { id: 1, name: "ML" },
      { id: 2, name: "Deep Learning" },
      { id: 3, name: "Software Architecture" },
      { id: 4, name: "Python" },
    ];
    setClassTypes(fixedClassTypes);
    setSelectedClassType(fixedClassTypes[0]);
    setIsLoadingClassTypes(false);
  };

  // Fetch recordings by class type
  const fetchRecordings = async (classType: ClassType) => {
    try {
      setIsLoadingRecordings(true);
      const subject = classType.name.trim();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/my-recordings?name=kumar&subject=${encodeURIComponent(subject)}`
      );

      if (!response.ok) throw new Error("Failed to fetch recordings");

      const data = await response.json();
      const recList = Array.isArray(data.recordings) ? data.recordings : [];

      // Sort by classdate descending (latest first)
      const sortedList = recList.sort((a, b) => {
        const dateA = new Date(a.classdate || 0).getTime();
        const dateB = new Date(b.classdate || 0).getTime();
        return dateB - dateA;
      });

      setRecordings(sortedList);

      if (sortedList.length === 0) {
        setError("No recordings found for this class type.");
      }
    } catch (err) {
      setError("Failed to load recordings. Please try again.");
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  // Handle class type dropdown change
  const handleClassTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = classTypes.find((ct) => ct.id === selectedId);
    if (selected) {
      setSelectedClassType(selected);
      setSelectedVideo(null);
      setError(null);
    }
  };

  // Handle recording dropdown change
  const handleVideoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = recordings.find((rec) => rec.id === selectedId);
    if (selected) {
      setSelectedVideo(selected);
      setError(null);
    } else {
      setError("Selected recording not found.");
    }
  };

  // Format filename for display
  const formatVideoTitle = (filename: string) => {
    if (!filename) return "Untitled";

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

  // Render video player (YouTube or local)
  const renderVideoPlayer = (video: Video) => {
    if (!video.link) return null;

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

  return (
    <div className="mx-auto mt-6 max-w-full flex-grow space-y-4 sm:mt-0 sm:max-w-3xl">
      {/* Dropdown 1: Class Type */}
      <div className="flex flex-grow flex-col">
        <label htmlFor="dropdown1">Class Type:</label>
        <select
          id="dropdown1"
          className="rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
          value={selectedClassType ? selectedClassType.id : ""}
          onChange={handleClassTypeChange}
          disabled={isLoadingClassTypes}
        >
          {isLoadingClassTypes ? (
            <option disabled>Loading class types...</option>
          ) : (
            <>
              <option value="" disabled>
                Please select a class type...
              </option>
              {classTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Dropdown 2: Recordings */}
      <div className="flex flex-grow flex-col justify-between">
        <label htmlFor="dropdown2">Recordings:</label>
        <select
          id="dropdown2"
          className="mb-5 rounded-md border border-gray-300 px-2 py-1 text-black dark:bg-white"
          onChange={handleVideoSelect}
          disabled={!selectedClassType || isLoadingRecordings}
        >
          {isLoadingRecordings ? (
            <option disabled>Loading recordings...</option>
          ) : (
            <>
              <option value="">Please select a recording...</option>
              {recordings.map((recording) => (
                <option key={recording.id} value={recording.id}>
                  {formatVideoTitle(recording.description || recording.link)}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Error message */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Video Player */}
      {selectedVideo && <div>{renderVideoPlayer(selectedVideo)}</div>}
    </div>
  );
};

export default MyRecordings;
