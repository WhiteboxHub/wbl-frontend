'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/utils/AuthContext';
import { aiPrepApi, AssessmentType, AssessmentMode } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { DeviceCheckWizard } from '@/components/aiprep/DeviceCheckWizard';
import { SUPPORTED_ASSESSMENT_TYPES } from '@/components/aiprep/AssessmentCard';
import AIPrepDashboard from '@/components/aiprep/AIPrepDashboard';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function AIPrepPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isUserAuthenticated = isAuthenticated;

  useEffect(() => {
    setIsMounted(true);
    if (!isUserAuthenticated) {
      if (typeof window !== 'undefined') {
        if (window.top && window.top !== window.self) {
          window.top.location.href = '/login';
        } else {
          router.replace('/login');
        }
      }
    }
  }, [isUserAuthenticated, router]);

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

  const effectiveType = queryType || storedType || SUPPORTED_ASSESSMENT_TYPES[0];
  const effectiveMode = queryMode || storedMode || '';

  const [activeAssessmentId, setActiveAssessmentId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('aiprep_active_id');
      if (stored) return parseInt(stored, 10);
    }
    return null;
  });

  // Phase 1 — called when transitioning from DEVICE_CHECK → CONFIRMATION
  const handlePrepareConfirmation = async (results: {
    browser_info: string;
    os_info: string;
    camera_permission: boolean;
    mic_permission: boolean;
    speaker_ok: boolean;
    bandwidth_kbps: number;
    yolo_consent: boolean;
    assessment_type: string;
    audio_enabled: boolean;
    video_enabled: boolean;
    jd_text: string;
  }): Promise<number> => {
    let candidateId: number | undefined = undefined;
    try {
      const userResponse = await apiFetch("user_dashboard");
      if (userResponse?.candidate_id) candidateId = userResponse.candidate_id;
    } catch (err) {
      console.error("Failed to retrieve candidate profile details:", err);
    }

    const targetType: AssessmentType = 'INTRO';
    const assessment = await aiPrepApi.createAssessment({
      assessment_type: targetType,
      assessment_mode: results.video_enabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY',
      candidate_id: candidateId,
      job_description_text: null,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    });

    if (!assessment || !assessment.id) {
      throw new Error('Failed to initialize assessment session on server.');
    }
    const targetId = assessment.id;
    setActiveAssessmentId(targetId);
    sessionStorage.setItem('aiprep_active_id', String(targetId));
    sessionStorage.setItem('aiprep_active_type', 'INTRO');

    sessionStorage.setItem('aiprep_hardware_check', JSON.stringify(results));

    return targetId!;
  };

  // Phase 2 — Wizard final completion ("Start Assessment" button)
  const handleCheckComplete = async (_results: {
    browser_info: string;
    os_info: string;
    camera_permission: boolean;
    mic_permission: boolean;
    speaker_ok: boolean;
    bandwidth_kbps: number;
    yolo_consent: boolean;
    assessment_type: string;
    audio_enabled: boolean;
    video_enabled: boolean;
    jd_text: string;
  }) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);

      let targetId = activeAssessmentId;
      if (!targetId) {
        targetId = await handlePrepareConfirmation(_results);
      }

      const statusRes = await aiPrepApi.updateAssessmentStatus(targetId, 'IN_PROGRESS');
      if (!statusRes || statusRes.status !== 'IN_PROGRESS') {
        throw new Error('Failed to launch the practice assessment room. Please retry.');
      }

      const isEmbedded = window.self !== window.top || window.location.search.includes('embed=true');
      const targetSessionUrl = isEmbedded ? `/aiprep/session/${targetId}?embed=true` : `/aiprep/session/${targetId}`;

      sessionStorage.removeItem('aiprep_active_id');
      sessionStorage.removeItem('aiprep_wizard_step');

      router.push(targetSessionUrl);
    } catch (err: any) {
      console.error('[Session Setup Error] Creation pipeline failed:', err);
      setErrorMsg(err.message || 'Setup pipeline failed. Please try again.');
      setIsSaving(false);
    }
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

  const showWizard = started || searchParams.get('start') === 'true';

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
        }, 2000);
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
    setStarted(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aiprep-layout-mode', {
        detail: { active: false, fullscreen: false, headerCollapsed: false }
      }));
    }
    const isEmbeddedCheck = searchParams.get('embed') === 'true' || (typeof window !== 'undefined' && window.self !== window.top);
    router.replace(isEmbeddedCheck ? '/aiprep?embed=true' : '/aiprep');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-8">
        <div className="h-10 w-10 rounded-full border-t-2 border-r-2 border-[#4A6CF7] animate-spin mb-4" />
        <p className="text-xs text-slate-550 font-semibold select-none">Loading secure environment...</p>
      </div>
    );
  }

  if (!isUserAuthenticated) {
    return null;
  }

  // AIPrep Dashboard renders first. When "Start Assessment" is clicked, it opens the selection, consent, and device check flow.
  if (!showWizard && !isSaving && !errorMsg) {
    return (
      <div className={isEmbedded ? "min-h-screen bg-slate-50 dark:bg-[#0b0f19]" : "pt-24 pb-12 min-h-screen bg-slate-50 dark:bg-[#0b0f19]"}>
        <AIPrepDashboard />
      </div>
    );
  }
  return (
    <div className={`w-full h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col transition-all duration-700 ease-in-out overflow-hidden select-none ${!isEmbedded && !headerCollapsed ? 'pt-[72px] lg:pt-[76px]' : 'pt-0'
      }`}>
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
          assessmentId={activeAssessmentId }
          assessmentType={effectiveType}
          assessmentMode={effectiveMode}
          audioOnly={effectiveMode === 'AUDIO_ONLY'}
          initialStep={(typeof window !== 'undefined' ? (sessionStorage.getItem('aiprep_wizard_step') as any) : null) || 'CONFIGURATION'}
          onPrepareConfirmation={handlePrepareConfirmation}
          onComplete={handleCheckComplete}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

