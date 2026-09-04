'use client';

import React, { useRef, useEffect } from 'react';
import { Video, Mic, VideoOff } from 'lucide-react';
import type { RecordingStatus } from '@/hooks/useMediaRecorder';

export interface VideoPreviewProps {
  stream: MediaStream | null;
  status: RecordingStatus;
  mediaType?: 'VIDEO' | 'AUDIO' | string;
  isMirrored?: boolean;
  className?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  stream,
  status,
  mediaType = 'VIDEO',
  isMirrored = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isAudioOnly = mediaType === 'AUDIO' || mediaType === 'AUDIO_ONLY';

  useEffect(() => {
    if (videoRef.current && stream && !isAudioOnly) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isAudioOnly]);

  return (
    <div
      className={`relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center ${className}`}
    >
      {!isAudioOnly && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : isAudioOnly ? (
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-lg">
            <Mic className="w-9 h-9 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Audio-Only Mode</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Your voice is being captured and analyzed in real-time.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-600">
          <VideoOff className="w-12 h-12" />
          <p className="text-sm font-medium">Camera standby</p>
        </div>
      )}

      {/* Floating Status Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        {status === 'recording' ? (
          <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-red-500/40">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-red-400">REC</span>
          </div>
        ) : status === 'paused' ? (
          <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400">PAUSED</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60">
            <Video className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-400">PREVIEW</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreview;
