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

  const runEvaluation = useCallback(async () => {
    if (!assessmentId) return;

    setIsFailed(false);
    setErrorMessage(null);

    try {
      // Single synchronous evaluation call (wait=true)
      const res = await aiprepApi.triggerEvaluation(assessmentId, true);

      if (res?.status === 'COMPLETED' || res?.id) {
        setProgressPercent(100);
        setSteps({
          stt: 'COMPLETED',
          audio: 'COMPLETED',
          video: 'COMPLETED',
          llm: 'COMPLETED',
          finalize: 'COMPLETED',
        });
        setStatus('COMPLETED');
        setIsCompleted(true);
        if (!hasTriggeredCompleteRef.current) {
          hasTriggeredCompleteRef.current = true;
          if (onCompletedRef.current) onCompletedRef.current();
        }
      } else if (res?.status === 'FAILED') {
        setIsFailed(true);
        setErrorMessage('Evaluation processing encountered an error.');
        if (!hasTriggeredFailedRef.current) {
          hasTriggeredFailedRef.current = true;
          if (onFailedRef.current) onFailedRef.current('Evaluation processing encountered an error.');
        }
      }
    } catch (err: any) {
      console.error('[Single-Call Evaluation Error]:', err);
      setIsFailed(true);
      const msg = err?.message || 'Failed to complete evaluation. Please try again.';
      setErrorMessage(msg);
      if (!hasTriggeredFailedRef.current) {
        hasTriggeredFailedRef.current = true;
        if (onFailedRef.current) onFailedRef.current(msg);
      }
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

    // Trigger exactly ONE evaluation call
    runEvaluation();

    return () => {
      active = false;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [assessmentId, runEvaluation]);

  const refetch = useCallback(async () => {
    hasTriggeredCompleteRef.current = false;
    hasTriggeredFailedRef.current = false;
    await runEvaluation();
  }, [runEvaluation]);

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
