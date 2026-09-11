/**
 * AI Prep Tool – Frontend Types
 * Mirrors the Pydantic schemas in fapi/ai_prep/schemas.py
 */

// ---------------------------------------------------------------------------
// Enums (string literals matching backend AssessmentStatusEnum)
// ---------------------------------------------------------------------------

export type AssessmentStatus =
  | "IN_PROGRESS"
  | "EVALUATING"
  | "COMPLETED"
  | "FAILED"
  | string; // permissive fallback for future backend values

export type AssessmentCategory =
  | "INTRO"
  | "JD_INTRO"
  | "RECRUITER"
  | "HIRING_MANAGER"
  | "SYSTEM_DESIGN"
  | "TECHNICAL"
  | string;

export type MediaType = "VIDEO" | "AUDIO" | string;

// ---------------------------------------------------------------------------
// Pre-flight readiness – LLMKeyStatusResponse
// ---------------------------------------------------------------------------

export type LlmKeyStatus = {
  /** "valid" when an active LLM key exists; "failure" otherwise */
  status: "valid" | "failure";
  /** Primary flag: true iff candidate has a working LLM key */
  is_configured: boolean;
  provider: string | null;
  model: string | null;
  voice_enabled: boolean;
  message: string | null;
  available_models: string[];
};

// ---------------------------------------------------------------------------
// Pre-flight readiness – ResumeStatusResponse
// ---------------------------------------------------------------------------

export type ResumeStatus = {
  /** "valid" when candidate has an uploaded/parsed resume; "failure" otherwise */
  status: "valid" | "failure";
  /** Primary flag: true iff candidate has a resume on file */
  has_resume: boolean;
  has_parsed_json: boolean;
  candidate_name: string | null;
  current_title: string | null;
  skills: string[];
  message: string | null;
};

// ---------------------------------------------------------------------------
// Pre-flight readiness – PreAssessmentCheckResponse
// ---------------------------------------------------------------------------

export interface ReadinessCheck {
  /** True if candidate meets ALL prerequisites to start an assessment */
  eligible: boolean;
  candidate_id: number;
  llm_check: LlmKeyStatus;
  resume_check: ResumeStatus;
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
}

// ---------------------------------------------------------------------------
// Assessment detail – AssessmentDetailResponse
// ---------------------------------------------------------------------------

export interface AssessmentDetail extends AssessmentSummary {
  candidate_id: number;
  job_description?: string | null;
  completed_at?: string | null;
  data?: Record<string, unknown> | null;
  report?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Create assessment response – CreateAssessmentResponse
// ---------------------------------------------------------------------------

export type CreateAssessmentResponse = {
  id: number;
  assessment_uuid: string;
  status: AssessmentStatus;
  started_at: string | null;
  assessment_type: string;
  media_type: string;
  questions: unknown[];
};

// ---------------------------------------------------------------------------
// Assessment list response – AssessmentListResponse
// ---------------------------------------------------------------------------

export interface AssessmentListResponse {
  items: AssessmentSummary[];
  total: number;
}
