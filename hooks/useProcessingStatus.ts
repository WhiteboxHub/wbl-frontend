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

const COMPLETED_STEPS: ProcessingPipelineSteps = {
  stt: 'COMPLETED',
  audio: 'COMPLETED',
  video: 'COMPLETED',
  llm: 'COMPLETED',
  finalize: 'COMPLETED',
};

interface StageSchedule {
  delayMs: number;
  percent: number;
  steps?: ProcessingPipelineSteps;
}

const STAGE_SCHEDULES: StageSchedule[] = [
  { delayMs: 1800, percent: 32 },
  {
    delayMs: 4500,
    percent: 54,
    steps: { stt: 'COMPLETED', audio: 'RUNNING', video: 'QUEUED', llm: 'QUEUED', finalize: 'QUEUED' },
  },
  {
    delayMs: 8500,
    percent: 76,
    steps: { stt: 'COMPLETED', audio: 'COMPLETED', video: 'COMPLETED', llm: 'RUNNING', finalize: 'QUEUED' },
  },
  {
    delayMs: 12500,
    percent: 92,
    steps: { stt: 'COMPLETED', audio: 'COMPLETED', video: 'COMPLETED', llm: 'COMPLETED', finalize: 'RUNNING' },
  },
];

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
        setSteps(COMPLETED_STEPS);
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
  }, [
    assessmentId,
    setIsFailed,
    setErrorMessage,
    setProgressPercent,
    setSteps,
    setStatus,
    setIsCompleted,
    hasTriggeredCompleteRef,
    hasTriggeredFailedRef,
    onCompletedRef,
    onFailedRef,
  ]);

  useEffect(() => {
    if (!assessmentId) return;

    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    STAGE_SCHEDULES.forEach((sched) => {
      const t = setTimeout(() => {
        if (!active) return;
        if (sched.steps) setSteps(sched.steps);
        setProgressPercent(sched.percent);
      }, sched.delayMs);
      timers.push(t);
    });

    // Trigger exactly ONE evaluation call
    runEvaluation();

    return () => {
      active = false;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [assessmentId, runEvaluation, setSteps, setProgressPercent]);

  const refetch = useCallback(async () => {
    hasTriggeredCompleteRef.current = false;
    hasTriggeredFailedRef.current = false;
    await runEvaluation();
  }, [runEvaluation, hasTriggeredCompleteRef, hasTriggeredFailedRef]);

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
