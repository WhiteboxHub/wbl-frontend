/**
 * Active Assessment Session Room Page
 * 
 * Target Workspace: wbl-frontend
 * Route: /aiprep/session/[assessmentId]
 *
 * 
 * Pixel-Perfect Enterprise Assessment Room UI Layout:
 * - Header Bar: Title with Live Status + Time Remaining Progress Bar + Status Pills & End Session Button
 * - Sub-Header Metric Strip: Assessment Type, Session Progress, Total Questions, Total Marks, View Instructions
 * - Left Stage: HD Recording Video Container with Audio/Video/Network Overlay Badges + Interview Tips Cards + Control Bar
 * - Right Panel: Question Card + Evaluation Checklist + Response Time Progress Bar + Optional Notes Textarea + Next/Skip Actions
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  aiprepApi,
  Assessment,
  Question,
  AssessmentType,
  AssessmentMode,
  AssessmentStatus,
  NO_PAUSE_ASSESSMENT_TYPES,
  QuestionCategory,
  getTimeLimitSeconds,
  getDifficultySeconds,
  transcribeAudioWithBackendLlmKey
} from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { YOLOAnalyzer } from '@/components/aiprep/YOLOAnalyzer';
import { ChunkedUploader } from '@/components/aiprep/ChunkedUploader';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { useChunkUploadQueue } from '@/hooks/useChunkUploadQueue';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconPlayerPause,
  IconPlayerPlay,
  IconChevronRight,
  IconChevronLeft,
  IconLogout,
  IconClock,
  IconCircleCheck,
  IconAlertTriangle,
  IconLoader2,
  IconMessage2,
  IconInfoCircle,
  IconVolume,
  IconVolumeOff,
  IconCameraOff,
  IconSparkles,
  IconMaximize,
  IconBookmark,
  IconList,
  IconSettings,
  IconBulb,
  IconCode,
  IconShieldCheck,
  IconWifi,
  IconActivity,
  IconX,
  IconHelpCircle,
  IconBriefcase,
  IconTrendingUp,
  IconPlayerSkipForward
} from '@tabler/icons-react';

/**
 * Compact Floating Audio Waveform Equalizer (Embedded in Camera Overlay)
 */
const EmbeddedAudioWaveform = memo(({ stream, isMuted }: { stream: MediaStream | null; isMuted: boolean }) => {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(18).fill(3));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastDrawTime = useRef<number>(0);

  useEffect(() => {
    if (!stream || isMuted) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) { }
        audioContextRef.current = null;
      }
      setAudioLevels(Array(18).fill(3));
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
          for (let i = 0; i < 18; i++) {
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
        try { audioContextRef.current.close(); } catch (e) { }
        audioContextRef.current = null;
      }
    };
  }, [stream, isMuted]);

  return (
    <div className="flex items-center gap-1.5 h-4">
      {audioLevels.map((height, i) => (
        <div
          key={i}
          style={{ height: `${height}px` }}
          className="w-1 rounded-full bg-emerald-400 transition-all duration-75"
        />
      ))}
    </div>
  );
});

const mapAssessmentTypeToCategory = (type: AssessmentType): QuestionCategory => {
  switch (type) {
    case 'TECHNICAL': return 'TECHNICAL';
    case 'SYSTEM_DESIGN': return 'SYSTEM_DESIGN';
    case 'RECRUITER': return 'RECRUITER';
    case 'HIRING_MANAGER': return 'HIRING_MANAGER';
    case 'GENERAL_INTRO':
    case 'JOB_DESCRIPTION_INTRO':
      return 'GENERAL';
    case 'HR':
    default:
      return 'BEHAVIORAL';
  }
};

export default function AssessmentSessionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Extract assessmentId from route params
  const assessmentIdStr = params?.assessmentId;
  const assessmentId = assessmentIdStr ? parseInt(assessmentIdStr as string, 10) : null;

  const queryType = searchParams ? (searchParams.get('type') as AssessmentType | null) : null;
  const queryMode = searchParams ? (searchParams.get('mode') as AssessmentMode | null) : null;

  // Page states
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(1122); // 18m 42s default
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // User Notes state
  const [candidateNotes, setCandidateNotes] = useState<string>('');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);

  // Route Security Guard
  useEffect(() => {
    async function verifyAuth() {
      try {
        await apiFetch("user_dashboard");
      } catch (err) {
        console.warn('[Security Guard]: Unauthenticated direct access attempt to /aiprep session. Redirecting to login.');
        router.replace('/login');
      }
    }
    verifyAuth();
  }, [router]);

  // Embedded detection
  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    const embedded = window.self !== window.top || window.location.search.includes('embed=true');
    setIsEmbedded(embedded);
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hardware Controls
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [yoloEnabled, setYoloEnabled] = useState<boolean>(true);

  // Live Speech Recognition Transcript & Candidate Notes
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const autoStartRecordingRef = useRef<boolean>(false);

  // Exit modal state
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Hook 1: Upload Queue Manager
  const { state: uploadState, enqueueChunk, retryFailedChunks } =
    useChunkUploadQueue({
      assessmentId: assessment?.id || assessmentId || 0,
      onError: (err) => console.error(`Sync error: ${err.message}`),
    });

  // Hook 2: MediaRecorder Engine (30s chunking)
  const {
    recordingState,
    elapsedSeconds,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useMediaRecorder({
    stream,
    mode: assessment?.assessment_mode || 'VIDEO_AUDIO',
    chunkDurationMs: 30000,
    onChunkReady: async (chunkBlob, chunkNumber) => {
      console.log(`[Media Pipeline] Secured 30s media slice #${chunkNumber + 1} (${Math.round(chunkBlob.size / 1024)} KB)`);
      enqueueChunk(chunkBlob, chunkNumber);

      // Transcribe 30s audio slice using candidate's My LLM Setup API key
      try {
        const text = await transcribeAudioWithBackendLlmKey(chunkBlob);
        if (text) {
          setLiveTranscript(prev => (prev ? `${prev} ${text}` : text));
        }
      } catch (err) {
        console.warn('My LLM Setup key STT transcription note:', err);
      }
    },
    onError: (err) => console.error(`[Recorder Error]: ${err.message}`),
  });

  const [isManualPaused, setIsManualPaused] = useState<boolean>(false);
  const isPaused = recordingState === 'paused' || isManualPaused;
  const isRecording = recordingState === 'recording' && !isManualPaused;
  const isInactive = recordingState === 'inactive';

  // Toggle Pause/Resume & sync backend session status
  const handleTogglePause = async () => {
    if (isPaused) {
      resumeRecording();
      setIsManualPaused(false);
      if (assessmentId) {
        try {
          await aiprepApi.updateAssessmentStatus(assessmentId, 'IN_PROGRESS');
        } catch (err) {
          console.warn('Failed to update status to IN_PROGRESS on backend:', err);
        }
      }
    } else {
      const isNoPauseType = assessment?.assessment_type === 'GENERAL_INTRO' || assessment?.assessment_type === 'JOB_DESCRIPTION_INTRO';
      if (isNoPauseType) {
        alert("Pausing is disabled for introductory assessment sessions per system rules.");
        return;
      }
      pauseRecording();
      setIsManualPaused(true);
      if (assessmentId) {
        try {
          await aiprepApi.updateAssessmentStatus(assessmentId, 'PAUSED' as AssessmentStatus);
        } catch (err: any) {
          console.warn('Failed to update status to PAUSED on backend:', err);
        }
      }
    }
  };

  // Video / Audio hardware refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Assessment metadata & questions
  useEffect(() => {
    if (!assessmentId) return;

    async function fetchAssessmentData() {
      try {
        setIsLoading(true);
        const resolvedType = queryType || 'TECHNICAL';
        const resolvedMode = queryMode || 'VIDEO_AUDIO';

        const data = await aiprepApi.getAssessment(assessmentId);
        const effectiveType = data.assessment_type || resolvedType;

        // Load cached questions or fallback to DB
        const cachedQuestionsStr = sessionStorage.getItem(`aiprep_session_questions_${assessmentId}`);
        if (cachedQuestionsStr) {
          try {
            data.questions = JSON.parse(cachedQuestionsStr);
          } catch (e) { }
        }

        if (!data.questions || data.questions.length === 0) {
          const category = mapAssessmentTypeToCategory(effectiveType);
          try {
            const qBank = await aiprepApi.getQuestions(category);
            if (qBank && qBank.length > 0) {
              data.questions = qBank.map((q, idx) => ({
                id: q.id,
                order_index: idx + 1,
                question_text: q.question_text,
                difficulty_level: (q.difficulty_level || 'MEDIUM') as any,
              }));
            }
          } catch (qErr) {
            console.warn('Backend question bank query error:', qErr);
          }
        }

        let questions = data.questions || [];
        if (questions.length === 0) {
          throw new Error('This assessment has no questions assigned. Please go back and start a new session.');
        }

        questions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        data.questions = questions;

        if (data.questions && data.questions.length > 0) {
          sessionStorage.setItem(`aiprep_session_questions_${assessmentId}`, JSON.stringify(data.questions));
        }

        setAssessment(data);
        const initialTime = getTimeLimit(effectiveType, questions[0]);
        setTimeLeft(initialTime);

        // Recover saved state
        const savedStateStr = sessionStorage.getItem(`aiprep_session_state_${assessmentId}`);
        if (savedStateStr) {
          try {
            const savedState = JSON.parse(savedStateStr);
            if (typeof savedState.currentQuestionIndex === 'number') {
              setCurrentQuestionIndex(savedState.currentQuestionIndex);
            }
            if (typeof savedState.timeLeft === 'number') {
              setTimeLeft(savedState.timeLeft);
            }
            if (savedState.hasStartedRecording) {
              autoStartRecordingRef.current = true;
            }
          } catch (e) { }
        }

        setTimeout(() => initMediaFeed(data.assessment_mode || resolvedMode), 100);
      } catch (err: any) {
        console.error('Failed to load assessment:', err);
        setErrorMsg(err.message || 'Failed to load assessment session from backend. Please check your network or backend connection.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAssessmentData();

    return () => {
      stopCameraFeed();
      stopTimer();
      stopSpeechRecognition();
    };
  }, [assessmentId]);

  // Save state to sessionStorage
  useEffect(() => {
    if (!assessmentId || !assessment || isLoading) return;
    const state = {
      currentQuestionIndex,
      timeLeft,
      hasStartedRecording: !isInactive,
    };
    sessionStorage.setItem(`aiprep_session_state_${assessmentId}`, JSON.stringify(state));
  }, [assessmentId, assessment, isLoading, currentQuestionIndex, timeLeft, isInactive]);

  // Real-time Voice Speech Recognition
  const accumulatedTranscriptRef = useRef<string>('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isRecording && !isPaused && !isAudioMuted) {
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognitionRef.current = recognition;

          recognition.onresult = (event: any) => {
            let currentText = '';
            for (let i = 0; i < event.results.length; i++) {
              currentText += event.results[i][0].transcript + ' ';
            }
            const fullCombined = (accumulatedTranscriptRef.current + ' ' + currentText).trim();
            if (fullCombined) {
              setLiveTranscript(fullCombined);
            }
          };

          recognition.onerror = (e: any) => console.warn('[Speech Rec Error]:', e.error);
          recognition.onend = () => {
            if (isRecording && !isPaused && !isAudioMuted && recognitionRef.current === recognition) {
              try { recognition.start(); } catch (err) { }
            }
          };

          recognition.start();
        } catch (err) { }
      }
    } else {
      stopSpeechRecognition();
    }

    return () => stopSpeechRecognition();
  }, [isRecording, isPaused, isAudioMuted]);

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) { }
      recognitionRef.current = null;
    }
  };

  // Timer
  useEffect(() => {
    if (isLoading || errorMsg || !assessment || isPaused || isInactive) {
      stopTimer();
      return;
    }
    startTimer();
    return () => stopTimer();
  }, [isLoading, errorMsg, assessment, isPaused, isInactive, currentQuestionIndex]);

  const getTimeLimit = (type: AssessmentType, question?: Question): number => {
    if (question && (question as any).time_limit_seconds) {
      return (question as any).time_limit_seconds;
    }
    if (question && question.difficulty_level) {
      return getDifficultySeconds(question.difficulty_level);
    }
    return getTimeLimitSeconds(type);
  };

  const startTimer = () => {
    stopTimer();
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const initMediaFeed = async (mode: AssessmentMode) => {
    try {
      stopCameraFeed();
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: mode === 'VIDEO_AUDIO' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      if (autoStartRecordingRef.current) {
        autoStartRecordingRef.current = false;
        setTimeout(() => {
          startRecording();
        }, 200);
      }
    } catch (err) {
      console.error('Failed to initialize media feed:', err);
    }
  };

  const stopCameraFeed = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleAudio = () => {
    const currentStream = streamRef.current || stream;
    if (currentStream) {
      const nextState = !isAudioMuted;
      currentStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
      setIsAudioMuted(nextState);
    }
  };

  const toggleVideo = () => {
    const currentStream = streamRef.current || stream;
    if (currentStream) {
      const nextState = !isVideoMuted;
      currentStream.getVideoTracks().forEach((track) => {
        track.enabled = !nextState;
      });
      setIsVideoMuted(nextState);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const questions = useMemo(() => assessment?.questions || [], [assessment]);
  const currentQuestion = questions[currentQuestionIndex] || null;
  const totalQuestions = questions.length || 8;

  const handleNextQuestion = () => {
    if (!assessment) return;

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setLiveTranscript('');
      accumulatedTranscriptRef.current = '';
    } else {
      handleEndSession();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleEndSession = async () => {
    if (!assessment) return;
    setIsEnding(true);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`aiprep_session_state_${assessment.id}`);
      sessionStorage.removeItem(`aiprep_session_questions_${assessment.id}`);
    }

    try {
      const finalCount = await stopRecording();
      stopCameraFeed();
      stopSpeechRecognition();
      const totalSlices = Math.max(1, finalCount || 1);

      // Fast non-blocking submission: trigger assembly in background task
      aiprepApi.assembleMedia(assessment.id, totalSlices).catch(e => console.warn('Async assembleMedia:', e));

      const embedQuery = isEmbedded ? '?embed=true' : '';
      router.push(`/aiprep${embedQuery}`);
    } catch (err: any) {
      console.error('Error ending assessment session:', err);
      stopCameraFeed();
      stopSpeechRecognition();
      router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep');
    } finally {
      setIsEnding(false);
    }
  };

  const formatTimerHeader = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')} : ${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  const formatMinSec = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] text-slate-700 flex flex-col items-center justify-center p-6 select-none">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
          <IconLoader2 size={24} className="animate-spin" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Loading Assessment Room</h2>
        <p className="text-slate-400 text-xs">Initializing video stage and question bank…</p>
      </div>
    );
  }

  // Question evaluations list based on question or defaults
  const evaluationCriteria = [
    "Your understanding of database concepts",
    "Ability to compare and contrast",
    "Clarity and structure of explanation",
    "Real-world examples"
  ];

  const isAudioOnly = assessment?.assessment_mode === 'AUDIO_ONLY' || queryMode === 'AUDIO_ONLY';

  return (
    <div className="h-screen max-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans select-none antialiased p-3 sm:p-4 lg:p-5 overflow-hidden">

      <div className="w-full mx-auto flex flex-col gap-3.5 h-full justify-between">

        {/* TOP NAVIGATION HEADER BAR */}
        <header className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-xs shrink-0">

          {/* Left: Title, Assessment Type, Questions Count & Status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Assessment Room</h1>

            {/* Particular Assessment Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[#5b5bd6] border border-indigo-100/90 text-xs font-extrabold uppercase tracking-wider">
              <IconCode size={13} />
              <span>{assessment?.assessment_type === 'TECHNICAL' ? 'Technical Interview' : assessment?.assessment_type?.replace(/_/g, ' ') || 'Technical Interview'}</span>
            </span>

            {/* Questions Count Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-bold">
              <IconHelpCircle size={13} className="text-[#5b5bd6]" />
              <span>{totalQuestions} Questions</span>
            </span>

            {/* Live Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isRecording ? 'Session in Progress' : 'Ready to Start'}</span>
            </div>
          </div>

          {/* Center: Sleek Timer Box */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-1.5 shadow-xs">
            <IconClock size={16} className="text-[#5b5bd6]" />
            <div className="flex flex-col items-center leading-none">
              <span className="font-mono text-lg font-extrabold text-slate-900 tracking-wider">
                {formatTimerHeader(timeLeft)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Time Remaining</span>
            </div>
          </div>

          {/* Right: Hardware Status Badges, View Instructions & End Session */}
          <div className="flex items-center gap-2">
            {isAudioMuted ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold animate-pulse">
                <IconMicrophoneOff size={13} className="text-rose-600" />
                <span>Mic Muted</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold">
                <IconMicrophone size={13} className="text-[#5b5bd6]" />
                <span>Mic On</span>
              </div>
            )}
            {!isAudioOnly && (
              isVideoMuted ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold animate-pulse">
                  <IconVideoOff size={13} className="text-rose-600" />
                  <span>Cam Off</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                  <IconVideo size={13} className="text-emerald-600" />
                  <span>Cam On</span>
                </div>
              )
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
              <IconWifi size={13} className="text-emerald-600" />
              <span>Good</span>
            </div>
            <button
              onClick={() => setShowInstructionsModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <IconInfoCircle size={14} className="text-[#5b5bd6]" />
              <span>Instructions</span>
            </button>
            <button
              onClick={() => setShowExitModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              End Session
            </button>
          </div>
        </header>

        {/* MAIN WORKSPACE GRID (STAGE + RIGHT SIDEBAR QUESTION PANEL) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1 min-h-0 overflow-hidden">

          {/* LEFT COLUMN (8 COLS): LARGE STAGE + TOOLBAR */}
          <div className="lg:col-span-8 flex flex-col gap-3 h-full justify-between min-h-0">

            {/* Stage Container */}
            <div className="relative w-full flex-1 min-h-[340px] max-h-[calc(100vh-210px)] bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center">

              {/* TOP-LEFT: Recording / Paused / Ready Status Badge */}
              {isPaused ? (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-amber-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/60 text-amber-300 text-xs font-semibold shadow-md animate-in fade-in duration-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span>Paused</span>
                </div>
              ) : isRecording ? (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-rose-500/50 text-white text-xs font-semibold shadow-md animate-in fade-in duration-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Recording</span>
                </div>
              ) : (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 text-slate-300 text-xs font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Ready</span>
                </div>
              )}

              {/* TOP CENTER: Mic Muted Validation Banner */}
              {isAudioMuted && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-rose-950/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-rose-500/80 text-rose-200 text-xs font-bold shadow-lg animate-in fade-in duration-200 select-none">
                  <IconAlertTriangle size={15} className="text-rose-400 shrink-0 animate-bounce" />
                  <span>Microphone Muted — Unmute to record response</span>
                </div>
              )}

              {/* TOP RIGHT: Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                <IconMaximize size={16} />
              </button>

              {/* VIDEO STREAM OR AUDIO WAVE ANIMATION */}
              {!isAudioOnly ? (
                <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`}
                  />
                  {isVideoMuted && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/95 text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
                        <IconVideoOff size={32} />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-sm font-bold text-slate-300">Camera Turned Off</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">Camera feed paused. Active webcam stream is required for video proctoring.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Audio Only Mode Stage Card */
                <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl animate-pulse">
                    <IconMicrophone size={38} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-200">Audio Assessment Mode</h3>
                    <p className="text-xs text-slate-400 mt-1">Speak into your microphone. Voice input is actively monitored.</p>
                  </div>
                </div>
              )}

              {/* IN-STAGE TELEMETRY OVERLAY BAR */}
              <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
                {/* Audio Level Equalizer Bar */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 rounded-lg py-1 px-3 flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400">Audio</span>
                  <div className="flex items-center gap-0.5 h-3">
                    {[40, 75, 50, 90, 60, 30, 80, 45, 100, 65, 35, 70, 55, 85, 40].map((h, i) => (
                      <span
                        key={i}
                        className={`w-0.5 rounded-full transition-all duration-150 ${isRecording && !isAudioMuted ? 'bg-emerald-400' : 'bg-slate-700'}`}
                        style={{ height: isRecording && !isAudioMuted ? `${h}%` : '20%' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Video Quality (Only in Video Mode) */}
                {!isAudioOnly && (
                  <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 rounded-lg py-1 px-2.5 flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400">Video</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Good</span>
                    </div>
                  </div>
                )}

                {/* Network */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 rounded-lg py-1 px-2.5 flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-400">Network</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <IconWifi size={12} className="text-emerald-400" />
                    <span>Stable</span>
                  </div>
                </div>

                {/* AI Monitor */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 rounded-lg py-1 px-2.5 flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-400">AI Monitor</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active</span>
                  </div>
                </div>
              </div>

              {/* YOLO Face Proctoring Integration */}
              {!isAudioOnly && assessment?.assessment_mode === 'VIDEO_AUDIO' && (
                <YOLOAnalyzer
                  videoRef={videoRef}
                  enabled={!isPaused && !isVideoMuted && Boolean(stream)}
                  assessmentId={assessment.id}
                />
              )}
            </div>



            {/* BOTTOM CONTROL TOOLBAR DOCK */}
            <div className={`grid ${isAudioOnly ? (!isInactive ? 'grid-cols-4' : 'grid-cols-3') : (!isInactive ? 'grid-cols-5' : 'grid-cols-4')} gap-2.5 sm:gap-3`}>
              <button
                onClick={toggleAudio}
                className={`py-3.5 px-3.5 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
                  isAudioMuted
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {isAudioMuted ? <IconMicrophoneOff size={18} /> : <IconMicrophone size={18} />}
                <span>{isAudioMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              {!isAudioOnly && (
                <button
                  onClick={toggleVideo}
                  className={`py-3.5 px-3.5 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
                    isVideoMuted
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {isVideoMuted ? <IconVideoOff size={18} /> : <IconVideo size={18} />}
                  <span>{isVideoMuted ? 'Start Video' : 'Stop Video'}</span>
                </button>
              )}

              {/* PAUSE / RESUME BUTTON (Hidden for GENERAL_INTRO & JOB_DESCRIPTION_INTRO) */}
              {!isInactive && !NO_PAUSE_ASSESSMENT_TYPES.includes(assessment?.assessment_type as any) && assessment?.assessment_type !== 'GENERAL_INTRO' && assessment?.assessment_type !== 'JOB_DESCRIPTION_INTRO' && (
                <button
                  onClick={handleTogglePause}
                  className={`py-3.5 px-3.5 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
                    isPaused
                      ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {isPaused ? <IconPlayerPlay size={18} className="fill-amber-600" /> : <IconPlayerPause size={18} />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
              )}

              {/* START ASSESSMENT / NEXT QUESTION BUTTON */}
              <button
                type="button"
                onClick={() => {
                  if (isInactive) {
                    startRecording();
                  } else {
                    handleNextQuestion();
                  }
                }}
                className="py-3.5 px-3.5 rounded-xl bg-[#5b5bd6] hover:bg-[#4d4dbf] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {isInactive ? <IconPlayerPlay size={18} className="fill-white shrink-0" /> : <IconChevronRight size={18} className="shrink-0" />}
                <span>
                  {isInactive
                    ? 'Start'
                    : currentQuestionIndex + 1 < totalQuestions
                    ? 'Next Question'
                    : 'Complete'}
                </span>
              </button>

              <button
                onClick={() => setShowExitModal(true)}
                className="py-3.5 px-3.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <IconLogout size={18} />
                <span>End Session</span>
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN (4 COLS SIDEBAR): COMPACT QUESTION & PROGRESS PANEL ON RIGHT SIDE */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full min-h-[440px] max-h-[calc(100vh-200px)] overflow-y-auto gap-3.5">

            {/* Header: Question Progress on Left & Category Badge + Nav Icons on Right */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight shrink-0">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </h2>

              <div className="flex items-center gap-1.5">
                {/* Category Badge on Right */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-[#5b5bd6] border border-indigo-100/80 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  <span>{assessment?.assessment_type?.replace(/_/g, ' ') || 'Technical'}</span>
                </span>

                {/* Nav Prev / Next buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="w-6 h-6 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shadow-2xs"
                    title="Previous Question"
                  >
                    <IconChevronLeft size={14} />
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex + 1 >= totalQuestions}
                    className="w-6 h-6 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shadow-2xs"
                    title="Next Question"
                  >
                    <IconChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* 1. QUESTION PROMPT FIRST */}
            <div className="py-1">
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {currentQuestion?.question_text || "Explain the differences between SQL and NoSQL databases. When would you choose one over the other? Provide examples."}
              </p>
            </div>

            {/* 2. REAL-TIME SPEECH TRANSCRIPT SECOND (White theme with stylish glowing gradient icon - Increased Height) */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-sm flex-1 flex flex-col justify-between min-h-[170px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-gradient-to-tr from-[#5b5bd6] to-indigo-500 text-white shadow-sm flex items-center justify-center border border-indigo-400/30">
                    <IconMicrophone size={14} className="text-white animate-pulse" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Real-Time Voice Transcript</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-extrabold text-[#5b5bd6] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/90">
                    <IconSparkles size={10} className="text-[#5b5bd6]" />
                    AI STT
                  </span>
                </div>
                {isRecording && !isPaused && !isAudioMuted ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Listening
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Standby</span>
                )}
              </div>
              <div className="min-h-[130px] max-h-[210px] flex-1 overflow-y-auto text-xs font-medium leading-relaxed bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 text-slate-800 shadow-inner select-text">
                {liveTranscript ? (
                  <span className="text-slate-900 font-sans">{liveTranscript}</span>
                ) : (
                  <span className="text-slate-400 italic text-xs font-sans">
                    {isRecording
                      ? 'Listening for your voice… Speak clearly into your microphone.'
                      : 'Click "Start" below and speak into your microphone to view your real-time transcript.'}
                  </span>
                )}
              </div>
            </div>

            {/* 3. RESPONSE TIME CARD THIRD */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <IconClock size={15} className="text-[#5b5bd6]" />
                  <span>Response Time</span>
                </span>
                <span className="font-mono text-slate-900 font-bold">{formatMinSec(elapsedSeconds)}</span>
              </div>
              <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5b5bd6] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((elapsedSeconds / getTimeLimit(assessment?.assessment_type || 'TECHNICAL', currentQuestion)) * 100))}%`
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-0.5">
                <span>Min 0:00</span>
                <span>Max {formatMinSec(getTimeLimit(assessment?.assessment_type || 'TECHNICAL', currentQuestion))}</span>
              </div>
            </div>



            {/* ACTION BUTTONS */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>Skip Question</span>
                <IconPlayerSkipForward size={14} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW INSTRUCTIONS MODAL */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <IconInfoCircle className="text-indigo-600" size={20} />
                <span>Assessment Instructions</span>
              </h3>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>• Ensure your webcam and microphone stay active throughout the entire session.</p>
              <p>• Each question has a recommended response time. Speak clearly and structure your explanation.</p>
              <p>• Your video and audio slices are securely uploaded and evaluated by AI proctoring.</p>
              <p>• You can take notes in the optional text box on the right during your answer.</p>
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* EXIT CONFIRMATION MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <IconAlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">End Assessment Session?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to end this assessment session? Your progress will be saved as-is.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCameraFeed();
                  stopTimer();
                  stopSpeechRecognition();
                  router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep');
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-colors"
              >
                Yes, End Session
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
