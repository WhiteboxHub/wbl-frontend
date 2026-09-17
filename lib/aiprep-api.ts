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
          assessment_type: payload.toUpperCase(),
          media_type: mediaTypeArg.toUpperCase(),
          job_description: jobDescriptionArg ?? null,
        },
      }) as Promise<CreateAssessmentResponse & AssessmentSummary>;
    }

    const isAudioOnly =
      payload.media_type === "AUDIO" ||
      payload.assessment_mode === "AUDIO_ONLY" ||
      (typeof payload.media_type === "string" && payload.media_type.toUpperCase() === "AUDIO");

    const rawType = String(payload.assessment_type || "INTRO").toUpperCase();
    const body: Record<string, unknown> = {
      assessment_type: rawType,
      media_type: isAudioOnly ? "AUDIO" : "VIDEO",
    };

    if (payload.candidate_id !== undefined) {
      body.candidate_id = payload.candidate_id;
    }

    const jobDescription = payload.job_description || payload.job_description_text;
    if (jobDescription) {
      body.job_description = jobDescription;
    }

    if ((payload as any).user_agent) {
      body.user_agent = (payload as any).user_agent;
    }

    if ((payload as any).ip_address) {
      body.ip_address = (payload as any).ip_address;
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

  // Get Questions from Question Bank
  getQuestions: async (
    category?: string,
    difficulty?: string
  ): Promise<any> => {
    const params = new URLSearchParams();
    if (category && category !== "GENERAL") {
      params.append("category", category.toUpperCase());
    }
    if (difficulty) params.append("difficulty_level", difficulty.toUpperCase());
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return apiFetch(endpoint(`questions${queryStr}`));
  },

  // Submit assessment telemetry & transcript
  submitTelemetryData: async (
    assessmentId: number | string,
    payload: any
  ): Promise<{ message: string }> => {
    return apiFetch(endpoint(`candidate/assessments/${assessmentId}/data`), {
      method: "POST",
      body: payload,
    }) as Promise<{ message: string }>;
  },

  // Trigger evaluation
  triggerEvaluation: async (
    assessmentId: number | string
  ): Promise<{ id: number; status: string }> => {
    return apiFetch(endpoint(`candidate/assessments/${assessmentId}/evaluate`), {
      method: "POST",
    }) as Promise<{ id: number; status: string }>;
  },

  // Update Media URL
  updateMediaUrl: async (
    assessmentId: number | string,
    youtubeUrl: string
  ): Promise<{ id: number; youtube_url: string }> => {
    return apiFetch(endpoint(`candidate/assessments/${assessmentId}/media`), {
      method: "PATCH",
      body: { youtube_url: youtubeUrl },
    }) as Promise<{ id: number; youtube_url: string }>;
  },

  // Upload Chunk
  uploadChunk: async (
    assessmentId: number | string,
    chunkIndex: number,
    blob: Blob,
    mediaType: string = "AUDIO",
    isFinal: boolean = false
  ): Promise<{ message: string; chunk_number?: number; file_path?: string; success?: boolean }> => {
    const formData = new FormData();
    formData.append("file", blob, `chunk_${chunkIndex}.webm`);
    formData.append("chunk_number", String(chunkIndex));
    formData.append("assessment_id", String(assessmentId));
    if (isFinal !== undefined) {
      formData.append("is_final", String(isFinal));
    }

    try {
      const res = await apiFetch(endpoint(`media/upload-chunk`), {
        method: "POST",
        body: formData,
      });
      return { success: true, ...res };
    } catch (err: any) {
      console.error(`[AIPrep API] Failed to upload chunk ${chunkIndex}:`, err);
      throw err;
    }
  },

  // Assemble Chunks
  assembleMedia: async (
    assessmentId: number | string,
    payload?: { total_chunks?: number }
  ): Promise<any> => {
    return apiFetch(endpoint(`media/assemble?assessment_id=${assessmentId}`), {
      method: "POST",
      body: payload || {},
    });
  },

  // Processing status
  getProcessingStatus: async (
    assessmentId: number | string
  ): Promise<any> => {
    try {
      const res = await apiFetch(endpoint(`assessments/${assessmentId}/status`));
      if (res && (res.status || res.progress_pct !== undefined)) {
        return {
          step: res.active_step || res.step || "Processing Ingested Media",
          progress: res.progress_percentage ?? res.progress_pct ?? (res.status === "COMPLETED" ? 100 : 65),
          status: res.status || "EVALUATING",
        };
      }
    } catch (_) {}

    try {
      const assessment = await aiPrepApi.getAssessment(assessmentId);
      const status = assessment?.status || "IN_PROGRESS";

      const progressMap: Record<string, number> = {
        IN_PROGRESS: 25,
        EVALUATING: 65,
        COMPLETED: 100,
        FAILED: 0,
      };

      return {
        step: status === "COMPLETED" ? "Evaluation Completed" : "Processing Ingested Media",
        progress: progressMap[status] ?? 50,
        status,
      };
    } catch (err: any) {
      console.error(`[AIPrep API] Failed to fetch processing status for ${assessmentId}:`, err);
      return {
        step: "RETRYING",
        progress: 50,
        status: "EVALUATING",
      };
    }
  },

  // Subscribe to processing via polling
  subscribeToProcessing: (
    assessmentId: number | string,
    onProgress: (status: any) => void,
    onError?: (err: any) => void
  ): (() => void) => {
    let isCancelled = false;
    let timerId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await aiPrepApi.getProcessingStatus(assessmentId);
        if (isCancelled) return;
        onProgress(res);

        if (res.status === "COMPLETED" || res.status === "FAILED") {
          return;
        }
      } catch (err) {
        if (!isCancelled && onError) onError(err);
      }

      if (!isCancelled) {
        timerId = setTimeout(poll, 3000);
      }
    };

    timerId = setTimeout(poll, 1500);

    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  },
};

export const aiprepApi = aiPrepApi;
export default aiPrepApi;
