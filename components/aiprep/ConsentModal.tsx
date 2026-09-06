/**
 * ConsentStep Component & Info Modals
 *
 * Target Workspace: wbl-frontend
 *
 * Step 2 of the DeviceCheckWizard: Media & Consent.
 * Matches the exact Whitebox Learning design:
 * 1. Wizard Step - Media & Consent (Audio Only vs Video + Audio option cards)
 * 2. Consent Options (Enable AI Video Analytics, Save Interview Recording, Save Interview Transcript)
 * 3. Info Modals:
 *    - About AI Video Analytics
 *    - About Interview Recording
 *    - About Interview Transcript
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Mic,
  Video,
  FileText,
  Info,
  Check,
  X,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export type ConsentInfoModalType = 'MIC' | 'CAMERA' | 'ANALYTICS' | 'RECORDING' | 'TRANSCRIPT' | null;

interface ConsentStepProps {
  videoEnabled: boolean;
  setVideoEnabled: (v: boolean) => void;
  consentMic?: boolean;
  setConsentMic?: (v: boolean) => void;
  consentCamera?: boolean;
  setConsentCamera?: (v: boolean) => void;
  videoAnalyticsEnabled: boolean;
  setVideoAnalyticsEnabled: (v: boolean) => void;
  consentSaveRecording?: boolean;
  setConsentSaveRecording?: (v: boolean) => void;
  consentSaveTranscript: boolean;
  setConsentSaveTranscript: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export const ConsentStep: React.FC<ConsentStepProps> = ({
  videoEnabled,
  setVideoEnabled,
  consentMic = true,
  setConsentMic,
  consentCamera = true,
  setConsentCamera,
  videoAnalyticsEnabled,
  setVideoAnalyticsEnabled,
  consentSaveRecording = true,
  setConsentSaveRecording,
  consentSaveTranscript,
  setConsentSaveTranscript,
  onBack,
  onNext,
}) => {
  const [activeModal, setActiveModal] = useState<ConsentInfoModalType>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getPortalTarget = () => {
    if (typeof window === 'undefined') return null;
    try {
      if (window.parent && window.parent !== window && window.parent.document?.body) {
        return window.parent.document.body;
      }
    } catch (e) {}
    return document.body;
  };

  const canProceed = consentMic && (!videoEnabled || consentCamera);

  const handleSelectAudioOnly = () => {
    setVideoEnabled(false);
    if (setConsentCamera) setConsentCamera(false);
  };

  const handleSelectVideoAudio = () => {
    setVideoEnabled(true);
    if (setConsentCamera) setConsentCamera(true);
  };

  const handleNextClick = () => {
    try {
      sessionStorage.setItem(
        'aiprep_consent',
        JSON.stringify({
          videoEnabled,
          consentMic,
          consentCamera: videoEnabled ? consentCamera : false,
          videoAnalyticsEnabled: videoEnabled ? videoAnalyticsEnabled : false,
          consentSaveRecording,
          consentSaveTranscript,
          timestamp: new Date().toISOString(),
        })
      );
      sessionStorage.setItem('aiprep_active_mode', videoEnabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY');
      sessionStorage.setItem('aiprep_consent_mic', consentMic ? 'true' : 'false');
      sessionStorage.setItem('aiprep_consent_camera', (videoEnabled && consentCamera) ? 'true' : 'false');
      sessionStorage.setItem('aiprep_consent_yolo', (videoEnabled && videoAnalyticsEnabled) ? 'true' : 'false');
      sessionStorage.setItem('aiprep_consent_recording', consentSaveRecording ? 'true' : 'false');
      sessionStorage.setItem('aiprep_consent_transcript', consentSaveTranscript ? 'true' : 'false');
    } catch (e) {}
    onNext();
  };

  const portalTarget = mounted ? getPortalTarget() : null;

  return (
    <div className="w-full h-full flex flex-col justify-start text-left space-y-2.5 sm:space-y-3">
      {/* ── Header Title & Subtitle ── */}
      <div className="space-y-0.5">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
          Media &amp; Consent
        </h2>
        <p className="text-[10.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400">
          Choose your assessment format and review the consent options below.
        </p>
      </div>

      {/* ── Media Selection Cards (Audio Only vs Video + Audio) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Card 1: Audio Only */}
        <div
          onClick={handleSelectAudioOnly}
          className={`relative flex items-center justify-between py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer min-h-[52px] ${
            !videoEnabled
              ? 'border-[#7C3AED] bg-purple-50/20 dark:bg-purple-950/20 shadow-sm ring-1 ring-[#7C3AED]/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] shrink-0">
              <Mic className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                Audio Only
              </h3>
              <p className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                Voice-based interview. No camera required.
              </p>
            </div>
          </div>

          {/* Radio Indicator */}
          <div className="shrink-0 pl-1">
            {!videoEnabled ? (
              <div className="w-4 h-4 rounded-full border-2 border-[#7C3AED] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
            )}
          </div>
        </div>

        {/* Card 2: Video + Audio */}
        <div
          onClick={handleSelectVideoAudio}
          className={`relative flex items-center justify-between py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer min-h-[52px] ${
            videoEnabled
              ? 'border-[#7C3AED] bg-purple-50/20 dark:bg-purple-950/20 shadow-sm ring-1 ring-[#7C3AED]/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] shrink-0">
              <Video className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                Video + Audio
              </h3>
              <p className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                Includes camera &amp; voice. <span className="text-[#7C3AED] dark:text-purple-400 font-medium">Recommended.</span>
              </p>
            </div>
          </div>

          {/* Radio Indicator */}
          <div className="shrink-0 pl-1">
            {videoEnabled ? (
              <div className="w-4 h-4 rounded-full border-2 border-[#7C3AED] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
            )}
          </div>
        </div>
      </div>

      {/* ── Consent Options Section ── */}
      <div className="space-y-2 pt-0.5">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Consent Options
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
            We&apos;ll only use your data for assessment and feedback purposes. You can change these anytime in Settings.
          </p>
        </div>

        <div className="space-y-1.5">
          {/* Checkbox 1: Combined Media Consent (Camera & Microphone when video enabled, Microphone only when audio only) */}
          <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all flex items-center justify-between gap-3">
            <label className="flex items-center gap-3 flex-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={videoEnabled ? (consentMic && consentCamera) : consentMic}
                onChange={(e) => {
                  const val = e.target.checked;
                  if (setConsentMic) setConsentMic(val);
                  if (videoEnabled && setConsentCamera) setConsentCamera(val);
                }}
                className="w-4 h-4 text-[#7C3AED] rounded border-slate-300 dark:border-slate-700 focus:ring-[#7C3AED] cursor-pointer"
              />
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] flex items-center justify-center shrink-0">
                {videoEnabled ? (
                  <Video className="w-3.5 h-3.5 stroke-[2]" />
                ) : (
                  <Mic className="w-3.5 h-3.5 stroke-[2]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {videoEnabled
                      ? 'Camera & Microphone Recording'
                      : 'Microphone & Audio Recording'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveModal(videoEnabled ? 'CAMERA' : 'MIC');
                    }}
                    className="text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors p-0.5 rounded-full cursor-pointer inline-flex items-center"
                    title={videoEnabled ? "Learn more about Camera & Microphone" : "Learn more about Microphone & Audio"}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    Required
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {videoEnabled
                    ? 'Allow camera and microphone access to conduct your interview and proctoring.'
                    : 'Allow microphone access to record audio and capture your spoken answers.'}
                </p>
              </div>
            </label>
          </div>

          {/* Checkbox 2: AI Video Analytics (Shown if Video + Audio is selected) */}
          {videoEnabled && (
            <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <label className="flex items-center gap-3 flex-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={videoAnalyticsEnabled}
                  onChange={(e) => setVideoAnalyticsEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#7C3AED] rounded border-slate-300 dark:border-slate-700 focus:ring-[#7C3AED] cursor-pointer"
                />
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] flex items-center justify-center shrink-0">
                  <Video className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Enable AI Video Analytics
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveModal('ANALYTICS');
                      }}
                      className="text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors p-0.5 rounded-full cursor-pointer inline-flex items-center"
                      title="Learn more about AI Video Analytics"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-purple-100 text-[#7C3AED] dark:bg-purple-900/50 dark:text-purple-300">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Real-time video analysis for engagement, attention, and presentation feedback.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Checkbox 3: Save Interview Recording */}
          <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all flex items-center justify-between gap-3">
            <label className="flex items-center gap-3 flex-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentSaveRecording}
                onChange={(e) => setConsentSaveRecording && setConsentSaveRecording(e.target.checked)}
                className="w-4 h-4 text-[#7C3AED] rounded border-slate-300 dark:border-slate-700 focus:ring-[#7C3AED] cursor-pointer"
              />
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] flex items-center justify-center shrink-0">
                <Video className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Save Interview Recording
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveModal('RECORDING');
                    }}
                    className="text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors p-0.5 rounded-full cursor-pointer inline-flex items-center"
                    title="Learn more about Interview Recording"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Store full video/audio recording in your account for review.
                </p>
              </div>
            </label>
          </div>

          {/* Checkbox 4: Save Interview Transcript */}
          <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all flex items-center justify-between gap-3">
            <label className="flex items-center gap-3 flex-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentSaveTranscript}
                onChange={(e) => setConsentSaveTranscript(e.target.checked)}
                className="w-4 h-4 text-[#7C3AED] rounded border-slate-300 dark:border-slate-700 focus:ring-[#7C3AED] cursor-pointer"
              />
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Save Interview Transcript
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveModal('TRANSCRIPT');
                    }}
                    className="text-slate-400 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors p-0.5 rounded-full cursor-pointer inline-flex items-center"
                    title="Learn more about Interview Transcript"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Save full question and answer text with AI feedback for future review.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* ── Footer Navigation Buttons ── */}
      <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          disabled={!canProceed}
          onClick={handleNextClick}
          className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            canProceed
              ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white cursor-pointer active:scale-95 shadow-purple-500/20'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Next: Device Check</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* INFO MODALS POPUP (Mounted via Portal over Full Page)               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {portalTarget && activeModal && createPortal(
        <div className="fixed inset-0 z-[99999999] bg-slate-950/45 dark:bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[450px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-none p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150 relative text-left">
            {/* Close 'X' Button */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 pr-8">
              <div className="w-11 h-11 rounded-2xl bg-[#F4EEFD] dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-400 flex items-center justify-center shrink-0">
                {activeModal === 'MIC' && <Mic className="w-5 h-5 stroke-[2.2]" />}
                {activeModal === 'CAMERA' && <Video className="w-5 h-5 stroke-[2.2]" />}
                {activeModal === 'ANALYTICS' && <Video className="w-5 h-5 stroke-[2.2]" />}
                {activeModal === 'RECORDING' && <Video className="w-5 h-5 stroke-[2.2]" />}
                {activeModal === 'TRANSCRIPT' && <FileText className="w-5 h-5 stroke-[2.2]" />}
              </div>
              <h3 className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white">
                {activeModal === 'MIC' && 'About Microphone & Audio Recording'}
                {activeModal === 'CAMERA' && 'About Camera & Microphone Recording'}
                {activeModal === 'ANALYTICS' && 'About AI Video Analytics'}
                {activeModal === 'RECORDING' && 'About Interview Recording'}
                {activeModal === 'TRANSCRIPT' && 'About Interview Transcript'}
              </h3>
            </div>

            {/* ── MODAL: About Microphone & Audio Recording ── */}
            {activeModal === 'MIC' && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                    What it does
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Captures your spoken answers and streams microphone audio chunks directly to our secure real-time Speech-to-Text (STT) and LLM evaluation engine.
                  </p>
                  <div className="bg-[#F8F5FE] dark:bg-purple-950/30 rounded-xl p-3.5 sm:p-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Real-time voice capture &amp; transcription</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>AI answer scoring and conversational dialogue</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Low-latency audio streaming</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                    Why it is required
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Microphone access is mandatory so the AI interviewer can hear your responses and evaluate your answers.
                  </p>
                </div>
              </div>
            )}

            {/* ── MODAL: About Camera & Microphone Recording ── */}
            {activeModal === 'CAMERA' && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                    What it does
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Captures your camera stream during the video assessment to verify presence, support live proctoring, and enable visual interview interaction.
                  </p>
                  <div className="bg-[#F8F5FE] dark:bg-purple-950/30 rounded-xl p-3.5 sm:p-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Identity verification &amp; visual proctoring</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Face presence and orientation checks</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Encrypted video transmission</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                    Why it is required
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Camera access is required for Video + Audio assessments to provide a real-time interview environment.
                  </p>
                </div>
              </div>
            )}

            {/* ── MODAL 1: About AI Video Analytics ── */}
            {activeModal === 'ANALYTICS' && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                    What it does
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    We use on-device computer vision (e.g., YOLO, MediaPipe) to analyze video during the assessment. This helps us provide better feedback and ensure a fair and secure assessment experience.
                  </p>
                  <div className="bg-[#F8F5FE] dark:bg-purple-950/30 rounded-xl p-3.5 sm:p-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Face detection and identity presence</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Eye contact and gaze direction</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Head pose and posture</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Engagement and attention metrics</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Non-intrusive and privacy-preserving (processed in real-time)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                    Why we use it
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Video analytics helps improve feedback quality, detect potential integrity issues, and provide insights on communication skills.
                  </p>
                </div>
              </div>
            )}

            {/* ── MODAL 2: About Interview Recording ── */}
            {activeModal === 'RECORDING' && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                    What we save
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    If enabled, we will store your video and audio recording of the assessment in your secure account for future review and feedback.
                  </p>
                  <div className="bg-[#F8F5FE] dark:bg-purple-950/30 rounded-xl p-3.5 sm:p-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Full video and audio recording</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Stored securely in encrypted storage</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Accessible only to you</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Used for feedback, quality improvement, and dispute resolution</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                    Your control
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    You can change this setting at any time in Settings. If you do not consent, the recording will not be saved, though the assessment will still proceed.
                  </p>
                </div>
              </div>
            )}

            {/* ── MODAL 3: About Interview Transcript ── */}
            {activeModal === 'TRANSCRIPT' && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                    What we save
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    If enabled, we will save the full transcript of your conversation, along with AI evaluation results, in your account.
                  </p>
                  <div className="bg-[#F8F5FE] dark:bg-purple-950/30 rounded-xl p-3.5 sm:p-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Complete question and answer transcript</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>AI-generated evaluation and feedback</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Stored securely in your account</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400 shrink-0 stroke-[2.5]" />
                      <span>Used to track progress and improve your experience</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                    Your control
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    You can change this setting at any time in Settings. If you do not consent, the transcript will not be saved, though the assessment will still proceed.
                  </p>
                </div>
              </div>
            )}

            {/* Footer Button: Got it */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#6D28D9] hover:bg-[#5B21B6] transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>,
        portalTarget
      )}
    </div>
  );
};

export default ConsentStep;
