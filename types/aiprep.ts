/**
 * Master TypeScript Contracts for AIPrep
 * Compliant with: AIPrep_Contracts_signature.pdf & contracts/api_endpoints.md
 */

// ============================================================================
// Core Enums & Literal Types
// ============================================================================

export type AssessmentType =
  | 'INTRO'
  | 'JD_INTRO'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'TECHNICAL'
  | 'SYSTEM_DESIGN';

export type AssessmentStatus =
  | 'IN_PROGRESS'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'FAILED';

export type MediaType = 'VIDEO' | 'AUDIO' | 'VIDEO_AUDIO' | 'AUDIO_ONLY' | string;

export type AssessmentMode = MediaType;

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export type CoachingBand = 'EXCELLENT' | 'STRONG' | 'DEVELOPING' | 'NEEDS_WORK';

export const NO_PAUSE_ASSESSMENT_TYPES: ReadonlyArray<AssessmentType> = [
  'INTRO',
  'JD_INTRO',
];

// ============================================================================
// Question Bank Interfaces (Used across FE1, FE2, FE4)
// ============================================================================

export interface QuestionBankItem {
  id: number;
  category: AssessmentType | string;
  sub_category?: string | null;
  difficulty_level?: QuestionDifficulty | string | null;
  question_text: string;
  ideal_answer_rubric?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface QuestionBankResponse extends QuestionBankItem {}

export interface QuestionListResponse {
  items: QuestionBankItem[];
  total: number;
}

// ============================================================================
// Telemetry & Assessment Data (POST /api/aiprep/assessments/{id}/data)
// ============================================================================

export interface QuestionTelemetryItem {
  question_id: number;
  question_text: string;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
}

export interface TranscriptTelemetry {
  full_text: string;
  segments?: TranscriptSegment[];
}

export interface AudioTelemetry {
  words_per_minute?: number;
  speaking_pace_wpm?: number;
  silence_ratio_pct?: number;
  filler_rate_per_min?: number;
  avg_volume_db?: number;
  mean_pitch_hz?: number;
  pause_count?: number;
  background_noise_level?: string;
  speaking_duration_seconds?: number;
}

export interface VideoTelemetry {
  is_video_mode?: boolean;
  face_visible_pct?: number;
  face_visibility_pct?: number;
  head_nods_count?: number;
  eye_contact_pct?: number;
  screen_attention_pct?: number;
  distraction_level_pct?: number;
  facial_engagement_pct?: number;
  acknowledgement_count?: number;
  expression_variety_pct?: number;
  posture_score?: number;
  visual_engagement_pct?: number;
  frame_stability_score?: number;
  sitting_position?: string;
  gaze_direction?: string;
}

export interface AssessmentDataPayload {
  questions: QuestionTelemetryItem[];
  transcript: TranscriptTelemetry;
  audio_telemetry: AudioTelemetry;
  video_telemetry: VideoTelemetry;
}

export interface SubmitTelemetryPayload extends AssessmentDataPayload {}

// ============================================================================
// Evaluation & Reports Interfaces (FE3)
// ============================================================================

export interface AudioEvaluation {
  coherence?: string;
  clarity?: string;
  fluency?: string;
  confidence?: string;
  pace?: string;
  volume?: string;
  professionalism?: string;
}

export interface VideoEvaluation {
  eye_contact?: string;
  facial_engagement?: string;
  posture?: string;
  expression_variety?: string;
  distraction?: string;
}

export interface ScoresBreakdown {
  ai_engineering?: { score: number };
  core_engineering?: { score: number };
  non_technical?: { score: number };
  business_acumen?: { score: number };
  [key: string]: { score: number } | undefined;
}

export interface TechnicalAnalysis {
  summary?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
}

export interface CoachingSuggestionItem {
  priority: number;
  dimension?: string;
  area?: string;
  suggestion: string;
}

export interface TranscriptEvidenceItem {
  quote: string;
  timestamp_s?: number;
}

export interface TranscriptEvaluation {
  scores_breakdown?: ScoresBreakdown;
  technical_analysis?: TechnicalAnalysis;
  coaching_suggestions?: CoachingSuggestionItem[];
  transcript_evidence?: TranscriptEvidenceItem[];
}

export interface MasterReportSchema {
  overall_score?: number;
  coaching_band?: CoachingBand;
  audio_evaluation?: AudioEvaluation;
  video_evaluation?: VideoEvaluation;
  transcript_evaluation?: TranscriptEvaluation;
}

export interface AssessmentDetailResponse {
  id: number;
  candidate_id: number;
  assessment_type: AssessmentType;
  media_type: MediaType;
  assessment_mode?: string;
  status: AssessmentStatus;
  youtube_url?: string | null;
  data?: AssessmentDataPayload;
  report?: MasterReportSchema;
  created_at?: string;
}

export interface AssessmentDetails extends AssessmentDetailResponse {}

// ============================================================================
// Assessment Creation & Card Metadata (FE1)
// ============================================================================

export interface CreateAssessmentRequest {
  candidate_id: number;
  assessment_type: AssessmentType;
  media_type: MediaType;
  assessment_mode?: string;
  job_description?: string | null;
  job_description_text?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface CreateAssessmentResponse {
  id: number;
  status: AssessmentStatus;
  started_at: string;
}

export interface AssessmentCardMeta {
  type: AssessmentType;
  title: string;
  description: string;
  timeLimit: string;
  questionCount: string;
  pauseAllowed: boolean;
  requiresJd: boolean;
}

// ============================================================================
// FE2 Recording & Upload Queue Types
// ============================================================================

export type ChunkStatus = 'queued' | 'uploading' | 'uploaded' | 'failed';

export interface ChunkUploadItem {
  chunkNumber: number;
  blob: Blob;
  status: ChunkStatus;
  retryCount: number;
  error?: string;
}

export interface ChunkUploadQueueState {
  totalChunks: number;
  uploadedChunks: number;
  pendingChunks: number;
  failedChunks: number;
  isUploading: boolean;
}

export interface ProcessingStatusResponse {
  step: string;
  progress: number;
  status: AssessmentStatus | string;
  steps?: Record<string, number>;
  error?: string;
}
