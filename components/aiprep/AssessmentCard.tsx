/**
 * AssessmentCard & AssessmentConfig Components
 *
 * Designed to strictly match the Whitebox Assessment Type selection screen:
 *   - Clean Heading: "Choose Your Assessment Type"
 *   - Subtitle: "Each assessment type is designed for a specific purpose. Select an assessment to continue, or click Info to understand what to expect."
 *   - Spacious 3x2 Grid of 6 assessment cards:
 *       1. Intro (Selected, 3–5 mins, "Info →" link, purple dot)
 *       2. JD Walkthrough (Locked, 3–5 mins, "Coming Soon" badge, "Info →" link)
 *       3. Recruiter (Locked, ~15 mins, "Coming Soon" badge, "Info →" link)
 *       4. Technical (Locked, ~15 mins, "Coming Soon" badge, "Info →" link)
 *       5. Hiring Manager (Locked, ~15 mins, "Coming Soon" badge, "Info →" link)
 *       6. System Design (Locked, ~15 mins, "Coming Soon" badge, "Info →" link)
 *   - Right-aligned purple "Next →" action button
 */

'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { AssessmentType } from '@/types/aiprep';
import {
  AssessmentCardMeta,
  buildAssessmentCardMetadata,
  ASSESSMENT_INFO_DETAILS,
} from './assessment-details';
import { AssessmentInfoModal } from './AssessmentInfoModal';

export const SUPPORTED_ASSESSMENT_TYPES: AssessmentType[] = [
  'INTRO',
  'JD_INTRO',
  'RECRUITER',
  'TECHNICAL',
  'HIRING_MANAGER',
  'SYSTEM_DESIGN',
];

interface DisplayAssessmentCard {
  type: AssessmentType;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  isLocked: boolean;
  lockBadge?: string;
  icon: React.ReactNode;
}

const DISPLAY_CARDS: DisplayAssessmentCard[] = [
  {
    type: 'INTRO',
    title: 'Intro',
    subtitle: 'Tell Me About Yourself',
    description: 'Background & Experience',
    duration: '3–5 mins',
    isLocked: false,
    icon: <MessageSquare className="w-5 h-5 stroke-[1.8]" />,
  },
  {
    type: 'JD_INTRO',
    title: 'JD Walkthrough',
    subtitle: 'Understand the Job & Fit',
    description: 'Job & Role Alignment',
    duration: '3–5 mins',
    isLocked: true,
    lockBadge: 'Coming Soon',
    icon: <FileText className="w-5 h-5 stroke-[1.8]" />,
  },
  {
    type: 'RECRUITER',
    title: 'Recruiter',
    subtitle: 'Recruiter Interview',
    description: 'Screening & Overview',
    duration: '~15 mins',
    isLocked: true,
    lockBadge: 'Coming Soon',
    icon: <UserCheck className="w-5 h-5 stroke-[1.8]" />,
  },
  {
    type: 'TECHNICAL',
    title: 'Technical',
    subtitle: 'Technical Interview',
    description: 'Core Skills & Concepts',
    duration: '~15 mins',
    isLocked: true,
    lockBadge: 'Coming Soon',
    icon: <Code2 className="w-5 h-5 stroke-[1.8]" />,
  },
  {
    type: 'HIRING_MANAGER',
    title: 'Hiring Manager',
    subtitle: 'Role Fit & Experience',
    description: 'Projects & Leadership',
    duration: '~15 mins',
    isLocked: true,
    lockBadge: 'Coming Soon',
    icon: <Users className="w-5 h-5 stroke-[1.8]" />,
  },
  {
    type: 'SYSTEM_DESIGN',
    title: 'System Design',
    subtitle: 'Design a Scalable System',
    description: 'Architecture & Design',
    duration: '~15 mins',
    isLocked: true,
    lockBadge: 'Coming Soon',
    icon: <Layers className="w-5 h-5 stroke-[1.8]" />,
  },
];

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
}) => {
  const [infoModalType, setInfoModalType] = useState<AssessmentType | null>(null);

  const handleTypeSelect = (type: AssessmentType, isLocked?: boolean) => {
    if (!isLocked) {
      setAssessmentType(type);
    } else {
      setInfoModalType(type);
    }
  };

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto py-1 sm:py-2 px-2 sm:px-4">

      {/* ── Page Heading matching screenshot ── */}
      <div className="mb-2.5 sm:mb-3">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
          Choose Your Assessment Type
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
          Each assessment type is designed for a specific purpose. Select an assessment to continue, or click <span className="font-semibold text-purple-600 dark:text-purple-400">Info</span> to understand what to expect.
        </p>
      </div>

      {/* ── Responsive 1-col (mobile) -> 2-col (tablet) -> 3-col (desktop) Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {DISPLAY_CARDS.map((card) => {
          const isSelected = assessmentType === card.type;

          return (
            <div
              key={card.type}
              onClick={() => handleTypeSelect(card.type, card.isLocked)}
              className={`relative rounded-xl p-3 sm:p-4 transition-all duration-200 cursor-pointer select-none flex flex-col justify-between min-h-[140px] sm:min-h-[154px] ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-2 border-[#7C3AED] dark:border-purple-500 ring-2 ring-purple-500/10 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
              }`}
            >
              {/* Top Row: Icon + Dot / Lock */}
              <div className="flex items-start justify-between">
                <div
                  className={`w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl flex items-center justify-center transition-colors ${
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
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-transparent mt-0.5 mr-0.5" />
                  )}
                </div>
              </div>

              {/* Middle: Title, Subtitle, Description */}
              <div className="mt-2 sm:mt-2.5">
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
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-normal line-clamp-2">
                  {card.description}
                </p>
              </div>

              {/* Bottom Row: Duration + Info Link / Coming Soon */}
              <div className="mt-2.5 pt-2 flex items-center justify-between border-t border-slate-100/70 dark:border-slate-800/60">
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoModalType(card.type);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] dark:text-purple-300 transition-colors cursor-pointer py-0.5"
                  >
                    <span>Info</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Right Action Button ── */}
      <div className="mt-3 sm:mt-4 pt-1 flex items-center justify-end">
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto px-7 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all duration-200 shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

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

export default AssessmentConfig;
