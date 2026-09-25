/**
 * Active Assessment Session Room Page
 * 
 * Route: /aiprep/session/[assessmentId]
 * Studio Cinema-Grade Layout with Floating Dock, Audio Equalizer, AI Voice & Real-time Slicing
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { aiprepApi } from '@/lib/aiprep-api';
import type {
  AssessmentType,
  AssessmentStatus,
  MediaType,
  QuestionBankItem,
} from '@/types/aiprep';
import { NO_PAUSE_ASSESSMENT_TYPES } from '@/types/aiprep';
import { useTheme } from 'next-themes';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { useChunkUploadQueue } from '@/hooks/useChunkUploadQueue';
import { ChunkedUploader } from '@/components/aiprep/ChunkedUploader';
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

/**
 * Compact Floating Audio Waveform Equalizer (Embedded in Camera Overlay)
 */
const EmbeddedAudioWaveform = memo(({ stream, isMuted, isLight = false }: { stream: MediaStream | null; isMuted: boolean; isLight?: boolean }) => {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(3));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastDrawTime = useRef<number>(0);

  useEffect(() => {
    if (!stream || isMuted) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (_) { }
        audioContextRef.current = null;
      }
      setAudioLevels(Array(20).fill(3));
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const renderWave = (time: number) => {
        if (time - lastDrawTime.current >= 40) {
          lastDrawTime.current = time;
          analyser.getByteFrequencyData(dataArray);
          const bars: number[] = [];
          for (let i = 0; i < 20; i++) {
            const val = dataArray[i % dataArray.length] || 0;
            const barHeight = Math.max(3, Math.round((val / 255) * 14) + 3);
            bars.push(barHeight);
          }
          setAudioLevels(bars);
        }
        animFrameRef.current = requestAnimationFrame(renderWave);
      };

      animFrameRef.current = requestAnimationFrame(renderWave);
    } catch (e) {
      console.warn('Audio visualizer error:', e);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (_) { }
        audioContextRef.current = null;
      }
    };
  }, [stream, isMuted]);

  if (isMuted && !isLight) return null;

  if (isLight) {
    return (
      <div className="flex items-center gap-[3px] h-5 overflow-hidden">
        {audioLevels.slice(0, 12).map((height, i) => (
          <div
            key={i}
            style={{ height: isMuted ? '3px' : `${height}px` }}
            className={`w-[3px] rounded-full shrink-0 transition-all duration-75 ${
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
  );
});

EmbeddedAudioWaveform.displayName = 'EmbeddedAudioWaveform';

export default function AssessmentSessionPage({ assessmentIdProp }: { assessmentIdProp?: number } = {}) {
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

  // Extract assessmentId from route params
  const assessmentIdStr = params?.assessmentId;
  const assessmentId = assessmentIdStr ? parseInt(assessmentIdStr as string, 10) : 0;

  const isEmbedded = searchParams?.get('embed') === 'true';


  // Core session metadata
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('TECHNICAL');
  const [mediaType, setMediaType] = useState<MediaType>('VIDEO');
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Maximum recording duration — 5 min for INTRO/JD_INTRO, 30 min for all other types
  // Derived via useMemo so it updates once assessmentType is resolved from the backend
  const MAX_RECORDING_SECONDS = React.useMemo(() => {
    if (assessmentType === 'INTRO' || assessmentType === 'JD_INTRO') return 5 * 60;
    return 30 * 60;
  }, [assessmentType]);

  // Status & loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Countdown overlay before recording starts
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const hasAutoStartedRef = useRef<boolean>(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Per-Question Time Tracking & Multi-Question Answers
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState<number>(0);
  const [questionTimeLimit, setQuestionTimeLimit] = useState<number>(180);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
  const [isTransitioningQuestion, setIsTransitioningQuestion] = useState<boolean>(false);
  const elapsedTimeRef = useRef<number>(0);

  // Target Job Description State (for JD_INTRO track)
  const [jobDescription, setJobDescription] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');
  const [targetCompany, setTargetCompany] = useState<string>('');
  const [showJdModal, setShowJdModal] = useState<boolean>(false);

  // Exit Modal
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

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
  } = useChunkUploadQueue({
    assessmentId,
    mediaType: typeof mediaType === 'string' ? mediaType : 'VIDEO',
  });

  // ── Media Recorder Hook (30s slicing) ──────────────────────────────────────
  const {
    status: recordingStatus,
    stream,
    elapsedTime,
    startRecording: startRecorderCore,
    stopRecording,
    cleanup: cleanupRecorder,
  } = useMediaRecorder({
    mediaType: typeof mediaType === 'string' ? mediaType : 'VIDEO',
    chunkDurationMs: 30000,
    onChunkReady: (blob, chunkIdx, isFinal) => {
      console.log(`[Media Pipeline] Produced 30s slice #${chunkIdx} (${Math.round(blob.size / 1024)} KB, isFinal: ${isFinal})`);
      enqueueChunk(blob, chunkIdx, isFinal);
    },
    onError: (err) => {
      console.error('[MediaRecorder Error]:', err);
      setErrorMsg(err.message || 'Media recording failed.');
    },
  });

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
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || isSpeechMuted) return;

      stopAiSpeech();

      try {
        const cleanText = text.replace(/^"|"$/g, '').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        speechUtteranceRef.current = utterance;

        const currentVoices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
        const preferredVoice = getBestVoice(currentVoices);

        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 0.95;

        utterance.onstart = () => setIsAiSpeaking(true);
        utterance.onend = () => {
          speechUtteranceRef.current = null;
          setIsAiSpeaking(false);
        };
        utterance.onerror = () => {
          speechUtteranceRef.current = null;
          setIsAiSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        speechUtteranceRef.current = null;
        setIsAiSpeaking(false);
      }
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

  // ── Initialize Session Metadata & Questions from Backend DB ────────────────
  useEffect(() => {
    if (!assessmentId) {
      setErrorMsg('No assessment ID provided. Please start from the assessment portal.');
      setIsLoading(false);
      return;
    }
    if (sessionInitializedRef.current) return;
    sessionInitializedRef.current = true;

    async function initSession() {
      try {
        setIsLoading(true);

        // 1. Recover stored session track & mode (from backend API first, with fallback to storage)
        let resolvedType: AssessmentType = (sessionStorage.getItem('aiprep_active_type') as AssessmentType);
        let resolvedMode: MediaType = (sessionStorage.getItem('aiprep_active_mode') as MediaType);

        try {
          const details = await aiprepApi.getAssessment(Number(assessmentId));
          if (details?.assessment_type) resolvedType = details.assessment_type;
          if (details?.media_type) resolvedMode = details.media_type;
          if (details?.assessment_type === 'JD_INTRO' && details?.job_description) {
            setJobDescription(details.job_description);
          }
        } catch (_) { }

        const finalType: AssessmentType = resolvedType || 'INTRO';
        const finalMode: MediaType = resolvedMode || 'VIDEO';

        if (finalType === 'JD_INTRO' && typeof window !== 'undefined') {
          const storedJd = sessionStorage.getItem('aiprep_jd_text');
          const storedRole = sessionStorage.getItem('aiprep_jd_role');
          const storedCompany = sessionStorage.getItem('aiprep_jd_company');
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

        // 2. Query Question Bank API dynamically for this track (Backend First)
        let loadedQuestions: QuestionBankItem[] = [];
        try {
          const dataRes = await aiprepApi.getAssessmentData(Number(assessmentId));
          if (dataRes?.questions && dataRes.questions.length > 0) {
            loadedQuestions = dataRes.questions as unknown as QuestionBankItem[];
          }
        } catch (qErr) {
          console.warn('Questions API fallback failed:', qErr);
        }

        if (!loadedQuestions || loadedQuestions.length === 0) {
          setErrorMsg('Unable to load questions from server. Please retry or contact support.');
          setIsLoading(false);
          return;
        }

        setQuestions(loadedQuestions);

        // If intro track, trigger 5-second auto countdown to start practice smoothly
        if (NO_PAUSE_ASSESSMENT_TYPES.includes(finalType) && !hasAutoStartedRef.current) {
          hasAutoStartedRef.current = true;
          let currentCount = 5;
          setCountdownValue(currentCount);
          countdownIntervalRef.current = setInterval(() => {
            currentCount -= 1;
            if (currentCount <= 0) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              setCountdownValue(null);
              startAnswerRef.current();
            } else {
              setCountdownValue(currentCount);
            }
          }, 1000);
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
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      cleanupRecorderRef.current();
    };
  }, [assessmentId, stopAiSpeech, retryCount]);

  // Connect video element to active stream
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
      // Reset accumulated transcript when a fresh recording session begins
      finalTranscriptRef.current = '';
      setLiveTranscript('');

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          let sessionFinal = '';
          let sessionInterim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            const text = res[0]?.transcript || '';
            if (res.isFinal) {
              const trimmed = text.trim();
              if (trimmed) {
                sessionFinal += trimmed + ' ';
                const currentSec = Math.floor(elapsedTimeRef.current);
                const m = Math.floor(currentSec / 60).toString().padStart(2, '0');
                const s = Math.floor(currentSec % 60).toString().padStart(2, '0');
                transcriptSegmentsRef.current.push({
                  speaker: 'Candidate',
                  text: trimmed,
                  timestamp: `${m}:${s}`,
                  timestamp_s: currentSec,
                });
              }
            } else {
              sessionInterim += text;
            }
          }

          if (sessionFinal.trim()) {
            accumulatedTranscriptRef.current = [
              accumulatedTranscriptRef.current,
              sessionFinal.trim(),
            ]
              .filter(Boolean)
              .join(' ');
          }

          currentInterimRef.current = sessionInterim.trim();

          const combinedText = [
            accumulatedTranscriptRef.current,
            currentInterimRef.current,
          ]
            .filter(Boolean)
            .join(' ')
            .trim();

          if (combinedText) {
            setLiveTranscript(combinedText);
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
          // If there was any pending interim text, commit it to accumulated text
          if (currentInterimRef.current) {
            const pendingText = currentInterimRef.current;
            accumulatedTranscriptRef.current = [
              accumulatedTranscriptRef.current,
              pendingText,
            ]
              .filter(Boolean)
              .join(' ');

            const currentSec = Math.floor(elapsedTimeRef.current);
            const m = Math.floor(currentSec / 60).toString().padStart(2, '0');
            const s = Math.floor(currentSec % 60).toString().padStart(2, '0');
            transcriptSegmentsRef.current.push({
              speaker: 'Candidate',
              text: pendingText,
              timestamp: `${m}:${s}`,
              timestamp_s: currentSec,
            });
            currentInterimRef.current = '';
          }

          // Keep listening seamlessly across silent pauses
          if (isRecordingRef.current && recognitionRef.current === recognition) {
            try {
              recognition.start();
            } catch (_) { }
          }
        };

        recognition.start();
      } catch (err) {
        console.warn('Speech recognition not available:', err);
      }
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) { }
      recognitionRef.current = null;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) { }
      }
    };
  }, [
    isRecording,
    accumulatedTranscriptRef,
    recognitionRef,
    currentInterimRef,
    setLiveTranscript,
    transcriptScrollRef,
    elapsedTimeRef,
    transcriptSegmentsRef,
  ]);

  // ── Start Recording Control ────────────────────────────────────────────────
  // Recording starts only AFTER the AI finishes reading the question aloud.
  const handleStartAnswer = () => {
    const activeQ = questions[currentQuestionIndex];
    if (!isSpeechMuted && activeQ?.question_text && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      stopAiSpeech();
      let hasStartedRecording = false;

      const triggerStartRecording = () => {
        if (hasStartedRecording) return;
        hasStartedRecording = true;
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = null;
        }
        speechUtteranceRef.current = null;
        setIsAiSpeaking(false);
        startRecorderCore();
      };

      try {
        const cleanText = activeQ.question_text.replace(/^"|"$/g, '').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        speechUtteranceRef.current = utterance;

        const currentVoices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
        const preferredVoice = getBestVoice(currentVoices);
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 0.95;

        utterance.onstart = () => setIsAiSpeaking(true);
        utterance.onend = () => triggerStartRecording();
        utterance.onerror = () => triggerStartRecording();

        // Safeguard timeout: calculate based on word count (avg ~2.5 words/sec + 5s buffer, min 8s, max 20s)
        const wordCount = cleanText.split(/\s+/).length;
        const maxWaitMs = Math.min(Math.max(Math.ceil((wordCount / 2.5) * 1000) + 5000, 8000), 20000);

        speechTimeoutRef.current = setTimeout(() => {
          console.warn('[Assessment] Speech synthesis safeguard timeout triggered');
          try {
            window.speechSynthesis.cancel();
          } catch (_) { }
          triggerStartRecording();
        }, maxWaitMs);

        window.speechSynthesis.speak(utterance);
      } catch (_) {
        triggerStartRecording();
      }
    } else {
      startRecorderCore();
    }
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
      limit = getDifficultySeconds(activeQ?.difficulty_level) || getDefaultTypeSeconds(assessmentType);
    }
    setQuestionTimeLimit(limit);
    setQuestionTimeElapsed(0);
  }, [currentQuestionIndex, questions, assessmentType]);

  const handleNextQuestionRef = useRef<() => void>(() => { });

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => {
      setQuestionTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && questionTimeElapsed >= questionTimeLimit + 3 && !isTransitioningQuestion) {
      if (currentQuestionIndex < questions.length - 1) {
        handleNextQuestionRef.current();
      }
    }
  }, [isRecording, questionTimeElapsed, questionTimeLimit, isTransitioningQuestion, currentQuestionIndex, questions.length]);

  const questionTimeRemaining = Math.max(0, questionTimeLimit - questionTimeElapsed);
  const isQuestionLowTime = isRecording && questionTimeRemaining <= 30 && questionTimeRemaining > 0;
  const isQuestionTimeExpired = isRecording && questionTimeRemaining === 0;
  const questionProgressPct = Math.min(100, Math.round((questionTimeElapsed / (questionTimeLimit || 1)) * 100));

  // ── Navigation Between Questions ───────────────────────────────────────────
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1 && !isTransitioningQuestion) {
      setIsTransitioningQuestion(true);
      stopAiSpeech();

      // 1. Snapshot current question's live transcript
      const currentText = liveTranscript.trim();
      setQuestionAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: currentText || prev[currentQuestionIndex] || '',
      }));
      setLiveTranscript(''); // Clear for next question

      // 2. Advance index and reset timer
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setQuestionTimeElapsed(0);

      // 3. Read the new question aloud if not muted
      const nextQ = questions[nextIndex];
      if (nextQ?.question_text && !isSpeechMuted) {
        speakAiText(nextQ.question_text);
      }

      setTimeout(() => {
        setIsTransitioningQuestion(false);
      }, 350);
    }
  };
  handleNextQuestionRef.current = handleNextQuestion;

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0 && !isTransitioningQuestion) {
      setIsTransitioningQuestion(true);
      stopAiSpeech();

      const currentText = liveTranscript.trim();
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

  // ── Complete Session & Submit Telemetry to Pure Engines ─────────────────────
  const handleEndSession = async () => {
    if (!assessmentId || isEnding || countdownValue !== null) return;

    try {
      setIsEnding(true);
      stopAiSpeech();

      // 1. Stop recording and flush final 30s slice
      await stopRecording();

      // Commit any pending interim speech before submitting
      if (currentInterimRef.current) {
        accumulatedTranscriptRef.current = [
          accumulatedTranscriptRef.current,
          currentInterimRef.current,
        ]
          .filter(Boolean)
          .join(' ');

        const currentSec = Math.floor(elapsedTimeRef.current);
        const m = Math.floor(currentSec / 60).toString().padStart(2, '0');
        const s = Math.floor(currentSec % 60).toString().padStart(2, '0');
        transcriptSegmentsRef.current.push({
          speaker: 'Candidate',
          text: currentInterimRef.current,
          timestamp: `${m}:${s}`,
          timestamp_s: currentSec,
        });
        currentInterimRef.current = '';
      }

      const actualTranscript =
        accumulatedTranscriptRef.current.trim() ||
        liveTranscript.trim() ||
        questions[currentQuestionIndex]?.question_text ||
        'Assessment completed.';

      const finalSegments =
        transcriptSegmentsRef.current.length > 0
          ? transcriptSegmentsRef.current
          : [
            {
              speaker: 'Candidate',
              text: actualTranscript,
              timestamp: '00:00',
              timestamp_s: 0,
            },
          ];

      // 3. Assemble session questions & transcript payload without client-mocked audio telemetry
      const telemetryPayload = {
        questions: questions.map((q, idx) => ({
          question_id: q.id || (q as any).question_id || idx + 1,
          question_text: q.question_text,
        })),
        transcript: {
          full_text: actualTranscript,
          segments: finalSegments,
        },
        video_telemetry: {
          is_video_mode: !isAudioOnly,
          face_visible_pct: 100,
          head_nods_count: 0,
        },
      };

      // 4. Submit captured questions & live transcript to POST /api/aiprep/assessments/{id}/data
      try {
        await aiprepApi.submitTelemetryData(assessmentId, telemetryPayload);
      } catch (submitErr) {
        console.warn('Telemetry submission note:', submitErr);
      }

      // 5. Trigger primary LLM Evaluation Orchestrator
      let triggerSuccess = false;
      try {
        await aiprepApi.triggerEvaluation(assessmentId);
        triggerSuccess = true;
      } catch (evalErr) {
        console.warn('Evaluation trigger note, falling back to assembleMedia:', evalErr);
        try {
          await aiprepApi.assembleMedia(assessmentId);
          triggerSuccess = true;
        } catch (assembleErr) {
          console.error('Failed both evaluation trigger and media assembly:', assembleErr);
        }
      }

      if (!triggerSuccess) {
        setErrorMsg('Failed to finalize assessment. Please check your network connection and try submitting again.');
        setIsEnding(false);
        return;
      }

      // 6. Clean up browser session storage flags
      sessionStorage.removeItem('aiprep_active_id');
      sessionStorage.removeItem('aiprep_wizard_step');

      // 7. Transition candidate to processing screen
      const processingUrl = isEmbedded
        ? `/aiprep/session/${assessmentId}/processing?embed=true`
        : `/aiprep/session/${assessmentId}/processing`;
      router.push(processingUrl);
    } catch (err: any) {
      console.error('Finalize session error:', err);
      setErrorMsg(err?.message || 'Failed to submit assessment telemetry.');
      setIsEnding(false);
    } finally {
      setIsEnding(false);
    }
  };

  // ── Max Recording Duration Enforcer ───────────────────────────────────────
  // Auto-ends the session when the type-specific time limit is reached
  useEffect(() => {
    if (isRecording && elapsedTime >= MAX_RECORDING_SECONDS && !isEnding) {
      console.warn(`[Assessment] Max recording time (${MAX_RECORDING_SECONDS / 60} min) reached — auto-ending session.`);
      handleEndSession();
    }
  }, [elapsedTime, isRecording, isEnding, MAX_RECORDING_SECONDS, handleEndSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
            onClick={() => router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep')}
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
  const isQuestionBlurred = isInactive && !isIntroType;

  return (
    <div className="w-full min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. TOP UTILITY HEADER */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-30">
        {/* LEFT: Logo & Assessment Track Title */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/logos/whitebox-cube-logo.png"
            alt="Whitebox Learning"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            priority
          />
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              {assessmentType} Assessment
            </h1>
          </div>
        </div>

        {/* CENTER: Interview Question Countdown & Total Clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Question Countdown Badge */}
          <div
            className={`h-8 px-3 sm:px-3.5 rounded-full border shadow-xs inline-flex items-center gap-2 transition-colors duration-200 ${isQuestionTimeExpired
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                : isQuestionLowTime
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                  : 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300'
              }`}
            title={`Time allocated for Question ${currentQuestionIndex + 1}: ${formatTime(questionTimeLimit)}`}
          >
            <IconClock size={15} className={`shrink-0 ${isQuestionTimeExpired ? 'text-rose-500' : isQuestionLowTime ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`} />
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                Q{currentQuestionIndex + 1} Time:
              </span>
              <span className="font-mono text-xs sm:text-sm font-black whitespace-nowrap">
                {formatTime(questionTimeRemaining)}
              </span>
            </div>
            {isQuestionLowTime && (
              <span className="hidden sm:inline-flex items-center justify-center text-[9px] font-extrabold uppercase bg-amber-200 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded leading-none">
                30s Left
              </span>
            )}
            {isQuestionTimeExpired && (
              <span className="inline-flex items-center justify-center text-[9px] font-extrabold uppercase bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200 px-1.5 py-0.5 rounded leading-none">
                Time Up
              </span>
            )}
          </div>

          {/* Session Total Duration Clock */}
          <div className="hidden md:inline-flex items-center h-8 gap-1.5 px-3 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Total:</span>
            <span className="font-mono text-xs font-bold leading-none">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>

        {/* RIGHT: Dynamic Connection Quality & Fullscreen Mode */}
        <div className="flex items-center gap-2">
          {/* Connection Quality Icon Indicator (Green/Yellow/Red) */}
          <div
            className={`p-1.5 rounded-xl border transition-colors flex items-center justify-center ${networkQuality === 'good'
              ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50'
              : networkQuality === 'average'
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50'
                : 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50'
              }`}
            title={
              networkQuality === 'good'
                ? 'Network Connection: Good (High Speed)'
                : networkQuality === 'average'
                  ? 'Network Connection: Moderate'
                  : 'Network Connection: Weak / Poor'
            }
          >
            <IconWifi size={17} stroke={2.5} />
          </div>

          {/* Fullscreen Focus Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}
          >
            {isFullscreen ? <IconMinimize size={17} /> : <IconMaximize size={17} />}
          </button>
        </div>
      </header>

      {/* 2. MAIN INTERVIEW STUDIO WORKSPACE */}
      <div className="flex-1 min-h-0 p-2 sm:p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-3 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* LEFT COLUMN: Cinema Camera Stage & Floating Meeting Dock */}
        <div className="lg:col-span-7 flex flex-col justify-between min-h-0 gap-2 h-full overflow-hidden">
          {/* CINEMA CAMERA STAGE */}
          <div className={`relative w-full aspect-video sm:aspect-auto sm:flex-1 rounded-2xl sm:rounded-3xl overflow-hidden border flex items-center justify-center min-h-[260px] sm:min-h-[360px] transition-colors duration-300 ${
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
                <p className={`mt-4 text-sm font-bold uppercase tracking-widest animate-pulse ${
                  isAudioOnly ? 'text-slate-700' : 'text-white'
                }`}>
                  Get ready! Recording starts automatically…
                </p>
              </div>
            )}

            {/* Video Stream Element — hidden in audio-only mode */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${!isAudioOnly ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            />

            {/* Audio-Only Placeholder: Large bare mic + compact waveform, dead centre */}
            {isAudioOnly && (
              <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center gap-4">
                {/* Soft ambient glow behind mic */}
                <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-indigo-200/40 to-purple-200/40 blur-3xl pointer-events-none" />

                {/* Large bare mic icon — no circle, just the icon */}
                <IconMicrophone
                  size={80}
                  stroke={1.5}
                  className={`relative z-10 transition-all duration-300 ${isRecording ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`}
                />

                {/* Compact waveform + status text */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <EmbeddedAudioWaveform stream={stream} isMuted={isInactive} isLight={true} />
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    {isRecording ? 'Microphone Active — Recording' : 'Audio Only Mode'}
                  </span>
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
                className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-400'
                  }`}
              />
              <span className={`${isAudioOnly ? 'text-red-600' : 'text-red-400'} uppercase font-extrabold text-[11px]`}>REC</span>
              <span className={`${isAudioOnly ? 'text-slate-600' : 'text-slate-300'} text-xs`}>{isRecording ? 'Live •' : 'Standby •'}</span>
              <span className={`font-mono text-xs font-bold ${isAudioOnly ? 'text-slate-900' : 'text-white'}`}>{formatTime(elapsedTime)}</span>
            </div>

            {/* Bottom-Left: Embedded Audio Waveform Equalizer (video mode only) */}
            {!isAudioOnly && (
              <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1">
                <EmbeddedAudioWaveform stream={stream} isMuted={isInactive} />
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 drop-shadow">
                  <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{isRecording ? 'Mic & Camera Active' : 'Ready to Start'}</span>
                </div>
              </div>
            )}
          </div>

          {/* FLOATING GLASS MEETING DOCK */}
          <div className="w-full flex items-center justify-center shrink-0 py-2">
            <div className="flex items-center justify-between gap-3 w-full max-w-2xl h-14 sm:h-16 px-4 sm:px-6 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl">
              {/* Left Group: Exit Button + Previous Question Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowExitModal(true)}
                  className="h-10 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 inline-flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold shrink-0"
                  title="Exit Assessment"
                >
                  <IconLogout size={16} stroke={2} />
                  <span>Exit Assessment</span>
                </button>

                {/* Previous Button (Only when recording and past Question 1) */}
                {isRecording && currentQuestionIndex > 0 && (
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
              <div className="flex items-center justify-center shrink-0">
                {isInactive ? (
                  !isIntroType ? (
                    <button
                      type="button"
                      onClick={handleStartAnswer}
                      className="h-10 px-6 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                      title="Reveal Question & Begin Answering"
                    >
                      <IconPlayerPlay size={16} fill="currentColor" />
                      <span>Start Answer</span>
                    </button>
                  ) : (
                    <div className="h-10 inline-flex items-center justify-center gap-1.5 px-4 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                      <span>Starting countdown{countdownValue !== null ? ` (${countdownValue}s)` : ''}…</span>
                    </div>
                  )
                ) : (
                  <div className="h-10 inline-flex items-center justify-center gap-2 px-3 sm:px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      Answering Q{currentQuestionIndex + 1} ({formatTime(questionTimeElapsed)})
                    </span>
                  </div>
                )}
              </div>

              {/* Right Group: Forward Progression (Next Question / Finish Assessment) or Symmetrical Spacer */}
              <div className="flex items-center justify-end shrink-0">
                {isRecording ? (
                  currentQuestionIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      disabled={isTransitioningQuestion}
                      className="h-10 px-4 sm:px-5 rounded-xl font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 transition-all shrink-0"
                      title="Submit answer and proceed to next question"
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
                  ) : (
                    <button
                      type="button"
                      onClick={handleEndSession}
                      disabled={isEnding || countdownValue !== null}
                      className={`h-10 px-4 sm:px-5 rounded-xl font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 shrink-0 ${countdownValue !== null
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60 shadow-none pointer-events-none'
                          : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-purple-500/30 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50'
                        }`}
                      title="Finish Assessment"
                    >
                      {isEnding ? (
                        <>
                          <IconLoader2 size={16} className="animate-spin" />
                          <span>Finalizing…</span>
                        </>
                      ) : (
                        <>
                          <span>Finish Assessment</span>
                          <IconCheck size={16} stroke={2.5} />
                        </>
                      )}
                    </button>
                  )
                ) : (
                  /* Symmetrical spacer matching Exit button width so Start Answer is dead-center */
                  <div className="w-[72px] shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Question Prompt Card & Live Speech Transcript Card */}
        <div className="lg:col-span-5 flex flex-col gap-3 min-h-0 lg:h-full shrink-0 lg:shrink">
          {/* CARD 1: Question Prompt Card (Expanded height & scrollable) */}
          {activeQuestion ? (
            <div className="relative bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between min-h-[220px] flex-1 space-y-3 overflow-hidden">
              {/* Overlay when question is hidden in standby mode */}
              {isQuestionBlurred && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl p-4 text-center transition-all duration-500">
                  <div className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-sm border border-indigo-200 dark:border-indigo-500/30">
                    <IconLock size={22} stroke={2.2} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Question Hidden Until Start
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    Click <span className="font-bold text-emerald-600 dark:text-emerald-400">Start Answer ▶</span> in the dock below when you are ready to reveal the question and begin recording.
                  </p>
                </div>
              )}

              {/* Top Row: Stepper Pills & Category Badge */}
              <div className={`flex flex-col gap-2 shrink-0 transition-all duration-500 ${isQuestionBlurred ? 'filter blur-sm select-none opacity-40' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-full">
                      {activeQuestion.category || assessmentType}
                    </span>
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

                {/* Multi-Question Stepper Dots/Pills */}
                {questions.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 border-b border-slate-100 dark:border-slate-800/80">
                    {questions.map((_, idx) => {
                      const isCompleted = idx < currentQuestionIndex || (!!questionAnswers[idx] && idx !== currentQuestionIndex);
                      const isCurrent = idx === currentQuestionIndex;
                      return (
                        <div
                          key={idx}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${isCurrent
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : isCompleted
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                            }`}
                        >
                          {isCompleted && <IconCheck size={12} stroke={3} className="text-emerald-500 shrink-0" />}
                          <span>Q{idx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Question Text */}
              <div className={`flex-1 min-h-0 overflow-y-auto py-1 transition-all duration-500 ${isQuestionBlurred ? 'filter blur-md select-none pointer-events-none opacity-30' : ''}`}>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {activeQuestion.question_text}
                </h2>
              </div>

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

          {/* CARD 2: Live Speech Transcript Card (Compact fixed height) */}
          <div className="h-[140px] sm:h-[160px] shrink-0 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm dark:shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <IconMessage2 size={15} />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Speech Transcript</h3>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                {wordCount} words
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
                onClick={() => {
                  if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                  cleanupRecorder();
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
    </div>
  );
}
