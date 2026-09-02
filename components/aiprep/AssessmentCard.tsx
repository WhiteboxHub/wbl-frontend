/**
 * AssessmentCard Component
 * 
 * Target Workspace: wbl-frontend
 * Primary Developer: Narasimha (FE1)
 * 
 * Renders an assessment card for the dashboard selection view.
 * 
 * Features:
 * - Mode badge: Shows VIDEO+AUDIO or AUDIO ONLY indicator per selected mode
 * - Selected highlight: Brand blue ring when this card's type is actively selected
 * - JD gate: Launch button disabled + tooltip shown when JD is required but not pasted
 */

import React from 'react';
import { AssessmentType, AssessmentMode } from '@/lib/aiprep-api';
import { Clock, Play, Pause, AlertCircle, FileText, Video, Mic, AlertTriangle, Sparkles, Lock } from 'lucide-react';

export interface AssessmentMetadata {
  type: AssessmentType;
  title: string;
  description: string;
  timeLimit: string;
  questionCount: string;
  pauseAllowed: boolean;
  requiresJd: boolean;
}

interface AssessmentCardProps {
  metadata: AssessmentMetadata;
  questionCountOverride?: string;
  onLaunch: (type: AssessmentType) => void;
  /** Whether this card is the actively selected/clicked one */
  isSelected?: boolean;
  /** Current JD text — used to gate the launch button for requiresJd cards */
  jdText?: string;
  /** Whether this module is locked until prerequisites are met */
  isLocked?: boolean;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  metadata,
  questionCountOverride,
  onLaunch,
  isSelected = false,
  jdText = '',
  isLocked = false,
}) => {
  const { type, title, description, timeLimit, questionCount, pauseAllowed, requiresJd } = metadata;

  // JD gate: disabled when card requires JD but none is pasted
  const isJdMissing = requiresJd && !jdText.trim();
  const isDisabled = isLocked || isJdMissing;

  return (
    <div
      className={`relative group overflow-hidden rounded-xl border bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-all duration-200 ${isLocked
        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
        : isSelected
          ? 'border-[#4A6CF7] ring-1 ring-[#4A6CF7]/30 shadow-md shadow-[#4A6CF7]/10'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-[#4A6CF7]/60 hover:shadow-md hover:shadow-slate-200/40 dark:hover:shadow-slate-950/40'
        }`}
    >
      {/* Decorative gradient glow on hover / selected */}
      {!isLocked && (
        <div
          className={`absolute -inset-px -z-10 rounded-xl bg-gradient-to-br transition-opacity duration-300 ${isSelected
            ? 'from-[#4A6CF7]/10 to-sky-600/10 opacity-100'
            : 'from-[#4A6CF7]/0 to-sky-600/0 opacity-0 group-hover:from-[#4A6CF7]/5 group-hover:to-sky-600/5 group-hover:opacity-100'
            }`}
        />
      )}

      <div className="flex flex-col h-full justify-between gap-2.5">
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-[#4A6CF7] dark:group-hover:text-indigo-400 transition-colors duration-200 truncate">
              {title}
            </h3>

            {/* Lock / JD Badge */}
            {isLocked ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
                <Lock className="w-3 h-3" /> Locked
              </span>
            ) : requiresJd ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                <FileText className="w-3 h-3" />
                Requires JD
              </span>
            ) : null}
          </div>

          {/* Mode badge */}
          <div className="mb-2 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isLocked
              ? 'text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700'
              : 'text-[#4A6CF7] dark:text-indigo-400 bg-[#4A6CF7]/10 dark:bg-indigo-950/40 border border-[#4A6CF7]/20 dark:border-indigo-800/40'
              }`}>
              <Sparkles className="w-3 h-3" />
              Interactive Simulation
            </span>

            {type === 'GENERAL_INTRO' && (
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                Unlocked
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-slate-550 dark:text-slate-400 text-xs line-clamp-2 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-200 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Telemetry / Meta Info */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#4A6CF7]" />
              <span>{timeLimit}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{questionCount}</span>
            </div>
            <div>
              {pauseAllowed ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Play className="w-3 h-3 fill-emerald-600 dark:fill-emerald-400" /> Pause OK
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                  <Pause className="w-3 h-3 fill-amber-600 dark:fill-amber-400" /> No Pause
                </span>
              )}
            </div>
          </div>

          {isLocked && (
            <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-[10px] font-semibold px-2.5 py-1 rounded-lg">
              <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" />
              <span className="truncate">Complete General Intro to unlock.</span>
            </div>
          )}

          {/* Launch Button */}
          <button
            onClick={() => !isDisabled && onLaunch(type)}
            disabled={isDisabled}
            className={`w-full relative flex items-center justify-center gap-1.5 rounded-lg font-bold py-2 px-3 text-xs transition-all duration-150 ${isDisabled
              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700/80 cursor-not-allowed'
              : 'bg-[#4A6CF7] hover:bg-[#3b5bd9] text-white shadow-sm hover:shadow-md cursor-pointer'
              }`}
          >
            {isLocked ? (
              <>
                <span>Locked</span>
                <span className="text-[10px] font-normal opacity-70">(Prerequisites Required)</span>
              </>
            ) : (
              <>
                <span>Start Practice</span>
                <Play className="w-3.5 h-3.5 fill-white" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AssessmentCard;
