/**
 * AssessmentCard & AssessmentConfig Components
 * 
 * Target Workspace: wbl-frontend
 * 
 * Card-based assessment type selector with "See Example" guidance modals
 * for all 6 assessment types. Each card educates the candidate about what
 * the assessment involves before they select it.
 */

import React, { useState } from 'react';
import {
  AssessmentType,
  AssessmentCardMeta,
  buildAssessmentCardMetadata,
  ASSESSMENT_INFO_DETAILS,
  aiprepApi,
  getDifficultySeconds,
} from '@/lib/aiprep-api';
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
  Info,
  HelpCircle,
  Layers,
  Eye,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { AssessmentInfoModal } from './AssessmentInfoModal';

export const SUPPORTED_ASSESSMENT_TYPES: AssessmentType[] = [
  'INTRO',
  'JD_INTRO',
  'RECRUITER',
  'HIRING_MANAGER',
  'TECHNICAL',
  'SYSTEM_DESIGN',
];

export const getAssessmentTypeSymbol = (type: AssessmentType) => {
  const iconProps = { className: "w-5 h-5 shrink-0 stroke-[2.2] text-[#7C3AED] dark:text-purple-400" };
  switch (type) {
    case 'INTRO':
      return <MessageSquare {...iconProps} />;
    case 'JD_INTRO':
      return <Briefcase {...iconProps} />;
    case 'RECRUITER':
      return <UserCheck {...iconProps} />;
    case 'HIRING_MANAGER':
      return <Target {...iconProps} />;
    case 'TECHNICAL':
      return <Code2 {...iconProps} />;
    case 'SYSTEM_DESIGN':
      return <Layers {...iconProps} />;
    default:
      return <MessageSquare {...iconProps} />;
  }
};

/**
 * Shared icon configuration helper for assessment types
 */
export const getAssessmentIconConfig = (type: AssessmentType) => {
  const defaultStyle = {
    gradient: 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20',
    accentColor: 'text-[#7C3AED] dark:text-purple-400',
    badgeBg: 'bg-purple-50 text-[#7C3AED] border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/40',
  };

  switch (type) {
    case 'INTRO':
      return { ...defaultStyle, icon: <MessageSquare className="w-5 h-5 text-[#7C3AED] dark:text-purple-400" /> };
    case 'JD_INTRO':
      return { ...defaultStyle, icon: <Briefcase className="w-5 h-5 text-[#7C3AED] dark:text-purple-400" /> };
    case 'TECHNICAL':
      return { ...defaultStyle, icon: <Code2 className="w-5 h-5 text-[#7C3AED] dark:text-purple-400" /> };
    case 'SYSTEM_DESIGN':
      return { ...defaultStyle, icon: <Layers className="w-5 h-5 text-[#7C3AED] dark:text-purple-400" /> };
    case 'RECRUITER':
      return { ...defaultStyle, icon: <UserCheck className="w-5 h-5 text-[#7C3AED] dark:text-purple-400" /> };
    case 'HIRING_MANAGER':
      return { ...defaultStyle, icon: <Target className="w-5 h-5 text-[#7C3AED] dark:text-purple-400" /> };
    default:
      return { ...defaultStyle, icon: <MessageSquare className="w-5 h-5 text-[#7C3AED] dark:text-purple-400" /> };
  }
};

interface AssessmentCardProps {
  metadata: AssessmentCardMeta;
  onLaunch: (type: AssessmentType) => void;
  onInfo?: (type: AssessmentType) => void;
  isSelected?: boolean;
  isLocked?: boolean;
}

export function getFormattedDisplayTime(type: AssessmentType): string {
  if (type === 'INTRO' || type === 'JD_INTRO') return '3–5 mins';
  return '~15 mins';
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  metadata,
  onLaunch,
  onInfo,
  isSelected = false,
  isLocked = false,
}) => {
  const { type, title, description } = metadata;
  const config = getAssessmentIconConfig(type);
  const displayTime = getFormattedDisplayTime(type);
  const info = ASSESSMENT_INFO_DETAILS[type];

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

        <div className="flex items-center gap-1">
          {onInfo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInfo(type);
              }}
              aria-label="View assessment details"
              className="p-1 rounded-full text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {/* Selected Checkmark Badge */}
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected
            ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500 text-white shadow-xs'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 group-hover:border-indigo-300'
            }`}>
            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>
      </div>

      <div className="mt-2 text-left space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-gray-900 dark:text-white block leading-tight tracking-tight">
            {info?.title || title}
          </span>
        </div>
        <p className="text-[10.5px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
          {info?.modalDescription || description}
        </p>
      </div>

      {/* Footer Meta Badges */}
      <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-1 text-[9.5px]">
        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3 text-gray-400" />
          {displayTime}
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
      disabled={disabled}
      onClick={onChange}
      className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider border transition-all cursor-pointer ${enabled ? colorMap[activeColor] || colorMap.emerald : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
    >
      {enabled ? activeLabel : inactiveLabel}
    </button>
  );
};

/* ── AssessmentConfig Container Component for Step 1 ── */
interface AssessmentConfigProps {
  assessmentType: AssessmentType;
  setAssessmentType: (type: AssessmentType) => void;
  videoEnabled: boolean;
  setVideoEnabled: (enabled: boolean) => void;
  videoAnalyticsEnabled: boolean;
  setVideoAnalyticsEnabled: (enabled: boolean) => void;
  jdText: string;
  setJdText?: (text: string) => void;
  setShowJdModal?: (show: boolean) => void;
  onNext?: () => void;
  onCancel?: () => void;
  dbQuestionCounts?: Record<string, number>;
  dbAvgSeconds?: Record<string, number>;
}

export const AssessmentConfig: React.FC<AssessmentConfigProps> = ({
  assessmentType,
  setAssessmentType,
  videoEnabled,
  setVideoEnabled,
  videoAnalyticsEnabled,
  setVideoAnalyticsEnabled,
  jdText,
  setJdText,
  setShowJdModal,
  onNext,
  onCancel,
  dbQuestionCounts = {},
  dbAvgSeconds = {},
}) => {
  const [infoModalType, setInfoModalType] = useState<AssessmentType | null>(null);

  const selectedMeta = buildAssessmentCardMetadata(
    assessmentType,
    dbQuestionCounts[assessmentType],
    dbAvgSeconds[assessmentType]
  );
  const selectedInfo = ASSESSMENT_INFO_DETAILS[assessmentType];
  const requiresJd = assessmentType === 'JD_INTRO';

  const handleTypeSelect = (type: AssessmentType) => {
    setAssessmentType(type);
  };

  return (
    <div className="space-y-2 max-w-4xl mx-auto">
      {/* ── Choose Assessment Type ── */}
      <div>
        <div className="mb-2 space-y-1.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Choose Your Assessment Type
          </h3>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
            <div className="w-4.5 h-4.5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lightbulb className="w-2.5 h-2.5 text-white" />
            </div>
            <p className="text-[10.5px] sm:text-[11px] text-slate-700 dark:text-slate-300 leading-normal">
              Select an assessment type to continue. Use <span className="font-bold text-[#7C3AED] dark:text-purple-300">Info</span> to learn about the purpose and format of each assessment.
            </p>
          </div>
        </div>

        {/* Assessment Cards Grid — 3 columns, ultra-compact */}
        <div className="grid grid-cols-3 gap-1.5">
          {SUPPORTED_ASSESSMENT_TYPES.map((type) => {
            const isSelected = assessmentType === type;
            const info = ASSESSMENT_INFO_DETAILS[type];
            const config = getAssessmentIconConfig(type);
            const displayTime = getFormattedDisplayTime(type);

            return (
              <div
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={`relative px-2.5 py-2 rounded-lg border transition-all duration-150 cursor-pointer group select-none ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-[#7C3AED] dark:border-purple-500 ring-2 ring-purple-500/15 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 shadow-xs hover:shadow-sm'
                }`}
              >
                {/* Top row: icon + title + radio */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-md ${config.gradient} flex items-center justify-center shrink-0`}>
                    <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{config.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10.5px] font-black text-slate-900 dark:text-white block leading-none tracking-tight uppercase truncate">
                      {type.replace('_', ' ')}
                    </span>
                    <span className="text-[9.5px] font-semibold text-[#7C3AED] dark:text-purple-300 block leading-none mt-0.5 truncate">
                      {info.subtitle}
                    </span>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'border-[#7C3AED] bg-[#7C3AED] dark:border-purple-500 dark:bg-purple-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Description — sharp, readable text color */}
                <p className="mt-1 text-[9.5px] font-medium text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">
                  {info.cardDescription}
                </p>

                {/* Footer: duration + info link */}
                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[8.5px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                    {displayTime}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoModalType(type);
                    }}
                    className="inline-flex items-center gap-0.5 text-[8.5px] font-bold text-[#7C3AED] dark:text-purple-300 hover:text-[#6D28D9] dark:hover:text-purple-200 transition-colors"
                  >
                    <Info className="w-2.5 h-2.5" />
                    <span>Info</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Session Options & Media Setup ── */}
      <div className="pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white tracking-tight mb-1.5 sm:mb-2">
          Session options &amp; media setup
        </h3>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* Recording Mode */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Recording</span>
            <div className="inline-flex p-0.5 rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setVideoEnabled(true)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  videoEnabled
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  !videoEnabled
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Audio Only
              </button>
            </div>
          </div>

          {/* JD (conditional) */}
          {(assessmentType === 'JD_INTRO' || selectedMeta.requiresJd) && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Job Description</span>
              <button
                type="button"
                onClick={() => setShowJdModal?.(true)}
                className="px-2.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 rounded-full hover:border-[#7C3AED] hover:text-[#7C3AED] dark:hover:text-purple-300 cursor-pointer transition-all"
              >
                {jdText ? 'Edit JD ✓' : 'Add JD'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      {(onNext || onCancel) && (
        <div className="pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
          ) : <div />}

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-1.5 rounded-full text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all duration-200 shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer"
            >
              Next
            </button>
          )}
        </div>
      )}

      {/* ── Assessment Info Modal ── */}
      <AssessmentInfoModal
        isOpen={infoModalType !== null}
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
        onSelect={(type) => {
          setAssessmentType(type);
          setInfoModalType(null);
        }}
      />
    </div>
  );
};

export default AssessmentCard;
