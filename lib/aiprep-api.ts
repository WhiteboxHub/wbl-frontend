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
  ReadinessCheck,
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
