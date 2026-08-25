'use client';

import React, { useRef, useEffect, useState, memo } from 'react';
import {
  IconMicrophone,
  IconUser,
} from '@tabler/icons-react';

export interface VideoPreviewProps {
  stream?: MediaStream | null;
  playbackUrl?: string | null;
  playbackBlob?: Blob | null;
  isAudioOnly?: boolean;
  candidateName?: string;
  isMirrored?: boolean;
  className?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = memo(({
  stream = null,
  playbackUrl = null,
  playbackBlob = null,
  isAudioOnly = false,
  candidateName = 'Candidate',
  isMirrored = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isVideoTrackLive, setIsVideoTrackLive] = useState<boolean>(true);

  const isPlaybackMode = Boolean(playbackUrl || playbackBlob);

  useEffect(() => {
    if (!stream) {
      setIsVideoTrackLive(false);
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      setIsVideoTrackLive(false);
      return;
    }

    setIsVideoTrackLive(videoTrack.enabled && videoTrack.readyState === 'live');

    const handleTrackChange = () => {
      setIsVideoTrackLive(videoTrack.enabled && videoTrack.readyState === 'live');
    };

    videoTrack.addEventListener('mute', handleTrackChange);
    videoTrack.addEventListener('unmute', handleTrackChange);
    videoTrack.addEventListener('ended', handleTrackChange);

    return () => {
      videoTrack.removeEventListener('mute', handleTrackChange);
      videoTrack.removeEventListener('unmute', handleTrackChange);
      videoTrack.removeEventListener('ended', handleTrackChange);
    };
  }, [stream]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream && !isPlaybackMode) {
      videoElement.srcObject = stream;
      videoElement.muted = true;
      videoElement.play().catch(() => {});
    }

    return () => {
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject = null;
      }
    };
  }, [stream, isPlaybackMode]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (playbackBlob) {
      const url = URL.createObjectURL(playbackBlob);
      blobUrlRef.current = url;
      videoElement.srcObject = null;
      videoElement.src = url;
      videoElement.muted = false;
    } else if (playbackUrl) {
      videoElement.srcObject = null;
      videoElement.src = playbackUrl;
      videoElement.muted = false;
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [playbackBlob, playbackUrl]);

  const showPlaceholder = isAudioOnly || (!isVideoTrackLive && !isPlaybackMode);

  return (
    <div
      role="region"
      aria-label="Camera feed preview"
      className={`relative w-full aspect-video bg-gray-900 dark:bg-[#121723] rounded-2xl overflow-hidden border border-gray-300 dark:border-[#333756] shadow-xl flex items-center justify-center ${className}`}
    >
      <video
        ref={videoRef}
        playsInline
        autoPlay={!isPlaybackMode}
        muted={!isPlaybackMode}
        controls={isPlaybackMode}
        className={`w-full h-full object-cover transition-transform ${
          isMirrored && !isPlaybackMode ? '-scale-x-100' : ''
        } ${showPlaceholder ? 'hidden' : 'block'}`}
      />

      {showPlaceholder && (
        <div className="flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400 p-6 text-center">
          <div className="relative w-20 h-20 rounded-full bg-gray-200 dark:bg-[#1D2144] border border-gray-300 dark:border-[#333756] flex items-center justify-center shadow-inner">
            <IconUser className="w-10 h-10 text-gray-400 dark:text-gray-400" aria-hidden="true" />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-primary rounded-full border-2 border-white dark:border-[#121723] shadow">
              <IconMicrophone className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{candidateName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isAudioOnly ? 'Audio Only Mode' : 'Camera inactive'}
            </p>
          </div>
        </div>
      )}

      {!isPlaybackMode && stream && isVideoTrackLive && !isAudioOnly && (
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-black/60 dark:bg-[#121723]/80 backdrop-blur-md rounded-lg border border-white/10 dark:border-[#333756] text-[11px] font-medium text-white shadow">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE</span>
        </div>
      )}
    </div>
  );
});

VideoPreview.displayName = 'VideoPreview';
