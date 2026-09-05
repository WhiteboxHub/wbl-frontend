'use client';

import React from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  IconCheck,
  IconLoader2,
  IconAlertTriangle,
  IconSparkles,
  IconArrowRight,
  IconCpu,
  IconWaveSine,
  IconEyeCheck,
  IconFileText,
} from '@tabler/icons-react';
import { useProcessingStatus, type ProcessingPipelineSteps } from '@/hooks/useProcessingStatus';

interface StepConfig {
  key: keyof ProcessingPipelineSteps;
  title: string;
  description: string;
  icon: React.ElementType;
}

const PIPELINE_STEPS: StepConfig[] = [
  {
    key: 'stt',
    title: 'Transcribing Audio & Q&A Transcript',
    description: 'Converting voice recordings to structured candidate text',
    icon: IconWaveSine,
  },
  {
    key: 'audio',
    title: 'Speech & Cadence Analysis',
    description: 'Measuring speaking pace (WPM), pause ratios, and clarity',
    icon: IconCpu,
  },
  {
    key: 'video',
    title: 'Video Engagement & Presence',
    description: 'Validating posture alignment, face presence, and stability',
    icon: IconEyeCheck,
  },
  {
    key: 'llm',
    title: 'AI Scoring Engine (GPT-4o)',
    description: 'Synthesizing technical depth, answer quality, and rubrics',
    icon: IconSparkles,
  },
  {
    key: 'finalize',
    title: 'Coaching Report Generation',
    description: 'Compiling strengths, improvement areas, and radar metrics',
    icon: IconFileText,
  },
];

export default function AssessmentProcessingPage() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();

  const rawId = routeParams?.assessmentId;
  const assessmentId = Array.isArray(rawId) ? Number(rawId[0]) : Number(rawId);
  const isEmbedded = searchParams?.get('embed') === 'true';

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
      // Auto-redirect to candidate's detailed report page
      const targetUrl = isEmbedded
        ? `/aiprep/reports/${assessmentId}?embed=true`
        : `/aiprep/reports/${assessmentId}`;
      setTimeout(() => {
        router.push(targetUrl);
      }, 1200);
    },
  });

  return (
    <main className="min-h-screen w-full bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Header with glowing animated icon */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              {isCompleted ? (
                <IconCheck size={32} className="text-white" stroke={3} />
              ) : isFailed ? (
                <IconAlertTriangle size={32} className="text-white" />
              ) : (
                <IconSparkles size={32} className="text-white animate-pulse" />
              )}
            </div>
            {!isCompleted && !isFailed && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
              </span>
            )}
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {isCompleted
                ? 'Evaluation Complete!'
                : isFailed
                ? 'Evaluation Stalled'
                : 'AI Evaluation in Progress'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {isCompleted
                ? 'Your coaching insights have been generated. Loading your report now…'
                : isFailed
                ? (errorMessage || 'We encountered a delay analyzing your response.')
                : `Pure evaluation engines are grading your assessment (Session #${assessmentId}).`}
            </p>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Processing Progress</span>
            <span className="text-indigo-400 font-mono font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isFailed
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Pipeline Step Checklist */}
        <div className="space-y-3 pt-2">
          {PIPELINE_STEPS.map((step) => {
            const stepStatus = steps[step.key];
            const StepIcon = step.icon;

            const isStepRunning = stepStatus === 'RUNNING';
            const isStepCompleted = stepStatus === 'COMPLETED';
            const isStepFailed = stepStatus === 'FAILED';

            return (
              <div
                key={step.key}
                className={`flex items-start gap-3.5 p-3 rounded-2xl border transition-all duration-200 ${
                  isStepCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/20'
                    : isStepRunning
                    ? 'bg-indigo-950/30 border-indigo-500/40 shadow-sm'
                    : isStepFailed
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isStepCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isStepRunning
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : isStepFailed
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isStepCompleted ? (
                    <IconCheck size={16} stroke={3} />
                  ) : isStepRunning ? (
                    <IconLoader2 size={16} className="animate-spin text-indigo-400" />
                  ) : (
                    <StepIcon size={16} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-xs font-bold ${
                        isStepCompleted
                          ? 'text-emerald-300'
                          : isStepRunning
                          ? 'text-indigo-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                        isStepCompleted
                          ? 'text-emerald-400'
                          : isStepRunning
                          ? 'text-indigo-400'
                          : 'text-slate-600'
                      }`}
                    >
                      {stepStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions / redirect prompt */}
        <div className="pt-2 text-center">
          {isCompleted ? (
            <button
              type="button"
              onClick={() => {
                const targetUrl = isEmbedded
                  ? `/aiprep/reports/${assessmentId}?embed=true`
                  : `/aiprep/reports/${assessmentId}`;
                router.push(targetUrl);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <span>View Coaching Report</span>
              <IconArrowRight size={16} />
            </button>
          ) : isFailed ? (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={refetch}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Retry Check
              </button>
              <button
                type="button"
                onClick={() => router.push(isEmbedded ? '/aiprep?embed=true' : '/aiprep')}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Back to Portal
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Please keep this tab open. You will be automatically redirected once evaluation finishes.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
