'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { aiprepApi } from '@/lib/aiprep-api';
import type { ChunkStatus } from '@/types/aiprep';

export interface ChunkQueueItem {
  chunkIndex: number;
  blob: Blob;
  status: ChunkStatus;
  retryCount: number;
  isFinal: boolean;
  error?: string;
}

export interface UseChunkUploadQueueOptions {
  assessmentId: number;
  mediaType?: 'VIDEO' | 'AUDIO' | string;
  maxRetries?: number;
  onChunkUploaded?: (chunkIndex: number, isFinal: boolean) => void;
  onQueueComplete?: () => void;
  onUploadError?: (error: Error, chunkIndex: number) => void;
}

export interface UseChunkUploadQueueReturn {
  queue: ChunkQueueItem[];
  totalChunks: number;
  uploadedChunks: number;
  pendingChunks: number;
  failedChunks: number;
  isUploading: boolean;
  isComplete: boolean;
  enqueueChunk: (blob: Blob, chunkIndex: number, isFinal?: boolean) => void;
  retryFailedChunks: () => void;
  clearQueue: () => void;
}

export function useChunkUploadQueue({
  assessmentId,
  mediaType = 'VIDEO',
  maxRetries = 3,
  onChunkUploaded,
  onQueueComplete,
  onUploadError,
}: UseChunkUploadQueueOptions): UseChunkUploadQueueReturn {
  const [queue, setQueue] = useState<ChunkQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Use refs to avoid stale closure during async loops
  const queueRef = useRef<ChunkQueueItem[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Process next chunk in queue sequentially
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || !assessmentId) return;

    // Find next queued item or retryable failed item
    const nextIndex = queueRef.current.findIndex(
      (item) => item.status === 'queued'
    );

    if (nextIndex === -1) {
      setIsUploading(false);
      isProcessingRef.current = false;

      // Check if all chunks uploaded and the final chunk is included
      const hasFinal = queueRef.current.some((item) => item.isFinal && item.status === 'uploaded');
      const allDone = queueRef.current.length > 0 && queueRef.current.every((item) => item.status === 'uploaded');
      if (hasFinal && allDone && onQueueComplete) {
        onQueueComplete();
      }
      return;
    }

    isProcessingRef.current = true;
    setIsUploading(true);

    const currentItem = queueRef.current[nextIndex];
    queueRef.current[nextIndex] = { ...currentItem, status: 'uploading' };
    setQueue([...queueRef.current]);

    try {
      await aiprepApi.uploadChunk(
        assessmentId,
        currentItem.chunkIndex,
        currentItem.blob,
        mediaType,
        currentItem.isFinal
      );

      if (!isMountedRef.current) return;

      queueRef.current[nextIndex] = {
        ...queueRef.current[nextIndex],
        status: 'uploaded',
        error: undefined,
      };
      setQueue([...queueRef.current]);

      if (onChunkUploaded) {
        onChunkUploaded(currentItem.chunkIndex, currentItem.isFinal);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;

      const newRetryCount = currentItem.retryCount + 1;
      const willRetry = newRetryCount <= maxRetries;

      queueRef.current[nextIndex] = {
        ...queueRef.current[nextIndex],
        status: willRetry ? 'queued' : 'failed',
        retryCount: newRetryCount,
        error: err?.message || 'Chunk upload failed',
      };
      setQueue([...queueRef.current]);

      if (onUploadError) {
        onUploadError(err, currentItem.chunkIndex);
      }

      // Exponential backoff before processing next
      if (willRetry) {
        const backoffMs = Math.min(1000 * Math.pow(2, newRetryCount - 1), 8000);
        await new Promise((res) => setTimeout(res, backoffMs));
      }
    } finally {
      isProcessingRef.current = false;
      // Continue queue
      processQueue();
    }
  }, [assessmentId, mediaType, maxRetries, onChunkUploaded, onQueueComplete, onUploadError]);

  // Enqueue a chunk
  const enqueueChunk = useCallback(
    (blob: Blob, chunkIndex: number, isFinal: boolean = false) => {
      // Check if chunkIndex already in queue
      const existingIdx = queueRef.current.findIndex((item) => item.chunkIndex === chunkIndex);
      if (existingIdx !== -1) {
        // If final flag updated
        if (isFinal && !queueRef.current[existingIdx].isFinal) {
          queueRef.current[existingIdx].isFinal = true;
          setQueue([...queueRef.current]);
        }
        return;
      }

      const newItem: ChunkQueueItem = {
        chunkIndex,
        blob,
        status: 'queued',
        retryCount: 0,
        isFinal,
      };

      queueRef.current.push(newItem);
      setQueue([...queueRef.current]);

      // Trigger queue processing
      processQueue();
    },
    [processQueue]
  );

  // Retry any failed chunks
  const retryFailedChunks = useCallback(() => {
    let hasFailed = false;
    queueRef.current = queueRef.current.map((item) => {
      if (item.status === 'failed') {
        hasFailed = true;
        return { ...item, status: 'queued', retryCount: 0, error: undefined };
      }
      return item;
    });

    if (hasFailed) {
      setQueue([...queueRef.current]);
      processQueue();
    }
  }, [processQueue]);

  // Clear queue
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setQueue([]);
    setIsUploading(false);
    isProcessingRef.current = false;
  }, []);

  const totalChunks = queue.length;
  const uploadedChunks = queue.filter((i) => i.status === 'uploaded').length;
  const failedChunks = queue.filter((i) => i.status === 'failed').length;
  const pendingChunks = queue.filter((i) => i.status === 'queued' || i.status === 'uploading').length;
  const hasFinal = queue.some((i) => i.isFinal && i.status === 'uploaded');
  const isComplete = totalChunks > 0 && uploadedChunks === totalChunks && hasFinal;

  return {
    queue,
    totalChunks,
    uploadedChunks,
    pendingChunks,
    failedChunks,
    isUploading,
    isComplete,
    enqueueChunk,
    retryFailedChunks,
    clearQueue,
  };
}
export default useChunkUploadQueue;
