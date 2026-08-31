/**
 * AssessmentCard & AssessmentConfig Components
 * 
 * Target Workspace: wbl-frontend
 * Primary Developer: Narasimha (FE1)
 * 
 * Group all Step 1 Configuration (Select Scenario + Session Preferences) 
 * inside the AssessmentCard component to organize file structure and simplify the wizard.
 * 
 * Backend-verified preferences (only fields the backend actually accepts):
 *   - assessment_type   → POST /api/ai-prep/assessments
 *   - assessment_mode   → VIDEO_AUDIO | AUDIO_ONLY (derived from videoEnabled)
 *   - yolo_consent      → POST /api/ai-prep/consents (VIDEO_ANALYTICS)
 *   - job_description_text → POST /api/ai-prep/assessments (optional)
 * 
 * Removed: audio_enabled, transcription_enabled (backend has no fields for these)
 */

import React from 'react';
import { AssessmentType, AssessmentCardMeta, buildAssessmentCardMetadata } from '@/lib/aiprep-api';
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
  const { type, title, description } = metadata;

  // Select icon based on type
  const getIcon = () => {
    switch (type) {
      case 'GENERAL_INTRO':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'JOB_DESCRIPTION_INTRO':
        return <Briefcase className="w-4 h-4 text-amber-600" />;
      case 'HR':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'TECHNICAL':
        return <Code className="w-4 h-4 text-indigo-600" />;
      case 'SYSTEM_DESIGN':
        return <Layout className="w-4 h-4 text-purple-600" />;
      case 'RECRUITER':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'HIRING_MANAGER':
        return <Users className="w-4 h-4 text-pink-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div
      onClick={() => !isLocked && onLaunch(type)}
      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[82px] relative ${
        isSelected
          ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
      } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
          {getIcon()}
        </div>

        {/* Circular Radio Indicator */}
        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
          isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
        }`}>
          {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
        </div>
      </div>

      <div className="mt-1.5 text-left">
        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 block leading-tight">{title}</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight line-clamp-2">{description}</span>
      </div>
    </div>
  );
};

/* ── PreferenceToggle — Pill-style ON/OFF button replacing the broken switch ── */
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
    emerald: 'bg-emerald-500 text-white border-emerald-500',
    indigo:  'bg-indigo-600 text-white border-indigo-600',
    purple:  'bg-purple-600 text-white border-purple-600',
  };

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={enabled}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border transition-all duration-150 select-none focus:outline-none
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${enabled
          ? colorMap[activeColor]
          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-slate-400'
        }`}
    >
      {/* Dot indicator */}
      <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-white' : 'bg-slate-400'}`} />
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
  // Kept in props signature for wizard compatibility but not rendered (backend has no fields):
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
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Section 1: Assessment Type Selection */}
      <div className="space-y-2">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">1. Assessment Type</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Select the interview scenario you want to practice.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {SUPPORTED_ASSESSMENT_TYPES.map((type) => {
            const cardMeta = buildAssessmentCardMetadata(type);
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

      {/* Section 2: Session Preferences Grid — only backend-backed options */}
      <div className="space-y-2 pt-1">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">2. Session Preferences</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Choose how you want to record and what features to enable.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Video Feed Card */}
          <div className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between min-h-[88px] ${
            videoEnabled
              ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-700'
              : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2 text-left">
                <div className={`p-1.5 rounded-lg shrink-0 ${videoEnabled ? 'bg-indigo-500/15 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Video Feed</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">Record webcam video loops.</span>
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
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                videoEnabled ? 'bg-indigo-500/10 text-indigo-600' : 'bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {videoEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Audio-Only fallback notice card (always on when video is off) */}
          <div className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between min-h-[88px] ${
            !videoEnabled
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-700'
              : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2 text-left">
                <div className={`p-1.5 rounded-lg shrink-0 ${!videoEnabled ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Audio Recording</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">Capture vocal response streams.</span>
                </div>
              </div>

              {/* Always enabled — audio is mandatory */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border bg-emerald-500 text-white border-emerald-500 select-none">
                <span className="w-1 h-1 rounded-full bg-white" />
                ALWAYS ON
              </span>
            </div>

            <div className="mt-2 text-left">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                Required
              </span>
            </div>
          </div>

          {/* Video Analytics (YOLO) Card */}
          <div className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between min-h-[88px] ${
            videoAnalyticsEnabled && videoEnabled
              ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-400 dark:border-purple-700'
              : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2 text-left">
                <div className={`p-1.5 rounded-lg shrink-0 ${videoAnalyticsEnabled && videoEnabled ? 'bg-purple-500/15 text-purple-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Video Analytics</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">AI posture &amp; attention tracking.</span>
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
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                videoAnalyticsEnabled && videoEnabled
                  ? 'bg-purple-500/10 text-purple-600'
                  : 'bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {videoAnalyticsEnabled && videoEnabled ? 'Consent Required' : 'Disabled'}
              </span>
              {!videoEnabled && <span className="text-[8px] text-slate-400 italic">Requires Video</span>}
            </div>
          </div>

          {/* Job Description (Optional) Card — spans 3 columns */}
          <div className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between min-h-[76px] md:col-span-3 ${
            jdText
              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700'
              : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-2 text-left">
                <div className={`p-1.5 rounded-lg shrink-0 ${jdText ? 'bg-amber-500/15 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Job Description <span className="font-medium text-slate-400 text-[10px]">(Optional)</span></span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">Upload JD text to customize assessment prompts.</span>
                </div>
              </div>

              <button
                onClick={() => setShowJdModal(true)}
                className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 rounded-lg hover:border-indigo-500 hover:text-indigo-600 cursor-pointer transition-colors whitespace-nowrap"
              >
                {jdText ? 'Edit JD' : 'Upload JD'}
              </button>
            </div>

            <div className="mt-1.5 text-left flex justify-between items-center">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                jdText ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {jdText ? 'JD Added' : 'Optional'}
              </span>
              {jdText && <span className="text-[8px] text-slate-400 italic max-w-xs truncate">{jdText.substring(0, 60) + '...'}</span>}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AssessmentCard;
