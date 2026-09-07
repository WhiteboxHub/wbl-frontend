/**
 * AssessmentCard & AssessmentConfig Components
 *
 * Designed to strictly match the Whitebox Assessment Type selection screen:
 *   - Clean Heading: "Choose Your Assessment" with description subtitle
 *   - 2x2 Grid of spacious assessment cards:
 *       1. Intro (Selected, 3–5 mins, "Info →" link, purple radio)
 *       2. Technical (Locked, ~15 mins, "Coming Soon" badge)
 *       3. Hiring Manager (Locked, ~15 mins, "Coming Soon" badge)
 *       4. HR (Locked, ~15 mins, "Coming Soon" badge)
 *   - Info modals accessible for all assessment types
 *   - Right-aligned purple "Next →" action button
 */

'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Briefcase,
  Users,
  Code2,
  UserCheck,
  Target,
  Layers,
  Clock,
  Lock,
  ArrowRight,
  ChevronRight,
  Info,
  CheckCircle2,
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
  'TECHNICAL',
  'HIRING_MANAGER',
  'RECRUITER',
  'JD_INTRO',
  'SYSTEM_DESIGN',
];

interface DisplayAssessmentCard {
  type: AssessmentType;
  title: string;
  subtitle: string;
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
    duration: '3–5 mins',
    isLocked: false,
    icon: <MessageSquare className="w-6 h-6 stroke-[1.8]" />,
  },
  {
    type: 'TECHNICAL',
    title: 'Technical',
    subtitle: 'Technical Interview',
    duration: '~15 mins',
    isLocked: true,
    lockBadge: 'Coming Soon',
    icon: <Code2 className="w-6 h-6 stroke-[1.8]" />,
  },
  {
    type: 'HIRING_MANAGER',
    title: 'Hiring Manager',
    subtitle: 'Role Fit & Experience',
    duration: '~15 mins',
    isLocked: true,
    lockBadge: 'Coming Soon',
    icon: <Users className="w-6 h-6 stroke-[1.8]" />,
  },
  {
    type: 'RECRUITER',
    title: 'HR',
    subtitle: 'HR Interview',
    duration: '~15 mins',
    isLocked: true,
    lockBadge: 'Coming Soon',
    icon: <UserCheck className="w-6 h-6 stroke-[1.8]" />,
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
  const [showMoreTypes, setShowMoreTypes] = useState<boolean>(false);

  const handleTypeSelect = (type: AssessmentType, isLocked?: boolean) => {
    // If locked, allow previewing via Info modal or select if desired
    if (!isLocked) {
      setAssessmentType(type);
    } else {
      setInfoModalType(type);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-2 px-3 sm:px-6">

      {/* ── Page Heading matching screenshot ── */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Choose Your Assessment
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
          Each assessment type is designed to evaluate specific skills and what to expect.
        </p>
      </div>

      {/* ── 2x2 Grid of Assessment Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        {DISPLAY_CARDS.map((card) => {
          const isSelected = assessmentType === card.type;

          return (
            <div
              key={card.type}
              onClick={() => handleTypeSelect(card.type, card.isLocked)}
              className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer select-none flex flex-col justify-between min-h-[170px] sm:min-h-[185px] ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-2 border-[#7C3AED] dark:border-purple-500 ring-4 ring-purple-500/10 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-sm'
              }`}
            >
              {/* Top Row: Icon + Radio / Lock */}
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/40 text-[#7C3AED] dark:text-purple-300'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {card.icon}
                </div>

                {/* Right Status (Radio circle or Lock icon) */}
                <div>
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[#7C3AED] dark:border-purple-400 bg-white dark:bg-slate-900 flex items-center justify-center p-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] dark:bg-purple-400" />
                    </div>
                  ) : card.isLocked ? (
                    <div className="p-1 text-slate-400 dark:text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                  )}
                </div>
              </div>

              {/* Middle: Title & Subtitle */}
              <div className="mt-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {card.title}
                </h3>
                <p
                  className={`text-xs sm:text-sm mt-0.5 font-medium ${
                    isSelected
                      ? 'text-[#7C3AED] dark:text-purple-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {card.subtitle}
                </p>
              </div>

              {/* Bottom Row: Duration + Info Link / Coming Soon */}
              <div className="mt-5 pt-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{card.duration}</span>
                </span>

                <div className="flex items-center gap-2">
                  {card.lockBadge && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                      {card.lockBadge}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoModalType(card.type);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] dark:text-purple-300 transition-colors cursor-pointer"
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

      {/* ── Optional Specialized Tracks (JD Intro & System Design) ── */}
      <div className="mt-4 pt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowMoreTypes(!showMoreTypes)}
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#7C3AED] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>{showMoreTypes ? 'Hide' : 'More assessment options (JD Intro, System Design)'}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showMoreTypes ? 'rotate-90' : ''}`} />
        </button>

        {/* Media Mode Quick Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Mode:</span>
          <div className="inline-flex p-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setVideoEnabled(true)}
              className={`px-2.5 py-0.5 rounded-full font-semibold transition-all ${
                videoEnabled
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
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
              className={`px-2.5 py-0.5 rounded-full font-semibold transition-all ${
                !videoEnabled
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Audio Only
            </button>
          </div>
        </div>
      </div>

      {/* More Types Dropdown Grid */}
      {showMoreTypes && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 animate-in fade-in duration-200">
          {[
            {
              type: 'JD_INTRO' as AssessmentType,
              title: 'JD Intro',
              subtitle: 'Job Description Introduction',
              duration: '3–5 mins',
              icon: <Briefcase className="w-5 h-5 stroke-[1.8]" />,
            },
            {
              type: 'SYSTEM_DESIGN' as AssessmentType,
              title: 'System Design',
              subtitle: 'Design a Scalable System',
              duration: '~15 mins',
              icon: <Layers className="w-5 h-5 stroke-[1.8]" />,
            },
          ].map((card) => {
            const isSelected = assessmentType === card.type;
            return (
              <div
                key={card.type}
                onClick={() => handleTypeSelect(card.type, false)}
                className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-2 border-[#7C3AED] ring-4 ring-purple-500/10 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-purple-50 text-[#7C3AED]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {card.icon}
                  </div>
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[#7C3AED] bg-white flex items-center justify-center p-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {card.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {card.duration}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoModalType(card.type);
                    }}
                    className="text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Info</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Bottom Right Action Button (matching screenshot Next button) ── */}
      <div className="mt-6 pt-4 flex items-center justify-end">
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all duration-200 shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
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
