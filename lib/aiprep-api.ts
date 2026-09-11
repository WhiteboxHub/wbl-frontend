/**
 * AI Prep Tool – API client
 * All AI Prep backend calls are centralised here.
 * Base prefix: /api/aiprep/
 */

import { apiFetch } from "@/lib/api";
import type {
  AssessmentDetail,
  AssessmentListResponse,
  CreateAssessmentResponse,
  LlmKeyStatus,
  ReadinessCheck,
  ResumeStatus,
} from "@/types/aiprep";

/** Build a full endpoint string for the AI Prep backend. */
const endpoint = (path: string) => `api/aiprep/${path}`;

export const aiPrepApi = {
  // -------------------------------------------------------------------------
  // Pre-flight readiness
  // -------------------------------------------------------------------------

  /**
   * GET /api/aiprep/candidate/pre-check
   * Combined readiness check — primary source of truth for LLM + resume status.
   */
  getReadiness: (): Promise<ReadinessCheck> =>
    apiFetch(endpoint("candidate/pre-check")) as Promise<ReadinessCheck>,

  /**
   * GET /api/aiprep/candidate/llm-keys
   * Dedicated LLM key status check.
   * Response shape: { status, is_configured, provider, model, voice_enabled, message, available_models }
   * `is_configured === true` ⟺ candidate has a working LLM key.
   * The backend does NOT expose a separate "expired" state; use `status: "failure"` + `is_configured: false`.
   */
  getLlmKeys: (): Promise<LlmKeyStatus> =>
    apiFetch(endpoint("candidate/llm-keys")) as Promise<LlmKeyStatus>,

  /**
   * GET /api/aiprep/candidate/resume-status
   * Dedicated resume status check.
   * Response shape: { status, has_resume, has_parsed_json, candidate_name, current_title, skills, message }
   * `has_resume === true` ⟺ candidate has a resume on file.
   */
  getResumeStatus: (): Promise<ResumeStatus> =>
    apiFetch(endpoint("candidate/resume-status")) as Promise<ResumeStatus>,

  // -------------------------------------------------------------------------
  // Assessments
  // -------------------------------------------------------------------------

  /**
   * GET /api/aiprep/candidate/assessments
   * List the authenticated candidate's own assessments.
   */
  listAssessments: (): Promise<AssessmentListResponse> =>
    apiFetch(endpoint("candidate/assessments")) as Promise<AssessmentListResponse>,

  /**
   * GET /api/aiprep/candidate/assessments/{assessment_id}
   * Fetch full assessment detail including telemetry, scores, and report.
   */
  getAssessment: (assessmentId: string | number): Promise<AssessmentDetail> =>
    apiFetch(
      endpoint(`candidate/assessments/${assessmentId}`)
    ) as Promise<AssessmentDetail>,

  /**
   * POST /api/aiprep/candidate/assessments
   * Create a new assessment session.
   * Returns the new assessment with its real `id`.
   */
  createAssessment: (
    assessmentType: string = "INTRO",
    mediaType: string = "VIDEO",
    jobDescription?: string
  ): Promise<CreateAssessmentResponse> =>
    apiFetch(endpoint("candidate/assessments"), {
      method: "POST",
      body: {
        assessment_type: assessmentType,
        media_type: mediaType,
        job_description: jobDescription ?? null,
      },
    }) as Promise<CreateAssessmentResponse>,
};
