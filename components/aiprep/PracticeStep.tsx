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
import { aiPrepApi } from '@/lib/aiprep-api';
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
  const [dbQuestion, setDbQuestion] = useState<string>('');

  useEffect(() => {
    let active = true;
    const typeToQuery = assessmentType || 'INTRO';
    if (typeof aiPrepApi?.getQuestions === 'function') {
      aiPrepApi.getQuestions(typeToQuery)
        .then((res: any) => {
          if (!active) return;
          const items = Array.isArray(res) ? res : res?.items || res?.questions || [];
          if (items.length > 0 && items[0]?.question_text) {
            setDbQuestion(items[0].question_text);
          }
        })
        .catch(() => {});
    }

    return () => { active = false; };
  }, [assessmentType]);

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

  // Vision Hook Integration for Real-time Video Analytics
  const { isReady: isVisionReady, detectVideoFrame, realtimeTelemetry } = useMediaPipeVision();

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
      mediaEl.play().then(() => setIsPlaying(true)).catch((e) => console.warn('Play error:', e));
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

  return (
    <div className="w-full h-full flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden animate-in fade-in duration-300">
      {/* Central Content Area - fits exactly in viewport */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden w-full px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 space-y-2.5 sm:space-y-3 max-w-7xl mx-auto flex flex-col justify-between">
        {/* Hidden audio player for audio-only local playback */}
      {testAudioUrl && !videoEnabled && (
        <audio
          ref={audioPlaybackRef}
          src={testAudioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* ── HEADER TITLE & SUBTITLE ────────────────────────────────────────── */}
      <div className="shrink-0 space-y-0.5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          {modeVariant === 'AUDIO_ONLY' && '4. Practice recording – Audio Only'}
          {modeVariant === 'VIDEO_STANDARD' && '4. Practice recording – Video (Camera + Mic)'}
          {modeVariant === 'VIDEO_ANALYTICS' && '4. Practice recording – Video with Analytics'}
        </h2>
        <p className="text-xs sm:text-xs text-slate-500 dark:text-slate-400">
          {modeVariant === 'AUDIO_ONLY' &&
            'Record a short sample response to make sure your microphone and speakers are working properly.'}
          {modeVariant === 'VIDEO_STANDARD' &&
            'Record a short sample response to make sure your camera, microphone and speakers are working properly.'}
          {modeVariant === 'VIDEO_ANALYTICS' &&
            'Record a short sample response and get real-time feedback on your presence and engagement (optional).'}
        </p>
      </div>

      {/* ── 3-COLUMN MAIN SANDBOX GRID ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 flex-1 min-h-0 items-stretch w-full overflow-hidden">
        {/* ── COLUMN 1: Visual Stage / Audio Box (4 cols) ─────────────────── */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-xs h-full min-h-0">
          {modeVariant === 'AUDIO_ONLY' ? (
            /* Audio Test Circular Badge */
            <div className="flex flex-col items-center text-center space-y-2.5 py-1 w-full my-auto">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-50/90 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shadow-xs">
                <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Audio Test</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-[220px]">
                  Click the button and speak for 20–30 seconds.
                </p>
              </div>

              {/* Start / Stop Recording CTA */}
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startTestRecording}
                  className="mt-1 px-5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-[#5B45F6] hover:bg-[#4F39E8] text-white flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopTestRecording}
                  className="mt-1 px-5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-md hover:shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  <span className="w-2.5 h-2.5 rounded-sm bg-white" />
                  <span>Stop recording ({30 - recordTime}s)</span>
                </button>
              )}
            </div>
          ) : (
            /* Video Stream / Face Analytics Box */
            <div className="relative w-full h-full min-h-[240px] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
              {/* Recorded Video Playback Element (active when viewing playback) */}
              <video
                ref={videoPlaybackRef}
                src={testAudioUrl || undefined}
                playsInline
                className={`w-full h-full object-cover transform -scale-x-100 ${activeView === 'PLAYBACK' && testAudioUrl ? 'block' : 'hidden'
                  }`}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />

              {/* Live Webcam Stream Element (active when in live preview) */}
              <video
                ref={liveVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${activeView === 'PLAYBACK' && testAudioUrl ? 'hidden' : 'block'
                  }`}
              />

              {/* Top-Left Mode Pill */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {activeView === 'PLAYBACK' && testAudioUrl
                    ? 'Recorded Test'
                    : modeVariant === 'VIDEO_ANALYTICS'
                      ? isVisionReady
                        ? realtimeTelemetry.is_instant_face_present
                          ? 'Analyzing (Face Locked)'
                          : 'Analyzing (Searching Face)'
                        : 'Initializing Vision…'
                      : 'Preview'}
                </span>
              </div>

              {/* Top-Right Toggle: Live Camera vs. Recorded Test (when test recording exists) */}
              {testAudioUrl && !isRecording && (
                <div className="absolute top-3 right-3 z-20 flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => {
                      pausePlayback();
                      setActiveView('LIVE');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${activeView === 'LIVE'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Live
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('PLAYBACK');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${activeView === 'PLAYBACK'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Playback
                  </button>
                </div>
              )}

              {/* Video with Analytics: Dynamic Facial Mesh Box from MediaPipe Vision Telemetry */}
              {modeVariant === 'VIDEO_ANALYTICS' && activeView !== 'PLAYBACK' && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {realtimeTelemetry.face_box && realtimeTelemetry.is_instant_face_present ? (() => {
                    const rawW = realtimeTelemetry.face_box.width * 100;
                    const rawH = realtimeTelemetry.face_box.height * 100;
                    const boxW = Math.max(28, Math.min(75, rawW * 1.55));
                    const boxH = Math.max(30, Math.min(85, rawH * 1.20));
                    const padX = (boxW - rawW) / 2;
                    const padY = (boxH - rawH) / 2;
                    const boxL = Math.max(0, Math.min(100 - boxW, (1 - realtimeTelemetry.face_box.x - realtimeTelemetry.face_box.width) * 100 - padX));
                    const boxT = Math.max(0, Math.min(100 - boxH, realtimeTelemetry.face_box.y * 100 - padY));

                    return (
                      <div
                        className="absolute border-2 border-emerald-400/90 rounded-2xl shadow-[0_0_15px_rgba(52,211,153,0.3)] flex flex-col justify-between p-1.5 transition-all duration-75"
                        style={{
                          left: `${boxL}%`,
                          top: `${boxT}%`,
                          width: `${boxW}%`,
                          height: `${boxH}%`,
                        }}
                      >
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded self-start">
                          ID: FACE_01
                        </span>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded self-end">
                          ATTN: {Math.round(realtimeTelemetry.screen_attention_pct ?? 0)}%
                        </span>
                      </div>
                    );
                  })() : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-mono font-semibold animate-pulse">
                        Searching for face…
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── COLUMN 2: Sample Question & Media Player Bar (5 cols) ───────── */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs h-full min-h-0">
          {/* Top: Sample Question Card */}
          <div className="space-y-2 sm:space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Sample question
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {dbQuestion ? <>&ldquo;{dbQuestion}&rdquo;</> : 'Test your microphone and video clarity before starting the live assessment session.'}
            </p>
          </div>

          {/* Device Error Banner */}
          {deviceError && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{deviceError}</span>
            </div>
          )}

          {/* Center: Video Mode Start/Stop Button */}
          {modeVariant !== 'AUDIO_ONLY' && (
            <div className="flex items-center justify-start py-1">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startTestRecording}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-white dark:bg-slate-800 border-2 border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Start recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopTestRecording}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-md shadow-rose-600/30 active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  <span className="w-2.5 h-2.5 rounded-sm bg-white" />
                  <span>Stop recording ({30 - recordTime}s)</span>
                </button>
              )}
            </div>
          )}

          {/* Bottom: Interactive Scrubber & Audio Player Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={togglePlayback}
                disabled={!testAudioUrl || isRecording}
                className="w-8 h-8 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 disabled:opacity-40 flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                title={testAudioUrl ? 'Play test recording' : 'Record a sample first to listen'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>

              {/* Time display */}
              <span className="text-[10.5px] font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                {formatSeconds(isPlaying ? playbackTime : isRecording ? recordTime : 0)} / {formatSeconds(totalDuration)}
              </span>

              {/* Timeline scrub bar */}
              <input
                type="range"
                min={0}
                max={totalDuration || 30}
                step={0.5}
                value={playbackTime}
                onChange={handleSeek}
                disabled={!testAudioUrl || isRecording}
                className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-40"
              />

              {/* Volume & Mute control */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-12 sm:w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Note banner */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] px-1">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>This is just a test. Your recording will not be saved.</span>
            </div>
          </div>
        </div>

        {/* ── COLUMN 3: Device Status OR Real-time Analytics (3 cols) ─────── */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs h-full min-h-0">
          {modeVariant !== 'VIDEO_ANALYTICS' ? (
            /* Variant 1 & 2: Device Status Card */
            <div className="flex flex-col justify-between h-full space-y-3">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Device status
                </h3>

                <div className="space-y-3">
                  {videoEnabled && (
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Camera className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">Camera</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px]">
                        <span className="truncate">{selectedVideoLabel}</span>
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Mic className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">Microphone</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px]">
                      <span className="truncate">{selectedAudioLabel}</span>
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">Speaker</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px]">
                      <span className="truncate">{selectedSpeakerLabel}</span>
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-[11.5px] font-semibold text-emerald-800 dark:text-emerald-300 leading-snug">
                  Audio devices verified and locked for this session.
                </p>
              </div>
            </div>
          ) : (
            /* Variant 3: Real-time Analytics Visualizer */
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Real-time signals</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  Live
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  {
                    label: 'Face detection',
                    icon: <Eye className="w-3.5 h-3.5" />,
                    status: realtimeTelemetry.is_instant_face_present ? 'Face Detected' : 'No Face',
                    pct: realtimeTelemetry.is_instant_face_present ? 100 : 0,
                    ok: !!realtimeTelemetry.is_instant_face_present,
                  },
                  {
                    label: 'Eye contact',
                    icon: <Activity className="w-3.5 h-3.5" />,
                    status: realtimeTelemetry.is_instant_eyes_attentive ? 'Attentive' : 'Off-screen',
                    pct: realtimeTelemetry.eye_contact_pct ?? 0,
                    ok: !!realtimeTelemetry.is_instant_eyes_attentive,
                  },
                  {
                    label: 'Posture alignment',
                    icon: <Maximize className="w-3.5 h-3.5" />,
                    status: realtimeTelemetry.sitting_position || 'Upright Centered',
                    pct: realtimeTelemetry.is_instant_straight ? 100 : 60,
                    ok: realtimeTelemetry.is_instant_straight !== false,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        <span className="text-indigo-500">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        item.ok
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.ok ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>MediaPipe AI Vision tracking active. Telemetry processed in-memory.</span>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ── BOTTOM NAVIGATION ACTIONS ──────────────────────────────────────── */}
      <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-2 sm:py-2.5 shrink-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>← Back</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (isRecording || isLaunching) return;
              setIsLaunching(true);
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
            }}
            disabled={isRecording || isLaunching}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 border transition-all ${
              isRecording || isLaunching
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-60'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600 hover:border-indigo-500 shadow-md active:scale-95 cursor-pointer'
            }`}
            title={isRecording ? 'Please stop recording before starting assessment' : isLaunching ? 'Launching Assessment...' : 'Start Assessment'}
          >
            {isLaunching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Launching Assessment...</span>
              </>
            ) : (
              <>
                <span>Start Assessment</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeStep;

