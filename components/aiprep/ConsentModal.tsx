"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Video,
  Mic,
  MicOff,
  Activity,
  Lock,
  Loader2,
  Check,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cameraEnabled: boolean, yoloEnabled?: boolean) => void;
  isSubmitting?: boolean;
  audioOnly?: boolean;
}

/* ── Custom Checkbox ─────────────────────────────────────────────────── */
const CustomCheckbox = ({
  id, checked, onChange, disabled,
}: {
  id: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) => (
  <button
    id={id}
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-5 h-5 rounded border-2 flex items-center justify-center
      transition-all duration-200 shrink-0 outline-none active:scale-95
      ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      ${checked
        ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white text-white dark:text-slate-900'
        : 'bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-400 hover:border-[#4A6CF7]'
      }`}
  >
    {checked && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
  </button>
);

/* ═══════════════════════════════════════════════════════════════════ */
export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen, onClose, onConfirm, isSubmitting = false, audioOnly = false,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [cameraConsent, setCameraConsent] = useState(false);
  const [micConsent, setMicConsent] = useState(false);
  const [yoloConsent, setYoloConsent] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => setTimeStr(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const cleanup = useCallback(() => {
    setCameraConsent(false);
    setMicConsent(false);
    setYoloConsent(false);
    setAnalyticsConsent(false);
    setTermsAccepted(false);
    setRevealed(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  const handleConfirm = (forceAudioOnly?: boolean) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aiprep_yolo_consent', yoloConsent ? 'true' : 'false');
    }
    const finalCam = (audioOnly || forceAudioOnly) ? false : cameraConsent;
    cleanup();
    onConfirm(finalCam, yoloConsent);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const canProceed = (audioOnly ? micConsent : (cameraConsent || micConsent)) && termsAccepted;

  const ctaLabel = () => {
    if (isSubmitting) return 'Starting…';
    if (!termsAccepted) return 'Accept Terms first';
    if (audioOnly && !micConsent) return 'Select microphone';
    if (!audioOnly && !cameraConsent && !micConsent) return 'Select a device';
    return 'Start device check';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dark overlay backdrop for focus */}
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300" onClick={handleClose} />

      {/* Real-time split layout (Left: Stepper panel, Right: Controls) */}
      <div
        className={`relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800
          transition-all duration-300 ease-out flex flex-col overflow-hidden my-auto
          ${revealed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
      >

        {/* Top Info Bar */}
        <div className="px-6 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">

            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Session Setup Wizard</span>
          </div>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">

          {/* LEFT: Onboarding flow timeline & Info cards (3/5) */}
          <div className="col-span-1 lg:col-span-3 p-8 bg-slate-50 dark:bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between min-h-[350px]">

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-[#4A6CF7] uppercase tracking-wider mb-1">Onboarding Checklist</p>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Steps to join your practice loop</h4>
              </div>

              {/* Steps timeline */}
              <div className="space-y-4 relative pl-3">
                {/* Stepper vertical line indicator */}
                <div className="absolute left-4.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />

                {[
                  {
                    step: 1,
                    title: 'Privacy & Permissions Consent',
                    desc: 'Acknowression camera and microphone usage policies for assessment metrics.',
                    active: true,
                  },
                  {
                    step: 2,
                    title: 'Device Check & Audio Verification',
                    desc: 'Grant browser permissions and verify webcam/mic levels interactively.',
                    active: false,
                  },
                  {
                    step: 3,
                    title: 'Start AI Interview Prep',
                    desc: 'Answer AI-generated questions and review performance diagnostics.',
                    active: false,
                  }
                ].map(({ step, title, desc, active }) => (
                  <div key={step} className="flex gap-4 relative z-10">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 border mt-0.5
                      ${active ? 'bg-[#4A6CF7] text-white border-[#4A6CF7]' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700'}`}
                    >
                      {step}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${active ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-450'}`}>{title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom local processing guarantee box */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-400 shrink-0">
                  <Lock className="w-4 h-4 text-[#4A6CF7]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Localized Processing Guarantee</p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    We evaluate your feeds client-side using ONNX.js. No raw audio or video ever reaches our servers.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Consent Checkboxes & Actions (2/5) */}
          <div className="col-span-1 lg:col-span-2 p-8 flex flex-col justify-between bg-white dark:bg-slate-900">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Select Practice Mode</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5 leading-normal">
                  Toggle the modules you consent to use during the interview.
                </p>
              </div>

              {/* Stack of checkboxes */}
              <div className="space-y-2.5">

                {/* Camera Consent */}
                {!audioOnly && (
                  <div className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200
                    ${cameraConsent ? 'bg-slate-50/50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'}`}
                  >
                    <label htmlFor="cb-cam" className="flex items-start gap-2.5 cursor-pointer select-none">
                      <CustomCheckbox id="cb-cam" checked={cameraConsent} onChange={setCameraConsent} disabled={isSubmitting} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Video className={`w-3.5 h-3.5 shrink-0 ${cameraConsent ? 'text-[#4A6CF7]' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Consent to Camera</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">Required for video mode (analyzes face stability).</p>
                      </div>
                    </label>
                  </div>
                )}

                {/* YOLO AI Vision Model Option */}
                {!audioOnly && (
                  <div className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200
                    ${yoloConsent ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900'}`}
                  >
                    <label htmlFor="cb-yolo" className="flex items-start gap-2.5 cursor-pointer select-none">
                      <CustomCheckbox id="cb-yolo" checked={yoloConsent} onChange={setYoloConsent} disabled={isSubmitting} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${yoloConsent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Vision &amp; YOLO Proctoring Model</span>
                          <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Optional Check</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">Check if you want real-time YOLO pose &amp; eye tracking during practice; leave unchecked to disable.</p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Mic Consent */}
                <div className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200
                  ${micConsent ? 'bg-slate-50/50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'}`}
                >
                  <label htmlFor="cb-mic" className="flex items-start gap-2.5 cursor-pointer select-none">
                    <CustomCheckbox id="cb-mic" checked={micConsent} onChange={setMicConsent} disabled={isSubmitting} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Mic className={`w-3.5 h-3.5 shrink-0 ${micConsent ? 'text-[#4A6CF7]' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Consent to Microphone</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">Required to record and score spoken answers.</p>
                    </div>
                  </label>
                </div>

                {/* Analytics Consent */}
                <div className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200
                  ${analyticsConsent ? 'bg-slate-50/50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'}`}
                >
                  <label htmlFor="cb-analytics" className="flex items-start gap-2.5 cursor-pointer select-none">
                    <CustomCheckbox id="cb-analytics" checked={analyticsConsent} onChange={setAnalyticsConsent} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Share Performance logs</span>
                        <span className="text-[8px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Optional</span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Terms Consent */}
                <div className={`p-3.5 rounded-xl border transition-all duration-200
                  ${termsAccepted ? 'border-emerald-500/30 dark:border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                >
                  <label htmlFor="cb-terms" className="flex items-start gap-2.5 cursor-pointer select-none">
                    <CustomCheckbox id="cb-terms" checked={termsAccepted} onChange={setTermsAccepted} />
                    <div className="flex-1">
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-normal">
                        Accept <a href="#" className="font-bold text-[#4A6CF7] hover:underline">Terms</a> &amp; <a href="#" className="font-bold text-[#4A6CF7] hover:underline">Policies</a>
                      </p>
                    </div>
                  </label>
                </div>

              </div>
            </div>

            {/* Action Warnings */}
            {(!termsAccepted || (audioOnly ? !micConsent : (!cameraConsent && !micConsent))) && (
              <div className="mt-4 p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] leading-relaxed flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Required Actions Missing:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 font-medium">
                    {!termsAccepted && <li>Accept the Terms &amp; Policies</li>}
                    {audioOnly && !micConsent && <li>Provide consent for Microphone usage</li>}
                    {!audioOnly && !cameraConsent && !micConsent && <li>Provide consent for Camera or Microphone usage</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-2.5 mt-4 pt-1">
              <button
                disabled={!canProceed || isSubmitting}
                onClick={() => handleConfirm()}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95
                  flex items-center justify-center gap-2
                  ${!canProceed || isSubmitting
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-[#4A6CF7] text-white hover:bg-[#4A6CF7]/90 shadow-md shadow-[#4A6CF7]/15'
                  }`}
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {ctaLabel()}
              </button>

              {!audioOnly && (
                <button
                  disabled={isSubmitting}
                  onClick={() => handleConfirm(true)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300
                    hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white hover:border-slate-3.5 border-slate-250 dark:border-slate-750 transition-all duration-200 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <MicOff className="w-3.5 h-3.5 text-slate-450" />
                  Continue Audio Only
                </button>
              )}

              <button onClick={handleClose} className="w-full text-center text-[14px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 font-medium transition-colors">
                Cancel &amp; return
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
