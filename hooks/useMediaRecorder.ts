'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface UseMediaRecorderOptions {
  mediaType?: 'VIDEO' | 'AUDIO' | string;
  chunkDurationMs?: number; // default 30000 (30 seconds)
  onChunkReady?: (blob: Blob, chunkIndex: number, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

export interface UseMediaRecorderReturn {
  status: RecordingStatus;
  stream: MediaStream | null;
  elapsedTime: number; // in seconds
  chunkIndex: number;
  error: string | null;
  startRecording: (customStream?: MediaStream) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<void>;
  cleanup: () => void;
}

/**
 * Determine supported MIME type for recording.
 * Priority: WebM (VP8/Opus) -> WebM -> MP4
 */
function getSupportedMimeType(isVideo: boolean): string {
  if (typeof window === 'undefined') return '';

  if (isVideo) {
    const videoTypes = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
    ];
    for (const t of videoTypes) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  const audioTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const t of audioTypes) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
}

export function useMediaRecorder({
  mediaType = 'VIDEO',
  chunkDurationMs = 30000,
  onChunkReady,
  onError,
}: UseMediaRecorderOptions = {}): UseMediaRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [chunkIndex, setChunkIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);    // 1-second elapsed time ticker
  const chunkSliceTimerRef = useRef<NodeJS.Timeout | null>(null); // 30-second chunk-slice timer
  const chunkIndexRef = useRef<number>(0);
  const isFinalizingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const stopResolveRef = useRef<(() => void) | null>(null); // resolves stopRecording() promise

  const isVideoMode = mediaType !== 'AUDIO' && mediaType !== 'AUDIO_ONLY';

  // ─── Stream helpers ────────────────────────────────────────────────────────
  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const clearChunkSliceTimer = useCallback(() => {
    if (chunkSliceTimerRef.current) {
      clearTimeout(chunkSliceTimerRef.current);
      chunkSliceTimerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopElapsedTimer();
    clearChunkSliceTimer();
    isFinalizingRef.current = true; // Prevent onstop from restarting a new segment
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    cleanupStream();
    setStatus('idle');
  }, [cleanupStream, stopElapsedTimer, clearChunkSliceTimer]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startElapsedTimer = useCallback(() => {
    stopElapsedTimer();
    elapsedTimerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, [stopElapsedTimer]);

  // ─── Core: per-segment recorder ────────────────────────────────────────────
  /**
   * Creates and starts a single MediaRecorder segment on the given stream.
   *
   * IMPORTANT — WHY stop/restart instead of timeslice (recorder.start(30000)):
   *
   * Browser MediaRecorder timeslice mode:
   *   chunk_0 → [EBML header] + [Tracks] + [Cluster @ 0s]    ← complete WebM
   *   chunk_1 → [Cluster @ 30s]                               ← raw data, NO header
   *   chunk_2 → [Cluster @ 60s]                               ← raw data, NO header
   *
   * When the backend runs  cat chunk_*.webm | ffmpeg -f webm -i pipe:0 audio.wav
   * FFmpeg hits non-monotonic cluster timestamps at every 30s boundary and drops
   * those frames — the root cause of 20-25s of missing speech per boundary.
   *
   * stop/restart mode:
   *   chunk_0 → [EBML header] + [Tracks] + [Cluster 0-30s]   ← complete standalone WebM
   *   chunk_1 → [EBML header] + [Tracks] + [Cluster 0-30s]   ← complete standalone WebM
   *   chunk_2 → [EBML header] + [Tracks] + [Cluster 0-30s]   ← complete standalone WebM
   *
   * Each chunk is decoded independently by FFmpeg with zero boundary frame loss.
   * The clean decoded audio (16kHz mono WAV) from each chunk is concatenated on
   * the backend for a complete, gap-free transcript.
   */
  const startSegment = useCallback(
    (activeStream: MediaStream) => {
      if (!activeStream || !activeStream.active) return;

      const mimeType = getSupportedMimeType(isVideoMode);
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(activeStream, options);
      } catch (err: any) {
        const message = err?.message || 'Failed to create MediaRecorder';
        setError(message);
        setStatus('error');
        if (onError) onError(err);
        return;
      }

      mediaRecorderRef.current = recorder;

      // ondataavailable fires once when recorder.stop() is called.
      // event.data is the COMPLETE, self-contained WebM blob for this segment.
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          const currentIdx = chunkIndexRef.current;
          chunkIndexRef.current += 1;
          setChunkIndex(chunkIndexRef.current);

          const isFinal = isFinalizingRef.current;
          console.log(
            `[MediaRecorder] Segment #${currentIdx} complete (${Math.round(event.data.size / 1024)} KB, isFinal: ${isFinal})`
          );
          if (onChunkReady) {
            onChunkReady(event.data, currentIdx, isFinal);
          }
        }
      };

      // onstop fires after ondataavailable.
      // If the user has not ended the session, immediately start the next segment.
      recorder.onstop = () => {
        clearChunkSliceTimer();
        if (isFinalizingRef.current) {
          // User clicked "End Session" — resolve the stopRecording() promise.
          setStatus('stopped');
          cleanupStream();
          if (stopResolveRef.current) {
            stopResolveRef.current();
            stopResolveRef.current = null;
          }
        } else if (streamRef.current && streamRef.current.active) {
          // Auto-slice: chain immediately into the next 30-second segment.
          startSegment(streamRef.current);
        }
      };

      recorder.onerror = () => {
        const err = new Error('MediaRecorder execution error');
        setError(err.message);
        setStatus('error');
        if (onError) onError(err);
      };

      // Start with NO timeslice — the recorder captures continuously until stop().
      // stop() causes the browser to finalise the WebM container properly.
      recorder.start();

      // Schedule the auto-stop after chunkDurationMs to slice the next chunk.
      chunkSliceTimerRef.current = setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === 'recording' &&
          !isFinalizingRef.current
        ) {
          mediaRecorderRef.current.stop(); // triggers ondataavailable → onstop → startSegment
        }
      }, chunkDurationMs);
    },
    [isVideoMode, chunkDurationMs, onChunkReady, onError, cleanupStream, clearChunkSliceTimer]
  );

  // ─── Public API ────────────────────────────────────────────────────────────

  const startRecording = useCallback(
    async (customStream?: MediaStream) => {
      try {
        setError(null);
        let activeStream = customStream || streamRef.current;

        if (!activeStream || !activeStream.active) {
          const constraints: MediaStreamConstraints = isVideoMode
            ? {
                video: {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  frameRate: { ideal: 30 },
                  facingMode: 'user',
                },
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  sampleRate: 44100,
                },
              }
            : {
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  sampleRate: 44100,
                },
              };

          activeStream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = activeStream;
          setStream(activeStream);
        }

        chunkIndexRef.current = 0;
        isFinalizingRef.current = false;
        stopResolveRef.current = null;
        setChunkIndex(0);
        setElapsedTime(0);
        setStatus('recording');
        startElapsedTimer();

        // Kick off the first segment; subsequent segments self-chain via onstop.
        startSegment(activeStream);
      } catch (err: any) {
        const message = err?.message || 'Failed to start media recorder';
        setError(message);
        setStatus('error');
        if (onError) onError(err);
        cleanup();
      }
    },
    [isVideoMode, onError, startElapsedTimer, startSegment, cleanup]
  );

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopElapsedTimer();
      clearChunkSliceTimer(); // Pause the slice timer too
      setStatus('paused');
    }
  }, [stopElapsedTimer, clearChunkSliceTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startElapsedTimer();
      // Give a fresh full chunkDurationMs window after resume
      chunkSliceTimerRef.current = setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === 'recording' &&
          !isFinalizingRef.current
        ) {
          mediaRecorderRef.current.stop();
        }
      }, chunkDurationMs);
      setStatus('recording');
    }
  }, [startElapsedTimer, chunkDurationMs]);

  /**
   * Stops recording and waits for the final chunk to be delivered.
   * Sets isFinalizingRef so that onstop does NOT restart a new segment.
   * The promise resolves only after onstop fires and the final chunk is emitted.
   */
  const stopRecording = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      stopElapsedTimer();
      clearChunkSliceTimer();
      isFinalizingRef.current = true;
      stopResolveRef.current = resolve;

      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setStatus('stopped');
        cleanupStream();
        resolve();
        stopResolveRef.current = null;
        return;
      }

      // stop() → ondataavailable (final blob, isFinal=true) → onstop → resolve()
      mediaRecorderRef.current.stop();
    });
  }, [cleanupStream, stopElapsedTimer, clearChunkSliceTimer]);

  return {
    status,
    stream,
    elapsedTime,
    chunkIndex,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cleanup,
  };
}

export default useMediaRecorder;
