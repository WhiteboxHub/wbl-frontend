import { apiFetch } from "@/lib/api";
import type {
  AssessmentDetail,
  AssessmentListResponse,
  AssessmentSummary,
  ReadinessCheck,
  CreateAssessmentRequest,
  CreateAssessmentResponse,
  AssessmentStatus,
  LlmKeyStatus,
  ResumeStatus,
} from "@/types/aiprep";

export * from "@/types/aiprep";

const endpoint = (path: string) => `api/aiprep/${path.replace(/^\//, "")}`;

export const aiPrepApi = {
  // Pre-flight readiness
  getReadiness: (): Promise<ReadinessCheck> =>
    apiFetch(endpoint("candidate/pre-check")) as Promise<ReadinessCheck>,

  getLlmKeys: (): Promise<LlmKeyStatus> =>
    apiFetch(endpoint("candidate/llm-keys")) as Promise<LlmKeyStatus>,

  getResumeStatus: (): Promise<ResumeStatus> =>
    apiFetch(endpoint("candidate/resume-status")) as Promise<ResumeStatus>,

  // List candidate assessments
  listAssessments: (limit = 20, offset = 0): Promise<AssessmentListResponse> =>
    apiFetch(endpoint(`candidate/assessments?limit=${limit}&offset=${offset}`)) as Promise<AssessmentListResponse>,

  // Get single assessment details
  getAssessment: (assessmentId: string | number): Promise<AssessmentDetail> =>
    apiFetch(endpoint(`candidate/assessments/${assessmentId}`)) as Promise<AssessmentDetail>,

  // Create / Start assessment
  createAssessment: (
    payload: string | CreateAssessmentRequest = "INTRO",
    mediaTypeArg: string = "VIDEO",
    jobDescriptionArg?: string
  ): Promise<CreateAssessmentResponse & AssessmentSummary> => {
    if (typeof payload === "string") {
      return apiFetch(endpoint("candidate/assessments"), {
        method: "POST",
        body: {
          assessment_type: payload,
          media_type: mediaTypeArg,
          job_description: jobDescriptionArg ?? null,
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

  // Update assessment status
  updateAssessmentStatus: async (
    assessmentId: number | string,
    status: AssessmentStatus
  ): Promise<{ status: AssessmentStatus }> => {
    return { status };
  },
};

export const aiprepApi = aiPrepApi;
export default aiPrepApi;
