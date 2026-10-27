'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type AudioRecordingStatus = 'idle' | 'recording' | 'paused' | 'interrupted' | 'stopped' | 'error';

export interface UseAudioRecorderOptions {
  audioConstraints?: MediaTrackConstraints;
  timesliceMs?: number; // Optional timeslice if streaming chunks; default is unchunked continuous
  onDataAvailable?: (chunk: Blob) => void;
  onError?: (error: Error) => void;
}

export interface AudioRecordingResult {
  blob: Blob;
  url: string;
  duration: number; // in seconds
  mimeType: string;
}

export interface UseAudioRecorderReturn {
  status: AudioRecordingStatus;
  isRecording: boolean;
  isPaused: boolean;
  isInterrupted: boolean;
  stream: MediaStream | null;
  elapsedTime: number; // in seconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  mimeType: string;
  error: string | null;
  startRecording: (customStream?: MediaStream) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<AudioRecordingResult>;
  resetRecording: () => void;
  cleanup: () => void;
}

/**
 * Determine supported audio MIME type.
 * Priority: Opus in WebM -> WebM -> MP4 (Safari) -> OGG -> browser default
 */
export function getSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm;codecs=opus';
  }

  const audioTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];

  for (const t of audioTypes) {
    if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }

  return '';
}

/**
 * High-performance audio recorder hook for AI Prep assessments.
 * Records single-file voice audio with Opus compression and generates
 * 0ms zero-latency local ObjectURL upon completion for instant playback.
 */
export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const { audioConstraints, timesliceMs, onDataAvailable, onError } = options;

  const [status, setStatus] = useState<AudioRecordingStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimeRef = useRef<number>(0);
  const activeUrlRef = useRef<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const muteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectingRef = useRef<boolean>(false);
  const statusRef = useRef<AudioRecordingStatus>('idle');

  const updateStatus = useCallback((next: AudioRecordingStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  // Synchronize elapsed time ref
  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  // Revoke active object URL to prevent memory leaks
  const revokeActiveUrl = useCallback(() => {
    if (activeUrlRef.current) {
      try {
        URL.revokeObjectURL(activeUrlRef.current);
      } catch (_) {}
      activeUrlRef.current = null;
    }
  }, []);

  // Stop timer interval
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start timer interval
  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);

  // Clean up media stream tracks
  const cleanupStream = useCallback(() => {
    if (muteTimerRef.current) {
      clearTimeout(muteTimerRef.current);
      muteTimerRef.current = null;
    }
    try {
      sourceRef.current?.disconnect();
    } catch (_) {}
    sourceRef.current = null;
    destRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      try {
        void ctxRef.current.close().catch(() => {});
      } catch (_) {}
    }
    ctxRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.onmute = null;
        track.onunmute = null;
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  // Complete cleanup on unmount
  const cleanup = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    cleanupStream();
    // Do not revoke active preview Object URL on unmount if recording stopped,
    // so that it remains accessible for instant 0ms playback on the evaluation screen.
  }, [cleanupStream, stopTimer]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Reset recording state for retakes
  const resetRecording = useCallback(() => {
    stopTimer();
    cleanupStream();
    revokeActiveUrl();
    audioChunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsedTime(0);
    setError(null);
    updateStatus('idle');
  }, [cleanupStream, revokeActiveUrl, stopTimer, updateStatus]);

  // Handle unexpected microphone disconnection
  const handleInterrupt = useCallback(() => {
    if (statusRef.current !== 'recording') return;
    updateStatus('interrupted');
    stopTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      try {
        recorder.requestData();
        recorder.pause();
      } catch (_) {}
    }
    if (muteTimerRef.current) {
      clearTimeout(muteTimerRef.current);
      muteTimerRef.current = null;
    }
    try {
      sourceRef.current?.disconnect();
    } catch (_) {}
    sourceRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.onmute = null;
        track.onunmute = null;
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
      setStream(null);
    }
  }, [stopTimer, updateStatus]);

  const setupTrackListeners = useCallback(
    (track: MediaStreamTrack) => {
      const onEnded = () => handleInterrupt();
      const onMute = () => {
        if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
        muteTimerRef.current = setTimeout(handleInterrupt, 1000);
      };
      const onUnmute = () => {
        if (muteTimerRef.current) {
          clearTimeout(muteTimerRef.current);
          muteTimerRef.current = null;
        }
      };

      track.onended = onEnded;
      track.onmute = onMute;
      track.onunmute = onUnmute;
      try {
        track.addEventListener('ended', onEnded);
        track.addEventListener('mute', onMute);
        track.addEventListener('unmute', onUnmute);
      } catch (_) {}
    },
    [handleInterrupt]
  );

  const tryReconnect = useCallback(async () => {
    if (reconnectingRef.current || statusRef.current !== 'interrupted') return;
    reconnectingRef.current = true;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (!devices.some((d) => d.kind === 'audioinput')) return;

      const defaultConstraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          ...audioConstraints,
        },
        video: false,
      };
      const mic = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      const track = mic.getAudioTracks()[0];
      if (!track || track.readyState !== 'live' || track.muted || statusRef.current !== 'interrupted') {
        mic.getTracks().forEach((t) => t.stop());
        return;
      }

      const ctx = ctxRef.current;
      const dest = destRef.current;
      if (ctx && dest) {
        await ctx.resume();
        const source = ctx.createMediaStreamSource(mic);
        source.connect(dest);
        sourceRef.current = source;
      }
      streamRef.current = mic;
      setStream(mic);
      setupTrackListeners(track);

      if (mediaRecorderRef.current?.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      startTimer();
      updateStatus('recording');
    } catch (_) {
    } finally {
      reconnectingRef.current = false;
    }
  }, [audioConstraints, setupTrackListeners, startTimer, updateStatus]);

  useEffect(() => {
    if (status !== 'interrupted') return;
    const md = navigator.mediaDevices;
    if (!md) return;
    md.addEventListener('devicechange', tryReconnect);
    const id = setInterval(tryReconnect, 2000);
    void tryReconnect();
    return () => {
      md.removeEventListener('devicechange', tryReconnect);
      clearInterval(id);
    };
  }, [status, tryReconnect]);

  useEffect(() => {
    if (status !== 'recording') return;
    const md = navigator.mediaDevices;
    if (!md) return;

    const checkInputStatus = async () => {
      try {
        const track = streamRef.current?.getAudioTracks()[0];
        if (!track || track.readyState === 'ended' || track.muted) {
          handleInterrupt();
          return;
        }
        const devices = await md.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === 'audioinput');
        if (inputs.length === 0) {
          handleInterrupt();
          return;
        }
        const activeLabel = track.label;
        const activeId = track.getSettings().deviceId;
        const deviceStillExists = inputs.some((d) => {
          if (activeId && activeId !== 'default' && d.deviceId === activeId) return true;
          if (activeLabel && d.label && d.label === activeLabel) return true;
          return false;
        });
        if (!deviceStillExists && activeLabel) {
          handleInterrupt();
        }
      } catch (_) {}
    };

    md.addEventListener('devicechange', checkInputStatus);

    // Heartbeat check every 1s: detects if track ended or muted
    const pollId = setInterval(() => {
      const track = streamRef.current?.getAudioTracks()[0];
      if (!track || track.readyState === 'ended' || track.muted) {
        handleInterrupt();
      }
    }, 1000);

    return () => {
      md.removeEventListener('devicechange', checkInputStatus);
      clearInterval(pollId);
    };
  }, [status, handleInterrupt]);

  // Start recording
  const startRecording = useCallback(
    async (customStream?: MediaStream) => {
      try {
        setError(null);
        audioChunksRef.current = [];
        revokeActiveUrl();
        setAudioBlob(null);
        setAudioUrl(null);
        setElapsedTime(0);

        let activeStream = customStream || streamRef.current;
        if (!activeStream || !activeStream.active) {
          const defaultConstraints: MediaStreamConstraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 44100,
              ...audioConstraints,
            },
            video: false,
          };
          activeStream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
          streamRef.current = activeStream;
          setStream(activeStream);
        }

        const selectedMime = getSupportedAudioMimeType();
        setMimeType(selectedMime);

        const recorderOptions: MediaRecorderOptions = selectedMime
          ? { mimeType: selectedMime, audioBitsPerSecond: 64000 }
          : { audioBitsPerSecond: 64000 };

        let streamToRecord = activeStream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          try {
            const ctx = new AudioCtx();
            await ctx.resume();
            const dest = ctx.createMediaStreamDestination();
            const source = ctx.createMediaStreamSource(activeStream);
            source.connect(dest);
            ctxRef.current = ctx;
            destRef.current = dest;
            sourceRef.current = source;
            streamToRecord = dest.stream;
          } catch (_) {}
        }
        const firstTrack = activeStream.getAudioTracks()[0];
        if (firstTrack) setupTrackListeners(firstTrack);

        const recorder = new MediaRecorder(streamToRecord, recorderOptions);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            if (onDataAvailable) {
              onDataAvailable(event.data);
            }
          }
        };

        recorder.onerror = (evt: Event) => {
          const recErr = new Error('MediaRecorder encountered an unexpected audio error');
          setError(recErr.message);
          setStatus('error');
          if (onError) onError(recErr);
        };

        // If timeslice is provided, slice every N ms; otherwise continuous single chunk
        if (timesliceMs && timesliceMs > 0) {
          recorder.start(timesliceMs);
        } else {
          recorder.start();
        }

        updateStatus('recording');
        startTimer();
      } catch (err: any) {
        const message = err?.message || 'Failed to start audio recording';
        setError(message);
        updateStatus('error');
        if (onError) onError(err);
        cleanup();
      }
    },
    [audioConstraints, timesliceMs, onDataAvailable, onError, startTimer, cleanup, revokeActiveUrl, updateStatus]
  );

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      updateStatus('paused');
    }
  }, [stopTimer, updateStatus]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (statusRef.current === 'interrupted') {
      void tryReconnect();
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      updateStatus('recording');
    }
  }, [tryReconnect, startTimer, updateStatus]);

  // Stop recording and generate 0ms instant playback ObjectURL
  const stopRecording = useCallback(async (): Promise<AudioRecordingResult> => {
    return new Promise((resolve, reject) => {
      stopTimer();
      if (statusRef.current === 'interrupted') updateStatus('stopped');
      const recorder = mediaRecorderRef.current;
      const durationSeconds = elapsedTimeRef.current;

      const finishAndResolve = () => {
        cleanupStream();
        const effectiveMime = mimeType || recorder?.mimeType || 'audio/webm';
        const finalBlob = new Blob(audioChunksRef.current, { type: effectiveMime });
        const localUrl = URL.createObjectURL(finalBlob);

        activeUrlRef.current = localUrl;
        setAudioBlob(finalBlob);
        setAudioUrl(localUrl);
        updateStatus('stopped');

        resolve({
          blob: finalBlob,
          url: localUrl,
          duration: durationSeconds,
          mimeType: effectiveMime,
        });
      };

      if (!recorder || recorder.state === 'inactive') {
        finishAndResolve();
        return;
      }

      recorder.onstop = () => {
        finishAndResolve();
      };

      try {
        if (typeof recorder.requestData === 'function') {
          recorder.requestData();
        }
        recorder.stop();
      } catch (stopErr: any) {
        // Fallback resolution if stop throws
        finishAndResolve();
      }
    });
  }, [cleanupStream, mimeType, stopTimer, updateStatus]);

  return {
    status,
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    isInterrupted: status === 'interrupted',
    stream,
    elapsedTime,
    audioBlob,
    audioUrl,
    mimeType,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    cleanup,
  };
}

export default useAudioRecorder;
