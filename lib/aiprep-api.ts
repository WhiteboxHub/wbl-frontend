import { apiFetch } from "@/lib/api";
import type {
  AssessmentDetail,
  AssessmentListResponse,
  AssessmentSummary,
  ReadinessCheck,
  CreateAssessmentRequest,
  CreateAssessmentResponse,
  AssessmentStatus,
  AssessmentDataResponse,
  AssessmentReportResponse,
  LlmKeyStatus,
  ResumeStatus,
  QuestionBankItem,
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

  // Get submitted telemetry/transcript data for an assessment
  getAssessmentData: (assessmentId: string | number): Promise<AssessmentDataResponse> =>
    apiFetch(endpoint(`candidate/assessments/${assessmentId}/data`)) as Promise<AssessmentDataResponse>,

  // Get LLM-generated evaluation report for an assessment
  getAssessmentReport: (assessmentId: string | number): Promise<AssessmentReportResponse> =>
    apiFetch(endpoint(`candidate/assessments/${assessmentId}/report`)) as Promise<AssessmentReportResponse>,

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

  // Upload 30s sequential WebM chunk
  uploadChunk: async (
    assessmentId: number | string,
    chunkIndex: number,
    blob: Blob,
    mediaType: string = "VIDEO",
    _isFinal: boolean = false
  ): Promise<{ success: boolean; chunk_index: number }> => {
    const formData = new FormData();
    formData.append("assessment_id", String(assessmentId));
    formData.append("chunk_number", String(chunkIndex));
    const filename = `${mediaType.toLowerCase()}_chunk_${chunkIndex}.webm`;
    formData.append("file", blob, filename);

    const isClient = typeof window !== "undefined";
    const token =
      isClient &&
      (localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("bearer_token") ||
        null);

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const url = baseUrl
      ? `${baseUrl}/aiprep/media/upload-chunk`
      : `/api/aiprep/media/upload-chunk`;

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Upload chunk failed: ${res.statusText}`);
    }
    return res.json();
  },

  // Fetch category questions from Question Bank
  getQuestions: (category?: string): Promise<{ items: QuestionBankItem[]; total: number }> => {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return apiFetch(endpoint(`questions${query}`)) as Promise<{ items: QuestionBankItem[]; total: number }>;
  },

  // Submit candidate telemetry & transcript data
  submitTelemetryData: (assessmentId: string | number, payload: any): Promise<any> =>
    apiFetch(endpoint(`candidate/assessments/${assessmentId}/data`), {
      method: "POST",
      body: payload,
    }),

  // Trigger evaluation orchestrator
  triggerEvaluation: (assessmentId: string | number, wait: boolean = false): Promise<any> =>
    apiFetch(endpoint(`candidate/assessments/${assessmentId}/evaluate${wait ? '?wait=true' : ''}`), {
      method: "POST",
    }),

  // Assemble media chunks
  assembleMedia: (assessmentId: string | number): Promise<any> =>
    apiFetch(endpoint(`media/assemble?assessment_id=${assessmentId}`), {
      method: "POST",
    }),
};

export const aiprepApi = aiPrepApi;
export default aiPrepApi;
