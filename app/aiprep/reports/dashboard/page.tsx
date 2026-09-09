'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { aiprepApi, AssessmentDetails, AssessmentListItem, CandidateAnalyticsDashboard } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Mic,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Video,
} from 'lucide-react';

export default function ReportsDashboardPage() {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [analytics, setAnalytics] = useState<CandidateAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        let cId: number | null = null;
        try {
          const profile: any = await apiFetch('user_dashboard');
          cId = profile?.candidate_id || profile?.basic_info?.id || profile?.id;
          if (cId) setCandidateId(Number(cId));
        } catch (e) {
          console.warn('Could not retrieve candidate profile:', e);
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
      } catch (err) {
        console.error('Failed to load past reports dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, []);

  const completedSessions = assessments.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/aiprep')}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Candidate Portal
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-400">FE3 Reporting Suite</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Evaluation Reports Dashboard
              </h1>
            </div>
          </div>

          <button
            onClick={() => router.push('/aiprep')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Assessment Session
          </button>
        </div>

        {/* Analytics Top Cards */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Assessments
              </span>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                {analytics.total_assessments || assessments.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {completedSessions.length} completed evaluation reports
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Average Overall Score
              </span>
              <p className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {analytics.overall_average_score != null
                  ? `${Math.round(analytics.overall_average_score)}%`
                  : 'N/A'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Target benchmark: 80%+</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Average Speaking Pace
              </span>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                {analytics.average_wpm != null ? `${Math.round(analytics.average_wpm)}` : 'N/A'}
                {analytics.average_wpm != null && (
                  <span className="text-xs font-normal text-slate-400 ml-1">WPM</span>
                )}
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">Ideal: 120–160 WPM</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Latest Coaching Band
              </span>
              <p className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400">
                {analytics.latest_coaching_band || 'N/A'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Constructive growth path</p>
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Past Evaluation Sessions
              </h2>
              <p className="text-xs text-slate-500">
                Click any completed session to inspect its detailed evaluation report.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {assessments.length} Total Sessions
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
              <p className="mt-2 text-xs text-slate-400">Loading session history...</p>
            </div>
          ) : assessments.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                No past assessment sessions recorded
              </p>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Start your first practice session in AIPrep to generate a comprehensive evaluation report.
              </p>
              <button
                onClick={() => router.push('/aiprep')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500"
              >
                Start Practice Session
              </button>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {assessments.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl px-2 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-bold text-xs">
                      #{session.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                          {(session.assessment_type || 'Practice Session').replaceAll('_', ' ')}
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {session.media_type || 'VIDEO'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {session.created_at
                          ? new Date(session.created_at).toLocaleString()
                          : 'Date N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        session.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : session.status === 'EVALUATING'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {session.status}
                    </span>

                    <button
                      onClick={() => router.push(`/aiprep/reports/${session.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition-all"
                    >
                      <span>View Report</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



