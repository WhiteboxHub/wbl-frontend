export type AssessmentStatus = "IN_PROGRESS" | "EVALUATING" | "COMPLETED" | "FAILED" | string;

export interface AssessmentSummary {
  id: number;
  assessment_uuid?: string | null;
  assessment_type: string;
  media_type: string;
  status: AssessmentStatus;
  started_at?: string | null;
  created_at?: string | null;
}

export interface AssessmentDetail extends AssessmentSummary {
  candidate_id: number;
  completed_at?: string | null;
  job_description?: string | null;
  youtube_url?: string | null;
  data?: Record<string, unknown> | null;
  report?: Record<string, unknown> | null;
}

export interface ReadinessCheck {
  eligible: boolean;
  candidate_id: number;
  message?: string | null;
  llm_check: { is_configured: boolean; message?: string | null };
  resume_check: { has_resume: boolean; has_parsed_json: boolean; message?: string | null };
}

export interface AssessmentListResponse {
  items: AssessmentSummary[];
  total: number;
}
