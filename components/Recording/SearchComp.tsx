"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { debounce } from "lodash";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

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
  const course = searchParams.get("course");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!course) {
      setError("Course parameter is missing from the URL.");
      return;
    }
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchBox(false);
    setSelectedVideo(null);
    setError(null);
  }, [course]);

  useEffect(() => setSelectedVideo(null), [searchQuery]);

  const filterResultsByKeywords = (videos: Video[], query: string): Video[] => {
    if (!query.trim()) return videos;
    
    const keywords = query.toLowerCase().split(/\s+/).filter(keyword => keyword.length > 0);
    
    return videos.filter(video => {
      const searchableText = `
        ${video.description || ''} 
        ${video.batchname || ''} 
        ${video.filename || ''}
        ${video.subject || ''}
      `.toLowerCase();
      
      // Check if ALL keywords are present in the searchable text
      return keywords.every(keyword => searchableText.includes(keyword));
    });
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!course) return;

      if (!query.trim()) {
        setSearchResults([]);
        setShowSearchBox(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const response = await api.get(`/recordings`, {
          params: { course, search: query },
          signal: abortControllerRef.current?.signal,
        });

        const videos: Video[] = response?.data || [];
        
        // Filter the results to only include videos that contain ALL search keywords
        const filteredVideos = filterResultsByKeywords(videos, query);
        
        setSearchResults(filteredVideos);
        setShowSearchBox(filteredVideos.length > 0);
        
        if (filteredVideos.length === 0 && videos.length > 0) {
          setError(`No videos found containing all the keywords: "${query}"`);
        }
      } catch (err: any) {
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }

        const apiError = err.body?.detail || err.body?.message || err.message;
        setError(apiError);
        setSearchResults([]);
        setShowSearchBox(false);
      } finally {
        setLoading(false);
      }
    }, 500),
    [course]
  );

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value || "";
    setSearchQuery(query);

    if (query.trim().length < 3) {
      setSearchResults([]);
      setShowSearchBox(false);
      if (query.length > 0 && query.length < 3) {
        // setError("Please type at least 3 characters to search");
      } else {
        setError(null);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    debouncedSearch(query);
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setShowSearchBox(false);
  };

  const formatVideoTitle = (filename: string) => {
    filename = filename.replace(/class_/gi, "").replace(/class/gi, "");
    filename = filename.replace(/_\d+_/g, "_").replace(/_/g, " ");
    filename = filename.replace(/\.(mp4|wmv|avi|mov|mpg|mkv)$/i, "").trim();

    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    const dateMatch = filename.match(dateRegex);
    if (dateMatch) {
      const date = dateMatch[0];
      const restOfTitle = filename.replace(dateRegex, "").trim();
      return `${date} ${restOfTitle}`;
    }
    return filename;
  };

  // Highlight matching keywords in the search results
  const highlightKeywords = (text: string, query: string) => {
    const keywords = query.toLowerCase().split(/\s+/).filter(keyword => keyword.length > 0);
    let highlightedText = text;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-green-300">$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const renderVideoPlayer = (video: Video) => {
    if (video.link.includes("youtu.be") || video.link.includes("youtube.com")) {
      const youtubeEmbedUrl = `https://www.youtube.com/embed/${video.videoid}`;
      return (
        <iframe
          width="100%"
          height="250"
          src={youtubeEmbedUrl}
          title={video.description}
          frameBorder="0"
          allowFullScreen
          className="rounded-xl border-2 border-gray-500"
        />
      );
    } else {
      return (
        <div>
          <video
            src={video.link}
            controls
            className="mb-2 w-full rounded-xl border-2 border-gray-500"
          />
          <button
            onClick={() => setSelectedVideo(null)}
            className="mt-2 w-full rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
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
        placeholder="Search for videos (e.g., numpy pandas matplotlib)..."
        className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-black dark:bg-white"
      />

      {loading && <p className="text-center text-xl">Loading...</p>}
      {error && <p className="text-red-500 text-sm mt-2">{String(error)}</p>}

      {showSearchBox && searchResults.length > 0 && (
        <div className="mb-4 max-h-60 overflow-y-auto rounded-md bg-gray-100 p-4 dark:text-black">
          <p className="mb-2 text-sm text-gray-600">
            {/* Showing {searchResults.length} videos containing: "{searchQuery}" */}
            Showing {searchResults.length} videos containing: &quot;{searchQuery}&quot;
          </p>
          {searchResults.map((video) => (
            <div
              key={video.id}
              onClick={() => handleVideoSelect(video)}
              className="mb-2 cursor-pointer rounded-md px-3 py-2 hover:bg-primarylight"
            >
              {highlightKeywords(formatVideoTitle(video.description), searchQuery)}
            </div>
          ))}
        </div>
      )}

      {selectedVideo && <div>{renderVideoPlayer(selectedVideo)}</div>}
    </div>
  );
};

export default SearchComp;