'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  aiprepApi,
  type ProcessingSteps,
  type ProcessingStatusResponse,
} from '@/lib/aiprep-api';

export interface UseProcessingStatusOptions {
  assessmentId: number | null;
  pollIntervalMs?: number;
  onCompleted?: () => void;
  onFailed?: (error: string) => void;
}

export interface UseProcessingStatusReturn {
  steps: ProcessingSteps;
  progressPercent: number;
  isCompleted: boolean;
  isFailed: boolean;
  errorMessage: string | null;
  refetch: () => Promise<void>;
}

const INITIAL_STEPS: ProcessingSteps = {
  stt: 'QUEUED',
  audio: 'QUEUED',
  vision: 'QUEUED',
  llm: 'QUEUED',
  finalize: 'QUEUED',
};

const STEP_WEIGHTS: Record<keyof ProcessingSteps, number> = {
  stt: 20,
  audio: 20,
  vision: 20,
  llm: 25,
  finalize: 15,
};

function calculateProgress(steps: ProcessingSteps): number {
  let progress = 0;
  for (const [key, weight] of Object.entries(STEP_WEIGHTS) as [keyof ProcessingSteps, number][]) {
    const status = steps[key];
    if (status === 'COMPLETED') {
      progress += weight;
    } else if (status === 'RUNNING') {
      progress += Math.round(weight * 0.4);
    }
  }
  return Math.min(100, Math.max(0, progress));
}

export function useProcessingStatus({
  assessmentId,
  pollIntervalMs = 5000,
  onCompleted,
  onFailed,
}: UseProcessingStatusOptions): UseProcessingStatusReturn {
  const [steps, setSteps] = useState<ProcessingSteps>(INITIAL_STEPS);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const hasTriggeredCompleteRef = useRef<boolean>(false);
  const hasTriggeredFailedRef = useRef<boolean>(false);

  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
    onFailedRef.current = onFailed;
  });

  const handleStatusUpdate = useCallback((data: ProcessingStatusResponse) => {
    if (!isMountedRef.current) return;

    if (data.steps) {
      setSteps(data.steps);
    }

    if (data.status === 'COMPLETED' || data.steps?.finalize === 'COMPLETED') {
      setIsCompleted(true);
      setIsFailed(false);
      if (!hasTriggeredCompleteRef.current) {
        hasTriggeredCompleteRef.current = true;
        onCompletedRef.current?.();
      }
    } else if (data.status === 'FAILED') {
      setIsFailed(true);
      const errorStr = data.error || 'Evaluation pipeline encountered a processing error.';
      setErrorMessage(errorStr);
      if (!hasTriggeredFailedRef.current) {
        hasTriggeredFailedRef.current = true;
        onFailedRef.current?.(errorStr);
      }
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!assessmentId) return;

    try {
      const data = await aiprepApi.getProcessingStatus(assessmentId);
      handleStatusUpdate(data);
    } catch (err: any) {
      if (isMountedRef.current && !isCompleted) {
        const msg = err?.message || 'Failed to poll processing status';
        setErrorMessage(msg);
      }
    }
  }, [assessmentId, handleStatusUpdate, isCompleted]);

  useEffect(() => {
    isMountedRef.current = true;
    hasTriggeredCompleteRef.current = false;
    hasTriggeredFailedRef.current = false;

    if (!assessmentId) return;

    fetchStatus();

    let unsubscribeSse: (() => void) | null = null;
    try {
      unsubscribeSse = aiprepApi.subscribeToProcessing(
        assessmentId,
        (data) => handleStatusUpdate(data),
        () => {
          // SSE failed or unsupported, fallback to polling
        }
      );
    } catch {
      // Fallback to polling
    }

    const pollingInterval = setInterval(() => {
      if (!isCompleted && !isFailed) {
        fetchStatus();
      }
    }, pollIntervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollingInterval);
      if (unsubscribeSse) unsubscribeSse();
    };
  }, [assessmentId, pollIntervalMs, fetchStatus, handleStatusUpdate, isCompleted, isFailed]);

  const progressPercent = calculateProgress(steps);

  return {
    steps,
    progressPercent,
    isCompleted,
    isFailed,
    errorMessage,
    refetch: fetchStatus,
  };
}
