'use client';

import React from 'react';
import { Play, Pause, Square, AlertCircle, Circle } from 'lucide-react';
import type { AssessmentType } from '@/types/aiprep';
import { NO_PAUSE_ASSESSMENT_TYPES } from '@/types/aiprep';

export interface RecordingControlsProps {
  status: 'idle' | 'recording' | 'paused' | 'stopped' | 'error';
  assessmentType: AssessmentType | string;
  elapsedTime: number; // in seconds
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
  isUploading?: boolean;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}`;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  status,
  assessmentType,
  elapsedTime,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
  isUploading = false,
}) => {
  // Check if pause is permitted under contract
  const isPauseBlocked = NO_PAUSE_ASSESSMENT_TYPES.includes(assessmentType as AssessmentType);

  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 backdrop-blur-md rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
      {/* Timer and Status Indicator */}
      <div className="flex items-center space-x-3">
        {status === 'recording' ? (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-full">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">REC</span>
            <span className="text-white font-mono font-bold text-base pl-1">
              {formatDuration(elapsedTime)}
            </span>
          </div>
        ) : status === 'paused' ? (
          <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full">
            <Circle className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">PAUSED</span>
            <span className="text-amber-200 font-mono font-bold text-base pl-1">
              {formatDuration(elapsedTime)}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
            <Circle className="w-3 h-3 fill-slate-500 text-slate-500" />
            <span className="text-xs font-medium text-slate-400">STANDBY</span>
            <span className="text-slate-400 font-mono text-sm pl-1">00:00</span>
          </div>
        )}

        {isPauseBlocked && status === 'recording' && (
          <div className="hidden sm:flex items-center text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
            <span>Uninterrupted Session (No-Pause)</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {status === 'idle' && (
          <button
            type="button"
            id="start-recording-btn"
            onClick={onStart}
            disabled={disabled}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Recording</span>
          </button>
        )}

        {status === 'recording' && (
          <>
            {!isPauseBlocked && (
              <button
                type="button"
                id="pause-recording-btn"
                onClick={onPause}
                disabled={disabled}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium px-4 py-2.5 rounded-xl border border-amber-500/30 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              id="stop-recording-btn"
              onClick={onStop}
              disabled={disabled}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-red-900/30 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Finish Assessment</span>
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              type="button"
              id="resume-recording-btn"
              onClick={onResume}
              disabled={disabled}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Resume</span>
            </button>

            <button
              type="button"
              id="stop-paused-btn"
              onClick={onStop}
              disabled={disabled}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Finish Assessment</span>
            </button>
          </>
        )}

        {status === 'stopped' && (
          <div className="flex items-center space-x-2 text-slate-400 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
            {isUploading ? (
              <>
                <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-sm font-medium text-emerald-400">Finalizing media...</span>
              </>
            ) : (
              <span className="text-sm font-medium text-slate-300">Assessment Ended</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingControls;
