'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/utils/AuthContext';
import { aiPrepApi } from '@/lib/aiprep-api';
import type { AssessmentType, AssessmentMode, HardwareCheckResults } from '@/types/aiprep';
import { apiFetch } from '@/lib/api';
import { DeviceCheckWizard } from '@/components/aiprep/DeviceCheckWizard';
import { SUPPORTED_ASSESSMENT_TYPES } from '@/components/aiprep/Assessmentselection';
import AIPrepDashboard from '@/components/aiprep/AIPrepDashboard';
import AssessmentSessionPage from './session/[assessmentId]/page';
import { AlertCircle, Loader2, Laptop, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AIPrepPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Prevent duplicate assessment creation before React can render the saving state.
  const setupSubmissionInFlightRef = useRef(false);

  const isUserAuthenticated = isAuthenticated;

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Auth is restored asynchronously on a hard reload; wait before redirecting.
    if (authLoading) return;
    if (!isUserAuthenticated) {
      if (typeof window !== 'undefined') {
        if (window.top && window.top !== window.self) {
          window.top.location.href = '/login';
        } else {
          router.replace('/login');
        }
      }
    }
  }, [isUserAuthenticated, authLoading, router]);

  const [isEmbedded, setIsEmbedded] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const embedded = window.self !== window.top || searchParams.get('embed') === 'true';
      setIsEmbedded(embedded);
    }
  }, [searchParams]);

  // Active preferences
  const queryType = searchParams.get('type') as AssessmentType | null;
  const queryMode = searchParams.get('mode') as AssessmentMode | null;

  const storedType = typeof window !== 'undefined' ? (sessionStorage.getItem('aiprep_active_type') as AssessmentType | null) : null;
  const storedMode = typeof window !== 'undefined' ? (sessionStorage.getItem('aiprep_active_mode') as AssessmentMode | null) : null;
  const storedVideo = typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_video_enabled') : null;

  let fallbackMode = storedMode;
  if (!fallbackMode && typeof window !== 'undefined') {
    if (storedVideo === 'true') {
      fallbackMode = 'VIDEO_AUDIO';
    } else if (storedVideo === 'false') {
      fallbackMode = 'AUDIO_ONLY';
    } else {
      const pendingRaw = sessionStorage.getItem('aiprep_pending_setup_results') || sessionStorage.getItem('aiprep_hardware_check');
      if (pendingRaw) {
        try {
          const parsed = JSON.parse(pendingRaw);
          if (parsed.video_enabled === true) fallbackMode = 'VIDEO_AUDIO';
          else if (parsed.video_enabled === false) fallbackMode = 'AUDIO_ONLY';
        } catch (_) {}
      }
    }
  }

  let fallbackType = storedType;
  if (!fallbackType && typeof window !== 'undefined') {
    const pendingRaw = sessionStorage.getItem('aiprep_pending_setup_results') || sessionStorage.getItem('aiprep_hardware_check');
    if (pendingRaw) {
      try {
        const parsed = JSON.parse(pendingRaw);
        if (parsed.assessment_type) fallbackType = parsed.assessment_type;
      } catch (_) {}
    }
  }

  const effectiveType = queryType || fallbackType || SUPPORTED_ASSESSMENT_TYPES[0];
  const effectiveMode = queryMode || fallbackMode || '';

  const [activeAssessmentId, setActiveAssessmentId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      // Pending setup data is written only for the four deferred assessment types.
      // It takes precedence over any stale assessment ID from an earlier attempt.
      if (sessionStorage.getItem('aiprep_pending_setup_results')) return 0;
      const stored = sessionStorage.getItem('aiprep_active_id');
      if (stored) return parseInt(stored, 10);
    }
    return null;
  });

  // While the technical instructions are open, browser Back should behave like the
  // on-page Back button and return to the Practice page instead of leaving a stale attempt.
  useEffect(() => {
    if (!activeAssessmentId || typeof window === 'undefined') return;
    // Keep /aiprep/start stable on reload; do not install history interception there.
    if (window.location.pathname === '/aiprep/start') return;

    const practiceUrl = '/user_dashboard/ai-prep/practice';
    window.history.pushState({ aiprepInstructions: activeAssessmentId }, '', window.location.href);

    const handleBrowserBack = () => {
      sessionStorage.removeItem('aiprep_active_id');
      sessionStorage.removeItem('aiprep_active_questions');
      sessionStorage.setItem('aiprep_wizard_step', 'PRACTICE_START');
      router.replace(practiceUrl);
    };

    window.addEventListener('popstate', handleBrowserBack);
    return () => window.removeEventListener('popstate', handleBrowserBack);
  }, [activeAssessmentId, router]);

  // Create assessments immediately for INTRO/JD_INTRO as before.
  // TECHNICAL, RECRUITER, HIRING_MANAGER and SYSTEM_DESIGN are created only
  // after the candidate clicks Start Assessment on the Before You Begin screen.
  const handleCheckComplete = async (results: HardwareCheckResults) => {
    if (setupSubmissionInFlightRef.current) return;
    setupSubmissionInFlightRef.current = true;
    try {
      setIsSaving(true);
      setErrorMsg(null);

      const normalizeType = (value: unknown): string =>
        String(value || '').trim().toUpperCase().replace(/ +/g, '_').replace(/-/g, '_');
      const typeAliases: Record<string, AssessmentType> = {
        TECHNICAL_ASSESSMENT: 'TECHNICAL',
        RECRUITER_ASSESSMENT: 'RECRUITER',
        HIRING_MANAGER_ASSESSMENT: 'HIRING_MANAGER',
        SYSTEM_DESIGN_ASSESSMENT: 'SYSTEM_DESIGN',
      };
      const deferredTypes: AssessmentType[] = ['TECHNICAL', 'RECRUITER', 'HIRING_MANAGER', 'SYSTEM_DESIGN'];
      // Use the current setup result first so stale sessionStorage from a prior
      // assessment cannot change the INTRO/JD_INTRO flow.
      const currentType = normalizeType(queryType || results.assessment_type || effectiveType || 'INTRO');
      const targetType = (typeAliases[currentType] || currentType) as AssessmentType;
      const createOnStart = deferredTypes.includes(targetType);
      const targetMode = results.video_enabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY';

      if (createOnStart) {
        sessionStorage.setItem('aiprep_pending_setup_results', JSON.stringify(results));
        sessionStorage.setItem('aiprep_active_type', targetType);
        sessionStorage.setItem('aiprep_active_mode', targetMode);
        sessionStorage.setItem('aiprep_user_selected_mode', targetMode);
        sessionStorage.setItem('aiprep_video_enabled', results.video_enabled ? 'true' : 'false');
        sessionStorage.setItem('aiprep_consent_camera', results.video_enabled ? 'true' : 'false');
        sessionStorage.setItem('aiprep_consent_analytics', results.analytics_consent ? 'true' : 'false');
        sessionStorage.setItem('aiprep_hardware_check', JSON.stringify(results));
        sessionStorage.removeItem('aiprep_active_id');
        sessionStorage.removeItem('aiprep_active_questions');
        sessionStorage.setItem('aiprep_wizard_step', 'DEVICE_CHECK');
        setActiveAssessmentId(0);
        setupSubmissionInFlightRef.current = false;
        setIsSaving(false);
        return;
      }

      // Preserve the original INTRO and JD_INTRO setup flow.
      let candidateId: number | undefined;
      try {
        const stored = localStorage.getItem('candidate_id') || sessionStorage.getItem('aiprep_candidate_id');
        if (stored && !Number.isNaN(Number(stored))) {
          candidateId = Number(stored);
        } else {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const parsed = JSON.parse(userStr);
            if (parsed?.candidate_id) candidateId = Number(parsed.candidate_id);
            else if (parsed?.id) candidateId = Number(parsed.id);
          }
        }
      } catch (err) {
        // Candidate ID lookup is optional; continue with the authenticated session fallback.
      }

      const assessment = await aiPrepApi.createAssessment({
        assessment_type: targetType,
        assessment_mode: targetMode,
        candidate_id: candidateId,
        job_description_text: results.jd_text || null,
        consent_save_recording: results.consent_save_recording,
        consent_save_transcript: results.consent_save_transcript,
      });

      if (!assessment?.id) throw new Error('Failed to initialize assessment session on server.');
      const targetId = Number(assessment.id);
      // Clear stale terminal markers when local/dev data reuses an assessment ID.
      localStorage.removeItem(`aiprep_reload_cancelled_${targetId}`);
      localStorage.removeItem(`aiprep_exited_${targetId}`);
      localStorage.removeItem(`aiprep_finished_${targetId}`);
      sessionStorage.removeItem(`aiprep_exited_${targetId}`);
      sessionStorage.removeItem(`aiprep_started_${targetId}`);
      sessionStorage.removeItem(`aiprep_autostart_assessment_${targetId}`);
      const returnedQuestions = Array.isArray(assessment.questions) ? assessment.questions : [];
      if (returnedQuestions.length === 0) {
        throw new Error('The assessment was created, but the server did not return any questions. Please try again.');
      }

      sessionStorage.setItem('aiprep_hardware_check', JSON.stringify(results));
      sessionStorage.setItem('aiprep_active_id', String(targetId));
      sessionStorage.setItem('aiprep_active_type', targetType);
      sessionStorage.setItem('aiprep_active_mode', targetMode);
      sessionStorage.setItem('aiprep_active_questions', JSON.stringify(returnedQuestions));
      sessionStorage.removeItem('aiprep_pending_setup_results');
      sessionStorage.removeItem('aiprep_wizard_step');
      setActiveAssessmentId(targetId);
      setupSubmissionInFlightRef.current = false;
      setIsSaving(false);
    } catch (err: any) {
      // Surface setup failures in the UI instead of producing an unhandled rejection.
      setErrorMsg(err?.message || 'Setup pipeline failed. Please try again.');
      setIsSaving(false);
      setupSubmissionInFlightRef.current = false;
    }
  };

  // Called only from Start Assessment for the four assessment types above.
  const createPendingAssessment = async (): Promise<number> => {
    const rawResults = sessionStorage.getItem('aiprep_pending_setup_results');
    if (!rawResults) throw new Error('Your assessment setup expired. Please run the device check again.');
    const results = JSON.parse(rawResults) as HardwareCheckResults;

    let candidateId: number | undefined;
    try {
      const stored = localStorage.getItem('candidate_id') || sessionStorage.getItem('aiprep_candidate_id');
      if (stored && !Number.isNaN(Number(stored))) candidateId = Number(stored);
      else {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          if (parsed?.candidate_id) candidateId = Number(parsed.candidate_id);
          else if (parsed?.id) candidateId = Number(parsed.id);
        }
      }
    } catch (err) {
      console.error('Failed to retrieve candidate profile details:', err);
    }

    const rawType = String(results.assessment_type || effectiveType || 'TECHNICAL')
      .trim()
      .toUpperCase()
        .replace(/ /g, '_').replace(/-/g, '_');
    const typeAliases: Record<string, AssessmentType> = {
      TECHNICAL_ASSESSMENT: 'TECHNICAL',
      RECRUITER_ASSESSMENT: 'RECRUITER',
      HIRING_MANAGER_ASSESSMENT: 'HIRING_MANAGER',
      SYSTEM_DESIGN_ASSESSMENT: 'SYSTEM_DESIGN',
    };
    const targetType = (typeAliases[rawType] || rawType) as AssessmentType;
    const assessment = await aiPrepApi.createAssessment({
      assessment_type: targetType,
      assessment_mode: results.video_enabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY',
      candidate_id: candidateId,
      job_description_text: results.jd_text || null,
      consent_save_recording: results.consent_save_recording,
      consent_save_transcript: results.consent_save_transcript,
    });

    if (!assessment?.id) throw new Error('Failed to initialize assessment session on server.');
    const targetId = Number(assessment.id);
    const returnedQuestions = Array.isArray(assessment.questions) ? assessment.questions : [];
    if (returnedQuestions.length === 0) {
      throw new Error('The assessment was created, but the server did not return any questions. Please try again.');
    }

    // Remove stale end/cancel state before navigating into a newly created attempt.
      localStorage.removeItem(`aiprep_reload_cancelled_${targetId}`);
      localStorage.removeItem(`aiprep_exited_${targetId}`);
      localStorage.removeItem(`aiprep_finished_${targetId}`);
      sessionStorage.removeItem(`aiprep_exited_${targetId}`);
      sessionStorage.removeItem(`aiprep_started_${targetId}`);
      sessionStorage.setItem('aiprep_active_id', String(targetId));
    sessionStorage.setItem('aiprep_active_type', targetType);
    sessionStorage.setItem('aiprep_active_mode', results.video_enabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY');
    sessionStorage.setItem('aiprep_active_questions', JSON.stringify(returnedQuestions));
    sessionStorage.removeItem('aiprep_pending_setup_results');
    // Let handleStartAnswer navigate to the new session route first.
    // Do not update the parent in-place session ID here: that can mount/start
    // the question in the instructions component and then start it again after navigation.
    sessionStorage.setItem(`aiprep_autostart_assessment_${targetId}`, 'true');
    return targetId;
  };

  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const autoCollapseTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const hasAutoCollapsedRef = React.useRef(false);

  useEffect(() => {
    const handleExternalLayout = (e: any) => {
      if (typeof e?.detail?.headerCollapsed === 'boolean') {
        setHeaderCollapsed(e.detail.headerCollapsed);
        if (e?.detail?.userInitiated && autoCollapseTimerRef.current) {
          clearTimeout(autoCollapseTimerRef.current);
          hasAutoCollapsedRef.current = true;
        }
      }
    };
    window.addEventListener('aiprep-layout-mode', handleExternalLayout);
    return () => window.removeEventListener('aiprep-layout-mode', handleExternalLayout);
  }, []);


  const showWizard = started || searchParams.get('start') === 'true' || pathname === '/aiprep/start';

  useEffect(() => {
    if (showWizard) {
      if (!hasAutoCollapsedRef.current) {
        setHeaderCollapsed(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('aiprep-layout-mode', {
            detail: { active: true, fullscreen: false, headerCollapsed: false }
          }));
        }
        autoCollapseTimerRef.current = setTimeout(() => {
          hasAutoCollapsedRef.current = true;
          setHeaderCollapsed(true);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('aiprep-layout-mode', {
              detail: { active: true, fullscreen: true, headerCollapsed: true }
            }));
          }
        }, 500);
      }
    } else {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = null;
      }
      hasAutoCollapsedRef.current = false;
      setHeaderCollapsed(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aiprep-layout-mode', {
          detail: { active: false, fullscreen: false, headerCollapsed: false }
        }));
      }
    }
    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
      }
    };
  }, [showWizard]);

  const handleStartAssessment = () => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
    hasAutoCollapsedRef.current = false;
    setHeaderCollapsed(false);
    setStarted(true);
    const isEmbeddedCheck = searchParams.get('embed') === 'true' || (typeof window !== 'undefined' && window.self !== window.top);
    router.push(isEmbeddedCheck ? '/aiprep?embed=true&start=true' : '/aiprep?start=true');
  };

  const handleCancel = () => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
    hasAutoCollapsedRef.current = false;
    setHeaderCollapsed(false);
    sessionStorage.removeItem('aiprep_wizard_step');
    sessionStorage.removeItem('aiprep_active_type');
    sessionStorage.removeItem('aiprep_active_mode');
    sessionStorage.removeItem('aiprep_active_id');
    sessionStorage.removeItem('aiprep_jd_text');
    sessionStorage.removeItem('aiprep_jd_filename');
    sessionStorage.removeItem('aiprep_jd_role');
    sessionStorage.removeItem('aiprep_jd_company');
    setStarted(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aiprep-layout-mode', {
        detail: { active: false, fullscreen: false, headerCollapsed: false }
      }));
    }
    const isEmbeddedCheck = searchParams.get('embed') === 'true' || (typeof window !== 'undefined' && window.self !== window.top);
    router.replace(isEmbeddedCheck ? '/aiprep?embed=true' : '/aiprep');
  };

  const toggleHeader = () => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
    const nextCollapsed = !headerCollapsed;
    setHeaderCollapsed(nextCollapsed);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aiprep-layout-mode', {
        detail: { active: true, fullscreen: nextCollapsed, headerCollapsed: nextCollapsed }
      }));
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-8">
        <div className="h-10 w-10 rounded-full border-t-2 border-r-2 border-[#4A6CF7] animate-spin mb-4" />
        <p className="text-xs text-slate-550 font-semibold select-none">Loading secure environment...</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
          <Laptop className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Desktop Only Feature</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
          AI PrepTool is only available on desktop and laptop devices with camera and microphone support. Please access Whitebox from a desktop computer to practice your assessments.
        </p>
        <button
          type="button"
          onClick={() => router.push('/user_dashboard')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Active session in-place render (avoids dynamic router.push chunk downloads)
  if (activeAssessmentId !== null) {
    const shouldDeferCreation = typeof window !== 'undefined'
      && Boolean(sessionStorage.getItem('aiprep_pending_setup_results'));
    return (
      <AssessmentSessionPage
        assessmentIdProp={activeAssessmentId}
        onStartPendingAssessment={activeAssessmentId === 0 && shouldDeferCreation ? createPendingAssessment : undefined}
        onBack={() => {
          setActiveAssessmentId(null);
          setStarted(true);
          if (typeof window !== 'undefined') {
            [
              'aiprep_pending_assessment_creation',
              'aiprep_active_id',
              'aiprep_active_questions',
            ].forEach((key) => window.sessionStorage.removeItem(key));

            const rawPending = window.sessionStorage.getItem('aiprep_pending_setup_results') || window.sessionStorage.getItem('aiprep_hardware_check');
            let isVideo = false;
            let savedType: string | null = null;
            if (rawPending) {
              try {
                const parsed = JSON.parse(rawPending);
                if (parsed.video_enabled === true) isVideo = true;
                if (parsed.assessment_type) savedType = parsed.assessment_type;
              } catch (_) {}
            }
            if (
              window.sessionStorage.getItem('aiprep_active_mode') === 'VIDEO_AUDIO' ||
              window.sessionStorage.getItem('aiprep_active_mode') === 'VIDEO' ||
              window.sessionStorage.getItem('aiprep_video_enabled') === 'true'
            ) {
              isVideo = true;
            }
            if (isVideo) {
              window.sessionStorage.setItem('aiprep_video_enabled', 'true');
              window.sessionStorage.setItem('aiprep_active_mode', 'VIDEO_AUDIO');
              window.sessionStorage.setItem('aiprep_user_selected_mode', 'VIDEO_AUDIO');
              window.sessionStorage.setItem('aiprep_consent_camera', 'true');
            }
            if (savedType) {
              window.sessionStorage.setItem('aiprep_active_type', savedType);
            }
            window.sessionStorage.setItem('aiprep_wizard_step', 'DEVICE_CHECK');
          }
          const hasHistory = typeof window !== 'undefined' && (
            (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) ||
            (window.history.length > 1 && Boolean(document.referrer && document.referrer.includes(window.location.host)))
          );
          if (hasHistory) {
            router.back();
          } else {
            const isEmbeddedCheck = searchParams.get('embed') === 'true' || (typeof window !== 'undefined' && window.self !== window.top);
            router.replace(isEmbeddedCheck ? '/user_dashboard/ai-prep/device-check?embed=true' : '/user_dashboard/ai-prep/device-check');
          }
        }}
      />
    );
  }

  // AIPrep Dashboard renders first. When "Start Assessment" is clicked, it opens the selection, consent, and device check flow.
  if (!showWizard && !isSaving && !errorMsg) {
    return (
      <div className={isEmbedded ? "min-h-screen bg-slate-50 dark:bg-[#0b0f19] p-4 sm:p-6" : "pt-24 pb-12 min-h-screen bg-slate-50 dark:bg-[#0b0f19] px-4 sm:px-6"}>
        <AIPrepDashboard />
      </div>
    );
  }
  return (
    <div className={`w-full h-[100dvh] h-screen flex-1 min-h-0 bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col transition-all duration-700 ease-in-out overflow-hidden select-none ${!isEmbedded ? 'pt-[88px] lg:pt-[96px]' : 'pt-0'
      }`}>
      {showWizard && !isEmbedded && (
        <button
          type="button"
          onClick={toggleHeader}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center py-3 px-2 rounded-r-xl bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xl shadow-purple-500/25 text-white hover:pr-3 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 group animate-in fade-in"
          title={headerCollapsed ? "Expand navigation header" : "Minimize navigation header"}
          aria-label={headerCollapsed ? "Expand navigation header" : "Minimize navigation header"}
        >
          {headerCollapsed ? (
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform text-white" />
          ) : (
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform text-white" />
          )}
        </button>
      )}
      {errorMsg ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8 max-w-md mx-auto my-12 animate-in fade-in zoom-in-95 duration-300">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
            Setup Connection Failed
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-6 font-medium">
            {errorMsg}
          </p>
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              Retry Setup Flow
            </button>
          </div>
        </div>
      ) : isSaving ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8 animate-in fade-in duration-200">
          <Loader2 className="w-12 h-12 text-[#4A6CF7] animate-spin mb-6" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Initializing Assessment Room</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs leading-relaxed font-semibold">
            Registering hardware verification and preparing question prompts. This will only take a moment.
          </p>
        </div>
      ) : (
        <DeviceCheckWizard
          assessmentId={activeAssessmentId}
          assessmentType={effectiveType}
          assessmentMode={effectiveMode}
          audioOnly={effectiveMode === 'AUDIO_ONLY'}
          initialStep={(typeof window !== 'undefined' ? (sessionStorage.getItem('aiprep_wizard_step') as any) : null) || 'CONFIGURATION'}
          onComplete={handleCheckComplete}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

