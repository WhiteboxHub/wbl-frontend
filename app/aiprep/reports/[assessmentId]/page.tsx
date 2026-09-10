'use client';

/**
 * Detailed Evaluation Report Route
 * Specification: [Vishnu] Phase 6: Detailed Evaluation Report Route
 * Route: /aiprep/reports/[assessmentId]
 * 
 * Orchestrates and renders:
 * - ExecutiveDashboard
 * - ReportOverview
 * - ScoreBreakdown
 * - CommunicationAnalytics
 * - TechnicalRadar
 * - CoachingSuggestions
 * - TranscriptViewer
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { aiprepApi, type AssessmentDetails } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import {
  Loader2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  Mic,
  Printer,
  Share2,
  CheckCircle2,
  Briefcase,
  Layers,
  Brain,
  Lightbulb,
  ArrowRightCircle,
  Play,
  Target,
  ArrowRight,
} from 'lucide-react';

import { ExecutiveDashboard } from '@/components/aiprep/ExecutiveDashboard';
import { ReportOverview } from '@/components/aiprep/ReportOverview';
import { ScoreBreakdown } from '@/components/aiprep/ScoreBreakdown';
import { CommunicationAnalytics } from '@/components/aiprep/CommunicationAnalytics';
import { TechnicalRadar } from '@/components/aiprep/TechnicalRadar';
import { CoachingSuggestions } from '@/components/aiprep/CoachingSuggestions';
import { TranscriptViewer } from '@/components/aiprep/TranscriptViewer';

export type ReportSectionId =
  | 'overview'
  | 'performance'
  | 'technical'
  | 'communication'
  | 'interview-evidence'
  | 'coaching'
  | 'next-steps';

type ReportLifecycleState =
  | 'LOADING'
  | 'GENERATING'
  | 'READY'
  | 'FAILED'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED';

interface TabItem {
  id: ReportSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'performance', label: 'Performance', icon: Sparkles },
  { id: 'technical', label: 'Technical', icon: Brain },
  { id: 'communication', label: 'Communication', icon: Mic },
  { id: 'interview-evidence', label: 'Interview Evidence', icon: Video },
  { id: 'coaching', label: 'Coaching', icon: Lightbulb },
  { id: 'next-steps', label: 'Next Steps', icon: ArrowRightCircle },
];

export default function AssessmentReportPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.assessmentId as string;
  const assessmentId = rawId ? parseInt(rawId, 10) : NaN;

  const [lifecycleState, setLifecycleState] = useState<ReportLifecycleState>('LOADING');
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ReportSectionId>('overview');
  const [isRetrying, setIsRetrying] = useState(false);
  const [copied, setCopied] = useState(false);


  const handleBack = () => {
    router.push('/user_dashboard/ai-prep');
  };

  const handleStartAssessment = () => {
    router.push('/user_dashboard/ai-prep?start=true');
  };

  // Main data fetch & authorization validation
  const fetchReportData = useCallback(async () => {
    if (!assessmentId || isNaN(assessmentId)) {
      setLifecycleState('NOT_FOUND');
      setErrorMessage('Invalid assessment identifier specified.');
      return;
    }

    try {
      let currentCandidateId: number | null = null;
      try {
        const userDash: any = await apiFetch('user_dashboard');
        const cId = userDash?.candidate_id || userDash?.basic_info?.id || userDash?.id;
        if (cId) currentCandidateId = Number(cId);
      } catch {
        try {
          const cached = localStorage.getItem('userProfile') || localStorage.getItem('user');
          if (cached) {
            const parsed = JSON.parse(cached);
            const cId = parsed?.candidate_id || parsed?.basic_info?.id || parsed?.id;
            if (cId) currentCandidateId = Number(cId);
          }
        } catch {
          // ignore cache read error
        }
      }

      const data = await aiprepApi.getAssessment(assessmentId);

      if (!data) {
        setLifecycleState('NOT_FOUND');
        setErrorMessage('Assessment report not found.');
        return;
      }

      if (
        currentCandidateId &&
        data.candidate_id &&
        Number(data.candidate_id) !== currentCandidateId
      ) {
        console.warn(
          `[Security Block]: Candidate #${currentCandidateId} attempted to access Assessment #${data.id} owned by Candidate #${data.candidate_id}`
        );
        setLifecycleState('UNAUTHORIZED');
        setErrorMessage('You are not authorized to view this assessment report.');
        return;
      }

      setAssessment(data);

      if (data.status === 'COMPLETED') {
        setLifecycleState('READY');
      } else if (data.status === 'FAILED') {
        setLifecycleState('FAILED');
      } else if (data.status === 'EVALUATING' || data.status === 'IN_PROGRESS') {
        setLifecycleState('GENERATING');
      } else {
        setLifecycleState('READY');
      }
    } catch (err: any) {
      console.warn(`[AIPrep Report] Fetch error for assessment #${assessmentId}:`, err);
      const msg = err?.message || '';
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        setLifecycleState('NOT_FOUND');
        setErrorMessage('Assessment report not found.');
      } else if (msg.includes('403') || msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        setLifecycleState('UNAUTHORIZED');
        setErrorMessage('You do not have permission to view this report.');
      } else {
        setLifecycleState('FAILED');
        setErrorMessage(msg || 'Failed to load assessment report. Please try again.');
      }
    } finally {
      setIsRetrying(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void fetchReportData();
  }, [fetchReportData]);

  // Polling for EVALUATING / IN_PROGRESS states
  useEffect(() => {
    if (lifecycleState !== 'GENERATING') return;
    const interval = setInterval(() => {
      void fetchReportData();
    }, 4000);
    return () => clearInterval(interval);
  }, [lifecycleState, fetchReportData]);

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // State: Loading
  if (lifecycleState === 'LOADING') {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          Loading Evaluation Report
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Fetching comprehensive scoring metrics, audio telemetry, and coaching analysis...
        </p>
      </main>
    );
  }

  // State: Generating / Evaluating
  if (lifecycleState === 'GENERATING') {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <Loader2 className="w-20 h-20 text-indigo-600 absolute -top-2 -left-2 animate-spin opacity-40" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          AI Evaluation in Progress
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
          Our evaluation pipeline is analyzing your speech pace, acoustic telemetry, and technical answers.
          This page updates automatically.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsRetrying(true);
              void fetchReportData();
            }}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>Check Status</span>
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    );
  }

  // State: Not Found / Unauthorized / Failed
  if (lifecycleState === 'NOT_FOUND' || lifecycleState === 'UNAUTHORIZED' || lifecycleState === 'FAILED') {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          {lifecycleState === 'UNAUTHORIZED' ? (
            <ShieldAlert className="w-6 h-6" />
          ) : (
            <AlertCircle className="w-6 h-6" />
          )}
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          {lifecycleState === 'UNAUTHORIZED' ? 'Access Restricted' : 'Report Unavailable'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
          {errorMessage || 'Unable to display this assessment report.'}
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to AI Prep</span>
        </button>
      </main>
    );
  }

  if (!assessment) return null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-4 px-3 sm:py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full space-y-4">
        {/* Top Action Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50">
                  <Briefcase className="w-3 h-3" />
                  <span>{assessment.track_title || assessment.assessment_type || 'Practice Session'}</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  #{assessment.id}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Evaluation Report
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Copy link to report"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Print Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Modular Section Rendering */}
        <section className="space-y-4">
          {activeSection === 'overview' && (
            <div className="space-y-4">
              <ReportOverview
                assessment={assessment}
                onNavigateTab={(tab) => setActiveSection(tab as ReportSectionId)}
              />
              <ExecutiveDashboard
                assessment={assessment}
                onNavigateSection={(sec) => setActiveSection(sec as ReportSectionId)}
              />
            </div>
          )}

          {activeSection === 'performance' && (
            <ScoreBreakdown assessment={assessment} />
          )}

          {activeSection === 'technical' && (
            <TechnicalRadar assessment={assessment} />
          )}

          {activeSection === 'communication' && (
            <CommunicationAnalytics assessment={assessment} />
          )}

          {activeSection === 'interview-evidence' && (
            <TranscriptViewer />
          )}

          {activeSection === 'coaching' && (
            <CoachingSuggestions assessment={assessment} />
          )}

          {activeSection === 'next-steps' && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Recommended Next Steps
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Continue honing your skills with targeted practice sessions
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2">
                  <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 inline-block">
                    <Play className="w-4 h-4" />
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Take Another Interview</h4>
                  <p className="text-[11px] text-slate-500">Run a fresh session to measure improvement.</p>
                  <button
                    type="button"
                    onClick={handleStartAssessment}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                  >
                    <span>Start session</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2">
                  <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 inline-block">
                    <Brain className="w-4 h-4" />
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Sharpen Weak Areas</h4>
                  <p className="text-[11px] text-slate-500">Review technical radar dimensions scoring below 75%.</p>
                  <button
                    type="button"
                    onClick={() => setActiveSection('technical')}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <span>View technical</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2">
                  <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 inline-block">
                    <Target className="w-4 h-4" />
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Action Plan</h4>
                  <p className="text-[11px] text-slate-500">Work through coaching feedback before real interviews.</p>
                  <button
                    type="button"
                    onClick={() => setActiveSection('coaching')}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    <span>View coaching</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
