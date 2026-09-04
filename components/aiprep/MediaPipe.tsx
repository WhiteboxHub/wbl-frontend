'use client';

/**
 * MediaPipe Vision Telemetry Component (Client-Side Browser WASM)
 * Powered by MediaPipe Face Landmarker & Pose Landmarker.
 * Replaces legacy stub while providing backward-compatible YOLOAnalyzer alias export.
 */

import React, { useEffect, useRef } from 'react';
import { useMediaPipeVision, type VideoTelemetry } from '@/hooks/useMediaPipeVision';

export interface MediaPipeVisionAnalyzerProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  isRecording?: boolean;
  enabled?: boolean;
  assessmentId?: number;
  onTelemetryUpdate?: (telemetry: Partial<VideoTelemetry>) => void;
  onFaceStatusChange?: (status: { faceDetected: boolean; isStraight: boolean }) => void;
  showOverlay?: boolean;
}

export function MediaPipeVisionAnalyzer({
  videoRef,
  isRecording = false,
  enabled = false,
  assessmentId,
  onTelemetryUpdate,
  onFaceStatusChange,
  showOverlay = false,
}: MediaPipeVisionAnalyzerProps) {
  const activeRecording = isRecording || enabled;
  const { isReady, detectVideoFrame, realtimeTelemetry, getFinalTelemetry } = useMediaPipeVision(videoRef);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeRecording || !videoRef?.current || !isReady) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const videoEl = videoRef.current;

    const processLoop = (timestamp: number) => {
      if (videoEl && !videoEl.paused && !videoEl.ended) {
        detectVideoFrame(videoEl, timestamp);
      }
      animFrameIdRef.current = requestAnimationFrame(processLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(processLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [activeRecording, videoRef, isReady, detectVideoFrame]);

  const faceDetected = realtimeTelemetry
    ? (realtimeTelemetry.face_visible_pct ?? 0) > 0 || (realtimeTelemetry.face_visibility_pct ?? 0) > 0
    : false;
  const isProperlySeated = faceDetected && (realtimeTelemetry?.is_instant_straight ?? false);

  useEffect(() => {
    if (realtimeTelemetry && onTelemetryUpdate) {
      onTelemetryUpdate(realtimeTelemetry);
    }
    if (realtimeTelemetry && onFaceStatusChange) {
      onFaceStatusChange({
        faceDetected,
        isStraight: isProperlySeated,
        ...(isProperlySeated
          ? { isProperlySeated: true, message: '' }
          : { isProperlySeated: false, message: 'Please sit properly in front of the camera' }),
      } as any);
    }
  }, [realtimeTelemetry, faceDetected, isProperlySeated, onTelemetryUpdate, onFaceStatusChange]);

  return (
    <div
      className={`absolute inset-0 z-20 pointer-events-none rounded-2xl border-4 transition-colors duration-300 ${
        isProperlySeated
          ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
          : 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5)]'
      }`}
    />
  );
}

// Backward-compatibility alias export for legacy component imports
export const YOLOAnalyzer = MediaPipeVisionAnalyzer;

export default MediaPipeVisionAnalyzer;
