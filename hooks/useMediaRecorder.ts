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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkIndexRef = useRef<number>(0);
  const isFinalizingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  const isVideoMode = mediaType !== 'AUDIO' && mediaType !== 'AUDIO_ONLY';

  // Release stream tracks
  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  // Clear timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Full cleanup
  const cleanup = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    cleanupStream();
    setStatus('idle');
  }, [cleanupStream, stopTimer]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Start timer interval
  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);

  // Start Recording with 30s chunks
  const startRecording = useCallback(
    async (customStream?: MediaStream) => {
      try {
        setError(null);
        let activeStream = customStream || streamRef.current;

        // Obtain media stream if not provided
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

        const mimeType = getSupportedMimeType(isVideoMode);
        const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

        const recorder = new MediaRecorder(activeStream, options);
        mediaRecorderRef.current = recorder;
        chunkIndexRef.current = 0;
        isFinalizingRef.current = false;
        setChunkIndex(0);
        setElapsedTime(0);

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            const currentIdx = chunkIndexRef.current;
            chunkIndexRef.current += 1;
            setChunkIndex(chunkIndexRef.current);

            const isFinal = isFinalizingRef.current;
            if (onChunkReady) {
              onChunkReady(event.data, currentIdx, isFinal);
            }
          }
        };

        recorder.onerror = (evt: Event) => {
          const err = new Error('MediaRecorder execution error');
          setError(err.message);
          setStatus('error');
          if (onError) onError(err);
        };

        // Start timeslice chunking every chunkDurationMs (30s)
        recorder.start(chunkDurationMs);
        setStatus('recording');
        startTimer();
      } catch (err: any) {
        const message = err?.message || 'Failed to start media recorder';
        setError(message);
        setStatus('error');
        if (onError) onError(err);
        cleanup();
      }
    },
    [isVideoMode, chunkDurationMs, onChunkReady, onError, startTimer, cleanup]
  );

  // Pause Recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setStatus('paused');
    }
  }, [stopTimer]);

  // Resume Recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      setStatus('recording');
    }
  }, [startTimer]);

  // Stop Recording
  const stopRecording = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      stopTimer();
      isFinalizingRef.current = true;

      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setStatus('stopped');
        cleanupStream();
        resolve();
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        setStatus('stopped');
        cleanupStream();
        resolve();
      };

      try {
        // Requests any remaining buffer to fire in ondataavailable as final chunk
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      } catch (e) {
        setStatus('stopped');
        cleanupStream();
        resolve();
      }
    });
  }, [stopTimer, cleanupStream]);

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
