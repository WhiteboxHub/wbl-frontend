/**
 * PracticeStep Component (Step 4: Practice & Start Sandbox)
 * 
 * Implements the 3 reference variants from lead design:
 * 1. Audio Only
 * 2. Video (Camera + Mic)
 * 3. Video with Analytics
 * 
 * 100% In-Memory Sandbox (Zero DB persistence / No API telemetry overhead)
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaPipeVision } from '@/hooks/useMediaPipeVision';
import { AIPrepTelemetry } from '@/lib/telemetry';
import { PracticeAction } from '@/types/telemetry';
import {
  Mic,
  Video,
  Volume2,
  Lock,
  Play,
  Pause,
  Check,
  CheckCircle2,
  Info,
  Sparkles,
  Camera,
  Activity,
  Eye,
  Maximize,
  ChevronRight,
  ArrowLeft,
  VolumeX,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  X,
  Loader2,
} from 'lucide-react';

interface PracticeStepProps {
  assessmentType?: string;
  videoEnabled: boolean;
  videoAnalyticsEnabled: boolean;
  cameraStream: MediaStream | null;
  selectedAudioLabel?: string;
  selectedVideoLabel?: string;
  selectedSpeakerLabel?: string;
  onBack: () => void;
  onStartAssessment: () => Promise<void> | void;
}

export const PracticeStep: React.FC<PracticeStepProps> = ({
  assessmentType,
  videoEnabled,
  videoAnalyticsEnabled,
  cameraStream,
  selectedAudioLabel = 'Default Microphone (Built-in)',
  selectedVideoLabel = 'FaceTime HD Camera (Built-in)',
  selectedSpeakerLabel = 'System Output (Built-in)',
  onBack,
  onStartAssessment,
}) => {
  // ── Recording State ────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<number>(0);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(30);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'LIVE' | 'PLAYBACK'>('LIVE');
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [showProctoringRulesModal, setShowProctoringRulesModal] = useState<boolean>(false);

  const recordTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const videoPlaybackRef = useRef<HTMLVideoElement | null>(null);
  const [liveVideoElement, setLiveVideoElement] = useState<HTMLVideoElement | null>(null);
  const liveVideoRef = useCallback((node: HTMLVideoElement | null) => {
    setLiveVideoElement(node);
  }, []);

  // Vision Hook Integration for Real-time Video Analytics (only when video is enabled)
  const { isReady: isVisionReady, detectVideoFrame, realtimeTelemetry } = useMediaPipeVision({ enabled: videoEnabled });

  // Helper to get currently active media playback element
  const getActiveMediaEl = () => {
    return videoEnabled ? videoPlaybackRef.current : audioPlaybackRef.current;
  };

  // Determine mode
  const modeVariant: 'AUDIO_ONLY' | 'VIDEO_STANDARD' | 'VIDEO_ANALYTICS' = !videoEnabled
    ? 'AUDIO_ONLY'
    : videoAnalyticsEnabled
      ? 'VIDEO_ANALYTICS'
      : 'VIDEO_STANDARD';

  // Hardcoded sample prompt (no API fetch needed for practice)
  const sampleQuestion = 'Speak something — introduce yourself or describe a recent challenge you solved. This is just a practice run.';

  // Track practice step entered
  useEffect(() => {
    AIPrepTelemetry.trackPracticePage({
      action: PracticeAction.PRACTICE_ENTERED,
      assessment_type: assessmentType,
      mode: modeVariant,
      video_enabled: videoEnabled,
      video_analytics_enabled: videoAnalyticsEnabled,
    });
  }, [videoEnabled, videoAnalyticsEnabled, modeVariant, assessmentType]);

  // High-Speed Vision Tracking Loop (~25 FPS) for VIDEO_ANALYTICS mode
  useEffect(() => {
    if (modeVariant !== 'VIDEO_ANALYTICS' || activeView === 'PLAYBACK' || !isVisionReady || !liveVideoElement) return;

    let animId: number;
    let lastTime = 0;

    const loop = (time: number) => {
      if (time - lastTime >= 40) {
        lastTime = time;
        const video = liveVideoElement;
        if (video && video.readyState >= 2 && !video.paused && !video.ended) {
          try {
            detectVideoFrame(video, time);
          } catch (_) { }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [modeVariant, activeView, isVisionReady, detectVideoFrame, liveVideoElement]);

  // Monitor live hardware connection status and handle device disconnections
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    const checkDeviceAvailability = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const hasMic = devs.some((d) => d.kind === 'audioinput');
        const hasCam = devs.some((d) => d.kind === 'videoinput');

        if (!hasMic) {
          setDeviceError('Microphone disconnected or unavailable. Please connect your microphone.');
        } else if (videoEnabled && !hasCam) {
          setDeviceError('Camera disconnected or unavailable. Please connect your camera.');
        } else {
          setDeviceError(null);
        }
      } catch (e) {
        console.warn('Device check warning:', e);
      }
    };

    checkDeviceAvailability();

    const handleDeviceChange = () => {
      checkDeviceAvailability();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [videoEnabled]);

  // Connect live camera stream to video preview
  useEffect(() => {
    let localStream: MediaStream | null = null;
    let isCurrent = true;

    async function initPreviewStream() {
      if (!videoEnabled || !liveVideoElement) return;

      let streamToUse = cameraStream;
      if (!streamToUse || !streamToUse.active) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: false,
          });
          if (!isCurrent) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStream = stream;
          streamToUse = localStream;
        } catch (err) {
          console.warn('Failed to acquire fallback video stream:', err);
        }
      }

      if (isCurrent && liveVideoElement && streamToUse) {
        if (liveVideoElement.srcObject !== streamToUse) {
          liveVideoElement.srcObject = streamToUse;
          liveVideoElement.play().catch((e) => console.warn('Preview video play handled:', e));
        }
      }
    }

    initPreviewStream();

    return () => {
      isCurrent = false;
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream, videoEnabled, liveVideoElement]);

  // Clean up recorded blob URL on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) { }
      }
      if (testAudioUrl) {
        URL.revokeObjectURL(testAudioUrl);
      }
    };
  }, [testAudioUrl]);

  // ── Start Test Recording (Sandbox) ─────────────────────────────────────────
  const startTestRecording = async () => {
    try {
      setDeviceError(null);
      if (isPlaying) {
        pausePlayback();
      }
      setActiveView('LIVE');
      if (testAudioUrl) {
        URL.revokeObjectURL(testAudioUrl);
        setTestAudioUrl(null);
      }

      // 1. Acquire & verify live microphone audio track
      let audioTrack: MediaStreamTrack | null = null;
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioTrack = audioStream.getAudioTracks().find((t) => t.readyState === 'live') || null;
      } catch (aErr) {
        console.warn('Microphone stream acquire error:', aErr);
      }

      if (!audioTrack) {
        setDeviceError('Microphone disconnected or unavailable. Please check your microphone connection.');
        return;
      }

      // 2. Acquire & verify live camera video track if video mode is enabled
      let vidTrack: MediaStreamTrack | null = null;
      if (videoEnabled) {
        if (
          cameraStream &&
          cameraStream.getVideoTracks().length > 0 &&
          cameraStream.getVideoTracks()[0].readyState === 'live'
        ) {
          // Clone the track so stopping activeStream later won't stop the live camera stream
          vidTrack = cameraStream.getVideoTracks()[0].clone();
        } else {
          try {
            const freshVidStream = await navigator.mediaDevices.getUserMedia({
              video: { width: 1280, height: 720 },
            });
            vidTrack = freshVidStream.getVideoTracks().find((t) => t.readyState === 'live') || null;
          } catch (vErr) {
            console.warn('Video stream acquire error:', vErr);
          }
        }

        if (!vidTrack) {
          setDeviceError('Camera disconnected or unavailable. Please check your camera connection.');
          return;
        }
      }

      const tracks: MediaStreamTrack[] = [audioTrack];
      if (vidTrack) {
        tracks.push(vidTrack);
      }

      const activeStream = new MediaStream(tracks);

      recordedChunksRef.current = [];
      const getSupportedMimeType = (video: boolean) => {
        const videoTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4',
        ];
        const audioTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
        ];
        const targets = video ? videoTypes : audioTypes;
        if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
          for (const type of targets) {
            if (MediaRecorder.isTypeSupported(type)) {
              return type;
            }
          }
        }
        return '';
      };

      const mimeType = getSupportedMimeType(videoEnabled);
      const recorder = new MediaRecorder(activeStream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, mimeType ? { type: mimeType } : undefined);
        const url = URL.createObjectURL(blob);
        setTestAudioUrl(url);
        setIsRecording(false);
        setActiveView('PLAYBACK');
        activeStream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(500);
      setIsRecording(true);
      recordTimeRef.current = 0;
      setRecordTime(0);
      AIPrepTelemetry.trackPracticePage({
        action: PracticeAction.RECORDING_STARTED,
        mode: modeVariant,
        video_enabled: videoEnabled,
        video_analytics_enabled: videoAnalyticsEnabled,
      });

      const timer = setInterval(() => {
        setRecordTime((prev) => {
          const next = prev + 1;
          recordTimeRef.current = next;
          if (next >= 30) {
            clearInterval(timer);
            stopTestRecording();
            return 30;
          }
          return next;
        });
      }, 1000);
      recordTimerRef.current = timer;
    } catch (err) {
      console.error('Failed to start sandbox test recording:', err);
    }
  };

  // ── Stop Test Recording ────────────────────────────────────────────────────
  const stopTestRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) { }
    }
    setIsRecording(false);
    const finalSec = recordTimeRef.current > 0 ? recordTimeRef.current : 5;
    setTotalDuration(finalSec);
    setPlaybackTime(0);
    setActiveView('PLAYBACK');
    AIPrepTelemetry.trackPracticePage({
      action: PracticeAction.RECORDING_FINISHED,
      mode: modeVariant,
      video_enabled: videoEnabled,
      video_analytics_enabled: videoAnalyticsEnabled,
      duration_seconds: finalSec,
    });
  };

  // ── Playback Controls ──────────────────────────────────────────────────────
  const togglePlayback = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    if (videoEnabled && activeView !== 'PLAYBACK') {
      setActiveView('PLAYBACK');
    }
    const mediaEl = getActiveMediaEl();
    if (mediaEl) {
      mediaEl.volume = isMuted ? 0 : volume;
      mediaEl.play().then(() => {
        setIsPlaying(true);
        AIPrepTelemetry.trackPracticePage({
          action: PracticeAction.PLAYBACK_STARTED,
          mode: modeVariant,
          video_enabled: videoEnabled,
          video_analytics_enabled: videoAnalyticsEnabled,
        });
      }).catch((e) => console.warn('Play error:', e));
    }
  };

  const pausePlayback = () => {
    const mediaEl = getActiveMediaEl();
    if (mediaEl) {
      mediaEl.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const mediaEl = getActiveMediaEl();
    if (mediaEl && Number.isFinite(mediaEl.currentTime)) {
      setPlaybackTime(mediaEl.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const mediaEl = getActiveMediaEl();
    if (mediaEl && Number.isFinite(mediaEl.duration) && mediaEl.duration > 0) {
      setTotalDuration(Math.round(mediaEl.duration));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = Number(e.target.value);
    setPlaybackTime(seekTime);
    const mediaEl = getActiveMediaEl();
    if (mediaEl && Number.isFinite(seekTime)) {
      mediaEl.currentTime = seekTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    const mediaEl = getActiveMediaEl();
    if (mediaEl) {
      mediaEl.volume = newVol;
    }
  };

  const toggleMute = () => {
    const mediaEl = getActiveMediaEl();
    if (isMuted) {
      setIsMuted(false);
      const newVol = volume || 0.8;
      setVolume(newVol);
      if (mediaEl) mediaEl.volume = newVol;
    } else {
      setIsMuted(true);
      if (mediaEl) mediaEl.volume = 0;
    }
  };

  const formatSeconds = (sec: number) => {
    if (!Number.isFinite(sec) || isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Skip Practice Helper ──────────────────────────────────────────────────
  const handleSkipPractice = async () => {
    if (isRecording || isLaunching) return;
    setIsLaunching(true);
    AIPrepTelemetry.trackPracticePage({
      action: PracticeAction.PRACTICE_SKIPPED,
      assessment_type: assessmentType,
      mode: modeVariant,
      reason: 'candidate_chose_skip',
    });
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioPlaybackRef.current) audioPlaybackRef.current.pause();
      if (videoPlaybackRef.current) videoPlaybackRef.current.pause();
      await onStartAssessment();
    } catch (err) {
      console.error('[PracticeStep] Skip practice failed:', err);
      setIsLaunching(false);
    }
  };

  // ── Launch Assessment / Teardown Helper ──────────────────────────────────
  const handleLaunchAssessment = async () => {
    if (isRecording || isLaunching) return;
    setIsLaunching(true);
    AIPrepTelemetry.trackPracticePage({
      action: PracticeAction.ASSESSMENT_LAUNCHED,
      assessment_type: assessmentType,
      mode: modeVariant,
    });
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioPlaybackRef.current) audioPlaybackRef.current.pause();
      if (videoPlaybackRef.current) videoPlaybackRef.current.pause();
      await onStartAssessment();
    } catch (err) {
      console.error('[PracticeStep] Launch assessment failed:', err);
      setIsLaunching(false);
    }
  };


  const handleContinue = async () => {
    if (testAudioUrl) {
      await handleLaunchAssessment();
    } else {
      await handleSkipPractice();
    }
  };

  const handleConfirmStartAssessment = async () => {
    setShowProctoringRulesModal(false);
    if (testAudioUrl) {
      await handleLaunchAssessment();
    } else {
      await handleSkipPractice();
    }
  };

  return (
    <div className="practice-step-root flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-50 text-slate-900 animate-in fade-in duration-300 dark:bg-slate-950 dark:text-white">
      <style>{`
        /* Keep Practice & Start usable when embedded inside the full dashboard shell. */
        @media (max-height: 820px) and (min-width: 1024px) {
          .practice-step-main { padding-top: 6px; padding-bottom: 6px; }
          .practice-step-card { padding: 10px; }
          .practice-step-notice { margin-bottom: 8px; padding: 6px 10px; }
          .practice-step-heading { margin-bottom: 8px; }
          .practice-step-heading h2 { font-size: 20px; line-height: 1.15; }
          .practice-step-instructions { margin-bottom: 8px; gap: 6px; }
          .practice-step-instructions > div { padding-top: 4px; padding-bottom: 4px; }
          .practice-step-content { gap: 8px; }
          .practice-step-aside { gap: 6px; }
          .practice-step-aside > section { padding: 8px; }
          .practice-step-aside > section .mt-1 { margin-top: 3px; }
          .practice-step-aside > section .mt-2 { margin-top: 5px; }
          .practice-step-card footer { margin-top: 8px; padding-top: 8px; }
        }
        @media (max-height: 700px) and (min-width: 1024px) {
          .practice-step-notice p:last-child { font-size: 10px; }
          .practice-step-heading h2 { font-size: 18px; }
          .practice-step-content > div:first-child > div { padding: 8px; }
          .practice-step-aside > section { padding: 6px 8px; }
          .practice-step-aside > section p, .practice-step-aside > section li { font-size: 10px; line-height: 1.25; }
        }
      `}</style>
      {testAudioUrl && !videoEnabled && (
        <audio
          ref={audioPlaybackRef}
          src={testAudioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <main className="practice-step-main mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-3">
        <section className="practice-step-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4 lg:p-5">
          <div className="practice-step-notice mb-3 flex shrink-0 items-start gap-2.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 dark:border-violet-900 dark:bg-violet-950/30">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
            <div>
              <p className="text-[11px] font-bold text-violet-800 dark:text-violet-200 sm:text-xs">FREE PRACTICE — THIS IS NOT YOUR REAL ASSESSMENT</p>
              <p className="text-[10px] leading-snug text-violet-700 dark:text-violet-300 sm:text-xs">
                Try your microphone, get comfortable, and continue whenever you’re ready. This sample will not be saved.
              </p>
            </div>
          </div>

          <div className="practice-step-heading mb-3 shrink-0">
            <h2 className="text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">Get comfortable before you begin</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
              Take a quick 30-second practice run. There is no score and no pressure.
            </p>
          </div>



          {deviceError && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{deviceError}</span>
            </div>
          )}

          <div className="practice-step-content grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] grid-cols-1 items-stretch gap-3 overflow-hidden lg:grid-cols-12 lg:gap-3">
            <div className="flex min-h-0 flex-col overflow-hidden lg:col-span-8">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 p-2.5 dark:border-slate-800 sm:p-3">
                <div className="shrink-0 rounded-xl border border-violet-100 bg-violet-50/60 px-2.5 py-1.5 dark:border-violet-900/60 dark:bg-violet-950/20 sm:px-3 sm:py-2">
                  <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">Sample prompt</span>
                  <p className="mt-0.5 text-xs font-semibold leading-snug text-slate-800 dark:text-slate-100 sm:text-sm">
                    “Introduce yourself or describe a recent challenge you solved.”
                  </p>
                </div>

                <div className="flex min-h-0 flex-1 flex-col items-center justify-evenly overflow-hidden py-1 text-center">
                  {videoEnabled ? (
                    <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-950 aspect-video">
                      <video ref={liveVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                      {!cameraStream && (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
                          <Camera className="mr-2 h-5 w-5" /> Camera preview unavailable
                        </div>
                      )}
                      {isRecording && <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Recording · {formatSeconds(recordTime)}</span>}
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40 sm:h-16 sm:w-16">
                        {isRecording && <span className="absolute inset-0 rounded-full border-2 border-violet-400 animate-ping opacity-30" />}
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-500/25 sm:h-12 sm:w-12">
                          {isRecording ? <span className="h-7 w-7 rounded-md bg-white" /> : <Mic className="h-6 w-6 stroke-[1.8]" />}
                        </div>
                      </div>
                      <h3 className="text-xs font-bold sm:text-sm">{isRecording ? 'Your practice recording' : testAudioUrl ? 'Practice recording ready' : 'Ready when you are'}</h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                        {isRecording ? `Up to 30 seconds · ${30 - recordTime}s remaining` : testAudioUrl ? 'You can listen to your sample before continuing.' : 'Up to 30 seconds · Only you can hear it'}
                      </p>
                    </>
                  )}

                  <style>{`
                    @keyframes practiceWaveform { 0%,100% { transform: scaleY(.25); } 50% { transform: scaleY(1); } }
                  `}</style>
                  <div className="flex h-5 items-center justify-center gap-1" aria-label={isRecording ? 'Recording waveform' : 'Audio waveform'}>
                    {Array.from({ length: 25 }).map((_, i) => (
                      <span key={i} className={`w-1 rounded-full ${isRecording ? 'bg-violet-500' : 'bg-violet-300 dark:bg-violet-700'}`} style={{ height: `${12 + ((i * 17) % 28)}px`, transformOrigin: 'center', animation: isRecording ? `practiceWaveform .8s ease-in-out ${i * 0.045}s infinite` : 'none' }} />
                    ))}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
                    {!isRecording ? (
                      <button type="button" onClick={startTestRecording} disabled={isLaunching} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm">
                        <Mic className="h-4 w-4" /> {testAudioUrl ? 'Record again' : 'Try a practice recording'}
                      </button>
                    ) : (
                      <button type="button" onClick={stopTestRecording} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-rose-700">
                        <span className="h-2.5 w-2.5 rounded-sm bg-white" /> Stop recording ({30 - recordTime}s)
                      </button>
                    )}
                    {testAudioUrl && !videoEnabled && (
                      <button type="button" onClick={togglePlayback} disabled={isRecording} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm">
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {isPlaying ? 'Pause sample' : 'Listen to sample'}
                      </button>
                    )}
                  </div>
                  {testAudioUrl && !videoEnabled && (
                    <div className="mt-1 flex w-full max-w-lg items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/60">
                      <span className="text-xs font-mono text-slate-500">{formatSeconds(playbackTime)} / {formatSeconds(totalDuration)}</span>
                      <input type="range" min={0} max={totalDuration || 30} step={0.5} value={playbackTime} onChange={handleSeek} disabled={isRecording} className="h-1.5 flex-1 cursor-pointer accent-violet-600" aria-label="Practice playback position" />
                      <button type="button" onClick={toggleMute} className="text-slate-500 hover:text-violet-700" aria-label={isMuted ? 'Unmute sample' : 'Mute sample'}>
                        {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="practice-step-aside flex min-h-0 flex-col gap-2 overflow-hidden lg:col-span-4">
              <section className="shrink-0 rounded-xl border border-slate-200 p-2.5 dark:border-slate-800 sm:p-3">
                <h3 className="text-xs font-bold sm:text-sm">What happens in practice?</h3>
                <ul className="mt-1.5 space-y-1.5">
                  {[
                    'Check that your microphone works',
                    'Listen to your sample if you like',
                    'No score, no grading, no upload',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-200 sm:text-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Check className="h-3.5 w-3.5 stroke-[3]" /></span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">Tip: Speak naturally and check your volume.</div>
              </section>

              <section className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-900 dark:bg-emerald-950/25 sm:p-3">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 sm:text-sm"><CheckCircle2 className="h-4 w-4" /> Private practice</h3>
                <p className="mt-1 text-[10px] leading-snug text-emerald-800 dark:text-emerald-200 sm:text-xs">This sample stays in your browser and is not submitted with your real assessment.</p>
              </section>

              <section className="min-h-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/50 sm:p-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Ready for the real assessment?</h3>
                <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-slate-400 sm:text-xs">You’ll see the assessment start screen next. You can also skip this practice entirely.</p>
              </section>
            </aside>
          </div>

          <footer className="mt-3 grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            <button type="button" onClick={onBack} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <p className="justify-self-center text-center text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">Optional practice · No timer pressure</p>
            <button
              type="button"
              onClick={() => {
                const isIntro = assessmentType === 'INTRO' || assessmentType === 'JD_INTRO';
                if (isIntro) {
                  setShowProctoringRulesModal(true);
                } else if (testAudioUrl) {
                  void handleLaunchAssessment();
                } else {
                  void handleSkipPractice();
                }
              }}
              disabled={isRecording || isLaunching}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm cursor-pointer"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                </>
              ) : testAudioUrl ? (
                <>
                  Start Assessment <ChevronRight className="h-4 w-4" />
                </>
              ) : isRecording ? (
                <>Recording practice…</>
              ) : (
                <>
                  Skip Practice <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </footer>
          <style>{`
            @media (max-width: 520px) {
              .practice-step-card footer { grid-template-columns: auto auto; }
              .practice-step-card footer p { grid-column: 1 / -1; grid-row: 2; }
            }
          `}</style>
        </section>
      </main>

      {/* Proctoring Instructions & Anti-Cheat Rules Modal */}
      {showProctoringRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-violet-200 bg-white p-6 shadow-2xl dark:border-violet-900/60 dark:bg-slate-900 sm:p-7 space-y-4">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowProctoringRulesModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
              aria-label="Close rules"
            >
              <X size={18} />
            </button>

            {/* Header Icon + Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 flex items-center justify-center shrink-0 border border-violet-200 dark:border-violet-800 shadow-sm">
                <ShieldAlert size={26} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/80 mb-1">
                  Proctoring & Test Integrity
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Assessment Security Rules
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Before beginning your real assessment, please read and agree to the following mandatory test room restrictions:
            </p>

            {/* Restriction Guidelines Cards */}
            <div className="space-y-2.5 text-xs">
              
              {/* Rule 1: No Tab Switching */}
              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 text-xs">
                    No Tab Switching or Window Minimizing
                  </h4>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-400/90 mt-0.5 leading-snug">
                    You must remain in the assessment window at all times. Switching to other browser tabs or applications is recorded as a violation.
                  </p>
                </div>
              </div>

              {/* Rule 2: No Screenshots */}
              <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-rose-900 dark:text-rose-300 text-xs">
                    Screenshots & Snipping Tools Are Blocked
                  </h4>
                  <p className="text-[11px] text-rose-800/90 dark:text-rose-400/90 mt-0.5 leading-snug">
                    Taking screenshots is strictly prohibited and immediately flagged.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowProctoringRulesModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel & Review Practice
              </button>
              <button
                type="button"
                onClick={handleConfirmStartAssessment}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-violet-500/25 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>I Understand & Start Assessment</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PracticeStep;