"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck,Video, Mic,
  MicOff,
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

  // Inline mode support
  inline?: boolean;
  consentCamera?: boolean;
  setConsentCamera?: (v: boolean) => void;
  consentMic?: boolean;
  setConsentMic?: (v: boolean) => void;
  consentYolo?: boolean;
  setConsentYolo?: (v: boolean) => void;
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
    className={`relative w-5 h-5 rounded-md border-2 flex items-center justify-center
      transition-all duration-150 shrink-0 outline-none active:scale-95 shadow-sm
      ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      ${checked
        ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/20'
        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-indigo-500'
      }`}
  >
    {checked && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
  </button>
);

/* ═══════════════════════════════════════════════════════════════════ */
export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen, onClose, onConfirm, isSubmitting = false, audioOnly = false,
  inline = false,
  consentCamera = false, setConsentCamera,
  consentMic = false, setConsentMic,
  consentYolo = false, setConsentYolo,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [cameraConsent, setCameraConsent] = useState(false);
  const [micConsent, setMicConsent] = useState(false);
  const [yoloConsent, setYoloConsent] = useState(false);
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
    setRevealed(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  const handleConfirm = (forceAudioOnly?: boolean) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aiprep_consent_agreed', 'true');
      sessionStorage.setItem('aiprep_consent_timestamp', new Date().toISOString());
      sessionStorage.setItem('aiprep_yolo_consent', yoloConsent ? 'true' : 'false');
      sessionStorage.setItem('aiprep_camera_consent', cameraConsent ? 'true' : 'false');
      sessionStorage.setItem('aiprep_mic_consent', micConsent ? 'true' : 'false');
    }
    const finalCam = (audioOnly || forceAudioOnly) ? false : cameraConsent;
    cleanup();
    onConfirm(finalCam, yoloConsent);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const isVideoMode = !audioOnly;
  const isCameraMissing = isVideoMode && (inline ? !consentCamera : !cameraConsent);
  const isMicMissing = inline ? !consentMic : !micConsent;

  const canProceed = !isMicMissing && (!isVideoMode || (inline ? !!consentCamera : cameraConsent));

  const ctaLabel = () => {
    if (isSubmitting) return 'Starting…';
    if (isCameraMissing) return 'Consent to Camera required';
    if (isMicMissing) return 'Consent to Microphone required';
    return 'Start device check';
  };

  if (inline) {
    return (
      <div className="max-w-2xl mx-auto w-full space-y-5 animate-in fade-in duration-200">
        <div>
          <h3 className="text-sm font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4A6CF7]" /> Privacy & Permissions Consent
          </h3>
          <p className="text-xs text-slate-500 mt-1">Toggle the modules you consent to use during the interview session.</p>
        </div>

        <div className="space-y-2.5">
          {/* Camera Consent */}
          {!audioOnly && setConsentCamera && (
            <div className={`p-4 rounded-xl border transition-all duration-200 ${
              consentCamera
                ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <CustomCheckbox
                  id="cb-cam"
                  checked={consentCamera}
                  onChange={setConsentCamera}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Video className={`w-4 h-4 ${consentCamera ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Consent to Camera</span>
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider">Required for Video</span>
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* YOLO AI Vision Model Option */}
          {!audioOnly && consentCamera && setConsentYolo && (
            <div className={`p-4 rounded-xl border transition-all duration-200 ${
              consentYolo
                ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <CustomCheckbox
                  id="cb-yolo"
                  checked={consentYolo}
                  onChange={setConsentYolo}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${consentYolo ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">AI Vision &amp; YOLO Model</span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider">Optional</span>
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Mic Consent */}
          {setConsentMic && (
            <div className={`p-4 rounded-xl border transition-all duration-200 ${
              consentMic
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <CustomCheckbox
                  id="cb-mic"
                  checked={consentMic}
                  onChange={setConsentMic}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Mic className={`w-4 h-4 ${consentMic ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Consent to Microphone</span>
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider">Required</span>
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Missing consent warning */}
        {isCameraMissing && (
          <div className="p-3 rounded-xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              Camera consent is required for Video mode. Please check the box above or go back to select Audio Only.
            </span>
          </div>
        )}
        {isMicMissing && (
          <div className="p-3 rounded-xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              Microphone consent is required to proceed. Please check the box above.
            </span>
          </div>
        )}


      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Soft Neutral Gray Overlay Backdrop */}
      <div className="absolute inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-md transition-opacity duration-300" onClick={handleClose} />

      {/* Real-time split layout (Left: Stepper panel, Right: Controls) */}
      <div
        className={`relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800
          transition-all duration-300 ease-out flex flex-col overflow-hidden max-h-[90vh] my-auto
          ${revealed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
      >

        {/* Top Info Bar */}
        <div className="px-6 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Session Setup Wizard</span>
          </div>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 overflow-y-auto">

          {/* LEFT: Onboarding flow timeline & Info cards (3/5) */}
          <div className="col-span-1 lg:col-span-3 p-5 sm:p-6 bg-slate-50 dark:bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between">

            <div className="space-y-3.5">
              <div>
                <p className="text-[10px] font-bold text-[#4A6CF7] uppercase tracking-wider mb-0.5">Onboarding Checklist</p>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Steps to join your practice loop</h4>
              </div>

              {/* Steps timeline */}
              <div className="space-y-3 relative pl-3">
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
                      ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700'}`}
                    >
                      {step}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${active ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>{title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>



          </div>

          {/* RIGHT: Consent Checkboxes & Actions (2/5) */}
          <div className="col-span-1 lg:col-span-2 p-5 sm:p-6 flex flex-col justify-between bg-white dark:bg-slate-900 min-h-0 overflow-y-auto">
            <div className="space-y-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Select Practice Mode</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  Toggle the modules you consent to use during the interview.
                </p>
              </div>

              {/* Stack of checkboxes */}
              <div className="space-y-1.5">

                {/* Camera Consent */}
                {!audioOnly && (
                  <div className={`p-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200
                    ${cameraConsent ? 'bg-slate-50/50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'}`}
                  >
                    <label htmlFor="cb-cam" className="flex items-center gap-2.5 cursor-pointer select-none">
                      <CustomCheckbox id="cb-cam" checked={cameraConsent} onChange={setCameraConsent} disabled={isSubmitting} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Video className={`w-3.5 h-3.5 shrink-0 ${cameraConsent ? 'text-[#4A6CF7]' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Consent to Camera</span>
                          <span className="text-[8px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Required</span>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* YOLO AI Vision Model Option */}
                {!audioOnly && (
                  <div className={`p-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200
                    ${yoloConsent ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900'}`}
                  >
                    <label htmlFor="cb-yolo" className="flex items-center gap-2.5 cursor-pointer select-none">
                      <CustomCheckbox id="cb-yolo" checked={yoloConsent} onChange={setYoloConsent} disabled={isSubmitting} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${yoloConsent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Vision &amp; YOLO Model</span>
                          <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Optional</span>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Mic Consent */}
                <div className={`p-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200
                  ${micConsent ? 'bg-slate-50/50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'}`}
                >
                  <label htmlFor="cb-mic" className="flex items-center gap-2.5 cursor-pointer select-none">
                    <CustomCheckbox id="cb-mic" checked={micConsent} onChange={setMicConsent} disabled={isSubmitting} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Mic className={`w-3.5 h-3.5 shrink-0 ${micConsent ? 'text-[#4A6CF7]' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Consent to Microphone</span>
                        <span className="text-[8px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Required</span>
                      </div>
                    </div>
                  </label>
                </div>

              </div>
            </div>

            {/* Compact Action Warnings */}
            {(audioOnly ? !micConsent : (!cameraConsent || !micConsent)) && (
              <div className="my-2 p-2 px-2.5 rounded-lg border border-amber-500/20 bg-amber-50/5 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="font-semibold leading-tight">
                  Missing required consents: {[!audioOnly && !cameraConsent && 'Camera', !micConsent && 'Microphone'].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {/* CTAs — Always anchored at bottom */}
            <div className="space-y-1.5 shrink-0 mt-2 pt-1">
              <button
                disabled={!canProceed || isSubmitting}
                onClick={() => handleConfirm()}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95
                  flex items-center justify-center gap-2
                  ${!canProceed || isSubmitting
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
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
                  className="w-full py-2 px-4 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300
                    hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-all duration-200 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <MicOff className="w-3.5 h-3.5 text-slate-500" />
                  Continue Audio Only
                </button>
              )}

              <button onClick={handleClose} className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium py-0.5 transition-colors">
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
