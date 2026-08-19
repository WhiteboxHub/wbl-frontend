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
import ThemeToggler from '@/components/Header/ThemeToggler';
import { AlertCircle } from 'lucide-react';

export default function DeviceCheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params
  const queryAssessmentId = searchParams.get('assessmentId');
  const queryType = searchParams.get('type') as AssessmentType | null;
  const queryMode = searchParams.get('mode') as AssessmentMode | null;

  const [activeAssessmentId, setActiveAssessmentId] = useState<number | null>(
    queryAssessmentId ? parseInt(queryAssessmentId, 10) : null
  );
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode | null>(queryMode);
  const [showConsent, setShowConsent] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (activeAssessmentId) return;

    if (!queryType || !queryMode) {
      setErrorMsg('Invalid session parameters. Please launch from the selector dashboard.');
      return;
    }

    setShowConsent(true);
  }, [queryAssessmentId, queryType, queryMode]);

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
        // Record consent if in video mode
        if (queryMode === 'VIDEO_AUDIO') {
          let candidateId = 7;
          try {
            const userResponse = await apiFetch("user_dashboard");
            if (userResponse?.candidate_id) {
              candidateId = userResponse.candidate_id;
            }
          } catch (profileErr) {
            console.error("Failed to retrieve candidateId, falling back to 7", profileErr);
          }

          await aiprepApi.recordConsent({
            candidate_id: candidateId,
            consent_type: 'VIDEO_ANALYTICS',
            consented: videoConsented,
          });
        }

        // Get JD text from sessionStorage if needed
        const jdText = sessionStorage.getItem('aiprep_jd_text') || null;

        const assessment = await aiprepApi.createAssessment({
          assessment_type: queryType!,
          assessment_mode: videoConsented ? 'VIDEO_AUDIO' : 'AUDIO_ONLY',
          job_description_text: queryType === 'JOB_DESCRIPTION_INTRO' ? jdText : null,
        });
        newId = assessment.id;
        setAssessmentMode(assessment.assessment_mode);
      }

      // Update state and replace URL in-place for session consistency
      setActiveAssessmentId(newId);
      const isMock = isMockMode ? '&mock=true' : '';
      router.replace(`/aiprep/device-check?assessmentId=${newId}${isMock}`);
    } catch (err: any) {
      console.error('Error creating practice session:', err);
      setErrorMsg(err.message || 'Failed to initialize the practice session.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConsentConfirm = async (videoConsented: boolean) => {
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
          router.push(`/aiprep/session/${activeAssessmentId}?mock=true`);
        }, 1000);
        return;
      }

      // 1. Save hardware verification results
      await aiprepApi.saveHardwareCheck({
        assessment_id: activeAssessmentId,
        browser_info: results.browser_info,
        os_info: results.os_info,
        camera_permission: results.camera_permission,
        mic_permission: results.mic_permission,
        speaker_ok: results.speaker_ok,
        bandwidth_kbps: results.bandwidth_kbps,
        yolo_model_enabled: results.camera_permission,
      });

      // 2. Transition assessment status to IN_PROGRESS
      await aiprepApi.updateAssessmentStatus(activeAssessmentId, 'IN_PROGRESS');

      // 3. Route to active practice session page
      router.push(`/aiprep/session/${activeAssessmentId}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save configuration settings or start assessment.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/aiprep');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-6 px-4 md:px-8 flex flex-col items-center justify-center transition-colors duration-200">
      {/* Theme Toggler absolute placement */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggler />
      </div>

      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4A6CF7]/5 dark:bg-[#4A6CF7]/2 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4A6CF7]/5 dark:bg-[#4A6CF7]/2 blur-3xl pointer-events-none -z-10" />

      {/* Full screen card container max-w-6xl */}
      <div className="w-full max-w-6xl z-10">
        {errorMsg && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 p-4 rounded-xl mb-6 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSaving ? (
          <div className="flex flex-col items-center justify-center h-[570px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center shadow-sm">
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
