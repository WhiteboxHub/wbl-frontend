/**
 * AssessmentInfoModal Component
 *
 * Fully viewport-optimized guidance modal for each assessment type.
 * Engineered to fit entirely within the browser viewport on all screen sizes
 * and zoom levels without any vertical scrolling.
 *
 * Displays:
 *   1. Compact header with icon, badge, duration, and title
 *   2. What is this assessment? overview box
 *   3. Key Areas You Can Cover (2-column pill grid)
 *   4. Tips for Best Performance (amber box with all 6 tips in 2 columns)
 *   5. Action buttons (Close + Continue with this Type) fully visible
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
  HelpCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Leaf,
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
  const iconProps = { className: "w-4 h-4 shrink-0 stroke-[2]" };

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

export const AssessmentInfoModal: React.FC<AssessmentInfoModalProps> = ({
  isOpen,
  type,
  onClose,
  onSelect,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on Escape key & lock scroll
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-10 p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card — wide & compact (max-w-2xl) positioned upward for optimal viewport balance */}
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center gap-2.5 px-4 sm:px-5 pt-3 pb-1.5 pr-12 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/40 flex items-center justify-center text-[#7C3AED] dark:text-purple-400 shrink-0 shadow-xs">
            {getAssessmentSymbol(type)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-extrabold tracking-wider uppercase bg-purple-50 dark:bg-purple-900/30 text-[#7C3AED] dark:text-purple-300 border border-purple-100 dark:border-purple-800/40">
                ASSESSMENT GUIDE
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-[#7C3AED] dark:text-purple-400" />
                {info.duration}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {info.title}
            </h2>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* ── Content (Ultra-compact, all visible at once) ── */}
        <div ref={contentRef} className="px-4 sm:px-5 py-1.5 space-y-2 shrink-0">

          {/* 1. What is this assessment? box */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/80 dark:border-purple-900/30 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-bold text-[#7C3AED] dark:text-purple-400">
              <HelpCircle className="w-3 h-3 shrink-0" />
              <span>{info.modalQuestion}</span>
            </div>
            <p className="text-[10px] sm:text-[10.5px] text-slate-600 dark:text-slate-300 leading-snug">
              {info.whatIsThis || info.modalDescription}
            </p>
          </div>

          {/* 2. Key Areas You Can Cover (2-column pill grid) */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              <BookOpen className="w-3 h-3 text-[#7C3AED] dark:text-purple-400 shrink-0" />
              <span>KEY AREAS YOU CAN COVER</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5">
              {info.keyTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-800 text-[10px] sm:text-[10.5px] font-medium text-slate-700 dark:text-slate-200"
                >
                  <div className="w-3 h-3 rounded-full border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-2 h-2 text-emerald-500" />
                  </div>
                  <span className="truncate">{topic}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Tips for Best Performance (Green "Positive & Motivating" card) */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-800/40 space-y-1">
            <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Tips for Best Performance</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-0.5">
              {info.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-1 text-[9.5px] sm:text-[10px] text-slate-700 dark:text-emerald-100/90 font-medium leading-tight"
                >
                  <span className="mt-0.5 text-emerald-600 dark:text-emerald-400 text-[9px] shrink-0">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-4 sm:px-5 pb-2.5 pt-1 shrink-0">
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSelect) onSelect(type);
                onClose();
              }}
              className="px-5 py-1.5 rounded-full text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all duration-200 shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Continue with this Type</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentInfoModal;
