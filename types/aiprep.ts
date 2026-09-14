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
  is_active?: boolean;
}

export interface CreateAssessmentRequest {
  candidate_id?: number;
  assessment_type: AssessmentType;
  media_type?: MediaType;
  assessment_mode?: string;
  job_description?: string | null;
  job_description_text?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
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
