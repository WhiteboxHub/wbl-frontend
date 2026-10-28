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
  isMonitoringActive?: boolean;
  onViolation?: (type: 'TAB_SWITCH' | 'SCREENSHOT' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'SPLIT_SCREEN' | 'SPLIT_SCREEN_TIMEOUT', violationCount: number) => void;
}

interface TelemetrySessionState {
  assessmentId: number;
  startTime: number;
  currentQuestion: number;
  answeredQuestionsCount: number;
  skippedQuestionsCount: number;
  blurStartTime: number | null;
  violationCount: number;
  lastFocusViolationAt: number;
}

export function useAssessmentTelemetry({
  assessmentId,
  assessmentUuid,
  sessionId,
  assessmentType,
  candidateId,
  totalQuestions,
  isMonitoringActive = true,
  onViolation,
}: UseAssessmentTelemetryProps) {
  const effectiveUuid = assessmentUuid || sessionId || `assessment_${assessmentId}`;
  const onViolationRef = useRef(onViolation);

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

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
    lastFocusViolationAt: 0,
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
      lastFocusViolationAt: 0,
    };
  }, [assessmentId, sessionStateRef]);

  // Tab switch, window focus, fullscreen and split-screen monitoring.
  // Deduplicate visibilitychange + blur events caused by the same tab switch.
  useEffect(() => {
    if (!isMonitoringActive) return;

    const registerFocusViolation = (type: 'TAB_SWITCH' | 'WINDOW_BLUR') => {
      const now = Date.now();
      const state = sessionStateRef.current;
      if (now - state.lastFocusViolationAt < 1200) return;
      state.lastFocusViolationAt = now;
      if (type === 'TAB_SWITCH') state.blurStartTime = now;
      state.violationCount += 1;
      const count = state.violationCount;
      AIPrepTelemetry.trackProctoringViolation({
        assessment_id: assessmentId,
        assessment_uuid: effectiveUuid,
        candidate_id: candidateId,
        violation_type: type,
        violation_count: count,
        time_away_seconds: 1,
      });
      onViolationRef.current?.(type, count);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerFocusViolation('TAB_SWITCH');
      } else {
        const blurStart = sessionStateRef.current.blurStartTime;
        const awaySec = blurStart ? Math.round((Date.now() - blurStart) / 1000) : 1;
        sessionStateRef.current.blurStartTime = null;
        AIPrepTelemetry.trackProctoringViolation({
          assessment_id: assessmentId,
          assessment_uuid: effectiveUuid,
          candidate_id: candidateId,
          violation_type: 'TAB_SWITCH_RETURN',
          violation_count: sessionStateRef.current.violationCount,
          time_away_seconds: Math.max(1, awaySec),
        });
      }
    };
    const handleBlur = () => {
      if (!document.hidden) registerFocusViolation('WINDOW_BLUR');
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const now = Date.now();
        if (now - sessionStateRef.current.lastFocusViolationAt < 1200) return;
        sessionStateRef.current.lastFocusViolationAt = now;
        sessionStateRef.current.violationCount += 1;
        const count = sessionStateRef.current.violationCount;
        AIPrepTelemetry.trackProctoringViolation({
          assessment_id: assessmentId,
          assessment_uuid: effectiveUuid,
          candidate_id: candidateId,
          violation_type: 'FULLSCREEN_EXIT',
          violation_count: count,
          time_away_seconds: 0,
        });
        onViolationRef.current?.('FULLSCREEN_EXIT', count);
      }
    };
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let splitScreenTimer: ReturnType<typeof setTimeout> | undefined;
    let splitScreenActive = false;
    let splitScreenReported = false;

    const isLikelySplitScreen = () => {
      const screenWidth = window.screen?.availWidth ?? window.innerWidth;
      const measuredWidth = Math.min(window.innerWidth, window.outerWidth || window.innerWidth);
      // A snapped half-screen browser is typically below 70% of the available display width.
      return screenWidth >= 1000 && measuredWidth <= screenWidth * 0.7;
    };

    const finishSustainedSplitScreen = () => {
      splitScreenTimer = undefined;
      if (!isMonitoringActive || !splitScreenActive || !isLikelySplitScreen() || splitScreenReported) return;

      splitScreenReported = true;
      const count = sessionStateRef.current.violationCount;
      AIPrepTelemetry.trackProctoringViolation({
        assessment_id: assessmentId,
        assessment_uuid: effectiveUuid,
        candidate_id: candidateId,
        violation_type: 'SPLIT_SCREEN_TIMEOUT',
        violation_count: count,
        time_away_seconds: 10,
      });
      // Reuse the count reported when split-screen began; timeout ends the assessment
      // without counting the same sustained split-screen episode as a second violation.
      onViolationRef.current?.('SPLIT_SCREEN_TIMEOUT', count);
    };

    const checkSplitScreen = () => {
      const currentlySplit = isLikelySplitScreen();
      if (!currentlySplit) {
        splitScreenActive = false;
        splitScreenReported = false;
        if (splitScreenTimer) clearTimeout(splitScreenTimer);
        splitScreenTimer = undefined;
        return;
      }

      if (splitScreenActive || splitScreenReported) return;
      splitScreenActive = true;

      // Count and display the violation immediately so the candidate sees the warning
      // throughout the 10-second grace period.
      const state = sessionStateRef.current;
      state.violationCount += 1;
      const count = state.violationCount;
      state.lastFocusViolationAt = Date.now();
      AIPrepTelemetry.trackProctoringViolation({
        assessment_id: assessmentId,
        assessment_uuid: effectiveUuid,
        candidate_id: candidateId,
        violation_type: 'SPLIT_SCREEN',
        violation_count: count,
        time_away_seconds: 0,
      });
      onViolationRef.current?.('SPLIT_SCREEN', count);

      // Give the candidate 10 seconds to restore the assessment to a normal window.
      splitScreenTimer = setTimeout(finishSustainedSplitScreen, 10_000);
    };

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkSplitScreen, 300);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);
    // Check once after monitoring starts, in case the room is already snapped.
    handleResize();
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      if (splitScreenTimer) clearTimeout(splitScreenTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [assessmentId, effectiveUuid, candidateId, isMonitoringActive]);

  const recordProctoringViolation = useCallback(
    (type: 'TAB_SWITCH' | 'SCREENSHOT' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'SPLIT_SCREEN' | 'SPLIT_SCREEN_TIMEOUT') => {
      sessionStateRef.current.violationCount += 1;
      const count = sessionStateRef.current.violationCount;

      AIPrepTelemetry.trackProctoringViolation({
        assessment_id: assessmentId,
        assessment_uuid: effectiveUuid,
        candidate_id: candidateId,
        violation_type: type,
        violation_count: count,
        time_away_seconds: 1,
      });

      onViolationRef.current?.(type, count);
      return count;
    },
    [assessmentId, effectiveUuid, candidateId]
  );

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
    recordProctoringViolation,
  };
}
