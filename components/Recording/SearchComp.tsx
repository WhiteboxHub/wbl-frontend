"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { debounce } from "lodash";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api.js";

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
  const course = (searchParams.get("course") as string) || "";

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showSearchBox, setShowSearchBox] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use AbortController to cancel in-flight fetches
  const controllerRef = useRef<AbortController | null>(null);

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

  // Reset selectedVideo when searchQuery changes
  useEffect(() => {
    setSelectedVideo(null);
  }, [searchQuery]);

  // Cleanup on unmount: abort any pending request
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      // cancel debounced calls
      debouncedSearch.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSearch = async (query: string, signal?: AbortSignal) => {
    if (!course) {
      setError("Course parameter missing.");
      setSearchResults([]);
      setShowSearchBox(false);
      setLoading(false);
      return;
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const res = await apiFetch(`/recording?course=${encodeURIComponent(course)}&search=${encodedQuery}`, { signal });
      const data = res?.data ?? res;

      // Normalize shapes: server might return {batch_recordings: [...]}, {recordings: [...]}, or raw array
      let filteredVideos: Video[] = [];
      if (Array.isArray(data)) filteredVideos = data as Video[];
      else if (Array.isArray(data?.batch_recordings)) filteredVideos = data.batch_recordings;
      else if (Array.isArray(data?.recordings)) filteredVideos = data.recordings;
      else if (Array.isArray(data?.results)) filteredVideos = data.results;

      setSearchResults(filteredVideos);
      setShowSearchBox(filteredVideos.length > 0);
      setError(null);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // request was aborted — ignore
        return;
      }
      // apiFetch throws Error(...) where message contains response text when non-OK
      const msg = err?.body || err?.message || "An error occurred while searching";
      setError(String(msg));
      setSearchResults([]);
      setShowSearchBox(false);
    } finally {
      setLoading(false);
    }
  };

  // debounce wrapper
  // useCallback so debounce instance is stable across renders
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      // Abort any previous in-flight request
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }

      if (!query.trim()) {
        setSearchResults([]);
        setShowSearchBox(false);
        setLoading(false);
        setError(null);
        return;
      }

      const controller = new AbortController();
      controllerRef.current = controller;
      performSearch(query, controller.signal);
    }, 500),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [course]
  );

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value || "";
    setSearchQuery(query);
    setLoading(true);
    // reset selectedVideo (handled by the effect)
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
    if (!video) return null;
    if ((video.link || "").includes("youtu.be") || (video.link || "").includes("youtube.com")) {
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
          />
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
