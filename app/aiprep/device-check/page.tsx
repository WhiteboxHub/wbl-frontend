/**
 * Device Check Page Route
 * 
 * Target Workspace: wbl-frontend
 * Route: /aiprep/device-check
 *
 * 
 * Continuous Flow:
 * 1. Checks if assessmentId is specified. If not, queries parameters (type & mode) are read.
 * 2. Mounts the DeviceCheckWizard onboarding flow immediately.
 * 3. Inside the wizard, the candidate selects options, consents to privacy modules, and tests hardware.
 * 4. Once validation is completed ("Start Assessment"), creates the assessment session on the backend
 *    (if not created yet), records privacy consent, saves hardware checks, and redirects to the session room.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { aiprepApi, AssessmentType, AssessmentMode } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { DeviceCheckWizard } from '@/components/aiprep/DeviceCheckWizard';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function DeviceCheckPage() {
  const router = useRouter();

  // Route Security Guard: Ensure candidate is logged in using existing apiFetch helper
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyAuth() {
      try {
        await apiFetch("user_dashboard");
        setIsAuthenticated(true);
      } catch (err) {
        console.warn('[Security Guard]: Unauthenticated access attempt to /aiprep/device-check. Redirecting to login.');
        router.replace('/login');
      }
    }
    verifyAuth();
  }, [router]);

  const searchParams = useSearchParams();

  // Params
  const queryAssessmentId = searchParams.get('assessmentId');
  const queryType = searchParams.get('type') as AssessmentType | null;
  const queryMode = searchParams.get('mode') as AssessmentMode | null;

  // Session storage fallback for browser refreshes
  const storedType = typeof window !== 'undefined' ? (sessionStorage.getItem('aiprep_active_type') as AssessmentType | null) : null;
  const storedMode = typeof window !== 'undefined' ? (sessionStorage.getItem('aiprep_active_mode') as AssessmentMode | null) : null;
  const storedIdStr = typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_active_id') : null;
  const storedId = storedIdStr ? parseInt(storedIdStr, 10) : null;

  const effectiveType = queryType || storedType || 'INTRO';
  const effectiveMode = queryMode || storedMode || 'VIDEO_AUDIO';

  const [activeAssessmentId, setActiveAssessmentId] = useState<number | null>(
    queryAssessmentId ? parseInt(queryAssessmentId, 10) : storedId
  );
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode | null>(queryMode || storedMode);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Embedded detection
  // Hydration state
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    const embedded = window.self !== window.top || window.location.search.includes('embed=true');
    setIsEmbedded(embedded);
  }, []);

  // Load assessment mode if assessmentId is provided on mount
  useEffect(() => {
    if (!activeAssessmentId) return;
    async function fetchAssessmentMode() {
      try {
        const assessment = await aiprepApi.getAssessment(activeAssessmentId);
        if (assessment?.assessment_mode) {
          setAssessmentMode(assessment.assessment_mode);
        }
      } catch (err) {
        console.error('Failed to load assessment mode:', err);
      }
    }
    fetchAssessmentMode();
  }, [activeAssessmentId]);

  // Sync types and modes in storage
  useEffect(() => {
    if (effectiveType) sessionStorage.setItem('aiprep_active_type', effectiveType);
    if (effectiveMode) sessionStorage.setItem('aiprep_active_mode', effectiveMode);
    if (activeAssessmentId) sessionStorage.setItem('aiprep_active_id', String(activeAssessmentId));
  }, [effectiveType, effectiveMode, activeAssessmentId]);

  /**
   * Phase 1 — called by wizard when transitioning from DEVICE_CHECK → CONFIRMATION.
   * Creates the assessment and saves hardware check results.
   * Returns the new assessmentId so the CONFIRMATION step can fetch backend data.
   */
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
    let targetId = activeAssessmentId;
    let candidateId: number | undefined = undefined;
    try {
      const userResponse = await apiFetch("user_dashboard");
      if (userResponse?.candidate_id) candidateId = userResponse.candidate_id;
    } catch (profileErr) {
      console.error("Failed to retrieve candidateId:", profileErr);
    }

    if (!targetId) {
      // Create assessment
      const assessment = await aiprepApi.createAssessment({
        assessment_type: results.assessment_type as AssessmentType,
        assessment_mode: results.video_enabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY',
        candidate_id: candidateId,
        job_description_text: results.assessment_type === 'JD_INTRO' ? results.jd_text : null,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      });
      targetId = assessment.id;
      setActiveAssessmentId(targetId);
      sessionStorage.setItem('aiprep_active_id', String(targetId));
    }

    // Store local hardware check results in sessionStorage
    sessionStorage.setItem('aiprep_hardware_check', JSON.stringify(results));

    return targetId!;
  };

  /**
   * Phase 2 — called when user clicks "Start Assessment" on the Confirmation step.
   * Assessment + hardware check already created. Just set status to IN_PROGRESS and redirect.
   */
  const handleCheckComplete = async (_results: {
    browser_info: string;
    os_info: string;
    camera_permission: boolean;
    mic_permission: boolean;
    speaker_ok: boolean;
    bandwidth_kbps: number;
    assessment_type: string;
    audio_enabled: boolean;
    video_enabled: boolean;
    jd_text: string;
  }) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);

      const targetId = activeAssessmentId;
      if (!targetId) throw new Error('No active assessment found. Please restart the setup.');

      // Transition to IN_PROGRESS
      const statusRes = await aiprepApi.updateAssessmentStatus(targetId, 'IN_PROGRESS');
      if (!statusRes || statusRes.status !== 'IN_PROGRESS') {
        throw new Error('Failed to start assessment session. Please retry.');
      }

      sessionStorage.removeItem('aiprep_wizard_step');
      const targetSessionUrl = isEmbedded ? `/aiprep/session/${targetId}?embed=true` : `/aiprep/session/${targetId}`;
      router.push(targetSessionUrl);
    } catch (err: any) {
      console.error('[Device Check Save Error] Backend failed:', err);
      setErrorMsg(err.message || 'Failed to complete device verification. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-8">
        <div className="h-10 w-10 rounded-full border-t-2 border-r-2 border-[#4A6CF7] animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-medium">Initializing hardware environment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">

      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4A6CF7]/5 dark:bg-[#4A6CF7]/2 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4A6CF7]/5 dark:bg-[#4A6CF7]/2 blur-3xl pointer-events-none -z-10" />

      {/* Full screen container */}
      <div className="w-full flex-1 flex flex-col z-10">
        {/* Main Content Layout */}
        {errorMsg ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8 max-w-md mx-auto my-12 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center mb-4 text-red-500 dark:text-red-400">
              <AlertCircle className="w-12 h-12 text-rose-500" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              Setup Connection Failed
            </h3>

            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-6 font-medium">
              {errorMsg}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  if (!effectiveType || !effectiveMode) {
                    router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep');
                  } else {
                    window.location.reload();
                  }
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-650 hover:bg-indigo-500 active:scale-95 transition-all duration-200 shadow-md shadow-indigo-600/10"
              >
                Retry Setup Flow
              </button>
              <button
                type="button"
                onClick={() => router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep')}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : isSaving ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
            <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-[#4A6CF7] animate-spin mb-6" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Initializing Assessment Room</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs leading-relaxed">
              Registering hardware verification and preparing question prompts. This will only take a moment.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <DeviceCheckWizard
              assessmentId={activeAssessmentId || 0}
              assessmentType={effectiveType}
              assessmentMode={effectiveMode}
              audioOnly={effectiveMode === 'AUDIO_ONLY'}
              initialStep="DEVICE_CHECK"
              onPrepareConfirmation={handlePrepareConfirmation}
              onComplete={handleCheckComplete}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
