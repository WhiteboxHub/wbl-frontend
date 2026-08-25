/**
 * AIPrep API Client Layer
 * 
 * Target Workspace: wbl-frontend
 * Primary Developer: Narasimha (FE1) & Kartik (FE2)
 * 
 * Provides TypeScript definitions and API caller methods for candidate assessments,
 * device checks, consent logs, chunked upload, and analytical reports.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ============================================================================
// TypeScript Interfaces & Types
// ============================================================================

export type AssessmentType =
  | 'GENERAL_INTRO'
  | 'JOB_DESCRIPTION_INTRO'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'TECHNICAL'
  | 'SYSTEM_DESIGN'
  | 'HR';

export const NO_PAUSE_ASSESSMENT_TYPES: ReadonlyArray<AssessmentType> = [
  'GENERAL_INTRO',
  'JOB_DESCRIPTION_INTRO',
];

export type AssessmentMode = 'VIDEO_AUDIO' | 'AUDIO_ONLY';

export type AssessmentStatus =
  | 'TESTING'
  | 'IN_PROGRESS'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type StepExecutionStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ProcessingSteps {
  stt: StepExecutionStatus;
  audio: StepExecutionStatus;
  vision: StepExecutionStatus;
  llm: StepExecutionStatus;
  finalize: StepExecutionStatus;
}

export interface ProcessingStatusResponse {
  status: AssessmentStatus;
  steps: ProcessingSteps;
  error?: string;
}

export interface UploadChunkResponse {
  chunk_number: number;
  gcs_path: string;
}

export interface AssembleMediaResponse {
  assessment_id: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  task_id: string;
}

export interface AssessmentQuestion {
  id: number;
  order_index: number;
  question_text: string;
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}

// Narasimha uses type alias 'Question' pointing to 'AssessmentQuestion'
export type Question = AssessmentQuestion;

export interface AssessmentDetails {
  id: number;
  candidate_id: number;
  assessment_type: AssessmentType;
  assessment_mode: AssessmentMode;
  status: AssessmentStatus;
  attempt_number: number;
  job_description_text?: string | null;
  questions: AssessmentQuestion[];
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

// Narasimha uses type alias 'Assessment' pointing to 'AssessmentDetails'
export type Assessment = AssessmentDetails;

export interface CreateAssessmentRequest {
  assessment_type: AssessmentType;
  assessment_mode: AssessmentMode;
  candidate_id?: number | null;
  candidate_resume_id?: number | null;
  job_description_text?: string | null;
}

export interface HardwareCheckRequest {
  assessment_id: number;
  browser_info?: string | null;
  os_info?: string | null;
  camera_permission: boolean;
  mic_permission: boolean;
  speaker_ok: boolean;
  bandwidth_kbps: number;
  yolo_model_enabled: boolean;
}

export interface HardwareCheckResponse {
  id: number;
  assessment_id: number;
  browser_info?: string | null;
  os_info?: string | null;
  camera_permission?: boolean;
  mic_permission?: boolean;
  speaker_ok?: boolean;
  bandwidth_kbps?: number;
  yolo_model_enabled?: boolean;
  tested_at: string;
}

export interface ConsentRequest {
  candidate_id?: number;
  consent_type: 'VIDEO_ANALYTICS' | 'DATA_RETENTION' | 'TERMS_OF_SERVICE';
  consented: boolean;
}

export type QuestionCategory =
  | 'TECHNICAL'
  | 'SYSTEM_DESIGN'
  | 'BEHAVIORAL'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'GENERAL';

export interface QuestionBankResponse {
  id: number;
  category: QuestionCategory;
  sub_category: string;
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  question_text: string;
  ideal_answer_rubric?: string | null;
  relevant_skills_json?: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface ConsentResponse {
  id: number;
  candidate_id?: number;
  consent_type: string;
  consented: boolean;
  consented_at: string;
  revoked_at?: string | null;
}

// ============================================================================
// Core Fetch Request Helper
// ============================================================================

function getAuthToken(): string | null {
  return typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('access_token')) : null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isJson: boolean = true
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (isJson && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const baseUrl = API_BASE.replace(/\/$/, "");
  let cleanPath = path.replace(/^\//, "");
  if (cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.substring(4);
  }
  const url = baseUrl ? `${baseUrl}/${cleanPath}` : `/${cleanPath}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      const errText = await response.text();
      if (errText) errorDetail = errText;
    }
    const errorObj: any = new Error(`[${response.status}] ${errorDetail}`);
    errorObj.status = response.status;
    throw errorObj;
  }

  return response.json();
}

// ============================================================================
// API Operations Client
// ============================================================================

export const aiprepApi = {
  // --------------------------------------------------------------------------
  // Narasimha (FE1) API calls
  // --------------------------------------------------------------------------

  /**
   * Creates a new assessment session.
   * POST /api/ai-prep/assessments
   */
  async createAssessment(data: CreateAssessmentRequest, signal?: AbortSignal): Promise<Assessment> {
    const candidateParam = data.candidate_id ? `?candidate_id=${data.candidate_id}` : '';
    return request<Assessment>(`/api/ai-prep/assessments${candidateParam}`, {
      method: 'POST',
      body: JSON.stringify({
        assessment_type: data.assessment_type,
        assessment_mode: data.assessment_mode,
        candidate_resume_id: data.candidate_resume_id,
        job_description_text: data.job_description_text,
      }),
      signal,
    });
  },

  /**
   * Fetches an assessment session including assigned questions.
   * GET /api/ai-prep/assessments/{id}
   */
  async getAssessment(id: number, signal?: AbortSignal): Promise<Assessment> {
    return request<Assessment>(`/api/ai-prep/assessments/${id}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Lists paginated assessment sessions for a candidate.
   * GET /api/ai-prep/assessments
   */
  async listAssessments(
    candidateId: number,
    limit?: number,
    skip?: number,
    signal?: AbortSignal
  ): Promise<{ items: Assessment[]; total: number }> {
    const params = new URLSearchParams();
    params.append('candidate_id', String(candidateId));
    if (limit) params.append('limit', String(limit));
    if (skip) params.append('skip', String(skip));
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return request<{ items: Assessment[]; total: number }>(
      `/api/ai-prep/assessments${queryStr}`,
      {
        method: 'GET',
        signal,
      }
    );
  },

  /**
   * Transitions the status of an assessment session (e.g. to IN_PROGRESS).
   * PATCH /api/ai-prep/assessments/{id}/status
   */
  async updateAssessmentStatus(
    id: number,
    status: AssessmentStatus,
    signal?: AbortSignal
  ): Promise<{ id: number; status: AssessmentStatus }> {
    return request<{ id: number; status: AssessmentStatus }>(
      `/api/ai-prep/assessments/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        signal,
      }
    );
  },

  /**
   * Saves hardware checks results for a specific assessment.
   * POST /api/ai-prep/hardware-check
   */
  async saveHardwareCheck(data: HardwareCheckRequest, signal?: AbortSignal): Promise<HardwareCheckResponse> {
    return request<HardwareCheckResponse>('/api/ai-prep/hardware-check', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    });
  },

  /**
   * Fetches the latest recorded hardware check for an assessment.
   * GET /api/ai-prep/hardware-check/{assessment_id}
   */
  async getHardwareCheck(assessmentId: number, signal?: AbortSignal): Promise<HardwareCheckResponse> {
    return request<HardwareCheckResponse>(`/api/ai-prep/hardware-check/${assessmentId}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Records candidate consent for analytics.
   * POST /api/ai-prep/consents?candidate_id={candidate_id}
   */
  async recordConsent(data: ConsentRequest, signal?: AbortSignal): Promise<ConsentResponse> {
    const candidateParam = data.candidate_id ? `?candidate_id=${data.candidate_id}` : '';
    return request<ConsentResponse>(`/api/ai-prep/consents${candidateParam}`, {
      method: 'POST',
      body: JSON.stringify({
        consent_type: data.consent_type,
        consented: data.consented,
      }),
      signal,
    });
  },

  /**
   * Fetches questions from the Question Bank.
   * GET /api/ai-prep/questions
   */
  async getQuestions(
    category?: QuestionCategory,
    limit?: number,
    signal?: AbortSignal
  ): Promise<QuestionBankResponse[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (limit) params.append('limit', String(limit));
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return request<QuestionBankResponse[]>(`/api/ai-prep/questions${queryStr}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Saves vision telemetry results from client-side YOLO processing.
   * POST /api/ai-prep/vision-telemetry
   */
  async saveVisionTelemetry(data: {
    assessment_id: number;
    face_visible_pct: number;
    head_nods_count: number;
    frame_stability_score: number;
    sitting_position?: string;
  }, signal?: AbortSignal): Promise<any> {
    return request<any>('/api/ai-prep/vision-telemetry', {
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    });
  },

  // --------------------------------------------------------------------------
  // Karthik (FE2) API calls
  // --------------------------------------------------------------------------

  /**
   * Uploads a single 30-second audio/video WebM segment.
   * POST /api/ai-prep/media/upload-chunk
   */
  async uploadChunk(
    assessmentId: number,
    chunkNumber: number,
    blob: Blob,
    totalChunks: number = -1,
    signal?: AbortSignal
  ): Promise<UploadChunkResponse> {
    const formData = new FormData();
    formData.append('assessment_id', String(assessmentId));
    formData.append('chunk_number', String(chunkNumber));
    formData.append('total_chunks', String(totalChunks));
    formData.append('file', blob, `chunk-${chunkNumber}.webm`);

    return request<UploadChunkResponse>(
      '/api/ai-prep/media/upload-chunk',
      {
        method: 'POST',
        body: formData,
        signal,
      },
      false
    );
  },

  /**
   * Triggers assembly of uploaded media chunks in GCS.
   * POST /api/ai-prep/media/assemble
   */
  async assembleMedia(
    assessmentId: number,
    totalChunks: number,
    signal?: AbortSignal
  ): Promise<AssembleMediaResponse> {
    return request<AssembleMediaResponse>(
      '/api/ai-prep/media/assemble',
      {
        method: 'POST',
        body: JSON.stringify({ assessment_id: assessmentId, total_chunks: totalChunks }),
        signal,
      }
    );
  },

  /**
   * Fetches processing status for an assessment.
   * GET /api/ai-prep/assessments/{id}/processing-status
   */
  async getProcessingStatus(
    assessmentId: number,
    signal?: AbortSignal
  ): Promise<ProcessingStatusResponse> {
    return request<ProcessingStatusResponse>(
      `/api/ai-prep/assessments/${assessmentId}/processing-status`,
      { method: 'GET', signal }
    );
  },

  /**
   * Subscribes to Server-Sent Events (SSE) for processing status.
   * GET /api/ai-prep/assessments/{id}/processing-status
   */
  subscribeToProcessing(
    assessmentId: number,
    onUpdate: (status: ProcessingStatusResponse) => void,
    onError?: (error: Event) => void
  ): () => void {
    const isClient = typeof window !== 'undefined';
    if (!isClient) return () => { };

    const token = getAuthToken();
    const basePath = `${API_BASE}/api/ai-prep/assessments/${assessmentId}/processing-status`;
    const url = token ? `${basePath}?token=${encodeURIComponent(token)}` : basePath;

    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.onmessage = (event) => {
      if (!event.data || event.data.trim() === '' || event.data.startsWith(':')) return;
      try {
        const data: ProcessingStatusResponse = JSON.parse(event.data);
        onUpdate(data);
      } catch (err) {
        console.error('[SSE Parse Error]:', err);
      }
    };

    if (onError) eventSource.onerror = onError;

    return () => eventSource.close();
  }
};
