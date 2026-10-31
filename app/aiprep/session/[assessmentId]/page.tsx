/**
 * Active Assessment Session Room Page
 * 
 * Route: /aiprep/session/[assessmentId]
 * Studio Cinema-Grade Layout with Floating Dock, Audio Equalizer, AI Voice & Real-time Slicing
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AiPrepReport from "@/components/aiprep/OverviewReport";
import { aiprepApi } from '@/lib/aiprep-api';
import type {
  AssessmentType,
  AssessmentStatus,
  MediaType,
  QuestionBankItem,
} from '@/types/aiprep';
import { NO_PAUSE_ASSESSMENT_TYPES } from '@/types/aiprep';
import { cleanTechnicalSpeech, formatAsSentence, appendDeduplicated } from '@/lib/aiprep-speech';
import { useTheme } from 'next-themes';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useChunkUploadQueue } from '@/hooks/useChunkUploadQueue';
import { ChunkedUploader } from '@/components/aiprep/ChunkedUploader';
import { useAssessmentTelemetry } from '@/hooks/useAssessmentTelemetry';
import { AIPrepTelemetry } from '@/lib/telemetry';
import { QuestionAction, SessionLifecycleStatus } from '@/types/telemetry';
import {
  IconMicrophone,
  IconPlayerPlay,
  IconChevronRight,
  IconChevronLeft,
  IconLogout,
  IconClock,
  IconAlertTriangle,
  IconLoader2,
  IconMessage2,
  IconVolume,
  IconVolumeOff,
  IconSparkles,
  IconLock,
  IconWifi,
  IconMaximize,
  IconMinimize,
  IconCheck,
  IconArrowRight,
  IconFileText,
  IconX,
} from '@tabler/icons-react';
import {
  getDifficultySeconds,
  getDefaultTypeSeconds,
} from '@/components/aiprep/assessment-details';

const introQuestionReadPulseStyles = `
@keyframes question-read-pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.08); }
  50% { box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.16); }
}
`;

/**
 * Compact Floating Audio Waveform Equalizer (Embedded in Camera Overlay)
 */
const EmbeddedAudioWaveform = memo(({ stream, isMuted, isLight = false }: { stream: MediaStream | null; isMuted: boolean; isLight?: boolean }) => {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(30).fill(3));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastDrawTime = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    let frameId: number | null = null;
    let audioCtx: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;

    if (!stream || isMuted) {
      setAudioLevels(Array(30).fill(3));
      return () => {
        cancelled = true;
      };
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        setAudioLevels(Array(30).fill(3));
        return () => {
          cancelled = true;
        };
      }

      audioCtx = new AudioCtx();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let previousDrawTime = 0;

      const renderWave = (time: number) => {
        if (cancelled || !analyser) return;

        if (time - previousDrawTime >= 40) {
          previousDrawTime = time;
          lastDrawTime.current = time;
          analyser.getByteFrequencyData(dataArray);

          const bars: number[] = [];
          for (let i = 0; i < 30; i++) {
            // Shape the live levels into a centered, tapered waveform like the design reference.
            const centerDistance = Math.abs(i - 14.5) / 14.5;
            const envelope = 0.12 + (1 - centerDistance) * 0.88;
            const liveLevel = (dataArray[i % dataArray.length] || 0) / 255;
            bars.push(Math.max(2, Math.round((4 + liveLevel * 34) * envelope)));
          }

          if (!cancelled) setAudioLevels(bars);
        }

        if (!cancelled) {
          frameId = requestAnimationFrame(renderWave);
          animFrameRef.current = frameId;
        }
      };

      frameId = requestAnimationFrame(renderWave);
      animFrameRef.current = frameId;
    } catch (error) {
      console.warn('Audio visualizer error:', error);
      cancelled = true;
      if (source) {
        try { source.disconnect(); } catch (_) {}
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        void audioCtx.close().catch(() => undefined);
      }
      if (audioContextRef.current === audioCtx) audioContextRef.current = null;
      if (analyserRef.current === analyser) analyserRef.current = null;
      setAudioLevels(Array(30).fill(3));
    }

    return () => {
      cancelled = true;

      if (frameId !== null) cancelAnimationFrame(frameId);
      if (animFrameRef.current === frameId) animFrameRef.current = null;

      if (source) {
        try { source.disconnect(); } catch (_) {}
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        void audioCtx.close().catch(() => undefined);
      }

      if (audioContextRef.current === audioCtx) audioContextRef.current = null;
      if (analyserRef.current === analyser) analyserRef.current = null;
    };
  }, [stream, isMuted]);

  if (isMuted && !isLight) return null;

  if (isLight) {
    return (
      <div className="flex items-center justify-center gap-[4px] h-12 overflow-hidden">
        {audioLevels.map((height, i) => (
          <div
            key={i}
            style={{ height: isMuted ? '3px' : `${height}px` }}
            className={`w-[5px] rounded-full shrink-0 transition-all duration-75 ${
              isMuted
                ? 'bg-slate-300 dark:bg-slate-600'
                : 'bg-gradient-to-t from-indigo-600 via-purple-500 to-indigo-400'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <style>{introQuestionReadPulseStyles}</style>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm transition-colors bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-lg">
      <IconMicrophone size={14} stroke={2} className="text-emerald-400 shrink-0" />
      <div className="flex items-center gap-[2.5px] h-4 overflow-hidden">
        {audioLevels.map((height, i) => (
          <div
            key={i}
            style={{ height: `${height}px` }}
            className="w-[2.5px] rounded-full shrink-0 transition-all duration-75 bg-gradient-to-t from-indigo-400 via-purple-400 to-cyan-300"
          />
        ))}
      </div>
      </div>
    </>
  );
});

EmbeddedAudioWaveform.displayName = 'EmbeddedAudioWaveform';

function AssessmentSessionPage({
  assessmentIdProp,
  onStartPendingAssessment,
  onBack,
}: {
  assessmentIdProp?: number;
  onStartPendingAssessment?: () => Promise<number>;
  onBack?: () => void;
} = {}) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const syncTheme = () => {
      try {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme && storedTheme !== theme) {
          setTheme(storedTheme);
        }
      } catch (_) { }
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, [theme, setTheme]);

  // Extract assessmentId from route params or prop
  const assessmentIdStr = params?.assessmentId;
  const assessmentId = assessmentIdProp !== undefined ? Number(assessmentIdProp) : (assessmentIdStr ? parseInt(assessmentIdStr as string, 10) : 0);
  const [finishedAssessmentId, setFinishedAssessmentId] = useState<number | null>(null);

  // Keep the session ID hidden before Start Assessment only for the four requested tracks.
  // INTRO and JD_INTRO retain their existing URL/navigation behavior.
  useEffect(() => {
    if (!assessmentId || typeof window === 'undefined') return;
    const activeType = window.sessionStorage.getItem('aiprep_active_type');
    if (!['TECHNICAL', 'RECRUITER', 'HIRING_MANAGER', 'SYSTEM_DESIGN'].includes(activeType || '')) return;
    // Keep the canonical Before You Begin URL stable on reload.
    if (window.location.pathname === '/aiprep/start') return;
    const isStartRoute = window.location.pathname === '/aiprep/session/start';
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const previouslyLoadedRoomId = window.sessionStorage.getItem('aiprep_room_loaded_session_id');
    let loadedDocumentPath = '';
    try {
      loadedDocumentPath = navigationEntry?.name ? new URL(navigationEntry.name, window.location.origin).pathname : '';
    } catch (_) {}
    // Only treat it as a room reload when the document itself originally loaded
    // at this room URL; SPA navigation from /aiprep/start is not a reload.
    if (
      navigationEntry?.type === 'reload' &&
      loadedDocumentPath === `/aiprep/session/${assessmentId}` &&
      previouslyLoadedRoomId === String(assessmentId)
    ) return;
    const hasStarted = window.sessionStorage.getItem(`aiprep_started_${assessmentId}`) === 'true';
    const isAutoStarting = window.sessionStorage.getItem(`aiprep_autostart_assessment_${assessmentId}`) === 'true';
    // A Start Assessment click from the instructions page has already authorized
    // the transition. Do not rewrite the destination URL back to the instructions route.
    if (!hasStarted && !isAutoStarting) {
      window.sessionStorage.setItem('aiprep_pending_assessment_id', String(assessmentId));
      if (!isStartRoute) window.history.replaceState(null, '', '/aiprep/session/start');
    } else if (isStartRoute) {
      window.history.replaceState(null, '', `/aiprep/session/${assessmentId}`);
    }
  }, [assessmentId]);

  const isEmbedded = searchParams?.get('embed') === 'true';


  // Core session metadata
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem('aiprep_active_type');
      if (stored) return stored as AssessmentType;
      const rawPending = window.sessionStorage.getItem('aiprep_pending_setup_results') || window.sessionStorage.getItem('aiprep_hardware_check');
      if (rawPending) {
        try {
          const parsed = JSON.parse(rawPending);
          if (parsed.assessment_type) return parsed.assessment_type as AssessmentType;
        } catch (_) {}
      }
    }
    return 'TECHNICAL';
  });
  const [mediaType, setMediaType] = useState<MediaType>(() => {
    if (typeof window !== 'undefined') {
      const mode = window.sessionStorage.getItem('aiprep_active_mode');
      if (mode === 'VIDEO_AUDIO' || mode === 'VIDEO') return 'VIDEO_AUDIO';
      const videoEnabled = window.sessionStorage.getItem('aiprep_video_enabled');
      if (videoEnabled === 'true') return 'VIDEO_AUDIO';
      const rawPending = window.sessionStorage.getItem('aiprep_pending_setup_results') || window.sessionStorage.getItem('aiprep_hardware_check');
      if (rawPending) {
        try {
          const parsed = JSON.parse(rawPending);
          if (parsed.video_enabled === true) return 'VIDEO_AUDIO';
        } catch (_) {}
      }
    }
    return 'AUDIO_ONLY';
  });
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  // Hold technical questions out of rendered state until Start Assessment is clicked.
  const pendingAssessmentQuestionsRef = useRef<QuestionBankItem[]>([]);
  const pendingAudioUploadsRef = useRef<Promise<any>[]>([]);
  const currentQuestionIndexRef = useRef<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Unique session ID per assessment attempt to avoid cross-attempt collisions in analytics (MEDIUM 2)
  const attemptSessionId = React.useMemo(() => {
    if (typeof window === 'undefined' || !assessmentId) return `session_${assessmentId || 'init'}_${Date.now()}`;
    const storageKey = `aiprep_attempt_session_${assessmentId}`;
    try {
      let existing = window.sessionStorage.getItem(storageKey);
      if (!existing) {
        existing = `attempt_${assessmentId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        window.sessionStorage.setItem(storageKey, existing);
      }
      return existing;
    } catch (_) {
      return `attempt_${assessmentId}_${Date.now()}`;
    }
  }, [assessmentId]);


  // Maximum recording duration — 5 min for INTRO/JD_INTRO, 30 min for all other types
  // Derived via useMemo so it updates once assessmentType is resolved from the backend
  const MAX_RECORDING_SECONDS = React.useMemo(() => {
    if (assessmentType === 'INTRO' || assessmentType === 'JD_INTRO') return 5 * 60;
    return 30 * 60;
  }, [assessmentType]);

  // Status & loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [submissionProgress, setSubmissionProgress] = useState<number>(0);
  const [submissionStep, setSubmissionStep] = useState<string>("Preparing submission…");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-Tab Session Ownership & Duplicate Tab Tracking
  const [currentTabId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      let id = window.sessionStorage.getItem('aiprep_tab_instance_id');
      if (!id) {
        id = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        window.sessionStorage.setItem('aiprep_tab_instance_id', id);
      }
      return id;
    } catch (_) {
      return `tab_${Date.now()}`;
    }
  });

  const [hasSessionInit] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !assessmentId) return true;
    try {
      const activeId = window.sessionStorage.getItem('aiprep_active_id');
      return Boolean(activeId && String(activeId) === String(assessmentId));
    } catch (_) {
      return true;
    }
  });

  const [isSessionActiveInOtherTab, setIsSessionActiveInOtherTab] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !assessmentId) return false;
    try {
      const raw = localStorage.getItem(`aiprep_active_session_${assessmentId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        let tabId = window.sessionStorage.getItem('aiprep_tab_instance_id');
        if (parsed?.tabId && parsed.tabId !== tabId && (Date.now() - (parsed.heartbeat || 0) < 25000)) {
          return true;
        }
      }
    } catch (_) {}
    return false;
  });

  const [closeTabNotice, setCloseTabNotice] = useState<boolean>(false);

  // Countdown overlay before recording starts
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isInitialQuestionCountdown, setIsInitialQuestionCountdown] = useState(false);
  const hasAutoStartedRef = useRef<boolean>(false);
  const countdownIntervalRef = useRef<any>(null);
  const sessionInitializedRef = useRef<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Live Speech Recognition Transcript & Retention Buffers
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const accumulatedTranscriptRef = useRef<string>('');
  const currentInterimRef = useRef<string>('');
  const transcriptSegmentsRef = useRef<
    Array<{ speaker: string; text: string; timestamp: string; timestamp_s: number }>
  >([]);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<any>(null);
  // Guard: only reset transcript on very first recording start, not on question-transition restarts
  const transcriptInitializedRef = useRef<boolean>(false);
  useEffect(() => {
    transcriptInitializedRef.current = false;
  }, [assessmentId]);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Per-Question Time Tracking & Multi-Question Answers
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState<number>(0);
  const [questionTimeLimit, setQuestionTimeLimit] = useState<number>(180);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
  const [isTransitioningQuestion, setIsTransitioningQuestion] = useState<boolean>(false);
  const [isQuestionPrepPaused, setIsQuestionPrepPaused] = useState<boolean>(false);
  const [hasStartedQuestion, setHasStartedQuestion] = useState<boolean>(false);
  // On a direct transition from Before You Begin, hide the instructions immediately
  // while the session restores its questions and starts the countdown.
  const [isAutoStarting, setIsAutoStarting] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !assessmentId) return false;
    return window.sessionStorage.getItem(`aiprep_autostart_assessment_${assessmentId}`) === 'true';
  });
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  const elapsedTimeRef = useRef<number>(0);
  const cumulativeRecordedSecondsRef = useRef<number>(0);
  const sessionStartedAtRef = useRef<number | null>(null);

  // ── Slicing state for INTRO & JD_INTRO (2-slice midpoint architecture) ──
  const introSlice0UploadedRef = useRef<boolean>(false);
  const pendingIntroSlice0PromiseRef = useRef<Promise<any> | null>(null);
  const introSlice0BlobRef = useRef<Blob | null>(null);
  const totalIntroChunksRef = useRef<number>(1);

  // Target Job Description State (for JD_INTRO track)
  const [jobDescription, setJobDescription] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');
  const [targetCompany, setTargetCompany] = useState<string>('');
  const [showJdModal, setShowJdModal] = useState<boolean>(false);

  // Exit Modal & Session Exited Guard
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const isExitingRef = useRef<boolean>(false);

  const [isSessionAlreadyEnded, setIsSessionAlreadyEnded] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !assessmentId) return false;
    try {
      return Boolean(
        localStorage.getItem(`aiprep_exited_${assessmentId}`) === 'true' ||
        sessionStorage.getItem(`aiprep_exited_${assessmentId}`) === 'true' ||
        localStorage.getItem(`aiprep_finished_${assessmentId}`) === 'true'
      );
    } catch (_) {
      return false;
    }
  });

  // Speech Synthesis (AI Voice Reading)
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isSpeechMuted, setIsSpeechMuted] = useState<boolean>(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [cachedVoices, setCachedVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Cross-browser voice caching & compatibility
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const populateVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setCachedVoices(v);
        }
      } catch (_) { }
    };
    populateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', populateVoices);
    };
  }, []);

  // ── Multi-Tab Coordination & Active Session Heartbeat ────────────────────
  useEffect(() => {
    if (!assessmentId || typeof window === 'undefined') return;

    // 1. Initial check of active session owner in localStorage
    try {
      const raw = localStorage.getItem(`aiprep_active_session_${assessmentId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.tabId && parsed.tabId !== currentTabId && (Date.now() - (parsed.heartbeat || 0) < 25000)) {
          setIsSessionActiveInOtherTab(true);
        }
      }
    } catch (_) {}

    // 2. BroadcastChannel coordination
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`aiprep_session_${assessmentId}`);
      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === 'PING_ACTIVE_SESSION' && data.tabId !== currentTabId) {
          if (!isSessionActiveInOtherTab && questions.length > 0) {
            channel?.postMessage({
              type: 'PONG_ACTIVE_SESSION',
              tabId: currentTabId,
              assessmentId,
            });
          }
        } else if (data.type === 'PONG_ACTIVE_SESSION' && data.tabId !== currentTabId) {
          setIsSessionActiveInOtherTab(true);
          setIsLoading(false);
        }
      };
      channel.postMessage({ type: 'PING_ACTIVE_SESSION', tabId: currentTabId, assessmentId });
    } catch (_) {}

    // 3. Heartbeat if this tab owns the active session
    const heartbeatTimer = setInterval(() => {
      if (!isSessionActiveInOtherTab && questions.length > 0) {
        try {
          localStorage.setItem(`aiprep_active_session_${assessmentId}`, JSON.stringify({
            tabId: currentTabId,
            heartbeat: Date.now(),
            assessmentId,
          }));
        } catch (_) {}
      }
    }, 4000);

    return () => {
      clearInterval(heartbeatTimer);
      try {
        channel?.close();
      } catch (_) {}
      try {
        const raw = localStorage.getItem(`aiprep_active_session_${assessmentId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.tabId === currentTabId) {
            localStorage.removeItem(`aiprep_active_session_${assessmentId}`);
          }
        }
      } catch (_) {}
    };
  }, [assessmentId, currentTabId, isSessionActiveInOtherTab, questions, setIsLoading, setIsSessionActiveInOtherTab]);

  const handleCloseTab = () => {
    try {
      window.close();
      setTimeout(() => {
        setCloseTabNotice(true);
      }, 300);
    } catch (_) {
      setCloseTabNotice(true);
    }
  };

  // Speech Recognition Safety Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) { }
      }
    };
  }, [restartTimeoutRef, recognitionRef]);

  const getBestVoice = useCallback((voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    if (!voices || voices.length === 0) return undefined;
    return (
      voices.find((v) => v.name.includes('Google US English') || (v.name.includes('Google') && v.lang.startsWith('en'))) ||
      voices.find((v) => (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen')) && v.lang.startsWith('en')) ||
      voices.find((v) => v.lang === 'en-US' || v.lang === 'en-GB' || v.lang.startsWith('en')) ||
      voices[0]
    );
  }, []);

  // Video element ref
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fullscreen & Network Quality States
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'average' | 'bad'>('good');

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
        setIsFullscreen(false);
      }
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const checkConnection = () => {
      if (typeof window === 'undefined') return;
      if (!navigator.onLine) {
        setNetworkQuality('bad');
        return;
      }
      const conn = (navigator as any).connection;
      if (conn) {
        const downlink = conn.downlink || 10;
        const rtt = conn.rtt || 50;
        if (downlink >= 4 && rtt < 250) {
          setNetworkQuality('good');
        } else if (downlink >= 1 && rtt < 600) {
          setNetworkQuality('average');
        } else {
          setNetworkQuality('bad');
        }
      } else {
        setNetworkQuality('good');
      }
    };

    checkConnection();
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    if (conn && conn.addEventListener) conn.addEventListener('change', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      if (conn && conn.removeEventListener) conn.removeEventListener('change', checkConnection);
    };
  }, []);

  const isIntroType = assessmentType === 'INTRO' || assessmentType === 'JD_INTRO';
  const isMultiQuestion =
    assessmentType === 'TECHNICAL' ||
    assessmentType === 'HIRING_MANAGER' ||
    assessmentType === 'RECRUITER' ||
    assessmentType === 'SYSTEM_DESIGN';
  const assessmentTitle = ({
    INTRO: 'INTRO Assessment',
    JD_INTRO: 'JD Walkthrough Assessment',
    RECRUITER: 'RECRUITER Assessment',
    HIRING_MANAGER: 'HIRING MANAGER Assessment',
    TECHNICAL: 'TECHNICAL Assessment',
    SYSTEM_DESIGN: 'SYSTEM DESIGN Assessment',
  } as Record<string, string>)[assessmentType] || assessmentType.replace(/_/g, ' ') + ' Assessment';
  const assessmentNoun = ({
    INTRO: 'introductory',
    JD_INTRO: 'job description walkthrough',
    RECRUITER: 'recruiter',
    HIRING_MANAGER: 'hiring manager',
    TECHNICAL: 'technical',
    SYSTEM_DESIGN: 'system design',
  } as Record<string, string>)[assessmentType] || assessmentType.replace(/_/g, ' ').toLowerCase();
  const isAudioOnly = mediaType === 'AUDIO' || mediaType === 'AUDIO_ONLY';

  // ── Chunk Upload Queue Hook ────────────────────────────────────────────────
  const {
    totalChunks,
    uploadedChunks,
    pendingChunks,
    failedChunks,
    isUploading,
    isComplete,
    enqueueChunk,
    retryFailedChunks,
    clearQueue,
    waitForAllChunks,
  } = useChunkUploadQueue({
    assessmentId,
    mediaType: typeof mediaType === 'string' ? mediaType : 'VIDEO',
  });

  const isUploadingRef = useRef(isUploading);
  useEffect(() => {
    isUploadingRef.current = isUploading;
  }, [isUploading]);

  const pendingChunksRef = useRef(pendingChunks);
  useEffect(() => {
    pendingChunksRef.current = pendingChunks;
  }, [pendingChunks]);

  // Buffer of recorded raw chunks for instant zero-pause JavaScript playback
  const localChunksRef = useRef<Blob[]>([]);


  // ── Audio Recorder Hook (Continuous Single-Upload for Audio Assessments) ──
  const {
    status: audioRecordingStatus,
    stream: audioStream,
    elapsedTime: audioElapsedTime,
    startRecording: startAudioRecorder,
    stopRecording: stopAudioRecorder,
    cleanup: cleanupAudioRecorder,
  } = useAudioRecorder({
    onError: (err) => {
      console.warn('[AudioRecorder] Recording could not start:', err.message);
      setErrorMsg(err.message || 'Audio recording failed.');
    },
  });

  // ── Media Recorder Hook (Continuous Question Buffering for Video Assessments) ──
  const {
    status: videoRecordingStatus,
    stream: videoStream,
    elapsedTime: videoElapsedTime,
    openStream: openVideoStream,
    startRecording: startVideoRecorder,
    stopRecording: stopVideoRecorder,
    cleanup: cleanupVideoRecorder,
  } = useMediaRecorder({
    mediaType: typeof mediaType === 'string' ? mediaType : 'VIDEO',
    chunkDurationMs: 0,
    onChunkReady: (blob, chunkIdx, isFinal) => {
      if (isAudioOnly) return;
      console.log(`[Media Pipeline] Produced slice #${chunkIdx} (${Math.round(blob.size / 1024)} KB, isFinal: ${isFinal})`);
      if (blob && blob.size > 0) {
        localChunksRef.current.push(blob);
      }
      if (!isIntroType && !isMultiQuestion && (!questions || questions.length <= 1)) {
        enqueueChunk(blob, chunkIdx, isFinal);
      }
    },
    onError: (err) => {
      console.warn('[MediaRecorder] Recording could not start:', err.message);
      setErrorMsg(err.message || 'Media recording failed.');
    },
  });

  const recordingStatus = isAudioOnly ? audioRecordingStatus : videoRecordingStatus;
  const stream = isAudioOnly ? audioStream : videoStream;
  const elapsedTime = isAudioOnly ? audioElapsedTime : videoElapsedTime;
  const startRecorderCore = isAudioOnly ? startAudioRecorder : startVideoRecorder;
  const stopRecording = isAudioOnly ? stopAudioRecorder : stopVideoRecorder;
  const cleanupRecorder = isAudioOnly ? cleanupAudioRecorder : cleanupVideoRecorder;

  const isRecording = recordingStatus === 'recording';
  const isInactive = recordingStatus === 'idle';

  const isRecordingRef = useRef<boolean>(isRecording);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const startRecorderRef = useRef(startRecorderCore);
  startRecorderRef.current = startRecorderCore;
  const cleanupRecorderRef = useRef(cleanupRecorder);
  cleanupRecorderRef.current = cleanupRecorder;
  const startAnswerRef = useRef<() => void>(() => { });
  const preparationCancelledRef = useRef(false);
  const startAnswerInFlightRef = useRef(false);

  // Allow an explicit retry if browser permissions or MediaRecorder startup fails.
  useEffect(() => {
    if (recordingStatus === 'error') {
      startAnswerInFlightRef.current = false;
    }
  }, [recordingStatus]);

  // ── AI Voice Synthesis Methods ─────────────────────────────────────────────
  const stopAiSpeech = useCallback(() => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) { }
    }
    speechUtteranceRef.current = null;
    setIsAiSpeaking(false);
  }, []);

  const speakAiText = useCallback(
    (text: string): Promise<void> => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || isSpeechMuted) {
        return Promise.resolve();
      }

      stopAiSpeech();

      return new Promise<void>((resolve) => {
        let settled = false;
        let speechStarted = false;
        const finishSpeech = () => {
          if (settled) return;
          settled = true;
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
          }
          speechUtteranceRef.current = null;
          setIsAiSpeaking(false);
          resolve();
        };

        try {
          const cleanText = text.replace(/^"|"$/g, '').trim();
          if (!cleanText) {
            finishSpeech();
            return;
          }
          const utterance = new SpeechSynthesisUtterance(cleanText);
          speechUtteranceRef.current = utterance;

          const currentVoices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
          const preferredVoice = getBestVoice(currentVoices);

          if (preferredVoice) utterance.voice = preferredVoice;
          utterance.rate = 0.95;

          setIsAiSpeaking(true);
          utterance.onstart = () => {
            speechStarted = true;
            setIsAiSpeaking(true);
            if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = setTimeout(() => {
              try { window.speechSynthesis.cancel(); } catch (_) {}
              finishSpeech();
            }, 45_000);
          };
          utterance.onend = finishSpeech;
          utterance.onerror = finishSpeech;

          // Some browsers never fire onend/onerror; prevent a permanent standby state.
          speechTimeoutRef.current = setTimeout(() => {
            if (!speechStarted) console.warn('AI narration did not start; continuing assessment startup.');
            try { window.speechSynthesis.cancel(); } catch (_) {}
            finishSpeech();
          }, 10_000);
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('Speech synthesis error:', err);
          finishSpeech();
        }
      });
    },
    [isSpeechMuted, stopAiSpeech, cachedVoices, getBestVoice]
  );

  const toggleAiVoiceMute = () => {
    if (isAiSpeaking) {
      stopAiSpeech();
      setIsSpeechMuted(true);
    } else {
      setIsSpeechMuted(false);
      const activeQ = questions[currentQuestionIndex];
      if (activeQ?.question_text) {
        speakAiText(activeQ.question_text);
      }
    }
  };

  // ── Clean Exit Session Handler ──────────────────────────────────────────────
  const handleExitSession = useCallback(async () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    preparationCancelledRef.current = true;
    setPrepCountdown(null);
    setIsSessionAlreadyEnded(true);
    setShowExitModal(false);

    if (countdownIntervalRef.current && typeof window !== 'undefined') {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    stopAiSpeech();
    try {
      cleanupAudioRecorder();
    } catch (_) {}
    try {
      cleanupVideoRecorder();
    } catch (_) {}
    clearQueue();

    if (typeof window !== 'undefined') {
      try {
        if (assessmentId) {
          localStorage.setItem(`aiprep_exited_${assessmentId}`, 'true');
          sessionStorage.setItem(`aiprep_exited_${assessmentId}`, 'true');
          localStorage.removeItem(`aiprep_active_session_${assessmentId}`);
        }
        sessionStorage.removeItem('aiprep_active_id');
        sessionStorage.removeItem('aiprep_active_questions');
        sessionStorage.removeItem('aiprep_active_type');
        sessionStorage.removeItem('aiprep_active_mode');
        sessionStorage.removeItem('aiprep_video_enabled');
        sessionStorage.removeItem('aiprep_consent_analytics');
        sessionStorage.removeItem('aiprep_consent_recording');
        sessionStorage.removeItem('aiprep_consent_transcript');
        sessionStorage.removeItem('aiprep_wizard_step');
        sessionStorage.removeItem('aiprep_hardware_check');
        sessionStorage.removeItem('aiprep_pending_setup_results');
        sessionStorage.removeItem('aiprep_pending_assessment_creation');
        sessionStorage.removeItem('aiprep_jd_text');
        sessionStorage.removeItem('aiprep_jd_filename');
        sessionStorage.removeItem('aiprep_jd_role');
        sessionStorage.removeItem('aiprep_jd_company');
        localStorage.removeItem('aiprep_hardware_check');
        window.dispatchEvent(
          new CustomEvent('aiprep-layout-mode', {
            detail: { active: false, isWizardActive: false, headerCollapsed: false, fullscreen: false },
          })
        );
      } catch (_) {}
    }

    try {
      if (assessmentId) {
        await aiprepApi.cancelAssessment(assessmentId);
      }
    } catch (e) {
      console.warn('Failed to cancel assessment on server:', e);
    }

    const targetUrl = isEmbedded ? '/user_dashboard/ai-prep?embed=true' : '/user_dashboard/ai-prep';
    try {
      if (typeof window !== 'undefined' && window.history && History?.prototype?.replaceState) {
        History.prototype.replaceState.call(window.history, {}, '', targetUrl);
      }
    } catch (_) {}
    router.replace(targetUrl);
  }, [assessmentId, isEmbedded, router, stopAiSpeech, cleanupRecorder, clearQueue, setIsSessionAlreadyEnded, setShowExitModal]);

  // Cancel only when the browser reports a real reload of the same assessment room.
  // beforeunload is intentionally not used because it also fires for tab close/navigation.
  useEffect(() => {
    if (!assessmentId || typeof window === 'undefined') return;

    const cancelledByReloadKey = `aiprep_reload_cancelled_${assessmentId}`;
    if (localStorage.getItem(cancelledByReloadKey) === 'true') {
      setIsSessionAlreadyEnded(true);
      router.replace(`/aiprep/reports/${assessmentId}`);
      return;
    }

    const previousRoomSessionId = sessionStorage.getItem('aiprep_room_loaded_session_id');
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    // The Navigation Timing entry describes the document's original load, not the
    // current Next.js route. A reload of /aiprep/start followed by client navigation
    // must not be mistaken for reloading this assessment room.
    let loadedDocumentPath = '';
    try {
      loadedDocumentPath = navigationEntry?.name ? new URL(navigationEntry.name, window.location.origin).pathname : '';
    } catch (_) {}
    const isReloadOfThisSession =
      navigationEntry?.type === 'reload' &&
      loadedDocumentPath === `/aiprep/session/${assessmentId}` &&
      previousRoomSessionId === String(assessmentId);

    // Clear legacy markers written by the old beforeunload implementation. They must
    // never cause a cancellation because they may represent navigation or tab closing.
    sessionStorage.removeItem(`aiprep_reload_pending_${assessmentId}`);

    // Record the room currently being opened. A different ID means a fresh attempt.
    sessionStorage.setItem('aiprep_room_loaded_session_id', String(assessmentId));
    if (!isReloadOfThisSession) return;

    localStorage.setItem(cancelledByReloadKey, 'true');
    localStorage.setItem(`aiprep_exited_${assessmentId}`, 'true');
    sessionStorage.setItem(`aiprep_exited_${assessmentId}`, 'true');
    localStorage.removeItem(`aiprep_active_session_${assessmentId}`);
    sessionStorage.removeItem('aiprep_active_id');
    sessionStorage.removeItem('aiprep_active_questions');
    sessionStorage.removeItem(`aiprep_autostart_assessment_${assessmentId}`);

    preparationCancelledRef.current = true;
    setIsSessionAlreadyEnded(true);
    stopAiSpeech();
    cleanupRecorder();
    clearQueue();
    void aiprepApi.cancelAssessment(assessmentId)
      .catch((error) => console.warn('Failed to cancel assessment after reload:', error))
      .finally(() => {
        // Show the cancellation/evaluation page for this attempt instead of rendering
        // Before You Begin again. The user can return to AI Prep from there.
        router.replace(`/aiprep/reports/${assessmentId}`);
      });
  }, [assessmentId, router, stopAiSpeech, cleanupRecorder, clearQueue]);

  // Immediate redirect & history check if this session was already exited or finished
  useEffect(() => {
    if (!assessmentId || typeof window === 'undefined') return;
    const isEnded = Boolean(
      localStorage.getItem(`aiprep_exited_${assessmentId}`) === 'true' ||
      sessionStorage.getItem(`aiprep_exited_${assessmentId}`) === 'true' ||
      localStorage.getItem(`aiprep_finished_${assessmentId}`) === 'true'
    );
    if (isEnded && localStorage.getItem(`aiprep_reload_cancelled_${assessmentId}`) !== 'true') {
      setIsSessionAlreadyEnded(true);
      const targetUrl = isEmbedded ? '/user_dashboard/ai-prep?embed=true' : '/user_dashboard/ai-prep';
      try {
        if (window.history && History?.prototype?.replaceState) {
          History.prototype.replaceState.call(window.history, {}, '', targetUrl);
        }
      } catch (_) {}
      router.replace(targetUrl);
    }
  }, [assessmentId, isEmbedded, router]);

  // Intercept browser Back button while inside active assessment room (only once answering has started)
  useEffect(() => {
    if (typeof window === 'undefined' || !assessmentId || !hasStartedQuestion || isSessionAlreadyEnded || finishedAssessmentId) return;

    try {
      window.history.pushState({ aiprepSessionActive: assessmentId }, '', window.location.href);
    } catch (_) {}

    const handlePopState = () => {
      if (isExitingRef.current) return;
      setShowExitModal(true);
      try {
        window.history.pushState({ aiprepSessionActive: assessmentId }, '', window.location.href);
      } catch (_) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [assessmentId, hasStartedQuestion, isSessionAlreadyEnded, finishedAssessmentId]);

  // ── Initialize Session Metadata & Questions from Backend DB ────────────────
  useEffect(() => {
    if (!assessmentId && (onStartPendingAssessment || (typeof window !== 'undefined' && Boolean(window.sessionStorage.getItem('aiprep_pending_setup_results'))))) {
      const pendingType = (typeof window !== 'undefined' ? window.sessionStorage.getItem('aiprep_active_type') : null) as AssessmentType | null;
      const pendingMode = (typeof window !== 'undefined' ? window.sessionStorage.getItem('aiprep_active_mode') : null) as MediaType | null;
      if (pendingType) setAssessmentType(pendingType);
      if (pendingMode) setMediaType(pendingMode);
      setQuestions([{ id: 0, question_text: '', difficulty_level: 'MEDIUM', category: '', is_active: true }]);
      setIsLoading(false);
      return;
    }
    if (!assessmentId) {
      setErrorMsg('No assessment ID provided. Please start from the assessment portal.');
      setIsLoading(false);
      return;
    }
    if (sessionInitializedRef.current || isSessionAlreadyEnded) return;
    sessionInitializedRef.current = true;

    async function initSession() {
      try {
        // Guard against previously exited or completed session (Double-Attempt Guard via POST session lifecycle)
        if (typeof window !== 'undefined') {
          const wasExited = Boolean(
            localStorage.getItem(`aiprep_exited_${assessmentId}`) === 'true' ||
            sessionStorage.getItem(`aiprep_exited_${assessmentId}`) === 'true' ||
            localStorage.getItem(`aiprep_finished_${assessmentId}`) === 'true'
          );
          if (wasExited) {
            setIsSessionAlreadyEnded(true);
            const targetUrl = isEmbedded ? '/user_dashboard/ai-prep?embed=true' : `/aiprep/reports/${assessmentId}`;
            router.replace(targetUrl);
            return;
          }

          // Double-Attempt & URL Tampering Guard:
          // Ensure the user entered from an authorized POST creation flow for this exact assessment ID
          const activeSessionId = sessionStorage.getItem('aiprep_active_id');
          if (activeSessionId && String(activeSessionId) !== String(assessmentId)) {
            setIsSessionAlreadyEnded(true);
            const targetUrl = isEmbedded ? '/user_dashboard/ai-prep?embed=true' : '/user_dashboard/ai-prep';
            router.replace(targetUrl);
            return;
          }
        }

        setIsLoading(true);

        // 1. Recover stored session track & mode directly from sessionStorage (populated via POST /assessments)
        const resolvedType: AssessmentType = typeof window !== 'undefined' ? ((window.sessionStorage.getItem('aiprep_active_type') as AssessmentType) || 'INTRO') : 'INTRO';
        const resolvedMode: MediaType = typeof window !== 'undefined' ? ((window.sessionStorage.getItem('aiprep_active_mode') as MediaType) || 'AUDIO_ONLY') : 'AUDIO_ONLY';
        let loadedQuestions: QuestionBankItem[] = [];

        const finalType: AssessmentType = resolvedType || 'INTRO';
        const finalMode: MediaType = (resolvedMode === 'VIDEO_AUDIO' || resolvedMode === 'VIDEO') ? 'VIDEO_AUDIO' : (resolvedMode || 'AUDIO_ONLY');

        if (finalType === 'JD_INTRO') {
          const storedJd = typeof window !== 'undefined' ? window.sessionStorage.getItem('aiprep_jd_text') : null;
          const storedRole = typeof window !== 'undefined' ? window.sessionStorage.getItem('aiprep_jd_role') : null;
          const storedCompany = typeof window !== 'undefined' ? window.sessionStorage.getItem('aiprep_jd_company') : null;
          if (storedJd) setJobDescription((prev) => prev || storedJd);
          if (storedRole) setTargetRole(storedRole);
          if (storedCompany) setTargetCompany(storedCompany);
        } else {
          setJobDescription('');
          setTargetRole('');
          setTargetCompany('');
        }

        setAssessmentType(finalType);
        setMediaType(finalMode);

        // 2. Load cached questions directly from sessionStorage (populated via POST /assessments)
        try {
          const cachedQ = typeof window !== 'undefined' ? window.sessionStorage.getItem('aiprep_active_questions') : null;
          if (cachedQ) {
            const parsed = JSON.parse(cachedQ);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedQuestions = parsed as QuestionBankItem[];
            }
          }
        } catch (_) {}

        // For JD Walkthrough fallback if session storage is unavailable
        if ((!loadedQuestions || loadedQuestions.length === 0) && finalType === 'JD_INTRO') {
          loadedQuestions = [
            {
              id: 1,
              question_id: 1,
              question_text: 'Please introduce yourself and walk through your professional background, highlighting the key experiences and technical skills that align with this job description.',
              category: 'JD_INTRO',
              difficulty_level: 'MEDIUM',
              is_active: true,
            } as QuestionBankItem,
          ];
        }

        // Assessments strictly use the question snapshot returned by the POST creation endpoint.
        // No GET question bank endpoint is called.
        if (!loadedQuestions || loadedQuestions.length === 0) {
          setErrorMsg('No interview questions found for this assessment session. Please return to the portal and try again.');
          setIsLoading(false);
          return;
        }

        // Keep real questions out of rendered state until Start Assessment is clicked.
        // The instructions overlay can render using a blank placeholder without exposing a prompt.
        pendingAssessmentQuestionsRef.current = Array.isArray(loadedQuestions) ? loadedQuestions : [];
        setQuestions([{ id: 0, question_text: '', difficulty_level: 'MEDIUM', category: '', is_active: true }]);
        setCurrentQuestionIndex(0);
        if (typeof window !== 'undefined' && window.sessionStorage.getItem(`aiprep_autostart_assessment_${assessmentId}`) === 'true') {
          setIsAutoStarting(true);
          window.sessionStorage.removeItem(`aiprep_autostart_assessment_${assessmentId}`);
          // Start synchronously in this effect instead of scheduling a zero-delay
          // timeout. The timeout allowed one paint of the Before You Begin screen
          // after navigation, even though the candidate had already clicked Start.
          void startAnswerRef.current();
        }

        // If intro track, trigger 7-second auto countdown to start practice smoothly
        if (NO_PAUSE_ASSESSMENT_TYPES.includes(finalType) && !hasAutoStartedRef.current) {
          hasAutoStartedRef.current = true;
          let currentCount = 7;
          setCountdownValue(currentCount);
          countdownIntervalRef.current = typeof window !== 'undefined' ? window.setInterval(() => {
            currentCount -= 1;
            if (currentCount <= 0) {
              if (countdownIntervalRef.current) {
                window.clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              setCountdownValue(null);
              startAnswerRef.current();
            } else {
              setCountdownValue(currentCount);
            }
          }, 1000) : null;
        }
      } catch (err: any) {
        console.error('Session initialization error:', err);
        setErrorMsg(err?.message || 'Failed to initialize assessment session.');
      } finally {
        setIsLoading(false);
      }
    }

    initSession();

    return () => {
      stopAiSpeech();
      if (countdownIntervalRef.current && typeof window !== 'undefined') window.clearInterval(countdownIntervalRef.current);
      cleanupRecorderRef.current();
    };
  }, [
    assessmentId,
    onStartPendingAssessment,
    stopAiSpeech,
    retryCount,
    setIsLoading,
    setErrorMsg,
    setAssessmentType,
    setMediaType,
    setJobDescription,
    setTargetRole,
    setTargetCompany,
    setQuestions,
    setCountdownValue,
    sessionInitializedRef,
    hasAutoStartedRef,
    startAnswerRef,
    countdownIntervalRef,
    cleanupRecorderRef,
  ]);

  // Connect video element to active stream (both via callback ref and effect for resilience)
  const bindVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && stream && node.srcObject !== stream) {
      node.srcObject = stream;
      node.play().catch((e) => console.warn('Video auto-play handled:', e));
    }
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn('Video auto-play handled:', e));
      }
    }
  }, [stream]);

  // Read question aloud when question index changes or when recording starts
  // (Removed to prevent double-speak since handleStartAnswer handles the AI dictation before recording)

  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  // ── Live Speech Recognition ────────────────────────────────────────────────
  // Accumulates finalized sentences separately from interim results so the
  // transcript preserves full sentence history instead of overwriting on each event.
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isRecording && SpeechRecognition) {
      // Only reset transcript on the very first recording start.
      // Question transitions cause isRecording to briefly toggle off/on — we must NOT wipe
      // accumulated text in those cases or the display goes blank mid-session.
      if (!transcriptInitializedRef.current) {
        transcriptInitializedRef.current = true;
        finalTranscriptRef.current = '';
        accumulatedTranscriptRef.current = '';
        setLiveTranscript('');
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        // Auto-detect Indian English locale or candidate's browser locale to drastically improve STT phonetic matching
        const hasIntl = typeof window !== 'undefined' && typeof window.Intl !== 'undefined';
        const browserNav = typeof window !== 'undefined' ? window.navigator : null;
        const timeZone = hasIntl ? (window.Intl.DateTimeFormat().resolvedOptions().timeZone || '') : '';
        const isIndianLocale = hasIntl && (
          timeZone.includes('Calcutta') ||
          timeZone.includes('Kolkata') ||
          timeZone.includes('Asia') ||
          (browserNav?.languages && browserNav.languages.some(l => l.includes('IN'))) ||
          (browserNav?.language && browserNav.language.includes('IN'))
        );
        recognition.lang = isIndianLocale ? 'en-IN' : (browserNav?.language || 'en-US');
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          let sessionFinal = '';
          let sessionInterim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            const text = res[0]?.transcript || '';
            if (res.isFinal) {
              const formatted = formatAsSentence(text);
              if (formatted) {
                if (!sessionFinal.toLowerCase().includes(formatted.toLowerCase())) {
                  sessionFinal += (sessionFinal ? ' ' : '') + formatted;
                }
                const currentSec = Math.floor(elapsedTimeRef.current);
                const m = Math.floor(currentSec / 60).toString().padStart(2, '0');
                const s = Math.floor(currentSec % 60).toString().padStart(2, '0');

                // Deduplicate against the last recorded segment
                const lastSeg = transcriptSegmentsRef.current[transcriptSegmentsRef.current.length - 1];
                const cleanText = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (!lastSeg || cleanText(lastSeg.text) !== cleanText(formatted)) {
                  transcriptSegmentsRef.current.push({
                    speaker: 'Candidate',
                    text: formatted,
                    timestamp: `${m}:${s}`,
                    timestamp_s: currentSec,
                  });
                }
              }
            } else {
              sessionInterim += text;
            }
          }

          if (sessionFinal.trim()) {
            accumulatedTranscriptRef.current = appendDeduplicated(
              accumulatedTranscriptRef.current,
              sessionFinal.trim()
            );
          }

          currentInterimRef.current = cleanTechnicalSpeech(sessionInterim).trim();

          let interimDisplay = currentInterimRef.current;
          if (interimDisplay && (!accumulatedTranscriptRef.current || /[.?!]\s*$/.test(accumulatedTranscriptRef.current))) {
            interimDisplay = interimDisplay.charAt(0).toUpperCase() + interimDisplay.slice(1);
          }

          const combinedText = interimDisplay
            ? appendDeduplicated(accumulatedTranscriptRef.current, interimDisplay)
            : accumulatedTranscriptRef.current;

          if (combinedText) {
            setLiveTranscript(cleanTechnicalSpeech(combinedText));
          }

          if (transcriptScrollRef.current) {
            transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
          }
        };

        recognition.onerror = (e: any) => {
          // 'no-speech' is expected during silent pauses — suppress noisy logs
          if (e.error !== 'no-speech') {
            console.warn('[Speech Recognition Note]:', e.error);
          }
        };

        recognition.onend = () => {
          // Commit any pending interim speech so words aren't dropped when silence triggers onend
          if (currentInterimRef.current) {
            const flushed = formatAsSentence(currentInterimRef.current);
            if (flushed) {
              accumulatedTranscriptRef.current = appendDeduplicated(
                accumulatedTranscriptRef.current,
                flushed
              );
              setLiveTranscript(cleanTechnicalSpeech(accumulatedTranscriptRef.current));
            }
          }
          currentInterimRef.current = '';

          // Immediate restart across pauses to eliminate dead audio windows
          if (restartTimeoutRef.current && typeof window !== 'undefined') {
            window.clearTimeout(restartTimeoutRef.current);
          }
          if (isRecordingRef.current && recognitionRef.current === recognition) {
            restartTimeoutRef.current = typeof window !== 'undefined' ? window.setTimeout(() => {
              if (isRecordingRef.current && recognitionRef.current === recognition) {
                try {
                  recognition.start();
                } catch (_) { }
              }
            }, 100) : null;
          }
        };

        recognition.start();
      } catch (err) {
        console.warn('Speech recognition not available:', err);
      }
    } else if (recognitionRef.current) {
      if (restartTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(restartTimeoutRef.current);
      }
      try {
        recognitionRef.current.stop();
      } catch (_) { }
      recognitionRef.current = null;
    }

    return () => {
      if (restartTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) { }
      }
    };
  }, [
    isRecording,
    finalTranscriptRef,
    accumulatedTranscriptRef,
    recognitionRef,
    currentInterimRef,
    setLiveTranscript,
    transcriptScrollRef,
    elapsedTimeRef,
    transcriptSegmentsRef,
    restartTimeoutRef,
    isRecordingRef,
    transcriptInitializedRef,
  ]);

  const handleBackFromInstructions = () => {
    if (startAnswerInFlightRef.current || hasStartedQuestion || isRecording || isEnding) return;

    // Clear only unstarted session ID/questions; preserve selected assessment type, mode and hardware check
    if (typeof window !== 'undefined') {
      [
        'aiprep_pending_assessment_creation',
        'aiprep_active_id',
        'aiprep_active_questions',
      ].forEach((key) => window.sessionStorage.removeItem(key));
      window.sessionStorage.setItem('aiprep_wizard_step', 'DEVICE_CHECK');
      if (mediaType === 'VIDEO_AUDIO' || mediaType === 'VIDEO') {
        window.sessionStorage.setItem('aiprep_video_enabled', 'true');
        window.sessionStorage.setItem('aiprep_active_mode', 'VIDEO_AUDIO');
        window.sessionStorage.setItem('aiprep_user_selected_mode', 'VIDEO_AUDIO');
        window.sessionStorage.setItem('aiprep_consent_camera', 'true');
      }
      if (assessmentType) {
        window.sessionStorage.setItem('aiprep_active_type', assessmentType);
      }
    }

    if (onBack) {
      onBack();
      return;
    }

    const hasHistory = typeof window !== 'undefined' && (
      (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) ||
      (window.history.length > 1 && Boolean(document.referrer && document.referrer.includes(window.location.host)))
    );

    if (hasHistory) {
      router.back();
      return;
    }

    const targetUrl = isEmbedded ? '/user_dashboard/ai-prep/device-check?embed=true' : '/user_dashboard/ai-prep/device-check';
    router.replace(targetUrl);
  };

  // ── Start Recording Control ────────────────────────────────────────────────
  // Read the first question aloud from the Start Answer gesture, then start recording.
  // Later questions are read by handleNextQuestion, so this fixes Q1 without double-speaking.
  const handleStartAnswer = async () => {
    if (startAnswerInFlightRef.current || hasStartedQuestion || isEnding) return;
    // A deliberate start action begins a fresh preparation lifecycle.
    preparationCancelledRef.current = false;
    startAnswerInFlightRef.current = true;
    if (!assessmentId) {
      setIsLoading(true);
      try {
        let createdId: number | undefined;
        if (onStartPendingAssessment) {
          createdId = await onStartPendingAssessment();
        } else {
          const rawResults = window.sessionStorage.getItem('aiprep_pending_setup_results');
          if (!rawResults) throw new Error('Your assessment setup expired. Please run the device check again.');
          const results = JSON.parse(rawResults);
          const rawType = String(results.assessment_type || window.sessionStorage.getItem('aiprep_active_type') || 'TECHNICAL')
            .trim().toUpperCase().replace(/ +/g, '_').replace(/-/g, '_');
          const aliases: Record<string, AssessmentType> = {
            TECHNICAL_ASSESSMENT: 'TECHNICAL',
            RECRUITER_ASSESSMENT: 'RECRUITER',
            HIRING_MANAGER_ASSESSMENT: 'HIRING_MANAGER',
            SYSTEM_DESIGN_ASSESSMENT: 'SYSTEM_DESIGN',
          };
          const targetType = (aliases[rawType] || rawType) as AssessmentType;
          const targetMode: MediaType = results.video_enabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY';

          let candidateId: number | undefined;
          const storedId = window.localStorage.getItem('candidate_id') || window.sessionStorage.getItem('aiprep_candidate_id');
          if (storedId && Number.isFinite(Number(storedId))) {
            candidateId = Number(storedId);
          } else {
            const userValue = window.localStorage.getItem('user');
            if (userValue) {
              const user = JSON.parse(userValue);
              const id = user?.candidate_id ?? user?.id;
              if (id !== undefined && Number.isFinite(Number(id))) candidateId = Number(id);
            }
          }

          const assessment = await aiprepApi.createAssessment({
            assessment_type: targetType,
            assessment_mode: targetMode,
            candidate_id: candidateId,
            job_description_text: results.jd_text || null,
          });
          createdId = Number(assessment?.id);
          const loadedQuestions = Array.isArray(assessment?.questions) ? assessment.questions : [];
          if (!Number.isSafeInteger(createdId) || createdId <= 0) {
            throw new Error('Failed to initialize assessment session on server.');
          }
          if (loadedQuestions.length === 0) {
            throw new Error('The assessment was created, but the server did not return any questions. Please try again.');
          }

          window.localStorage.removeItem(`aiprep_reload_cancelled_${createdId}`);
          window.localStorage.removeItem(`aiprep_exited_${createdId}`);
          window.localStorage.removeItem(`aiprep_finished_${createdId}`);
          window.sessionStorage.removeItem(`aiprep_exited_${createdId}`);
          window.sessionStorage.removeItem(`aiprep_started_${createdId}`);
          window.sessionStorage.setItem('aiprep_active_id', String(createdId));
          window.sessionStorage.setItem('aiprep_active_type', targetType);
          window.sessionStorage.setItem('aiprep_active_mode', targetMode);
          window.sessionStorage.setItem('aiprep_active_questions', JSON.stringify(loadedQuestions));
          window.sessionStorage.setItem(`aiprep_autostart_assessment_${createdId}`, 'true');
          window.sessionStorage.removeItem('aiprep_pending_setup_results');
        }

        if (createdId) {
          startAnswerInFlightRef.current = false;
          router.replace(`/aiprep/session/${createdId}`);
          return;
        }
      } catch (err: any) {
        setIsLoading(false);
        startAnswerInFlightRef.current = false;
        setErrorMsg(err?.message || 'Failed to start assessment. Please try again.');
        return;
      }
    }
    // Only these four tracks use the deferred-start URL behavior.
    if (typeof window !== 'undefined' && assessmentId) {
      const activeType = window.sessionStorage.getItem('aiprep_active_type');
      if (['TECHNICAL', 'RECRUITER', 'HIRING_MANAGER', 'SYSTEM_DESIGN'].includes(activeType || '')) {
        // A deliberate Start Assessment action begins a valid attempt; clear stale
        // cancellation flags if local/dev data has reused this assessment ID.
        window.localStorage.removeItem(`aiprep_reload_cancelled_${assessmentId}`);
        window.localStorage.removeItem(`aiprep_exited_${assessmentId}`);
        window.localStorage.removeItem(`aiprep_finished_${assessmentId}`);
        window.sessionStorage.removeItem(`aiprep_exited_${assessmentId}`);
        window.sessionStorage.setItem(`aiprep_started_${assessmentId}`, 'true');
        window.sessionStorage.removeItem('aiprep_pending_assessment_id');
        if (window.location.pathname !== `/aiprep/session/${assessmentId}`) {
          try {
            window.history.replaceState(null, '', `/aiprep/session/${assessmentId}`);
          } catch (_) {}
        }
      }
    }
    if (!sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }
    // Reveal questions only after the candidate clicks Start Assessment.
    let pendingQuestions = pendingAssessmentQuestionsRef.current ?? [];
    if (pendingQuestions.length === 0) {
      try {
        const cachedQuestions = window.sessionStorage.getItem('aiprep_active_questions');
        const parsedQuestions = cachedQuestions ? JSON.parse(cachedQuestions) : null;
        if (Array.isArray(parsedQuestions)) {
          pendingQuestions = parsedQuestions as QuestionBankItem[];
        }
      } catch (error) {
        console.warn('Unable to load cached assessment questions:', error);
      }
    }
    if (pendingQuestions.length === 0) {
      setIsAutoStarting(false);
      setErrorMsg('No questions were saved for this assessment. Please return to setup and start a new assessment.');
      startAnswerInFlightRef.current = false;
      return;
    }
    setIsAutoStarting(false);
    setQuestions(pendingQuestions);
    pendingAssessmentQuestionsRef.current = [];
    setCurrentQuestionIndex(0);
    setHasStartedQuestion(true);
    stopAiSpeech();

    // For Technical, Recruiter, Hiring Manager and System Design, show a
    // five-second countdown before the first question is narrated. Intro/JD
    // retain their existing start flow.
    const activeType = typeof window !== 'undefined'
      ? window.sessionStorage.getItem('aiprep_active_type')
      : null;
    const needsInitialQuestionCountdown = ['TECHNICAL', 'RECRUITER', 'HIRING_MANAGER', 'SYSTEM_DESIGN'].includes(activeType || '');
    if (needsInitialQuestionCountdown) {
      // Keep the question hidden in the right pane until the initial countdown ends.
      setIsInitialQuestionCountdown(true);
      // Reuse the existing large countdown overlay so the first-question
      // countdown looks identical to the Intro/JD start countdown.
      for (let seconds = 5; seconds > 0; seconds -= 1) {
        if (preparationCancelledRef.current || isEnding) return;
        setCountdownValue(seconds);
        await new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
      }
      setCountdownValue(null);
      setIsInitialQuestionCountdown(false);
    }

    // Use the loaded question list directly; React state updates from setQuestions are asynchronous.
    const activeQ = pendingQuestions[0] ?? pendingQuestions[currentQuestionIndex];

    // Narration happens after the initial countdown and before the answer countdown.
    if (activeQ?.question_text && !isSpeechMuted) {
      await speakAiText(activeQ.question_text);
    }
    if (preparationCancelledRef.current || isEnding) return;

    // For video mode, open the webcam as soon as the question has been read
    if (!isAudioOnly) {
      try {
        await openVideoStream();
      } catch (camErr) {
        console.warn('Failed to open webcam after question reading:', camErr);
      }
    }
    // 5-second preparation countdown before answer recording starts
    for (let seconds = 5; seconds > 0; seconds -= 1) {
      if (preparationCancelledRef.current || isEnding) return;
      setPrepCountdown(seconds);
      // Pre-warm STT engine on the last tick so it's hot when recording starts
      if (seconds === 1) {
        try {
          const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SR && !recognitionRef.current) {
            const warm = new SR();
            warm.continuous = false;
            warm.interimResults = false;
            warm.onresult = () => {};
            warm.onend = () => {};
            warm.start();
            window.setTimeout(() => { try { warm.stop(); } catch (_) {} }, 800);
          }
        } catch (_) {}
      }
      await new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
    }
    if (preparationCancelledRef.current || isEnding) return;
    setPrepCountdown(null);
    // Await getUserMedia and MediaRecorder initialization so this startup path
    // does not finish before camera/microphone capture has actually been requested.
    await startRecorderRef.current();
  };
  startAnswerRef.current = handleStartAnswer;

  // ── Per-Question Time Tracking ─────────────────────────────────────────────
  useEffect(() => {
    const activeQ = questions[currentQuestionIndex];
    let limit = 180;
    if (assessmentType === 'JD_INTRO') {
      limit = 300; // 5:00 mins max for JD Walkthrough
    } else if (assessmentType === 'INTRO') {
      limit = 240; // 4:00 mins max for Intro
    } else {
      // The backend resolves duration from difficulty/scope and any custom override.
      // Use its authoritative per-question duration rather than re-deriving it in the UI.
      const serverLimit = Number(activeQ?.time_limit_seconds);
      limit = Number.isFinite(serverLimit) && serverLimit > 0
        ? Math.floor(serverLimit)
        : (getDifficultySeconds(activeQ?.difficulty_level) || getDefaultTypeSeconds(assessmentType));
    }
    setQuestionTimeLimit(limit);
    setQuestionTimeElapsed(0);
  }, [currentQuestionIndex, questions, assessmentType]);

  const handleNextQuestionRef = useRef<() => void>(() => { });
  const handleEndSessionRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const hasAutoEndedRef = useRef<boolean>(false);
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [proctoringAlert, setProctoringAlert] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const handleProctoringViolation = useCallback((type: 'TAB_SWITCH', count: number) => {
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
      alertTimerRef.current = null;
    }
    if (count >= 3) {
      setProctoringAlert({
        show: true,
        message: 'Security Notice: 3rd violation reached. Your assessment is being automatically submitted for evaluation.',
      });
      void handleEndSessionRef.current();
    } else {
      setProctoringAlert({
        show: true,
        message: `Security Warning (${count}/3): Tab switch detected. 3 violations will automatically submit your assessment.`,


      });
      alertTimerRef.current = setTimeout(() => {
        setProctoringAlert((prev) => ({ ...prev, show: false }));
        alertTimerRef.current = null;
      }, 5000);
    }
  }, []);

  // Observability & Telemetry Hook - synchronized monitoring active only during question answering
  const isTelemetryMonitoringActive = Boolean(
    hasStartedQuestion && !isEnding && !isSessionAlreadyEnded && !finishedAssessmentId
  );

  const {
    recordQuestionAction,
    recordCompletion,
  } = useAssessmentTelemetry({
    assessmentId,
    sessionId: attemptSessionId,
    assessmentType,
    totalQuestions: questions.length > 0 ? questions.length : undefined,
    isMonitoringActive: isTelemetryMonitoringActive,
    onViolation: handleProctoringViolation,
  });

  useEffect(() => {
    if (!isRecording || isEnding || isAiSpeaking || isQuestionPrepPaused) return;
    const timer = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) return;
      setQuestionTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording, isEnding, isAiSpeaking, isQuestionPrepPaused]);

  // Midpoint auto-slice for INTRO (120s) and JD_INTRO (150s)
  useEffect(() => {
    if (!isRecording || isEnding || !isIntroType || isAudioOnly || introSlice0UploadedRef.current) return;

    const midpoint = Math.floor(questionTimeLimit / 2); // 120s for Intro, 150s for JD Intro
    if (questionTimeElapsed >= midpoint && midpoint > 0) {
      introSlice0UploadedRef.current = true;
      (async () => {
        try {
          console.log(`[IntroSlicing] Reached midpoint (${midpoint}s). Slicing Part 0...`);
          // Stop slice 0 while keeping camera/microphone stream alive for slice 1
          const videoRes = await stopVideoRecorder(true);
          const slice0Blob = videoRes?.blob;
          if (slice0Blob && slice0Blob.size > 0 && assessmentId) {
            introSlice0BlobRef.current = slice0Blob;
            const activeQ = questions[currentQuestionIndex];
            const qId = activeQ?.id ?? (activeQ as any)?.question_id;

            // Immediately restart recorder for Part 2 with existing active stream
            await startVideoRecorder(videoStream || undefined);

            // Upload Part 0 in the background via POST /media/chunk
            console.log(`[IntroSlicing] Uploading Part 0 (${Math.round(slice0Blob.size / 1024)} KB)...`);
            const uploadPromise = aiprepApi.uploadChunk(
              assessmentId,
              0,
              slice0Blob,
              "VIDEO",
              false,
              undefined,
              qId
            );
            pendingIntroSlice0PromiseRef.current = uploadPromise;
          }
        } catch (sliceErr) {
          console.warn("[IntroSlicing] Midpoint slice error:", sliceErr);
        }
      })();
    }
  }, [isRecording, isEnding, isIntroType, isAudioOnly, questionTimeElapsed, questionTimeLimit, assessmentId, questions, currentQuestionIndex, videoStream, stopVideoRecorder, startVideoRecorder]);

  useEffect(() => {
    if (isRecording && questionTimeElapsed >= questionTimeLimit && !isTransitioningQuestion && !isEnding && !hasAutoEndedRef.current) {
      if (currentQuestionIndex < questions.length - 1) {
        handleNextQuestionRef.current();
      } else {
        // Last question or single question (INTRO assessment):
        // Automatically stop timer, stop recording/chunks, show spinner, and submit via PUT API
        hasAutoEndedRef.current = true;
        void handleEndSessionRef.current();
      }
    }
  }, [isRecording, questionTimeElapsed, questionTimeLimit, isTransitioningQuestion, isEnding, currentQuestionIndex, questions.length]);

  const questionTimeRemaining = Math.max(0, questionTimeLimit - questionTimeElapsed);
  const isQuestionLowTime = isRecording && questionTimeRemaining <= 30 && questionTimeRemaining > 0;
  const isQuestionTimeExpired = isRecording && questionTimeRemaining === 0;
  const questionProgressPct = Math.min(100, Math.round((questionTimeElapsed / (questionTimeLimit || 1)) * 100));

  // ── Navigation Between Questions ───────────────────────────────────────────
  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1 && !isTransitioningQuestion) {
      setIsTransitioningQuestion(true);
      setIsQuestionPrepPaused(true);
      stopAiSpeech();

      // Accumulate recording time for this completed question into the session total
      cumulativeRecordedSecondsRef.current += elapsedTimeRef.current;

      // Slice and upload completed question's media in background (0ms UI lag)
      const activeQ = questions[currentQuestionIndex];
      const qId = activeQ?.id ?? (activeQ as any)?.question_id;
      if (isRecording) {
        try {
          if (isAudioOnly) {
            const audioRes = await stopAudioRecorder();
            if (audioRes?.blob && qId) {
              const uploadPromise = aiprepApi.uploadChunk(assessmentId, 0, audioRes.blob, "AUDIO", true, undefined, qId);
              pendingAudioUploadsRef.current.push(uploadPromise);
            }
          } else {
            const videoRes = await stopVideoRecorder(true); // keep camera stream active
            if (videoRes?.blob && qId) {
              const uploadPromise = aiprepApi.uploadChunk(assessmentId, 0, videoRes.blob, "VIDEO", true, undefined, qId);
              pendingAudioUploadsRef.current.push(uploadPromise);
            }
          }
        } catch (e) {
          console.warn("[MultiQuestionMedia] Failed to slice question media:", e);
        }
      }

      // 1. Snapshot current question's live transcript
      const currentText = cleanTechnicalSpeech(liveTranscript).trim();

      recordQuestionAction(
        activeQ?.id || currentQuestionIndex,
        currentQuestionIndex + 1,
        currentText.length > 0 ? QuestionAction.QUESTION_ANSWERED : QuestionAction.QUESTION_SKIPPED
      );

      setQuestionAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: currentText || prev[currentQuestionIndex] || '',
      }));
      setLiveTranscript(''); // Clear for next question

      // 2. Advance index and reset timer
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setHasStartedQuestion(true);
      setQuestionTimeElapsed(0);

      // 3. Read the new question aloud, then give the candidate 5 seconds
      // before resuming the question timer.
      const nextQ = questions[nextIndex];
      if (nextQ?.question_text && !isSpeechMuted) {
        await speakAiText(nextQ.question_text);
      }
      if (preparationCancelledRef.current || isEnding) return;

      // After the next question has been read, ensure the webcam is open for video assessments
      if (!isAudioOnly) {
        try {
          await openVideoStream();
        } catch (camErr) {
          console.warn('Failed to open webcam after next question reading:', camErr);
        }
      }
      // 5-second preparation countdown before next question answer recording starts
      for (let seconds = 5; seconds > 0; seconds -= 1) {
        if (preparationCancelledRef.current || isEnding) return;
        setPrepCountdown(seconds);
        // Pre-warm STT engine on the last tick so it's hot when recording starts
        if (seconds === 1) {
          try {
            const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SR && !recognitionRef.current) {
              const warm = new SR();
              warm.continuous = false;
              warm.interimResults = false;
              warm.onresult = () => {};
              warm.onend = () => {};
              warm.start();
              window.setTimeout(() => { try { warm.stop(); } catch (_) {} }, 800);
            }
          } catch (_) {}
        }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
      }
      if (preparationCancelledRef.current || isEnding) return;
      setPrepCountdown(null);
        setIsQuestionPrepPaused(false);
      setIsTransitioningQuestion(false);
      startRecorderCore();
    }
  };
  handleNextQuestionRef.current = handleNextQuestion;

  // Completed questions are one-way: candidates may revisit only the current
  // unanswered question flow, never a question that has already been submitted.
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0 && !isTransitioningQuestion && !isRecording) {
      setIsTransitioningQuestion(true);
      stopAiSpeech();

      const currentText = cleanTechnicalSpeech(liveTranscript).trim();
      if (currentText) {
        setQuestionAnswers((prev) => ({
          ...prev,
          [currentQuestionIndex]: currentText,
        }));
      }

      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setLiveTranscript(questionAnswers[prevIndex] || '');
      setQuestionTimeElapsed(0);

      setTimeout(() => {
        setIsTransitioningQuestion(false);
      }, 300);
    }
  };

  const lastViewedQuestionIdRef = useRef<string | number | null>(null);

  // Track question viewed (deduplicated by question ID to prevent duplicate view events on re-renders - MEDIUM 1)
  useEffect(() => {
    // Do not log question views on the instructions screen.
    if (hasStartedQuestion && questions.length > 0) {
      const activeQ = questions[currentQuestionIndex];
      const qId = activeQ?.id ?? currentQuestionIndex;
      if (lastViewedQuestionIdRef.current !== qId) {
        lastViewedQuestionIdRef.current = qId;
        recordQuestionAction(
          qId,
          currentQuestionIndex + 1,
          QuestionAction.QUESTION_VIEWED
        );
      }
    }
  }, [hasStartedQuestion, currentQuestionIndex, questions, recordQuestionAction, lastViewedQuestionIdRef]);

  // ── Complete Session & Submit Telemetry to Pure Engines ─────────────────────
  const handleEndSession = async () => {
    if (!assessmentId || isEnding || countdownValue !== null) return;

    try {
      preparationCancelledRef.current = true;
      setPrepCountdown(null);
      setIsEnding(true);

      // Stop browser speech recognition immediately on submit so Chrome releases
      // its microphone-use indicator. The media recorder is stopped below to
      // flush and preserve the final recording chunks before navigation.
      isRecordingRef.current = false;
      if (restartTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      const activeRecognition = recognitionRef.current;
      recognitionRef.current = null;
      if (activeRecognition) {
        try {
          activeRecognition.onend = null;
          activeRecognition.stop();
        } catch (_) {}
      }
      stopAiSpeech();

      // 1. Stop recording and flush final slice / media blob
      const activeQ = questions[currentQuestionIndex];
      const qId = activeQ?.id ?? (activeQ as any)?.question_id;

      let finalAudioBlob: Blob | null = null;
      let finalVideoBlob: Blob | null = null;
      if (isAudioOnly) {
        const audioRes = await stopAudioRecorder();
        finalAudioBlob = audioRes?.blob || null;

        if (finalAudioBlob && qId) {
          try {
            await aiprepApi.uploadChunk(assessmentId, 0, finalAudioBlob, "AUDIO", true, undefined, qId);
          } catch (uploadErr) {
            console.warn("[handleEndSession] Final audio chunk upload error:", uploadErr);
          }
        }

        // Only store local blob preview for single-question tracks (INTRO / JD_INTRO).
        // Multi-question assessments stream the complete stitched assembled.webm from the backend serverUrl.
        if (audioRes?.url && assessmentId && !isMultiQuestion && isIntroType) {
          if (typeof window !== 'undefined') {
            (window as any).__aiprep_local_preview = (window as any).__aiprep_local_preview || {};
            (window as any).__aiprep_local_preview[assessmentId] = audioRes.url;
            sessionStorage.setItem(`aiprep_local_preview_${assessmentId}`, audioRes.url);
          }
        } else if (isMultiQuestion && assessmentId && typeof window !== 'undefined') {
          if ((window as any).__aiprep_local_preview) {
            delete (window as any).__aiprep_local_preview[assessmentId];
          }
          try {
            sessionStorage.removeItem(`aiprep_local_preview_${assessmentId}`);
          } catch (_) {}
        }
      } else {
        const videoRes = await stopVideoRecorder(false);
        finalVideoBlob = videoRes?.blob || null;

        if (finalVideoBlob && qId) {
          if (!isIntroType) {
            try {
              await aiprepApi.uploadChunk(assessmentId, 0, finalVideoBlob, "VIDEO", true, undefined, qId);
            } catch (uploadErr) {
              console.warn("[handleEndSession] Final video chunk upload error:", uploadErr);
            }
          } else {
            // Dynamic INTRO / JD_INTRO 2-part handling:
            try {
              if (introSlice0UploadedRef.current) {
                console.log(`[IntroSlicing] Uploading Part 1 (${Math.round(finalVideoBlob.size / 1024)} KB)...`);
                const slice1Promise = aiprepApi.uploadChunk(assessmentId, 1, finalVideoBlob, "VIDEO", true, undefined, qId);
                // Guarantee both Part 0 and Part 1 finish uploading before moving to the PUT submit
                await Promise.allSettled([
                  pendingIntroSlice0PromiseRef.current,
                  slice1Promise,
                ]);
                totalIntroChunksRef.current = 2;
              } else {
                console.log(`[IntroSlicing] Candidate finished early (< midpoint). Uploading single chunk 0 (${Math.round(finalVideoBlob.size / 1024)} KB)...`);
                await aiprepApi.uploadChunk(assessmentId, 0, finalVideoBlob, "VIDEO", true, undefined, qId);
                totalIntroChunksRef.current = 1;
              }
            } catch (introUploadErr) {
              console.warn("[IntroSlicing] Final intro chunk upload error:", introUploadErr);
            }
          }
        }

        // 1b. Create instant combined media blob for zero-gap playback ONLY if single-track intro assessment.
        // Multi-question assessments (TECHNICAL, HIRING_MANAGER, RECRUITER, SYSTEM_DESIGN) must stream the
        // continuous server-side assembled.webm to guarantee proper duration, monotonic timestamps, and seekability.
        if (!isMultiQuestion && isIntroType && videoRes?.url && assessmentId) {
          if (typeof window !== 'undefined') {
            (window as any).__aiprep_local_preview = (window as any).__aiprep_local_preview || {};
            const previewBlob = introSlice0BlobRef.current && finalVideoBlob
              ? new Blob([introSlice0BlobRef.current, finalVideoBlob], { type: 'video/webm' })
              : (finalVideoBlob || videoRes.blob);
            const previewUrl = previewBlob ? URL.createObjectURL(previewBlob) : videoRes.url;
            (window as any).__aiprep_local_preview[assessmentId] = previewUrl;
            sessionStorage.setItem(`aiprep_local_preview_${assessmentId}`, previewUrl);
          }
        } else if (isMultiQuestion && assessmentId && typeof window !== 'undefined') {
          if ((window as any).__aiprep_local_preview) {
            delete (window as any).__aiprep_local_preview[assessmentId];
          }
          try {
            sessionStorage.removeItem(`aiprep_local_preview_${assessmentId}`);
          } catch (_) {}
        }
        if (!isIntroType && !isMultiQuestion && (!questions || questions.length <= 1)) {
          await waitForAllChunks(8000);
        }
      }

      // Flush and await any remaining in-flight question uploads (both audio and video)
      if (pendingAudioUploadsRef.current.length > 0) {
        try {
          await Promise.allSettled(pendingAudioUploadsRef.current);
        } catch (_) {}
        pendingAudioUploadsRef.current = [];
      }

      // Commit any pending interim speech as a complete sentence before submitting
      if (currentInterimRef.current) {
        const formatted = formatAsSentence(currentInterimRef.current);
        if (formatted) {
          accumulatedTranscriptRef.current = [
            accumulatedTranscriptRef.current,
            formatted,
          ]
            .filter(Boolean)
            .join(' ');

          const currentSec = Math.floor(elapsedTimeRef.current);
          const m = Math.floor(currentSec / 60).toString().padStart(2, '0');
          const s = Math.floor(currentSec % 60).toString().padStart(2, '0');
          transcriptSegmentsRef.current.push({
            speaker: 'Candidate',
            text: cleanTechnicalSpeech(formatted),
            timestamp: `${m}:${s}`,
            timestamp_s: currentSec,
          });
        }
        currentInterimRef.current = '';
      }

      const rawTranscript =
        accumulatedTranscriptRef.current.trim() ||
        liveTranscript.trim() ||
        questions[currentQuestionIndex]?.question_text ||
        'Assessment completed.';
      const actualTranscript = cleanTechnicalSpeech(rawTranscript);

      const finalSegments =
        transcriptSegmentsRef.current.length > 0
          ? transcriptSegmentsRef.current.map((seg) => ({
              ...seg,
              text: cleanTechnicalSpeech(seg.text),
            }))
          : [
            {
              speaker: 'Candidate',
              text: actualTranscript,
              timestamp: '00:00',
              timestamp_s: 0,
            },
          ];

      // 3. Submit assessment and keep this PUT connection open for SSE progress.
      // The API resolves only after the backend sends a terminal COMPLETED event.
      setSubmissionProgress(0);
      setSubmissionStep("Submitting assessment…");

      // Add final question elapsed time to cumulative total
      cumulativeRecordedSecondsRef.current += elapsedTimeRef.current;
      const totalInterviewDuration = cumulativeRecordedSecondsRef.current > 0
        ? Math.round(cumulativeRecordedSecondsRef.current)
        : (sessionStartedAtRef.current ? Math.floor((Date.now() - sessionStartedAtRef.current) / 1000) : elapsedTimeRef.current);

      await aiprepApi.submitAssessmentStream(
        assessmentId,
        {
          total_chunks_uploaded: isAudioOnly ? 0 : (isIntroType ? totalIntroChunksRef.current : (totalChunks || 1)),
          is_final: true,
          client_duration_seconds: totalInterviewDuration,
          video_telemetry: isAudioOnly
            ? {}
            : {
                eye_contact_percentage: 85.0,
                face_visibility_percentage: 95.0,
              },
          status: null,
        },
        (event) => {
          // Progress UI must never interrupt consumption of the assessment SSE stream.
          try {
            if (typeof event.progress === "number") {
              setSubmissionProgress(Math.max(0, Math.min(100, event.progress)));
            }
            if (typeof event.step === "string" && event.step.trim()) {
              setSubmissionStep(event.step);
            } else if (event.status === "PROCESSING") {
              setSubmissionStep("Processing recording and audio…");
            } else if (event.status === "EVALUATING") {
              setSubmissionStep("Evaluating your assessment with AI…");
            } else if (event.status === "COMPLETED") {
              setSubmissionStep("Evaluation complete. Opening report…");
            }
          } catch (progressError) {
            console.warn("Could not update assessment submission progress UI:", progressError);
          }
        },
        undefined,
        isAudioOnly ? finalAudioBlob : null,
        // For video INTRO / JD_INTRO, all slices have already been safely uploaded via POST /media/chunk.
        // Sending null ensures the final PUT carries zero heavy media, completely avoiding Cloud Run 413 errors.
        null
      );
      setSubmissionProgress(100);
      setSubmissionStep("Evaluation complete. Opening report…");

      // 5. Record final assessment telemetry completion
      recordCompletion(SessionLifecycleStatus.COMPLETED);

      // Stop media recording tracks immediately so browser releases camera/mic
      try {
        cleanupAudioRecorder();
      } catch (_) {}
      try {
        cleanupVideoRecorder();
      } catch (_) {}

      // 6. Clean up browser storage flags & queue
      clearQueue();
      if (typeof window !== 'undefined') {
        try {
          if (assessmentId) {
            localStorage.setItem(`aiprep_finished_${assessmentId}`, 'true');
            localStorage.setItem(`aiprep_exited_${assessmentId}`, 'true');
            sessionStorage.setItem(`aiprep_exited_${assessmentId}`, 'true');
            localStorage.removeItem(`aiprep_active_session_${assessmentId}`);
          }
          sessionStorage.removeItem('aiprep_active_id');
          sessionStorage.removeItem('aiprep_active_questions');
          sessionStorage.removeItem('aiprep_active_type');
          sessionStorage.removeItem('aiprep_active_mode');
          sessionStorage.removeItem('aiprep_video_enabled');
          sessionStorage.removeItem('aiprep_consent_analytics');
          sessionStorage.removeItem('aiprep_consent_recording');
          sessionStorage.removeItem('aiprep_consent_transcript');
          sessionStorage.removeItem('aiprep_wizard_step');
          sessionStorage.removeItem('aiprep_hardware_check');
          sessionStorage.removeItem('aiprep_pending_setup_results');
          sessionStorage.removeItem('aiprep_pending_assessment_creation');
          sessionStorage.removeItem('aiprep_jd_text');
          sessionStorage.removeItem('aiprep_jd_filename');
          sessionStorage.removeItem('aiprep_jd_role');
          sessionStorage.removeItem('aiprep_jd_company');
          localStorage.removeItem('aiprep_hardware_check');
          localStorage.removeItem(`aiprep_live_transcript_${assessmentId}`);
        } catch (_) {}
      }

      // 7. Transition directly to Evaluation page once response arrives
      const reportUrl = isEmbedded
        ? `/aiprep/reports/${assessmentId}?embed=true&tab=Evaluation`
        : `/aiprep/reports/${assessmentId}?tab=Evaluation`;
      try {
        if (typeof window !== 'undefined' && window.history && History?.prototype?.replaceState) {
          History.prototype.replaceState.call(window.history, {}, '', reportUrl);
        }
      } catch (_) {}
      setFinishedAssessmentId(assessmentId);
    } catch (err: any) {
      console.error('Finalize session error:', err);

      // The server may finish evaluation after the browser's SSE connection drops.
      // Verify once before showing an error; never resubmit the PUT automatically.
      if (assessmentId) {
        try {
          const latestAssessment = await aiprepApi.getAssessment(assessmentId);
          const latestStatus = String(latestAssessment?.status || "").toUpperCase();
          if (latestStatus === "COMPLETED") {
            setSubmissionProgress(100);
            setSubmissionStep("Evaluation complete. Opening report…");
            setFinishedAssessmentId(assessmentId);
            return;
          }
          if (latestStatus === "FAILED" || latestStatus === "CANCELLED") {
            setErrorMsg(latestStatus === "FAILED"
              ? "Assessment evaluation failed. Please contact support if this continues."
              : "This assessment was cancelled before evaluation completed.");
            setIsEnding(false);
            return;
          }
          if (["EVALUATING", "IN_PROGRESS", "SUBMITTED", "PENDING"].includes(latestStatus)) {
            setErrorMsg("The progress connection ended, but your assessment may still be processing. Please check the report status before trying again.");
            setIsEnding(false);
            return;
          }
        } catch (statusCheckError) {
          console.warn("Could not verify assessment status after submission interruption:", statusCheckError);
        }
      }

      setErrorMsg(err?.message || 'Failed to submit assessment telemetry.');
      setIsEnding(false);
    }
  };
  handleEndSessionRef.current = handleEndSession;

  // ── Max Recording Duration Enforcer ───────────────────────────────────────
  // Auto-ends the session when the type-specific time limit is reached
  useEffect(() => {
    if (isRecording && elapsedTime >= MAX_RECORDING_SECONDS && !isEnding && !hasAutoEndedRef.current) {
      console.warn(`[Assessment] Max recording time (${MAX_RECORDING_SECONDS / 60} min) reached — auto-ending session.`);
      hasAutoEndedRef.current = true;
      void handleEndSessionRef.current();
    }
  }, [elapsedTime, isRecording, isEnding, MAX_RECORDING_SECONDS]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (finishedAssessmentId) {
      try {
        cleanupAudioRecorder();
      } catch (_) {}
      try {
        cleanupVideoRecorder();
      } catch (_) {}
    }
  }, [finishedAssessmentId, cleanupAudioRecorder, cleanupVideoRecorder]);

  if (finishedAssessmentId) {
    return <AiPrepReport assessmentId={String(finishedAssessmentId)} />;
  }

  // ── Session Ended / Exited View ────────────────────────────────────────────
  if (isSessionAlreadyEnded) {
    const wasCancelledByReload = typeof window !== 'undefined' && localStorage.getItem(`aiprep_reload_cancelled_${assessmentId}`) === 'true';
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none overflow-hidden">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <IconAlertTriangle size={28} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{typeof window !== 'undefined' && localStorage.getItem(`aiprep_reload_cancelled_${assessmentId}`) === 'true' ? 'Assessment Cancelled' : 'Assessment Session Closed'}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {typeof window !== 'undefined' && localStorage.getItem(`aiprep_reload_cancelled_${assessmentId}`) === 'true'
              ? 'You reloaded the assessment room, so this attempt was cancelled. No evaluation report is available. Return to AI Prep to start a new session.'
              : `This assessment session (#${assessmentId}) has already been exited or completed. Each assessment must be started fresh from the dashboard.`}
          </p>
          <button
            type="button"
            onClick={() => {
              const targetUrl = isEmbedded ? '/user_dashboard/ai-prep?embed=true' : '/user_dashboard/ai-prep';
              router.replace(targetUrl);
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Return to AI Prep Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Loading & Error Displays ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-[#090d16] text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center p-6 select-none overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
          <IconLoader2 size={24} className="animate-spin" />
        </div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Connecting to Assessment Room</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs">Calibrating media slicing and dynamic questions…</p>
      </div>
    );
  }

  // ── Duplicate Tab / Assessment Already Active in Another Tab ───────────────
  if (isSessionActiveInOtherTab || (!hasSessionInit && (errorMsg || questions.length === 0))) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 text-center overflow-y-auto">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Pill Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Assessment Session #{assessmentId} Active</span>
          </div>

          {/* Hero Warning Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-purple-500/15 border-2 border-amber-300/80 dark:border-amber-700/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 ring-8 ring-amber-500/10 dark:ring-amber-400/10 shadow-lg shadow-amber-500/5">
            <IconAlertTriangle size={36} className="stroke-[2.2]" />
          </div>

          {/* Main Title & Subtitle */}
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            Assessment Already in Progress
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            This interview session is already active in another browser tab. Please do not switch or open multiple session tabs.
          </p>

          {/* Structured Guidance Cards */}
          <div className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-4.5 mt-5 text-left space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Active Recording in Old Tab</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Your live interview questions, microphone, camera feed, and timer are currently running in your original tab.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <IconLock size={15} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Do Not Open Here or Switch Tabs</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  To protect assessment security and prevent hardware recording conflicts, duplicate session windows are blocked.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <IconArrowRight size={15} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Return to Your Original Tab</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Look for the tab marked with the <span className="font-bold text-rose-600 dark:text-rose-400">🔴 recording dot</span> in your browser toolbar above and switch back to it to continue.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full mt-6">
            <button
              onClick={handleCloseTab}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95"
            >
              <IconX size={15} className="stroke-[2.5]" />
              <span>Close This Tab</span>
            </button>
            <button
              onClick={() => {
                const targetUrl = isEmbedded ? '/user_dashboard/ai-prep?embed=true' : '/user_dashboard/ai-prep';
                router.replace(targetUrl);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>Return to Dashboard</span>
            </button>
          </div>

          {/* Notice if browser blocks script-closing tab */}
          {closeTabNotice && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-3 font-semibold animate-in fade-in duration-200">
              ⚠️ Browser prevented auto-closing. Please manually close this tab (Ctrl+W) and click on the original tab!
            </p>
          )}
        </div>
      </div>
    );
  }

  if (errorMsg && questions.length === 0) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mb-4 text-rose-500">
          <IconAlertTriangle size={24} className="animate-bounce" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Session Room Error</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto mb-5 leading-relaxed">{errorMsg}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setErrorMsg(null);
              setIsLoading(true);
              sessionInitializedRef.current = false;
              setRetryCount((prev) => prev + 1);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs shadow-sm cursor-pointer transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => {
              const targetUrl = isEmbedded ? '/user_dashboard/ai-prep?embed=true' : '/user_dashboard/ai-prep';
              router.replace(targetUrl);
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs shadow-sm cursor-pointer transition-colors"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  const activeQuestion = questions[currentQuestionIndex];
  const wordCount = liveTranscript ? liveTranscript.trim().split(/\s+/).filter(Boolean).length : 0;
  const sentenceCount = liveTranscript
    ? liveTranscript
        .trim()
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0).length
    : 0;
  // Keep the instructions screen visible for every non-intro assessment until Start Assessment is clicked.
  // Do not let recordingStatus or microphone state reveal the question early.
  const isQuestionBlurred = !isIntroType && !hasStartedQuestion && !isAutoStarting;
  // Use the same countdown urgency styling for Intro, Technical, and JD assessments.
  const technicalTimerColors = questionTimeRemaining <= 5 && questionTimeRemaining > 0
    ? 'border-rose-400 bg-rose-100 text-rose-700 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-200'
    : questionTimeRemaining <= 30
      ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
      : questionTimeElapsed >= 60
        ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
        : questionTimeElapsed >= 30
          ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
          : 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-300';

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Floating Proctoring Alert Toast */}
      {/* Tab-switch violation alert remains enabled. */}
      {proctoringAlert.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <IconAlertTriangle size={16} className="shrink-0" />
          <span>{proctoringAlert.message}</span>
        </div>
      )}
      {(isIntroType || hasStartedQuestion) && (
      <header className="relative z-30 flex h-[54px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-300"><IconSparkles size={17} /></span>
          <span className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-base">{assessmentTitle}</span>
        </div>
        {!isQuestionBlurred && <div className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-1.5 transition-colors duration-300 ${technicalTimerColors} ${isRecording && questionTimeRemaining > 0 && questionTimeRemaining <= 5 ? "animate-pulse" : ""}`}>
          <IconClock size={14} />
          <span className="whitespace-nowrap text-[11px] font-extrabold tracking-wide sm:text-xs">Q{currentQuestionIndex + 1} TIME: {formatTime(questionTimeRemaining)}</span>
          {!isIntroType && questionTimeRemaining <= 30 && questionTimeRemaining >= 29 && (
            <span className="whitespace-nowrap border-l border-current/20 pl-2 text-[10px] font-black uppercase tracking-wide sm:text-[11px]" role="status" aria-live="polite">
              30 seconds left
            </span>
          )}
        </div>}
        {!isQuestionBlurred && <div className="ml-auto flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400" title="Connection status"><IconWifi size={17} /></span>
          <button type="button" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen(); }} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" aria-label="Toggle fullscreen" title="Toggle fullscreen"><IconMaximize size={16} /></button>
        </div>}
      </header>
      )}
      {/* 2. MAIN INTERVIEW STUDIO WORKSPACE */}
      <div className={`relative flex-1 min-h-0 p-2 sm:p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 items-start lg:items-stretch gap-3 lg:gap-4 max-w-[1600px] mx-auto w-full overflow-y-auto ${isIntroType ? 'pb-4' : 'pb-28'}`}>
        {/* LEFT COLUMN: Cinema Camera Stage & Floating Meeting Dock */}
        <div className={`${isQuestionBlurred ? 'hidden' : isIntroType ? 'lg:col-span-7' : 'lg:col-span-6'} flex flex-col min-h-0 gap-3 h-auto lg:h-full overflow-visible`}>
          {/* CINEMA CAMERA STAGE */}
          <div className={`relative w-full aspect-video sm:aspect-auto sm:flex-1 rounded-2xl overflow-hidden border flex items-center justify-center min-h-[220px] sm:min-h-[280px] transition-colors duration-300 ${
            isAudioOnly
              ? 'bg-white border-slate-200/90 shadow-sm'
              : 'bg-slate-950 border-slate-200 dark:border-slate-800/80 shadow-lg dark:shadow-2xl'
          }`}>
            {/* 3-2-1 Countdown Overlay for Intro Track */}
            {countdownValue !== null && (
              <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center backdrop-blur-md ${
                isAudioOnly ? 'bg-white/95' : 'bg-slate-950/90'
              }`}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-5xl flex items-center justify-center animate-bounce shadow-2xl shadow-indigo-500/50">
                  {countdownValue}
                </div>
                <p className={`mt-3 w-full max-w-sm sm:max-w-md px-4 text-xs sm:text-sm leading-normal text-center font-bold tracking-wide animate-pulse ${
                  isAudioOnly ? 'text-slate-700 dark:text-slate-200' : 'text-white'
                }`}>
                  {isAudioOnly
                    ? 'Get ready! Recording starts automatically… After the countdown, the AI will read the question aloud.'
                    : 'Get ready! After the countdown, the AI will read the question aloud, then your webcam will open automatically to start recording.'}
                </p>
              </div>
            )}

            {/* Video Stream Element — hidden in audio-only mode */}
            <video
              ref={bindVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${!isAudioOnly ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            />

            {/* Audio-only stage styled to match the centered microphone and tapered waveform reference */}
            {isAudioOnly && (
              <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center gap-4 px-4">
                <div className="absolute h-48 w-48 rounded-full bg-gradient-to-br from-indigo-100/70 via-violet-100/60 to-purple-100/70 blur-3xl" />
                <div className="relative flex flex-col items-center gap-5">
                  <div className="relative flex h-28 w-28 items-center justify-center">
                    <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/25 transition-all duration-300 ${isRecording ? "scale-100" : "scale-95 opacity-80"}`}>
                      <IconMicrophone size={30} stroke={2.2} className="text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-[290px] max-w-full items-center justify-center gap-[4px]">
                      <EmbeddedAudioWaveform stream={stream} isMuted={isInactive} isLight={true} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-500 whitespace-nowrap">
                      {isRecording ? "Microphone active — recording…" : "Microphone ready"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Top-Left Live REC Badge */}
            <div className={`absolute top-4 left-4 z-20 flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition-colors ${
              isAudioOnly
                ? 'bg-slate-50/90 border border-slate-200 text-slate-700'
                : 'bg-slate-900/85 border border-slate-700/80 text-white backdrop-blur-md shadow-lg'
            }`}>
              <span
                className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : stream ? 'bg-emerald-400' : 'bg-slate-400'
                  }`}
              />
              <span className={`${isAudioOnly ? 'text-red-600' : 'text-red-400'} uppercase font-extrabold text-[11px]`}>REC</span>
              <span className={`${isAudioOnly ? 'text-slate-600' : 'text-slate-300'} text-xs`}>{isRecording ? 'Live •' : stream ? 'Preview •' : 'Standby •'}</span>
              <span className={`font-mono text-xs font-bold ${isAudioOnly ? 'text-slate-900' : 'text-white'}`}>{formatTime(elapsedTime)}</span>
            </div>

            {/* Bottom-Left: Embedded Audio Waveform Equalizer (video mode only) */}
            {!isAudioOnly && (
              <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1">
                <EmbeddedAudioWaveform stream={stream} isMuted={isInactive} />
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 drop-shadow">
                  <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-emerald-400 animate-pulse' : stream ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{isRecording ? 'Mic & Camera Active' : stream ? 'Camera Active' : 'Ready to Start'}</span>
                </div>
              </div>
            )}
          </div>

          {/* LIVE TRANSCRIPT: kept with the response panel for a calmer interview layout */}
          {/* CARD 2: Live Speech Transcript Card (Compact fixed height) */}
          <div className="h-[150px] sm:h-[175px] shrink-0 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm dark:shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <IconMessage2 size={15} />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Speech Transcript</h3>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                {sentenceCount} {sentenceCount === 1 ? 'sentence' : 'sentences'} • {wordCount} words
              </span>
            </div>

            {/* Scrollable Viewport */}
            <div
              ref={transcriptScrollRef}
              className="flex-1 min-h-0 overflow-y-auto py-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300 select-text"
            >
              {liveTranscript ? (
                <p className="whitespace-pre-wrap">{liveTranscript}</p>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 p-2">
                  <IconMicrophone size={20} className="mb-1 opacity-50 text-indigo-500 dark:text-indigo-400" />
                  <p className="text-[11px]">Speech will appear here in real-time as you speak…</p>
                </div>
              )}
            </div>

            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 text-center shrink-0">
              Transcribed live for coaching coherence & communication analytics
            </div>
          </div>

          {/* Live recording and upload health */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <IconMicrophone size={13} /> Microphone
              </div>
              <p className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">{isRecording ? 'Recording' : isInactive ? 'Ready' : 'Stopped'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <IconWifi size={13} /> Network
              </div>
              <p className={`mt-1 text-xs font-bold ${networkQuality === 'good' ? 'text-emerald-600 dark:text-emerald-400' : networkQuality === 'average' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>{networkQuality === 'good' ? 'Good' : networkQuality === 'average' ? 'Moderate' : 'Weak'}</p>
            </div>
            <div className={`rounded-xl border px-3 py-2 ${failedChunks > 0 ? 'border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <IconCheck size={13} /> Chunks
              </div>
              <p className={`mt-1 text-xs font-bold ${failedChunks > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>{isUploading ? 'Uploading…' : failedChunks > 0 ? `${failedChunks} failed` : totalChunks > 0 ? `${uploadedChunks}/${totalChunks} sent` : 'Waiting'}</p>
            </div>
          </div>

          {/* FLOATING GLASS MEETING DOCK */}
          <div className="fixed bottom-0 left-0 right-0 z-40 w-full flex items-center justify-center px-3 sm:px-5 py-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 w-full max-w-[1500px] h-14 sm:h-16 px-2 sm:px-4 rounded-2xl bg-transparent border-0 shadow-none">
              {/* Left Group: Exit Button + Previous Question Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowExitModal(true)}
                  disabled={isEnding}
                  className="h-10 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 inline-flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shrink-0"
                  title="Exit Assessment"
                >
                  <IconLogout size={16} stroke={2} />
                  <span>Exit Assessment</span>
                </button>

                {/* Completed questions are locked; do not offer backward navigation. */}
                {false && currentQuestionIndex > 0 && !isEnding && (
                  <button
                    type="button"
                    onClick={handlePrevQuestion}
                    disabled={isTransitioningQuestion}
                    className="h-10 px-3 sm:px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1 transition-all disabled:cursor-not-allowed cursor-pointer text-xs font-semibold shrink-0"
                    title="Return to Previous Question"
                  >
                    <IconChevronLeft size={16} stroke={2.5} />
                    <span>Previous</span>
                  </button>
                )}
              </div>

              {/* Center Column: Perfectly Centered Primary CTA or Live Answering Indicator */}
              <div className="flex min-w-0 items-center justify-center">
                {isEnding ? (
                  <div className="h-10 inline-flex items-center justify-center gap-2 px-3 sm:px-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 shrink-0 shadow-xs text-purple-700 dark:text-purple-300">
                    <IconLoader2 size={15} className="animate-spin text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold whitespace-nowrap">
                      Submitting Assessment…
                    </span>
                  </div>
                ) : isInactive ? (
                  !isIntroType ? (
                    <div className="h-10 w-36 shrink-0" aria-hidden="true" />
                  ) : (
                    <div className="h-10 inline-flex items-center justify-center gap-1.5 px-4 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                      <span>Starting countdown{countdownValue !== null ? ` (${countdownValue}s)` : ''}…</span>
                    </div>
                  )
                ) : prepCountdown !== null ? (
                  <div className="h-10 w-36 shrink-0" aria-hidden="true" />
                ) : (
                  <div className="flex items-center justify-center gap-5">
                    <div className="h-10 inline-flex items-center justify-center gap-2 px-3 sm:px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        Answering Q{currentQuestionIndex + 1} ({formatTime(questionTimeElapsed)})
                      </span>
                    </div>
                    {isRecording && !isIntroType && (
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        disabled={isEnding || isTransitioningQuestion || currentQuestionIndex >= questions.length - 1 || countdownValue !== null}
                        className="h-10 px-4 sm:px-5 rounded-xl font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={currentQuestionIndex >= questions.length - 1 ? 'You are on the last question' : 'Save this answer and continue to the next question'}
                      >
                        {isTransitioningQuestion ? (
                          <>
                            <IconLoader2 size={16} className="animate-spin" />
                            <span>Saving…</span>
                          </>
                        ) : (
                          <>
                            <span>Next Question</span>
                            <IconArrowRight size={16} stroke={2.5} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Group: Forward Progression (Next Question / Finish Assessment) or Symmetrical Spacer */}
              <div className="flex min-w-0 items-center justify-end">
                {isQuestionBlurred && !isEnding ? (
                  prepCountdown !== null ? (
                    <div className="h-10 w-36 shrink-0" aria-hidden="true" />
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartAnswer}
                      disabled={hasStartedQuestion}
                      className="h-10 px-6 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-80 text-white shadow-md shadow-emerald-600/30 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                      title="Reveal Question & Begin Answering"
                    >
                      {hasStartedQuestion ? <IconLoader2 size={16} className="animate-spin" /> : <IconPlayerPlay size={16} fill="currentColor" />}
                      <span>{hasStartedQuestion ? 'Reading question…' : 'Start Assessment'}</span>
                    </button>
                  )
                ) : (hasStartedQuestion || isRecording || isEnding) ? (
                  <div className="flex min-w-0 items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleEndSession}
                      disabled={isEnding || countdownValue !== null}
                      className={`h-10 px-4 sm:px-5 rounded-xl font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 shrink-0 ${countdownValue !== null
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60 shadow-none pointer-events-none'
                          : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-purple-500/30 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50'
                        }`}
                      title="Submit your assessment and finish now"
                    >
                      {isEnding ? (
                        <>
                          <IconLoader2 size={16} className="animate-spin" />
                          <span>Finalizing…</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Assessment</span>
                          <IconCheck size={16} stroke={2.5} />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Symmetrical spacer matching Exit button width so Start Answer is dead-center */
                  <div className="w-[72px] shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Question Prompt Card & Live Speech Transcript Card */}
        <div className={`${isQuestionBlurred ? 'lg:col-span-12' : isIntroType ? 'lg:col-span-5' : 'lg:col-span-6'} flex flex-col gap-3 min-h-[480px] lg:min-h-0 lg:h-full shrink-0 lg:shrink`}>
          {/* CARD 1: Question Prompt Card (Expanded height & scrollable) */}
          {activeQuestion ? (
            <div className="relative bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl flex flex-col justify-between min-h-[420px] flex-1 space-y-4 overflow-hidden">
              {/* Overlay when question is hidden in standby mode */}
              {isQuestionBlurred && (
                <div className="absolute inset-0 z-20 flex items-stretch justify-start overflow-y-auto overflow-x-hidden rounded-2xl bg-white/95 p-3 backdrop-blur-md transition-all duration-500 dark:bg-slate-900/95 sm:p-4">
                  <div className="absolute left-6 top-6 z-10 flex max-w-[min(280px,calc(100%-3rem))] items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-300"><IconSparkles size={17} /></span>
                    <span className="min-w-0 whitespace-nowrap text-sm font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-base">{assessmentTitle}</span>
                  </div>
                  <div className="mx-auto mt-14 mb-2 flex w-full max-w-5xl min-w-0 flex-col justify-center gap-2.5 sm:mt-16">
                    <div className="flex shrink-0 items-center gap-2.5 border-b border-indigo-100 pb-2.5 dark:border-slate-800">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-300"><IconFileText size={22} /></div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">Before you begin</p>
                        <p className="text-xs leading-snug text-slate-500 dark:text-slate-400 sm:text-sm">A quick guide to your {assessmentNoun} assessment</p>
                      </div>
                    </div>
                    <div className="min-h-0 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-3 dark:divide-slate-100 dark:border-slate-200 dark:bg-white">
                      <div className="flex items-start gap-3 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white"><IconVolume size={19} /></span>
                        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">1. Listen to the question</p><p className="mt-1 text-xs leading-relaxed text-slate-600">The AI will read each question aloud for your {assessmentNoun} assessment. Listen carefully to the complete question before preparing your response.</p></div>
                      </div>
                      <div className="flex items-start gap-3 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white"><IconClock size={19} /></span>
                        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">2. Get 5 seconds to prepare</p><p className="mt-1 text-xs leading-relaxed text-slate-600">After the AI finishes reading, a 5-second countdown gives you time to organize your thoughts. Recording and the question timer begin when the countdown ends.</p></div>
                      </div>
                      <div className="flex items-start gap-3 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white"><IconMicrophone size={19} /></span>
                        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">3. Explain your {assessmentNoun} answer</p><p className="mt-1 text-xs leading-relaxed text-slate-600">Answer clearly using your own words. Explain the concept, how it works, and a practical example when relevant. Keep an eye on the question timer.</p></div>
                      </div>
                    </div>
                    {!isIntroType && (
                      <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Assessment controls</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">1</span>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><IconArrowRight size={17} /></span>
                            <div className="min-w-0"><p className="text-xs font-semibold text-slate-900 dark:text-white">Next Question</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">When you finish your current answer, click this button to save your response and move to the next question. Once you move forward, you cannot return to the previous question.</p></div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">2</span>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"><IconCheck size={17} /></span>
                            <div className="min-w-0"><p className="text-xs font-semibold text-slate-900 dark:text-white">Submit Assessment</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">When you have finished all questions, submit the assessment for final evaluation. You cannot continue answering after submission.</p></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex shrink-0 items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 dark:border-rose-900/60 dark:bg-rose-950/25">
                      <IconAlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      <div className="min-w-0 text-xs leading-relaxed text-rose-800 dark:text-rose-200">
                        <p className="font-semibold">Important: Before submitting</p>
                        <p className="mt-0.5">Once you click <strong>Submit Assessment</strong>, your assessment will be finalized and you will be redirected to the evaluation/report page. You cannot continue answering after submission. To try again, restart the assessment from the beginning.</p>
                        <p className="mt-1 border-t border-rose-200/80 pt-1 text-[11px] leading-snug text-rose-700 dark:border-rose-900/50 dark:text-rose-300">
                          • <strong>Security Rule:</strong> Tab switching is prohibited. Reaching 3 violations will automatically end and submit your assessment for evaluation.
                        </p>
                      </div>
                    </div>
                    <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleBackFromInstructions}
                        className="h-11 shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                        title="Go back"
                      >
                        <IconChevronLeft size={16} />
                        <span>Back</span>
                      </button>
                      <p className="justify-self-center text-center text-xs leading-snug text-slate-500 dark:text-slate-400">
                        When ready, start your {assessmentNoun} assessment.
                      </p>
                      <button
                        type="button"
                        onClick={handleStartAnswer}
                        disabled={hasStartedQuestion || prepCountdown !== null}
                        className="h-11 shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-colors hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-70 cursor-pointer"
                        title={`Start the ${assessmentNoun} assessment`}
                      >
                        {hasStartedQuestion ? <IconLoader2 size={16} className="animate-spin" /> : <IconPlayerPlay size={16} fill="currentColor" />}
                        <span>{hasStartedQuestion ? 'Starting…' : 'Start Assessment'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Visible preparation countdown in the open question area, below the prompt. */}
              {prepCountdown !== null && !isQuestionBlurred && (
                <div className="pointer-events-none absolute left-1/2 top-[58%] z-10 w-[calc(100%-2rem)] max-w-[470px] -translate-x-1/2 -translate-y-1/2" role="status" aria-live="polite">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-md shadow-slate-900/5 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 sm:gap-3.5 sm:p-3.5">
                    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 sm:h-[84px] sm:w-[84px]">
                      <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border-[3px] border-emerald-300 bg-white text-2xl font-bold tabular-nums text-emerald-600 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-400 sm:h-[60px] sm:w-[60px]">
                        {prepCountdown}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 py-1">
                      <div className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-100 sm:text-base">Get ready to answer</div>
                      <div className="mt-1 text-xs leading-snug text-slate-500 dark:text-slate-400 sm:text-sm">Your timer will start in {prepCountdown} {prepCountdown === 1 ? 'second' : 'seconds'}.</div>
                      <div className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400 sm:text-xs">Take a breath and prepare your answer.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Row: Stepper Pills & Category Badge */}
              <div className={`flex flex-col gap-2 shrink-0 transition-all duration-500 ${isQuestionBlurred ? 'filter blur-sm select-none opacity-40' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isIntroType ? (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-full">
                        {activeQuestion.category || assessmentType}
                      </span>
                    ) : questions.length > 1 ? (
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1" aria-label="Question progress">
                        {questions.slice(0, currentQuestionIndex + 1).map((_, idx) => {
                          const isCompleted = idx < currentQuestionIndex;
                          const isCurrent = idx === currentQuestionIndex;
                          return (
                            <div key={idx} aria-current={isCurrent ? 'step' : undefined} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${isCurrent ? 'bg-indigo-600 text-white shadow-xs' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'}`}>
                              {isCompleted && <IconCheck size={12} stroke={3} className="text-emerald-500 shrink-0" />}
                              <span>Q{idx + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-full">
                        {activeQuestion.category || assessmentType}
                      </span>
                    )}
                    {assessmentType === 'JD_INTRO' && (
                      <button
                        type="button"
                        onClick={() => setShowJdModal(true)}
                        className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        title="View the target Job Description this interview is tailored to"
                      >
                        <IconFileText size={13} stroke={2} />
                        <span>View Target JD</span>
                      </button>
                    )}
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>


              </div>

              {/* Backend-provided metadata updates with the active question. */}
              {(activeQuestion.subject || activeQuestion.concept || activeQuestion.scope) && assessmentType !== 'JD_INTRO' && (
                <div className={"flex flex-wrap items-center gap-2 shrink-0 transition-all duration-500 " + (isQuestionBlurred ? 'blur-sm select-none opacity-40' : '')}>
                  {activeQuestion.subject && (
                    <span className="inline-flex items-center rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300">
                      {activeQuestion.subject}
                    </span>
                  )}
                  {activeQuestion.concept && (
                    <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {activeQuestion.concept}
                    </span>
                  )}

                </div>
              )}

              {/* Keep the question area blank during the initial countdown. */}
              {!isInitialQuestionCountdown && (
              <div className={`flex-1 min-h-0 overflow-y-auto py-1 transition-all duration-500 ${isQuestionBlurred ? 'filter blur-md select-none pointer-events-none opacity-30' : ''}`}>
                {isAiSpeaking && (
                  <div
                    className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm dark:border-violet-700/60 dark:bg-violet-950/40 dark:text-violet-300"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="flex h-2 w-2 items-center justify-center">
                      <span className="absolute h-2 w-2 animate-ping rounded-full bg-violet-500 opacity-60" />
                      <span className="relative h-2 w-2 rounded-full bg-violet-600" />
                    </span>
                    AI is reading the question
                  </div>
                )}
                <div
                  className={`rounded-xl transition-all duration-300 ${isAiSpeaking
                    ? 'border border-violet-400 bg-violet-50/80 px-4 py-3 shadow-[0_0_0_3px_rgba(139,92,246,0.10)] animate-[question-read-pulse_1.8s_ease-in-out_infinite] dark:border-violet-500/80 dark:bg-violet-950/30'
                    : 'border border-transparent px-0 py-0'
                  }`}
                >
                  <h2 className="text-lg sm:text-xl xl:text-2xl font-semibold text-slate-900 dark:text-white leading-relaxed tracking-tight">
                    {activeQuestion.question_text}
                  </h2>
                </div>
              </div>
              )}

              {/* Per-Question Elapsed Progress Bar */}
              {isRecording && (
                <div className="w-full space-y-1 shrink-0">
                  <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-slate-400">
                    <span>Q{currentQuestionIndex + 1} Progress</span>
                    <span className={isQuestionTimeExpired ? 'text-rose-500 font-bold' : isQuestionLowTime ? 'text-amber-500 font-bold' : ''}>
                      {formatTime(questionTimeElapsed)} / {formatTime(questionTimeLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isQuestionTimeExpired
                          ? 'bg-rose-500'
                          : isQuestionLowTime
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                      style={{ width: `${questionProgressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Time Expired Notice */}
              {isQuestionTimeExpired && currentQuestionIndex < questions.length - 1 && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold min-w-0">
                    <IconAlertTriangle size={16} className="text-rose-500 shrink-0" />
                    <span className="truncate">Allocated time reached. Wrap up and proceed.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-1 shrink-0 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Next Question</span>
                    <IconArrowRight size={14} stroke={2.5} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
                {/* AI Voice Narration — plays the question text aloud via speech synthesis */}
                <button
                  type="button"
                  onClick={() => speakAiText(activeQuestion.question_text)}
                  disabled={isQuestionBlurred}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 disabled:opacity-40 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold cursor-pointer transition-all"
                  title={isQuestionBlurred ? 'Available once answer recording starts' : 'Play question audio'}
                >
                  {isSpeechMuted ? <IconVolumeOff size={14} /> : <IconVolume size={14} />}
                  <span>{isAiSpeaking ? 'Speaking…' : 'Play Question'}</span>
                </button>

                {activeQuestion.difficulty_level && (
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md uppercase">
                    {activeQuestion.difficulty_level}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-500 dark:text-slate-400 shadow-sm min-h-[180px] flex items-center justify-center flex-1">
              {isLoading ? 'Loading assessment questions…' : 'No questions currently available in Question Bank for this track.'}
            </div>
          )}

        </div>
      </div>

      {/* Target JD Viewer Modal */}
      {showJdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <IconFileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {targetRole || 'Target Job Description'}
                  </h3>
                  {targetCompany && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {targetCompany}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJdModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                {jobDescription || 'No job description text was provided for this assessment session.'}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowJdModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EXIT CONFIRMATION MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500 dark:text-rose-400">
              <IconAlertTriangle size={24} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Exit Assessment Session?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Exiting will cancel your current attempt and any unsaved responses. Are you sure you want to leave?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  recordCompletion(SessionLifecycleStatus.ABANDONED);
                  if (countdownIntervalRef.current && typeof window !== 'undefined') window.clearInterval(countdownIntervalRef.current);
                  cleanupRecorder();
                  clearQueue();
                  try {
                    if (assessmentId) {
                      await aiprepApi.cancelAssessment(assessmentId);
                    }
                  } catch (e) {
                    console.warn('Failed to cancel assessment on server:', e);
                  }
                  router.push(isEmbedded ? '/user_dashboard/ai-prep?embed=true' : '/user_dashboard/ai-prep');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-colors cursor-pointer"
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && questions.length > 0 && !isEnding && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-xl dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          <div className="flex items-start justify-between gap-3">
            <p>{errorMsg}</p>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 4. SUBMITTING & FINALIZING MODAL SPINNER OVERLAY */}
      {isEnding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full mx-auto shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center mb-4 text-[#7C3AED] shadow-sm">
              <IconLoader2 size={36} className="animate-spin text-[#7C3AED]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Submitting Assessment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              {submissionStep} Please do not close or refresh this page while evaluation is running.
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-[#7C3AED] to-purple-400 transition-all duration-300"
                style={{ width: `${submissionProgress}%` }}
              />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{submissionProgress}% complete</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentSessionPage;
