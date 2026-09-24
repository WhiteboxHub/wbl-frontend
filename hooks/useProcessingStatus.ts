'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { aiprepApi } from '@/lib/aiprep-api';
import type { AssessmentStatus } from '@/types/aiprep';

export type EngineStepStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ProcessingPipelineSteps {
  stt: EngineStepStatus;
  audio: EngineStepStatus;
  video: EngineStepStatus;
  llm: EngineStepStatus;
  finalize: EngineStepStatus;
}

export interface UseProcessingStatusOptions {
  assessmentId: number | string | null;
  pollIntervalMs?: number;
  onCompleted?: () => void;
  onFailed?: (error: string) => void;
}

export interface UseProcessingStatusReturn {
  status: AssessmentStatus | string;
  steps: ProcessingPipelineSteps;
  progressPercent: number;
  isCompleted: boolean;
  isFailed: boolean;
  errorMessage: string | null;
  refetch: () => Promise<void>;
}

const INITIAL_STEPS: ProcessingPipelineSteps = {
  stt: 'RUNNING',
  audio: 'QUEUED',
  video: 'QUEUED',
  llm: 'QUEUED',
  finalize: 'QUEUED',
};

export function useProcessingStatus({
  assessmentId,
  onCompleted,
  onFailed,
}: UseProcessingStatusOptions): UseProcessingStatusReturn {
  const [status, setStatus] = useState<AssessmentStatus | string>('EVALUATING');
  const [steps, setSteps] = useState<ProcessingPipelineSteps>(INITIAL_STEPS);
  const [progressPercent, setProgressPercent] = useState<number>(15);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasTriggeredCompleteRef = useRef<boolean>(false);
  const hasTriggeredFailedRef = useRef<boolean>(false);

  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
    onFailedRef.current = onFailed;
  });

  const checkStatus = useCallback(async () => {
    if (!assessmentId) return false;
    try {
      const assessment = await aiprepApi.getAssessment(assessmentId);
      const currentStatus = assessment?.status || 'EVALUATING';
      setStatus(currentStatus);

      if (currentStatus === 'COMPLETED') {
        setProgressPercent(100);
        setSteps({
          stt: 'COMPLETED',
          audio: 'COMPLETED',
          video: 'COMPLETED',
          llm: 'COMPLETED',
          finalize: 'COMPLETED',
        });
        setIsCompleted(true);
        setIsFailed(false);
        if (!hasTriggeredCompleteRef.current) {
          hasTriggeredCompleteRef.current = true;
          if (onCompletedRef.current) onCompletedRef.current();
        }
        return true;
      }

      if (currentStatus === 'FAILED') {
        setIsFailed(true);
        setIsCompleted(false);
        setErrorMessage('Evaluation processing encountered an error.');
        if (!hasTriggeredFailedRef.current) {
          hasTriggeredFailedRef.current = true;
          if (onFailedRef.current) onFailedRef.current('Evaluation processing encountered an error.');
        }
        return true;
      }

      return false;
    } catch (err) {
      console.warn('[ProcessingStatus Check Note]:', err);
      return false;
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!assessmentId) return;

    let active = true;
    const timers: NodeJS.Timeout[] = [];

    // Stage 1: STT transcribing (0s - 3s)
    timers.push(
      setTimeout(() => {
        if (!active) return;
        setProgressPercent(32);
      }, 1800)
    );

    // Stage 2: Audio cadence analysis (3s - 7s)
    timers.push(
      setTimeout(() => {
        if (!active) return;
        setSteps({
          stt: 'COMPLETED',
          audio: 'RUNNING',
          video: 'QUEUED',
          llm: 'QUEUED',
          finalize: 'QUEUED',
        });
        setProgressPercent(54);
      }, 4500)
    );

    // Stage 3: Video analysis & AI Evaluation Engine (7s - 12s)
    timers.push(
      setTimeout(() => {
        if (!active) return;
        setSteps({
          stt: 'COMPLETED',
          audio: 'COMPLETED',
          video: 'COMPLETED',
          llm: 'RUNNING',
          finalize: 'QUEUED',
        });
        setProgressPercent(76);
      }, 8500)
    );

    // Stage 4: Report generation finalizing (12s - 15s)
    timers.push(
      setTimeout(() => {
        if (!active) return;
        setSteps({
          stt: 'COMPLETED',
          audio: 'COMPLETED',
          video: 'COMPLETED',
          llm: 'COMPLETED',
          finalize: 'RUNNING',
        });
        setProgressPercent(92);
      }, 12500)
    );

    // Single asynchronous evaluation check when the pipeline reaches completion window
    const executeEvaluation = async () => {
      // Allow realistic LLM pipeline window (~15 seconds for OpenAI evaluation)
      await new Promise((res) => {
        const t = setTimeout(res, 15000);
        timers.push(t);
      });

      if (!active) return;

      // Make a single async call to check the final report status
      let done = await checkStatus();

      // If backend LLM needs extra time, continue gentle checks until a terminal state (COMPLETED or FAILED) is reached
      let attempts = 0;
      const MAX_SAFETY_ATTEMPTS = 15; // Up to ~75s additional window for complex LLM rubrics
      while (!done && active && attempts < MAX_SAFETY_ATTEMPTS) {
        attempts++;
        await new Promise((res) => {
          const t = setTimeout(res, 5000);
          timers.push(t);
        });
        if (active) {
          done = await checkStatus();
        }
      }

      // If still not finished after safety timeout, show friendly stall state with Retry Check button
      if (!done && active && !hasTriggeredCompleteRef.current && !hasTriggeredFailedRef.current) {
        setIsFailed(true);
        setErrorMessage('Evaluation is taking longer than usual. Please click Retry Check below.');
        return;
      }

      // Transition to completed and auto-navigate to report ONLY if backend actually completed
      if (done && active && !hasTriggeredCompleteRef.current && !hasTriggeredFailedRef.current) {
        setProgressPercent(100);
        setSteps({
          stt: 'COMPLETED',
          audio: 'COMPLETED',
          video: 'COMPLETED',
          llm: 'COMPLETED',
          finalize: 'COMPLETED',
        });
        setIsCompleted(true);
        hasTriggeredCompleteRef.current = true;
        if (onCompletedRef.current) onCompletedRef.current();
      }
    };

    executeEvaluation();

    return () => {
      active = false;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [assessmentId, checkStatus]);

  const refetch = useCallback(async () => {
    await checkStatus();
  }, [checkStatus]);

  return {
    status,
    steps,
    progressPercent,
    isCompleted,
    isFailed,
    errorMessage,
    refetch,
  };
}

export default useProcessingStatus;
