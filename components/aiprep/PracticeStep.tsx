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

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Video,
  Volume2,
  Lock,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Info,
  Sparkles,
  Camera,
  Activity,
  Eye,
  Sun,
  Maximize,
  Sliders,
  ChevronRight,
  ArrowLeft,
  VolumeX,
} from 'lucide-react';

interface PracticeStepProps {
  videoEnabled: boolean;
  videoAnalyticsEnabled: boolean;
  cameraStream: MediaStream | null;
  selectedAudioLabel?: string;
  selectedVideoLabel?: string;
  onBack: () => void;
  onStartAssessment: () => void;
  isStarting?: boolean;
}

export const PracticeStep: React.FC<PracticeStepProps> = ({
  videoEnabled,
  videoAnalyticsEnabled,
  cameraStream,
  selectedAudioLabel = 'Default Microphone (Built-in)',
  selectedVideoLabel = 'FaceTime HD Camera (Built-in)',
  onBack,
  onStartAssessment,
  isStarting = false,
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const videoPlaybackRef = useRef<HTMLVideoElement | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

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

  // Sample Questions per track
  const sampleQuestion = !videoEnabled
    ? 'Tell us about a time you solved a challenging technical or business problem.'
    : videoAnalyticsEnabled
      ? 'Explain a project you are proud of, the architecture choices you made, and what you learned from it.'
      : 'Please introduce yourself and tell us about your background, core strengths, and goals.';

  // Connect live camera stream to video preview
  useEffect(() => {
    let localStream: MediaStream | null = null;

    async function initPreviewStream() {
      if (!videoEnabled || !liveVideoRef.current) return;

      let streamToUse = cameraStream;
      if (!streamToUse || !streamToUse.active) {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: true,
          });
          streamToUse = localStream;
        } catch (err) {
          console.warn('Failed to acquire fallback video stream:', err);
        }
      }

      if (liveVideoRef.current && streamToUse) {
        if (liveVideoRef.current.srcObject !== streamToUse) {
          liveVideoRef.current.srcObject = streamToUse;
          liveVideoRef.current.play().catch((e) => console.warn('Preview video play handled:', e));
        }
      }
    }

    initPreviewStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream, videoEnabled, isPlaying, testAudioUrl]);

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
      if (isPlaying) {
        pausePlayback();
      }
      setActiveView('LIVE');
      if (testAudioUrl) {
        URL.revokeObjectURL(testAudioUrl);
        setTestAudioUrl(null);
      }

      // Ensure we capture BOTH microphone audio and camera video tracks together
      const tracks: MediaStreamTrack[] = [];

      // 1. Acquire microphone audio track
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) {
          tracks.push(audioTrack);
        }
      } catch (aErr) {
        console.warn('Microphone stream acquire note:', aErr);
      }

      // 2. Acquire camera video track if video mode is enabled
      if (videoEnabled) {
        try {
          let vidTrack: MediaStreamTrack | null = null;
          if (
            cameraStream &&
            cameraStream.getVideoTracks().length > 0 &&
            cameraStream.getVideoTracks()[0].readyState === 'live'
          ) {
            vidTrack = cameraStream.getVideoTracks()[0];
          } else {
            const freshVidStream = await navigator.mediaDevices.getUserMedia({
              video: { width: 1280, height: 720 },
            });
            vidTrack = freshVidStream.getVideoTracks()[0];
          }
          if (vidTrack) {
            tracks.push(vidTrack);
          }
        } catch (vErr) {
          console.warn('Video stream acquire note:', vErr);
        }
      }

      const activeStream = new MediaStream(tracks);

      recordedChunksRef.current = [];
      const mimeType = videoEnabled
        ? MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

      const recorder = new MediaRecorder(activeStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setTestAudioUrl(url);
        setIsRecording(false);
        setActiveView('PLAYBACK');
      };

      recorder.start(500);
      setIsRecording(true);
      setRecordTime(0);

      const timer = setInterval(() => {
        setRecordTime((prev) => {
          if (prev >= 29) {
            clearInterval(timer);
            stopTestRecording();
            return 30;
          }
          return prev + 1;
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
    const finalSec = recordTime > 0 ? recordTime : 5;
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
    <div className="w-full flex flex-col justify-between h-full p-2 sm:p-4 space-y-4 animate-in fade-in duration-300">
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
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {modeVariant === 'AUDIO_ONLY' &&
            'Record a short sample response to make sure your microphone and speakers are working properly.'}
          {modeVariant === 'VIDEO_STANDARD' &&
            'Record a short sample response to make sure your camera, microphone and speakers are working properly.'}
          {modeVariant === 'VIDEO_ANALYTICS' &&
            'Record a short sample response and get real-time feedback on your presence and engagement (optional).'}
        </p>
      </div>

      {/* ── 3-COLUMN MAIN SANDBOX GRID ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-[340px] items-stretch">
        {/* ── COLUMN 1: Visual Stage / Audio Box (4 cols) ─────────────────── */}
        <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-xs min-h-[220px]">
          {modeVariant === 'AUDIO_ONLY' ? (
            /* Audio Test Circular Badge */
            <div className="flex flex-col items-center text-center space-y-3 py-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shadow-md">
                <Mic className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Audio Test</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                  Click the button and speak for 20–30 seconds.
                </p>
              </div>

              {/* Start / Stop Recording CTA */}
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startTestRecording}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-md hover:shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopTestRecording}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-md hover:shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer animate-pulse"
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
                      ? 'Analyzing…'
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

              {/* Video with Analytics: Augmented Facial Mesh Box */}
              {modeVariant === 'VIDEO_ANALYTICS' && activeView !== 'PLAYBACK' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="w-36 h-48 border-2 border-emerald-400/90 rounded-2xl shadow-[0_0_15px_rgba(52,211,153,0.3)] flex flex-col justify-between p-1.5 transition-all">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/70 px-1 rounded self-start">
                      ID: FACE_01
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/70 px-1 rounded self-end">
                      ENG: 98%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── COLUMN 2: Sample Question & Media Player Bar (5 cols) ───────── */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs space-y-4">
          {/* Top: Sample Question Card */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Sample question
              </span>
            </div>

            <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
              "{sampleQuestion}"
            </p>
          </div>

          {/* Center: Video Mode Start/Stop Button */}
          {modeVariant !== 'AUDIO_ONLY' && (
            <div className="flex items-center justify-start py-1">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startTestRecording}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-800 border-2 border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Start recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopTestRecording}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-md shadow-rose-600/30 active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  <span className="w-2.5 h-2.5 rounded-sm bg-white" />
                  <span>Stop recording ({30 - recordTime}s)</span>
                </button>
              )}
            </div>
          )}

          {/* Bottom: Interactive Scrubber & Audio Player Bar */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={togglePlayback}
                disabled={!testAudioUrl || isRecording}
                className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                title={testAudioUrl ? 'Play test recording' : 'Record a sample first to listen'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              {/* Time display */}
              <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
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
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Note banner: "This is just a test. Your recording will not be saved." */}
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs px-2">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>This is just a test. Your recording will not be saved.</span>
            </div>
          </div>
        </div>

        {/* ── COLUMN 3: Device Status OR Real-time Analytics (3 cols) ─────── */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          {modeVariant !== 'VIDEO_ANALYTICS' ? (
            /* Variant 1 & 2: Device Status Card */
            <div className="space-y-4">
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
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[130px]">
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
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[130px]">
                    <span className="truncate">{selectedAudioLabel}</span>
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">Speaker</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[130px]">
                    <span className="truncate">System Output</span>
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-snug">
                  {videoEnabled
                    ? 'Video and audio devices verified and locked for this session.'
                    : 'Audio devices verified and locked for this session.'}
                </p>
              </div>
            </div>
          ) : (
            /* Variant 3: Analytics (Live during recording) */
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Analytics (live during recording)
              </h3>

              <div className="space-y-2 text-xs">
                {[
                  { label: 'Face detection', icon: <Eye className="w-3 h-3" /> },
                  { label: 'Eye contact', icon: <Activity className="w-3 h-3" /> },
                  { label: 'Posture', icon: <Maximize className="w-3 h-3" /> },
                  { label: 'Lighting', icon: <Sun className="w-3 h-3" /> },
                  { label: 'Background', icon: <ShieldCheck className="w-3 h-3" /> },
                  { label: 'Speech volume', icon: <Mic className="w-3 h-3" /> },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400">{item.icon}</span>
                      <span className="font-semibold text-[11px]">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="w-full h-full bg-emerald-500 rounded-full" />
                      </div>
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                      <span>Ready</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Analytics will run during your recording. All settings are locked.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM NAVIGATION ACTIONS ──────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onStartAssessment}
          disabled={isStarting}
          className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
        >
          <span>{isStarting ? 'Starting session…' : 'Start Assessment'}</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

