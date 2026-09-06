/**
 * AssessmentInfoModal Component
 *
 * Rich, multi-card assessment guidance modal matching the Whitebox design specification.
 * Renders identical structured sections across all 6 assessment types:
 *   1. Header: Assessment icon, type title, subtitle, close button
 *   2. Overview: Contextual paragraph explaining the format and goal
 *   3. Purpose: Highlight box with target icon and 5 bullet points
 *   4. What to Cover: 3-column themed category cards (Blue, Green, Amber) with bulleted details
 *   5. What to Expect & Example: 2-column layout with icon checklist + example walkthrough card
 *   6. Footer: "Got It" action button to confirm and proceed
 */

'use client';

import React, { useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Briefcase,
  UserCheck,
  Target,
  Code2,
  Layers,
  Clock,
  FileText,
  BarChart2,
  PlayCircle,
  User,
  Cpu,
  Settings,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  AssessmentType,
  ASSESSMENT_INFO_DETAILS,
} from '@/lib/aiprep-api';

interface AssessmentInfoModalProps {
  isOpen: boolean;
  type: AssessmentType | null;
  onClose: () => void;
  onSelect?: (type: AssessmentType) => void;
  isSelected?: boolean;
}

const getAssessmentSymbol = (type: AssessmentType) => {
  const iconProps = { className: "w-5 h-5 shrink-0 stroke-[2]" };

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

const getCategoryIcon = (iconName?: string) => {
  const iconProps = { className: "w-4 h-4 shrink-0 stroke-[2]" };
  switch (iconName?.toLowerCase()) {
    case 'user':
      return <User {...iconProps} />;
    case 'cpu':
      return <Cpu {...iconProps} />;
    case 'settings':
      return <Settings {...iconProps} />;
    case 'code':
    case 'code2':
      return <Code2 {...iconProps} />;
    case 'layers':
      return <Layers {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
};

const getExpectIcon = (iconName?: string) => {
  const iconProps = { className: "w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" };
  switch (iconName?.toLowerCase()) {
    case 'clock':
      return <Clock {...iconProps} />;
    case 'chat':
    case 'message':
      return <MessageSquare {...iconProps} />;
    case 'file':
      return <FileText {...iconProps} />;
    case 'chart':
      return <BarChart2 {...iconProps} />;
    default:
      return <CheckCircle2 {...iconProps} />;
  }
};

export const AssessmentInfoModal: React.FC<AssessmentInfoModalProps> = ({
  isOpen,
  type,
  onClose,
  onSelect,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on Escape key & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset scroll when type changes
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen, type]);

  if (!isOpen || !type) return null;

  const info = ASSESSMENT_INFO_DETAILS[type];
  if (!info) return null;

  // Fallback defaults if any type is missing specific extended arrays
  const overviewText = info.overview || info.whatIsThis || info.modalDescription;
  const purposeBullets = info.purposeBullets || [
    'Build a clear, confident, and structured response',
    'Highlight your professional background and domain expertise',
    'Demonstrate communication and critical thinking skills',
    'Showcase technical knowledge and practical experience',
    'Set the right impression for upcoming interview rounds',
  ];

  const coverCategories = info.coverCategories || [
    {
      title: 'Core Fundamentals',
      theme: 'blue' as const,
      icon: 'user',
      items: info.keyTopics.slice(0, 4),
    },
    {
      title: 'Technical Depth',
      theme: 'green' as const,
      icon: 'cpu',
      items: info.whatToCover.slice(0, 4),
    },
    {
      title: 'Execution & Delivery',
      theme: 'amber' as const,
      icon: 'settings',
      items: info.tips.slice(0, 4),
    },
  ];

  const expectItems = info.expectItems || [
    { icon: 'clock', text: `Duration: ${info.duration}` },
    { icon: 'chat', text: 'Conversational AI interviewer' },
    { icon: 'file', text: 'Questions based on the areas above' },
    { icon: 'chart', text: 'Real-time feedback after completion' },
  ];

  const exampleData = info.example || {
    title: `Example ${info.title} and Transcript`,
    description: 'Watch an example session to see how to structure your response.',
    linkText: `View Example ${info.subtitle || 'Session'} →`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-3xl lg:max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-4 sm:pt-5 pb-3 shrink-0 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800/50 flex items-center justify-center text-[#7C3AED] dark:text-purple-400 shrink-0 shadow-xs">
              {getAssessmentSymbol(type)}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {info.modalHeader || `${info.title} Details`}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                {info.subtitle}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
        <div ref={contentRef} className="px-5 sm:px-6 py-4 overflow-y-auto space-y-4 max-h-[calc(92vh-140px)]">

          {/* 1. Overview Section */}
          <div className="space-y-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Overview
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {overviewText}
            </p>
          </div>

          {/* 2. Purpose Box */}
          <div className="rounded-xl sm:rounded-2xl bg-[#FAF5FF] dark:bg-purple-950/25 border border-[#E9D5FF] dark:border-purple-900/40 p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#7C3AED] dark:text-purple-300">
              <Target className="w-4 h-4 text-[#7C3AED] dark:text-purple-400 stroke-[2.5]" />
              <span>Purpose</span>
            </div>
            <ul className="space-y-1.5 pl-0.5">
              {purposeBullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-[12.5px] text-slate-700 dark:text-slate-200 leading-relaxed font-normal"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] dark:bg-purple-400 shrink-0 mt-2" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. What to Cover Section */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              What to Cover
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {coverCategories.map((category, idx) => {
                const isBlue = category.theme === 'blue';
                const isGreen = category.theme === 'green';
                const isAmber = category.theme === 'amber';

                const themeStyles = isBlue
                  ? {
                      container: 'bg-[#F0F7FF] dark:bg-blue-950/25 border-[#BFDBFE] dark:border-blue-900/40',
                      headerText: 'text-[#1D4ED8] dark:text-blue-300',
                      iconText: 'text-[#2563EB] dark:text-blue-400',
                      bulletColor: 'text-[#2563EB] dark:text-blue-400',
                    }
                  : isGreen
                  ? {
                      container: 'bg-[#F0FDF4] dark:bg-emerald-950/25 border-[#BBF7D0] dark:border-emerald-900/40',
                      headerText: 'text-[#15803D] dark:text-emerald-300',
                      iconText: 'text-[#16A34A] dark:text-emerald-400',
                      bulletColor: 'text-[#16A34A] dark:text-emerald-400',
                    }
                  : {
                      container: 'bg-[#FFFBEB] dark:bg-amber-950/25 border-[#FDE68A] dark:border-amber-900/40',
                      headerText: 'text-[#B45309] dark:text-amber-300',
                      iconText: 'text-[#D97706] dark:text-amber-400',
                      bulletColor: 'text-[#D97706] dark:text-amber-400',
                    };

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3.5 flex flex-col ${themeStyles.container}`}
                  >
                    <div className={`flex items-center gap-2 text-xs font-bold ${themeStyles.headerText} mb-2`}>
                      <span className={themeStyles.iconText}>
                        {getCategoryIcon(category.icon)}
                      </span>
                      <span className="truncate">{category.title}</span>
                    </div>

                    <ul className="space-y-1.5 flex-1">
                      {category.items.map((item, itemIdx) => (
                        <li
                          key={itemIdx}
                          className="flex items-start gap-1.5 text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 leading-snug"
                        >
                          <span className={`font-bold shrink-0 text-sm leading-none ${themeStyles.bulletColor}`}>
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Bottom Row: What to Expect & Example */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">

            {/* Left: What to Expect */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-2.5">
                What to Expect
              </h3>
              <div className="space-y-2.5">
                {expectItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 text-xs sm:text-[12.5px] text-slate-700 dark:text-slate-200 font-medium"
                  >
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      {getExpectIcon(item.icon)}
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Example Card */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-2.5">
                Example
              </h3>
              <div className="rounded-xl bg-[#FAF5FF] dark:bg-purple-950/25 border border-[#E9D5FF] dark:border-purple-900/40 p-3.5 flex flex-col justify-between h-[calc(100%-28px)]">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {exampleData.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {exampleData.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Demo walkthrough action
                      if (onSelect) onSelect(type);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] dark:text-purple-400 group transition-colors cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4 text-[#7C3AED] dark:text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>{exampleData.linkText}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── Footer ── */}
        <div className="px-5 sm:px-6 py-3 shrink-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => {
              if (onSelect) onSelect(type);
              onClose();
            }}
            className="px-7 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all duration-200 shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};

export default AssessmentInfoModal;
