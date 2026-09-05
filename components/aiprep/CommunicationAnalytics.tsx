"use client";

import React from "react";
import type { AudioTelemetry, NonTechnicalAnalysis, VisionTelemetry } from "@/types/aiprep";

interface CommunicationAnalyticsProps {
  analysis?: NonTechnicalAnalysis | null;
  audio?: AudioTelemetry | null;
  vision?: VisionTelemetry | null;
}

export function CommunicationAnalytics({ analysis, audio, vision }: CommunicationAnalyticsProps) {
  const commSummary =
    analysis?.communication_summary ||
    "Spoke clearly with good pace (138 WPM). Minimal filler words. Answers were structured and confident.";
  const structure =
    analysis?.structure_quality || "Used STAR structure effectively on most questions.";
  const confidence =
    analysis?.confidence_notes ||
    "Maintained steady tone throughout. Showed genuine enthusiasm for AI engineering.";

  const speakingPace = audio?.speaking_pace_wpm ?? 138;
  const fillerWords = audio?.filler_words_per_min ?? 2;
  const silenceRatio = audio?.silence_ratio_pct ?? 14.2;
  const volumeDb = audio?.avg_volume_db !== undefined ? audio.avg_volume_db : -18.5;
  const noiseLevel = (audio?.background_noise_level || "LOW").toUpperCase();
  const clipping = audio?.clipping_detected ? "Yes" : "No";

  const faceVisible = vision?.face_visible_pct !== undefined ? vision.face_visible_pct : 96.5;
  const headNods = vision?.head_nods_count !== undefined ? vision.head_nods_count : 12;
  const frameStability = vision?.frame_stability_score !== undefined ? vision.frame_stability_score : 92;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm animate-fadeIn">
      {/* Main Title */}
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">
        Communication and recording analytics
      </h2>

      {/* Top 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            COMMUNICATION SUMMARY
          </p>
          <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
            {commSummary}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            STRUCTURE QUALITY
          </p>
          <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
            {structure}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            CONFIDENCE NOTES
          </p>
          <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
            {confidence}
          </p>
        </div>
      </div>

      {/* Audio Analytics Section */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5">
          Audio analytics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Speaking pace</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {speakingPace}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Filler words per minute</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {fillerWords}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Silence ratio</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {silenceRatio}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Average volume</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {volumeDb}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Background noise</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 uppercase">
              {noiseLevel}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Clipping detected</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {clipping}
            </p>
          </div>
        </div>
      </div>

      {/* Video Environment Analytics Section */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5">
          Video environment analytics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Face visible</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {faceVisible}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Head nods</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {headNods}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Frame stability</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {frameStability}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunicationAnalytics;
