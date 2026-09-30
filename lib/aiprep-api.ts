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
  CandidateSubmitAssessmentRequest,
  CandidateSubmitAssessmentResponse,
} from "@/types/aiprep";

export * from "@/types/aiprep";

const endpoint = (path: string) => `api/aiprep/${path.replace(/^\//, "")}`;

export const getStoredCandidateId = (fallback: string | number = ""): string | number => {
  if (typeof window === "undefined") return fallback;
  try {
    // 1. Prioritize authenticated user profile object
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed?.candidate_id || parsed?.id) return String(parsed.candidate_id || parsed.id);
      } catch {}
    }

    // 2. Fallback to JWT access token payload
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token");
    if (token && token.includes(".")) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.candidate_id || payload?.id) return String(payload.candidate_id || payload.id);
      } catch {}
    }

    // 3. Fallback to direct candidate ID storage keys
    const directCandidateId =
      localStorage.getItem("candidate_id") ||
      sessionStorage.getItem("aiprep_candidate_id") ||
      sessionStorage.getItem("candidate_id");
    if (directCandidateId) return String(directCandidateId);
  } catch {}
  return fallback;
};

export const resolveCandidateId = (candidateId?: string | number): string => {
  return String(candidateId || getStoredCandidateId() || "").trim();
};

export const aiPrepApi = {
  // Pre-flight readiness (New: /api/aiprep/candidates/{id}/assessment-readiness-precheck)
  getReadiness: (candidateId?: string | number): Promise<ReadinessCheck> => {
    const cid = resolveCandidateId(candidateId);
    if (!cid) {
      return Promise.resolve({
        eligible: false,
        allowed_to_proceed: false,
        action_required: "login",
        message: "Authentication required. Please sign in to verify assessment readiness.",
      });
    }
    return apiFetch(endpoint(`candidates/${cid}/assessment-readiness-precheck`)) as Promise<ReadinessCheck>;
  },
  checkReadiness: (candidateId?: string | number): Promise<ReadinessCheck> => {
    const cid = resolveCandidateId(candidateId);
    if (!cid) {
      return Promise.resolve({
        eligible: false,
        allowed_to_proceed: false,
        action_required: "login",
        message: "Authentication required. Please sign in to verify assessment readiness.",
      });
    }
    return apiFetch(endpoint(`candidates/${cid}/assessment-readiness-precheck`)) as Promise<ReadinessCheck>;
  },

  getLlmKeys: (): Promise<LlmKeyStatus> =>
    apiFetch(endpoint("candidate/llm-keys")) as Promise<LlmKeyStatus>,

  getResumeStatus: (): Promise<ResumeStatus> =>
    apiFetch(endpoint("candidate/resume-status")) as Promise<ResumeStatus>,

  // List candidate assessments (New: /api/aiprep/candidates/{id}/assessments)
  listAssessments: (limit = 20, offset = 0, candidateId?: string | number): Promise<AssessmentListResponse> => {
    const cid = resolveCandidateId(candidateId);
    if (!cid) {
      return Promise.resolve({
        items: [],
        total: 0,
        page: 1,
        page_size: limit,
      });
    }
    return apiFetch(endpoint(`candidates/${cid}/assessments?limit=${limit}&offset=${offset}`)) as Promise<AssessmentListResponse>;
  },

  // Get single assessment details (New: /api/aiprep/candidates/{id}/assessments/{assessment_id})
  getAssessment: async (assessmentId: string | number, candidateId?: string | number): Promise<AssessmentDetail> => {
    const cid = resolveCandidateId(candidateId);
    if (!cid) {
      throw new Error("Candidate ID is required to retrieve assessment details.");
    }
    const res: any = await apiFetch(endpoint(`candidates/${cid}/assessments/${assessmentId}`));
    if (res?.data?.assessment) {
      const rawReport = res.data.report || {};
      const llmEval = rawReport.llm_evaluation || {};
      return {
        ...res.data.assessment,
        data: res.data.assessment_data || {},
        report: {
          ...llmEval,
          insufficient_content: rawReport.insufficient_content ?? false,
          message: rawReport.message ?? null,
        },
        questions: res.data.questions || [],
      } as AssessmentDetail;
    }
    return (res?.data || res) as AssessmentDetail;
  },

  // Get submitted telemetry/transcript data for an assessment
  getAssessmentData: async (assessmentId: string | number, candidateId?: string | number): Promise<AssessmentDataResponse> => {
    const cid = resolveCandidateId(candidateId);
    if (!cid) {
      throw new Error("Candidate ID is required to retrieve assessment data.");
    }
    const res: any = await apiFetch(endpoint(`candidates/${cid}/assessments/${assessmentId}`));
    if (res?.data?.assessment_data) {
      return {
        ...res.data.assessment_data,
        audio_telemetry: res.data.assessment_data?.audio_telemetry || res.data.audio_telemetry,
        video_telemetry: res.data.assessment_data?.video_telemetry || res.data.video_telemetry,
      } as AssessmentDataResponse;
    }
    return (res?.data || res) as AssessmentDataResponse;
  },

  // Get LLM-generated evaluation report for an assessment
  getAssessmentReport: async (assessmentId: string | number, candidateId?: string | number): Promise<AssessmentReportResponse> => {
    const cid = resolveCandidateId(candidateId);
    if (!cid) {
      throw new Error("Candidate ID is required to retrieve assessment report.");
    }
    const res: any = await apiFetch(endpoint(`candidates/${cid}/assessments/${assessmentId}`));
    if (res?.data?.report) {
      const llmEval = res.data.report.llm_evaluation || {};
      return {
        ...llmEval,
        insufficient_content: res.data.report.insufficient_content ?? false,
        message: res.data.report.message ?? null,
      } as unknown as AssessmentReportResponse;
    }
    return (res?.data || res) as AssessmentReportResponse;
  },

  // Create / Start assessment (New: /api/aiprep/candidates/{id}/assessments)
  createAssessment: async (
    payload: string | CreateAssessmentRequest = "INTRO",
    mediaTypeArg: string = "VIDEO",
    jobDescriptionArg?: string
  ): Promise<CreateAssessmentResponse & AssessmentSummary> => {
    let cid: string;
    let body: Record<string, unknown>;

    if (typeof payload === "string") {
      cid = resolveCandidateId();
      if (!cid) throw new Error("Candidate ID is required to create an assessment session.");
      body = {
        candidate_id: Number(cid),
        assessment_type: payload,
        media_type: mediaTypeArg,
        job_description: jobDescriptionArg ?? null,
      };
    } else {
      cid = resolveCandidateId(payload.candidate_id);
      if (!cid) throw new Error("Candidate ID is required to create an assessment session.");
      const isAudioOnly =
        payload.media_type === "AUDIO" ||
        payload.assessment_mode === "AUDIO_ONLY" ||
        (typeof payload.media_type === "string" && payload.media_type.toUpperCase() === "AUDIO");

      body = {
        candidate_id: Number(cid),
        assessment_type: payload.assessment_type || "INTRO",
        media_type: isAudioOnly ? "AUDIO" : "VIDEO",
      };

      const jobDescription = payload.job_description || payload.job_description_text;
      if (jobDescription) {
        body.job_description = jobDescription;
      }

      if (payload.consent_save_recording !== undefined) {
        body.consent_save_recording = payload.consent_save_recording;
      }
      if (payload.consent_save_transcript !== undefined) {
        body.consent_save_transcript = payload.consent_save_transcript;
      }
    }

    const res: any = await apiFetch(endpoint(`candidates/${cid}/assessments`), {
      method: "POST",
      body,
    });

    const resolvedId = res?.data?.assessment_id ?? res?.id ?? res?.assessment_id;
    return {
      ...res,
      id: resolvedId,
      assessment_id: resolvedId,
      assessment_uuid: res?.data?.assessment_uuid ?? res?.assessment_uuid,
      status: res?.data?.status ?? res?.status ?? "IN_PROGRESS",
      started_at: res?.data?.started_at ?? res?.started_at,
      questions: res?.data?.questions ?? res?.questions,
      ...(res?.data || {}),
    } as CreateAssessmentResponse & AssessmentSummary;
  },

  // Update assessment status
  updateAssessmentStatus: async (
    assessmentId: number | string,
    status: AssessmentStatus
  ): Promise<{ status: AssessmentStatus }> => {
    return { status };
  },

  // Upload sequential WebM chunk (New: /api/aiprep/candidates/{id}/assessments/{assessment_id}/media/chunk)
  uploadChunk: async (
    assessmentId: number | string,
    chunkIndex: number,
    blob: Blob,
    mediaTypeOrFinal: string | boolean = "VIDEO",
    isFinalArg: boolean = false,
    candidateId?: number | string
  ): Promise<{ success: boolean; chunk_index: number }> => {
    const isFinal = typeof mediaTypeOrFinal === "boolean" ? mediaTypeOrFinal : !!isFinalArg;
    const cid = resolveCandidateId(candidateId);
    if (!cid) {
      throw new Error("Candidate ID is required to upload media chunks.");
    }
    const formData = new FormData();
    formData.append("chunk_index", String(chunkIndex));
    formData.append("is_final", String(isFinal));
    const filename = `chunk_${chunkIndex}.webm`;
    formData.append("media_file", blob, filename);

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
      ? `${baseUrl}/aiprep/candidates/${cid}/assessments/${assessmentId}/media/chunk`
      : `/api/aiprep/candidates/${cid}/assessments/${assessmentId}/media/chunk`;

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

  // Submit assessment via PUT (New: /api/aiprep/candidates/{id}/assessments/{assessment_id})
  submitAssessment: (
    assessmentId: string | number,
    payload: CandidateSubmitAssessmentRequest = {},
    candidateId?: string | number
  ): Promise<CandidateSubmitAssessmentResponse> => {
    const cid = resolveCandidateId(candidateId);
    if (!cid) {
      throw new Error("Candidate ID is required to submit assessment.");
    }
    return apiFetch(endpoint(`candidates/${cid}/assessments/${assessmentId}`), {
      method: "PUT",
      body: payload,
    }) as Promise<CandidateSubmitAssessmentResponse>;
  },

  // Cancel assessment via PUT (New: /api/aiprep/candidates/{id}/assessments/{assessment_id}?status=cancelled)
  cancelAssessment: (
    assessmentId: string | number,
    candidateId?: string | number
  ): Promise<{ status: string }> => {
    const cid = resolveCandidateId(candidateId);
    if (!cid) {
      throw new Error("Candidate ID is required to cancel assessment.");
    }
    return apiFetch(endpoint(`candidates/${cid}/assessments/${assessmentId}?status=cancelled`), {
      method: "PUT",
    }) as Promise<{ status: string }>;
  },

  // Fetch category questions from Question Bank
  getQuestions: (category?: string): Promise<{ items: QuestionBankItem[]; total: number }> => {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return apiFetch(endpoint(`questions${query}`)) as Promise<{ items: QuestionBankItem[]; total: number }>;
  },

  // Submit candidate telemetry & transcript data (backward compatibility wrapper)
  submitTelemetryData: (assessmentId: string | number, payload: any, candidateId?: string | number): Promise<any> =>
    aiPrepApi.submitAssessment(assessmentId, {
      video_telemetry: payload?.video_telemetry,
      is_final: true,
    }, candidateId),

  // Trigger evaluation orchestrator
  triggerEvaluation: (assessmentId: string | number, wait: boolean = false): Promise<any> =>
    apiFetch(endpoint(`candidate/assessments/${assessmentId}/evaluate${wait ? '?wait=true' : ''}`), {
      method: "POST",
    }),

  // Assemble media chunks
  assembleMedia: (assessmentId: string | number, candidateId?: string | number): Promise<any> =>
    aiPrepApi.submitAssessment(assessmentId, { is_final: true }, candidateId),
};

export const aiprepApi = aiPrepApi;
export default aiPrepApi;
