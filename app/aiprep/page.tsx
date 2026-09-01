/**
 * AIPrep Main Page Route
 * 
 * Route: /aiprep
 * 
 * Redirects or renders the DeviceCheckWizard directly. The dashboard cards
 * will be placed here by Vishnu later.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { aiprepApi, AssessmentType, AssessmentMode } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { DeviceCheckWizard } from '@/components/aiprep/DeviceCheckWizard';
import { AlertCircle, Loader2 } from 'lucide-react';


export default function AIPrepPage() {
  const router = useRouter();

  // Authentication & Hydration validation
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    async function verifyAuth() {
      // If running inside an iframe (candidate dashboard), always treat as authenticated.
      // Never redirect — that would load the homepage INSIDE the iframe.
      const isEmbedded = typeof window !== 'undefined' && (
        window.self !== window.top || window.location.search.includes('embed=true')
      );
      if (isEmbedded) {
        setIsAuthenticated(true);
        return;
      }

      // Standalone route: verify via token or API
      const token = typeof window !== 'undefined' && (
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("bearer_token")
      );
      if (token) {
        setIsAuthenticated(true);
        return;
      }

      try {
        await apiFetch("user_dashboard");
        setIsAuthenticated(true);
      } catch (err) {
        console.warn('[Security Guard]: Unauthenticated. Redirecting to login.');
        router.replace('/login');
      }
    }
    verifyAuth();
  }, [router]);

  const searchParams = useSearchParams();

  // Active preferences
  const queryType = searchParams.get('type') as AssessmentType | null;
  const queryMode = searchParams.get('mode') as AssessmentMode | null;

  const storedType = typeof window !== 'undefined' ? (sessionStorage.getItem('aiprep_active_type') as AssessmentType | null) : null;
  const storedMode = typeof window !== 'undefined' ? (sessionStorage.getItem('aiprep_active_mode') as AssessmentMode | null) : null;

  const effectiveType = queryType || storedType || 'TECHNICAL';
  const effectiveMode = queryMode || storedMode || 'VIDEO_AUDIO';

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

    const assessment = await aiprepApi.createAssessment({
      assessment_type: results.assessment_type as AssessmentType,
      assessment_mode: results.video_enabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY',
      candidate_id: candidateId,
      job_description_text: results.assessment_type === 'JOB_DESCRIPTION_INTRO' ? results.jd_text : null,
    });

    if (!assessment || !assessment.id) {
      throw new Error('Failed to initialize assessment session on server.');
    }
    const targetId = assessment.id;
    setActiveAssessmentId(targetId);
    sessionStorage.setItem('aiprep_active_id', String(targetId));

    await aiprepApi.saveHardwareCheck({
      assessment_id: targetId,
      browser_info: results.browser_info,
      os_info: results.os_info,
      camera_permission: results.camera_permission,
      mic_permission: results.mic_permission,
      speaker_ok: results.speaker_ok,
      bandwidth_kbps: results.bandwidth_kbps,
      yolo_model_enabled: results.camera_permission && results.yolo_consent,
    });

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

      const targetId = activeAssessmentId;
      if (!targetId) {
        throw new Error('Assessment session missing. Please retry.');
      }

      const statusRes = await aiprepApi.updateAssessmentStatus(targetId, 'IN_PROGRESS');
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

  const handleCancel = () => {
    sessionStorage.removeItem('aiprep_wizard_step');
    sessionStorage.removeItem('aiprep_active_type');
    sessionStorage.removeItem('aiprep_active_mode');
    sessionStorage.removeItem('aiprep_active_id');
    // Always use Next.js router to avoid full-page reload inside the iframe
    // which would cause the homepage layout to render inside the candidate dashboard
    router.replace('/aiprep?embed=true');
  };

  if (!isMounted || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-8">
        <div className="h-10 w-10 rounded-full border-t-2 border-r-2 border-[#4A6CF7] animate-spin mb-4" />
        <p className="text-xs text-slate-550 font-semibold select-none">Loading secure environment...</p>
      </div>
    );
  }

  const isEmbedded = searchParams.get('embed') === 'true';

  return (
    <div className={`w-full bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200 ${isEmbedded ? 'h-screen max-h-screen overflow-hidden p-2 sm:p-3' : 'min-h-screen p-4 sm:p-5'}`}>

      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4A6CF7]/5 dark:bg-[#4A6CF7]/2 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4A6CF7]/5 dark:bg-[#4A6CF7]/2 blur-3xl pointer-events-none -z-10" />

      <div className="w-full flex-1 flex flex-col z-10 min-h-0 overflow-hidden">
        {errorMsg ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8 max-w-md mx-auto my-12 animate-in fade-in zoom-in-95 duration-300">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-lg font-black text-slate-905 dark:text-white mb-2">
              Setup Connection Failed
            </h3>
            <p className="text-slate-650 dark:text-slate-400 text-xs leading-relaxed mb-6 font-medium">
              {errorMsg}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-650 hover:bg-indigo-500 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Retry Setup Flow
              </button>
            </div>
          </div>
        ) : isSaving ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8 animate-in fade-in duration-200">
            <Loader2 className="w-12 h-12 text-[#4A6CF7] animate-spin mb-6" />
            <h3 className="text-lg font-black text-slate-905 dark:text-white mb-2">Initializing Assessment Room</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs leading-relaxed font-semibold">
              Registering hardware verification and preparing question prompts. This will only take a moment.
            </p>
          </div>
        ) : (
          <DeviceCheckWizard
            assessmentId={activeAssessmentId || 0}
            assessmentType={effectiveType}
            assessmentMode={effectiveMode}
            audioOnly={effectiveMode === 'AUDIO_ONLY'}
            onPrepareConfirmation={handlePrepareConfirmation}
            onComplete={handleCheckComplete}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
