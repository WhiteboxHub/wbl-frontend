'use client';

import { useReducer, useRef, useCallback, useEffect } from 'react';
import { aiprepApi } from '@/lib/aiprep-api';

export interface ChunkQueueItem {
  chunkNumber: number;
  blob: Blob | null;
  status: 'queued' | 'uploading' | 'uploaded' | 'failed';
  retryCount: number;
  error?: string;
}

export interface ChunkUploadQueueState {
  queue: ChunkQueueItem[];
  totalUploaded: number;
  isUploading: boolean;
  hasErrors: boolean;
}

export interface UseChunkUploadQueueOptions {
  assessmentId: number;
  maxRetries?: number;
  onError?: (error: Error) => void;
}

export interface UseChunkUploadQueueReturn {
  state: ChunkUploadQueueState;
  enqueueChunk: (blob: Blob, chunkNumber: number) => void;
  retryFailedChunks: () => void;
  waitForAllUploads: () => Promise<void>;
  resetQueue: () => void;
}

type Action =
  | { type: 'ENQUEUE'; chunkNumber: number; blob: Blob }
  | { type: 'SET_STATUS'; chunkNumber: number; status: ChunkQueueItem['status']; error?: string }
  | { type: 'INCREMENT_RETRY'; chunkNumber: number }
  | { type: 'RESET_FAILED' }
  | { type: 'RESET_ALL' };

function queueReducer(state: ChunkUploadQueueState, action: Action): ChunkUploadQueueState {
  switch (action.type) {
    case 'ENQUEUE': {
      const exists = state.queue.some(c => c.chunkNumber === action.chunkNumber);
      if (exists) return state;

      const newItem: ChunkQueueItem = {
        chunkNumber: action.chunkNumber,
        blob: action.blob,
        status: 'queued',
        retryCount: 0,
      };

      const updatedQueue = [...state.queue, newItem];
      return {
        ...state,
        queue: updatedQueue,
        isUploading: true,
      };
    }

    case 'SET_STATUS': {
      const updatedQueue = state.queue.map(item => {
        if (item.chunkNumber === action.chunkNumber) {
          return {
            ...item,
            status: action.status,
            error: action.error,
            // Dereference blob on success to prevent memory bloat
            blob: action.status === 'uploaded' ? null : item.blob,
          };
        }
        return item;
      });

      const totalUploaded = updatedQueue.filter(i => i.status === 'uploaded').length;
      const isUploading = updatedQueue.some(i => i.status === 'uploading' || i.status === 'queued');
      const hasErrors = updatedQueue.some(i => i.status === 'failed');

      return {
        queue: updatedQueue,
        totalUploaded,
        isUploading,
        hasErrors,
      };
    }

    case 'INCREMENT_RETRY': {
      const updatedQueue = state.queue.map(item =>
        item.chunkNumber === action.chunkNumber
          ? { ...item, retryCount: item.retryCount + 1 }
          : item
      );
      return { ...state, queue: updatedQueue };
    }

    case 'RESET_FAILED': {
      const updatedQueue = state.queue.map(item =>
        item.status === 'failed'
          ? { ...item, status: 'queued' as const, retryCount: 0, error: undefined }
          : item
      );
      return {
        ...state,
        queue: updatedQueue,
        isUploading: true,
        hasErrors: false,
      };
    }

    case 'RESET_ALL':
      return {
        queue: [],
        totalUploaded: 0,
        isUploading: false,
        hasErrors: false,
      };

    default:
      return state;
  }
}

export function useChunkUploadQueue({
  assessmentId,
  maxRetries = 3,
  onError,
}: UseChunkUploadQueueOptions): UseChunkUploadQueueReturn {
  const [state, dispatch] = useReducer(queueReducer, {
    queue: [],
    totalUploaded: 0,
    isUploading: false,
    hasErrors: false,
  });

  const isProcessingRef = useRef<boolean>(false);
  const queueRef = useRef<ChunkQueueItem[]>(state.queue);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    queueRef.current = state.queue;
    onErrorRef.current = onError;
  });

  const processNextChunk = useCallback(async () => {
    if (isProcessingRef.current) return;

    const nextItem = queueRef.current.find(item => item.status === 'queued');
    if (!nextItem || !nextItem.blob) {
      isProcessingRef.current = false;
      return;
    }

    isProcessingRef.current = true;
    const { chunkNumber, blob, retryCount } = nextItem;

    dispatch({ type: 'SET_STATUS', chunkNumber, status: 'uploading' });

    try {
      await aiprepApi.uploadChunk(assessmentId, chunkNumber, blob);
      dispatch({ type: 'SET_STATUS', chunkNumber, status: 'uploaded' });
    } catch (err: any) {
      const errorMessage = err?.message || 'Chunk upload failed';

      if (retryCount < maxRetries) {
        dispatch({ type: 'INCREMENT_RETRY', chunkNumber });
        // Exponential backoff: 2s, 4s, 8s
        const backoffMs = Math.pow(2, retryCount + 1) * 1000;
        await new Promise(res => setTimeout(res, backoffMs));
        dispatch({ type: 'SET_STATUS', chunkNumber, status: 'queued' });
      } else {
        dispatch({
          type: 'SET_STATUS',
          chunkNumber,
          status: 'failed',
          error: `Chunk ${chunkNumber} failed after ${maxRetries} retries: ${errorMessage}`,
        });
        onErrorRef.current?.(new Error(`Failed to upload chunk ${chunkNumber}: ${errorMessage}`));
      }
    } finally {
      isProcessingRef.current = false;
      setTimeout(() => {
        processNextChunk();
      }, 50);
    }
  }, [assessmentId, maxRetries]);

  const enqueueChunk = useCallback(
    (blob: Blob, chunkNumber: number) => {
      dispatch({ type: 'ENQUEUE', chunkNumber, blob });
      setTimeout(() => {
        processNextChunk();
      }, 0);
    },
    [processNextChunk]
  );

  const retryFailedChunks = useCallback(() => {
    dispatch({ type: 'RESET_FAILED' });
    setTimeout(() => {
      processNextChunk();
    }, 0);
  }, [processNextChunk]);

  const waitForAllUploads = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const currentQueue = queueRef.current;
        const allUploaded = currentQueue.length > 0 && currentQueue.every(c => c.status === 'uploaded');
        const hasPermanentFailures = currentQueue.some(c => c.status === 'failed');

        if (allUploaded) {
          clearInterval(checkInterval);
          resolve();
        } else if (hasPermanentFailures) {
          clearInterval(checkInterval);
          reject(new Error('One or more media chunks failed to upload to storage.'));
        }
      }, 250);
    });
  }, []);

  const resetQueue = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  return {
    state,
    enqueueChunk,
    retryFailedChunks,
    waitForAllUploads,
    resetQueue,
  };
}
