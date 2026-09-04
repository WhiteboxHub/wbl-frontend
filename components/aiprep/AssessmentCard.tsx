/**
 * AssessmentCard & AssessmentConfig Components
 * 
 * Target Workspace: wbl-frontend
 * 
 * Groups all Step 1 Configuration (Select Scenario + Session Preferences) 
 * inside the AssessmentCard component with state-of-the-art rich UI design.
 */

import React, { useEffect, useState } from 'react';
import { AssessmentType, AssessmentCardMeta, buildAssessmentCardMetadata, aiprepApi, getDifficultySeconds } from '@/lib/aiprep-api';
import {
  MessageSquare,
  Briefcase,
  Users,
  Code2,
  Puzzle,
  UserCheck,
  Target,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const SUPPORTED_ASSESSMENT_TYPES: AssessmentType[] = [
  'INTRO',
  'JD_INTRO',
  'RECRUITER',
  'HIRING_MANAGER',
  'TECHNICAL',
  'SYSTEM_DESIGN',
];

/**
 * Shared icon configuration helper for assessment types
 */
export const getAssessmentIconConfig = (type: AssessmentType) => {
  const defaultStyle = {
    gradient: 'bg-[#4A6CF7]/10 dark:bg-[#4A6CF7]/20',
    accentColor: 'text-[#4A6CF7] dark:text-blue-400',
    badgeBg: 'bg-blue-50 text-[#4A6CF7] border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/40',
  };

  switch (type) {
    case 'INTRO':
      return { ...defaultStyle, icon: <MessageSquare className="w-5 h-5 text-[#4A6CF7] dark:text-blue-400" /> };
    case 'JD_INTRO':
      return { ...defaultStyle, icon: <Briefcase className="w-5 h-5 text-[#4A6CF7] dark:text-blue-400" /> };
    case 'TECHNICAL':
      return { ...defaultStyle, icon: <Code2 className="w-5 h-5 text-[#4A6CF7] dark:text-blue-400" /> };
    case 'SYSTEM_DESIGN':
      return { ...defaultStyle, icon: <Puzzle className="w-5 h-5 text-[#4A6CF7] dark:text-blue-400" /> };
    case 'RECRUITER':
      return { ...defaultStyle, icon: <UserCheck className="w-5 h-5 text-[#4A6CF7] dark:text-blue-400" /> };
    case 'HIRING_MANAGER':
      return { ...defaultStyle, icon: <Target className="w-5 h-5 text-[#4A6CF7] dark:text-blue-400" /> };
    default:
      return { ...defaultStyle, icon: <MessageSquare className="w-5 h-5 text-[#4A6CF7] dark:text-blue-400" /> };
  }
};

interface AssessmentCardProps {
  metadata: AssessmentCardMeta;
  onLaunch: (type: AssessmentType) => void;
  isSelected?: boolean;
  isLocked?: boolean;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  metadata,
  onLaunch,
  isSelected = false,
  isLocked = false,
}) => {
  const { type, title, description, questionCount, timeLimit } = metadata;
  const config = getAssessmentIconConfig(type);

  return (
    <div
      onClick={() => !isLocked && onLaunch(type)}
      className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[65px] relative group select-none ${isSelected
        ? 'bg-white dark:bg-gray-900 border-2 border-indigo-600 dark:border-indigo-500 ring-4 ring-indigo-500/10 shadow-md scale-[1.01]'
        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-xs hover:shadow-md hover:-translate-y-0.5'
        } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-xl ${config.gradient} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
          {config.icon}
        </div>

        {/* Selected Checkmark Badge */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected
          ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500 text-white shadow-xs'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 group-hover:border-indigo-300'
          }`}>
          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>

      <div className="mt-2 text-left space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-gray-900 dark:text-white block leading-tight tracking-tight">
            {title}
          </span>
        </div>
        <p className="text-[10.5px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
          {description}
        </p>
      </div>

      {/* Footer Meta Badges */}
      <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-1 text-[9.5px]">
        {questionCount ? (
          <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${config.badgeBg}`}>
            {questionCount}
          </span>
        ) : <span />}
        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3 text-gray-400" />
          {timeLimit}
        </span>
      </div>
    </div>
  );
};

/* ── PreferenceToggle — Modern Pill-style button ── */
interface PreferenceToggleProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  activeColor?: 'emerald' | 'indigo' | 'purple';
}

const PreferenceToggle: React.FC<PreferenceToggleProps> = ({
  enabled,
  onChange,
  disabled = false,
  activeLabel = 'ON',
  inactiveLabel = 'OFF',
  activeColor = 'emerald',
}) => {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20',
    indigo: 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20',
    purple: 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/20',
  };

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={enabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150 select-none focus:outline-none active:scale-95
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${enabled
          ? colorMap[activeColor]
          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-slate-400'
        }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
      {enabled ? activeLabel : inactiveLabel}
    </button>
  );
};

/* ── AssessmentConfig Container Component for Step 1 ── */
interface AssessmentConfigProps {
  assessmentType: string;
  setAssessmentType: (type: AssessmentType) => void;
  videoEnabled: boolean;
  setVideoEnabled: (enabled: boolean) => void;
  videoAnalyticsEnabled: boolean;
  setVideoAnalyticsEnabled: (enabled: boolean) => void;
  jdText: string;
  setShowJdModal: (show: boolean) => void;
  onNext?: () => void;
  onCancel?: () => void;
  audioEnabled?: boolean;
  setAudioEnabled?: (enabled: boolean) => void;
  transcriptionEnabled?: boolean;
  setTranscriptionEnabled?: (enabled: boolean) => void;
}

export const AssessmentConfig: React.FC<AssessmentConfigProps> = ({
  assessmentType,
  setAssessmentType,
  videoEnabled,
  setVideoEnabled,
  videoAnalyticsEnabled,
  setVideoAnalyticsEnabled,
  jdText,
  setShowJdModal,
  onNext,
  onCancel,
}) => {
  const [dbQuestionCounts, setDbQuestionCounts] = useState<Record<string, number>>({});
  const [dbAvgSeconds, setDbAvgSeconds] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadBackendQuestionCounts() {
      const categoryMap: Record<string, string> = {
        TECHNICAL: 'TECHNICAL',
        SYSTEM_DESIGN: 'SYSTEM_DESIGN',
        RECRUITER: 'RECRUITER',
        HIRING_MANAGER: 'HIRING_MANAGER',
        INTRO: 'GENERAL',
        JD_INTRO: 'GENERAL',
      };

      const counts: Record<string, number> = {};
      const avgSecs: Record<string, number> = {};

      await Promise.all(
        SUPPORTED_ASSESSMENT_TYPES.map(async (type) => {
          try {
            const cat = categoryMap[type] || type;
            let res: any = await aiprepApi.getQuestions(cat as any);
            let qList: any[] = Array.isArray(res) ? res : (res?.items || []);
            let totalCount = typeof res === 'object' && typeof res?.total === 'number'
              ? res.total
              : qList.length;

            // If 0 questions returned for specific intro category, fallback to 'GENERAL' category in DB
            if (totalCount === 0 && (cat === 'INTRO' || cat === 'JD_INTRO')) {
              const fallbackRes: any = await aiprepApi.getQuestions('GENERAL' as any);
              const fallbackList: any[] = Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes?.items || []);
              totalCount = typeof fallbackRes === 'object' && typeof fallbackRes?.total === 'number'
                ? fallbackRes.total
                : fallbackList.length;
              qList = fallbackList;
            }

            counts[type] = totalCount;

            if (qList.length > 0) {
              const totalSec = qList.reduce((sum, q) => sum + getDifficultySeconds(q.difficulty_level || undefined), 0);
              avgSecs[type] = Math.round(totalSec / qList.length);
            }
          } catch (err) {
            console.warn(`Failed to fetch count for ${type}`, err);
            counts[type] = 0;
          }
        })
      );
      setDbQuestionCounts(counts);
      setDbAvgSeconds(avgSecs);
    }
    loadBackendQuestionCounts();
  }, []);

  const selectedMeta = buildAssessmentCardMetadata(
    (assessmentType as AssessmentType) || 'INTRO',
    dbQuestionCounts[assessmentType],
    dbAvgSeconds[assessmentType]
  );
  const selectedIconConfig = getAssessmentIconConfig((assessmentType as AssessmentType) || 'INTRO');

  return (
    <div className="w-full px-3.5 sm:px-5 py-2 space-y-3.5 animate-in fade-in duration-200">

      {/* ── Dropdown Select Section ── */}
      <div className="space-y-1.5">
        <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
          Select Assessment Type
        </label>

        <div className="relative">
          <select
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
            className="w-full appearance-none text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-3.5 pr-10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4A6CF7]/30 focus:border-[#4A6CF7] transition-all cursor-pointer shadow-xs"
          >
            {SUPPORTED_ASSESSMENT_TYPES.map((type) => {
              const meta = buildAssessmentCardMetadata(type, dbQuestionCounts[type], dbAvgSeconds[type]);
              return (
                <option key={type} value={type} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1">
                  {meta.questionCount ? `${meta.title} (${meta.questionCount})` : `${meta.title} (${meta.timeLimit})`}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <ChevronRight className="w-4 h-4 rotate-90 stroke-[2.5]" />
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Choose the evaluation scenario matching your target assessment stage. Each type evaluates specific dimensions.
        </p>
      </div>

      {/* ── Selected Type Details Row ── */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg ${selectedIconConfig.gradient} flex items-center justify-center shrink-0`}>
              {selectedIconConfig.icon}
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                {selectedMeta.title}
              </span>
              <span className="text-[11px] font-bold text-[#4A6CF7] dark:text-blue-400">
                {selectedMeta.questionCount ? `${selectedMeta.questionCount} · ` : ''}{selectedMeta.timeLimit} · {selectedMeta.pauseAllowed ? 'Pause OK' : 'No Pause'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium pt-1 border-t border-slate-200 dark:border-slate-800">
          {selectedMeta.description}
        </p>
      </div>

      {/* ── Option Rows (Preferences & Media Setup) ── */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4A6CF7] dark:text-blue-400" />
          Session Options &amp; Media Setup
        </h4>

        {/* Row 1: Recording Mode */}
        <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Recording Mode</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Audio-only is always supported</span>
          </div>

          <div className="inline-flex p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              type="button"
              onClick={() => setVideoEnabled(true)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${videoEnabled
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Video + Audio
            </button>
            <button
              type="button"
              onClick={() => {
                setVideoEnabled(false);
                setVideoAnalyticsEnabled(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${!videoEnabled
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Audio Only
            </button>
          </div>
        </div>

        {/* Row 2: Video Analytics */}
        <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Video Analytics</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Off by default (YOLO posture &amp; gaze)</span>
          </div>

          <PreferenceToggle
            enabled={videoAnalyticsEnabled && videoEnabled}
            onChange={() => setVideoAnalyticsEnabled(!videoAnalyticsEnabled)}
            disabled={!videoEnabled}
            activeLabel="ON"
            inactiveLabel="OFF"
            activeColor="indigo"
          />
        </div>

        {/* Row 3: Target Job Description (Visible only for JD_INTRO) */}
        {(assessmentType === 'JD_INTRO' || selectedMeta.requiresJd) && (
          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Target Job Description</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                {jdText ? 'Custom job description active ✓' : 'Provide target job description to tailor questions'}
              </span>
            </div>



            <button
              type="button"
              onClick={() => setShowJdModal(true)}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:border-[#4A6CF7] hover:text-[#4A6CF7] dark:hover:text-blue-400 shadow-xs cursor-pointer transition-all active:scale-95 whitespace-nowrap"
            >
              {jdText ? 'Edit Description' : 'Add Description'}
            </button>
          </div>
        )}
      </div>

      {/* ── Action Buttons Footer Row (Sticky for screen height fit) ── */}
      {(onNext || onCancel) && (
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 z-10 pt-2.5 pb-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm cursor-pointer"
            >
              Cancel
            </button>
          ) : <div />}

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 transition-all duration-200 shadow-md shadow-[#6C5CE7]/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Next: Consent</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      )}

    </div>
  );
};

export default AssessmentCard;
