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
import { Mic, Video, FileText, Info, Check, X, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
export type ConsentInfoModalType = 'MIC' | 'CAMERA' | 'ANALYTICS' | 'RECORDING' | 'TRANSCRIPT' | null;

export interface ConsentState {
  videoEnabled: boolean;
  consentMic: boolean;
  consentCamera: boolean;
  videoAnalyticsEnabled: boolean;
  consentSaveRecording: boolean;
  consentSaveTranscript: boolean;
}

export function getInitialConsentState(): ConsentState;
export function getInitialConsentState(audioOnly: boolean): ConsentState;
export function getInitialConsentState(audioOnly: boolean = true): ConsentState {
  const isVideo = !audioOnly;
  return {
    videoEnabled: isVideo,
    consentMic: true,
    consentCamera: isVideo,
    videoAnalyticsEnabled: isVideo,
    consentSaveRecording: true,
    consentSaveTranscript: true,
  };
}

export const syncConsentToSessionStorage = (state: Partial<ConsentState>) => {
  if (typeof window === 'undefined') return;
  if (state.videoEnabled !== undefined) {
    sessionStorage.setItem('aiprep_active_mode', state.videoEnabled ? 'VIDEO_AUDIO' : 'AUDIO_ONLY');
    sessionStorage.setItem('aiprep_video_enabled', state.videoEnabled ? 'true' : 'false');
  }
  if (state.videoAnalyticsEnabled !== undefined) {
    sessionStorage.setItem('aiprep_consent_analytics', state.videoAnalyticsEnabled ? 'true' : 'false');
  }
  if (state.consentSaveRecording !== undefined) {
    sessionStorage.setItem('aiprep_consent_recording', state.consentSaveRecording ? 'true' : 'false');
  }
  if (state.consentSaveTranscript !== undefined) {
    sessionStorage.setItem('aiprep_consent_transcript', state.consentSaveTranscript ? 'true' : 'false');
  }
};

export interface ConsentStepProps {
  videoEnabled: boolean; setVideoEnabled: (v: boolean) => void; consentMic?: boolean; setConsentMic?: (v: boolean) => void;
  consentCamera?: boolean; setConsentCamera?: (v: boolean) => void; videoAnalyticsEnabled: boolean; setVideoAnalyticsEnabled?: (v: boolean) => void;
  consentSaveRecording?: boolean; setConsentSaveRecording?: (v: boolean) => void; consentSaveTranscript: boolean; setConsentSaveTranscript: (v: boolean) => void;
  onBack: () => void; onNext: () => void;
}

export const ConsentStep: React.FC<ConsentStepProps> = ({
  videoEnabled, setVideoEnabled, consentMic = true, setConsentMic,
  consentCamera = false, setConsentCamera, videoAnalyticsEnabled, setVideoAnalyticsEnabled,
  consentSaveRecording = true, setConsentSaveRecording, consentSaveTranscript, setConsentSaveTranscript, onBack, onNext,
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
    } catch (e) { }
    return document.body;
  };

  const handleSelectAudioOnly = () => {
    setVideoEnabled(false);
    if (setConsentMic) setConsentMic(true);
    if (setConsentCamera) setConsentCamera(false);
    if (setVideoAnalyticsEnabled) setVideoAnalyticsEnabled(false);
    syncConsentToSessionStorage({ videoEnabled: false, consentMic: true, consentCamera: false, videoAnalyticsEnabled: false, consentSaveRecording, consentSaveTranscript });
  };

  const handleSelectVideoAudio = () => {
    // Video assessment is disabled as of now
    return;
  };

  const handleNextClick = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('aiprep_active_mode', 'AUDIO_ONLY');
        sessionStorage.setItem('aiprep_video_enabled', 'false');
        syncConsentToSessionStorage({
          videoEnabled: false,
          consentMic: true,
          consentCamera: false,
          videoAnalyticsEnabled: false,
          consentSaveRecording,
          consentSaveTranscript,
        });
      }
    } catch (e) { }
    onNext();
  };

  const portalTarget = mounted ? getPortalTarget() : null;

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-between text-left overflow-hidden">
      {/* ── Content Area Spanning Full Width and Height Evenly ── */}
      <div className="flex-1 min-h-0 px-4 sm:px-6 md:px-8 py-3.5 sm:py-5 flex flex-col justify-evenly w-full overflow-y-auto">
        {/* ── Section 1: Header ── */}
        <div className="space-y-0.5 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
            Media &amp; Consent
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
            Choose your assessment format and configure your privacy &amp; recording preferences.
          </p>
        </div>

        {/* ── Section 2: Assessment Format ── */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assessment Format
            </span>
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Audio-only mode enforced
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
            {/* Card 1: Audio Only (Active) */}
            <div
              onClick={handleSelectAudioOnly}
              className={`relative flex items-center justify-between py-3 px-4 sm:py-3.5 sm:px-4.5 rounded-xl border-2 transition-all duration-200 cursor-pointer min-h-[60px] sm:min-h-[64px] ${
                !videoEnabled
                  ? 'border-[#7C3AED] bg-purple-50/30 dark:bg-purple-950/20 shadow-xs ring-1 ring-[#7C3AED]/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-purple-100/80 dark:bg-purple-950/50 text-[#7C3AED] shrink-0">
                  <Mic className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-[13.5px] font-bold text-slate-900 dark:text-white leading-tight">
                      Audio Only
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[9.5px] font-bold bg-purple-100 text-[#7C3AED] dark:bg-purple-900/50 dark:text-purple-300">
                      Active
                    </span>
                  </div>
                  <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                    Voice-based interview with AI. No webcam required.
                  </p>
                </div>
              </div>

              {/* Radio Indicator */}
              <div className="shrink-0 pl-2">
                <div className="w-4.5 h-4.5 rounded-full border-2 border-[#7C3AED] flex items-center justify-center bg-white dark:bg-slate-900">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                </div>
              </div>
            </div>

            {/* Card 2: Video + Audio (Disabled) */}
            <div
              aria-disabled="true"
              className="relative flex items-center justify-between py-3 px-4 sm:py-3.5 sm:px-4.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-60 cursor-not-allowed min-h-[60px] sm:min-h-[64px] select-none"
              title="Video assessment is temporarily disabled. Please proceed with Audio Only."
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shrink-0">
                  <Video className="w-4.5 h-4.5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-[13.5px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                      Video + Audio
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[9.5px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Disabled
                    </span>
                  </div>
                  <p className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5 truncate">
                    Temporarily unavailable. Please use Audio Only.
                  </p>
                </div>
              </div>

              {/* Radio Indicator (Disabled) */}
              <div className="shrink-0 pl-2">
                <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Consent Options (Stacked One After One) ── */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="space-y-0.5">
            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Consent &amp; Privacy Preferences
            </h3>
            <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              Used exclusively for your assessment evaluation and feedback. Manageable anytime in Settings.
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-3 w-full">
            {/* Checkbox 1: AI Video Analytics (Only shown if videoEnabled) */}
            {videoEnabled && (
              <div className="py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all flex items-center justify-between gap-3 shadow-2xs">
                <label className="flex items-center gap-3.5 flex-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={videoAnalyticsEnabled}
                    onChange={(e) => setVideoAnalyticsEnabled && setVideoAnalyticsEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#7C3AED] rounded border-slate-300 dark:border-slate-700 focus:ring-[#7C3AED] cursor-pointer"
                  />
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] flex items-center justify-center shrink-0">
                    <Video className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-white leading-tight">
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
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[9.5px] font-bold bg-purple-100 text-[#7C3AED] dark:bg-purple-900/50 dark:text-purple-300">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Real-time video analysis for engagement, attention, and presentation feedback.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Checkbox 2: Save Interview Recording */}
            <div className="py-2.5 px-3.5 sm:py-3 sm:px-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center justify-between gap-3 shadow-2xs">
              <label className="flex items-center gap-3.5 flex-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentSaveRecording}
                  onChange={(e) => setConsentSaveRecording && setConsentSaveRecording(e.target.checked)}
                  className="w-4 h-4 text-[#7C3AED] rounded border-slate-300 dark:border-slate-700 focus:ring-[#7C3AED] cursor-pointer"
                />
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] flex items-center justify-center shrink-0">
                  <Video className="w-4.5 h-4.5 stroke-[2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-white leading-tight">
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
                  <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Store audio recording securely in your account to replay responses and review feedback.
                  </p>
                </div>
              </label>
            </div>

            {/* Checkbox 3: Save Interview Transcript */}
            <div className="py-2.5 px-3.5 sm:py-3 sm:px-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center justify-between gap-3 shadow-2xs">
              <label className="flex items-center gap-3.5 flex-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentSaveTranscript}
                  onChange={(e) => setConsentSaveTranscript(e.target.checked)}
                  className="w-4 h-4 text-[#7C3AED] rounded border-slate-300 dark:border-slate-700 focus:ring-[#7C3AED] cursor-pointer"
                />
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5 stroke-[2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-white leading-tight">
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
                  <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Save complete question and answer transcript with AI scoring and coaching notes.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Navigation Buttons ── */}
      <div className="shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer shadow-2xs inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleNextClick}
          className="px-6 sm:px-7 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-all duration-200 bg-[#7C3AED] hover:bg-[#6D28D9] text-white cursor-pointer active:scale-95 shadow-md shadow-purple-500/20"
        >
          <span>Next: Device Check</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>


      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* INFO MODALS POPUP (Mounted via Portal over Full Page)               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {portalTarget && activeModal && createPortal(
        <div className="fixed inset-0 z-[99999999] bg-slate-950/45 dark:bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[450px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-none p-5 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150 relative text-left">
            {/* Close 'X' Button */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                    Why it is required
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Recording is mandatory to verify assessment integrity and enable AI evaluation scoring and feedback generation.
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

