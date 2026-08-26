/**
 * Device Check Page Route
 * 
 * Target Workspace: wbl-frontend
 * Route: /aiprep/device-check
 * Primary Developer: Narasimha (FE1)
 * 
 * Continuous Flow:
 * 1. Checks if assessmentId is specified. If not, queries parameters (type & mode) are read.
 * 2. If video mode, displays ConsentModal immediately inside this page.
 * 3. Once accepted (or if audio-only), shows a loading spinner, creates the assessment via backend API,
 *    updates the URL search params in-place, and mounts the DeviceCheckWizard directly.
 * 4. Displays a larger CSS card footprint (max-w-4xl).
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { aiprepApi, AssessmentType, AssessmentMode } from '@/lib/aiprep-api';
import { apiFetch } from '@/lib/api';
import { DeviceCheckWizard } from '@/components/aiprep/DeviceCheckWizard';
import { ConsentModal } from '@/components/aiprep/ConsentModal';
import { AlertCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';

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

  const effectiveType = queryType || storedType || 'TECHNICAL';
  const effectiveMode = queryMode || storedMode || 'VIDEO_AUDIO';

  const [activeAssessmentId, setActiveAssessmentId] = useState<number | null>(
    queryAssessmentId ? parseInt(queryAssessmentId, 10) : storedId
  );
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode | null>(queryMode || storedMode);
  const [consentAccepted, setConsentAccepted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('aiprep_consent_accepted') === 'true';
  });
  const [showConsent, setShowConsent] = useState<boolean>(false);
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

  // Initialize flow: check if we have assessmentId or if we need to trigger creation (with consent first)
  useEffect(() => {
    if (effectiveType) sessionStorage.setItem('aiprep_active_type', effectiveType);
    if (effectiveMode) sessionStorage.setItem('aiprep_active_mode', effectiveMode);
    if (activeAssessmentId) sessionStorage.setItem('aiprep_active_id', String(activeAssessmentId));

    // Always require consent check if not accepted yet
    if (!consentAccepted) {
      setShowConsent(true);
    }
  }, [queryAssessmentId, queryType, queryMode, effectiveType, effectiveMode, activeAssessmentId, consentAccepted]);

  const createSessionFlow = async (videoConsented: boolean) => {
    try {
      setIsSaving(true);
      setErrorMsg(null);

      const isMockMode = typeof window !== 'undefined' && (window.location.search.includes('mock=true') || (!localStorage.getItem('token') && !localStorage.getItem('access_token')));
      let newId: number;

      if (isMockMode) {
        newId = Math.floor(Math.random() * 1000) + 200;
        setAssessmentMode(videoConsented ? 'VIDEO_AUDIO' : 'AUDIO_ONLY');
      } else {
        let candidateId = 7;
        let hasRealCandidate = false;
        try {
          const userResponse = await apiFetch("user_dashboard");
          if (userResponse?.candidate_id) {
            candidateId = userResponse.candidate_id;
            hasRealCandidate = true;
          }
        } catch (profileErr) {
          console.error("Failed to retrieve candidateId, falling back to default.", profileErr);
        }

        // Record consent if in video mode
        if (effectiveMode === 'VIDEO_AUDIO') {
          await aiprepApi.recordConsent({
            candidate_id: hasRealCandidate ? candidateId : undefined,
            consent_type: 'VIDEO_ANALYTICS',
            consented: videoConsented,
          });
        }

        // Get JD text from sessionStorage if needed
        const jdText = sessionStorage.getItem('aiprep_jd_text') || null;

        const assessment = await aiprepApi.createAssessment({
          assessment_type: effectiveType!,
          assessment_mode: videoConsented ? 'VIDEO_AUDIO' : 'AUDIO_ONLY',
          candidate_id: hasRealCandidate ? candidateId : undefined,
          job_description_text: effectiveType === 'JOB_DESCRIPTION_INTRO' ? jdText : null,
        });
        newId = assessment.id;
        setAssessmentMode(assessment.assessment_mode);
      }

      // Update state and replace URL in-place for session consistency
      setActiveAssessmentId(newId);
      const searchParts = [];
      searchParts.push(`assessmentId=${newId}`);
      if (effectiveType) searchParts.push(`type=${effectiveType}`);
      if (effectiveMode) searchParts.push(`mode=${effectiveMode}`);
      if (isMockMode) searchParts.push('mock=true');
      if (isEmbedded) searchParts.push('embed=true');
      const searchStr = `?${searchParts.join('&')}`;
      router.replace(`/aiprep/device-check${searchStr}`);
    } catch (err: any) {
      console.warn('Backend session creation failed, falling back to mock mode:', err);
      const mockId = Math.floor(Math.random() * 1000) + 200;
      setAssessmentMode(videoConsented ? 'VIDEO_AUDIO' : 'AUDIO_ONLY');
      setActiveAssessmentId(mockId);
      const searchParts = [];
      searchParts.push(`assessmentId=${mockId}`);
      if (effectiveType) searchParts.push(`type=${effectiveType}`);
      if (effectiveMode) searchParts.push(`mode=${effectiveMode}`);
      searchParts.push('mock=true');
      if (isEmbedded) searchParts.push('embed=true');
      const searchStr = `?${searchParts.join('&')}`;
      router.replace(`/aiprep/device-check${searchStr}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConsentConfirm = async (videoConsented: boolean, yoloEnabled?: boolean) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aiprep_consent_accepted', 'true');
      sessionStorage.setItem('aiprep_yolo_consent', yoloEnabled ? 'true' : 'false');
    }
    setConsentAccepted(true);
    setShowConsent(false);
    await createSessionFlow(videoConsented);
  };

  const handleCheckComplete = async (results: {
    browser_info: string;
    os_info: string;
    camera_permission: boolean;
    mic_permission: boolean;
    speaker_ok: boolean;
    bandwidth_kbps: number;
  }) => {
    if (!activeAssessmentId) {
      setErrorMsg('No active assessment session was specified. Please return to the selector dashboard.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      const isMockMode = typeof window !== 'undefined' && (window.location.search.includes('mock=true') || (!localStorage.getItem('token') && !localStorage.getItem('access_token')));

      if (isMockMode) {
        setTimeout(() => {
          const searchParts = [];
          if (effectiveType) searchParts.push(`type=${effectiveType}`);
          if (assessmentMode) searchParts.push(`mode=${assessmentMode}`);
          searchParts.push('mock=true');
          if (isEmbedded) searchParts.push('embed=true');
          const searchStr = searchParts.length > 0 ? `?${searchParts.join('&')}` : '';
          router.push(`/aiprep/session/${activeAssessmentId}${searchStr}`);
        }, 800);
        return;
      }

      // 1. Save hardware verification results to backend
      const hwResponse = await aiprepApi.saveHardwareCheck({
        assessment_id: activeAssessmentId,
        browser_info: results.browser_info,
        os_info: results.os_info,
        camera_permission: results.camera_permission,
        mic_permission: results.mic_permission,
        speaker_ok: results.speaker_ok,
        bandwidth_kbps: results.bandwidth_kbps,
        yolo_model_enabled: results.camera_permission,
      });

      if (!hwResponse || !hwResponse.id) {
        throw new Error('Hardware verification failed on the server. Please check your devices and try again.');
      }

      // 2. Transition assessment status to IN_PROGRESS
      const statusRes = await aiprepApi.updateAssessmentStatus(activeAssessmentId, 'IN_PROGRESS');
      if (!statusRes || statusRes.status !== 'IN_PROGRESS') {
        throw new Error('Failed to start assessment session. Please retry.');
      }

      // 3. Successful verification -> Route directly to active practice room
      const searchParts = [];
      if (effectiveType) searchParts.push(`type=${effectiveType}`);
      if (assessmentMode) searchParts.push(`mode=${assessmentMode}`);
      if (isEmbedded) searchParts.push('embed=true');
      const searchStr = searchParts.length > 0 ? `?${searchParts.join('&')}` : '';
      router.push(`/aiprep/session/${activeAssessmentId}${searchStr}`);
    } catch (err: any) {
      console.warn('[Device Check Save Error] Backend failed. Falling back to mock session room:', err);
      const searchParts = [];
      if (effectiveType) searchParts.push(`type=${effectiveType}`);
      if (assessmentMode) searchParts.push(`mode=${assessmentMode}`);
      searchParts.push('mock=true');
      if (isEmbedded) searchParts.push('embed=true');
      const searchStr = searchParts.length > 0 ? `?${searchParts.join('&')}` : '';
      router.push(`/aiprep/session/${activeAssessmentId}${searchStr}`);
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
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all duration-200 shadow-md shadow-indigo-600/10"
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
          !showConsent && activeAssessmentId && (
            <DeviceCheckWizard
              assessmentId={activeAssessmentId}
              audioOnly={assessmentMode === 'AUDIO_ONLY'}
              onComplete={handleCheckComplete}
              onCancel={handleCancel}
            />
          )
        )}
      </div>

      <ConsentModal
        isOpen={showConsent}
        onClose={handleCancel}
        onConfirm={handleConsentConfirm}
        isSubmitting={isSaving}
        audioOnly={queryMode === 'AUDIO_ONLY'}
      />
    </div>
  );
}
