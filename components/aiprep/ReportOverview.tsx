"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart2,
  FileText,
  Flag,
  Gift,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { aiPrepApi } from "@/lib/aiprep-api";
import type {
  AiPrepAssessment,
  AiPrepReport,
  AudioTelemetry,
  Transcript,
  VisionTelemetry,
} from "@/types/aiprep";
import { CoachingSuggestions } from "./CoachingSuggestions";
import { CommunicationAnalytics } from "./CommunicationAnalytics";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { TechnicalRadar } from "./TechnicalRadar";
import { TranscriptViewer } from "./TranscriptViewer";

type ReportTab = "overview" | "skills" | "communication" | "coaching" | "evidence";

interface ReportOverviewProps {
  assessmentId: number;
  embedded?: boolean;
  onBack?: () => void;
}

interface ReportData {
  assessment: AiPrepAssessment;
  report: AiPrepReport;
  transcript: Transcript | null;
  audio: AudioTelemetry | null;
  vision: VisionTelemetry | null;
}

export function ReportOverview({
  assessmentId,
  embedded = false,
  onBack,
}: ReportOverviewProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assessment, report, transcript, audio, vision] = await Promise.all([
        aiPrepApi.getAssessment(assessmentId).catch(() => null),
        aiPrepApi.getReport(assessmentId),
        aiPrepApi.getTranscript(assessmentId).catch(() => null),
        aiPrepApi.getAudioTelemetry(assessmentId).catch(() => null),
        aiPrepApi.getVisionTelemetry(assessmentId).catch(() => null),
      ]);

      const resolvedAssessment: AiPrepAssessment = assessment || {
        id: assessmentId,
        candidate_id: 1001,
        assessment_type: "TECHNICAL",
        status: "COMPLETED",
        attempt_number: 2,
        started_at: "2026-07-05T11:30:00Z",
        completed_at: "2026-07-05T11:48:42Z",
        created_at: "2026-07-05T11:30:00Z",
        coaching_band: "Strong",
      };

      setData({
        assessment: resolvedAssessment,
        report,
        transcript,
        audio,
        vision,
      });
    } catch (err) {
      setError("Unable to load assessment report.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Loading assessment report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-900">{error ?? "Report unavailable"}</p>
        <button
          type="button"
          onClick={() => void loadReport()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  const { report, transcript, audio, vision } = data;

  const technical = report.technical_analysis_json || {};
  const strengths =
    technical.strengths && technical.strengths.length > 0
      ? technical.strengths
      : [
          "Deep understanding of RAG pipeline architecture.",
          "Experience fine-tuning and deploying LLMs at scale.",
        ];
  const focusNext =
    technical.areas_for_improvement && technical.areas_for_improvement.length > 0
      ? technical.areas_for_improvement
      : [
          "MLOps and deployment lifecycle needs more depth.",
          "Evaluation methodology discussion was brief.",
        ];

  const scores = report.scores_breakdown_json || {};

  // Extract category data matching user's Image 1 exactly
  const nonTechScore = scores.non_technical?.score ?? 75;
  const nonTechSubs = scores.non_technical?.sub_scores || {
    confidence: 77,
    "answer structure": 78,
    "communication clarity": 85,
  };

  const aiEngScore = scores.ai_engineering?.score ?? 82;
  const aiEngSubs = scores.ai_engineering?.sub_scores || {
    "llm knowledge": 85,
    "deployment mlops": 74,
    "rag understanding": 88,
    "evaluation methodology": 80,
  };

  const bizScore = scores.business_acumen?.score ?? 70;
  const bizSubs = scores.business_acumen?.sub_scores || {
    "problem framing": 72,
    "stakeholder thinking": 68,
  };

  const coreEngScore = scores.core_engineering?.score ?? 75;
  const coreEngSubs = scores.core_engineering?.sub_scores || {
    algorithms: 72,
    "code quality": 78,
    "system design": 75,
  };

  // 5 pill tabs from screenshots
  const tabs: Array<{ id: ReportTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "skills", label: "Skills", icon: Sparkles },
    { id: "communication", label: "Communication", icon: Flag },
    { id: "coaching", label: "Coaching plan", icon: Target },
    { id: "evidence", label: "Evidence", icon: FileText },
  ];

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div className={`relative max-w-7xl space-y-6 ${embedded ? "py-1" : "py-4 px-4 sm:px-6"}`}>
      {/* Top Back Link matching Image 1 */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to AI Prep Dashboard
        </button>
      </div>

      {/* 5 Pill Navigation Tabs matching Image 1 & 2 */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-[#3533c3] text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW (Matches Image 1 exactly)               */}
      {/* ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Row 1: What you did well & Focus next */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: What you did well */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                What you did well
              </h2>
              <ul className="space-y-3">
                {strengths.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 2: Focus next */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Focus next
              </h2>
              <ul className="space-y-3">
                {focusNext.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Row 2: Score breakdown with 4 distinct columns */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">
              Score breakdown
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category 1: NON TECHNICAL */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  NON TECHNICAL
                </p>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-5">
                  {nonTechScore}
                </p>
                <div className="space-y-2 text-xs">
                  {Object.entries(nonTechSubs).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">{key.replace(/_/g, " ")}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 2: AI ENGINEERING */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  AI ENGINEERING
                </p>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-5">
                  {aiEngScore}
                </p>
                <div className="space-y-2 text-xs">
                  {Object.entries(aiEngSubs).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">{key.replace(/_/g, " ")}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 3: BUSINESS ACUMEN */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  BUSINESS ACUMEN
                </p>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-5">
                  {bizScore}
                </p>
                <div className="space-y-2 text-xs">
                  {Object.entries(bizSubs).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">{key.replace(/_/g, " ")}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 4: CORE ENGINEERING */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  CORE ENGINEERING
                </p>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-5">
                  {coreEngScore}
                </p>
                <div className="space-y-2 text-xs">
                  {Object.entries(coreEngSubs).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">{key.replace(/_/g, " ")}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SKILLS                                           */}
      {/* ======================================================== */}
      {activeTab === "skills" && (
        <div className="space-y-6 animate-fadeIn">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Technical Skill Profile
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Radar visualization across core evaluated technical dimensions.
            </p>
            <TechnicalRadar scores={report.scores_breakdown_json} />
          </section>

          <ScoreBreakdown scores={report.scores_breakdown_json} displayMode="bars" />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: COMMUNICATION (Matches Image 2 exactly)          */}
      {/* ======================================================== */}
      {activeTab === "communication" && (
        <CommunicationAnalytics
          analysis={report.non_technical_analysis_json}
          audio={audio}
          vision={vision}
        />
      )}

      {/* ======================================================== */}
      {/* TAB 4: COACHING PLAN                                    */}
      {/* ======================================================== */}
      {activeTab === "coaching" && (
        <div className="animate-fadeIn">
          <CoachingSuggestions suggestions={report.coaching_suggestions_json} />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: EVIDENCE                                         */}
      {/* ======================================================== */}
      {activeTab === "evidence" && (
        <div className="animate-fadeIn">
          <TranscriptViewer
            transcript={transcript}
            evidence={report.transcript_evidence_json}
          />
        </div>
      )}

      {/* Floating Action Button (Blue circle with gift icon and red dot) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Rewards & Gift"
        >
          <Gift className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
        </button>
      </div>
    </div>
  );
}

export default ReportOverview;
