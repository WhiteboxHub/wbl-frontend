/**
 * AssessmentInfoModal Component
 *
 * Clean, focused modal popup displaying distinct custom symbols, questions,
 * and descriptions for each assessment type.
 */

'use client';

import React, { useEffect } from 'react';
import {
  X,
  MessageSquare,
  Briefcase,
  UserCheck,
  Target,
  Code2,
  Layers,
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
  const iconProps = { className: "w-5 h-5 sm:w-6 sm:h-6 shrink-0 stroke-[2.2] text-[#7C3AED] dark:text-purple-400" };

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
  // Close on Escape key
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

  if (!isOpen || !type) return null;

  const info = ASSESSMENT_INFO_DETAILS[type];
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 dark:bg-slate-950/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-900/50 shadow-2xl z-10 p-6 sm:p-8 transform transition-all animate-in zoom-in-95 duration-200 text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Question Header with Type-Specific Purple Symbol */}
        <div className="flex items-center gap-2.5 text-[#7C3AED] dark:text-purple-400 pr-8">
          {getAssessmentSymbol(type)}
          <h2 className="text-base sm:text-lg font-bold tracking-tight">
            {info.modalQuestion}
          </h2>
        </div>

        {/* Description Text */}
        <p className="mt-4 text-xs sm:text-[13.5px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {info.modalDescription}
        </p>

        {/* Bottom Got It Button */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              if (onSelect) onSelect(type);
              onClose();
            }}
            className="px-6 py-2 rounded-full text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all shadow-md shadow-purple-500/20 active:scale-95 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentInfoModal;
