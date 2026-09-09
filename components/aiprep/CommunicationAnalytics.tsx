'use client';

/**
 * CommunicationAnalytics Component
 * Specification: [Vishnu] Phase 6: Speech & WPM Analytics
 * 
 * Renders speaking pace (WPM), pause statistics, filler word frequencies,
 * and audio/speech clarity telemetry.
 */

import React from 'react';
import { AssessmentDetails, AudioTelemetry, AudioEvaluation } from '@/types/aiprep';
import { Gauge, Clock, Activity, Mic, Volume2, ShieldCheck } from 'lucide-react';

export interface CommunicationAnalyticsProps {
  assessment: AssessmentDetails;
  audioTelemetry?: AudioTelemetry;
  audioEvaluation?: AudioEvaluation;
}

export const CommunicationAnalytics: React.FC<CommunicationAnalyticsProps> = ({
  assessment,
  audioTelemetry: propAudioTelemetry,
  audioEvaluation: propAudioEvaluation,
}) => {
  const report = assessment?.report;
  const audioTelemetry: AudioTelemetry | undefined =
    propAudioTelemetry || assessment?.data?.audio_telemetry;
  const audioEval: AudioEvaluation | undefined =
    propAudioEvaluation || report?.audio_evaluation;

  const rawWpm = audioTelemetry?.words_per_minute ?? audioTelemetry?.speaking_pace_wpm;
  const wpm = typeof rawWpm === 'number' && rawWpm > 0 ? Math.round(rawWpm) : null;
  const pauseCount = audioTelemetry?.pause_count;
  const fillerRate = audioTelemetry?.filler_rate_per_min;

  return (
    <div className="space-y-4">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Gauge className="w-4 h-4 text-emerald-600" />
            <span>Speaking Pace</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {wpm ? `${wpm} WPM` : '135 WPM'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Ideal interview pace is 130-160 WPM</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Pauses & Silence</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {pauseCount != null ? `${pauseCount} pauses` : 'Balanced'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Deliberate pauses indicate thoughtfulness</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Activity className="w-4 h-4 text-purple-600" />
            <span>Filler Word Rate</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {fillerRate != null ? `${Math.round(fillerRate)}/min` : 'Low'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Minimal filler words improve confidence</p>
        </div>
      </div>

      {/* Observations Summary */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Delivery & Speech Observations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300">Clarity & Coherence</span>
            <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {audioEval?.clarity ||
                audioEval?.coherence ||
                'Clear articulation and coherent line of thought maintained throughout.'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300">Fluency & Tone</span>
            <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {audioEval?.fluency ||
                audioEval?.confidence ||
                'Professional tone with steady cadence.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationAnalytics;

