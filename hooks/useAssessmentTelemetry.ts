'use client';

import { useEffect, useRef, useCallback, useReducer } from 'react';
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

type TelemetrySessionAction =
  | { type: 'RESET_SESSION'; assessmentId: number; startTime: number }
  | { type: 'TAB_BLUR'; timestamp: number }
  | { type: 'TAB_FOCUS' }
  | { type: 'RECORD_QUESTION_ACTION'; questionNumber: number; isAnswered: boolean; isSkipped: boolean };

function telemetryReducer(
  state: TelemetrySessionState,
  action: TelemetrySessionAction
): TelemetrySessionState {
  switch (action.type) {
    case 'RESET_SESSION':
      return {
        assessmentId: action.assessmentId,
        startTime: action.startTime,
        currentQuestion: 0,
        answeredQuestionsCount: 0,
        skippedQuestionsCount: 0,
        blurStartTime: null,
        violationCount: 0,
      };
    case 'TAB_BLUR':
      return {
        ...state,
        blurStartTime: action.timestamp,
        violationCount: state.violationCount + 1,
      };
    case 'TAB_FOCUS':
      return {
        ...state,
        blurStartTime: null,
      };
    case 'RECORD_QUESTION_ACTION':
      return {
        ...state,
        currentQuestion: action.questionNumber,
        answeredQuestionsCount: action.isAnswered
          ? state.answeredQuestionsCount + 1
          : state.answeredQuestionsCount,
        skippedQuestionsCount: action.isSkipped
          ? state.skippedQuestionsCount + 1
          : state.skippedQuestionsCount,
      };
    default:
      return state;
  }
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

  const [state, dispatch] = useReducer(telemetryReducer, {
    assessmentId,
    startTime: Date.now(),
    currentQuestion: 0,
    answeredQuestionsCount: 0,
    skippedQuestionsCount: 0,
    blurStartTime: null,
    violationCount: 0,
  });

  // Synchronized state reference for atomic callback reads
  const stateRef = useRef<TelemetrySessionState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize or reset session start time atomically on assessmentId change
  useEffect(() => {
    dispatch({
      type: 'RESET_SESSION',
      assessmentId,
      startTime: Date.now(),
    });
  }, [assessmentId]);

  // 2. Tab switch / Blur detection (Proctoring alerts)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        dispatch({ type: 'TAB_BLUR', timestamp: Date.now() });
      } else {
        const currentState = stateRef.current;
        const awaySec = currentState.blurStartTime
          ? Math.round((Date.now() - currentState.blurStartTime) / 1000)
          : 1;
        dispatch({ type: 'TAB_FOCUS' });

        AIPrepTelemetry.trackProctoringViolation({
          assessment_id: assessmentId,
          assessment_uuid: effectiveUuid,
          candidate_id: candidateId,
          violation_type: 'TAB_SWITCH',
          violation_count: currentState.violationCount,
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
      const isAnswered =
        action === QuestionAction.QUESTION_SUBMITTED ||
        action === QuestionAction.QUESTION_ANSWERED ||
        action === 'QUESTION_SUBMITTED' ||
        action === 'QUESTION_ANSWERED';
      const isSkipped =
        action === QuestionAction.QUESTION_SKIPPED ||
        action === 'QUESTION_SKIPPED';

      dispatch({
        type: 'RECORD_QUESTION_ACTION',
        questionNumber,
        isAnswered,
        isSkipped,
      });

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
    (
      status: 'COMPLETED' | 'ABANDONED' | SessionLifecycleStatus | string = 'COMPLETED',
      reason?: string
    ) => {
      const currentState = stateRef.current;
      const totalSec = Math.round(
        (Date.now() - (currentState.startTime || Date.now())) / 1000
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
        answered_questions: currentState.answeredQuestionsCount,
        skipped_questions: currentState.skippedQuestionsCount,
        total_duration_seconds: totalSec,
        last_active_question: currentState.currentQuestion || 1,
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
