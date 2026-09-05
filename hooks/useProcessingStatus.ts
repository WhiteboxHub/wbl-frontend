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
  assessmentId: number | null;
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
  pollIntervalMs = 3000,
  onCompleted,
  onFailed,
}: UseProcessingStatusOptions): UseProcessingStatusReturn {
  const [status, setStatus] = useState<AssessmentStatus | string>('EVALUATING');
  const [steps, setSteps] = useState<ProcessingPipelineSteps>(INITIAL_STEPS);
  const [progressPercent, setProgressPercent] = useState<number>(20);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const hasTriggeredCompleteRef = useRef<boolean>(false);
  const hasTriggeredFailedRef = useRef<boolean>(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
    onFailedRef.current = onFailed;
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const checkStatus = useCallback(async () => {
    if (!assessmentId) return;

    try {
      const assessment = await aiprepApi.getAssessment(assessmentId);
      if (!isMountedRef.current) return;

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
        return;
      }

      if (currentStatus === 'FAILED') {
        setIsFailed(true);
        setIsCompleted(false);
        setErrorMessage('Evaluation processing encountered an error.');
        if (!hasTriggeredFailedRef.current) {
          hasTriggeredFailedRef.current = true;
          if (onFailedRef.current) onFailedRef.current('Evaluation processing encountered an error.');
        }
        return;
      }

      // Status is EVALUATING or IN_PROGRESS - simulate smooth realistic step progression
      setProgressPercent((prev) => {
        const next = Math.min(92, prev + 12);
        if (next >= 40 && next < 60) {
          setSteps({
            stt: 'COMPLETED',
            audio: 'RUNNING',
            video: 'QUEUED',
            llm: 'QUEUED',
            finalize: 'QUEUED',
          });
        } else if (next >= 60 && next < 78) {
          setSteps({
            stt: 'COMPLETED',
            audio: 'COMPLETED',
            video: 'RUNNING',
            llm: 'QUEUED',
            finalize: 'QUEUED',
          });
        } else if (next >= 78) {
          setSteps({
            stt: 'COMPLETED',
            audio: 'COMPLETED',
            video: 'COMPLETED',
            llm: 'RUNNING',
            finalize: 'QUEUED',
          });
        }
        return next;
      });

      // Schedule next poll
      if (isMountedRef.current) {
        pollTimerRef.current = setTimeout(checkStatus, pollIntervalMs);
      }
    } catch (err: any) {
      console.warn('[ProcessingStatus Poll Note]:', err);
      // Retry poll even on temporary network hiccup
      if (isMountedRef.current) {
        pollTimerRef.current = setTimeout(checkStatus, pollIntervalMs);
      }
    }
  }, [assessmentId, pollIntervalMs]);

  useEffect(() => {
    if (!assessmentId) return;

    checkStatus();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [assessmentId, checkStatus]);

  return {
    status,
    steps,
    progressPercent,
    isCompleted,
    isFailed,
    errorMessage,
    refetch: checkStatus,
  };
}

export default useProcessingStatus;
