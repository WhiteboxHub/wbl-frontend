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
import { aiprepApi, Assessment, AssessmentType, QuestionCategory } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { AssessmentCard, AssessmentMetadata } from '@/components/aiprep/AssessmentCard';
import { Video, Mic, History, Sparkles, BookOpen, AlertTriangle, FileText, X, ArrowLeft, ArrowRight, Check } from 'lucide-react';

const ASSESSMENT_CARDS_META: AssessmentMetadata[] = [
  {
    type: 'GENERAL_INTRO',
    title: 'General & Job Description Intro',
    description: 'Introductory dialogue covering your professional background or tailored dynamically to a target Job Description.',
    timeLimit: '90s per question',
    questionCount: '3-5 Questions',
    pauseAllowed: false,
    requiresJd: false,
  },
  {
    type: 'RECRUITER',
    title: 'Recruiter Phone Screen',
    description: 'Simulates a standard recruiter phone screen covering experience overview, compensation expectations, notice period, and logs.',
    timeLimit: '2m per question',
    questionCount: '5-7 Questions',
    pauseAllowed: true,
    requiresJd: false,
  },
  {
    type: 'HIRING_MANAGER',
    title: 'Hiring Manager Conversation',
    description: 'Deeper technical alignment screen exploring system design ownership, past projects, conflict resolution, and leadership dynamics.',
    timeLimit: '3m per question',
    questionCount: '6-8 Questions',
    pauseAllowed: true,
    requiresJd: false,
  },
  {
    type: 'TECHNICAL',
    title: 'Technical Theory & Coding',
    description: 'Deep-dive into core AI Engineering topics: LLMs, transformers, RAG architecture, MLOps, vector DBs, and fine-tuning details.',
    timeLimit: '4m per question',
    questionCount: '6-10 Questions',
    pauseAllowed: true,
    requiresJd: false,
  },
  {
    type: 'SYSTEM_DESIGN',
    title: 'AI System Design',
    description: 'Solve production AI scale challenges. Deconstruct business problems, design pipelines, choose models, and reason about trade-offs.',
    timeLimit: '5m min response',
    questionCount: '3-5 Scenarios',
    pauseAllowed: true,
    requiresJd: false,
  },
  {
    type: 'HR',
    title: 'HR & Behavioral Screen',
    description: 'Classic situational and cultural fit loops using the STAR format (Situation, Task, Action, Result) to evaluate work dynamics.',
    timeLimit: '3m per question',
    questionCount: '5-7 Questions',
    pauseAllowed: true,
    requiresJd: false,
  },
];

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

  // Modal state
  const [showModeModal, setShowModeModal] = useState(false);
  const [pendingType, setPendingType] = useState<AssessmentType | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  // Verify WBL authentication & fetch live Assessment History using existing apiFetch
  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoadingHistory(true);
        const userResponse = await apiFetch("user_dashboard");
        const candidateId = userResponse?.candidate_id || 7;
        setIsAuthenticated(true);

        const listData = await aiprepApi.listAssessments(candidateId, 50);
        if (listData?.items && listData.items.length > 0) {
          setHistory(listData.items);
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

  // Module unlocking logic: unlocks ALL modules when both General Intro & Targeted JD Intro have status 'COMPLETED' in database
  const hasCompletedGeneral = history.some(item => item.assessment_type === 'GENERAL_INTRO' && item.status === 'COMPLETED');
  const hasCompletedJd = history.some(item => item.assessment_type === 'JOB_DESCRIPTION_INTRO' && item.status === 'COMPLETED');
  const completedIntroCount = (hasCompletedGeneral ? 1 : 0) + (hasCompletedJd ? 1 : 0);
  const isModulesUnlocked = hasCompletedGeneral && hasCompletedJd;

  const handleLaunchAssessment = (type: AssessmentType) => {
    setErrorMsg(null);
    setSelectedType(type);

    if (type === 'GENERAL_INTRO') {
      setSelectedIntroSubtype('GENERAL_INTRO');
      setWizardStep(1);
    } else {
      setWizardStep(2);
    }

    setPendingType(type);
    setShowModeModal(true);
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
      if (targetType === 'JOB_DESCRIPTION_INTRO') {
        sessionStorage.setItem('aiprep_jd_text', jdText);
      }
    }

    const isMock = typeof window !== 'undefined' && window.location.search.includes('mock=true');
    const mockQuery = isMock ? '&mock=true' : '';
    const embedQuery = isEmbedded ? '&embed=true' : '';

    const targetUrl = `/aiprep/device-check?type=${targetType}&mode=${mode}${mockQuery}${embedQuery}`;

    router.push(targetUrl);
    setPendingType(null);
  };

  const renderCard = (type: AssessmentType) => {
    const meta = ASSESSMENT_CARDS_META.find(m => m.type === type);
    if (!meta) return null;

    const isLocked = type !== 'GENERAL_INTRO' && !isModulesUnlocked;

    return (
      <AssessmentCard
        key={meta.type}
        metadata={meta}
        questionCountOverride={questionCounts[meta.type]}
        onLaunch={handleLaunchAssessment}
        isSelected={selectedType === meta.type}
        jdText={jdText}
        isLocked={isLocked}
      />
    );
  };

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-10 h-10 rounded-2xl bg-[#4A6CF7]/10 border border-[#4A6CF7]/20 flex items-center justify-center mb-3">
          <div className="w-5 h-5 border-2 border-[#4A6CF7] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verifying WBL authentication session…</p>
      </div>
    );
  }

  return (
    <div className={`${isEmbedded
      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 pt-3 pb-4 transition-colors duration-200'
      : 'min-h-screen bg-[#f8fafc] dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-12 px-6 md:px-12 transition-colors duration-200'
      }`}>
      {/* Top Banner decoration */}
      {!isEmbedded && (
        <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-b from-[#4A6CF7]/10 via-[#f8fafc]/5 to-[#f8fafc] dark:via-slate-900/5 dark:to-slate-900 pointer-events-none -z-10" />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        {!isEmbedded && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-[#4A6CF7] text-sm font-semibold tracking-wider uppercase mb-2">
                <Sparkles className="w-4 h-4 text-[#4A6CF7] animate-pulse" />
                <span>Self-Improvement Platform</span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                AIPrep Interview Practice
              </h1>
              <p className="text-slate-550 dark:text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">
                Choose a realistic AI engineering interview simulation and receive private, actionable coaching after your session.
              </p>
            </div>
            <Link
              href="/user_dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all whitespace-nowrap self-start md:self-auto cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#4A6CF7]" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        )}

        {/* Errors banner */}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl mb-8 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Assessment Modules Grid */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
            <BookOpen className="w-4 h-4 text-[#4A6CF7]" />
            <span>Select Practice Loop</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Single Combined General & Job Description Intro Card */}
            {renderCard('GENERAL_INTRO')}

            {/* 2. Recruiter Phone Screen */}
            {renderCard('RECRUITER')}

            {/* 3. Hiring Manager Conversation */}
            {renderCard('HIRING_MANAGER')}

            {/* 4. Technical Theory & Coding */}
            {renderCard('TECHNICAL')}

            {/* 5. AI System Design */}
            {renderCard('SYSTEM_DESIGN')}

            {/* 6. HR & Behavioral Screen */}
            {renderCard('HR')}
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

                    {/* Step 1 Continue Action */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={selectedIntroSubtype === 'JOB_DESCRIPTION_INTRO' && !jdText.trim()}
                        onClick={() => setWizardStep(2)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Continue to Step 2</span>
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
                          {selectedIntroSubtype === 'JOB_DESCRIPTION_INTRO' ? 'Targeted Job Description Intro' : 'General Intro'}
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
                        onClick={() => confirmLaunch('VIDEO_AUDIO', pendingType === 'GENERAL_INTRO' ? selectedIntroSubtype : pendingType!)}
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
                        onClick={() => confirmLaunch('AUDIO_ONLY', pendingType === 'GENERAL_INTRO' ? selectedIntroSubtype : pendingType!)}
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
