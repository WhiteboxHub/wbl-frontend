/**
 * Active Assessment Session Room Page
 * 
 * Target Workspace: wbl-frontend
 * Route: /aiprep/session/[assessmentId]
 * Primary Developer: Narasimha (FE1)
 * 
 * Conducts the active practice session. Manages question traversal, timers,
 * video preview overlays, and navigation control state machines.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { aiprepApi, Assessment, Question, AssessmentType, AssessmentMode } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { QuestionDisplay } from '@/components/aiprep/QuestionDisplay';
import { YOLOAnalyzer } from '@/components/aiprep/YOLOAnalyzer';
import { ChunkedUploader } from '@/components/aiprep/ChunkedUploader';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { useChunkUploadQueue } from '@/hooks/useChunkUploadQueue';
import ThemeToggler from '@/components/Header/ThemeToggler';
import { Video, Mic, Clock, Pause, Play, ChevronRight, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function AssessmentSessionPage() {
  const router = useRouter();
  const params = useParams();

  // Extract assessmentId from route params
  const assessmentIdStr = params?.assessmentId;
  const assessmentId = assessmentIdStr ? parseInt(assessmentIdStr as string, 10) : null;

  // Page states
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(90); // default fallback
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hook 1: Upload Queue Manager
  const { state: uploadState, enqueueChunk, retryFailedChunks, waitForAllUploads, resetQueue } =
    useChunkUploadQueue({
      assessmentId: assessmentId || 0,
      onError: (err) => console.error(`Sync error: ${err.message}`),
    });

  // Hook 2: MediaRecorder Engine
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
      console.log(`Secured 30s media slice #${chunkNumber + 1} (${Math.round(chunkBlob.size / 1024)} KB)`);
      enqueueChunk(chunkBlob, chunkNumber);
    },
    onError: (err) => console.error(`Recorder Error: ${err.message}`),
    onDeviceDisconnected: () => console.warn('Alert: Hardware audio/video input disconnected.'),
  });

  const isPaused = recordingState === 'paused';
  const isRecording = recordingState === 'recording';

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

          const mockAssessment: Assessment = {
            id: assessmentId,
            candidate_id: candidateId,
            assessment_type: 'TECHNICAL',
            assessment_mode: 'VIDEO_AUDIO',
            status: 'IN_PROGRESS',
            attempt_number: 1,
            created_at: new Date().toISOString(),
            questions: [
              { id: 1, order_index: 1, question_text: 'Explain the difference between fine-tuning and RAG.', difficulty_level: 'MEDIUM' },
              { id: 2, order_index: 2, question_text: 'How do you prevent hallucinations in an LLM pipeline?', difficulty_level: 'HARD' },
              { id: 3, order_index: 3, question_text: 'What are the main components of the transformer attention mechanism?', difficulty_level: 'EXPERT' }
            ]
          };
          setAssessment(mockAssessment);
          setTimeLeft(getTimeLimit('TECHNICAL'));
          setTimeout(() => initMediaFeed('VIDEO_AUDIO'), 100);
          setIsLoading(false);
          return;
        }

        const data = await aiprepApi.getAssessment(assessmentId);
        setAssessment(data);

        // Initialize time limits based on type
        const initialTime = getTimeLimit(data.assessment_type);
        setTimeLeft(initialTime);

        // Start device feed (mic is always active; camera matches mode selection)
        setTimeout(() => initMediaFeed(data.assessment_mode), 100);
      } catch (err: any) {
        console.error('Error fetching assessment info:', err);
        setErrorMsg(err.message || 'Failed to fetch the assessment details.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAssessmentData();

    return () => {
      stopCameraFeed();
      stopTimer();
    };
  }, [assessmentId]);

  // Auto-start recording once media stream is ready
  useEffect(() => {
    if (stream && recordingState === 'inactive') {
      startRecording();
    }
  }, [stream, recordingState, startRecording]);

  // Handle countdown timer
  useEffect(() => {
    if (isLoading || errorMsg || !assessment || isPaused) {
      stopTimer();
      return;
    }

    startTimer();

    return () => stopTimer();
  }, [isLoading, errorMsg, assessment, isPaused, currentQuestionIndex]);

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
          // Timeout triggers next question automatically
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
        video: mode === 'VIDEO_AUDIO' ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
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

  const handleNextQuestion = () => {
    if (!assessment) return;

    if (currentQuestionIndex + 1 < assessment.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      // Reset timer
      setTimeLeft(getTimeLimit(assessment.assessment_type));
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
          router.push(`/aiprep/reports/${assessment.id}?mock=true`);
        }, 1200);
        return;
      }

      // 1. Stop recording and wait for final chunks
      await stopRecording();
      await waitForAllUploads();

      // 2. Assemble media
      await aiprepApi.assembleMedia(assessment.id, chunkCount);

      // 3. Submit final status change to COMPLETED
      await aiprepApi.updateAssessmentStatus(assessment.id, 'COMPLETED');

      // 4. Stop streams
      stopCameraFeed();

      // 5. Route to processing page
      router.push(`/aiprep/session/${assessment.id}/processing`);
    } catch (err: any) {
      console.error('Error ending assessment session:', err);
      alert(err.message || 'Failed to complete session telemetry sync.');
    } finally {
      setIsEnding(false);
    }
  };

  // Toggle pausing (General and JD intros have this feature disabled)
  const handleTogglePause = () => {
    if (!assessment) return;
    const pauseAllowed = !['GENERAL_INTRO', 'JOB_DESCRIPTION_INTRO'].includes(assessment.assessment_type);
    if (!pauseAllowed) return;

    if (recordingState === 'recording') {
      pauseRecording();
    } else if (recordingState === 'paused') {
      resumeRecording();
    }
  };

  // Helper formatting for timer mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center transition-colors duration-200">
        <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-[#4A6CF7] animate-spin mb-6" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading practice assessment session...</p>
      </div>
    );
  }

  if (errorMsg || !assessment) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center transition-colors duration-200">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Session Room Error</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">{errorMsg || 'Assessment details not found.'}</p>
        <button onClick={() => router.push('/aiprep')} className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isPauseDisabled = ['GENERAL_INTRO', 'JOB_DESCRIPTION_INTRO'].includes(assessment.assessment_type);
  const activeQuestion = assessment.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 py-4 px-4 md:px-6 flex flex-col justify-between relative overflow-y-auto transition-colors duration-300">
      {/* Background glassmorphic visual indicators */}
      <div className="absolute top-0 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-[#4A6CF7]/8 dark:bg-[#4A6CF7]/5 blur-3xl animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/8 dark:bg-indigo-500/4 blur-3xl animate-pulse duration-[8000ms]" style={{ animationDelay: '3s' }} />

      {/* Top Banner: Timer + Recording Indicator */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 px-4 py-1.5 rounded-2xl shadow-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPaused ? 'bg-amber-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? 'bg-amber-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-[11px] font-bold text-slate-750 dark:text-slate-200 tracking-wider uppercase">
              {isPaused ? 'Recording Paused' : 'Live Assessment Active'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ChunkedUploader uploadState={uploadState} onRetryFailed={retryFailedChunks} compact={true} isRecording={isRecording} />
          <div className="inline-flex items-center justify-center gap-2 bg-white/85 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 px-4 py-1.5 rounded-2xl text-slate-850 dark:text-white font-bold text-sm shadow-md backdrop-blur-md shrink-0 select-none whitespace-nowrap">
            <Clock className="w-4 h-4 text-[#4A6CF7] animate-pulse shrink-0 relative top-[6px]" />
            <span className="font-mono text-sm tracking-wide leading-none">{formatTime(timeLeft)}</span>
          </div>
          <ThemeToggler />
        </div>
      </div>

      {/* Main Workspace: Camera screen on Left + Active Question on Right */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-8 items-center justify-center my-2">
        {/* Camera stream overlay on the left (increased size with futuristic scan lines) */}
        {assessment.assessment_mode === 'VIDEO_AUDIO' && (
          <div className={`relative w-full md:w-[500px] h-[280px] md:h-[375px] rounded-3xl overflow-hidden border bg-slate-100 dark:bg-slate-950 shadow-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${isPaused
              ? 'border-amber-500/30 dark:border-amber-500/20'
              : 'border-slate-200 dark:border-[#333756] shadow-[0_0_50px_rgba(74,108,247,0.06)]'
            }`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100 bg-slate-955"
            />
            {/* HUD Bounding Target Lines */}
            <div className="absolute inset-5 border border-white/5 dark:border-white/2 rounded-2xl pointer-events-none" />
            <div className="absolute top-5 left-5 w-4 h-4 border-t-2 border-l-2 border-[#4A6CF7]/70" />
            <div className="absolute top-5 right-5 w-4 h-4 border-t-2 border-r-2 border-[#4A6CF7]/70" />
            <div className="absolute bottom-5 left-5 w-4 h-4 border-b-2 border-l-2 border-[#4A6CF7]/70" />
            <div className="absolute bottom-5 right-5 w-4 h-4 border-b-2 border-r-2 border-[#4A6CF7]/70" />

            {/* Embedded YOLO Face Analytics */}
            <YOLOAnalyzer
              videoRef={videoRef}
              enabled={!isPaused && isRecording}
              assessmentId={assessment.id}
            />

            {isPaused && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-955/70 dark:bg-slate-950/80 text-slate-355 text-xs font-bold gap-1 animate-fade-in backdrop-blur-md">
                <div className="p-3 bg-white/10 rounded-full border border-white/20 animate-pulse">
                  <Pause className="w-5 h-5 text-white" />
                </div>
                <span className="uppercase tracking-widest text-[10px] text-slate-350">Camera Stream Paused</span>
              </div>
            )}
          </div>
        )}

        {/* Active Question Display on the right */}
        <div className="flex-1 w-full max-w-[440px] flex flex-col gap-4">
          {activeQuestion ? (
            <QuestionDisplay
              question={activeQuestion}
              currentIndex={currentQuestionIndex}
              totalCount={assessment.questions.length}
              category={assessment.assessment_type}
            />
          ) : (
            <div className="text-center text-slate-550 dark:text-slate-400 text-sm py-8 bg-white/60 dark:bg-slate-800/40 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">No active question prompt.</div>
          )}
          <div className="flex justify-center transition-all duration-300">
            <ChunkedUploader uploadState={uploadState} onRetryFailed={retryFailedChunks} isRecording={isRecording} />
          </div>
        </div>
      </div>

      {/* Footer Controllers */}
      <div className="max-w-5xl mx-auto w-full border-t border-slate-200/80 dark:border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Side: Exit/Cancel */}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to quit this practice session? Progress will be lost.')) {
              router.push('/aiprep');
            }
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold text-xs transition-all duration-200 active:scale-98"
        >
          Quit Practice
        </button>

        {/* Right Side: Action Controllers */}
        <div className="w-full sm:w-auto flex items-center justify-end gap-3.5">
          {/* Conditional Pause Action */}
          {!isPauseDisabled && (
            <button
              onClick={handleTogglePause}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-xs shadow-sm transition-all duration-200 active:scale-95 ${isPaused
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          {/* Next Question / Complete Action */}
          {currentQuestionIndex + 1 < assessment.questions.length ? (
            <button
              onClick={handleNextQuestion}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/10 hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>{isEnding ? 'Finishing...' : 'Complete Session'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
