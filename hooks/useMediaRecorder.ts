'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { AssessmentMode } from '@/lib/aiprep-api';

export interface UseMediaRecorderOptions {
  stream: MediaStream | null;
  mode: AssessmentMode;
  chunkDurationMs?: number;
  onChunkReady: (chunkBlob: Blob, chunkNumber: number) => void;
  onError?: (error: Error) => void;
  onDeviceDisconnected?: () => void;
}

export interface UseMediaRecorderReturn {
  recordingState: 'inactive' | 'recording' | 'paused';
  elapsedSeconds: number;
  chunkCount: number;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<number>;
}

let cachedVideoMime: string | null = null;
let cachedAudioMime: string | null = null;

function resolveSupportedMime(mode: AssessmentMode): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';

  if (mode === 'AUDIO_ONLY') {
    if (cachedAudioMime) return cachedAudioMime;
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    cachedAudioMime = candidates.find(t => MediaRecorder.isTypeSupported(t)) || '';
    return cachedAudioMime;
  }

  if (cachedVideoMime) return cachedVideoMime;
  const candidates = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
    'video/mp4;codecs=avc1,mp4a',
  ];
  cachedVideoMime = candidates.find(t => MediaRecorder.isTypeSupported(t)) || '';
  return cachedVideoMime;
}

export function useMediaRecorder({
  stream,
  mode,
  chunkDurationMs = 30000,
  onChunkReady,
  onError,
  onDeviceDisconnected,
}: UseMediaRecorderOptions): UseMediaRecorderReturn {
  const [recordingState, setRecordingState] = useState<'inactive' | 'recording' | 'paused'>('inactive');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [chunkCount, setChunkCount] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkIndexRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onChunkReadyRef = useRef(onChunkReady);
  const onErrorRef = useRef(onError);
  const onDeviceDisconnectedRef = useRef(onDeviceDisconnected);

  useEffect(() => {
    onChunkReadyRef.current = onChunkReady;
    onErrorRef.current = onError;
    onDeviceDisconnectedRef.current = onDeviceDisconnected;
  });

  useEffect(() => {
    if (!stream) return;

    const handleTrackEnd = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        onDeviceDisconnectedRef.current?.();
      }
    };

    const tracks = stream.getTracks();
    tracks.forEach(track => track.addEventListener('ended', handleTrackEnd));

    return () => {
      tracks.forEach(track => track.removeEventListener('ended', handleTrackEnd));
    };
  }, [stream]);

  const startRecording = useCallback(() => {
    if (!stream || stream.getTracks().length === 0) {
      onErrorRef.current?.(new Error('Active media stream is required to start recording.'));
      return;
    }

    try {
      // Isolate audio tracks in audio-only mode to prevent encoding video frames
      const streamToRecord =
        mode === 'AUDIO_ONLY' ? new MediaStream(stream.getAudioTracks()) : stream;

      const mimeType = resolveSupportedMime(mode);
      const options: MediaRecorderOptions = {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 128000,
        ...(mode === 'VIDEO_AUDIO' ? { videoBitsPerSecond: 1500000 } : {}),
      };

      const recorder = new MediaRecorder(streamToRecord, options);
      chunkIndexRef.current = 0;
      setChunkCount(0);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          const currentIndex = chunkIndexRef.current;
          chunkIndexRef.current += 1;
          setChunkCount(chunkIndexRef.current);
          onChunkReadyRef.current(event.data, currentIndex);
        }
      };

      recorder.onerror = (e: Event) => {
        const err = (e as any).error || new Error('MediaRecorder error occurred');
        onErrorRef.current?.(err);
      };

      recorder.start(chunkDurationMs);
      mediaRecorderRef.current = recorder;
      setRecordingState('recording');
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [stream, mode, chunkDurationMs]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback((): Promise<number> => {
    return new Promise((resolve) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(chunkIndexRef.current);
        return;
      }

      recorder.onstop = () => {
        setRecordingState('inactive');
        resolve(chunkIndexRef.current);
      };

      try {
        recorder.requestData();
        recorder.stop();
      } catch {
        resolve(chunkIndexRef.current);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore cleanup error if already stopped
        }
      }
    };
  }, []);

  return {
    recordingState,
    elapsedSeconds,
    chunkCount,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
