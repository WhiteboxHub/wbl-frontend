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
  IconVolumeOff,
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

  // Route Security Guard: Ensure candidate is logged in using existing apiFetch helper
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
  const [hardwareError, setHardwareError] = useState<string | null>(null);

  // Hardware Controls (Audio / Video Mute states)
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);

  // Live Speech Recognition Transcript State
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);
  const autoStartRecordingRef = useRef<boolean>(false);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Exit modal state
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Hook 1: Upload Queue Manager
  const { state: uploadState, enqueueChunk, retryFailedChunks, waitForAllUploads } =
    useChunkUploadQueue({
      assessmentId: assessment?.id || assessmentId || 0,
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

  // Pasted JD text state for JOB_DESCRIPTION_INTRO
  const [jdTextFromSession, setJdTextFromSession] = useState<string>('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const text = sessionStorage.getItem('aiprep_jd_text') || '';
      setJdTextFromSession(text);
    }
  }, []);

  // Stage Phase: 'AI_INTRO' (Screen with AI Interviewer speaking) -> 'PRACTICE_ROOM' (Camera stage & timer)
  const [stagePhase, setStagePhase] = useState<'AI_INTRO' | 'PRACTICE_ROOM'>('PRACTICE_ROOM');
  const [aiIntroTimer, setAiIntroTimer] = useState<number>(4);

  // Web Speech Synthesis (AI Voice) State & Helpers
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isSpeechMuted, setIsSpeechMuted] = useState<boolean>(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopAiSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) { }
    }
    setIsAiSpeaking(false);
  };



  // Voice caching ref to lock 1 single consistent voice across all questions and page refreshes
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const getBestConsistentVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    if (selectedVoiceRef.current) return selectedVoiceRef.current;

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const voice =
      voices.find((v) => v.name.includes('Google US English')) ||
      voices.find((v) => v.name.includes('Google') && v.lang === 'en-US') ||
      voices.find((v) => v.name.includes('Natural') && v.lang.startsWith('en')) ||
      voices.find((v) => v.name.includes('Samantha') && v.lang.startsWith('en')) ||
      voices.find((v) => v.name.includes('Zira') && v.lang.startsWith('en')) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0] || null;

    if (voice) {
      selectedVoiceRef.current = voice;
    }
    return voice;
  };

  // Pre-load voices on mount to avoid async voice switching delays
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const load = () => {
        getBestConsistentVoice();
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  const speakAiText = (text: string, onComplete?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isSpeechMuted) {
      if (onComplete) onComplete();
      return;
    }

    stopAiSpeech();

    try {
      const cleanText = text.replace(/^"|"$/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      speechUtteranceRef.current = utterance;

      const chosenVoice = getBestConsistentVoice();
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => {
        setIsAiSpeaking(false);
        if (onComplete) onComplete();
      };
      utterance.onerror = () => {
        setIsAiSpeaking(false);
        if (onComplete) onComplete();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsAiSpeaking(false);
      if (onComplete) onComplete();
    }
  };

  const toggleAiSpeechMute = () => {
    if (isAiSpeaking) {
      stopAiSpeech();
      setIsSpeechMuted(true);
    } else {
      setIsSpeechMuted(false);
      if (currentQuestion?.question_text) {
        speakAiText(currentQuestion.question_text);
      }
    }
  };

  // 3-2-1 Countdown state & auto-recording trigger
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const hasRunCountdownRef = useRef<boolean>(false);

  const isIntroType = assessment?.assessment_type === 'GENERAL_INTRO' || assessment?.assessment_type === 'JOB_DESCRIPTION_INTRO';

  const handleSkipIntro = () => {
    stopAiSpeech();
    setStagePhase('PRACTICE_ROOM');
  };

  useEffect(() => {
    if (stagePhase === 'AI_INTRO' && !isLoading && assessment) {
      const promptText = currentQuestion?.question_text;

      // Auto-trigger full AI voice reading on mount if question text exists
      if (promptText) {
        speakAiText(promptText, () => {
          // Once speech finishes completely, give 1.5s pause then transition smoothly
          setTimeout(() => {
            stopAiSpeech();
            setStagePhase('PRACTICE_ROOM');
          }, 1500);
        });
      }

      // Synchronized countdown timer for visual feedback
      const timer = setInterval(() => {
        setAiIntroTimer((prev) => {
          if (prev <= 1) {
            // Only transition if speech is not actively speaking
            if (typeof window !== 'undefined' && window.speechSynthesis && !window.speechSynthesis.speaking) {
              clearInterval(timer);
              stopAiSpeech();
              setStagePhase('PRACTICE_ROOM');
              return 0;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        stopAiSpeech();
      };
    }
  }, [stagePhase, isLoading, assessment]);

  // Auto-read question text using AI voice when currentQuestionIndex changes in PRACTICE_ROOM
  useEffect(() => {
    const qList = assessment?.questions || [];
    if (stagePhase === 'PRACTICE_ROOM' && !isIntroType && qList[currentQuestionIndex]) {
      const qText = qList[currentQuestionIndex].question_text;
      speakAiText(qText);
    }
  }, [currentQuestionIndex, stagePhase, isIntroType, assessment]);

  useEffect(() => {
    if (stream && isIntroType && stagePhase === 'PRACTICE_ROOM' && !hasRunCountdownRef.current && isInactive) {
      hasRunCountdownRef.current = true;
      setCountdownValue(5);

      const interval = setInterval(() => {
        setCountdownValue((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            startRecording();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [stream, isIntroType, stagePhase, isInactive, startRecording]);

  // Fetch Assessment metadata and questions dynamically strictly via Backend API
  useEffect(() => {
    if (!assessmentId) return;

    async function fetchAssessmentData() {
      try {
        setIsLoading(true);
        const resolvedType = queryType || 'TECHNICAL';
        const resolvedMode = queryMode || 'VIDEO_AUDIO';

        // 1. Fetch Assessment record from Backend API
        const data = await aiprepApi.getAssessment(assessmentId);
        const effectiveType = data.assessment_type || resolvedType;
        const isIntro = effectiveType === 'GENERAL_INTRO' || effectiveType === 'JOB_DESCRIPTION_INTRO';

        // 1. Check if questions are already cached in sessionStorage for this session
        const cachedQuestionsStr = sessionStorage.getItem(`aiprep_session_questions_${assessmentId}`);
        if (cachedQuestionsStr) {
          try {
            data.questions = JSON.parse(cachedQuestionsStr);
          } catch (e) { }
        }

        // 2. Load questions from DB if not populated on assessment record or cached
        if (!data.questions || data.questions.length === 0) {
          const category = mapAssessmentTypeToCategory(effectiveType);
          try {
            const qBank = await aiprepApi.getQuestions(category);
            if (qBank && qBank.length > 0) {
              data.questions = qBank.map((q, idx) => ({
                id: q.id,
                order_index: idx + 1,
                question_text: q.question_text,
                difficulty_level: q.difficulty_level || 'EASY',
              }));
            }
          } catch (qErr) {
            console.warn('Backend question bank query error:', qErr);
          }
        }

        // Ensure deterministic order by order_index
        if (data.questions && data.questions.length > 0) {
          data.questions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        }

        // Limit intro rooms to 1 single DB question
        if (isIntro && data.questions && data.questions.length > 0) {
          data.questions = [data.questions[0]];
        }

        // Cache questions in sessionStorage to lock exact question order on page refresh
        if (data.questions && data.questions.length > 0) {
          sessionStorage.setItem(`aiprep_session_questions_${assessmentId}`, JSON.stringify(data.questions));
        }

        setAssessment(data);
        const initialTime = getTimeLimit(effectiveType);
        setTimeLeft(initialTime);

        // Recover state if available (locks exact currentQuestionIndex and timer)
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
            if (savedState.stagePhase) {
              setStagePhase(savedState.stagePhase);
            }
            if (savedState.hasStartedRecording) {
              autoStartRecordingRef.current = true;
            }
          } catch (e) {
            console.warn('Failed to parse saved session state:', e);
          }
        }

        setTimeout(() => initMediaFeed(data.assessment_mode || resolvedMode), 100);
      } catch (err: any) {
        console.warn('Backend assessment fetch error, querying backend questions API directly:', err);
        let candidateId: number | undefined = undefined;
        try {
          const userResponse = await apiFetch("user_dashboard");
          if (userResponse?.candidate_id) {
            candidateId = userResponse.candidate_id;
          }
        } catch { }

        const resolvedType = queryType || 'TECHNICAL';
        const resolvedMode = queryMode || 'VIDEO_AUDIO';
        const category = mapAssessmentTypeToCategory(resolvedType);

        let loadedQuestions: Question[] = [];
        try {
          const qBank = await aiprepApi.getQuestions(category);
          if (qBank && qBank.length > 0) {
            const categoryQuestions = qBank.filter((q: any) => !q.category || q.category === category);
            loadedQuestions = categoryQuestions.map((q, idx) => ({
              id: q.id,
              order_index: idx + 1,
              question_text: q.question_text,
              difficulty_level: q.difficulty_level,
            }));
          }
        } catch (e) { }

        const fallbackAssessment: Assessment = {
          id: assessmentId,
          candidate_id: candidateId,
          assessment_type: resolvedType,
          assessment_mode: resolvedMode,
          status: 'IN_PROGRESS',
          attempt_number: 1,
          created_at: new Date().toISOString(),
          questions: loadedQuestions
        };
        setAssessment(fallbackAssessment);
        setTimeLeft(getTimeLimit(resolvedType));

        // Recover state if available
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
            if (savedState.stagePhase) {
              setStagePhase(savedState.stagePhase);
            }
            if (savedState.hasStartedRecording) {
              autoStartRecordingRef.current = true;
            }
          } catch (e) {
            console.warn('Failed to parse saved session state:', e);
          }
        }

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

  // Save session state to survive page refresh
  useEffect(() => {
    if (!assessmentId || !assessment || isLoading) return;

    const state = {
      currentQuestionIndex,
      stagePhase,
      timeLeft,
      hasStartedRecording: !isInactive,
    };
    sessionStorage.setItem(`aiprep_session_state_${assessmentId}`, JSON.stringify(state));
  }, [assessmentId, assessment, isLoading, currentQuestionIndex, stagePhase, timeLeft, isInactive]);

  // Auto-resume recording if recovered from refresh
  useEffect(() => {
    if (stream && autoStartRecordingRef.current && isInactive) {
      autoStartRecordingRef.current = false;
      hasRunCountdownRef.current = true;
      startRecording();
    }
  }, [stream, isInactive, startRecording]);

  // Live Speech Recognition + Audio Activity Transcriber Fallback
  const accumulatedTranscriptRef = useRef<string>('');
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

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

            if (transcriptScrollRef.current) {
              transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('[Speech Recognition Error]:', e.error);
          };

          recognition.onend = () => {
            setLiveTranscript((prev) => {
              if (prev) accumulatedTranscriptRef.current = prev;
              return prev;
            });
            if (isRecording && !isPaused && !isAudioMuted && recognitionRef.current === recognition) {
              try { recognition.start(); } catch (err) { }
            }
          };

          recognition.start();
        } catch (err) {
          console.warn('[Speech Recognition Start Error]:', err);
        }
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

  // Auto-bind media stream to HTML <video> element whenever stream or videoRef mounts
  useEffect(() => {
    const activeStream = streamRef.current || stream;
    if (activeStream && videoRef.current) {
      if (videoRef.current.srcObject !== activeStream) {
        videoRef.current.srcObject = activeStream;
      }
      videoRef.current.play().catch((err) => {
        console.warn('Video auto-play handled:', err);
      });
    }
  }, [stream, stagePhase, isLoading, isVideoMuted]);

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

  const questions = useMemo(() => {
    return assessment?.questions || [];
  }, [assessment]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const handleNextQuestion = () => {
    if (!assessment) return;

    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(getTimeLimit(assessment.assessment_type));
      setLiveTranscript('');
      accumulatedTranscriptRef.current = '';
    } else {
      handleEndSession();
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

      // 1. Await full sync of all 30-second WebM chunks to local backend storage
      try {
        await waitForAllUploads();
      } catch (uploadErr) {
        console.warn('[Session End] Chunks sync note:', uploadErr);
      }

      // 2. Trigger assembly request to local backend
      await aiprepApi.assembleMedia(assessment.id, totalSlices).catch(e => console.warn('Async assembleMedia:', e));

      const embedQuery = isEmbedded ? '?embed=true' : '';
      router.push(`/aiprep${embedQuery}`);
    } catch (err: any) {
      console.error('Error ending assessment session:', err);
      stopCameraFeed();
      stopSpeechRecognition();
      const embedQuery = isEmbedded ? '?embed=true' : '';
      router.push(`/aiprep${embedQuery}`);
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
  const activeQuestion = questions[currentQuestionIndex] || null;
  const wordCount = liveTranscript ? liveTranscript.trim().split(/\s+/).filter(Boolean).length : 0;

  if (stagePhase === 'AI_INTRO') {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-between p-6 select-none overflow-hidden relative transition-colors duration-300">

        {/* Center AI Interviewer Avatar & Speech Quote Card */}
        <div className="max-w-xl w-full my-auto flex flex-col items-center text-center gap-6 z-10">

          {/* AI Avatar Icon - Minimalist Clean Icon Display */}
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
              <svg className="w-9 h-9 text-[#4A6CF7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                <rect x="4" y="8" width="16" height="12" rx="4" />
                <circle cx="9" cy="13" r="1.5" fill="currentColor" />
                <circle cx="15" cy="13" r="1.5" fill="currentColor" />
                <path d="M9 17h6" />
              </svg>
              {isAiSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A6CF7] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#4A6CF7]"></span>
                </span>
              )}
            </div>

            {/* AI Name & Soundwave Equalizer Bars */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">AI Interviewer</span>
              <div className="flex items-end gap-0.5 h-4 px-2 py-0.5 rounded-full bg-[#4A6CF7]/10 border border-[#4A6CF7]/20">
                <span className={`w-1 bg-[#4A6CF7] rounded-full h-2.5 ${isAiSpeaking ? 'animate-[bounce_1s_infinite_100ms]' : ''}`} />
                <span className={`w-1 bg-[#4A6CF7] rounded-full h-4 ${isAiSpeaking ? 'animate-[bounce_1s_infinite_300ms]' : ''}`} />
                <span className={`w-1 bg-[#4A6CF7] rounded-full h-3 ${isAiSpeaking ? 'animate-[bounce_1s_infinite_200ms]' : ''}`} />
                <span className={`w-1 bg-[#4A6CF7] rounded-full h-2 ${isAiSpeaking ? 'animate-[bounce_1s_infinite_400ms]' : ''}`} />
              </div>

              {/* Interactive AI Voice Play / Mute Button */}
              <button
                onClick={toggleAiSpeechMute}
                title={isAiSpeaking ? 'Mute AI Voice' : 'Replay AI Voice'}
                className="ml-1 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#4A6CF7] transition-all"
              >
                {isSpeechMuted ? <IconVolumeOff size={16} /> : <IconVolume size={16} />}
              </button>
            </div>
            <span className="text-xs text-[#4A6CF7] font-semibold mt-0.5">
              {isAiSpeaking ? 'AI Voice speaking…' : isSpeechMuted ? 'Voice Muted (Click speaker to hear)' : 'Introduction Practice Room'}
            </span>
          </div>

          {/* Prompt Speech Card */}
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-md shadow-slate-200/50 dark:shadow-none space-y-3.5 transition-all">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-[#4A6CF7] uppercase tracking-widest">
              <svg className="w-4 h-4 text-[#4A6CF7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                <rect x="4" y="8" width="16" height="12" rx="4" />
                <circle cx="9" cy="13" r="1.5" fill="currentColor" />
                <circle cx="15" cy="13" r="1.5" fill="currentColor" />
              </svg>
              <span>Introduction Practice Prompt</span>
            </div>

            <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed text-center">
              "{currentQuestion?.question_text || 'Please get ready as we begin your interview practice loop.'}"
            </p>

            {assessment.assessment_type === 'JOB_DESCRIPTION_INTRO' && jdTextFromSession && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 max-h-28 overflow-y-auto leading-relaxed text-left shadow-inner">
                <span className="font-extrabold text-[#4A6CF7] block mb-1">Target Job Description:</span>
                <p className="whitespace-pre-wrap">{jdTextFromSession}</p>
              </div>
            )}
          </div>

          {/* Subtext & Skip Button */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
              <IconSparkles size={14} className="text-[#4A6CF7] animate-pulse shrink-0" />
              <span>Practice room & session timer will activate in <span className="text-[#4A6CF7] font-extrabold">{aiIntroTimer}s</span>...</span>
            </p>

            <button
              onClick={handleSkipIntro}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A6CF7] hover:bg-[#3b5bd9] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <span>Skip Intro & Start Practice</span>
              <IconChevronRight size={14} stroke={2.5} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 z-10 pb-2">
          AI-Powered SmartPrep • Secure Audio & Video Analytics
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen w-full bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col justify-between p-3 sm:p-4 transition-colors duration-300 select-none overflow-y-auto">

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
          <div className="hidden sm:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A6CF7] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4A6CF7]"></span>
            </span>
            <h1 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest text-center truncate max-w-xs md:max-w-md">
              {assessment.assessment_type === 'GENERAL_INTRO' ? 'GENERAL INTRODUCTION' : assessment.assessment_type.replace(/_/g, ' ')} PRACTICE ROOM
            </h1>
          </div>

          {/* Right: Timer & Cloud Sync Uploader */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold">
              <IconClock size={15} className="text-[#4A6CF7]" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Time:</span>
              <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">{formatTime(timeLeft)}</span>
            </div>
            <ChunkedUploader uploadState={uploadState} onRetryFailed={retryFailedChunks} compact={true} isRecording={isRecording} />
          </div>
        </header>

        {/* 2. MAIN WORKSPACE STAGE (Exact Option 1: Split-Stage Cinema Layout) */}
        <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-5 items-stretch">

          {/* LEFT COLUMN (7 cols): Candidate Camera Stage */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-3 h-full min-h-0 relative">

            {/* CAMERA CONTAINER STAGE */}
            <div className="relative w-full flex-1 min-h-[340px] bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-xl">

              {/* 3-2-1 Countdown Overlay */}
              {countdownValue !== null && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in text-white">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#4A6CF7] mb-3 bg-[#4A6CF7]/10 px-4 py-1.5 rounded-full border border-[#4A6CF7]/20">
                    <IconSparkles className="w-4 h-4 text-[#4A6CF7] animate-pulse" />
                    <span>Recording Starts In</span>
                  </div>
                  <div className="text-8xl font-black text-white animate-bounce drop-shadow-[0_10px_20px_rgba(74,108,247,0.5)]">
                    {countdownValue}
                  </div>
                  <p className="text-xs text-slate-400 mt-4 font-medium">
                    Prepare your response. Recording will begin automatically…
                  </p>
                </div>
              )}

              {/* Always-Mounted Video Stream */}
              <video
                ref={(el) => {
                  videoRef.current = el;
                  const activeStream = streamRef.current || stream;
                  if (el && activeStream && el.srcObject !== activeStream) {
                    el.srcObject = activeStream;
                    el.play().catch(() => {});
                  }
                }}
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

              {/* TOP-LEFT Live Recording Badge (REC • Live • 00:08:45) */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 text-xs font-bold text-white px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-lg">
                <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400 animate-pulse' : isRecording ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                <span className="text-emerald-400 uppercase font-extrabold text-[11px]">REC</span>
                <span className="text-slate-300 text-xs">Live •</span>
                <span className="font-mono text-xs text-white font-bold">{formatTime(elapsedSeconds)}</span>
              </div>

              {/* TOP-RIGHT Telemetry Status Pill (Posture: Good 🧑‍💼) */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold px-3 py-1.5 rounded-xl backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Posture: Good</span>
              </div>

              {/* BOTTOM-LEFT: Embedded Waveform + Mic Active Status */}
              <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1">
                <EmbeddedAudioWaveform stream={stream} isMuted={isAudioMuted || isPaused || isInactive} />
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 drop-shadow">
                  <span className={`w-1.5 h-1.5 rounded-full ${isAudioMuted ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
                  <span>{isAudioMuted ? 'Mic Muted' : 'Mic Active • Good'}</span>
                </div>
              </div>

              {/* BOTTOM-RIGHT Chunk Sync Badge */}
              <div className="absolute bottom-4 right-4 z-20 font-mono text-xs text-slate-300 bg-slate-900/80 border border-slate-700/80 px-3 py-1 rounded-lg backdrop-blur-md shadow-lg">
                {uploadState.isUploading ? (
                  <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                    <IconLoader2 size={13} className="animate-spin text-indigo-400" />
                    Chunk {uploadState.queue.length} uploading…
                  </span>
                ) : uploadState.totalUploaded > 0 ? (
                  <span className="text-emerald-400 font-medium">Chunk {uploadState.totalUploaded} synced</span>
                ) : (
                  <span className="text-slate-400">Sync: 30s</span>
                )}
              </div>

              {/* YOLO Face Proctoring Analyzer */}
              {assessment.assessment_mode === 'VIDEO_AUDIO' && (typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_yolo_consent') === 'true' : true) && (
                <YOLOAnalyzer
                  videoRef={videoRef}
                  enabled={!isPaused && !isVideoMuted && Boolean(stream)}
                  assessmentId={assessment.id}
                />
              )}
            </div>

            {/* FLOATING GLASS CONTROL DOCK (Bottom Center) */}
            <div className="w-full flex items-center justify-center shrink-0 pt-1">
              <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl">

                <div className="flex items-center gap-2">
                  {/* 1. Mute Mic */}
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border ${isAudioMuted
                      ? 'bg-rose-600 border-rose-500 text-white shadow-rose-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {isAudioMuted ? <IconMicrophoneOff size={19} stroke={2} /> : <IconMicrophone size={19} stroke={2} />}
                  </button>

                  {/* 2. Stop Camera */}
                  {assessment.assessment_mode === 'VIDEO_AUDIO' && (
                    <button
                      type="button"
                      onClick={toggleVideo}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border ${isVideoMuted
                        ? 'bg-rose-600 border-rose-500 text-white shadow-rose-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                      title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
                    >
                      {isVideoMuted ? <IconVideoOff size={19} stroke={2} /> : <IconVideo size={19} stroke={2} />}
                    </button>
                  )}

                  {/* 3. Start Answer OR Pause / Resume Button */}
                  {isInactive ? (
                    !isIntroType ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-5 py-2 rounded-xl bg-[#4A6CF7] hover:bg-[#3b5bd9] text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-[#4A6CF7]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                      >
                        <IconPlayerPlay size={16} stroke={2} fill="currentColor" />
                        <span>Start Answer</span>
                      </button>
                    ) : (
                      <div className="px-4 py-2 rounded-xl bg-[#4A6CF7]/10 text-[#4A6CF7] dark:bg-indigo-950/40 dark:text-indigo-400 text-xs font-extrabold border border-[#4A6CF7]/20 flex items-center gap-2 shrink-0 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-[#4A6CF7] animate-ping" />
                        <span>Auto-Starting Practice...</span>
                      </div>
                    )
                  ) : !isPauseDisabled ? (
                    <button
                      type="button"
                      onClick={handleStartOrPause}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border ${isPaused
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                      title={isPaused ? 'Resume Session' : 'Pause Session'}
                    >
                      {isPaused ? <IconPlayerPlay size={19} stroke={2} fill="currentColor" /> : <IconPlayerPause size={19} stroke={2} />}
                    </button>
                  ) : null}

                  {/* 4. Next Question */}
                  {!isInactive && currentQuestionIndex < ((assessment?.questions?.length || 1) - 1) && (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                      title="Next Question"
                    >
                      <IconChevronRight size={20} stroke={2.5} />
                    </button>
                  )}

                  {/* 5. Quit / Exit Button */}
                  <button
                    type="button"
                    onClick={() => setShowExitModal(true)}
                    className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    title="Quit Session"
                  >
                    <IconLogout size={19} stroke={2} />
                  </button>
                </div>

                {/* Primary Complete Session Button */}
                <button
                  type="button"
                  onClick={handleEndSession}
                  disabled={isEnding}
                  className="px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 bg-[#4A6CF7] hover:bg-[#3b5bd9] text-white shadow-lg shadow-[#4A6CF7]/25 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                >
                  {isEnding ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" />
                      <span>Assembling…</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Session</span>
                      <IconChevronRight size={16} stroke={3} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (5 cols): Question Prompt Card & Live Speech Transcript Card */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full min-h-0">

            {/* CARD 1: Question Prompt Card */}
            {currentQuestion ? (
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl p-6 shadow-md flex flex-col justify-between shrink-0 space-y-4">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight">
                  {currentQuestion.question_text}
                </h2>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* AI Voice Pill */}
                  <button
                    onClick={() => speakAiText(currentQuestion.question_text)}
                    title={isAiSpeaking ? 'Mute AI Voice' : 'Replay Question AI Voice'}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 text-[#4A6CF7] text-xs font-bold cursor-pointer transition-all hover:bg-indigo-100"
                  >
                    {isSpeechMuted ? <IconVolumeOff size={14} /> : <IconVolume size={14} />}
                    <span>AI Voice Enabled</span>
                  </button>

                  {/* Countdown Timer Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                    <span>{formatTime(timeLeft)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">10:00</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl p-4 text-center text-xs text-slate-400">
                No questions loaded.
              </div>
            )}

            {/* CARD 2: Live Speech Transcript Card */}
            <div className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl p-6 shadow-md flex flex-col justify-between min-h-0 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#4A6CF7]/10 flex items-center justify-center text-[#4A6CF7]">
                    <IconMessage2 size={15} />
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Live Speech Transcript</h3>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                  {wordCount} words
                </span>
              </div>

              {/* Scrollable Transcript Viewport */}
              <div
                ref={transcriptScrollRef}
                className="flex-1 overflow-y-auto my-3 pr-1 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal"
              >
                {liveTranscript ? (
                  <p className="whitespace-pre-wrap leading-loose">
                    {liveTranscript.split(' ').map((word, idx) => {
                      const isHighlight = idx % 5 === 2 || ['challenge', 'handled', 'facilitate', 'communication', 'team', 'pressure', 'prioritized', 'ensured'].includes(word.toLowerCase().replace(/[^a-z]/g, ''));
                      return isHighlight ? (
                        <span key={idx} className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold px-1.5 py-0.5 rounded-md border border-slate-300 dark:border-slate-700 mx-0.5">
                          {word}
                        </span>
                      ) : (
                        <span key={idx}>{word} </span>
                      );
                    })}
                  </p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                    <IconWaveSine className="w-6 h-6 text-[#4A6CF7] animate-pulse" />
                    <p className="text-xs font-medium">Start speaking to transcribe your response live…</p>
                  </div>
                )}
              </div>

              {/* Guidance Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live WebSpeech Active
                </span>
                <span>Auto-scrolling</span>
              </div>
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
                  if (assessmentId) {
                    sessionStorage.removeItem(`aiprep_session_state_${assessmentId}`);
                  }
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
