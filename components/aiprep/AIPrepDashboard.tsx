'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  Lock,
  LockKeyhole,
  Play,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Trophy,
  X,
  AlertCircle,
  AlertTriangle,
  MoreVertical,
  SlidersHorizontal,
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

  const router = useRouter();

  // Search, filter, and sorting controls for "All Practice Assessments"
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Dismissible banner states
  const [dismissLlmBanner, setDismissLlmBanner] = useState(false);
  const [dismissResumeBanner, setDismissResumeBanner] = useState(false);

  // Scores Page state
  const [selectedScoreAssessmentId, setSelectedScoreAssessmentId] = useState<number | null>(null);
  const [assessmentScoresMap, setAssessmentScoresMap] = useState<Record<number, AssessmentDetails>>({});
  const [loadingScoreDetails, setLoadingScoreDetails] = useState<Record<number, boolean>>({});
  const [scoreSearchTerm, setScoreSearchTerm] = useState('');
  const [scoreTypeFilter, setScoreTypeFilter] = useState('ALL');
  const [scorePerformanceFilter, setScorePerformanceFilter] = useState('ALL');
  const [scoreSortBy, setScoreSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Performance Thresholds
  const HIGH_PERFORMANCE_THRESHOLD = 80;
  const NEED_IMPROVEMENT_THRESHOLD = 65;

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

  const getStatusCategory = useCallback((status?: string): 'COMPLETED' | 'IN_PROGRESS' | 'NOT_ATTEMPTED' => {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED') return 'COMPLETED';
    if (s === 'IN_PROGRESS' || s === 'EVALUATING' || s === 'INITIALIZED') return 'IN_PROGRESS';
    return 'NOT_ATTEMPTED';
  }, []);

  const completedAssessments = useMemo(
    () => assessments.filter((item) => item.status === 'COMPLETED'),
    [assessments]
  );

  const completedCount = useMemo(
    () => assessments.filter((a) => getStatusCategory(a.status) === 'COMPLETED').length,
    [assessments, getStatusCategory]
  );

  const inProgressCount = useMemo(
    () => assessments.filter((a) => getStatusCategory(a.status) === 'IN_PROGRESS').length,
    [assessments, getStatusCategory]
  );

  const notAttemptedCount = useMemo(
    () => assessments.filter((a) => getStatusCategory(a.status) === 'NOT_ATTEMPTED').length,
    [assessments, getStatusCategory]
  );

  const formatDateTime = useCallback((dateStr?: string) => {
    if (!dateStr) return 'Date N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dateFormatted = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeFormatted = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateFormatted} • ${timeFormatted}`;
    } catch {
      return dateStr;
    }
  }, []);

  const getAssessmentTitle = useCallback((item: AssessmentDetails) => {
    if (item.track_title) return item.track_title;
    if (item.job_description) return item.job_description;
    if (item.data?.job_description) return item.data.job_description;
    if (item.assessment_type) {
      return item.assessment_type.replaceAll('_', ' ') + ' Practice';
    }
    return `Practice Assessment #${item.id}`;
  }, []);

  const availableAssessmentTypes = useMemo(() => {
    const types = new Set<string>();
    assessments.forEach((item) => {
      if (item.assessment_type) types.add(item.assessment_type);
    });
    return Array.from(types);
  }, [assessments]);

  const filteredAssessments = useMemo(() => {
    return assessments
      .filter((item) => {
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const idMatch = `#${item.id}`.includes(q) || String(item.id).includes(q);
          const typeMatch = (item.assessment_type || '').toLowerCase().includes(q);
          const titleMatch = (item.track_title || item.job_description || item.data?.job_description || '').toLowerCase().includes(q);
          if (!idMatch && !typeMatch && !titleMatch) return false;
        }

        if (typeFilter !== 'ALL' && item.assessment_type !== typeFilter) {
          return false;
        }

        if (statusFilter !== 'ALL') {
          const cat = getStatusCategory(item.status);
          if (cat !== statusFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tB - tA;
        }
        if (sortBy === 'oldest') {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tA - tB;
        }
        if (sortBy === 'name') {
          const nA = getAssessmentTitle(a);
          const nB = getAssessmentTitle(b);
          return nA.localeCompare(nB);
        }
        return 0;
      });
  }, [assessments, searchTerm, typeFilter, statusFilter, sortBy, getStatusCategory, getAssessmentTitle]);

  const handleViewAssessmentReport = (assessmentId: number) => {
    if (onViewReport) {
      onViewReport(assessmentId);
    } else {
      router.push(`/aiprep/reports/${assessmentId}`);
    }
  };

  const handleContinueAssessment = (assessmentId: number) => {
    router.push(`/aiprep/session/${assessmentId}`);
  };

  // ── Scores Page Helpers & Filtering ──────────────────────────────────────
  const getScoreForAssessment = useCallback((item: AssessmentDetails): number | null => {
    const detailed = assessmentScoresMap[item.id];
    const target = detailed || item;

    if (typeof (target as any).overall_score === 'number' && !isNaN((target as any).overall_score)) {
      return Math.round((target as any).overall_score);
    }
    const rep = target.report;
    if (rep && typeof rep.overall_score === 'number' && !isNaN(rep.overall_score)) {
      return Math.round(rep.overall_score);
    }
    const trans = rep?.transcript_evaluation as any;
    if (trans) {
      if (typeof trans.overall_score === 'number' && !isNaN(trans.overall_score)) {
        return Math.round(trans.overall_score);
      }
      const sb = trans.scores_breakdown;
      if (sb && typeof sb === 'object') {
        if (typeof sb.overall_score === 'number' && !isNaN(sb.overall_score)) {
          return Math.round(sb.overall_score);
        }
        const vals = Object.values(sb)
          .map((v: any) => v?.score)
          .filter((s): s is number => typeof s === 'number' && !isNaN(s));
        if (vals.length > 0) {
          return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
      }
      const intro = trans.intro_evaluation;
      if (intro && typeof intro.overall_score === 'number' && !isNaN(intro.overall_score)) {
        return Math.round(intro.overall_score);
      }
    }
    const data = target.data as any;
    if (data && typeof data.overall_score === 'number' && !isNaN(data.overall_score)) {
      return Math.round(data.overall_score);
    }
    return null;
  }, [assessmentScoresMap]);

  const getBandForAssessment = useCallback((item: AssessmentDetails): string | null => {
    const detailed = assessmentScoresMap[item.id];
    const target = detailed || item;
    const rep = target.report as any;
    if (rep?.coaching_band) return rep.coaching_band;
    const trans = rep?.transcript_evaluation as any;
    if (trans?.overall_band) return trans.overall_band;
    if (trans?.coaching_band) return trans.coaching_band;
    const intro = trans?.intro_evaluation as any;
    if (intro?.overall_assessment?.readiness) return intro.overall_assessment.readiness;
    return null;
  }, [assessmentScoresMap]);

  const getPerformanceCategory = useCallback((score: number | null, band?: string | null) => {
    if (score === null || score === undefined) {
      return {
        label: 'Not Evaluated',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400',
      };
    }
    // Check report's real coaching band if available
    if (band) {
      const b = band.toUpperCase();
      if (b === 'EXCELLENT' || b === 'STRONG' || b === 'GOOD' || b === 'POSITIVE') {
        return {
          label: 'High Performance',
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
          dotClass: 'bg-emerald-500',
        };
      }
      if (b === 'NEEDS_WORK' || b === 'NEEDS_PRACTICE' || b === 'EMERGING' || b === 'WEAK') {
        return {
          label: 'Need Improvement',
          badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
          dotClass: 'bg-rose-500',
        };
      }
      if (b === 'DEVELOPING' || b === 'MODERATE') {
        return {
          label: 'Developing',
          badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
          dotClass: 'bg-amber-500',
        };
      }
    }
    if (score >= HIGH_PERFORMANCE_THRESHOLD) {
      return {
        label: 'High Performance',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
        dotClass: 'bg-emerald-500',
      };
    }
    if (score < NEED_IMPROVEMENT_THRESHOLD) {
      return {
        label: 'Need Improvement',
        badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
        dotClass: 'bg-rose-500',
      };
    }
    return {
      label: 'Developing',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
      dotClass: 'bg-amber-500',
    };
  }, [HIGH_PERFORMANCE_THRESHOLD, NEED_IMPROVEMENT_THRESHOLD]);

  const scoreSummaryMetrics = useMemo(() => {
    const completedList = assessments.filter(
      (a) => a.status === 'COMPLETED' || (assessmentScoresMap[a.id]?.status === 'COMPLETED')
    );
    const completedCount = completedList.length;

    const evaluatedWithScore: { id: number; score: number }[] = [];
    for (const item of assessments) {
      const s = getScoreForAssessment(item);
      if (s !== null) {
        evaluatedWithScore.push({ id: item.id, score: s });
      }
    }

    const avgScore = evaluatedWithScore.length > 0
      ? Math.round(evaluatedWithScore.reduce((acc, curr) => acc + curr.score, 0) / evaluatedWithScore.length)
      : null;

    const highPerfCount = evaluatedWithScore.filter((item) => {
      const target = assessments.find((a) => a.id === item.id);
      const band = target ? getBandForAssessment(target) : null;
      return getPerformanceCategory(item.score, band).label === 'High Performance';
    }).length;

    const needImproveCount = evaluatedWithScore.filter((item) => {
      const target = assessments.find((a) => a.id === item.id);
      const band = target ? getBandForAssessment(target) : null;
      return getPerformanceCategory(item.score, band).label === 'Need Improvement';
    }).length;

    return {
      completedCount,
      avgScore,
      highPerfCount,
      needImproveCount,
    };
  }, [assessments, assessmentScoresMap, getScoreForAssessment, getBandForAssessment, getPerformanceCategory]);

  // Fetch missing reports for completed assessments when Scores page is active
  useEffect(() => {
    if (view !== 'scores') return;
    const completedWithoutDetails = assessments.filter(
      (a) => a.status === 'COMPLETED' && !assessmentScoresMap[a.id]
    );
    if (completedWithoutDetails.length === 0) return;

    let active = true;
    Promise.allSettled(
      completedWithoutDetails.map((a) => aiprepApi.getAssessment(a.id))
    ).then((results) => {
      if (!active) return;
      setAssessmentScoresMap((prev) => {
        const next = { ...prev };
        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value && res.value.id) {
            next[res.value.id] = res.value;
          }
        });
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [view, assessments, assessmentScoresMap]);

  const handleSelectScoreAssessment = async (item: AssessmentDetails) => {
    if (selectedScoreAssessmentId === item.id) {
      setSelectedScoreAssessmentId(null);
      return;
    }
    setSelectedScoreAssessmentId(item.id);
    if (!assessmentScoresMap[item.id]) {
      setLoadingScoreDetails((prev) => ({ ...prev, [item.id]: true }));
      try {
        const detailed = await aiprepApi.getAssessment(item.id);
        if (detailed && detailed.id) {
          setAssessmentScoresMap((prev) => ({ ...prev, [detailed.id]: detailed }));
        }
      } catch (e) {
        console.warn('Could not fetch assessment details for ID', item.id, e);
      } finally {
        setLoadingScoreDetails((prev) => ({ ...prev, [item.id]: false }));
      }
    }
  };

  const filteredScoreAssessments = useMemo(() => {
    return assessments
      .filter((item) => {
        if (scoreSearchTerm.trim()) {
          const q = scoreSearchTerm.toLowerCase().trim().replace(/^#/, '');
          const idMatch = item.id.toString().includes(q);
          const typeMatch = (item.assessment_type || '').toLowerCase().includes(q);
          const nameMatch = (item.job_description || item.data?.job_description || '').toLowerCase().includes(q);
          if (!idMatch && !typeMatch && !nameMatch) return false;
        }

        if (scoreTypeFilter !== 'ALL') {
          if ((item.assessment_type || '').toUpperCase() !== scoreTypeFilter) return false;
        }

        if (scorePerformanceFilter !== 'ALL') {
          const score = getScoreForAssessment(item);
          const band = getBandForAssessment(item);
          const perf = getPerformanceCategory(score, band);
          if (scorePerformanceFilter === 'HIGH') {
            if (perf.label !== 'High Performance') return false;
          } else if (scorePerformanceFilter === 'DEVELOPING') {
            if (perf.label !== 'Developing') return false;
          } else if (scorePerformanceFilter === 'IMPROVEMENT') {
            if (perf.label !== 'Need Improvement') return false;
          } else if (scorePerformanceFilter === 'NOT_EVALUATED') {
            if (score !== null) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (scoreSortBy === 'highest') {
          const sa = getScoreForAssessment(a);
          const sb = getScoreForAssessment(b);
          if (sa === null && sb === null) return b.id - a.id;
          if (sa === null) return 1;
          if (sb === null) return -1;
          return sb - sa;
        }
        if (scoreSortBy === 'lowest') {
          const sa = getScoreForAssessment(a);
          const sb = getScoreForAssessment(b);
          if (sa === null && sb === null) return b.id - a.id;
          if (sa === null) return 1;
          if (sb === null) return -1;
          return sa - sb;
        }
        if (scoreSortBy === 'oldest') {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return da - db || a.id - b.id;
        }
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da || b.id - a.id;
      });
  }, [assessments, scoreSearchTerm, scoreTypeFilter, scorePerformanceFilter, scoreSortBy, getScoreForAssessment, getBandForAssessment, getPerformanceCategory]);

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
                    AI Prep
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
                  onClick={isSetupComplete ? handleStartClick : undefined}
                  title={!isSetupComplete ? "Complete your LLM setup and upload your resume to access this feature." : undefined}
                  className={`rounded-xl border p-3 sm:p-3.5 min-h-[85px] max-h-[100px] flex items-center gap-3.5 transition-all duration-150 select-none ${!isSetupComplete
                    ? 'opacity-60 bg-gray-50/50 dark:bg-gray-900/40 border-gray-200/90 dark:border-gray-800 cursor-not-allowed'
                    : 'border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-[#faf5ff] dark:hover:bg-purple-950/20 hover:shadow-xs cursor-pointer group'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${!isSetupComplete
                      ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                      : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gradient-to-br group-hover:from-indigo-900 group-hover:to-purple-400 group-hover:border-transparent group-hover:text-white dark:group-hover:text-white group-hover:shadow-md group-hover:scale-105'
                      }`}
                  >
                    {!isSetupComplete ? (
                      <LockKeyhole className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 translate-x-0.5 group-hover:fill-white transition-all duration-150" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm sm:text-base font-bold truncate ${!isSetupComplete ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors'}`}>
                        Start an assessment
                      </h3>
                      {!isSetupComplete && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs sm:text-[13px] mt-0.5 truncate ${!isSetupComplete
                        ? 'text-slate-400 dark:text-slate-500 font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                      {!isSetupComplete
                        ? 'Complete your LLM setup and upload your resume to access this feature.'
                        : 'Start a new practice session'}
                    </p>
                  </div>
                </div>

                {/* Card 2: View assessments (Always Enabled) */}
                <div
                  onClick={() => setView('assessments')}
                  className="rounded-xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sm:p-3.5 min-h-[85px] max-h-[100px] flex items-center gap-3.5 transition-all duration-150 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-[#faf5ff] dark:hover:bg-purple-950/20 hover:shadow-xs cursor-pointer select-none group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-gradient-to-br group-hover:from-indigo-900 group-hover:to-purple-400 group-hover:border-transparent group-hover:text-white dark:group-hover:text-white group-hover:shadow-md shrink-0 transition-all duration-150 group-hover:scale-105">
                    <ClipboardList className="w-4 h-4 transition-colors duration-150" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors truncate">
                      View assessments
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      Review all practice sessions
                    </p>
                  </div>
                </div>

                {/* Card 3: Analytics */}
                <div
                  onClick={isSetupComplete ? () => setView('analytics') : undefined}
                  title={!isSetupComplete ? "Complete your LLM setup and upload your resume to access this feature." : undefined}
                  className={`rounded-xl border p-3 sm:p-3.5 min-h-[85px] max-h-[100px] flex items-center gap-3.5 transition-all duration-150 select-none ${!isSetupComplete
                    ? 'opacity-60 bg-gray-50/50 dark:bg-gray-900/40 border-gray-200/90 dark:border-gray-800 cursor-not-allowed'
                    : 'border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-[#faf5ff] dark:hover:bg-purple-950/20 hover:shadow-xs cursor-pointer group'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${!isSetupComplete
                      ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                      : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gradient-to-br group-hover:from-indigo-900 group-hover:to-purple-400 group-hover:border-transparent group-hover:text-white dark:group-hover:text-white group-hover:shadow-md group-hover:scale-105'
                      }`}
                  >
                    {!isSetupComplete ? (
                      <LockKeyhole className="w-4 h-4" />
                    ) : (
                      <BarChart3 className="w-4 h-4 transition-colors duration-150" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm sm:text-base font-bold truncate ${!isSetupComplete ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors'}`}>
                        Analytics
                      </h3>
                      {!isSetupComplete && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs sm:text-[13px] mt-0.5 truncate ${!isSetupComplete
                        ? 'text-slate-400 dark:text-slate-500 font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                      {!isSetupComplete
                        ? 'Complete your LLM setup and upload your resume to access this feature.'
                        : 'See progress and completion'}
                    </p>
                  </div>
                </div>

                {/* Card 4: Scores */}
                <div
                  onClick={isSetupComplete ? () => setView('scores') : undefined}
                  title={!isSetupComplete ? "Complete your LLM setup and upload your resume to access this feature." : undefined}
                  className={`rounded-xl border p-3 sm:p-3.5 min-h-[85px] max-h-[100px] flex items-center gap-3.5 transition-all duration-150 select-none ${!isSetupComplete
                    ? 'opacity-60 bg-gray-50/50 dark:bg-gray-900/40 border-gray-200/90 dark:border-gray-800 cursor-not-allowed'
                    : 'border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-[#faf5ff] dark:hover:bg-purple-950/20 hover:shadow-xs cursor-pointer group'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${!isSetupComplete
                      ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                      : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gradient-to-br group-hover:from-indigo-900 group-hover:to-purple-400 group-hover:border-transparent group-hover:text-white dark:group-hover:text-white group-hover:shadow-md group-hover:scale-105'
                      }`}
                  >
                    {!isSetupComplete ? (
                      <LockKeyhole className="w-4 h-4" />
                    ) : (
                      <Trophy className="w-4 h-4 transition-colors duration-150" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm sm:text-base font-bold truncate ${!isSetupComplete ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors'}`}>
                        Scores
                      </h3>
                      {!isSetupComplete && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs sm:text-[13px] mt-0.5 truncate ${!isSetupComplete
                        ? 'text-slate-400 dark:text-slate-500 font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                      {!isSetupComplete
                        ? 'Complete your LLM setup and upload your resume to access this feature.'
                        : 'Compare completed results'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : view === 'assessments' ? (
          /* ==================== 2. ALL PRACTICE ASSESSMENTS VIEW ==================== */
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Back to Dashboard (Positioned ABOVE the page pad/container) */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setView(null)}
                className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform stroke-[2.5]" />
                <span>Back to Dashboard</span>
              </button>
            </div>

            {/* Main Content White Container Pad */}
            <div className="rounded-3xl border border-gray-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 lg:p-7 shadow-xs space-y-5 sm:space-y-6">
              {/* Header: Title, Subtitle, and Start New Practice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 sm:pb-5 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h1 className="text-lg sm:text-[20px] font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                    All Practice Assessments
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Review your practice sessions, track progress, or start a new assessment.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleStartClick}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-900 to-purple-600 hover:from-indigo-800 hover:to-purple-500 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Start New Practice</span>
                  </button>
                </div>
              </div>

            {/* 4 Compact Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
              {/* Card 1: Total Assessments */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 sm:p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Assessments
                  </p>
                  <p className="mt-0.5 text-xl sm:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">
                    {assessments.length}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                  <ClipboardList className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>

              {/* Card 2: Completed */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 sm:p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Completed
                  </p>
                  <p className="mt-0.5 text-xl sm:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">
                    {completedCount}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>

              {/* Card 3: In Progress */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 sm:p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    In Progress
                  </p>
                  <p className="mt-0.5 text-xl sm:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">
                    {inProgressCount}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shrink-0">
                  <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>

              {/* Card 4: Not Attempted */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 sm:p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Not Attempted
                  </p>
                  <p className="mt-0.5 text-xl sm:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">
                    {notAttemptedCount}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0">
                  <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>
            </div>

            {/* Search, Type filter, Status filter, and Sort controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search assessments by name, ID or role..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Controls dropdowns */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                {/* Type filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  {availableAssessmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll('_', ' ')}
                    </option>
                  ))}

                </select>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="NOT_ATTEMPTED">Not Attempted</option>
                </select>

                {/* Sort controls */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>

            {/* Horizontal rows with assessment number, name, date/time, type, status, and action */}
            <div className="space-y-2.5 sm:space-y-3">
              {filteredAssessments.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2.5">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No practice assessments found
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm mx-auto leading-relaxed">
                    {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                      ? 'No assessments match your current filters. Try resetting the filters.'
                      : 'You have not created any practice assessments yet. Start a new practice session to begin.'}
                  </p>
                  <div className="mt-3.5 flex items-center justify-center gap-2.5">
                    {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setTypeFilter('ALL');
                          setStatusFilter('ALL');
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
                      >
                        Reset Filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartClick}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900 to-purple-600 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Start New Practice</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                filteredAssessments.map((item) => {
                  const cat = getStatusCategory(item.status);
                  const displayName = getAssessmentTitle(item);
                  const formattedDate = formatDateTime(item.created_at);
                  const typeLabel = item.assessment_type ? item.assessment_type.replaceAll('_', ' ') : '-';

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-850 hover:border-purple-300 dark:hover:border-purple-700/60 p-3.5 sm:p-4 transition-all duration-150 shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
                    >
                      {/* Left: Number + Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shrink-0">
                          #{item.id}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white capitalize truncate">
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle & Right: Type, Status, and Action */}
                      <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 shrink-0 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100 dark:border-slate-800">
                        {/* Type Pill */}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md sm:rounded-lg text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 capitalize">
                          {typeLabel}
                        </span>

                        {/* Status Pill */}
                        {cat === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Completed</span>
                          </span>
                        ) : cat === 'IN_PROGRESS' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Not Attempted</span>
                          </span>
                        )}

                        {/* Action Button */}
                        <div className="shrink-0">
                          {cat === 'COMPLETED' ? (
                            <button
                              type="button"
                              onClick={() => handleViewAssessmentReport(item.id)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Report</span>
                            </button>
                          ) : cat === 'IN_PROGRESS' ? (
                            <button
                              type="button"
                              onClick={() => handleContinueAssessment(item.id)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-900 to-purple-600 hover:from-indigo-800 hover:to-purple-500 text-white text-xs font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Continue</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleStartClick}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
                            >
                              <Play className="w-3 h-3" />
                              <span>Start</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : view === 'scores' ? (
        /* ==================== 3. COMPLETED ASSESSMENT SCORES SUBPAGE ==================== */
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Back to Dashboard (Positioned ABOVE the page pad/container) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setSelectedScoreAssessmentId(null);
                setView(null);
              }}
              className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform stroke-[2.5]" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Main Content White Container Pad */}
          <div className="rounded-3xl border border-gray-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 lg:p-7 shadow-xs space-y-5 sm:space-y-6">
            {/* Header: Title and Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 sm:pb-5 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h1 className="text-lg sm:text-[20px] font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  Completed Assessment Scores
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Detailed scoring breakdown for evaluated interviews
                </p>
              </div>
            </div>

            {/* Top 4 Dynamic Summary Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Stat 1: Completed */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-4 transition-all">
                <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                  Completed
                </span>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {scoreSummaryMetrics.completedCount}
                </p>
              </div>

              {/* Stat 2: Average Score */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-4 transition-all">
                <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                  Average Score
                </span>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {scoreSummaryMetrics.avgScore !== null ? `${scoreSummaryMetrics.avgScore}%` : '-'}
                </p>
              </div>

              {/* Stat 3: High Performance */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-4 transition-all">
                <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                  High Performance
                </span>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {scoreSummaryMetrics.highPerfCount}
                </p>
              </div>

              {/* Stat 4: Need Improvement */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-4 transition-all">
                <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                  Need Improvement
                </span>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {scoreSummaryMetrics.needImproveCount}
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by assessment # or name..."
                  value={scoreSearchTerm}
                  onChange={(e) => setScoreSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {scoreSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setScoreSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Dynamic Assessment Type Filter */}
                <select
                  value={scoreTypeFilter}
                  onChange={(e) => setScoreTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  {availableAssessmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>

                {/* Score / Performance Filter */}
                <select
                  value={scorePerformanceFilter}
                  onChange={(e) => setScorePerformanceFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="ALL">All Scores</option>
                  <option value="HIGH">High Performance</option>
                  <option value="DEVELOPING">Developing</option>
                  <option value="IMPROVEMENT">Need Improvement</option>
                  <option value="NOT_EVALUATED">Not Evaluated</option>
                </select>

                {/* Sort */}
                <select
                  value={scoreSortBy}
                  onChange={(e) => setScoreSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Score</option>
                  <option value="lowest">Lowest Score</option>
                </select>
              </div>
            </div>

            {/* Selected Assessment Score Detail Panel */}
            {(() => {
              if (selectedScoreAssessmentId === null) return null;
              const selItem = assessments.find((a) => a.id === selectedScoreAssessmentId);
              if (!selItem) return null;

              const selScore = getScoreForAssessment(selItem);
              const selBand = getBandForAssessment(selItem);
              const selPerf = getPerformanceCategory(selScore, selBand);
              const selName = getAssessmentTitle(selItem);
              const selType = selItem.assessment_type ? selItem.assessment_type.replaceAll('_', ' ') : '-';
              const selDate = formatDateTime(selItem.created_at);

              return (
                <div className="rounded-2xl border border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 p-4 sm:p-5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-indigo-100/70 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-xs">
                        #{selItem.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white capitalize">
                            {selName}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold border ${
                              selItem.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
                                : selItem.status === 'IN_PROGRESS' || selItem.status === 'EVALUATING'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                selItem.status === 'COMPLETED'
                                  ? 'bg-emerald-500'
                                  : selItem.status === 'IN_PROGRESS' || selItem.status === 'EVALUATING'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>
                              {selItem.status === 'COMPLETED'
                                ? 'Completed'
                                : selItem.status === 'EVALUATING'
                                ? 'Evaluating'
                                : selItem.status === 'IN_PROGRESS'
                                ? 'In Progress'
                                : selItem.status}
                            </span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {selDate} • {selType}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedScoreAssessmentId(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Close Details</span>
                    </button>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5">
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-3">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Assessment #
                      </span>
                      <p className="mt-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        #{selItem.id}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-3">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Date
                      </span>
                      <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {selDate}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-3">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Overall Score
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        {loadingScoreDetails[selItem.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-500 mt-1" />
                        ) : (
                          <p
                            className={`text-base sm:text-lg font-black ${
                              selScore != null
                                ? selPerf.label === 'High Performance'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : selPerf.label === 'Need Improvement'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {selScore != null ? `${selScore}%` : '-'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-3">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Performance
                      </span>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${selPerf.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${selPerf.dotClass}`} />
                          <span>{selPerf.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Assessment Scores Table (Desktop) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-16">#</th>
                    <th className="py-3 px-4">Assessment Name</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredScoreAssessments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                        No assessments found matching your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredScoreAssessments.map((item) => {
                      const isSelected = selectedScoreAssessmentId === item.id;
                      const score = getScoreForAssessment(item);
                      const displayName = getAssessmentTitle(item);
                      const formattedDate = item.created_at
                        ? new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Date N/A';

                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectScoreAssessment(item)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-inset ring-indigo-500/50'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                              }`}
                            >
                              #{item.id}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 dark:text-white capitalize">
                              {displayName}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                            {formattedDate}
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                              {item.assessment_type ? item.assessment_type.replaceAll('_', ' ') : '-'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {loadingScoreDetails[item.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                            ) : score !== null ? (
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {score}%
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold border ${
                                item.status === 'COMPLETED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
                                  : item.status === 'IN_PROGRESS' || item.status === 'EVALUATING'
                                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.status === 'COMPLETED'
                                    ? 'bg-emerald-500'
                                    : item.status === 'IN_PROGRESS' || item.status === 'EVALUATING'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              <span>
                                {item.status === 'COMPLETED'
                                  ? 'Completed'
                                  : item.status === 'EVALUATING'
                                  ? 'Evaluating'
                                  : item.status === 'IN_PROGRESS'
                                  ? 'In Progress'
                                  : item.status}
                              </span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectScoreAssessment(item);
                              }}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              title="View Score Details"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Assessment Scores Cards (Mobile) */}
            <div className="md:hidden space-y-2.5">
              {filteredScoreAssessments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No assessments found matching your search or filters.
                </div>
              ) : (
                filteredScoreAssessments.map((item) => {
                  const isSelected = selectedScoreAssessmentId === item.id;
                  const score = getScoreForAssessment(item);
                  const displayName = getAssessmentTitle(item);
                  const formattedDate = item.created_at
                    ? new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Date N/A';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectScoreAssessment(item)}
                      className={`rounded-2xl border p-3.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-300 bg-indigo-50/50 dark:border-indigo-700 dark:bg-indigo-950/40 ring-1 ring-indigo-500/50'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white font-bold text-[11px]">
                            #{item.id}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                            {displayName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{formattedDate}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                            {item.assessment_type ? item.assessment_type.replaceAll('_', ' ') : '-'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              item.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            Score: {score !== null ? `${score}%` : '-'}
                          </span>
                          <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
          /* ==================== 4. ANALYTICS SUBPAGE VIEW ==================== */
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
                    Practice Analytics & Insights
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Aggregated performance data from your practice sessions
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
