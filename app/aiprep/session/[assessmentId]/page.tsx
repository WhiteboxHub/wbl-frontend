/**
 * Active Assessment Practice Session Room Page
 * 
 * Target Workspace: wbl-frontend
 * Route: /aiprep/session/[assessmentId]
 
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { aiprepApi, Assessment, Question, AssessmentType, AssessmentMode, NO_PAUSE_ASSESSMENT_TYPES } from '@/lib/aiprep-api';
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

EmbeddedAudioWaveform.displayName = 'EmbeddedAudioWaveform';

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
  const [audioVolume, setAudioVolume] = useState<number>(0);



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

  // Vision telemetry metrics ref
  const visionMetricsRef = useRef<{
    face_visible_pct: number;
    head_nods_count: number;
    frame_stability_score: number;
    sitting_position?: string;
  } | null>(null);

  // YOLO consent status fetched from the backend API hardware check record
  const [yoloEnabled, setYoloEnabled] = useState<boolean>(false);

  // Periodically send vision telemetry to the backend (every 15 seconds)
  useEffect(() => {
    if (!isRecording || isPaused || !assessmentId || !yoloEnabled || assessment?.assessment_mode !== 'VIDEO_AUDIO') {
      return;
    }

    const interval = setInterval(async () => {
      if (visionMetricsRef.current) {
        try {
          await aiprepApi.saveVisionTelemetry({
            assessment_id: assessmentId,
            ...visionMetricsRef.current,
          });
          console.log('[Vision Telemetry] Periodically saved vision proctoring analytics to backend.');
        } catch (err) {
          console.warn('[Vision Telemetry] Periodic save failed:', err);
        }
      }
    }, 15000); // every 15 seconds

    return () => clearInterval(interval);
  }, [isRecording, isPaused, assessmentId, yoloEnabled, assessment]);

  // Audio level visualizer analyzer
  useEffect(() => {
    if (!stream || isAudioMuted || isPaused || isInactive) {
      setAudioVolume(0);
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationFrameId: number | null = null;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 32;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkVolume = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          // Scale average volume (typically 0-100) to 0-15 bars
          const barsToFill = Math.min(15, Math.round((average / 45) * 15));
          setAudioVolume(barsToFill);
          animationFrameId = requestAnimationFrame(checkVolume);
        };

        animationFrameId = requestAnimationFrame(checkVolume);
      }
    } catch (e) {
      console.warn('Audio level analyzer error:', e);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (source) source.disconnect();
      if (audioContext) {
        try { audioContext.close(); } catch (e) { }
      }
    };
  }, [stream, isAudioMuted, isPaused, isInactive]);

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
  const isPauseDisabled = assessment ? NO_PAUSE_ASSESSMENT_TYPES.includes(assessment.assessment_type) : false;
  const wordCount = liveTranscript ? liveTranscript.trim().split(/\s+/).filter(Boolean).length : 0;

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

        // Fetch hardware check status from Backend to obtain YOLO consent status
        // Then cross-verify with consent record from backend — never use sessionStorage as source of truth
        let yoloConsentFromHardware = false;
        try {
          const hwCheck = await aiprepApi.getHardwareCheck(assessmentId);
          yoloConsentFromHardware = !!hwCheck.yolo_model_enabled;
        } catch (hwErr) {
          console.warn('[Session] Failed to load hardware check, will verify consent via consents API:', hwErr);
        }

        // Verify VIDEO_ANALYTICS consent directly from backend database
        let yoloConsentVerified = false;
        try {
          const candidateId = data.candidate_id;
          if (candidateId) {
            const consents = await aiprepApi.getConsents(candidateId);
            const videoConsent = consents.find(
              (c) => c.consent_type === 'VIDEO_ANALYTICS' && c.consented && !c.revoked_at
            );
            yoloConsentVerified = !!videoConsent;
          }
        } catch (consentErr) {
          console.warn('[Session] Could not verify consent from backend, falling back to hardware check value:', consentErr);
          yoloConsentVerified = yoloConsentFromHardware;
        }

        // YOLO is enabled only when BOTH hardware check flag AND explicit backend consent are active
        setYoloEnabled(yoloConsentVerified);

        // 2. Validate questions — they must come from the assessment record only.
        // Questions are assigned by the backend during createAssessment().
        // Do NOT fall back to getQuestions() as that returns unrelated bank questions.
        if (!data.questions || data.questions.length === 0) {
          throw new Error('This assessment has no questions assigned. Please go back and start a new session.');
        }

        // Ensure deterministic order by order_index
        if (data.questions && data.questions.length > 0) {
          data.questions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        }

        // Limit intro rooms to 1 single DB question
        if (isIntro && data.questions && data.questions.length > 0) {
          data.questions = [data.questions[0]];
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
        console.error('[Session] Failed to load assessment:', err);
        setErrorMsg(err.message || 'Failed to load assessment. Please go back and start a new session.');
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

      // Save final vision telemetry if available
      if (visionMetricsRef.current) {
        aiprepApi.saveVisionTelemetry({
          assessment_id: assessment.id,
          ...visionMetricsRef.current,
        }).catch(e => console.warn('Final vision telemetry save failed:', e));
      }

      // Fast non-blocking submission: trigger assembly & status update in parallel background tasks
      aiprepApi.assembleMedia(assessment.id, totalSlices).catch(e => console.warn('Async assembleMedia:', e));
      aiprepApi.updateAssessmentStatus(assessment.id, 'COMPLETED').catch(e => console.warn('Async status update:', e));

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

            {assessment.assessment_type === 'JOB_DESCRIPTION_INTRO' && assessment.job_description_text && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 max-h-28 overflow-y-auto leading-relaxed text-left shadow-inner">
                <span className="font-extrabold text-[#4A6CF7] block mb-1">Target Job Description:</span>
                <p className="whitespace-pre-wrap">{assessment.job_description_text}</p>
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
              Skip Intro
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 z-10 pb-2">
          AI-Powered SmartPrep • Secure Audio &amp; Video Analytics
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  PRACTICE ROOM — 2-column layout (camera left | question panel right)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] dark:bg-[#090d16] flex flex-col select-none text-slate-800 dark:text-slate-100">

      {/* ─── TOP HEADER ─── */}
      <header className="w-full flex items-center justify-between px-6 py-3.5 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 shrink-0 z-10">
        {/* Left: Title + live status */}
        <div className="flex flex-col">
          <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Assessment Room</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Session in Progress</span>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
          <div className="text-xl font-bold font-mono tracking-widest text-slate-900 dark:text-white">
            {formatTime(timeLeft)}
          </div>
          <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(0, (timeLeft / getTimeLimit(assessment.assessment_type)) * 100)}%` }}
            />
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Time Remaining</span>
        </div>

        {/* Right: Status chips + End Session */}
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${isAudioMuted ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' : 'bg-[#eef2ff] border-[#e0e7ff] text-[#4f46e5] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
            {isAudioMuted ? <IconMicrophoneOff size={14} stroke={2.5} /> : <IconMicrophone size={14} stroke={2.5} />}
            <span>{isAudioMuted ? 'Mic Off' : 'Mic On'}</span>
          </div>
          {assessment.assessment_mode === 'VIDEO_AUDIO' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${isVideoMuted ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' : 'bg-[#ecfdf5] border-[#d1fae5] text-[#059669] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
              {isVideoMuted ? <IconVideoOff size={14} stroke={2.5} /> : <IconVideo size={14} stroke={2.5} />}
              <span>{isVideoMuted ? 'Cam Off' : 'Cam On'}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="px-4 py-1.5 rounded-xl border border-rose-500 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs transition-all cursor-pointer bg-white dark:bg-slate-900"
          >
            End Session
          </button>
        </div>
      </header>

      {/* ─── INFO BAR (Assessment Type, Session, Questions, Marks) ─── */}
      <div className="w-full bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
              <IconDeviceLaptop size={16} stroke={2} />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Assessment Type</p>
              <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                {assessment.assessment_type === 'GENERAL_INTRO' ? 'General Introduction' : assessment.assessment_type.replace(/_/g, ' ')} Interview
              </p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Questions</p>
            <p className="text-xs font-extrabold text-slate-800 dark:text-white">{questions.length}</p>
          </div>

        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400 animate-pulse' : isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {isPaused ? 'PAUSED' : isRecording ? 'RECORDING' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── MAIN BODY: Two Columns ─── */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-slate-50 dark:bg-[#090d16] p-6 gap-6">

        {/* ── LEFT COLUMN: Camera & Controls ── */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
          {/* Camera Stage Container */}
          <div className="relative flex-1 min-h-0 bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center">

            {/* 3-2-1 Countdown Overlay */}
            {countdownValue !== null && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-indigo-400 mb-3 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
                  <IconSparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span>Recording Starts In</span>
                </div>
                <div className="text-8xl font-black text-white animate-bounce drop-shadow-[0_10px_20px_rgba(79,70,229,0.5)]">{countdownValue}</div>
                <p className="text-xs text-slate-400 mt-4 font-medium">Prepare your response. Recording will begin automatically...</p>
              </div>
            )}



            {/* Video Feed */}
            <video
              ref={(el) => {
                videoRef.current = el;
                const activeStream = streamRef.current || stream;
                if (el && activeStream && el.srcObject !== activeStream) {
                  el.srcObject = activeStream;
                  el.play().catch(() => { });
                }
              }}
              autoPlay playsInline muted
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${assessment.assessment_mode === 'VIDEO_AUDIO' && !isVideoMuted ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Camera off placeholder */}
            {(assessment.assessment_mode === 'AUDIO_ONLY' || isVideoMuted) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-950 z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                  <IconCameraOff size={32} stroke={1.5} />
                </div>
                <span className="text-sm font-semibold text-slate-300">Camera Muted</span>
              </div>
            )}

            {/* TOP-LEFT Flashing Recording Status Badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-950/70 border border-white/10 text-xs font-bold text-white px-3.5 py-1.5 rounded-full backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="tracking-wide">{isRecording ? '● Recording' : 'Standby'}</span>
            </div>

            {/* TOP-RIGHT Fullscreen Button */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      videoRef.current.requestFullscreen().catch(() => { });
                    }
                  }
                }}
                className="bg-slate-950/60 border border-white/10 text-xs font-bold text-white px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-1 hover:bg-slate-900"
              >
                <span>Fullscreen</span>
              </button>
            </div>

            {/* Audio Waveform bottom-left inside video */}
            <div className="absolute bottom-16 left-4 z-20">
              <EmbeddedAudioWaveform stream={stream} isMuted={isAudioMuted || isPaused || isInactive} />
            </div>

            {/* BOTTOM HUD Overlay Bar */}
            <div className="absolute bottom-0 inset-x-0 z-25 bg-slate-950/80 backdrop-blur-md border-t border-white/5 py-3 px-6 flex items-center justify-between text-white font-semibold text-xs">
              {/* HUD: Audio Level */}
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Audio Level</span>
                <div className="flex items-end gap-[2px] h-3.5">
                  {Array.from({ length: 15 }).map((_, i) => {
                    const isActive = i < audioVolume;
                    return (
                      <span
                        key={i}
                        className={`w-1 rounded-sm transition-all duration-75 ${isActive
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : 'bg-slate-800'
                          }`}
                        style={{
                          height: isActive
                            ? `${Math.max(4, Math.min(14, (i + 1) * 1.0))}px`
                            : '4px'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* HUD: Video Quality */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Video Quality</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-white">{assessment.assessment_mode === 'AUDIO_ONLY' ? 'N/A' : 'Good'}</span>
                </div>
              </div>

              {/* HUD: Network */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Network</span>
                <div className="flex items-center gap-1">
                  <IconWaveSine size={12} className="text-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-white">Stable</span>
                </div>
              </div>

              {/* HUD: AI Monitor */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">AI Monitor</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${yoloEnabled && isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-[11px] font-bold text-white">{yoloEnabled && assessment.assessment_mode === 'VIDEO_AUDIO' ? 'Active' : 'Off'}</span>
                </div>
              </div>
            </div>

            {assessment.assessment_mode === 'VIDEO_AUDIO' && yoloEnabled && (
              <YOLOAnalyzer
                videoRef={videoRef}
                enabled={!isPaused && !isVideoMuted && Boolean(stream)}
                assessmentId={assessment.id}
                onMetricsUpdate={(m) => {
                  visionMetricsRef.current = {
                    face_visible_pct: m.face_visible_pct,
                    head_nods_count: m.head_nods_count,
                    frame_stability_score: m.frame_stability_score,
                    sitting_position: m.sitting_position,
                  };
                }}
              />
            )}
          </div>

          {/* Bottom Toolbar: Controls (Mute, Stop Cam, End Session/Pause) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleAudio}
              className={`flex-1 py-3.5 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${isAudioMuted
                  ? 'bg-[#ffe4e6] border-rose-200 text-rose-600 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-400'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
            >
              {isAudioMuted ? <IconMicrophoneOff size={18} /> : <IconMicrophone size={18} />}
              <span>Mute</span>
            </button>

            {assessment.assessment_mode === 'VIDEO_AUDIO' && (
              <button
                type="button"
                onClick={toggleVideo}
                className={`flex-1 py-3.5 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${isVideoMuted
                    ? 'bg-[#ffe4e6] border-rose-200 text-rose-600 dark:bg-rose-955 dark:border-rose-900 dark:text-rose-400'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
              >
                {isVideoMuted ? <IconVideoOff size={18} /> : <IconVideo size={18} />}
                <span>Stop Video</span>
              </button>
            )}

            {isInactive && (
              <button
                type="button"
                onClick={startRecording}
                className="w-44 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
              >
                <IconPlayerPlay size={18} fill="currentColor" />
                <span>Start Recording</span>
              </button>
            )}

            {!isPauseDisabled && !isInactive && (
              <button
                type="button"
                onClick={handleStartOrPause}
                className={`flex-1 py-3.5 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${isPaused
                    ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
              >
                {isPaused ? <IconPlayerPlay size={18} /> : <IconPlayerPause size={18} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="px-6 py-3.5 rounded-2xl border border-rose-500 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer bg-white dark:bg-slate-900"
            >
              <IconLogout size={18} />
              <span>End Session</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Question Panel ── */}
        <div className="w-[380px] xl:w-[420px] shrink-0 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

          {/* Card Header: Title */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Assessment Page
            </span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-500/10 px-2.5 py-1 rounded-full">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Card Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 min-h-0">

            {/* AI Voice Trigger Row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Question Prompt
              </span>
              <button
                onClick={() => currentQuestion && speakAiText(currentQuestion.question_text)}
                className="flex items-center gap-1 text-xs text-[#4A6CF7] hover:text-[#3b5bd9] font-bold"
              >
                {isSpeechMuted ? <IconVolumeOff size={14} /> : <IconVolume size={14} />}
                <span>AI Voice</span>
              </button>
            </div>

            {/* Question Text */}
            <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed bg-slate-50/50 dark:bg-slate-850/50 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
              {currentQuestion?.question_text || 'No question prompt loaded.'}
            </p>



            {/* ── TRACKING - TIME ── */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tracking - Time
                </span>
                <span className="text-xs font-extrabold font-mono text-slate-950 dark:text-white">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    timeLeft > getTimeLimit(assessment.assessment_type) * 0.5 ? 'bg-indigo-600' :
                    timeLeft > getTimeLimit(assessment.assessment_type) * 0.25 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(0, (timeLeft / getTimeLimit(assessment.assessment_type)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Min Limit: 3:00</span>
                <span>Max Limit: {formatTime(getTimeLimit(assessment.assessment_type))}</span>
              </div>
            </div>

            {/* Live Transcript */}
            {liveTranscript && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <IconMessage2 size={12} className="text-[#4A6CF7]" />
                    <span>Live Transcript</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{wordCount} words</span>
                </div>
                <div ref={transcriptScrollRef} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-h-20 overflow-y-auto font-medium">
                  {liveTranscript}
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0" />

            {/* ── SKIP / SUBMIT BUTTONS ── */}
            <div className="flex items-center gap-3 mt-auto pt-2">
              {!isInactive && currentQuestionIndex < (questions.length - 1) && (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer bg-white dark:bg-slate-900 shadow-sm"
                >
                  Skip Question
                </button>
              )}

              {!isInactive && (
                <button
                  type="button"
                  onClick={currentQuestionIndex < (questions.length - 1) ? handleNextQuestion : handleEndSession}
                  disabled={isEnding}
                  className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  {isEnding ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>{currentQuestionIndex < (questions.length - 1) ? 'Submit' : 'Complete'}</span>
                      <IconChevronRight size={16} stroke={2.5} />
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#0f172a] p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800/80">
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Quit Assessment?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
              Are you sure you want to end this practice session? Your progress will be uploaded as-is.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm">Cancel</button>
              <button
                onClick={() => {
                  stopCameraFeed();
                  stopTimer();
                  stopSpeechRecognition();
                  if (assessmentId) {
                    sessionStorage.removeItem(`aiprep_session_state_${assessmentId}`);
                  }
                  router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep');
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/30"
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
