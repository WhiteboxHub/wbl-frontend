/**
 * AssessmentCard & AssessmentConfig Components
 * 
 * Target Workspace: wbl-frontend

 * 
 * Group all Step 1 Configuration (Select Scenario + Session Preferences) 
 * inside the AssessmentCard component with state-of-the-art rich UI design.
 */

import React, { useEffect, useState } from 'react';
import { AssessmentType, AssessmentCardMeta, buildAssessmentCardMetadata, aiprepApi, BACKEND_QUESTION_LIMITS, getDifficultySeconds } from '@/lib/aiprep-api';
import {
  MessageSquare,
  Briefcase,
  Users,
  Code,
  Layout,
  UserCheck,
  Mic,
  Camera,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const SUPPORTED_ASSESSMENT_TYPES: AssessmentType[] = [
  'GENERAL_INTRO',
  'JOB_DESCRIPTION_INTRO',
  'HR',
  'RECRUITER',
  'HIRING_MANAGER',
  'TECHNICAL',
  'SYSTEM_DESIGN',
];

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

  // Select vibrant gradient & icon based on scenario type
  const getIconConfig = () => {
    switch (type) {
      case 'GENERAL_INTRO':
        return {
          icon: <MessageSquare className="w-4 h-4 text-white" />,
          gradient: 'from-blue-600 to-indigo-600',
          accentColor: 'text-indigo-600 dark:text-indigo-400',
          badgeBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
        };
      case 'JOB_DESCRIPTION_INTRO':
        return {
          icon: <Briefcase className="w-4 h-4 text-white" />,
          gradient: 'from-amber-500 to-orange-600',
          accentColor: 'text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
        };
      case 'HR':
        return {
          icon: <Users className="w-4 h-4 text-white" />,
          gradient: 'from-emerald-500 to-teal-600',
          accentColor: 'text-teal-600 dark:text-teal-400',
          badgeBg: 'bg-teal-500/10 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400',
        };
      case 'TECHNICAL':
        return {
          icon: <Code className="w-4 h-4 text-white" />,
          gradient: 'from-indigo-600 to-violet-600',
          accentColor: 'text-violet-600 dark:text-violet-400',
          badgeBg: 'bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400',
        };
      case 'SYSTEM_DESIGN':
        return {
          icon: <Layout className="w-4 h-4 text-white" />,
          gradient: 'from-purple-600 to-pink-600',
          accentColor: 'text-purple-600 dark:text-purple-400',
          badgeBg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400',
        };
      case 'RECRUITER':
        return {
          icon: <UserCheck className="w-4 h-4 text-white" />,
          gradient: 'from-cyan-500 to-blue-600',
          accentColor: 'text-cyan-600 dark:text-cyan-400',
          badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400',
        };
      case 'HIRING_MANAGER':
        return {
          icon: <Users className="w-4 h-4 text-white" />,
          gradient: 'from-rose-500 to-pink-600',
          accentColor: 'text-rose-600 dark:text-rose-400',
          badgeBg: 'bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400',
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-white" />,
          gradient: 'from-slate-600 to-slate-800',
          accentColor: 'text-slate-600',
          badgeBg: 'bg-slate-500/10 text-slate-600',
        };
    }
  };

  const config = getIconConfig();

  return (
    <div
      onClick={() => !isLocked && onLaunch(type)}
      className={`p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[92px] relative group select-none ${
        isSelected
          ? 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-500/10 scale-[1.01]'
          : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
      } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient} shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-200`}>
          {config.icon}
        </div>

        {/* Selected Checkmark Badge */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          isSelected
            ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500 text-white shadow-sm'
            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 group-hover:border-indigo-400'
        }`}>
          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>

      <div className="mt-2 text-left space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight tracking-tight">
            {title}
          </span>
        </div>
        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
          {description}
        </p>
      </div>

      {/* Footer Meta Badges */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-[9.5px]">
        <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${config.badgeBg}`}>
          {questionCount}
        </span>
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3 text-slate-400" />
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
    indigo:  'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20',
    purple:  'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/20',
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

/* ── AssessmentConfig Container Component for Step 1 ───────────────────────── */
interface AssessmentConfigProps {
  assessmentType: string;
  setAssessmentType: (type: AssessmentType) => void;
  videoEnabled: boolean;
  setVideoEnabled: (enabled: boolean) => void;
  videoAnalyticsEnabled: boolean;
  setVideoAnalyticsEnabled: (enabled: boolean) => void;
  jdText: string;
  setShowJdModal: (show: boolean) => void;
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
}) => {
  const [dbQuestionCounts, setDbQuestionCounts] = useState<Record<string, number>>(BACKEND_QUESTION_LIMITS);
  const [dbAvgSeconds, setDbAvgSeconds] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadBackendQuestionCounts() {
      const categoryMap: Record<string, string> = {
        TECHNICAL: 'TECHNICAL',
        SYSTEM_DESIGN: 'SYSTEM_DESIGN',
        RECRUITER: 'RECRUITER',
        HIRING_MANAGER: 'HIRING_MANAGER',
        HR: 'BEHAVIORAL',
        GENERAL_INTRO: 'GENERAL',
        JOB_DESCRIPTION_INTRO: 'GENERAL',
      };
      
      const counts: Record<string, number> = { ...BACKEND_QUESTION_LIMITS };
      const avgSecs: Record<string, number> = {};

      await Promise.all(
        SUPPORTED_ASSESSMENT_TYPES.map(async (type) => {
          try {
            const cat = categoryMap[type] || type;
            const qList = await aiprepApi.getQuestions(cat as any);
            const backendLimit = BACKEND_QUESTION_LIMITS[type] || 5;
            if (qList && Array.isArray(qList) && qList.length > 0) {
              counts[type] = Math.min(qList.length, backendLimit);
              const totalSec = qList.reduce((sum, q) => sum + getDifficultySeconds(q.difficulty_level || undefined), 0);
              avgSecs[type] = Math.round(totalSec / qList.length);
            }
          } catch (err) {
            console.warn(`[AssessmentConfig] Failed to fetch count for ${type}:`, err);
          }
        })
      );
      setDbQuestionCounts(counts);
      setDbAvgSeconds(avgSecs);
    }
    loadBackendQuestionCounts();
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Section 1: Assessment Type Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              1. Select Interview Scenario
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Choose the evaluation round you want to practice with AI.
            </p>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/40">
            {SUPPORTED_ASSESSMENT_TYPES.length} Rounds Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {SUPPORTED_ASSESSMENT_TYPES.map((type) => {
            const cardMeta = buildAssessmentCardMetadata(type, dbQuestionCounts[type], dbAvgSeconds[type]);
            return (
              <AssessmentCard
                key={type}
                metadata={cardMeta}
                isSelected={assessmentType === type}
                onLaunch={(t) => setAssessmentType(t)}
              />
            );
          })}
        </div>
      </div>

      {/* Section 2: Session Preferences Grid */}
      <div className="space-y-3 pt-2">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            2. Session Preferences &amp; Media Setup
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Configure video recording, AI posture tracking, and optional job description tailoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          {/* Video Feed Card */}
          <div className={`p-3.5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between min-h-[95px] ${
            videoEnabled
              ? 'bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-blue-950/20 border-indigo-400 dark:border-indigo-700 shadow-sm'
              : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2.5 text-left">
                <div className={`p-2 rounded-xl shrink-0 ${videoEnabled ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Webcam Video Feed</span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">Record webcam streams for visual feedback.</span>
                </div>
              </div>

              <PreferenceToggle
                enabled={videoEnabled}
                onChange={() => {
                  const v = !videoEnabled;
                  setVideoEnabled(v);
                  if (!v) setVideoAnalyticsEnabled(false);
                }}
                activeLabel="ON"
                inactiveLabel="OFF"
                activeColor="indigo"
              />
            </div>

            <div className="mt-2 text-left">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                videoEnabled ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {videoEnabled ? 'Video & Audio Mode' : 'Audio-Only Mode'}
              </span>
            </div>
          </div>

          {/* Audio Recording Card (Always Mandatory) */}
          <div className={`p-3.5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between min-h-[95px] ${
            !videoEnabled
              ? 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20 border-emerald-400 dark:border-emerald-700 shadow-sm'
              : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2.5 text-left">
                <div className={`p-2 rounded-xl shrink-0 ${!videoEnabled ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">Vocal Audio Stream</span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">Capture microphone responses.</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-extrabold bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                ALWAYS ON
              </span>
            </div>

            <div className="mt-2 text-left">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                Required for AI Evaluation
              </span>
            </div>
          </div>

          {/* AI Vision Analytics (YOLO) Card */}
          <div className={`p-3.5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between min-h-[95px] ${
            videoAnalyticsEnabled && videoEnabled
              ? 'bg-gradient-to-br from-purple-50/70 via-white to-pink-50/40 dark:from-purple-950/30 dark:via-slate-900 dark:to-pink-950/20 border-purple-400 dark:border-purple-700 shadow-sm'
              : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2.5 text-left">
                <div className={`p-2 rounded-xl shrink-0 ${videoAnalyticsEnabled && videoEnabled ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">AI Vision Analytics</span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">YOLO head nod &amp; posture tracking.</span>
                </div>
              </div>

              <PreferenceToggle
                enabled={videoAnalyticsEnabled && videoEnabled}
                onChange={() => setVideoAnalyticsEnabled(!videoAnalyticsEnabled)}
                disabled={!videoEnabled}
                activeLabel="ON"
                inactiveLabel="OFF"
                activeColor="purple"
              />
            </div>

            <div className="mt-2 text-left flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                videoAnalyticsEnabled && videoEnabled
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                  : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {videoAnalyticsEnabled && videoEnabled ? 'Consent Required' : 'Disabled'}
              </span>
              {!videoEnabled && <span className="text-[9px] text-slate-400 italic">Requires Webcam</span>}
            </div>
          </div>

          {/* Job Description Card — Spans all columns */}
          <div className={`p-3.5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between min-h-[80px] md:col-span-3 ${
            jdText
              ? 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-orange-950/20 border-amber-400 dark:border-amber-700 shadow-sm'
              : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-left">
                <div className={`p-2 rounded-xl shrink-0 ${jdText ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block">
                    Target Job Description <span className="font-normal text-slate-400 text-[10.5px]">(Optional)</span>
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
                    Provide a target job description to tailor interview questions dynamically to your target role.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowJdModal(true)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm cursor-pointer transition-all duration-150 active:scale-95 whitespace-nowrap shrink-0"
              >
                {jdText ? 'Edit Job Description' : 'Upload Job Description'}
              </button>
            </div>

            <div className="mt-2 text-left flex justify-between items-center">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                jdText ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {jdText ? 'Custom JD Added ✓' : 'Default Profile Mode'}
              </span>
              {jdText && <span className="text-[9.5px] text-slate-400 italic max-w-md truncate">{jdText.substring(0, 80) + '...'}</span>}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AssessmentCard;
