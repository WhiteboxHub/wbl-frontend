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

export const getStoredCandidateId = (fallback: string | number = "me"): string | number => {
  if (typeof window === "undefined") return fallback;
  try {
    // 1. Cached candidate_id (SSO / token-less flows)
    const directCandidateId =
      localStorage.getItem("candidate_id") ||
      sessionStorage.getItem("aiprep_candidate_id") ||
      sessionStorage.getItem("candidate_id");
    if (directCandidateId) return directCandidateId;

    // 2. Authenticated user profile object (candidate_id prioritized over id)
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed?.candidate_id) return String(parsed.candidate_id);
        if (parsed?.id) return String(parsed.id);
      } catch {}
    }
  } catch {}
  return fallback;
};

let _userDashboardPromise: Promise<string | number | null> | null = null;

export const fetchAndCacheCandidateId = async (): Promise<string | number | null> => {
  if (typeof window === "undefined") return null;
  const stored = getStoredCandidateId("");
  if (stored && stored !== "me") return stored;

  if (_userDashboardPromise) return _userDashboardPromise;

  _userDashboardPromise = (async () => {
    try {
      const userResponse = await apiFetch("user_dashboard");
      const cid = userResponse?.candidate_id || userResponse?.id;
      if (cid) {
        localStorage.setItem("candidate_id", String(cid));
        sessionStorage.setItem("aiprep_candidate_id", String(cid));
        return cid;
      }
    } catch (e) {
      console.warn("[aiPrepApi] Could not fetch user_dashboard for candidate ID:", e);
    } finally {
      _userDashboardPromise = null;
    }
    return getStoredCandidateId("") || null;
  })();

  return _userDashboardPromise;
};

export const resolveCandidateId = (candidateId?: string | number, fallback: string | number = "me"): string | number => {
  if (candidateId !== undefined && candidateId !== null && candidateId !== "") {
    return candidateId;
  }
  return getStoredCandidateId(fallback);
};

let _readinessPromiseMap: Record<string, Promise<ReadinessCheck>> = {};
let _readinessCacheMap: Record<string, { data: ReadinessCheck; timestamp: number }> = {};

export const clearReadinessCache = () => {
  _readinessPromiseMap = {};
  _readinessCacheMap = {};
};

export const aiPrepApi = {
  // Pre-flight readiness (/api/aiprep/candidates/{id}/assessment-readiness-precheck)
  getReadiness: async (candidateId?: string | number): Promise<ReadinessCheck> => {
    let cid = candidateId;
    if (!cid || cid === "me") {
      cid = (await fetchAndCacheCandidateId()) || resolveCandidateId(undefined, "1");
    }
    const cacheKey = String(cid);
    const now = Date.now();
    if (_readinessCacheMap[cacheKey] && now - _readinessCacheMap[cacheKey].timestamp < 5000) {
      return _readinessCacheMap[cacheKey].data;
    }
    if (_readinessPromiseMap[cacheKey]) {
      return _readinessPromiseMap[cacheKey];
    }

    _readinessPromiseMap[cacheKey] = (async () => {
      try {
        const data = (await apiFetch(endpoint(`candidates/${cid}/assessment-readiness-precheck`))) as ReadinessCheck;
        _readinessCacheMap[cacheKey] = { data, timestamp: Date.now() };
        return data;
      } finally {
        delete _readinessPromiseMap[cacheKey];
      }
    })();

    return _readinessPromiseMap[cacheKey];
  },
  checkReadiness: async (candidateId?: string | number): Promise<ReadinessCheck> => {
    return aiPrepApi.getReadiness(candidateId);
  },

  getLlmKeys: (): Promise<LlmKeyStatus> =>
    apiFetch(endpoint("candidate/llm-keys")) as Promise<LlmKeyStatus>,

  getResumeStatus: (): Promise<ResumeStatus> =>
    apiFetch(endpoint("candidate/resume-status")) as Promise<ResumeStatus>,

  // List candidate assessments (New: /api/aiprep/candidates/{id}/assessments)
  listAssessments: (limit = 20, offset = 0, candidateId?: string | number): Promise<AssessmentListResponse> => {
    const cid = resolveCandidateId(candidateId);
    return apiFetch(endpoint(`candidates/${cid}/assessments?limit=${limit}&offset=${offset}`)) as Promise<AssessmentListResponse>;
  },

  // Get single assessment details (New: /api/aiprep/candidates/{id}/assessments/{assessment_id})
  getAssessment: async (assessmentId: string | number, candidateId?: string | number): Promise<AssessmentDetail> => {
    const cid = resolveCandidateId(candidateId);
    const res: any = await apiFetch(endpoint(`candidates/${cid}/assessments/${assessmentId}`));
    // Legacy wrapped format: { data: { assessment: ..., report: ..., assessment_data: ... } }
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

    // Unified format: { id, status, candidate_id, data: { transcript, assessment_eval, ... } }
    if (res && (res.id !== undefined || res.status !== undefined)) {
      const rawData = res.data || {};
      const assessmentEval = rawData.assessment_eval || res.report || null;
      return {
        ...res,
        data: rawData,
        report: assessmentEval,
        questions: res.questions || [],
      } as AssessmentDetail;
    }

    return (res?.data || res) as AssessmentDetail;
  },

  // Get submitted telemetry/transcript data for an assessment
  getAssessmentData: async (assessmentId: string | number, candidateId?: string | number): Promise<AssessmentDataResponse> => {
    const cid = resolveCandidateId(candidateId);
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
    let cid: string | number;
    let body: Record<string, unknown>;

    if (typeof payload === "string") {
      cid = (await fetchAndCacheCandidateId()) || resolveCandidateId(undefined, "me");
      const candidateId =
        (cid === "me" || isNaN(Number(cid)))
          ? undefined
          : Number(cid);
      body = {
        candidate_id: candidateId,
        assessment_type: payload,
        media_type: mediaTypeArg,
        job_description: jobDescriptionArg ?? null,
      };
    } else {
      cid = payload.candidate_id 
        ? resolveCandidateId(payload.candidate_id) 
        : ((await fetchAndCacheCandidateId()) || resolveCandidateId(undefined, "me"));
      const isAudioOnly =
        payload.media_type === "AUDIO" ||
        payload.assessment_mode === "AUDIO_ONLY" ||
        (typeof payload.media_type === "string" && payload.media_type.toUpperCase() === "AUDIO");

      const candidateId =
        (cid === "me" || isNaN(Number(cid)))
          ? undefined
          : Number(cid);

      body = {
        candidate_id: candidateId,
        assessment_type: payload.assessment_type || "INTRO",
        media_type: isAudioOnly ? "AUDIO" : "VIDEO",
      };

      const jobDescription = payload.job_description || payload.job_description_text;
      if (jobDescription) {
        body.job_description = jobDescription;
      }

      const saveRec = payload.consent_save_recording ?? payload.consent?.save_recording ?? true;
      const saveTx = payload.consent_save_transcript ?? payload.consent?.save_transcript ?? true;
      body.consent = {
        save_recording: saveRec,
        save_transcript: saveTx,
        video_analytics: !isAudioOnly,
      };
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
    const apiPrefix = baseUrl.endsWith("/api") ? baseUrl : (baseUrl ? `${baseUrl}/api` : "/api");
    const url = `${apiPrefix}/aiprep/candidates/${cid}/assessments/${assessmentId}/media/chunk`;

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
      const error: any = new Error(err.detail || `Upload chunk failed: ${res.statusText} (${res.status})`);
      error.status = res.status;
      error.statusCode = res.status;
      throw error;
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
