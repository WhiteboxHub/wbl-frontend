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

export function useAssessmentTelemetry({
  assessmentId,
  assessmentUuid,
  sessionId,
  assessmentType,
  candidateId,
  totalQuestions,
}: UseAssessmentTelemetryProps) {
  const effectiveUuid = assessmentUuid || sessionId || `assessment_${assessmentId}`;
  const startTimeRef = useRef<number>(0);
  const currentQuestionRef = useRef<number>(0);
  const answeredQuestionsCount = useRef<number>(0);
  const skippedQuestionsCount = useRef<number>(0);
  const blurStartRef = useRef<number | null>(null);
  const violationCountRef = useRef<number>(0);

  // Initialize start time on mount
  useEffect(() => {
    if (!startTimeRef.current && effectiveUuid && assessmentId) {
      startTimeRef.current = Date.now();
    }
  }, [assessmentId, effectiveUuid]);

  // 2. Tab switch / Blur detection (Proctoring alerts)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurStartRef.current = Date.now();
        violationCountRef.current += 1;
      } else {
        const awaySec = blurStartRef.current ? Math.round((Date.now() - blurStartRef.current) / 1000) : 1;
        blurStartRef.current = null;
        AIPrepTelemetry.trackProctoringViolation({
          assessment_id: assessmentId,
          assessment_uuid: effectiveUuid,
          candidate_id: candidateId,
          violation_type: 'TAB_SWITCH',
          violation_count: violationCountRef.current,
          time_away_seconds: Math.max(1, awaySec),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [assessmentId, effectiveUuid, candidateId]);

  // 3. Question transition callback
  const recordQuestionAction = useCallback(
    (
      questionId: number | string,
      questionNumber: number,
      action: QuestionAction | string,
      durationSeconds?: number,
      chunksUploaded?: number
    ) => {
      currentQuestionRef.current = questionNumber;
      if (action === QuestionAction.QUESTION_SUBMITTED || action === QuestionAction.QUESTION_ANSWERED || action === 'QUESTION_SUBMITTED' || action === 'QUESTION_ANSWERED') {
        answeredQuestionsCount.current += 1;
      } else if (action === QuestionAction.QUESTION_SKIPPED || action === 'QUESTION_SKIPPED') {
        skippedQuestionsCount.current += 1;
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
      const isAnswered = action === QuestionAction.QUESTION_SUBMITTED || action === QuestionAction.QUESTION_ANSWERED || action === 'QUESTION_SUBMITTED' || action === 'QUESTION_ANSWERED';
      const isSkipped = action === QuestionAction.QUESTION_SKIPPED || action === 'QUESTION_SKIPPED';
      
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

  // 4. Audio Chunk Upload Telemetry
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

  // 5. Final completion or abandonment
  const recordCompletion = useCallback(
    (status: 'COMPLETED' | 'ABANDONED' | SessionLifecycleStatus | string = 'COMPLETED', reason?: string) => {
      const totalSec = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000);
      const isCompleted = status === 'COMPLETED' || status === SessionLifecycleStatus.COMPLETED || status === 'completed';
      const assessmentStatus: 'COMPLETED' | 'ABANDONED' = isCompleted ? 'COMPLETED' : 'ABANDONED';

      AIPrepTelemetry.trackAssessmentCompletion({
        assessment_id: assessmentId,
        assessment_uuid: effectiveUuid,
        candidate_id: candidateId,
        assessment_type: String(assessmentType),
        assessment_status: assessmentStatus,
        total_questions: totalQuestions,
        answered_questions: answeredQuestionsCount.current,
        skipped_questions: skippedQuestionsCount.current,
        total_duration_seconds: totalSec,
        last_active_question: currentQuestionRef.current || 1,
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
