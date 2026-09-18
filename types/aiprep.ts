/**
 * AI Prep Tool – Frontend Types
 * Mirrors the Pydantic schemas in fapi/ai_prep/schemas.py
 */

export type AssessmentType =
  | 'INTRO'
  | 'JD_INTRO'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'TECHNICAL'
  | 'SYSTEM_DESIGN'
  | string;

export const NO_PAUSE_ASSESSMENT_TYPES: ReadonlyArray<AssessmentType> = [
  'INTRO',
  'JD_INTRO',
];

export type MediaType = 'VIDEO' | 'AUDIO' | 'VIDEO_AUDIO' | 'AUDIO_ONLY' | string;

export type AssessmentMode = MediaType;

export type ChunkStatus = 'queued' | 'uploading' | 'uploaded' | 'failed';

export interface AssessmentCardMeta {
  type: AssessmentType;
  title: string;
  description: string;
  timeLimit: string;
  questionCount: string;
  pauseAllowed: boolean;
  requiresJd: boolean;
}

export interface AssessmentQuestion {
  id?: number;
  question_id?: number;
  question_text: string;
  category?: string;
  sub_category?: string | null;
  difficulty_level?: string;
  is_active?: boolean | number;
}

export interface CreateAssessmentRequest {
  candidate_id?: number;
  assessment_type: AssessmentType;
  media_type?: MediaType;
  assessment_mode?: string;
  job_description?: string | null;
  job_description_text?: string | null;
}

export type AssessmentStatus =
  | "IN_PROGRESS"
  | "EVALUATING"
  | "COMPLETED"
  | "FAILED"
  | string;

export type AssessmentCategory =
  | "INTRO"
  | "JD_INTRO"
  | "RECRUITER"
  | "HIRING_MANAGER"
  | "SYSTEM_DESIGN"
  | "TECHNICAL"
  | string;

// ---------------------------------------------------------------------------
// Pre-flight readiness – LLMKeyStatusResponse
// ---------------------------------------------------------------------------

export type LlmKeyStatus = {
  status: "valid" | "failure";
  is_configured: boolean;
  provider: string | null;
  model: string | null;
  voice_enabled?: boolean;
  message?: string | null;
  available_models?: string[];
};

// ---------------------------------------------------------------------------
// Pre-flight readiness – ResumeStatusResponse
// ---------------------------------------------------------------------------

export type ResumeStatus = {
  status: "valid" | "failure";
  has_resume: boolean;
  has_parsed_json?: boolean;
  candidate_name?: string | null;
  current_title?: string | null;
  skills?: string[];
  message?: string | null;
};

// ---------------------------------------------------------------------------
// Pre-flight readiness – PreAssessmentCheckResponse
// ---------------------------------------------------------------------------

export interface ReadinessCheck {
  eligible: boolean;
  candidate_id?: number;
  llm_check?: LlmKeyStatus;
  resume_check?: ResumeStatus;
  message?: string | null;
}

// ---------------------------------------------------------------------------
// Assessment list item – AssessmentListItem
// ---------------------------------------------------------------------------

export interface AssessmentSummary {
  id: number;
  assessment_uuid?: string | null;
  candidate_id?: number | null;
  assessment_type: string;
  media_type: string;
  status: AssessmentStatus;
  youtube_url?: string | null;
  started_at?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  job_description?: string | null;
}

// ---------------------------------------------------------------------------
// Assessment detail – AssessmentDetailResponse
// ---------------------------------------------------------------------------

export interface AssessmentDetail extends AssessmentSummary {
  candidate_id?: number | null;
  job_description?: string | null;
  youtube_url?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  completed_at?: string | null;
  data?: Record<string, unknown> | null;
  report?: Record<string, unknown> | null;
  questions?: AssessmentQuestion[];
}

// ---------------------------------------------------------------------------
// Create assessment response – CreateAssessmentResponse
// ---------------------------------------------------------------------------

export interface CreateAssessmentResponse {
  id: number;
  assessment_uuid?: string;
  status: AssessmentStatus;
  started_at?: string | null;
  assessment_type?: string;
  media_type?: string;
  job_description?: string | null;
  questions?: AssessmentQuestion[] | unknown[];
}

// ---------------------------------------------------------------------------
// Assessment list response – AssessmentListResponse
// ---------------------------------------------------------------------------

export interface AssessmentListResponse {
  items: AssessmentSummary[];
  total?: number;
  count?: number;
}

// ---------------------------------------------------------------------------
// Assessment submitted data – AssessmentDataResponse
// Mirrors fapi/ai_prep/schemas.py :: AssessmentDataResponse
// ---------------------------------------------------------------------------

export interface AssessmentDataResponse {
  id?: number | null;
  assessment_id: number;
  questions?: Record<string, unknown>[] | null;
  /** transcript shape: { full_text?: string, text?: string, segments?: TranscriptSegment[] } */
  transcript?: Record<string, unknown> | null;
  audio_telemetry?: Record<string, unknown> | null;
  video_telemetry?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// ---------------------------------------------------------------------------
// Assessment evaluation report – AssessmentReportResponse
// Mirrors fapi/ai_prep/schemas.py :: AssessmentReportResponse
// The three JSON columns come from ai_prep_assessment_report table:
//   audio_evaluation  → audio LLM output (summary, factors{pace,volume,...}, key_findings, recording_environment_context)
//   video_evaluation  → video LLM output (summary, factors{camera_framing,...}, key_findings)
//   transcript_evaluation → transcript LLM output which itself contains:
//     scores_breakdown_json, intro_evaluation, technical_analysis_json,
//     non_technical_analysis_json, coaching_suggestions_json,
//     transcript_evidence_json, gaps_to_validate_json, improvements_json,
//     resume_alignment, signal_timeline_json
// report_data is a virtual property derived from the above three columns
// ---------------------------------------------------------------------------

export interface AssessmentReportResponse {
  id?: number | null;
  assessment_id: number;
  audio_evaluation?: Record<string, unknown> | null;
  video_evaluation?: Record<string, unknown> | null;
  transcript_evaluation?: Record<string, unknown> | null;
  overall_score?: number | null;
  report_data?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HardwareCheckResults {
  browser_info: string;
  os_info: string;
  camera_permission: boolean;
  mic_permission: boolean;
  speaker_ok: boolean;
  bandwidth_kbps: number;
  analytics_consent: boolean;
  assessment_type: string;
  audio_enabled: boolean;
  video_enabled: boolean;
  jd_text: string;
}

// ============================================================================
// Question Bank Types
// ============================================================================

export type QuestionCategory =
  | 'INTRO'
  | 'JD_INTRO'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'SYSTEM_DESIGN'
  | 'TECHNICAL'
  | string;

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface QuestionBankItem {
  id: number;
  category: QuestionCategory;
  sub_category?: string | null;
  difficulty_level: QuestionDifficulty;
  question_text: string;
  is_active: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QuestionFiltersState {
  search: string;
  category: string;
  sub_category: string;
  difficulty: string;
  status: 'all' | 'active' | 'inactive';
}

export interface QuestionListResponse {
  items: QuestionBankItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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


