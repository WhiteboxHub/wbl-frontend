/**
 * AssessmentInfoModal Component
 *
 * Pixel-perfect assessment guidance modal matching the Whitebox reference layout:
 *   1. Clean Header: Assessment icon, type title, subtitle, clean '✕' close button
 *   2. Overview: Contextual paragraph explaining format and role expectations
 *   3. Purpose: Lavender card with purple target icon and 5 bullet points
 *   4. What to Cover: 3-column themed category cards (Blue, Green, Amber) with bulleted details
 *   5. Bottom Row: What to Expect list (4 items with icons) + Example walkthrough card
 *   6. Footer: Clean right-aligned purple "Got It" action button
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
  const iconProps = { className: "w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0" };
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
      title: 'Background & Experience',
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
      title: 'Execution & Quality',
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
    description: 'Watch an example introduction to see how to structure your response.',
    linkText: `View Example ${info.subtitle || 'Intro'} →`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl xl:max-w-[720px] max-h-[92vh] bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-2xl z-10 flex flex-col transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] dark:bg-purple-950/50 border border-[#E9D5FF] dark:border-purple-800/50 flex items-center justify-center text-[#7C3AED] dark:text-purple-400 shrink-0">
              {getAssessmentSymbol(type)}
            </div>
            <div>
              <h2 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                {info.modalHeader || `${info.title} Details`}
              </h2>
              <p className="text-xs sm:text-[13px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                {info.subtitle}
              </p>
            </div>
          </div>

          {/* Clean Close Icon (No circle background, just like reference) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 -mr-1 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
        <div ref={contentRef} className="px-6 py-2 overflow-y-auto space-y-3.5 max-h-[calc(92vh-125px)]">

          {/* 1. Overview Section */}
          <div className="space-y-1">
            <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">
              Overview
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
              {overviewText}
            </p>
          </div>

          {/* 2. Purpose Box */}
          <div className="rounded-2xl bg-[#FAF5FF] dark:bg-purple-950/25 border border-[#E9D5FF] dark:border-purple-900/40 p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-[#7C3AED] dark:text-purple-300">
              <Target className="w-4 h-4 text-[#7C3AED] dark:text-purple-400 stroke-[2.5]" />
              <span>Purpose</span>
            </div>
            <ul className="space-y-1 pl-0.5">
              {purposeBullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 leading-snug font-normal"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] dark:bg-purple-400 shrink-0 mt-1.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. What to Cover Section */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">
              What to Cover
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {coverCategories.map((category, idx) => {
                const isBlue = category.theme === 'blue';
                const isGreen = category.theme === 'green';
                const isAmber = category.theme === 'amber';

                const themeStyles = isBlue
                  ? {
                      container: 'bg-[#F0F7FF] dark:bg-blue-950/25 border-[#DBEAFE] dark:border-blue-900/40',
                      headerText: 'text-slate-900 dark:text-slate-100',
                      iconText: 'text-[#2563EB] dark:text-blue-400',
                    }
                  : isGreen
                  ? {
                      container: 'bg-[#F0FDF4] dark:bg-emerald-950/25 border-[#DCFCE7] dark:border-emerald-900/40',
                      headerText: 'text-slate-900 dark:text-slate-100',
                      iconText: 'text-[#16A34A] dark:text-emerald-400',
                    }
                  : {
                      container: 'bg-[#FFFBEB] dark:bg-amber-950/25 border-[#FEF08A] dark:border-amber-900/40',
                      headerText: 'text-slate-900 dark:text-slate-100',
                      iconText: 'text-[#D97706] dark:text-amber-400',
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
                          className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-200 leading-snug"
                        >
                          <span className="text-slate-800 dark:text-slate-300 font-bold shrink-0 text-sm leading-none">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0.5">

            {/* Left: What to Expect */}
            <div>
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                What to Expect
              </h3>
              <div className="space-y-2">
                {expectItems.map((item, idx) => {
                  const isDuration = item.text.startsWith('Duration:');
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200 font-normal"
                    >
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {getExpectIcon(item.icon)}
                      </div>
                      <span>
                        {isDuration ? (
                          <>
                            <strong className="font-semibold text-slate-900 dark:text-white">Duration:</strong>{' '}
                            {item.text.replace('Duration:', '').trim()}
                          </>
                        ) : (
                          item.text
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Example Card */}
            <div>
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                Example
              </h3>
              <div className="rounded-xl bg-[#FAF5FF] dark:bg-purple-950/25 border border-[#E9D5FF] dark:border-purple-900/40 p-3.5 flex flex-col justify-between h-[calc(100%-28px)]">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md text-[#7C3AED] dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                      {exampleData.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {exampleData.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelect) onSelect(type);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] dark:text-purple-400 group transition-colors cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4 text-[#7C3AED] dark:text-purple-400 group-hover:scale-105 transition-transform" />
                    <span>{exampleData.linkText}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 shrink-0 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              if (onSelect) onSelect(type);
              onClose();
            }}
            className="px-8 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all duration-200 shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};

export default AssessmentInfoModal;
