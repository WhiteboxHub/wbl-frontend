'use client';

import React, { memo } from 'react';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconLoader2,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  type AssessmentType,
  NO_PAUSE_ASSESSMENT_TYPES,
} from '@/lib/aiprep-api';

export interface RecordingControlsProps {
  assessmentType: AssessmentType;
  recordingState: 'inactive' | 'recording' | 'paused';
  elapsedSeconds: number;
  maxSeconds?: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const RecordingControls: React.FC<RecordingControlsProps> = memo(({
  assessmentType,
  recordingState,
  elapsedSeconds,
  maxSeconds,
  onStart,
  onPause,
  onResume,
  onStop,
  isSubmitting = false,
  disabled = false,
}) => {
  const canPause = !NO_PAUSE_ASSESSMENT_TYPES.includes(assessmentType);
  const isOvertime = maxSeconds ? elapsedSeconds > maxSeconds : false;

  return (
    <div
      role="region"
      aria-label="Interview Recording Controls"
      className="flex flex-col items-center justify-center gap-3.5 p-4 bg-white/95 dark:bg-[#1D2144]/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-[#333756] shadow-xl transition-all"
    >
      <div className="flex items-center gap-3">
        <div
          role="timer"
          aria-live="off"
          aria-label={`Elapsed time: ${formatTime(elapsedSeconds)}`}
          className={`flex items-center gap-2 px-3.5 py-1 rounded-full font-mono text-sm font-semibold tracking-wider transition-colors ${isOvertime
              ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
              : recordingState === 'recording'
                ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : recordingState === 'paused'
                  ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-gray-100 dark:bg-[#121723] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#333756]'
            }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${recordingState === 'recording'
                ? 'bg-emerald-500 dark:bg-emerald-400 animate-ping'
                : recordingState === 'paused'
                  ? 'bg-amber-500 dark:bg-amber-400'
                  : 'bg-gray-400 dark:bg-slate-500'
              }`}
            aria-hidden="true"
          />
          <span>{formatTime(elapsedSeconds)}</span>
          {maxSeconds ? (
            <span className="text-gray-400 dark:text-slate-500 font-normal">
              / {formatTime(maxSeconds)}
            </span>
          ) : null}
        </div>

        {!canPause && (
          <div
            role="status"
            className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30"
          >
            <IconAlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span>Continuous flow (No pause)</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {recordingState === 'inactive' && (
          <button
            type="button"
            onClick={onStart}
            disabled={disabled || isSubmitting}
            aria-label="Start recording answer"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primarylight text-white font-medium rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconPlayerPlay className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>Start</span>
          </button>
        )}

        {recordingState === 'recording' && (
          <>
            {canPause && (
              <button
                type="button"
                onClick={onPause}
                disabled={disabled || isSubmitting}
                aria-label="Pause recording"
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#121723] dark:hover:bg-[#121723]/80 text-gray-800 dark:text-gray-200 font-medium rounded-xl border border-gray-300 dark:border-[#333756] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconPlayerPause className="w-4 h-4" aria-hidden="true" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              onClick={onStop}
              disabled={disabled || isSubmitting}
              aria-label="Finish answer and proceed"
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl shadow-lg shadow-rose-950/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <IconLoader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <IconPlayerStop className="w-4 h-4 fill-current" aria-hidden="true" />
              )}
              <span>Finish & Next</span>
            </button>
          </>
        )}

        {recordingState === 'paused' && (
          <>
            <button
              type="button"
              onClick={onResume}
              disabled={disabled || isSubmitting}
              aria-label="Resume recording"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconPlayerPlay className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Resume</span>
            </button>

            <button
              type="button"
              onClick={onStop}
              disabled={disabled || isSubmitting}
              aria-label="Finish answer and proceed"
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <IconLoader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <IconPlayerStop className="w-4 h-4 fill-current" aria-hidden="true" />
              )}
              <span>Finish & Next</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
});

RecordingControls.displayName = 'RecordingControls';
