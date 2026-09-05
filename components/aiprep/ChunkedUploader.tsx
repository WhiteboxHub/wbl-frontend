'use client';

import React, { memo } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export interface ChunkedUploaderProps {
  totalChunks: number;
  uploadedChunks: number;
  pendingChunks: number;
  failedChunks: number;
  isUploading: boolean;
  isComplete: boolean;
  onRetry?: () => void;
  className?: string;
}

export const ChunkedUploader: React.FC<ChunkedUploaderProps> = memo(({
  totalChunks,
  uploadedChunks,
  pendingChunks,
  failedChunks,
  isUploading,
  isComplete,
  onRetry,
  className = '',
}) => {
  if (totalChunks === 0) {
    return (
      <div className={`flex items-center space-x-2 text-xs text-slate-500 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-xl ${className}`}>
        <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
        <span>Media Slicer: Ready (30s chunks)</span>
      </div>
    );
  }

  const uploadPct = totalChunks > 0 ? Math.round((uploadedChunks / totalChunks) * 100) : 0;

  return (
    <div className={`flex items-center space-x-3 text-xs bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-md ${className}`}>
      {/* Upload icon / spinner */}
      {isComplete ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      ) : failedChunks > 0 ? (
        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
      ) : isUploading ? (
        <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : (
        <UploadCloud className="w-4 h-4 text-slate-400 flex-shrink-0" />
      )}

      {/* Progress text */}
      <div className="flex items-center space-x-2">
        <span className="font-medium text-slate-300">
          {isComplete ? (
            <span className="text-emerald-400 font-semibold">All media synced ({totalChunks} chunks)</span>
          ) : isUploading ? (
            <span>Syncing chunk {uploadedChunks + 1} of {totalChunks}...</span>
          ) : (
            <span>Uploaded {uploadedChunks}/{totalChunks} chunks ({uploadPct}%)</span>
          )}
        </span>

        {/* Mini progress bar */}
        {!isComplete && (
          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                failedChunks > 0 ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${uploadPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Retry button on error */}
      {failedChunks > 0 && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry ({failedChunks})</span>
        </button>
      )}
    </div>
  );
});

ChunkedUploader.displayName = 'ChunkedUploader';

export default ChunkedUploader;
