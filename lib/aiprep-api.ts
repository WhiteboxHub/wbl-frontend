import { apiFetch } from "@/lib/api";
import type {
  AssessmentDetail,
  AssessmentListResponse,
  AssessmentSummary,
  ReadinessCheck,
  CreateAssessmentRequest,
  AssessmentStatus,
} from "@/types/aiprep";

export * from "@/types/aiprep";

const endpoint = (path: string) => `api/aiprep/${path}`;

export const aiPrepApi = {
  getReadiness: () => apiFetch(endpoint("candidate/pre-check")) as Promise<ReadinessCheck>,
  listAssessments: (limit = 20, offset = 0) =>
    apiFetch(endpoint(`candidate/assessments?limit=${limit}&offset=${offset}`)) as Promise<AssessmentListResponse>,
  getAssessment: (assessmentId: string | number) =>
    apiFetch(endpoint(`candidate/assessments/${assessmentId}`)) as Promise<AssessmentDetail>,
  createAssessment: (payloadOrType: string | CreateAssessmentRequest = "INTRO") => {
    if (typeof payloadOrType === "string") {
      return apiFetch(endpoint("candidate/assessments"), {
        method: "POST",
        body: { assessment_type: payloadOrType, media_type: "VIDEO" },
      }) as Promise<AssessmentSummary>;
    }
    const isAudioOnly =
      payloadOrType.media_type === "AUDIO" ||
      payloadOrType.assessment_mode === "AUDIO_ONLY" ||
      (typeof payloadOrType.media_type === "string" && payloadOrType.media_type.toUpperCase() === "AUDIO");

    return apiFetch(endpoint("candidate/assessments"), {
      method: "POST",
      body: {
        candidate_id: payloadOrType.candidate_id,
        assessment_type: payloadOrType.assessment_type || "INTRO",
        media_type: isAudioOnly ? "AUDIO" : "VIDEO",
        job_description: payloadOrType.job_description || payloadOrType.job_description_text || null,
      },
    }) as Promise<AssessmentSummary>;
  },
  updateAssessmentStatus: async (
    assessmentId: number,
    status: AssessmentStatus
  ): Promise<{ status: AssessmentStatus }> => {
    return { status };
  },
};

export const aiprepApi = aiPrepApi;
export default aiPrepApi;
