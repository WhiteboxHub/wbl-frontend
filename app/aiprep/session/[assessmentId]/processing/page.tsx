'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  IconCheck,
  IconLoader2,
  IconAlertTriangle,
  IconSparkles,
  IconArrowRight,
  IconClock,
} from '@tabler/icons-react';
import { useProcessingStatus } from '@/hooks/useProcessingStatus';
import type { ProcessingSteps } from '@/lib/aiprep-api';

interface StepConfig {
  key: keyof ProcessingSteps;
  title: string;
  description: string;
}

const PIPELINE_STEPS: StepConfig[] = [
  {
    key: 'stt',
    title: 'Transcribing Audio',
    description: 'Converting speech to text with OpenAI Whisper',
  },
  {
    key: 'audio',
    title: 'Analyzing Speech Patterns',
    description: 'Evaluating speaking pace (WPM), pauses, and volume',
  },
  {
    key: 'vision',
    title: 'Validating Video Telemetry',
    description: 'Verifying on-device face presence and camera framing',
  },
  {
    key: 'llm',
    title: 'Generating AI Coaching Report',
    description: 'Synthesizing technical depth and structured feedback with GPT-4o',
  },
  {
    key: 'finalize',
    title: 'Compiling Final Insights',
    description: 'Calculating coaching bands and radar metrics',
  },
];

export default function ProcessingPage() {
  const router = useRouter();
  const routeParams = useParams();
  const rawId = routeParams?.assessmentId;
  const assessmentId = Array.isArray(rawId) ? Number(rawId[0]) : Number(rawId);

  const {
    steps,
    progressPercent,
    isCompleted,
    isFailed,
    errorMessage,
    refetch,
  } = useProcessingStatus({
    assessmentId: isNaN(assessmentId) || !assessmentId ? null : assessmentId,
    onCompleted: () => {
      setTimeout(() => {
        router.push(`/aiprep/reports/${assessmentId}`);
      }, 1200);
    },
  });

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0b0f19] text-gray-900 dark:text-white pt-28 sm:pt-32 pb-16 px-4 sm:px-6 flex flex-col items-center justify-center transition-colors">
      <div className="w-full max-w-xl bg-white dark:bg-[#1D2144] border border-gray-200 dark:border-[#333756] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary">
            <IconSparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>AI Evaluation in Progress</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-indigo-500 to-purple-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
            Synthesizing Your Coaching Report
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 dark:text-body-color max-w-md mx-auto">
            Our multi-modal evaluation workers are extracting depth, structure, and communication insights.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
            <span>Overall Progress</span>
            <span className="font-mono text-primary font-bold">{progressPercent}%</span>
          </div>

          <div className="w-full h-2.5 bg-gray-100 dark:bg-[#121723] rounded-full overflow-hidden border border-gray-200/60 dark:border-transparent">
            <div
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className={`h-full transition-all duration-500 ease-out rounded-full ${
                isFailed
                  ? 'bg-rose-500'
                  : isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div
          role="list"
          aria-label="Evaluation pipeline steps"
          className="space-y-3"
        >
          {PIPELINE_STEPS.map((step) => {
            const stepStatus = steps[step.key];
            const isRunning = stepStatus === 'RUNNING';
            const isDone = stepStatus === 'COMPLETED';
            const isStepFailed = stepStatus === 'FAILED';

            return (
              <div
                key={step.key}
                role="listitem"
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isRunning
                    ? 'bg-primary/5 dark:bg-primary/10 border-primary/40 shadow-md'
                    : isDone
                    ? 'bg-gray-50 dark:bg-[#121723]/40 border-gray-200 dark:border-[#333756]/60'
                    : isStepFailed
                    ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                    : 'bg-gray-50/50 dark:bg-[#121723]/20 border-gray-200/50 dark:border-[#333756]/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : isRunning
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                        : isStepFailed
                        ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-gray-100 dark:bg-[#121723] text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {isDone ? (
                      <IconCheck className="w-4 h-4" aria-hidden="true" />
                    ) : isRunning ? (
                      <IconLoader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : isStepFailed ? (
                      <IconAlertTriangle className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <IconClock className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        isRunning
                          ? 'text-primary dark:text-white'
                          : isDone
                          ? 'text-gray-800 dark:text-gray-200'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-body-color hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-medium">
                  {isDone && <span className="text-emerald-600 dark:text-emerald-400">Complete</span>}
                  {isRunning && <span className="text-primary font-bold animate-pulse">Running...</span>}
                  {isStepFailed && <span className="text-rose-600 dark:text-rose-400">Failed</span>}
                  {stepStatus === 'QUEUED' && <span className="text-gray-400 dark:text-gray-500">Pending</span>}
                </div>
              </div>
            );
          })}
        </div>

        {isFailed && (
          <div
            role="alert"
            className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl space-y-2 text-rose-600 dark:text-rose-300 text-xs"
          >
            <div className="flex items-center gap-2 font-semibold">
              <IconAlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
              <span>Processing Interrupted</span>
            </div>
            <p className="text-rose-600/80 dark:text-rose-300/80">{errorMessage}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-xs transition-all active:scale-95 shadow"
            >
              Retry Status Query
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => router.push(`/aiprep/reports/${assessmentId}`)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primarylight text-white font-semibold rounded-xl shadow-lg transition-all transform active:scale-95 text-sm"
            >
              <span>View Coaching Report</span>
              <IconArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
