"use client";
import { RefObject } from "react";
import { VideoOff } from "lucide-react";

interface Props {
  youtubeUrl: string | null | undefined;
  /** ref passed in from ReportShell for timestamp-seeking on <video> elements */
  videoRef?: RefObject<HTMLVideoElement | null>;
  className?: string;
}

/**
 * Renders the assessment recording.
 *
 * Recording URL is stored in assessment.youtube_url (confirmed: Text column in ai_prep_assessment).
 * The field is named youtube_url but can hold any public streaming URL:
 *  - YouTube watch URL  → https://youtube.com/watch?v=VIDEO_ID
 *  - YouTube embed URL  → https://youtube.com/embed/VIDEO_ID
 *  - Any other URL      → rendered as HTML5 <video> for timestamp-seeking
 *
 * Note: For YouTube URLs, timestamp seeking via JS is NOT possible due to the
 * YouTube iframe API sandboxing — so we fall back to an <iframe> embed.
 * For non-YouTube URLs (direct media) we use <video> + the shared videoRef.
 */
function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    // https://www.youtube.com/watch?v=ID
    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }
    // https://youtu.be/ID
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    // already an embed URL: https://www.youtube.com/embed/ID
    if (parsed.hostname.includes("youtube.com") && parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.replace("/embed/", "").split("/")[0] || null;
    }
  } catch {
    // invalid URL
  }
  return null;
}

export default function VideoPlayer({ youtubeUrl, videoRef, className }: Props) {
  if (!youtubeUrl || !youtubeUrl.trim() || youtubeUrl.trim().toLowerCase() === "null" || youtubeUrl.trim().toLowerCase() === "undefined") {
    return (
      <div className={`flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg bg-slate-100 text-slate-400 ${className ?? ""}`}>
        <VideoOff size={28} />
        <p className="text-sm font-medium">Recording unavailable</p>
      </div>
    );
  }

  const ytId = extractYoutubeId(youtubeUrl);

  if (ytId) {
    // YouTube embed — no JS seeking possible; use iframe
    return (
      <div className={`relative w-full overflow-hidden rounded-lg bg-black ${className ?? ""}`} style={{ paddingTop: "56.25%" }}>
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

  // Direct media URL or HTML5 video player with controls matching candidate recording
  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-black flex items-center justify-center ${className ?? ""}`}>
      <video
        ref={videoRef as RefObject<HTMLVideoElement>}
        src={youtubeUrl || undefined}
        controls
        playsInline
        preload="metadata"
        className="w-full h-auto max-h-[340px] rounded-lg bg-black object-cover"
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}
