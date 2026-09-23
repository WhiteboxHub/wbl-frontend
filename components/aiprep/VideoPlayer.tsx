"use client";

import React, { useState, useEffect, useRef, RefObject, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  AudioWaveform,
  VideoOff,
  Mic,
  Maximize2,
  AlertCircle,
} from "lucide-react";

interface Props {
  youtubeUrl?: string | null | undefined;
  /** ref passed in from ReportShell for timestamp-seeking on <video> or <audio> elements */
  videoRef?: RefObject<HTMLVideoElement | null>;
  className?: string;
  isAudioOnly?: boolean;
  candidateName?: string;
  durationSeconds?: number;
  onSeek?: (seconds: number) => void;
}

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    if (parsed.hostname.includes("youtube.com") && parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.replace("/embed/", "").split("/")[0] || null;
    }
  } catch {
    // invalid URL
  }
  return null;
}

function fmtTime(sec: number): string {
  if (isNaN(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// 32-bar visualizer heights pattern simulating candidate speech cadence
const WAVEFORM_BARS = [
  25, 40, 65, 30, 85, 95, 60, 45, 75, 90, 100, 70, 55, 80, 95, 40,
  30, 60, 85, 95, 75, 50, 80, 100, 65, 45, 90, 70, 55, 80, 40, 25,
];

export default function VideoPlayer({
  youtubeUrl,
  videoRef,
  className,
  isAudioOnly = false,
  candidateName,
  durationSeconds = 0,
  onSeek,
}: Props) {
  const ytId = !isAudioOnly && youtubeUrl ? extractYoutubeId(youtubeUrl) : null;

  // Local media reference (points to either passed videoRef or internal ref)
  const localMediaRef = useRef<HTMLMediaElement | null>(null);
  // mediaEl as state ensures the event-listener effect re-runs after the element mounts
  const [mediaEl, setMediaEl] = useState<HTMLMediaElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds > 0 ? durationSeconds : 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [hasMediaError, setHasMediaError] = useState(false);

  // Reset playback and error states when media URL changes
  useEffect(() => {
    setHasMediaError(false);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [youtubeUrl]);

  // Sync internal duration if durationSeconds prop updates
  // Fix #6: setDuration is a stable setter — not a valid dep, removing it avoids lint noise
  useEffect(() => {
    if (durationSeconds && durationSeconds > 0) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  // Attach internal ref + state so seekTo() from parent works and effect re-runs on mount
  const setCombinedRef = useCallback((node: HTMLMediaElement | null) => {
    localMediaRef.current = node;
    setMediaEl(node);
    if (videoRef) {
      (videoRef as React.MutableRefObject<any>).current = node;
    }
  }, [videoRef]);

  // Video or Audio time tracking — depends on mediaEl state so it re-runs after mount
  useEffect(() => {
    if (!mediaEl) return;

    const handleTimeUpdate = () => {
      setCurrentTime(mediaEl.currentTime);
      if (mediaEl.duration && !isNaN(mediaEl.duration) && isFinite(mediaEl.duration)) {
        setDuration(mediaEl.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Use the closed-over `mediaEl` (not localMediaRef.current) so we always
      // reset the exact element this effect instance is managing — avoids a race
      // condition where localMediaRef.current has already advanced to a new node.
      mediaEl.currentTime = 0;
    };
    const handleError = () => {
      setHasMediaError(true);
    };

    mediaEl.addEventListener("timeupdate", handleTimeUpdate);
    mediaEl.addEventListener("play", handlePlay);
    mediaEl.addEventListener("pause", handlePause);
    mediaEl.addEventListener("ended", handleEnded);
    mediaEl.addEventListener("error", handleError);

    return () => {
      mediaEl.removeEventListener("timeupdate", handleTimeUpdate);
      mediaEl.removeEventListener("play", handlePlay);
      mediaEl.removeEventListener("pause", handlePause);
      mediaEl.removeEventListener("ended", handleEnded);
      mediaEl.removeEventListener("error", handleError);
    };
  }, [mediaEl]);

  // When media loading fails, ensure playing state is stopped
  useEffect(() => {
    if (hasMediaError) {
      setIsPlaying(false);
    }
  }, [hasMediaError]);

  const togglePlay = () => {
    if (hasMediaError) return;
    const el = localMediaRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
    } else {
      el.play().catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasMediaError) return;
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    const el = localMediaRef.current;
    if (el) {
      el.currentTime = val;
    }
    if (onSeek) onSeek(val);
  };

  const toggleMute = () => {
    const el = localMediaRef.current;
    const next = !isMuted;
    setIsMuted(next);
    if (el) {
      el.muted = next;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    const el = localMediaRef.current;
    if (el) {
      el.volume = val;
      el.muted = val === 0;
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    const el = localMediaRef.current;
    if (el) {
      el.playbackRate = next;
    }
  };

  const handleRestart = () => {
    if (hasMediaError) return;
    setCurrentTime(0);
    const el = localMediaRef.current;
    if (el) {
      el.currentTime = 0;
      el.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  // ── 1. YouTube Embed Mode ──────────────────────────────────────────────────
  if (ytId) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-black shadow-sm ${className ?? ""}`}
        style={{ paddingTop: "56.25%" }}
      >
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
          title="Assessment recording"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // ── 2. Standard Video Mode (when media is Video and has valid URL) ──────────
  // Use a positive file-type check rather than substring exclusion to avoid
  // false negatives when the URL contains 'audio' in non-extension segments
  // (e.g. 's3.amazonaws.com/audio-prep-videos/video.mp4').
  // Uses URL.pathname + hostname to strip query params first, so presigned
  // S3/CDN URLs and YouTube URLs without file extensions are matched correctly.
  // Fix #1: YouTube URLs are already handled by the early-return on L220 (ytId branch),
  // so the YouTube hostname guards here were unreachable dead code — removed.
  // Fix #2: short-circuit the IIFE when isAudioOnly=true so we never run new URL()
  // unnecessarily (it was throwing + swallowing an error on every audio-only render).
  const isVideoFile =
    !isAudioOnly &&
    youtubeUrl &&
    (() => {
      try {
        const pathname = new URL(youtubeUrl).pathname.toLowerCase();
        return (
          pathname.endsWith(".mp4") ||
          pathname.endsWith(".webm") ||
          pathname.includes("/playback")
        );
      } catch {
        // Fallback for relative or non-standard URLs the URL constructor rejects
        const lower = youtubeUrl.toLowerCase();
        return (
          lower.includes(".mp4") ||
          lower.includes(".webm") ||
          lower.includes("/playback")
        );
      }
    })();
  if (!isAudioOnly && youtubeUrl && isVideoFile) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 shadow-sm ${className ?? ""}`}
      >
        {hasMediaError ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center gap-2 text-center">
            <VideoOff size={28} className="text-rose-400" />
            <span className="text-xs font-semibold text-rose-300">
              Failed to load video recording
            </span>
            <span className="text-[11px] text-slate-400">
              The video asset could not be accessed or has expired.
            </span>
          </div>
        ) : (
          <video
            ref={setCombinedRef as any}
            src={youtubeUrl}
            controls
            playsInline
            preload="metadata"
            onError={() => setHasMediaError(true)}
            className="w-full h-auto max-h-[300px] rounded-xl bg-black object-cover"
          >
            Your browser does not support video playback.
          </video>
        )}
      </div>
    );
  }

  // ── 3. Rich Audio Recording Playback Player ────────────────────────────────
  // Shown for AUDIO assessments or when video recording is audio-only
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={`relative w-full rounded-xl bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-5 border border-slate-800 shadow-md overflow-hidden min-h-[260px] select-none ${className ?? ""}`}
    >
      {/* Background ambient gradient */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden audio/media element for native audio playback */}
      {youtubeUrl && (
        <audio
          ref={setCombinedRef as any}
          src={youtubeUrl}
          preload="auto"
          onError={() => setHasMediaError(true)}
          className="hidden"
        />
      )}

      {/* Top Bar: Title & Status Indicator */}
      <div className="flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <Mic size={14} className={isPlaying ? "animate-pulse text-blue-300" : ""} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-100 tracking-tight block">
              {candidateName ? `${candidateName}'s Recording` : "Audio Recording"}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              Candidate Spoken Audio Track
            </span>
          </div>
        </div>

        {hasMediaError ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-700/60">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[10px] font-mono font-semibold text-rose-300">
              UNAVAILABLE
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            <span className="text-[10px] font-mono font-semibold text-slate-300">
              {isPlaying ? "PLAYING" : "PAUSED"}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Dynamic Interactive Audio Waveform Visualization or Error Notice */}
      {hasMediaError ? (
        <div className="my-3 py-3 px-4 rounded-lg bg-rose-950/20 border border-rose-900/40 flex flex-col items-center justify-center gap-1 h-20 text-center z-10">
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
            <AlertCircle size={14} />
            <span>Failed to load media recording</span>
          </div>
          <span className="text-[11px] text-slate-400">
            The audio asset could not be accessed or has expired.
          </span>
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="my-3 py-3 px-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-1 sm:gap-1.5 h-20 cursor-pointer z-10 transition-colors hover:bg-slate-900"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            const seekTime = ratio * duration;
            setCurrentTime(seekTime);
            const el = localMediaRef.current;
            if (el && !hasMediaError) el.currentTime = seekTime;
            if (onSeek) onSeek(seekTime);
          }}
          title="Click anywhere to jump to timestamp"
        >
          {WAVEFORM_BARS.map((baseHeight, idx) => {
            const barFraction = idx / WAVEFORM_BARS.length;
            const isPassed = barFraction <= progressPercent / 100;
            const isCurrent =
              Math.abs(barFraction - progressPercent / 100) < 1 / WAVEFORM_BARS.length;

            // Subtle pulse variance when playing
            const dynamicHeight = isPlaying
              ? Math.max(15, Math.min(100, baseHeight + ((idx % 3) - 1) * 12))
              : baseHeight;

            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isPassed
                    ? "bg-gradient-to-t from-blue-500 to-indigo-400 shadow-xs shadow-blue-500/20"
                    : "bg-slate-700/50 hover:bg-slate-600"
                } ${isCurrent && isPlaying ? "scale-y-110" : ""}`}
                style={{ height: `${dynamicHeight}%` }}
              />
            );
          })}
        </div>
      )}

      {/* Bottom Bar: Interactive Controls & Timeline */}
      <div className="space-y-2 z-10">
        {/* Progress Slider */}
        <div className="relative flex items-center group">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            disabled={hasMediaError}
            onChange={handleSeekChange}
            className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-blue-500 focus:outline-none transition-all ${
              hasMediaError ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            style={{
              background: `linear-gradient(to right, #3b82f6 ${progressPercent}%, #334155 ${progressPercent}%)`,
            }}
          />
        </div>

        {/* Control Buttons & Indicators */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Left: Play/Pause & Restart */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={hasMediaError}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${
                hasMediaError
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 shadow-none"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95 cursor-pointer"
              }`}
              title={
                hasMediaError
                  ? "Media recording unavailable"
                  : isPlaying
                  ? "Pause playback"
                  : "Play recording"
              }
            >
              {isPlaying ? (
                <Pause size={16} className="fill-white" />
              ) : (
                <Play
                  size={16}
                  className={hasMediaError ? "fill-slate-500 ml-0.5" : "fill-white ml-0.5"}
                />
              )}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              disabled={hasMediaError}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                hasMediaError
                  ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              }`}
              title={hasMediaError ? "Media recording unavailable" : "Restart from beginning"}
            >
              <RotateCcw size={13} />
            </button>

            {/* Time Counter */}
            <div className="font-mono text-xs text-slate-300 font-semibold tracking-tight ml-1">
              <span>{fmtTime(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-400">{fmtTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume & Speed Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Speed Toggle */}
            <button
              type="button"
              onClick={cycleSpeed}
              className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 transition-colors cursor-pointer"
              title="Change playback speed"
            >
              {speed}x
            </button>

            {/* Volume Toggle & Slider */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hidden sm:block"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
