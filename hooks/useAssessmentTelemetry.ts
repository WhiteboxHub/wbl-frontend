'use client';

import { useEffect, useRef, useCallback } from 'react';
import { AIPrepTelemetry } from '@/lib/telemetry';
import {
  AIAssessmentType,
  QuestionAction,
  SessionLifecycleStatus,
} from '@/types/telemetry';

interface UseAssessmentTelemetryProps {
  assessmentId: number;
  assessmentUuid?: string;
  sessionId?: string;
  assessmentType: AIAssessmentType | string;
  candidateId?: number;
  totalQuestions?: number;
}

interface TelemetrySessionState {
  assessmentId: number;
  startTime: number;
  currentQuestion: number;
  answeredQuestionsCount: number;
  skippedQuestionsCount: number;
  blurStartTime: number | null;
  violationCount: number;
}

export function useAssessmentTelemetry({
  assessmentId,
  assessmentUuid,
  sessionId,
  assessmentType,
  candidateId,
  totalQuestions,
}: UseAssessmentTelemetryProps) {
  const effectiveUuid = assessmentUuid || sessionId || `assessment_${assessmentId}`;

  // Atomic mutable session state ref - updated synchronously on every event
  // without relying on asynchronous useReducer schedules or post-paint useEffect synchronization.
  const sessionStateRef = useRef<TelemetrySessionState>({
    assessmentId,
    startTime: Date.now(),
    currentQuestion: 0,
    answeredQuestionsCount: 0,
    skippedQuestionsCount: 0,
    blurStartTime: null,
    violationCount: 0,
  });

  // Reset session metrics synchronously whenever assessmentId changes
  useEffect(() => {
    sessionStateRef.current = {
      assessmentId,
      startTime: Date.now(),
      currentQuestion: 0,
      answeredQuestionsCount: 0,
      skippedQuestionsCount: 0,
      blurStartTime: null,
      violationCount: 0,
    };
  }, [assessmentId]);

  // Tab switch / Blur detection (Proctoring alerts)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sessionStateRef.current.blurStartTime = Date.now();
        sessionStateRef.current.violationCount += 1;
      } else {
        const blurStart = sessionStateRef.current.blurStartTime;
        const awaySec = blurStart
          ? Math.round((Date.now() - blurStart) / 1000)
          : 1;
        sessionStateRef.current.blurStartTime = null;

        AIPrepTelemetry.trackProctoringViolation({
          assessment_id: assessmentId,
          assessment_uuid: effectiveUuid,
          candidate_id: candidateId,
          violation_type: 'TAB_SWITCH',
          violation_count: sessionStateRef.current.violationCount,
          time_away_seconds: Math.max(1, awaySec),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [assessmentId, effectiveUuid, candidateId]);

  // Question transition callback
  const recordQuestionAction = useCallback(
    (
      questionId: number | string,
      questionNumber: number,
      action: QuestionAction | string,
      durationSeconds?: number,
      chunksUploaded?: number
    ) => {
      const isAnswered =
        action === QuestionAction.QUESTION_SUBMITTED ||
        action === QuestionAction.QUESTION_ANSWERED ||
        action === 'QUESTION_SUBMITTED' ||
        action === 'QUESTION_ANSWERED';
      const isSkipped =
        action === QuestionAction.QUESTION_SKIPPED ||
        action === 'QUESTION_SKIPPED';

      // Synchronously and atomically update telemetry metrics immediately
      sessionStateRef.current.currentQuestion = questionNumber;
      if (isAnswered) {
        sessionStateRef.current.answeredQuestionsCount += 1;
      }
      if (isSkipped) {
        sessionStateRef.current.skippedQuestionsCount += 1;
      }

      AIPrepTelemetry.trackQuestionAction({
        assessment_id: assessmentId,
        assessment_uuid: effectiveUuid,
        candidate_id: candidateId,
        assessment_type: String(assessmentType),
        question_id: questionId,
        question_number: questionNumber,
        total_questions: totalQuestions,
        action,
        duration_seconds: durationSeconds,
        chunks_uploaded: chunksUploaded,
      });

      // Wire up Question Analytics (UX Friction)
      if ((isAnswered || isSkipped) && durationSeconds !== undefined) {
        AIPrepTelemetry.trackQuestionFriction({
          question_id: questionId,
          question_number: questionNumber,
          duration_seconds: durationSeconds,
          is_skipped: isSkipped,
          candidate_id: candidateId,
          assessment_id: assessmentId,
        });
      }
    },
    [assessmentId, effectiveUuid, assessmentType, candidateId, totalQuestions]
  );

  // Audio Chunk Upload Telemetry
  const recordAudioChunkUpload = useCallback(
    (
      questionId: number | string,
      chunkIndex: number,
      chunkSizeBytes: number,
      isFinal: boolean,
      uploadedChunksCount: number,
      success: boolean,
      retryCount?: number,
      errorMessage?: string
    ) => {
      AIPrepTelemetry.trackAudioChunk({
        assessment_id: assessmentId,
        assessment_uuid: effectiveUuid,
        candidate_id: candidateId,
        question_id: questionId,
        chunk_index: chunkIndex,
        chunk_size_bytes: chunkSizeBytes,
        is_final: isFinal,
        uploaded_chunks_count: uploadedChunksCount,
        success,
        retry_count: retryCount,
        error_message: errorMessage,
      });
    },
    [assessmentId, effectiveUuid, candidateId]
  );

  // Final completion or abandonment
  const recordCompletion = useCallback(
    (
      status: 'COMPLETED' | 'ABANDONED' | SessionLifecycleStatus | string = 'COMPLETED',
      reason?: string,
      options?: {
        answeredQuestions?: number;
        skippedQuestions?: number;
        lastActiveQuestion?: number;
        durationSeconds?: number;
      }
    ) => {
      const state = sessionStateRef.current;
      const totalSec = options?.durationSeconds ?? Math.round(
        (Date.now() - (state.startTime || Date.now())) / 1000
      );
      const isCompleted =
        status === 'COMPLETED' ||
        status === SessionLifecycleStatus.COMPLETED ||
        status === 'completed';
      const assessmentStatus: 'COMPLETED' | 'ABANDONED' = isCompleted
        ? 'COMPLETED'
        : 'ABANDONED';

      AIPrepTelemetry.trackAssessmentCompletion({
        assessment_id: assessmentId,
        assessment_uuid: effectiveUuid,
        candidate_id: candidateId,
        assessment_type: String(assessmentType),
        assessment_status: assessmentStatus,
        total_questions: totalQuestions,
        answered_questions: options?.answeredQuestions ?? state.answeredQuestionsCount,
        skipped_questions: options?.skippedQuestions ?? state.skippedQuestionsCount,
        total_duration_seconds: totalSec,
        last_active_question: options?.lastActiveQuestion ?? (state.currentQuestion || 1),
        reason,
      });
    },
    [assessmentId, effectiveUuid, assessmentType, candidateId, totalQuestions]
  );

  return {
    recordQuestionAction,
    recordAudioChunkUpload,
    recordCompletion,
  };
}
