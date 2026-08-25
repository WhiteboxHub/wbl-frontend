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
import { Clock, Play, Pause, AlertCircle, FileText, Video, Mic, AlertTriangle, Sparkles } from 'lucide-react';

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
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  metadata,
  questionCountOverride,
  onLaunch,
  isSelected = false,
  jdText = '',
}) => {
  const { type, title, description, timeLimit, questionCount, pauseAllowed, requiresJd } = metadata;

  // JD gate: disabled when card requires JD but none is pasted
  const isJdMissing = requiresJd && !jdText.trim();

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl border bg-white dark:bg-slate-800 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50 ${isSelected
        ? 'border-[#4A6CF7] ring-2 ring-[#4A6CF7]/20 shadow-md shadow-[#4A6CF7]/15'
        : 'border-slate-200 dark:border-slate-700 hover:border-[#4A6CF7]/50'
        }`}
    >
      {/* Decorative gradient glow on hover / selected */}
      <div
        className={`absolute -inset-px -z-10 rounded-2xl bg-gradient-to-br transition-opacity duration-300 ${isSelected
          ? 'from-[#4A6CF7]/10 to-sky-600/10 opacity-100'
          : 'from-[#4A6CF7]/0 to-sky-600/0 opacity-0 group-hover:from-[#4A6CF7]/5 group-hover:to-sky-600/5 group-hover:opacity-100'
          }`}
      />

      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3 gap-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200 leading-tight">
              {title}
            </h3>

            {/* Requires JD badge */}
            {requiresJd && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-750 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 shrink-0">
                <FileText className="w-3.5 h-3.5" />
                Requires JD
              </span>
            )}
          </div>

          {/* Mode badge */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#4A6CF7] bg-[#4A6CF7]/10 border border-[#4A6CF7]/20 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Interactive Simulation
            </span>
          </div>

          {/* Description */}
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-3 group-hover:text-slate-600 dark:group-hover:text-slate-350 transition-colors duration-200 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Telemetry / Meta Info */}
        <div>
          <div className="grid grid-cols-2 gap-4 mb-6 border-t border-slate-100 dark:border-slate-700 pt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4A6CF7]" />
              <span>{timeLimit}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{questionCount}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              {pauseAllowed ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450">
                  <Play className="w-3.5 h-3.5 fill-emerald-600 dark:fill-emerald-450" /> Pausing Allowed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-450">
                  <Pause className="w-3.5 h-3.5 fill-amber-600 dark:fill-amber-450" /> No-Pause Simulation
                </span>
              )}
            </div>
          </div>

          {/* JD missing warning */}
          {isJdMissing && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-3 py-2 rounded-lg mb-3">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Paste a Job Description in the sidebar to unlock this module.
            </div>
          )}

          {/* Launch Button */}
          <button
            onClick={() => !isJdMissing && onLaunch(type)}
            disabled={isJdMissing}
            title={isJdMissing ? 'Paste a Job Description first to unlock this module' : undefined}
            className={`w-full relative flex items-center justify-center gap-2 rounded-xl font-semibold py-3 px-4 transition-all duration-200 active:scale-[0.98] ${isJdMissing
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
              : 'bg-[#4A6CF7] hover:bg-[#4A6CF7]/90 text-white shadow-lg shadow-[#4A6CF7]/20 hover:shadow-[#4A6CF7]/30'
              }`}
          >
            <span>Start Practice</span>
            <Play className={`w-4 h-4 ${isJdMissing ? 'fill-slate-400' : 'fill-white'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default AssessmentCard;
