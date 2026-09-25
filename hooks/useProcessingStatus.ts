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

export function useProcessingStatus({
  assessmentId,
  onCompleted,
  onFailed,
}: UseProcessingStatusOptions): UseProcessingStatusReturn {
  const [status, setStatus] = useState<AssessmentStatus | string>('EVALUATING');
  const [steps, setSteps] = useState<ProcessingPipelineSteps>({
    stt: 'RUNNING',
    audio: 'QUEUED',
    video: 'QUEUED',
    llm: 'QUEUED',
    finalize: 'QUEUED',
  });
  const [progressPercent, setProgressPercent] = useState<number>(15);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);
  const isFinishedRef = useRef(false);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
    onFailedRef.current = onFailed;
  }, [onCompleted, onFailed]);

  const executeEvaluation = useCallback(async () => {
    if (!assessmentId) return;

    setIsFailed(false);
    setErrorMessage(null);
    isFinishedRef.current = false;

    try {
      const res = await aiprepApi.triggerEvaluation(assessmentId, true);

      if (res?.status === 'COMPLETED' || res?.id) {
        isFinishedRef.current = true;
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
        onCompletedRef.current?.();
      } else {
        isFinishedRef.current = true;
        setIsFailed(true);
        const errText = 'Evaluation processing encountered an error.';
        setErrorMessage(errText);
        onFailedRef.current?.(errText);
      }
    } catch (err: unknown) {
      isFinishedRef.current = true;
      setIsFailed(true);
      const msg = err instanceof Error ? err.message : 'Failed to complete evaluation. Please try again.';
      setErrorMessage(msg);
      onFailedRef.current?.(msg);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!assessmentId) return;

    let active = true;
    const timers: number[] = [];

    const schedule = (ms: number, updateFn: () => void) => {
      const id = window.setTimeout(() => {
        if (active && !isFinishedRef.current) updateFn();
      }, ms);
      timers.push(id);
    };

    schedule(1800, () => setProgressPercent(32));
    schedule(4500, () => {
      setSteps({
        stt: 'COMPLETED',
        audio: 'RUNNING',
        video: 'QUEUED',
        llm: 'QUEUED',
        finalize: 'QUEUED',
      });
      setProgressPercent(54);
    });
    schedule(8500, () => {
      setSteps({
        stt: 'COMPLETED',
        audio: 'COMPLETED',
        video: 'COMPLETED',
        llm: 'RUNNING',
        finalize: 'QUEUED',
      });
      setProgressPercent(76);
    });
    schedule(12500, () => {
      setSteps({
        stt: 'COMPLETED',
        audio: 'COMPLETED',
        video: 'COMPLETED',
        llm: 'COMPLETED',
        finalize: 'RUNNING',
      });
      setProgressPercent(92);
    });

    executeEvaluation();

    return () => {
      active = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [assessmentId, executeEvaluation]);

  return {
    status,
    steps,
    progressPercent,
    isCompleted,
    isFailed,
    errorMessage,
    refetch: executeEvaluation,
  };
}

export default useProcessingStatus;
