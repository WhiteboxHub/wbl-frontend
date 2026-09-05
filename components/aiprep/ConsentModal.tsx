/**
 * ConsentStep Component
 *
 * Target Workspace: wbl-frontend
 *
 * Inline Step 2 of the DeviceCheckWizard: Privacy & Permissions Consent.
 * Replaced the old modal/popup layout with a clean inline panel.
 * Used inside DeviceCheckWizard.tsx for the CONSENT step.
 */

'use client';

import React from 'react';
import { ShieldCheck, Mic, Video, ChevronRight } from 'lucide-react';

interface ConsentStepProps {
  videoEnabled: boolean;
  consentMic: boolean;
  setConsentMic: (v: boolean) => void;
  consentCamera: boolean;
  setConsentCamera: (v: boolean) => void;
  videoAnalyticsEnabled: boolean;
  setVideoAnalyticsEnabled: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export const ConsentStep: React.FC<ConsentStepProps> = ({
  videoEnabled,
  consentMic,
  setConsentMic,
  consentCamera,
  setConsentCamera,
  videoAnalyticsEnabled,
  setVideoAnalyticsEnabled,
  onBack,
  onNext,
}) => {
  const canProceed = consentMic && (!videoEnabled || consentCamera);

  return (
    <div className="w-full px-4 sm:px-6 py-3 space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#4A6CF7]" /> Privacy &amp; Permissions Consent
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Review and accept required device permissions and optional AI analytics before conducting hardware checks.
        </p>
      </div>

      {/* Consent Checkboxes */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">

        {/* Mic Consent */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200 bg-white dark:bg-slate-900">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentMic}
              onChange={(e) => setConsentMic(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="flex-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mic className={`w-4 h-4 ${consentMic ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Microphone &amp; Audio Recording</span>
              </div>
              <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                Required
              </span>
            </div>
          </label>
        </div>

        {/* Camera Consent */}
        {videoEnabled && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200 bg-white dark:bg-slate-900">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentCamera}
                onChange={(e) => setConsentCamera(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Video className={`w-4 h-4 ${consentCamera ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Webcam &amp; Video Recording</span>
                </div>
                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                  Required for Video
                </span>
              </div>
            </label>
          </div>
        )}

        {/* YOLO Vision Consent */}
        {videoEnabled && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200 bg-white dark:bg-slate-900">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={videoAnalyticsEnabled && consentCamera}
                disabled={!consentCamera}
                onChange={(e) => setVideoAnalyticsEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
              />
              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${videoAnalyticsEnabled && consentCamera ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">AI Posture &amp; Gaze Analytics</span>
                </div>
                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Best Interview Practice Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-indigo-600 text-sm"></span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Best Interview Practice</span>
          </div>
          <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
            Recommended
          </span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium pl-6">
          Sit in a well-lit, quiet environment with a clear microphone input for optimal AI evaluation.
        </p>
      </div>

      {/* Action Buttons (Sticky for viewport fit) */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-900 z-10 pt-2.5 pb-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm cursor-pointer"
        >
          ← Back
        </button>

        <button
          type="button"
          disabled={!canProceed}
          onClick={() => {
            try {
              sessionStorage.setItem(
                'aiprep_consent',
                JSON.stringify({
                  consentMic,
                  consentCamera,
                  videoAnalyticsEnabled,
                  timestamp: new Date().toISOString(),
                })
              );
            } catch (e) { }
            onNext();
          }}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-[#6C5CE7]/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <span>Next: Device Check</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

export default ConsentStep;
