'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Lock,
  LockKeyhole,
  Play,
  Sparkles,
  Trophy,
  X,
  AlertCircle,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { aiprepApi, AssessmentDetails, CandidateAnalyticsDashboard } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';

export type SetupStatus = { resume_uploaded: boolean; api_keys_configured: boolean; setup_complete: boolean };
export type View = 'assessments' | 'analytics' | 'scores' | null;
export type ReportView = Exclude<View, null>;

interface AIPrepDashboardProps {
  onStartAssessment: () => void;
  candidateId?: number;
  setupStatus?: SetupStatus | null;
  onNavigateTab?: (tab: string) => void;
  onViewReport?: (assessmentId: number) => void;
  embedded?: boolean;
}

export default function AIPrepDashboard({
  onStartAssessment,
  candidateId: propCandidateId,
  setupStatus: propSetupStatus,
  onNavigateTab,
  onViewReport,
  embedded = false,
}: AIPrepDashboardProps) {
  const [setup, setSetup] = useState<SetupStatus | null>(propSetupStatus || null);
  const [assessments, setAssessments] = useState<AssessmentDetails[]>([]);
  const [analytics, setAnalytics] = useState<CandidateAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [resolvedCandidateId, setResolvedCandidateId] = useState<number | null>(propCandidateId || null);
  const [candidateName, setCandidateName] = useState<string>('Candidate');

  // Dismissible banner states
  const [dismissLlmBanner, setDismissLlmBanner] = useState(false);
  const [dismissResumeBanner, setDismissResumeBanner] = useState(false);

  // Sync prop changes if passed down dynamically
  useEffect(() => {
    if (propSetupStatus) {
      setSetup((prev) => {
        if (!prev) return propSetupStatus;
        return { ...prev, ...propSetupStatus };
      });
    }
  }, [propSetupStatus]);

  useEffect(() => {
    if (propCandidateId) setResolvedCandidateId(propCandidateId);
  }, [propCandidateId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let currentSetup: SetupStatus | null = null;
      try {
        currentSetup = await aiprepApi.getSetupStatus();
      } catch (err) {
        console.warn('Could not fetch setup status directly from aiprepApi:', err);
        currentSetup = propSetupStatus || { resume_uploaded: false, api_keys_configured: false, setup_complete: false };
      }
      setSetup(currentSetup);

      let cId = propCandidateId || resolvedCandidateId;
      try {
        const profile: any = await apiFetch('user_dashboard');
        if (!cId) {
          cId = profile?.candidate_id || profile?.basic_info?.id || profile?.id;
          if (cId) setResolvedCandidateId(Number(cId));
        }
        const name =
          profile?.basic_info?.first_name ||
          profile?.basic_info?.full_name?.split(' ')?.[0] ||
          profile?.fullname?.split(' ')?.[0] ||
          profile?.full_name?.split(' ')?.[0] ||
          profile?.name?.split(' ')?.[0] ||
          profile?.uname?.split('@')?.[0];
        if (name) setCandidateName(name);
      } catch (e) {
        console.warn('Could not retrieve candidate profile for dashboard', e);
      }

      if (cId) {
        const [assessRes, analyticsRes] = await Promise.allSettled([
          aiprepApi.listCandidateAssessments(Number(cId)),
          aiprepApi.getDashboardAnalytics(Number(cId)),
        ]);

        if (assessRes.status === 'fulfilled') {
          setAssessments(assessRes.value.items || []);
        }
        if (analyticsRes.status === 'fulfilled') {
          setAnalytics(analyticsRes.value);
        }
      }
    } catch (error) {
      console.error('Unable to load AI Prep dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [propCandidateId, resolvedCandidateId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const isLlmConfigured = Boolean(setup?.api_keys_configured);
  const isResumeUploaded = Boolean(setup?.resume_uploaded);
  const isSetupComplete = isLlmConfigured && isResumeUploaded;

  const completedAssessments = useMemo(
    () => assessments.filter((item) => item.status === 'COMPLETED'),
    [assessments]
  );

  const handleStartClick = () => {
    if (isSetupComplete) {
      onStartAssessment();
    } else {
      setShowSetupModal(true);
    }
  };

  const handleNavigate = (tab: string) => {
    setShowSetupModal(false);
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      window.location.href = `/user_dashboard/${tab}`;
    }
  };

  // Formatted date (e.g., Fri, Sep 5, 2026)
  const currentDateStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  return (
    <div className={`relative w-full text-slate-900 dark:text-slate-100 ${embedded ? '' : 'min-h-full bg-slate-50 dark:bg-[#0b0f19] px-4 py-3 sm:px-6 lg:px-8'}`}>
      <div className="mx-auto max-w-6xl space-y-3 sm:space-y-3.5">

        {view === null ? (
          /* ==================== 1. DASHBOARD PAGE ==================== */
          <div className="space-y-3 animate-in fade-in duration-150">

            {/* Header: Greeting */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back, {candidateName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Your AI-powered interview preparation platform.
              </p>
            </div>

            {/* Warning Banner 1: LLM Setup */}
            {!isLlmConfigured && !dismissLlmBanner && (
              <div className="rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex items-center justify-between gap-3 border bg-[#fff1f2] dark:bg-rose-950/30 border-[#fecdd3] dark:border-rose-900/50 shadow-xs animate-in fade-in duration-150 min-h-[60px] max-h-[70px]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#e11d48] flex items-center justify-center text-white shrink-0 shadow-xs">
                    <AlertCircle className="w-4 h-4 text-white stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#9f1239] dark:text-rose-200 truncate leading-tight">
                      LLM setup is not configured or has expired
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#be123c] dark:text-rose-300/80 truncate mt-0.5 leading-tight">
                      Please set up your LLM API keys to start an assessment.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleNavigate('my-llm-setup')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-[#fda4af] dark:border-rose-800 text-xs font-bold text-[#4338ca] dark:text-indigo-400 hover:bg-rose-50/50 dark:hover:bg-gray-750 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <span>Go to LLM Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissLlmBanner(true)}
                    className="p-1 rounded-lg text-[#fb7185] hover:text-[#e11d48] hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                    aria-label="Dismiss LLM banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Warning Banner 2: Resume Setup */}
            {!isResumeUploaded && !dismissResumeBanner && (
              <div className="rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex items-center justify-between gap-3 border bg-[#fffbeb] dark:bg-amber-950/30 border-[#fde68a] dark:border-amber-900/50 shadow-xs animate-in fade-in duration-150 min-h-[60px] max-h-[70px]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center text-white shrink-0 shadow-xs">
                    <AlertTriangle className="w-4 h-4 text-white stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#92400e] dark:text-amber-200 truncate leading-tight">
                      Resume is not set up
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#b45309] dark:text-amber-300/80 truncate mt-0.5 leading-tight">
                      Please upload or configure your resume to get personalized assessments.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleNavigate('my-resume')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-[#fcd34d] dark:border-amber-800 text-xs font-bold text-[#4338ca] dark:text-indigo-400 hover:bg-amber-50/50 dark:hover:bg-gray-750 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <span>Go to Resume Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissResumeBanner(true)}
                    className="p-1 rounded-lg text-[#f59e0b] hover:text-[#b45309] hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                    aria-label="Dismiss Resume banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Main Dashboard Card */}
            <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-xs">

              {/* Card Header */}
              <div className="flex items-start justify-between pb-3 sm:pb-3.5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Dashboard
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Choose what you want to do next.
                  </p>
                </div>
                <div className="text-indigo-500 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5 stroke-[2]" />
                </div>
              </div>

              {/* 4 Action Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">

                {/* Card 1: Start an assessment */}
                <div
                  onClick={handleStartClick}
                  className={`rounded-xl border p-3 sm:p-3.5 min-h-[85px] max-h-[100px] flex items-center gap-3.5 transition-all duration-150 hover:shadow-xs cursor-pointer select-none group ${!isSetupComplete
                    ? 'border-amber-200/90 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
                    : 'border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-[#f5f7ff] dark:hover:bg-indigo-950/30'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${!isSetupComplete
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-[#4338ca] dark:bg-indigo-600 text-white'
                      }`}
                  >
                    {!isSetupComplete ? (
                      <LockKeyhole className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        Start an assessment
                      </h3>
                      {!isSetupComplete && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs sm:text-[13px] mt-0.5 truncate ${!isSetupComplete
                        ? 'text-amber-700/80 dark:text-amber-300/70 font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                      {!isSetupComplete
                        ? 'Setup required • Click to configure & unlock'
                        : 'Start a new practice session'}
                    </p>
                  </div>
                </div>

                {/* Card 2: View assessments */}
                <div
                  onClick={() => setView('assessments')}
                  className="rounded-xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sm:p-3.5 min-h-[85px] max-h-[100px] flex items-center gap-3.5 transition-all duration-150 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-[#f5f7ff] dark:hover:bg-indigo-950/30 hover:shadow-xs cursor-pointer select-none group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0 transition-transform group-hover:scale-105">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      View assessments
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      Review all practice sessions
                    </p>
                  </div>
                </div>

                {/* Card 3: Analytics */}
                <div
                  onClick={() => setView('analytics')}
                  className="rounded-xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sm:p-3.5 min-h-[85px] max-h-[100px] flex items-center gap-3.5 transition-all duration-150 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-[#f5f7ff] dark:hover:bg-indigo-950/30 hover:shadow-xs cursor-pointer select-none group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0 transition-transform group-hover:scale-105">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      Analytics
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      See progress and completion
                    </p>
                  </div>
                </div>

                {/* Card 4: Scores */}
                <div
                  onClick={() => setView('scores')}
                  className="rounded-xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sm:p-3.5 min-h-[85px] max-h-[100px] flex items-center gap-3.5 transition-all duration-150 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-[#f5f7ff] dark:hover:bg-indigo-950/30 hover:shadow-xs cursor-pointer select-none group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0 transition-transform group-hover:scale-105">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      Scores
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      Compare completed results
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* ==================== 2. SEPARATE SUBPAGE VIEW ==================== */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Bar with Back Button & Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView(null)}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setView(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            {/* Subpage Container */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-10 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {view === 'analytics'
                      ? 'Practice Analytics & Insights'
                      : view === 'scores'
                        ? 'Completed Assessment Scores'
                        : 'All Practice Assessments'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {view === 'analytics'
                      ? 'Aggregated performance data from your practice sessions'
                      : view === 'scores'
                        ? 'Detailed scoring breakdown for evaluated interviews'
                        : 'List of all created and completed interview attempts'}
                  </p>
                </div>
              </div>

              <ReportsPanel
                view={view}
                assessments={assessments}
                completed={completedAssessments}
                analytics={analytics}
                onClose={() => setView(null)}
                onViewReport={onViewReport}
                embedded={embedded}
              />
            </div>
          </div>
        )}

      </div>

      {/* Setup Required Modal Dialog */}
      {typeof document !== 'undefined' && showSetupModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                <LockKeyhole className="h-6 w-6" />
              </span>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-900 dark:text-white">
              AI Prep Setup Required
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              To launch an AI-powered interview assessment, your LLM API Key and resume must be configured.
            </p>

            {/* Status Checklist Card */}
            <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              {/* LLM Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {isLlmConfigured ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                  )}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    LLM API Key
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isLlmConfigured
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    }`}
                >
                  {isLlmConfigured ? 'Configured' : 'Missing'}
                </span>
              </div>

              {/* Resume Status */}
              <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-2.5">
                <div className="flex items-center gap-2.5">
                  {isResumeUploaded ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Candidate Resume
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isResumeUploaded
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                    }`}
                >
                  {isResumeUploaded ? 'Uploaded' : 'Missing'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              {!isLlmConfigured && (
                <button
                  type="button"
                  onClick={() => handleNavigate('my-llm-setup')}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Go to LLM Setup</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {!isResumeUploaded && (
                <button
                  type="button"
                  onClick={() => handleNavigate('my-resume')}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Go to Resume Setup</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Standalone panel component used inside the dashboard and exported for AssessmentReportWorkspace
export function ReportsPanel({
  view,
  assessments,
  completed,
  analytics,
  averageScore,
  onClose,
  onViewReport,
  embedded = false,
}: {
  view: ReportView;
  assessments: AssessmentDetails[];
  completed: AssessmentDetails[];
  analytics?: CandidateAnalyticsDashboard | null;
  averageScore?: number | null;
  onClose: () => void;
  onViewReport?: (assessmentId: number) => void;
  embedded?: boolean;
}) {
  const listItems = view === 'scores' ? completed : assessments;

  return (
    <div className="space-y-4">
      {view === 'analytics' ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Practice Attempts" value={assessments.length} />
            <MetricCard label="Completed Sessions" value={completed.length} />
            <MetricCard
              label="Technical Score Avg"
              value={analytics?.analytics?.average_technical_score ? `${Math.round(analytics.analytics.average_technical_score)}%` : 'N/A'}
            />
            <MetricCard
              label="Communication Avg"
              value={analytics?.analytics?.average_communication_score ? `${Math.round(analytics.analytics.average_communication_score)}%` : 'N/A'}
            />
          </div>

          {analytics?.analytics?.top_strengths && analytics.analytics.top_strengths.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                Top Strengths
              </h4>
              <ul className="space-y-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                {analytics.analytics.top_strengths.map((str, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : listItems.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <p className="text-sm font-semibold">
            {view === 'scores'
              ? 'No completed assessment scores yet'
              : 'No assessments found'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {view === 'scores'
              ? 'Complete an assessment interview to see your overall score and detailed evaluation breakdown here.'
              : 'Start a practice interview session from the dashboard to begin practicing.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {listItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-bold text-xs">
                  #{item.id}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                    {(item.assessment_type || 'Practice Session').replaceAll('_', ' ')}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date N/A'} • {item.job_description || item.data?.job_description || (item.assessment_type || 'Practice Session').replaceAll('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {view === 'scores' && (item as any).overall_score != null ? (
                  <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-bold">
                    {Math.round((item as any).overall_score)}% Score
                  </span>
                ) : (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                    {item.status}
                  </span>
                )}

                {item.status === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewReport) {
                        onViewReport(item.id);
                      } else {
                        window.location.href = `/user_dashboard/ai-prep?reportId=${item.id}`;
                      }
                    }}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-500 transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Report</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
