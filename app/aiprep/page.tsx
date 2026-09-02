/**
 * AIPrep Main Selector Dashboard Page
 * 
 * Target Workspace: wbl-frontend
 * Route: /aiprep
 * Primary Developer: Narasimha (FE1)
 * 
 * Lists previous assessment history and presents the 7 interview modules
 * with customizable modes and JD input.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { aiprepApi, Assessment, AssessmentType, QuestionCategory, buildAssessmentCardMetadata } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { Video, Mic, History, Sparkles, AlertTriangle, FileText, X, ArrowLeft, ArrowRight, Check, Lock, Play, ChevronDown, Settings, ChevronRight, CheckCircle2, Eye, PlayCircle } from 'lucide-react';
import { AssessmentMetadata } from '@/components/aiprep/AssessmentCard';

interface WblModeDropdownProps {
  value: 'VIDEO_AUDIO' | 'AUDIO_ONLY';
  onChange: (val: 'VIDEO_AUDIO' | 'AUDIO_ONLY') => void;
}

const WblModeDropdown: React.FC<WblModeDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm hover:border-[#4A6CF7]/60 focus:outline-none focus:ring-2 focus:ring-[#4A6CF7]/30 transition-all cursor-pointer whitespace-nowrap min-w-[140px]"
      >
        <span className="flex items-center gap-1.5">
          {value === 'VIDEO_AUDIO' ? (
            <>
              <Video className="w-3.5 h-3.5 text-[#4A6CF7]" />
              <span>Video & Audio</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-amber-500" />
              <span>Audio Only</span>
            </>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180 text-[#4A6CF7]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full min-w-[150px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div
            onClick={() => { onChange('VIDEO_AUDIO'); setIsOpen(false); }}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              value === 'VIDEO_AUDIO'
                ? 'bg-[#4A6CF7]/10 text-[#4A6CF7] dark:bg-[#4A6CF7]/20 dark:text-indigo-400 font-extrabold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-[#4A6CF7]" />
              <span>Video & Audio</span>
            </span>
            {value === 'VIDEO_AUDIO' && <Check className="w-3.5 h-3.5 text-[#4A6CF7]" />}
          </div>

          <div
            onClick={() => { onChange('AUDIO_ONLY'); setIsOpen(false); }}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              value === 'AUDIO_ONLY'
                ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 font-extrabold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-amber-500" />
              <span>Audio Only</span>
            </span>
            {value === 'AUDIO_ONLY' && <Check className="w-3.5 h-3.5 text-amber-500" />}
          </div>
        </div>
      )}
    </div>
  );
};

const ASSESSMENT_CARD_TYPES: AssessmentType[] = [
  'GENERAL_INTRO',
  'RECRUITER',
  'HIRING_MANAGER',
  'TECHNICAL',
  'SYSTEM_DESIGN',
  'HR',
];

const ASSESSMENT_CARDS_META: AssessmentMetadata[] = ASSESSMENT_CARD_TYPES.map((t) => buildAssessmentCardMetadata(t));

const mapAssessmentTypeToCategory = (type: AssessmentType): QuestionCategory => {
  switch (type) {
    case 'TECHNICAL': return 'TECHNICAL';
    case 'SYSTEM_DESIGN': return 'SYSTEM_DESIGN';
    case 'RECRUITER': return 'RECRUITER';
    case 'HIRING_MANAGER': return 'HIRING_MANAGER';
    case 'GENERAL_INTRO':
    case 'JOB_DESCRIPTION_INTRO':
      return 'GENERAL';
    case 'HR':
    default:
      return 'BEHAVIORAL';
  }
};

export default function AIPrepDashboard() {
  const router = useRouter();

  // Route Security Guard: Ensure candidate is logged in using existing apiFetch helper
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // App state
  const [jdText, setJdText] = useState<string>('');
  const [selectedType, setSelectedType] = useState<AssessmentType | null>(null);
  const [selectedModes, setSelectedModes] = useState<Record<string, 'VIDEO_AUDIO' | 'AUDIO_ONLY'>>({
    GENERAL_INTRO: 'VIDEO_AUDIO',
    RECRUITER: 'AUDIO_ONLY',
    HIRING_MANAGER: 'VIDEO_AUDIO',
    TECHNICAL: 'VIDEO_AUDIO',
    SYSTEM_DESIGN: 'VIDEO_AUDIO',
    HR: 'VIDEO_AUDIO',
  });
  // Filtered practice loops
  const filteredMeta = ASSESSMENT_CARDS_META;

  // 2-step setup wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [selectedIntroSubtype, setSelectedIntroSubtype] = useState<'GENERAL_INTRO' | 'JOB_DESCRIPTION_INTRO'>('GENERAL_INTRO');

  const [history, setHistory] = useState<Assessment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [questionCounts, setQuestionCounts] = useState<Record<string, string>>({});

  // Fetch actual live question counts from question bank API
  useEffect(() => {
    async function loadLiveQuestionCounts() {
      const counts: Record<string, string> = {};
      await Promise.all(
        ASSESSMENT_CARDS_META.map(async (meta) => {
          try {
            const category = mapAssessmentTypeToCategory(meta.type);
            const qList = await aiprepApi.getQuestions(category);
            if (qList && qList.length > 0) {
              const unit = meta.type === 'SYSTEM_DESIGN' ? 'Scenarios' : 'Questions';
              counts[meta.type] = `${qList.length} ${unit}`;
            }
          } catch (err) {
            console.warn(`Failed to fetch questions count for ${meta.type}:`, err);
          }
        })
      );
      setQuestionCounts(counts);
    }
    loadLiveQuestionCounts();
  }, []);

  // Embedded detection
  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    const embedded = window.self !== window.top || window.location.search.includes('embed=true');
    setIsEmbedded(embedded);
  }, []);

  const containerClasses = isEmbedded
    ? 'bg-transparent dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3.5 pt-2 pb-3 transition-colors duration-200'
    : 'min-h-screen bg-transparent dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-4 sm:py-6 px-3.5 sm:px-6 transition-colors duration-200';

  // Modal state
  const [showModeModal, setShowModeModal] = useState(false);
  const [pendingType, setPendingType] = useState<AssessmentType | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  // Table view toggle state (Manage AI Profile vs Assessment Table)
  const [showToolTable, setShowToolTable] = useState<boolean>(false);

  // Setup Prerequisites Verification State (Resume & LLM API Key)
  const [setupCheck, setSetupCheck] = useState<{
    isChecking: boolean;
    resumeUploaded: boolean;
    llmKeyConfigured: boolean;
    isComplete: boolean;
  }>({
    isChecking: true,
    resumeUploaded: false,
    llmKeyConfigured: false,
    isComplete: false,
  });

  // Verify WBL authentication & fetch live Assessment History using existing apiFetch
  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoadingHistory(true);
        const userResponse = await apiFetch("user_dashboard");
        const candidateId = userResponse?.candidate_id;
        setIsAuthenticated(true);

        if (candidateId) {
          const listData = await aiprepApi.listAssessments(candidateId, 50);
          if (listData?.items && listData.items.length > 0) {
            setHistory(listData.items);
          } else {
            setHistory([]);
          }
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.warn('[Security Guard]: Unauthenticated access to /aiprep via apiFetch. Redirecting to login.');
        router.replace('/login');
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadHistory();
  }, [router]);

  useEffect(() => {
    async function verifyAccountSetup() {
      try {
        setSetupCheck(prev => ({ ...prev, isChecking: true }));

        // 1. Check LLM Key in WBL Database
        let hasLlmKey = false;
        try {
          const keys: any = await apiFetch("coderpad/me/llm-keys");
          hasLlmKey = Array.isArray(keys) && keys.length > 0;
        } catch {
          // fallback
        }

        // 2. Check Resume from candidate_marketing DB table via user_dashboard & setup/init-and-summary
        let hasResume = false;
        try {
          const dash: any = await apiFetch("user_dashboard");
          const candidateId = dash?.candidate_id || dash?.basic_info?.id;
          const userEmail = dash?.email || dash?.basic_info?.email;

          if (
            dash?.has_resume === true ||
            Boolean(dash?.resume_filename) ||
            Boolean(dash?.binary_resume_filename) ||
            Boolean(dash?.resume_url) ||
            dash?.resume_json != null ||
            dash?.resume_data != null
          ) {
            hasResume = true;
          }

          // Fetch setup summary from candidate_marketing DB table via setup/init-and-summary
          if (candidateId || userEmail) {
            try {
              const prepToken = typeof window !== 'undefined' ? localStorage.getItem("prep_token") : null;
              const summaryData: any = await apiFetch("setup/init-and-summary", {
                method: "POST",
                body: JSON.stringify({
                  candidate_id: candidateId,
                  candidate_email: userEmail,
                  wbl_email: userEmail,
                  name: userEmail,
                  prep_token: prepToken,
                }),
              });

              const s = summaryData?.summary || summaryData;
              if (s) {
                if (
                  s.resume_text === "Exists" ||
                  s.has_resume === true ||
                  s.has_binary_resume === true ||
                  s.resume_uploaded === true ||
                  (s.resume_json != null && typeof s.resume_json === "object" && Object.keys(s.resume_json).length > 0)
                ) {
                  hasResume = true;
                }
                if (s.has_api_key === true || (Array.isArray(s.llm_keys) && s.llm_keys.length > 0)) {
                  hasLlmKey = true;
                }
                if (summaryData?.session_id && typeof window !== 'undefined') {
                  localStorage.setItem("prep_token", String(summaryData.session_id));
                }
              }
            } catch (err) {
              console.warn('[Setup summary fetch note]:', err);
            }
          }
        } catch (err) {
          console.warn('[Dashboard fetch note]:', err);
        }

        // 3. Fallback check with setup/setup-status API
        if (!hasResume || !hasLlmKey) {
          try {
            const statusData: any = await apiFetch("setup/setup-status");
            if (statusData) {
              if (
                statusData.resume_uploaded ||
                statusData.has_binary_resume ||
                statusData.has_resume ||
                statusData.resume_text === "Exists" ||
                (statusData.resume_json != null && typeof statusData.resume_json === "object")
              ) {
                hasResume = true;
              }
              if (statusData.api_keys_configured || statusData.has_api_key) {
                hasLlmKey = true;
              }
            }
          } catch {
            // ignore
          }
        }

        const isComplete = hasResume && hasLlmKey;
        setSetupCheck({
          isChecking: false,
          resumeUploaded: hasResume,
          llmKeyConfigured: hasLlmKey,
          isComplete: isComplete,
        });

      } catch (err) {
        console.warn('[Setup Verify Note]:', err);
        setSetupCheck(prev => ({ ...prev, isChecking: false }));
      }
    }
    verifyAccountSetup();
  }, []);

  // Module unlocking logic: unlocks ALL modules when both General Intro & Targeted JD Intro have status 'COMPLETED' in database
  const hasCompletedGeneral = history.some(item => item.assessment_type === 'GENERAL_INTRO' && item.status === 'COMPLETED');
  const hasCompletedJd = history.some(item => item.assessment_type === 'JOB_DESCRIPTION_INTRO' && item.status === 'COMPLETED');
  const completedIntroCount = (hasCompletedGeneral ? 1 : 0) + (hasCompletedJd ? 1 : 0);
  const isModulesUnlocked = hasCompletedGeneral && hasCompletedJd;

  const handleLaunchAssessment = (type: AssessmentType) => {
    setErrorMsg(null);
    setSelectedType(type);

    if (!setupCheck.isComplete) {
      setErrorMsg("Account Setup Incomplete: Please upload your Resume and configure an LLM API Key using the checklist banner above before starting practice.");
      return;
    }

    const chosenMode = selectedModes[type] || 'VIDEO_AUDIO';

    if (type === 'GENERAL_INTRO') {
      setSelectedIntroSubtype('GENERAL_INTRO');
      setWizardStep(1);
      setPendingType(type);
      setShowModeModal(true);
    } else {
      // Directly launch device check for Modules 2-6 using candidate's table-chosen mode
      confirmLaunch(chosenMode, type);
    }
  };

  const confirmLaunch = (mode: 'VIDEO_AUDIO' | 'AUDIO_ONLY', overrideType?: AssessmentType) => {
    const targetType = overrideType || pendingType;
    if (!targetType) return;
    setIsLaunching(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aiprep_active_type', targetType);
      sessionStorage.setItem('aiprep_active_mode', mode);
      sessionStorage.removeItem('aiprep_active_id');
      sessionStorage.removeItem('aiprep_consent_accepted');
      sessionStorage.removeItem('aiprep_yolo_consent');
      if (targetType === 'JOB_DESCRIPTION_INTRO') {
        sessionStorage.setItem('aiprep_jd_text', jdText);
      }
    }

    const targetUrl = isEmbedded ? '/aiprep/device-check?embed=true' : '/aiprep/device-check';

    router.push(targetUrl);
    setPendingType(null);
  };



  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-10 h-10 rounded-2xl bg-[#4A6CF7]/10 border border-[#4A6CF7]/20 flex items-center justify-center mb-3">
          <div className="w-5 h-5 border-2 border-[#4A6CF7] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verifying WBL authentication session...</p>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        {!isEmbedded && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-[#4A6CF7] text-xs font-semibold tracking-wider uppercase mb-1">
                <Sparkles className="w-4 h-4 text-[#4A6CF7] animate-pulse" />
                <span>Self-Improvement Platform</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                AIPrep Interview Practice
              </h1>
              <p className="text-slate-550 dark:text-slate-400 text-xs mt-1 max-w-xl leading-relaxed">
                Choose a realistic AI engineering interview simulation and receive private, actionable coaching after your session.
              </p>
            </div>
            <Link
              href="/user_dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all whitespace-nowrap self-start md:self-auto cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#4A6CF7]" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        )}

        {/* Errors banner */}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-xl mb-4 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MANAGE AI PROFILE SETUP CARD (Replaces table until candidate clicks Open AI PrepTool) */}
        {!showToolTable ? (
          <div className="max-w-4xl mx-auto py-4 sm:py-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 transition-colors">
              {/* Header Bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-violet-500" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-800 dark:text-white block">Manage AI Profile</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Configure your resume and API keys for AI interviews</p>
                  </div>
                </div>
                {setupCheck.isComplete && (
                  <button
                    type="button"
                    onClick={() => setShowToolTable(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 transition-colors px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg cursor-pointer"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Cards Grid */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* 1. Resume Status Card */}
                <div className={`flex-1 w-full flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                  setupCheck.resumeUploaded
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    setupCheck.resumeUploaded
                      ? 'bg-emerald-100 dark:bg-emerald-900/40'
                      : 'bg-amber-100 dark:bg-amber-900/40'
                  }`}>
                    {setupCheck.resumeUploaded ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resume</p>
                    <p className={`text-xs font-bold mt-0.5 ${
                      setupCheck.resumeUploaded ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {setupCheck.resumeUploaded ? 'Added' : 'Not added'}
                    </p>
                  </div>
                  {setupCheck.resumeUploaded ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.parent) {
                          window.parent.postMessage({ type: 'NAVIGATE_TAB', tab: 'my-resume' }, '*');
                        }
                        router.push('/dashboard?tab=my-resume');
                      }}
                      className="ml-auto flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors px-2.5 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Resume</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.parent) {
                          window.parent.postMessage({ type: 'NAVIGATE_TAB', tab: 'my-resume' }, '*');
                        }
                        router.push('/dashboard?tab=my-resume');
                      }}
                      className="ml-auto flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors px-2.5 py-1.5 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg cursor-pointer"
                    >
                      <span>Upload</span>
                    </button>
                  )}
                </div>

                {/* 2. API Keys Status Card */}
                <div className={`flex-1 w-full flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                  setupCheck.llmKeyConfigured
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    setupCheck.llmKeyConfigured
                      ? 'bg-emerald-100 dark:bg-emerald-900/40'
                      : 'bg-amber-100 dark:bg-amber-900/40'
                  }`}>
                    {setupCheck.llmKeyConfigured ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">API Keys</p>
                    <p className={`text-xs font-bold mt-0.5 ${
                      setupCheck.llmKeyConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {setupCheck.llmKeyConfigured ? 'Added' : 'Not added'}
                    </p>
                  </div>
                  {!setupCheck.llmKeyConfigured && (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.parent) {
                          window.parent.postMessage({ type: 'NAVIGATE_TAB', tab: 'my-llm-setup' }, '*');
                        }
                        router.push('/dashboard?tab=my-llm-setup');
                      }}
                      className="ml-auto flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors px-2.5 py-1.5 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg cursor-pointer"
                    >
                      <span>Configure</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Main Action Button */}
              <div className="flex-1 flex items-center justify-center mt-8">
                {setupCheck.isComplete ? (
                  <button
                    type="button"
                    onClick={() => setShowToolTable(true)}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-full text-sm transition-all shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Open AI PrepTool</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const targetTab = !setupCheck.resumeUploaded ? 'my-resume' : 'my-llm-setup';
                      if (typeof window !== 'undefined' && window.parent) {
                        window.parent.postMessage({ type: 'NAVIGATE_TAB', tab: targetTab }, '*');
                      }
                      router.push(`/dashboard?tab=${targetTab}`);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-br from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white font-bold rounded-full text-sm transition-all shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Complete Setup</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Assessment Modules Enterprise Data Table Matrix */
          <div className="space-y-4">
            
            {/* Header Banner with Back to AI Profile link */}
            <div className="relative flex items-center justify-between bg-white dark:bg-slate-800 px-4 sm:px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[52px]">
              <button
                type="button"
                onClick={() => setShowToolTable(false)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#4A6CF7] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>AI Profile</span>
              </button>

              <div className="hidden sm:inline-flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-none">
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                  AIPREP Assessment Practice
                  
                </span>
              </div>

              <span className="text-xs font-bold text-[#4A6CF7] bg-[#4A6CF7]/10 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl border border-[#4A6CF7]/20 shrink-0">
                6 Practice Loops Available
              </span>
            </div>

          {/* TABULAR DATA TABLE */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 select-none">
                    <th className="py-3.5 px-4 sm:px-6 w-[36%]">Practice Loop</th>
                    <th className="py-3.5 px-4 w-[16%]">Focus & Status</th>
                    <th className="py-3.5 px-4 w-[18%]">Time / Questions</th>
                    <th className="py-3.5 px-4 w-[18%]">Mode</th>
                    <th className="py-3.5 px-4 text-right w-[12%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {filteredMeta.map((meta, idx) => {
                    const isLocked = meta.type !== 'GENERAL_INTRO' && !isModulesUnlocked;
                    const isSelected = selectedType === meta.type;
                    const displayIndex = idx + 1;

                    // Dynamic time/questions and mode indicator
                    const timeText = `${meta.timeLimit} / ${questionCounts[meta.type] || meta.questionCount}`;
                    const isAudioOnlyMode = meta.type === 'RECRUITER';
                    const modeText = isAudioOnlyMode 
                      ? 'Audio Call Simulation'
                      : meta.type === 'TECHNICAL'
                      ? 'Video & Voice Coding'
                      : meta.type === 'SYSTEM_DESIGN'
                      ? 'Video & Whiteboard'
                      : 'Video & Audio Interview';

                    return (
                      <tr
                        key={meta.type}
                        onClick={() => setSelectedType(meta.type)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#4A6CF7]/10 dark:bg-[#4A6CF7]/15 font-medium'
                            : isLocked
                            ? 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40 opacity-80'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                        }`}
                      >
                        {/* 1. Practice Loop Title */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-start gap-3">
                            <span className="font-extrabold text-slate-400 dark:text-slate-500 text-xs shrink-0 mt-0.5">
                              {displayIndex}.
                            </span>
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-[#4A6CF7]">
                                {meta.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {meta.description}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Focus & Topics (Status Pill) */}
                        <td className="py-4 px-4 align-middle">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Locked</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#4A6CF7] px-3 py-1 rounded-lg shadow-sm shadow-[#4A6CF7]/25">
                              <Check className="w-3 h-3" />
                              <span>Unlocked</span>
                            </span>
                          )}
                        </td>

                        {/* 3. Time / Questions */}
                        <td className="py-4 px-4 align-middle">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                            {timeText}
                          </span>
                        </td>

                        {/* 4. Mode Selection Dropdown (Custom WBL Styled Component) */}
                        <td className="py-4 px-4 align-middle">
                          {meta.type === 'RECRUITER' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold shrink-0">
                              <Mic className="w-3.5 h-3.5" />
                              <span>Audio Only (Fixed)</span>
                            </span>
                          ) : (
                            <WblModeDropdown
                              value={selectedModes[meta.type] || 'VIDEO_AUDIO'}
                              onChange={(newMode) => {
                                setSelectedModes(prev => ({ ...prev, [meta.type]: newMode }));
                              }}
                            />
                          )}
                        </td>

                        {/* 5. Action Button */}
                        <td className="py-4 px-4 text-right align-middle">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isLocked) handleLaunchAssessment(meta.type);
                            }}
                            disabled={isLocked}
                            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                              isLocked
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                : 'bg-[#4A6CF7] hover:bg-[#3b5bd9] text-white hover:shadow-md cursor-pointer hover:scale-105 active:scale-95'
                            }`}
                          >
                            {isLocked ? (
                              <span>Locked</span>
                            ) : (
                              <>
                                <span>Start Practice</span>
                                <Play className="w-3 h-3 fill-white" />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer Bar with Next Button as requested */}
            <div className="bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Selected: <strong className="text-slate-800 dark:text-white font-bold">{selectedType ? ASSESSMENT_CARDS_META.find(m => m.type === selectedType)?.title : 'General & Job Description Intro'}</strong>
              </span>

              <button
                onClick={() => {
                  const targetType = selectedType || 'GENERAL_INTRO';
                  const isLocked = targetType !== 'GENERAL_INTRO' && !isModulesUnlocked;
                  if (!isLocked) {
                    handleLaunchAssessment(targetType);
                  } else {
                    handleLaunchAssessment('GENERAL_INTRO');
                  }
                }}
                className="inline-flex items-center gap-2 bg-[#4A6CF7] hover:bg-[#3b5bd9] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-[#4A6CF7]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

            {/* Recent Practice History section */}
            <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-[#4A6CF7]" />
                  <span>Recent Practice History</span>
                </h3>
                {history.length > 0 && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    Latest {Math.min(history.length, 5)}
                  </span>
                )}
              </div>

              {isLoadingHistory ? (
                <div className="space-y-2 py-1">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-10 bg-slate-100 dark:bg-slate-950 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {history.slice(0, 6).map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all ${item.status === 'COMPLETED' ? 'hover:border-[#4A6CF7]/50 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/80' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.assessment_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                          item.status === 'FAILED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
                            'bg-sky-500/10 border-sky-500/20 text-sky-600 animate-pulse'
                          }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                  No practice sessions recorded yet. Launch your first session!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive 2-Step Practice Setup Wizard Modal */}
      {showModeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-8 relative animate-zoom-in overflow-hidden">
            {isLaunching ? (
              <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-200">
                <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-[#4A6CF7] animate-spin mb-6" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Initializing Setup Wizard</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs text-center mt-2">Preparing device check and environment consent...</p>
              </div>
            ) : (
              <>
                {/* Close modal button */}
                <button
                  onClick={() => { setShowModeModal(false); setPendingType(null); setWizardStep(1); }}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 z-10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Wizard Step Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A6CF7]">
                      {pendingType === 'GENERAL_INTRO' ? `Step ${wizardStep} of 2` : 'Setup Practice Mode'}
                    </span>
                    {pendingType === 'GENERAL_INTRO' && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        {wizardStep === 1 ? 'Format Selection' : 'Mode Selection'}
                      </span>
                    )}
                  </div>
                  {pendingType === 'GENERAL_INTRO' && (
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-[#4A6CF7] transition-all duration-300 rounded-full"
                        style={{ width: wizardStep === 1 ? '50%' : '100%' }}
                      />
                    </div>
                  )}
                </div>

                {/* STEP 1: Format Selection (Only for GENERAL_INTRO) */}
                {pendingType === 'GENERAL_INTRO' && wizardStep === 1 ? (
                  <div className="animate-fade-in space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Step 1: Select Introduction Format
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                        Choose whether to practice a general introduction or tailor questions to a specific job description.
                      </p>
                    </div>

                    {/* Step 1 Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Card A: General Intro */}
                      <div
                        onClick={() => setSelectedIntroSubtype('GENERAL_INTRO')}
                        className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer text-left flex flex-col justify-between ${selectedIntroSubtype === 'GENERAL_INTRO'
                          ? 'border-[#4A6CF7] bg-blue-50/50 dark:bg-blue-950/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                          }`}
                      >
                        {selectedIntroSubtype === 'GENERAL_INTRO' && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-[#4A6CF7] text-white rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                            General Intro
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Standard background intro covering your past projects, interests, and experience overview.
                          </p>
                        </div>
                      </div>

                      {/* Card B: Targeted JD Intro */}
                      <div
                        onClick={() => setSelectedIntroSubtype('JOB_DESCRIPTION_INTRO')}
                        className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer text-left flex flex-col justify-between ${selectedIntroSubtype === 'JOB_DESCRIPTION_INTRO'
                          ? 'border-[#4A6CF7] bg-blue-50/50 dark:bg-blue-950/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                          }`}
                      >
                        {selectedIntroSubtype === 'JOB_DESCRIPTION_INTRO' && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-[#4A6CF7] text-white rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5" />
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                            Targeted Job Description Intro
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Tailor intro questions dynamically to match your target job description requirements.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Inline JD Textarea Box when Targeted JD is chosen */}
                    {selectedIntroSubtype === 'JOB_DESCRIPTION_INTRO' && (
                      <div className="pt-2 animate-fade-in">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#4A6CF7]" />
                          <span>Paste Target Job Description <span className="text-rose-500">*</span></span>
                        </label>
                        <textarea
                          value={jdText}
                          onChange={(e) => setJdText(e.target.value)}
                          placeholder="Paste the target job description here..."
                          rows={4}
                          className="w-full rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-3.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#4A6CF7]/20 focus:border-[#4A6CF7] transition-colors resize-none"
                        />
                        {!jdText.trim() && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Please paste a job description above before proceeding to Step 2.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Step 1 Launch Action */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={selectedIntroSubtype === 'JOB_DESCRIPTION_INTRO' && !jdText.trim()}
                        onClick={() => confirmLaunch(selectedModes['GENERAL_INTRO'] || 'VIDEO_AUDIO', selectedIntroSubtype)}
                        className="px-6 py-3 bg-[#4A6CF7] hover:bg-[#3b5bd9] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Start Assessment</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STEP 2: Mode Selection (Video+Audio vs Audio Only) */
                  <div className="animate-fade-in space-y-6">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Selected Format:</span>
                        <span className="text-xs font-extrabold text-[#4A6CF7]">
                          {(pendingType || selectedType) === 'GENERAL_INTRO'
                            ? (selectedIntroSubtype === 'JOB_DESCRIPTION_INTRO' ? 'Targeted Job Description Intro' : 'General Intro')
                            : (ASSESSMENT_CARDS_META.find(m => m.type === (pendingType || selectedType))?.title || (pendingType || selectedType)?.replace(/_/g, ' '))}
                        </span>
                      </div>
                      {pendingType === 'GENERAL_INTRO' && (
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Edit Step 1</span>
                        </button>
                      )}
                    </div>

                    <div className="text-center">
                      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Step 2: Choose Practice Mode
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                        Select how you would like to conduct this interactive assessment session.
                      </p>
                    </div>

                    {/* Step 2 Mode Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mode 1: Video + Audio */}
                      <button
                        type="button"
                        onClick={() => confirmLaunch('VIDEO_AUDIO', (pendingType || selectedType) === 'GENERAL_INTRO' ? selectedIntroSubtype : (pendingType || selectedType)!)}
                        className="group border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 bg-white dark:bg-slate-800 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-center"
                      >
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <Video className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Video + Audio</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Full visual simulation with facial stance tracking. Requires webcam & mic.
                        </p>
                      </button>

                      {/* Mode 2: Audio Only */}
                      <button
                        type="button"
                        onClick={() => confirmLaunch('AUDIO_ONLY', (pendingType || selectedType) === 'GENERAL_INTRO' ? selectedIntroSubtype : (pendingType || selectedType)!)}
                        className="group border border-slate-200 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-6 bg-white dark:bg-slate-800 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-center"
                      >
                        <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <Mic className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Audio Only</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Voice-only practice room mimicking a telephone call. Requires mic only.
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
