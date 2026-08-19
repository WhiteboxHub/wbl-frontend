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
import { aiprepApi, Assessment, Question, AssessmentType } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { QuestionDisplay } from '@/components/aiprep/QuestionDisplay';
import { YOLOAnalyzer } from '@/components/aiprep/YOLOAnalyzer';
import ThemeToggler from '@/components/Header/ThemeToggler';
import { Video, Mic, Clock, Pause, Play, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';

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
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [isEnding, setIsEnding] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          setTimeout(initCameraFeed, 100);
          setIsLoading(false);
          return;
        }

        const data = await aiprepApi.getAssessment(assessmentId);
        setAssessment(data);

        // Initialize time limits based on type
        const initialTime = getTimeLimit(data.assessment_type);
        setTimeLeft(initialTime);

        // Start device feed if video mode
        if (data.assessment_mode === 'VIDEO_AUDIO') {
          setTimeout(initCameraFeed, 100);
        }
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

  const initCameraFeed = async () => {
    try {
      stopCameraFeed();
      // Request standard webcam resolution dimensions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false, // audio tracks processed in backend/separate node
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Failed to initialize webcam overlay feed:', err);
    }
  };

  const stopCameraFeed = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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

      // 1. Submit final status change to COMPLETED
      await aiprepApi.updateAssessmentStatus(assessment.id, 'COMPLETED');

      // 2. Stop streams
      stopCameraFeed();

      // 3. Route to results report
      router.push(`/aiprep/reports/${assessment.id}`);
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

    setIsPaused((prev) => !prev);
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-12 px-6 flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      {/* Theme Toggler absolute placement */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggler />
      </div>

      {/* Background visual indicators */}
      <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-[#4A6CF7]/5 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 -z-10 h-72 w-72 rounded-full bg-sky-500/5 blur-3xl" />

      {/* Top Banner: Timer + Recording Indicator */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-sm font-bold text-slate-750 dark:text-slate-300 tracking-wider uppercase">
            {isPaused ? 'Recording Paused' : 'Live Session Recording'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-slate-800 dark:text-white font-bold text-sm shadow-sm">
            <Clock className="w-4 h-4 text-[#4A6CF7]" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Camera screen on Left + Active Question on Right */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-8 items-center justify-center my-8">
        {/* Camera stream overlay on the left (increased size) */}
        {assessment.assessment_mode === 'VIDEO_AUDIO' && (
          <div className="relative w-full md:w-[480px] h-[360px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 shadow-md flex items-center justify-center shrink-0">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100 bg-slate-950"
            />
            {/* Embedded YOLO Face Analytics */}
            <YOLOAnalyzer
              videoRef={videoRef}
              enabled={!isPaused && isRecording}
              assessmentId={assessment.id}
            />
            {isPaused && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-955/70 dark:bg-slate-950/80 text-slate-350 text-xs font-bold gap-1">
                <Pause className="w-4 h-4" /> Camera Feed Paused
              </div>
            )}
          </div>
        )}

        {/* Active Question Display on the right */}
        <div className="flex-1 w-full">
          {activeQuestion ? (
            <QuestionDisplay
              question={activeQuestion}
              currentIndex={currentQuestionIndex}
              totalCount={assessment.questions.length}
              category={assessment.assessment_type}
            />
          ) : (
            <div className="text-center text-slate-500 dark:text-slate-400 text-sm">No active question prompt.</div>
          )}
        </div>
      </div>

      {/* Footer Controllers */}
      <div className="max-w-5xl mx-auto w-full border-t border-slate-200 dark:border-slate-800 pt-8 flex items-center justify-between">
        {/* Left Side: Exit/Cancel */}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to quit this practice session? Progress will be lost.')) {
              router.push('/aiprep');
            }
          }}
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-805 dark:hover:text-white font-semibold text-xs transition-colors"
        >
          Quit Practice
        </button>

        {/* Right Side: Action Controllers */}
        <div className="flex items-center gap-3">
          {/* Conditional Pause Action */}
          {!isPauseDisabled && (
            <button
              onClick={handleTogglePause}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-semibold text-xs transition-all duration-200 ${isPaused
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-250 dark:border-emerald-800 text-emerald-655 dark:text-emerald-400 hover:bg-emerald-100/50'
                  : 'bg-slate-100/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-emerald-650" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          {/* Next Question / Complete Action */}
          {currentQuestionIndex + 1 < assessment.questions.length ? (
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#4A6CF7] hover:bg-[#4A6CF7]/90 text-white font-semibold text-xs shadow-lg shadow-[#4A6CF7]/15 transition-all duration-200"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-650 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-650 text-white font-semibold text-xs shadow-lg shadow-emerald-600/15 transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isEnding ? 'Finishing...' : 'Complete Session'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
