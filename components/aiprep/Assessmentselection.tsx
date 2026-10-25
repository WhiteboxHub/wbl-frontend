'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  FileText,
  UserCheck,
  Code2,
  Users,
  Layers,
  Clock,
  Lock,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { AssessmentType } from '@/types/aiprep';
import { ASSESSMENT_INFO_DETAILS } from './assessment-details';
import { AssessmentInfoModal } from './AssessmentInfoModal';
import { AIPrepTelemetry } from '@/lib/telemetry';

export const SUPPORTED_ASSESSMENT_TYPES: AssessmentType[] = [
  'INTRO',
  'JD_INTRO',
  'RECRUITER',
  'TECHNICAL',
  'HIRING_MANAGER',
  'SYSTEM_DESIGN'
];

export interface DisplayAssessmentCard {
  type: AssessmentType;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  isLocked: boolean;
  lockBadge?: string;
  icon: React.ReactNode;
}

const CARD_ICONS: Record<AssessmentType, React.ReactNode> = {
  INTRO: <MessageSquare className="w-5 h-5 stroke-[1.8]" />,
  JD_INTRO: <FileText className="w-5 h-5 stroke-[1.8]" />,
  RECRUITER: <UserCheck className="w-5 h-5 stroke-[1.8]" />,
  TECHNICAL: <Code2 className="w-5 h-5 stroke-[1.8]" />,
  HIRING_MANAGER: <Users className="w-5 h-5 stroke-[1.8]" />,
  SYSTEM_DESIGN: <Layers className="w-5 h-5 stroke-[1.8]" />,
};

const SHORT_TITLES: Record<AssessmentType, string> = {
  INTRO: 'Intro',
  JD_INTRO: 'JD Walkthrough',
  RECRUITER: 'Recruiter',
  TECHNICAL: 'Technical',
  HIRING_MANAGER: 'Hiring Manager',
  SYSTEM_DESIGN: 'System Design',
};

const SHORT_DESCRIPTIONS: Record<AssessmentType, string> = {
  INTRO: 'Background & Experience',
  JD_INTRO: 'Job & Role Alignment',
  RECRUITER: 'Screening & Overview',
  TECHNICAL: 'Core Skills & Concepts',
  HIRING_MANAGER: 'Projects & Leadership',
  SYSTEM_DESIGN: 'Architecture & Design',
};

// Keep only the currently available assessment types unlocked.
export const UNLOCKED_ASSESSMENT_TYPES: AssessmentType[] = ['INTRO', 'JD_INTRO', 'TECHNICAL'];

export const DISPLAY_CARDS: DisplayAssessmentCard[] = SUPPORTED_ASSESSMENT_TYPES.map((type) => {
  const details = ASSESSMENT_INFO_DETAILS[type];
  const isUnlocked = UNLOCKED_ASSESSMENT_TYPES.includes(type);

  return {
    type,
    title: SHORT_TITLES[type] || details?.title || type,
    subtitle: details?.subtitle || '',
    description: SHORT_DESCRIPTIONS[type] || details?.shortDescription || '',
    duration: (details?.duration || '15 mins').replace('â€“', '-'),
    isLocked: !isUnlocked,
    lockBadge: isUnlocked ? undefined : 'Coming Soon',
    icon: CARD_ICONS[type] || <MessageSquare className="w-5 h-5 stroke-[1.8]" />,
  };
});

/* â”€â”€ Individual AssessmentCard Component â”€â”€ */
export interface AssessmentCardProps {
  card: DisplayAssessmentCard;
  isSelected?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
  onInfoClick?: () => void;
}

export function AssessmentCard({
  card,
  isSelected,
  isClickable,
  onClick,
  onInfoClick,
}: AssessmentCardProps) {
  if (!card) return null;

  const canClick = Boolean(isClickable && !card.isLocked);

  return (
    <div
      onClick={canClick ? onClick : undefined}
      className={`relative rounded-xl p-3 sm:p-3.5 transition-all duration-200 select-none flex flex-col justify-between min-h-[140px] sm:min-h-[150px] ${
        canClick ? 'cursor-pointer' : 'cursor-default'
      } ${
        isSelected
          ? 'bg-white dark:bg-slate-900 border-2 border-[#7C3AED] dark:border-purple-500 ring-2 ring-purple-500/10 shadow-xs'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
      }`}
    >
      {/* Top Row: Icon + Dot / Lock */}
      <div className="flex items-start justify-between">
        <div
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/40 text-[#7C3AED] dark:text-purple-300'
              : 'bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400'
          }`}
        >
          {card.icon}
        </div>

        {/* Right Status Indicator */}
        <div>
          {isSelected ? (
            <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] dark:bg-purple-400 mt-0.5 mr-0.5" />
          ) : card.isLocked ? (
            <div className="p-0.5 text-slate-400 dark:text-slate-500">
              <Lock className="w-3.5 h-3.5 stroke-[1.6]" />
            </div>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-transparent mt-0.5 mr-0.5" />
          )}
        </div>
      </div>

      {/* Middle: Title, Subtitle, Description */}
      <div className="mt-1.5 sm:mt-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
          {card.title}
        </h3>
        <p
          className={`text-xs font-semibold mt-0.5 leading-tight ${
            isSelected
              ? 'text-[#7C3AED] dark:text-purple-400'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {card.subtitle}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-normal line-clamp-1">
          {card.description}
        </p>
      </div>

      {/* Bottom Row: Duration + Info Link / Coming Soon */}
      <div className="mt-2 pt-2 flex items-center justify-between border-t border-slate-100/70 dark:border-slate-800/60">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{card.duration}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {card.lockBadge && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              {card.lockBadge}
            </span>
          )}
          {!card.isLocked && onInfoClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick();
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] dark:text-purple-300 transition-colors cursor-pointer py-0.5"
            >
              <span>Info</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* â”€â”€ AssessmentConfig Container Component for Step 1 â”€â”€ */
export interface AssessmentConfigProps {
  assessmentType: AssessmentType;
  setAssessmentType: (type: AssessmentType) => void;
  jdText?: string;
  setJdText?: (text: string) => void;
  onNext?: () => void;
  onCancel?: () => void;
}

export const AssessmentConfig: React.FC<AssessmentConfigProps> = ({
  assessmentType,
  setAssessmentType,
  jdText = '',
  setJdText,
  onNext,
  onCancel,
}) => {
  const [infoModalType, setInfoModalType] = useState<AssessmentType | null>(null);

  // Track Catalog Mount
  useEffect(() => {
    AIPrepTelemetry.trackAssessmentSelectionPage(AIPrepTelemetry.getResolvedCandidateId(), SUPPORTED_ASSESSMENT_TYPES);
  }, [SUPPORTED_ASSESSMENT_TYPES]);

  const handleTypeSelect = (type: AssessmentType, isLocked?: boolean) => {
    const card = DISPLAY_CARDS.find((c) => c.type === type);
    AIPrepTelemetry.trackAssessmentSelected({
      assessment_type: type,
      source_page: 'assessment-type-selection',
      is_locked: Boolean(isLocked),
      duration: card?.duration,
      lock_badge: card?.lockBadge,
    });

    if (!isLocked) {
      setAssessmentType(type);
      if (type !== 'JD_INTRO') {
        if (setJdText) setJdText('');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('aiprep_jd_text');
          sessionStorage.removeItem('aiprep_jd_filename');
          sessionStorage.removeItem('aiprep_jd_role');
          sessionStorage.removeItem('aiprep_jd_company');
        }
      }
    }
  };

  const handleInfoOpen = (type: AssessmentType) => {
    AIPrepTelemetry.trackAssessmentInfoViewed(AIPrepTelemetry.getResolvedCandidateId(), type);
    setInfoModalType(type);
  };

  const handleNextClick = () => {
    if (onNext) onNext();
  };

  return (
    <div className="w-full flex flex-col px-4 sm:px-6 lg:px-7 py-3 sm:py-4">
      {/* Header matching screenshot */}
      <div className="mb-2.5 sm:mb-3 shrink-0">
        <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
          Choose Your Assessment Type
        </h2>
        <p className="text-[10.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
          Each assessment type is designed for a specific purpose. Select an assessment to continue, or click <span className="font-semibold text-[#7C3AED] dark:text-purple-400">Info</span> to understand what to expect.
        </p>
      </div>

      {/* 6 Cards Grid (2 rows x 3 columns on lg, 2 cols on sm, 1 col on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {DISPLAY_CARDS.map((card) => {
          const isSelected = assessmentType === card.type;
          const isClickable = !card.isLocked;

          return (
            <AssessmentCard
              key={card.type}
              card={card}
              isSelected={isSelected}
              isClickable={isClickable}
              onClick={() => handleTypeSelect(card.type, card.isLocked)}
              onInfoClick={!card.isLocked ? () => setInfoModalType(card.type) : undefined}
            />
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-4 sm:mt-5 flex items-center justify-between gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm cursor-pointer shadow-2xs inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : <div />}

        {onNext && (
          <button
            type="button"
            onClick={handleNextClick}
            className="px-7 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all duration-200 shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* â”€â”€ Assessment Info Modal â”€â”€ */}
      <AssessmentInfoModal
        isOpen={infoModalType !== null && UNLOCKED_ASSESSMENT_TYPES.includes(infoModalType)}
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
        onSelect={(type) => {
          if (UNLOCKED_ASSESSMENT_TYPES.includes(type)) {
            setAssessmentType(type);
          }
          setInfoModalType(null);
        }}
      />


    </div>
  );
};

export default AssessmentCard;
