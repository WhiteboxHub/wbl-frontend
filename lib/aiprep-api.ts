import { apiFetch } from "@/lib/api";
import type {
  AssessmentDetail,
  AssessmentListResponse,
  AssessmentSummary,
  ReadinessCheck,
  CreateAssessmentRequest,
  CreateAssessmentResponse,
  AssessmentStatus,
} from "@/types/aiprep";

export * from "@/types/aiprep";

const endpoint = (path: string) => `api/aiprep/${path.replace(/^\//, "")}`;

export const aiPrepApi = {
  // Pre-check readiness
  getReadiness: () =>
    apiFetch(endpoint("candidate/pre-check")) as Promise<ReadinessCheck>,

  // List candidate assessments
  listAssessments: (limit = 20, offset = 0) =>
    apiFetch(endpoint(`candidate/assessments?limit=${limit}&offset=${offset}`)) as Promise<AssessmentListResponse>,

  // 1. Get single assessment details
  getAssessment: (assessmentId: string | number) =>
    apiFetch(endpoint(`candidate/assessments/${assessmentId}`)) as Promise<AssessmentDetail>,

  // 2. Create / Start assessment
  createAssessment: (payload: string | CreateAssessmentRequest = "INTRO") => {
    if (typeof payload === "string") {
      return apiFetch(endpoint("candidate/assessments"), {
        method: "POST",
        body: {
          assessment_type: payload,
          media_type: "VIDEO",
        },
      }) as Promise<CreateAssessmentResponse & AssessmentSummary>;
    }

    const isAudioOnly =
      payload.media_type === "AUDIO" ||
      payload.assessment_mode === "AUDIO_ONLY" ||
      (typeof payload.media_type === "string" && payload.media_type.toUpperCase() === "AUDIO");

    const body: Record<string, unknown> = {
      assessment_type: payload.assessment_type || "INTRO",
      media_type: isAudioOnly ? "AUDIO" : "VIDEO",
    };

    if (payload.candidate_id !== undefined) {
      body.candidate_id = payload.candidate_id;
    }

    const jobDescription = payload.job_description || payload.job_description_text;
    if (jobDescription) {
      body.job_description = jobDescription;
    }

    if (payload.user_agent) {
      body.user_agent = payload.user_agent;
    }

    if (payload.ip_address) {
      body.ip_address = payload.ip_address;
    }

    return apiFetch(endpoint("candidate/assessments"), {
      method: "POST",
      body,
    }) as Promise<CreateAssessmentResponse & AssessmentSummary>;
  },

  // 3. Update assessment status
  updateAssessmentStatus: async (
    assessmentId: number | string,
    status: AssessmentStatus
  ): Promise<{ status: AssessmentStatus }> => {
    return { status };
  },
};

export const aiprepApi = aiPrepApi;
export default aiPrepApi;
