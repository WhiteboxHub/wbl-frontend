import { apiFetch } from "@/lib/api";
import type { AssessmentDetail, AssessmentListResponse, AssessmentSummary, ReadinessCheck } from "@/types/aiprep";

const endpoint = (path: string) => `api/aiprep/${path}`;

export const aiPrepApi = {
  getReadiness: () => apiFetch(endpoint("candidate/pre-check")) as Promise<ReadinessCheck>,
  listAssessments: () => apiFetch(endpoint("candidate/assessments")) as Promise<AssessmentListResponse>,
  getAssessment: (assessmentId: string | number) =>
    apiFetch(endpoint(`candidate/assessments/${assessmentId}`)) as Promise<AssessmentDetail>,
  createAssessment: (assessmentType = "INTRO") =>
    apiFetch(endpoint("candidate/assessments"), {
      method: "POST",
      body: { assessment_type: assessmentType, media_type: "VIDEO" },
    }) as Promise<AssessmentSummary>,
};
