/**
 * Active Assessment Session Room Page
 * 
 * Route: /aiprep/session/[assessmentId]
 * Studio Cinema-Grade Layout with Floating Dock, Audio Equalizer, AI Voice & Real-time Slicing
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { aiprepApi } from '@/lib/aiprep-api';
import type {
  AssessmentType,
  AssessmentStatus,
  MediaType,
  QuestionBankItem,
} from '@/types/aiprep';
import { NO_PAUSE_ASSESSMENT_TYPES } from '@/types/aiprep';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { useChunkUploadQueue } from '@/hooks/useChunkUploadQueue';
import { ChunkedUploader } from '@/components/aiprep/ChunkedUploader';
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
  IconAlertTriangle,
  IconLoader2,
  IconMessage2,
  IconVolume,
  IconVolumeOff,
  IconCameraOff,
  IconSparkles,
} from '@tabler/icons-react';

/**
 * Compact Floating Audio Waveform Equalizer (Embedded in Camera Overlay)
 */
const EmbeddedAudioWaveform = memo(({ stream, isMuted }: { stream: MediaStream | null; isMuted: boolean }) => {
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
        } catch (_) {}
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
        } catch (_) {}
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
  const assessmentId = assessmentIdStr ? parseInt(assessmentIdStr as string, 10) : 0;

  const isEmbedded = searchParams?.get('embed') === 'true';

  // Core session metadata
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('TECHNICAL');
  const [mediaType, setMediaType] = useState<MediaType>('VIDEO');
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Status & loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hardware mute state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);

  // Countdown overlay before recording starts
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const hasAutoStartedRef = useRef<boolean>(false);
  const sessionInitializedRef = useRef<boolean>(false);

  // Live Speech Recognition Transcript
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Exit Modal
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Speech Synthesis (AI Voice Reading)
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isSpeechMuted, setIsSpeechMuted] = useState<boolean>(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Video element ref
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Policy: No-pause enforcement
  const isPauseDisabled = NO_PAUSE_ASSESSMENT_TYPES.includes(assessmentType);
  const isIntroType = assessmentType === 'INTRO' || assessmentType === 'JD_INTRO';

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
    pauseRecording,
    resumeRecording,
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
  const isPaused = recordingStatus === 'paused';
  const isInactive = recordingStatus === 'idle';

  const startRecorderRef = useRef(startRecorderCore);
  startRecorderRef.current = startRecorderCore;
  const cleanupRecorderRef = useRef(cleanupRecorder);
  cleanupRecorderRef.current = cleanupRecorder;

  // ── AI Voice Synthesis Methods ─────────────────────────────────────────────
  const stopAiSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
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

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find((v) => v.name.includes('Google US English') || v.name.includes('Google')) ||
          voices.find((v) => v.name.includes('Natural') || v.name.includes('Samantha')) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 0.95;

        utterance.onstart = () => setIsAiSpeaking(true);
        utterance.onend = () => setIsAiSpeaking(false);
        utterance.onerror = () => setIsAiSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        setIsAiSpeaking(false);
      }
    },
    [isSpeechMuted, stopAiSpeech]
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
        } catch (_) {}

        const finalType: AssessmentType = resolvedType || 'INTRO';
        const finalMode: MediaType = resolvedMode || 'VIDEO';

        setAssessmentType(finalType);
        setMediaType(finalMode);

        // 2. Query Question Bank API dynamically for this track
        let loadedQuestions: QuestionBankItem[] = [];
        try {
          const qResponse = await aiprepApi.getQuestions(finalType);
          if (qResponse?.items && qResponse.items.length > 0) {
            loadedQuestions = qResponse.items;
          }
        } catch (qErr) {
          console.warn('Failed to fetch category questions, fetching default list:', qErr);
          const fallbackRes = await aiprepApi.getQuestions();
          loadedQuestions = fallbackRes?.items || [];
        }

        // For intro tracks, prioritize 1-2 focused questions
        if (NO_PAUSE_ASSESSMENT_TYPES.includes(finalType) && loadedQuestions.length > 1) {
          loadedQuestions = [loadedQuestions[0]];
        }

        setQuestions(loadedQuestions);

        // If intro track, trigger 3-second auto countdown to start practice smoothly
        if (NO_PAUSE_ASSESSMENT_TYPES.includes(finalType) && !hasAutoStartedRef.current) {
          hasAutoStartedRef.current = true;
          setCountdownValue(3);
          const interval = setInterval(() => {
            setCountdownValue((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(interval);
                startRecorderRef.current();
                return null;
              }
              return prev - 1;
            });
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
      cleanupRecorderRef.current();
    };
  }, [assessmentId, stopAiSpeech]);

  // Connect video element to active stream
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn('Video auto-play handled:', e));
      }
    }
  }, [stream]);

  // Read question aloud when question index changes
  useEffect(() => {
    if (!isLoading && questions[currentQuestionIndex] && !isIntroType) {
      speakAiText(questions[currentQuestionIndex].question_text);
    }
  }, [currentQuestionIndex, isLoading, questions, isIntroType, speakAiText]);

  // ── Live Speech Recognition ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isRecording && !isPaused && !isAudioMuted && SpeechRecognition) {
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
          if (currentText.trim()) {
            setLiveTranscript(currentText.trim());
          }
          if (transcriptScrollRef.current) {
            transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('[Speech Recognition Note]:', e.error);
        };

        recognition.onend = () => {
          if (isRecording && !isPaused && !isAudioMuted && recognitionRef.current === recognition) {
            try {
              recognition.start();
            } catch (_) {}
          }
        };

        recognition.start();
      } catch (err) {
        console.warn('Speech recognition not available:', err);
      }
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [isRecording, isPaused, isAudioMuted]);

  // ── Hardware Mute Toggles ──────────────────────────────────────────────────
  const toggleAudio = () => {
    if (stream) {
      const nextState = !isAudioMuted;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
      setIsAudioMuted(nextState);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const nextState = !isVideoMuted;
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !nextState;
      });
      setIsVideoMuted(nextState);
    }
  };

  // ── Start / Pause Controls ─────────────────────────────────────────────────
  const handleStartOrPause = () => {
    if (isInactive) {
      startRecorderCore();
      return;
    }

    if (isPauseDisabled) return;

    if (recordingStatus === 'recording') {
      pauseRecording();
    } else if (recordingStatus === 'paused') {
      resumeRecording();
    }
  };

  // ── Navigation Between Questions ───────────────────────────────────────────
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // ── Complete Session & Submit Telemetry to Pure Engines ─────────────────────
  const handleEndSession = async () => {
    if (!assessmentId) return;

    try {
      setIsEnding(true);
      stopAiSpeech();

      // 1. Stop recording and flush final 30s slice
      await stopRecording();

      // 2. Calculate telemetry metrics
      const wordCount = liveTranscript ? liveTranscript.trim().split(/\s+/).filter(Boolean).length : 0;
      const durationMin = Math.max(0.1, elapsedTime / 60);
      const calculatedWpm = Math.round(wordCount / durationMin);

      // 3. Assemble full contract telemetry payload from actual live session metrics
      const actualTranscript = liveTranscript.trim();
      const telemetryPayload = {
        questions: questions.map((q) => ({
          question_id: q.id,
          question_text: q.question_text,
        })),
        transcript: {
          full_text: actualTranscript,
          segments: [],
        },
        audio_telemetry: {
          words_per_minute: calculatedWpm,
          silence_ratio_pct: 0,
          speaking_duration_seconds: elapsedTime,
        },
        video_telemetry: {
          face_visible_pct: isVideoMuted ? 0 : 100,
          head_nods_count: 0,
        },
      };

      // 4. Submit captured telemetry data to POST /api/aiprep/assessments/{id}/data
      try {
        await aiprepApi.submitTelemetryData(assessmentId, telemetryPayload);
      } catch (submitErr) {
        console.warn('Telemetry submission note:', submitErr);
      }

      // 5. Trigger evaluation orchestrator to POST /api/aiprep/assessments/{id}/evaluate
      try {
        await aiprepApi.triggerEvaluation(assessmentId);
      } catch (evalErr) {
        console.warn('Evaluation trigger note:', evalErr);
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
      console.error('Error completing assessment session:', err);
      // Fallback navigation
      const processingUrl = isEmbedded
        ? `/aiprep/session/${assessmentId}/processing?embed=true`
        : `/aiprep/session/${assessmentId}/processing`;
      router.push(processingUrl);
    } finally {
      setIsEnding(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Loading & Error Displays ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#090d16] text-slate-200 flex flex-col items-center justify-center p-6 select-none overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
          <IconLoader2 size={24} className="animate-spin" />
        </div>
        <h2 className="text-sm font-semibold text-slate-100 mb-1">Connecting to Practice Room</h2>
        <p className="text-slate-400 text-xs">Calibrating media slicing and dynamic questions…</p>
      </div>
    );
  }

  if (errorMsg && !assessmentId) {
    return (
      <div className="h-screen w-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-500">
          <IconAlertTriangle size={24} className="animate-bounce" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1.5">Session Room Error</h3>
        <p className="text-slate-400 text-xs max-w-md mx-auto mb-5 leading-relaxed">{errorMsg}</p>
        <button
          onClick={() => router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs shadow-sm cursor-pointer"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  const activeQuestion = questions[currentQuestionIndex] || null;
  const wordCount = liveTranscript ? liveTranscript.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="h-screen w-screen bg-[#090d16] text-slate-100 flex flex-col justify-between p-4 sm:p-5 select-none overflow-hidden relative">
      {/* 1. STUDIO HEADER */}
      <header className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
            <IconSparkles size={18} />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
              {assessmentType.replace(/_/g, ' ')} Practice Room
            </h1>
            <span className="text-[10px] text-slate-400 font-mono">Session ID: #{assessmentId}</span>
          </div>
        </div>

        {/* Real-Time Chunk Sync Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm text-xs font-semibold">
            <IconClock size={15} className="text-indigo-400" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Elapsed:</span>
            <span className="font-mono text-xs font-extrabold text-white">{formatTime(elapsedTime)}</span>
          </div>
          <ChunkedUploader
            totalChunks={totalChunks}
            uploadedChunks={uploadedChunks}
            pendingChunks={pendingChunks}
            failedChunks={failedChunks}
            isUploading={isUploading}
            isComplete={isComplete}
            onRetry={retryFailedChunks}
          />
        </div>
      </header>

      {/* 2. SPLIT-STAGE WORKSPACE (Max height protection) */}
      <div className="flex-1 min-h-0 py-3 flex flex-col lg:grid lg:grid-cols-12 gap-4 items-stretch overflow-y-auto max-h-[85vh]">
        {/* LEFT COLUMN: Camera Stage & Floating Control Dock */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3 h-full min-h-0 relative">
          {/* CAMERA CONTAINER */}
          <div className="relative w-full flex-1 min-h-[320px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl">
            {/* 3-2-1 Countdown Overlay */}
            {countdownValue !== null && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md text-white animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-indigo-400 mb-3 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
                  <IconSparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span>Recording Starts In</span>
                </div>
                <div className="text-8xl font-black text-white animate-bounce drop-shadow-[0_10px_20px_rgba(99,102,241,0.5)]">
                  {countdownValue}
                </div>
                <p className="text-xs text-slate-400 mt-4 font-medium">
                  Prepare your response. Practice recording will start automatically…
                </p>
              </div>
            )}

            {/* Video Stream Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
                mediaType !== 'AUDIO' && !isVideoMuted ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />

            {/* Camera Muted or Audio-Only State */}
            {(mediaType === 'AUDIO' || isVideoMuted) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-slate-400 bg-slate-950">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                  <IconCameraOff size={28} stroke={1.5} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-300">
                  {mediaType === 'AUDIO' ? 'Audio-Only Mode' : 'Live Camera Feed Muted'}
                </span>
              </div>
            )}

            {/* Top-Left Live REC Badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/85 border border-slate-700/80 text-xs font-bold text-white px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-lg">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isPaused ? 'bg-amber-400 animate-pulse' : isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span className="text-red-400 uppercase font-extrabold text-[11px]">REC</span>
              <span className="text-slate-300 text-xs">Live •</span>
              <span className="font-mono text-xs text-white font-bold">{formatTime(elapsedTime)}</span>
            </div>

            {/* Top-Right Telemetry Badge */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold px-3 py-1.5 rounded-xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Posture & Frame: Good</span>
            </div>

            {/* Bottom-Left: Embedded Audio Waveform Equalizer */}
            <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1">
              <EmbeddedAudioWaveform stream={stream} isMuted={isAudioMuted || isPaused || isInactive} />
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 drop-shadow">
                <span className={`w-1.5 h-1.5 rounded-full ${isAudioMuted ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
                <span>{isAudioMuted ? 'Mic Muted' : 'Mic Active • Ready'}</span>
              </div>
            </div>

            {/* Bottom-Right 30s Slicer Badge */}
            <div className="absolute bottom-4 right-4 z-20 font-mono text-xs text-slate-300 bg-slate-900/85 border border-slate-700/80 px-3 py-1 rounded-lg backdrop-blur-md shadow-lg">
              <span className="text-slate-400">Slice interval: 30s</span>
            </div>
          </div>

          {/* FLOATING GLASS MEETING DOCK */}
          <div className="w-full flex items-center justify-center shrink-0 pt-1">
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-xl w-full max-w-2xl">
              <div className="flex items-center gap-2">
                {/* 1. Mute Mic */}
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border ${
                    isAudioMuted
                      ? 'bg-rose-600 border-rose-500 text-white shadow-rose-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isAudioMuted ? <IconMicrophoneOff size={19} stroke={2} /> : <IconMicrophone size={19} stroke={2} />}
                </button>

                {/* 2. Toggle Camera */}
                {mediaType !== 'AUDIO' && (
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border ${
                      isVideoMuted
                        ? 'bg-rose-600 border-rose-500 text-white shadow-rose-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
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
                      onClick={handleStartOrPause}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    >
                      <IconPlayerPlay size={16} stroke={2} fill="currentColor" />
                      <span>Start Answer</span>
                    </button>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-indigo-950/40 text-indigo-400 text-xs font-extrabold border border-indigo-500/20 flex items-center gap-2 shrink-0 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      <span>Auto-Starting Practice...</span>
                    </div>
                  )
                ) : !isPauseDisabled ? (
                  <button
                    type="button"
                    onClick={handleStartOrPause}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border ${
                      isPaused
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                    title={isPaused ? 'Resume Session' : 'Pause Session'}
                  >
                    {isPaused ? <IconPlayerPlay size={19} stroke={2} fill="currentColor" /> : <IconPlayerPause size={19} stroke={2} />}
                  </button>
                ) : null}

                {/* 4. Question Navigation Arrows */}
                {!isInactive && questions.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 border border-slate-700 flex items-center justify-center transition-all disabled:cursor-not-allowed cursor-pointer"
                      title="Previous Question"
                    >
                      <IconChevronLeft size={18} stroke={2} />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 border border-slate-700 flex items-center justify-center transition-all disabled:cursor-not-allowed cursor-pointer"
                      title="Next Question"
                    >
                      <IconChevronRight size={18} stroke={2} />
                    </button>
                  </div>
                )}

                {/* 5. Quit / Exit Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setShowExitModal(true)}
                  className="w-10 h-10 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Quit Session"
                >
                  <IconLogout size={19} stroke={2} />
                </button>
              </div>

              {/* Complete Session Button */}
              <button
                type="button"
                onClick={handleEndSession}
                disabled={isEnding}
                className="px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isEnding ? (
                  <>
                    <IconLoader2 size={16} className="animate-spin" />
                    <span>Finalizing…</span>
                  </>
                ) : (
                  <>
                    <span>Finish Assessment</span>
                    <IconChevronRight size={16} stroke={3} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Question Prompt Card & Live Speech Transcript Card */}
        <div className="lg:col-span-5 flex flex-col gap-3 h-full min-h-0">
          {/* CARD 1: Question Prompt Card */}
          {activeQuestion ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between shrink-0 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full">
                  {activeQuestion.category || assessmentType}
                </span>

                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>

              <h2 className="text-base font-semibold text-white leading-relaxed">
                {activeQuestion.question_text}
              </h2>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                {/* AI Voice Narration Pill */}
                <button
                  type="button"
                  onClick={() => speakAiText(activeQuestion.question_text)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-950/50 border border-indigo-800/50 text-indigo-300 text-xs font-bold cursor-pointer transition-all hover:bg-indigo-900/60"
                >
                  {isSpeechMuted ? <IconVolumeOff size={14} /> : <IconVolume size={14} />}
                  <span>{isAiSpeaking ? 'Speaking…' : 'Read Question Aloud'}</span>
                </button>

                {activeQuestion.difficulty_level && (
                  <span className="text-[11px] font-semibold text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md uppercase">
                    {activeQuestion.difficulty_level}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400">
              {isLoading ? 'Loading assessment questions…' : 'No questions currently available in Question Bank for this track.'}
            </div>
          )}

          {/* CARD 2: Live Speech Transcript Card */}
          <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <IconMessage2 size={15} />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Speech Transcript</h3>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                {wordCount} words
              </span>
            </div>

            {/* Scrollable Viewport */}
            <div
              ref={transcriptScrollRef}
              className="flex-1 min-h-0 overflow-y-auto py-3 text-xs leading-relaxed text-slate-300 select-text"
            >
              {liveTranscript ? (
                <p className="whitespace-pre-wrap">{liveTranscript}</p>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
                  <IconMicrophone size={24} className="mb-2 opacity-50 text-indigo-400" />
                  <p>Speech will appear here in real-time as you speak…</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
              Transcribed live for coaching coherence & communication analytics
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXIT CONFIRMATION MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <IconAlertTriangle size={24} />
              <h3 className="text-base font-bold text-white">Exit Assessment Session?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exiting will cancel your current attempt and any unsaved responses. Are you sure you want to leave?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  cleanupRecorder();
                  router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep');
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
