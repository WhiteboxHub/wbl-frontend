/**
 * Active Assessment Session Room Page
 * 
 * Target Workspace: wbl-frontend
 * Route: /aiprep/session/[assessmentId]
 * Primary Developer: Narasimha (FE1)
 * 
 * Space-Optimized Studio Layout:
 * - Audio Equalizer embedded as an in-video floating glass pill overlay (ZERO separate vertical space)
 * - Expanded Cinema-Grade Camera Stage with Max Screen Coverage
 * - Unified AI Studio Intelligence Panel on Right
 * - Floating Circular Meeting Dock
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { aiprepApi, Assessment, Question, AssessmentType, AssessmentMode, NO_PAUSE_ASSESSMENT_TYPES, QuestionCategory } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { QuestionDisplay } from '@/components/aiprep/QuestionDisplay';
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
  IconLogout,
  IconClock,
  IconCircleCheck,
  IconAlertTriangle,
  IconLoader2,
  IconMessage2,
  IconInfoCircle,
  IconVolume,
  IconCameraOff,
  IconWaveSine,
  IconDeviceLaptop,
  IconSparkles
} from '@tabler/icons-react';

/**
 * Compact Floating Audio Waveform Equalizer (Embedded in Camera Overlay)
 */
const EmbeddedAudioWaveform = memo(({ stream, isMuted }: { stream: MediaStream | null; isMuted: boolean }) => {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(24).fill(3));
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
      setAudioLevels(Array(24).fill(3));
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
          for (let i = 0; i < 24; i++) {
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

  if (isMuted) return null;

  return (
    <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-full backdrop-blur-xl shadow-lg">
      <IconMicrophone size={14} stroke={2} className="text-emerald-400 shrink-0" />
      <div className="flex items-center gap-[2.5px] h-4 overflow-hidden">
        {audioLevels.map((height, i) => (
          <div
            key={i}
            style={{ height: `${height}px` }}
            className="w-[2.5px] rounded-full bg-gradient-to-t from-indigo-400 via-purple-400 to-cyan-300 shrink-0 transition-all duration-75"
          />
        ))}
      </div>
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
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Embedded detection
  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    const embedded = window.self !== window.top || window.location.search.includes('embed=true');
    setIsEmbedded(embedded);
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hardwareError, setHardwareError] = useState<string | null>(null);

  // Hardware Controls (Audio / Video Mute states)
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);

  // Live Speech Recognition Transcript State
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Exit modal state
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Hook 1: Upload Queue Manager
  const { state: uploadState, enqueueChunk, retryFailedChunks, waitForAllUploads } =
    useChunkUploadQueue({
      assessmentId: assessmentId || 0,
      onError: (err) => console.error(`Sync error: ${err.message}`),
    });

  // Hook 2: MediaRecorder Engine (30s chunking)
  const {
    recordingState,
    elapsedSeconds,
    chunkCount,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useMediaRecorder({
    stream,
    mode: assessment?.assessment_mode || 'VIDEO_AUDIO',
    chunkDurationMs: 30000,
    onChunkReady: (chunkBlob, chunkNumber) => {
      console.log(`[Media Pipeline] Secured 30s media slice #${chunkNumber + 1} (${Math.round(chunkBlob.size / 1024)} KB)`);
      enqueueChunk(chunkBlob, chunkNumber);
    },
    onError: (err) => console.error(`[Recorder Error]: ${err.message}`),
    onDeviceDisconnected: () => console.warn('Hardware audio/video input disconnected.'),
  });

  const isPaused = recordingState === 'paused';
  const isRecording = recordingState === 'recording';
  const isInactive = recordingState === 'inactive';

  // Video / Audio hardware refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Assessment metadata
  useEffect(() => {
    if (!assessmentId) return;

    async function fetchAssessmentData() {
      try {
        setIsLoading(true);
        const isMockMode = typeof window !== 'undefined' && (window.location.search.includes('mock=true') || (!localStorage.getItem('token') && !localStorage.getItem('access_token')));

        if (isMockMode) {
          let candidateId = 7;
          try {
            const userResponse = await apiFetch("user_dashboard");
            if (userResponse?.candidate_id) {
              candidateId = userResponse.candidate_id;
            }
          } catch (profileErr) {
            console.error("Failed to retrieve candidateId, falling back to 7", profileErr);
          }

          const resolvedType = queryType || 'TECHNICAL';
          const resolvedMode = queryMode || 'VIDEO_AUDIO';

          const mockAssessment: Assessment = {
            id: assessmentId,
            candidate_id: candidateId,
            assessment_type: resolvedType,
            assessment_mode: resolvedMode,
            status: 'IN_PROGRESS',
            attempt_number: 1,
            created_at: new Date().toISOString(),
            questions: []
          };
          setAssessment(mockAssessment);
          setTimeLeft(getTimeLimit(resolvedType));
          setTimeout(() => initMediaFeed(resolvedMode), 100);
          setIsLoading(false);
          return;
        }

        const data = await aiprepApi.getAssessment(assessmentId);

        // Populate questions from backend bank if session list is empty
        if (!data.questions || data.questions.length === 0) {
          try {
            const category = mapAssessmentTypeToCategory(data.assessment_type);
            const qBank = await aiprepApi.getQuestions(category);
            if (qBank && qBank.length > 0) {
              data.questions = qBank.map((q, idx) => ({
                id: q.id,
                order_index: idx + 1,
                question_text: q.question_text,
                difficulty_level: q.difficulty_level,
              }));
            } else {
              data.questions = [];
            }
          } catch (qErr) {
            console.error('Failed to load questions from backend question bank API:', qErr);
            data.questions = [];
          }
        }

        setAssessment(data);

        // Initialize time limits based on type
        const initialTime = getTimeLimit(data.assessment_type);
        setTimeLeft(initialTime);

        // Start device feed
        setTimeout(() => initMediaFeed(data.assessment_mode), 100);
      } catch (err: any) {
        console.warn('Error fetching assessment info, falling back to mock assessment:', err);
        let candidateId = 7;
        try {
          const userResponse = await apiFetch("user_dashboard");
          if (userResponse?.candidate_id) {
            candidateId = userResponse.candidate_id;
          }
        } catch { }

        const resolvedType = queryType || 'TECHNICAL';
        const resolvedMode = queryMode || 'VIDEO_AUDIO';

        const mockAssessment: Assessment = {
          id: assessmentId,
          candidate_id: candidateId,
          assessment_type: resolvedType,
          assessment_mode: resolvedMode,
          status: 'IN_PROGRESS',
          attempt_number: 1,
          created_at: new Date().toISOString(),
          questions: []
        };
        setAssessment(mockAssessment);
        setTimeLeft(getTimeLimit(resolvedType));
        setTimeout(() => initMediaFeed(resolvedMode), 100);
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

  // Live Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    if (isRecording && !isPaused && !isAudioMuted) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript + ' ';
          }
          setLiveTranscript(fullText.trim());

          if (transcriptScrollRef.current) {
            transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error !== 'no-speech' && e.error !== 'aborted') {
            console.warn('[Speech Recognition]:', e.error);
          }
        };

        recognition.onend = () => {
          if (isRecording && !isPaused && !isAudioMuted && recognitionRef.current) {
            try { recognition.start(); } catch (err) { }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
      }
    } else {
      stopSpeechRecognition();
    }

    return () => {
      stopSpeechRecognition();
    };
  }, [isRecording, isPaused, isAudioMuted, currentQuestionIndex]);

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) { }
      recognitionRef.current = null;
    }
  };

  // Countdown timer
  useEffect(() => {
    if (isLoading || errorMsg || !assessment || isPaused || isInactive) {
      stopTimer();
      return;
    }

    startTimer();

    return () => stopTimer();
  }, [isLoading, errorMsg, assessment, isPaused, isInactive, currentQuestionIndex]);

  const getTimeLimit = (type: AssessmentType): number => {
    switch (type) {
      case 'GENERAL_INTRO':
      case 'JOB_DESCRIPTION_INTRO':
        return 90;
      case 'RECRUITER':
        return 120;
      case 'HIRING_MANAGER':
        return 180;
      case 'TECHNICAL':
        return 240;
      case 'SYSTEM_DESIGN':
        return 300;
      case 'HR':
        return 180;
      default:
        return 90;
    }
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

      // Attach disconnection listeners to audio track
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.onended = () => {
          console.error("Audio track ended! Headset/mic disconnected.");
          setHardwareError("Audio Disconnected! Your microphone or headset was unplugged. Please reconnect your audio device to continue.");
          pauseRecording();
        };
        audioTrack.onmute = () => {
          console.warn("Audio track muted.");
          setHardwareError("Audio Input Muted! Connection to your microphone was lost. Please reconnect your audio device.");
          pauseRecording();
        };
        audioTrack.onunmute = () => {
          setHardwareError(null);
        };
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn('Video play caught:', e));
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

  // Toggle Audio (Mic) Mute
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

  // Toggle Video (Camera) On/Off
  const toggleVideo = () => {
    const currentStream = streamRef.current || stream;
    if (currentStream) {
      const nextState = !isVideoMuted;
      currentStream.getVideoTracks().forEach((track) => {
        track.enabled = !nextState;
      });
      setIsVideoMuted(nextState);

      if (videoRef.current && currentStream) {
        if (!videoRef.current.srcObject) {
          videoRef.current.srcObject = currentStream;
        }
        videoRef.current.play().catch(() => { });
      }
    }
  };

  const questionsList = useMemo(() => {
    return assessment?.questions || [];
  }, [assessment]);

  const totalQuestions = questionsList.length;

  const handleNextQuestion = () => {
    if (!assessment) return;

    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(getTimeLimit(assessment.assessment_type));
      setLiveTranscript('');
    } else {
      handleEndSession();
    }
  };

  const handleEndSession = async () => {
    if (!assessment) return;
    setIsEnding(true);

    try {
      const isMockMode = typeof window !== 'undefined' && (window.location.search.includes('mock=true') || (!localStorage.getItem('token') && !localStorage.getItem('access_token')));

      if (isMockMode) {
        setTimeout(() => {
          const embedQuery = isEmbedded ? '&embed=true' : '';
          router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep');
        }, 1200);
        return;
      }

      await stopRecording();
      await waitForAllUploads();
      await aiprepApi.assembleMedia(assessment.id, chunkCount);
      await aiprepApi.updateAssessmentStatus(assessment.id, 'COMPLETED');
      stopCameraFeed();
      stopSpeechRecognition();
      const embedQuery = isEmbedded ? '?embed=true' : '';
      router.push(`/aiprep/session/${assessment.id}/processing${embedQuery}`);
    } catch (err: any) {
      console.warn('Error ending assessment session on backend. Falling back to mock processing:', err);
      stopCameraFeed();
      stopSpeechRecognition();
      const embedQuery = isEmbedded ? '&embed=true' : '';
      router.push(`/aiprep/session/${assessment.id}/processing?mock=true${embedQuery}`);
    } finally {
      setIsEnding(false);
    }
  };

  const handleStartOrPause = () => {
    if (isInactive) {
      startRecording();
      return;
    }

    if (!assessment) return;
    const pauseAllowed = !NO_PAUSE_ASSESSMENT_TYPES.includes(assessment.assessment_type);
    if (!pauseAllowed) return;

    if (recordingState === 'recording') {
      pauseRecording();
    } else if (recordingState === 'paused') {
      resumeRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#090d16] text-slate-200 flex flex-col items-center justify-center p-6 select-none overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
          <IconLoader2 size={24} className="animate-spin" />
        </div>
        <h2 className="text-sm font-semibold text-slate-100 mb-1">Connecting to Practice Room</h2>
        <p className="text-slate-400 text-xs">Calibrating camera feed and questions…</p>
      </div>
    );
  }

  if (errorMsg || !assessment) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-500">
          <IconAlertTriangle size={24} className="animate-bounce" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Session Room Error</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto mb-5 leading-relaxed">{errorMsg || 'Assessment details could not be loaded.'}</p>
        <button
          onClick={() => router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-medium text-xs shadow-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isPauseDisabled = NO_PAUSE_ASSESSMENT_TYPES.includes(assessment.assessment_type);
  const activeQuestion = questionsList[currentQuestionIndex] || null;
  const wordCount = liveTranscript ? liveTranscript.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="h-screen max-h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col justify-between p-3 sm:p-4 md:p-5 transition-colors duration-300 select-none">

      <div className="max-w-[1650px] w-full h-full mx-auto flex flex-col justify-between gap-3">

        {/* TOP HEADER: Centered Title + Cloud Sync & Theme Toggler */}
        <header className="relative w-full flex items-center justify-between pb-0.5 shrink-0">

          {/* Left: Mode Chip */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              <IconDeviceLaptop size={14} stroke={2} />
              <span>Practice Mode</span>
            </div>
          </div>

          {/* CENTER: Clean Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest text-center">
              {assessment.assessment_type === 'GENERAL_INTRO' ? 'GENERAL INTRODUCTION' : assessment.assessment_type.replace(/_/g, ' ')} PRACTICE ROOM
            </h1>
          </div>

          {/* Right: Cloud Sync Uploader */}
          <div className="flex items-center gap-3">
            <ChunkedUploader uploadState={uploadState} onRetryFailed={retryFailedChunks} compact={true} isRecording={isRecording} />
          </div>
        </header>

        {/* 1. TOP TELEPROMPTER BANNER */}
        {activeQuestion && (
          <QuestionDisplay
            question={activeQuestion}
            currentIndex={currentQuestionIndex}
            totalCount={totalQuestions}
            category={assessment.assessment_type}
          />
        )}

        {/* 2. MAIN WORKSPACE SPLIT (Left 73% Broad Video Stage | Right 27% Unified Studio Assistant) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3.5 items-stretch justify-between min-h-0">

          {/* LEFT COLUMN (73% Width): Expanded Camera Stage + Controls (NO separate equalizer space) */}
          <div className="w-full lg:w-[73%] xl:w-[74%] flex flex-col justify-between gap-3 min-h-0">

            {/* Expanded Cinematic Camera Stage (Equalizer embedded inside as floating pill) */}
            <div className="relative w-full flex-1 min-h-[290px] max-h-[440px] bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl">

              {/* Always-Mounted Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${assessment.assessment_mode === 'VIDEO_AUDIO' && !isVideoMuted ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
              />

              {/* Camera Disabled Placeholder */}
              {(assessment.assessment_mode === 'AUDIO_ONLY' || isVideoMuted) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-slate-400 bg-slate-950">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                    <IconCameraOff size={28} stroke={1.5} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-300">Live Camera Feed Muted</span>
                </div>
              )}

              {/* TOP-LEFT Live Recording Status Dot */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 text-xs font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-xl shadow-lg">
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400 animate-pulse' : isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                  }`} />
                <span className={isPaused ? 'text-amber-300' : isRecording ? 'text-rose-400' : 'text-slate-300'}>
                  {isPaused ? 'PAUSED' : isRecording ? 'RECORDING' : 'STANDBY'}
                </span>
                <span className="font-mono text-xs text-slate-400 ml-1">({formatTime(elapsedSeconds)})</span>
              </div>

              {/* BOTTOM-LEFT: Embedded In-Video Audio Equalizer (Zero separate height occupied) */}
              <div className="absolute bottom-3 left-3 z-20">
                <EmbeddedAudioWaveform stream={stream} isMuted={isAudioMuted || isPaused || isInactive} />
              </div>

              {/* BOTTOM-RIGHT Chunk Sync Badge */}
              <div className="absolute bottom-3 right-3 z-20 font-mono text-xs text-slate-300 bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-xl backdrop-blur-xl shadow-lg">
                {uploadState.isUploading ? (
                  <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                    <IconLoader2 size={14} className="animate-spin text-indigo-400" />
                    Chunk {uploadState.queue.length} uploading…
                  </span>
                ) : uploadState.totalUploaded > 0 ? (
                  <span className="text-emerald-400 font-medium">Chunk {uploadState.totalUploaded} synced</span>
                ) : (
                  <span className="text-slate-400">Sync: 30s</span>
                )}
              </div>

              {/* YOLO Face Proctoring Analyzer */}
              {assessment.assessment_mode === 'VIDEO_AUDIO' && (
                <YOLOAnalyzer
                  videoRef={videoRef}
                  enabled={!isPaused && !isVideoMuted && Boolean(stream)}
                  assessmentId={assessment.id}
                />
              )}
            </div>

            {/* 2026 FLOATING GLASS MEETING TOOLBAR */}
            <div className="w-full flex items-center justify-center shrink-0">
              <div className="flex items-center justify-center gap-3 px-5 py-2 rounded-full bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-indigo-500/5">

                {/* 1. Mute Mic */}
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${isAudioMuted
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400'
                    }`}
                  title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isAudioMuted ? <IconMicrophoneOff size={20} stroke={2} /> : <IconMicrophone size={20} stroke={2} />}
                </button>

                {/* 2. Stop Camera */}
                {assessment.assessment_mode === 'VIDEO_AUDIO' && (
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${isVideoMuted
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400'
                      }`}
                    title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isVideoMuted ? <IconVideoOff size={20} stroke={2} /> : <IconVideo size={20} stroke={2} />}
                  </button>
                )}

                {/* 3. Start Answer OR Pause / Resume Pill */}
                {isInactive ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="h-11 px-6 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <IconPlayerPlay size={18} stroke={2} fill="currentColor" />
                    <span>Start Answer</span>
                  </button>
                ) : !isPauseDisabled ? (
                  <button
                    type="button"
                    onClick={handleStartOrPause}
                    className={`h-11 px-5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${isPaused
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                  >
                    {isPaused ? (
                      <>
                        <IconPlayerPlay size={18} stroke={2} fill="currentColor" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <IconPlayerPause size={18} stroke={2} />
                        <span>Pause</span>
                      </>
                    )}
                  </button>
                ) : null}

                {/* 4. Quit Button */}
                <button
                  type="button"
                  onClick={() => setShowExitModal(true)}
                  className="w-11 h-11 rounded-full bg-rose-500/15 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                  title="Quit Assessment"
                >
                  <IconLogout size={20} stroke={2} />
                </button>
              </div>
            </div>

            {/* Hardware Warnings (if muted) */}
            {(isAudioMuted || isVideoMuted) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 shrink-0">
                {isAudioMuted && (
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20 text-xs font-medium backdrop-blur-md">
                    <IconInfoCircle size={15} stroke={2} className="shrink-0 text-rose-500" />
                    <span>Microphone muted — Click mic icon above to un-mute.</span>
                  </div>
                )}
                {isVideoMuted && (
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 text-xs font-medium backdrop-blur-md">
                    <IconInfoCircle size={15} stroke={2} className="shrink-0 text-amber-500" />
                    <span>Camera off — Click video icon above to turn on.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (26% Width): UNIFIED STUDIO INTELLIGENCE PANEL */}
          <div className="w-full lg:w-[27%] xl:w-[26%] flex flex-col justify-between h-full min-h-0 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 shadow-xl shadow-indigo-500/5">

            {/* 1. Panel Header: Integrated Timer & Transcribe Status */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-500">
                  <IconClock size={18} stroke={2.2} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">Time Left</span>
                  <span className="font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {isRecording && !isPaused && !isAudioMuted ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Transcribing</span>
                </div>
              ) : (
                <div className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isInactive ? 'Standby' : isPaused ? 'Paused' : isAudioMuted ? 'Muted' : 'Idle'}
                </div>
              )}
            </div>

            {/* 2. Direct Smooth Streaming Transcription Stream */}
            <div
              ref={transcriptScrollRef}
              className="flex-1 min-h-[160px] my-3 overflow-y-auto scroll-smooth pr-1 flex flex-col justify-start"
            >
              {liveTranscript ? (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    <IconSparkles size={13} stroke={2.2} />
                    <span>Real-Time Speech</span>
                  </div>
                  <p className="text-sm font-normal leading-relaxed text-slate-800 dark:text-slate-200 select-text whitespace-pre-wrap">
                    {liveTranscript}
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-slate-400 py-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-500/80">
                    <IconMessage2 size={22} stroke={1.8} className="animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isInactive ? 'Ready to Start' : 'Listening for Answer...'}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-[190px] leading-snug">
                      {isInactive ? 'Click "Start Answer" when you are ready.' : 'Speak into your microphone to view live transcript.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Panel Bottom: Word Counter & Next Action */}
            <div className="space-y-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{wordCount} words spoken</span>
                <span>Auto Sync: 30s</span>
              </div>

              {currentQuestionIndex + 1 < totalQuestions ? (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:scale-[1.01] active:scale-98 transition-all duration-200"
                >
                  <span>Next Question</span>
                  <IconChevronRight size={18} stroke={2.5} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEndSession}
                  disabled={isEnding}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 hover:shadow-lg hover:scale-[1.01] active:scale-98 transition-all duration-200"
                >
                  {isEnding ? <IconLoader2 size={18} className="animate-spin" /> : <IconCircleCheck size={18} stroke={2.5} />}
                  <span>{isEnding ? 'Assembling…' : 'Submit Assessment'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <IconAlertTriangle size={26} stroke={2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quit Assessment?</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to leave this session? Your current progress and recorded slices will be discarded.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors"
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
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-rose-600/30 transition-colors"
              >
                Yes, Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
