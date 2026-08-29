'use client';

import React, { memo } from 'react';
import {
  IconCloudUpload,
  IconCheck,
  IconAlertTriangle,
  IconRefresh,
  IconLoader2,
} from '@tabler/icons-react';
import type { ChunkUploadQueueState } from '@/hooks/useChunkUploadQueue';

export interface ChunkedUploaderProps {
  uploadState: ChunkUploadQueueState;
  onRetryFailed?: () => void;
  compact?: boolean;
  isRecording?: boolean;
}

export const ChunkedUploader: React.FC<ChunkedUploaderProps> = memo(({
  uploadState,
  onRetryFailed,
  compact = false,
  isRecording = false,
}) => {
  const { queue, totalUploaded, isUploading, hasErrors } = uploadState;
  const totalChunks = queue.length;

  if (totalChunks === 0) {
    if (isRecording) {
      if (compact) {
        return (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-[#1D2144]/90 backdrop-blur-md rounded-xl border border-gray-200 dark:border-[#333756] text-xs font-medium text-gray-750 dark:text-gray-200 shadow-md"
          >
            <IconLoader2 className="w-3.5 h-3.5 text-primary animate-spin" aria-hidden="true" />
            <span>Recording answer...</span>
          </div>
        );
      }
      return (
        <div
          role="region"
          aria-label="Media Upload Progress Status"
          className="w-full p-4 bg-white/95 dark:bg-[#1D2144]/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-[#333756] shadow-xl space-y-3 transition-all text-gray-800 dark:text-gray-100"
        >
          <div className="flex items-center justify-between text-xs font-semibold tracking-wide">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <IconCloudUpload className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Cloud Sync (30s Chunks)</span>
            </div>
            <span className="font-mono text-gray-500 dark:text-gray-400">
              0 / 0 (0%)
            </span>
          </div>

          <div className="w-full h-2 bg-gray-100 dark:bg-[#121723] rounded-full overflow-hidden border border-gray-200/60 dark:border-transparent">
            <div
              role="progressbar"
              aria-valuenow={0}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-full bg-primary rounded-full"
              style={{ width: '0%' }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <IconLoader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Recording started... waiting for first 30s slice</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const percentComplete =
    totalChunks > 0 ? Math.round((totalUploaded / totalChunks) * 100) : 0;

  const uploadingChunk = queue.find(c => c.status === 'uploading');
  const failedChunks = queue.filter(c => c.status === 'failed');

  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={`Media upload progress: ${percentComplete}%`}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-[#1D2144]/90 backdrop-blur-md rounded-xl border border-gray-200 dark:border-[#333756] text-xs font-medium text-gray-700 dark:text-gray-200 shadow-md"
      >
        {isUploading ? (
          <IconLoader2 className="w-3.5 h-3.5 text-primary animate-spin" aria-hidden="true" />
        ) : hasErrors ? (
          <IconAlertTriangle className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
        ) : (
          <IconCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
        )}
        <span>
          {hasErrors
            ? 'Upload issue'
            : totalUploaded === totalChunks
              ? 'All media secured'
              : `Saving answer: ${percentComplete}%`}
        </span>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Media Upload Progress Status"
      className="w-full p-4 bg-white/95 dark:bg-[#1D2144]/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-[#333756] shadow-xl space-y-3 transition-all text-gray-800 dark:text-gray-100"
    >
      <div className="flex items-center justify-between text-xs font-semibold tracking-wide">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <IconCloudUpload className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>Cloud Sync (30s Chunks)</span>
        </div>
        <span className="font-mono text-gray-500 dark:text-gray-400">
          {totalUploaded} / {totalChunks} ({percentComplete}%)
        </span>
      </div>

      <div className="w-full h-2 bg-gray-100 dark:bg-[#121723] rounded-full overflow-hidden border border-gray-200/60 dark:border-transparent">
        <div
          role="progressbar"
          aria-valuenow={percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          className={`h-full transition-all duration-300 ease-out rounded-full ${hasErrors
              ? 'bg-rose-500'
              : percentComplete === 100
                ? 'bg-emerald-500'
                : 'bg-primary'
            }`}
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      <div
        aria-live="polite"
        className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
      >
        {uploadingChunk ? (
          <div className="flex items-center gap-1.5 text-primary font-medium">
            <IconLoader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            <span>Uploading chunk #{uploadingChunk.chunkNumber + 1}...</span>
          </div>
        ) : hasErrors ? (
          <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-medium">
            <IconAlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {failedChunks.length} chunk{failedChunks.length > 1 ? 's' : ''} failed
            </span>
          </div>
        ) : percentComplete === 100 ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <IconCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>All chunks secured in cloud storage</span>
          </div>
        ) : (
          <span>Waiting for next 30s slice...</span>
        )}

        {hasErrors && onRetryFailed && (
          <button
            type="button"
            onClick={onRetryFailed}
            aria-label="Retry failed chunk uploads"
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 font-medium rounded-lg border border-rose-500/30 transition-all active:scale-95"
          >
            <IconRefresh className="w-3 h-3" aria-hidden="true" />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
});

ChunkedUploader.displayName = 'ChunkedUploader';
