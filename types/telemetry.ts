import { AssessmentType as CoreAssessmentType, MediaType, AssessmentStatus } from '@/types/aiprep';

// ==========================================
// 1. Observability Status & Stage Definitions
// ==========================================
export type ObservabilityStatus =
  | 'SUCCESS'     // Normal expected completion
  | 'FAILED'      // Hardware failure, network timeout, chunk upload error, API crash
  | 'DECLINED'    // User explicitly declined consent, permissions (mic/cam), practice trial, or question response
  | 'WARNING'     // Non-blocking warning, proctoring alert, or early session exit
  | 'SUSPICIOUS'  // Anti-cheat flag, window blur, tab switch
  | 'LOCKED';     // Attempted action on unreleased feature

export type ObservabilityStage =
  | 'ASSESSMENT_SELECTION'
  | 'CONSENT'
  | 'DEVICE_CHECK'
  | 'HARDWARE_MIC'
  | 'HARDWARE_SPEAKER'
  | 'HARDWARE_CAMERA'
  | 'PRACTICE'
  | 'ASSESSMENT_INIT'
  | 'ASSESSMENT_SESSION'
  | 'MEDIA_PIPELINE'
  | 'PROCTORING'
  | 'HEARTBEAT'
  | 'ASSESSMENT_COMPLETION'
  | 'API_FAILURE'
  | 'RUNTIME_ERROR'
  | 'REACT_ERROR_BOUNDARY'
  | 'UX_FRICTION'
  | 'QUESTION_ANALYTICS'
  | 'FRONTEND_APM';

export type AIAssessmentType = CoreAssessmentType;
export type AIAssessmentMode = MediaType;
export type AIAssessmentStatus = AssessmentStatus;

export const AIAssessmentTypeEnum = Object.freeze({
  INTRO: 'INTRO',
  JD_INTRO: 'JD_INTRO',
  RECRUITER: 'RECRUITER',
  TECHNICAL: 'TECHNICAL',
  HIRING_MANAGER: 'HIRING_MANAGER',
  SYSTEM_DESIGN: 'SYSTEM_DESIGN',
} as const satisfies Record<string, CoreAssessmentType>);

export enum AIWizardStep {
  CONFIGURATION = 'CONFIGURATION',
  CONSENT = 'CONSENT',
  DEVICE_CHECK = 'DEVICE_CHECK',
  PRACTICE_START = 'PRACTICE_START',
  SESSION = 'SESSION',
  REPORT = 'REPORT',
}

export enum QuestionAction {
  QUESTION_VIEWED = 'QUESTION_VIEWED',
  START_RECORDING = 'START_RECORDING',
  STOP_RECORDING = 'STOP_RECORDING',
  AUDIO_CHUNK_UPLOADED = 'AUDIO_CHUNK_UPLOADED',
  AUDIO_CHUNK_FAILED = 'AUDIO_CHUNK_FAILED',
  QUESTION_ANSWERED = 'QUESTION_ANSWERED',
  QUESTION_SKIPPED = 'QUESTION_SKIPPED',
  QUESTION_SUBMITTED = 'QUESTION_SUBMITTED',
}

export enum PracticeAction {
  PRACTICE_ENTERED = 'PRACTICE_ENTERED',
  RECORDING_STARTED = 'RECORDING_STARTED',
  RECORDING_FINISHED = 'RECORDING_FINISHED',
  PLAYBACK_STARTED = 'PLAYBACK_STARTED',
  ASSESSMENT_LAUNCHED = 'ASSESSMENT_LAUNCHED',
  PRACTICE_SKIPPED = 'PRACTICE_SKIPPED',
}

// ==========================================
// 2. PostHog Telemetry Payload Contract
// ==========================================
export interface ObservabilityEventPayload {
  stage: ObservabilityStage | string;
  event_type: string;
  status: ObservabilityStatus;
  message: string;
  client_timestamp: string;
  metadata?: Record<string, any>;
}

export interface ObservabilityPostHogPayload {
  candidate_id?: number;
  candidate_name?: string;
  candidate_email?: string;
  assessment_uuid?: string;
  assessment_id?: number;
  events: ObservabilityEventPayload[];
}

// ==========================================
// 3. UI Component Helper Payloads
// ==========================================
export interface AssessmentTypeSelectedPayload {
  assessment_type: CoreAssessmentType | string;
  assessment_mode?: MediaType | string;
  candidate_id?: number;
  source_page?: string;
  is_locked?: boolean;
  duration?: string;
  lock_badge?: string;
}

export interface PracticeTelemetryPayload {
  candidate_id?: number;
  assessment_type?: CoreAssessmentType | string;
  action: PracticeAction | string;
  mode?: string;
  practice_question_type?: string;
  video_enabled?: boolean;
  video_analytics_enabled?: boolean;
  attempt_number?: number;
  duration_seconds?: number;
  reason?: string;
}

export interface TabSwitchTelemetryPayload {
  assessment_uuid?: string;
  assessment_id?: number;
  candidate_id?: number;
  assessment_type?: CoreAssessmentType | string;
  hidden: boolean;
  violation_count?: number;
  time_away_seconds?: number;
  timestamp?: string;
}

export interface QuestionTelemetryPayload {
  assessment_id?: number;
  assessment_uuid?: string;
  candidate_id?: number;
  assessment_type?: CoreAssessmentType | string;
  question_id: number | string;
  question_number: number;
  total_questions?: number;
  action: QuestionAction | string;
  duration_seconds?: number;
  audio_duration_seconds?: number;
  chunk_index?: number;
  chunk_size_bytes?: number;
  is_final?: boolean;
  uploaded_chunks_count?: number;
  chunks_uploaded?: number;
  retry_attempt?: number;
  retry_count?: number;
  http_status?: number;
  error_message?: string;
}

// ==========================================
// 4. Device Check Types
// ==========================================
export enum DeviceCheckCategory {
  MICROPHONE = 'microphone',
  CAMERA = 'camera',
  SPEAKER = 'speaker',
  NETWORK = 'network',
  SYSTEM = 'system',
  FACE_TRACKING = 'face_tracking',
}

export enum DeviceCheckStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  DECLINED = 'declined',
  PERMISSION_DENIED = 'permission_denied',
  NOT_FOUND = 'not_found',
  POOR_QUALITY = 'poor_quality',
  WARNING = 'warning',
}

export enum DeviceFailureReason {
  PERMISSION_BLOCKED = 'PERMISSION_DENIED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  MEDIA_STREAM_ERROR = 'MEDIA_STREAM_ERROR',
  LOW_MICROPHONE_VOLUME = 'LOW_MICROPHONE_VOLUME',
  NO_AUDIO_HEARD = 'NO_AUDIO_HEARD',
  DEVICE_IN_USE = 'DEVICE_IN_USE',
  CAMERA_FRAMING_OFF = 'CAMERA_FRAMING_OFF',
  FACE_NOT_DETECTED = 'FACE_NOT_DETECTED',
  MULTIPLE_FACES_DETECTED = 'MULTIPLE_FACES_DETECTED',
  POOR_LIGHTING = 'POOR_LIGHTING',
  HIGH_LATENCY = 'HIGH_LATENCY',
  LOW_BANDWIDTH = 'LOW_BANDWIDTH',
  WEBRTC_ICE_FAILURE = 'WEBRTC_ICE_FAILURE',
}

export interface DeviceCheckTelemetryPayload {
  candidate_id?: number;
  device_category: DeviceCheckCategory;
  status: DeviceCheckStatus | ObservabilityStatus;
  device_name?: string;
  failure_reason?: DeviceFailureReason | string;
  error_message?: string;
  attempt_number?: number;
  total_attempts?: number;
  failed_attempts?: number;
  bandwidth_kbps?: number;
  latency_ms?: number;
  packet_loss_pct?: number;
  audio_level?: number;
  min_threshold?: number;
  tone_frequency_hz?: number;
  fps?: number;
  video_resolution?: string;
  face_detected?: boolean;
  browser?: string;
  os?: string;
  screen_resolution?: string;
  audio_devices_count?: number;
  video_devices_count?: number;
}

// ==========================================
// 5. Session & Completion Types
// ==========================================
export enum SessionLifecycleStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  TAB_SWITCHED_AWAY = 'tab_switched_away',
  TAB_RETURNED = 'tab_returned',
  SCREEN_RESIZED = 'screen_resized',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  TIMED_OUT = 'timed_out',
}

export interface SessionHeartbeatPayload {
  assessment_id: number;
  assessment_uuid: string;
  candidate_id?: number;
  assessment_type?: string;
  current_question_number: number;
  session_uptime_seconds: number;
  network_latency_ms?: number;
  active_tab?: boolean;
}

export interface AssessmentCompletionTelemetryPayload {
  assessment_id: number;
  assessment_uuid: string;
  candidate_id?: number;
  assessment_type?: string;
  assessment_mode?: string;
  assessment_status: 'COMPLETED' | 'ABANDONED';
  total_questions?: number;
  answered_questions?: number;
  skipped_questions?: number;
  total_duration_seconds?: number;
  total_duration_minutes?: number;
  last_active_question?: number;
  reason?: string;
  status?: SessionLifecycleStatus | ObservabilityStatus;
}
