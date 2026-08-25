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

export interface ReportResponse {
  id: number;
  assessment_id: number;
  overall_score: number;
  coaching_band: 'EXCELLENT' | 'STRONG' | 'DEVELOPING' | 'NEEDS_WORK';
  formula_explanation: string;
  scores_breakdown_json: any;
  technical_analysis_json: any;
  non_technical_analysis_json: any;
  coaching_suggestions_json?: any;
  signal_timeline_json?: any;
  transcript_evidence_json?: any;
  gaps_to_validate_json?: any;
  improvements_json?: any;
  created_at: string;
}

export interface DashboardResponse {
  radar: {
    llm_architecture: number;
    rag_systems: number;
    ml_fundamentals: number;
    system_design: number;
    code_quality: number;
    ai_ethics: number;
  };
  communication_trend: Array<{
    assessment_id: number;
    date: string;
    wpm: number;
    filler_per_min: number;
    silence_pct: number;
  }>;
  executive_summary: {
    total_assessments: number;
    completed: number;
    latest_coaching_band: string;
    band_trend: string[];
    assessments: any[];
  };
}

// ============================================================================
// Core Fetch Request Helper
// ============================================================================

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    document.cookie.split('; ').find(r => r.trim().startsWith('token='))?.split('=')[1] ||
    document.cookie.split('; ').find(r => r.trim().startsWith('access_token='))?.split('=')[1] ||
    null
  );
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
// Local Storage Simulation Database Helpers
// ============================================================================


const getLocalAssessments = (): Assessment[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('aiprep_db_assessments');
  return stored ? JSON.parse(stored) : [];
};

const saveLocalAssessments = (assessments: Assessment[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('aiprep_db_assessments', JSON.stringify(assessments));
};

const getLocalReports = (): ReportResponse[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('aiprep_db_reports');
  return stored ? JSON.parse(stored) : [];
};

const saveLocalReports = (reports: ReportResponse[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('aiprep_db_reports', JSON.stringify(reports));
};

const generateMockReport = (assessmentId: number): ReportResponse => {
  return {
    id: Math.floor(Math.random() * 1000) + 1,
    assessment_id: assessmentId,
    overall_score: 82,
    coaching_band: 'STRONG',
    formula_explanation: 'Calculated using standard AIPrep weighted scoring.',
    scores_breakdown_json: {
      ai_engineering: { score: 85, sub_scores: { llm_knowledge: 88, rag_understanding: 82, evaluation_methodology: 85, deployment_mlops: 85 } },
      core_engineering: { score: 80, sub_scores: { system_design: 78, algorithms: 82, code_quality: 80 } },
      non_technical: { score: 82, sub_scores: { communication_clarity: 85, answer_structure: 80, confidence: 82 } },
      business_acumen: { score: 80, sub_scores: { problem_framing: 82, stakeholder_thinking: 78 } }
    },
    technical_analysis_json: {},
    non_technical_analysis_json: {},
    coaching_suggestions_json: [
      { priority: 1, dimension: 'AI Engineering', area: 'RAG Systems', suggestion: 'Consider implementing semantic caching to optimize latency and costs.', evidence: 'Frequent redundant queries during system design responses.' }
    ],
    created_at: new Date().toISOString(),
  };
};

const saveLocalReport = (assessmentId: number) => {
  const reports = getLocalReports();
  if (!reports.some(r => r.assessment_id === assessmentId)) {
    reports.push(generateMockReport(assessmentId));
    saveLocalReports(reports);
  }
};

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
    try {
      return await request<any>('/api/ai-prep/vision-telemetry', {
        method: 'POST',
        body: JSON.stringify(data),
        signal,
      });
    } catch (err) {
      console.warn("Backend saveVisionTelemetry API not found or failed. Simulating locally.");
      if (typeof window !== 'undefined') {
        const telemetry = JSON.parse(localStorage.getItem('aiprep_db_telemetry') || '[]');
        telemetry.push({ ...data, saved_at: new Date().toISOString() });
        localStorage.setItem('aiprep_db_telemetry', JSON.stringify(telemetry));
      }
      return { status: 'success' };
    }
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
    try {
      const formData = new FormData();
      formData.append('assessment_id', String(assessmentId));
      formData.append('chunk_number', String(chunkNumber));
      formData.append('total_chunks', String(totalChunks));
      formData.append('file', blob, `chunk-${chunkNumber}.webm`);

      return await request<UploadChunkResponse>(
        '/api/ai-prep/media/upload-chunk',
        {
          method: 'POST',
          body: formData,
          signal,
        },
        false
      );
    } catch (err) {
      console.warn(`Backend uploadChunk API not found or failed. Simulating upload of chunk ${chunkNumber} locally.`);
      return {
        chunk_number: chunkNumber,
        gcs_path: `ai-prep/7/${assessmentId}/chunks/${chunkNumber}.webm`,
      };
    }
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
    try {
      return await request<AssembleMediaResponse>(
        '/api/ai-prep/media/assemble',
        {
          method: 'POST',
          body: JSON.stringify({ assessment_id: assessmentId, total_chunks: totalChunks }),
          signal,
        }
      );
    } catch (err) {
      console.warn(`Backend assembleMedia API not found or failed. Simulating assembly of ${totalChunks} chunks locally.`);
      return {
        assessment_id: assessmentId,
        status: 'PROCESSING',
        task_id: `task-${Math.floor(Math.random() * 1000)}`,
      };
    }
  },

  /**
   * Fetches processing status for an assessment.
   * GET /api/ai-prep/assessments/{id}/processing-status
   */
  async getProcessingStatus(
    assessmentId: number,
    signal?: AbortSignal
  ): Promise<ProcessingStatusResponse> {
    try {
      return await request<ProcessingStatusResponse>(
        `/api/ai-prep/assessments/${assessmentId}/processing-status`,
        { method: 'GET', signal }
      );
    } catch (err) {
      console.warn(`Backend getProcessingStatus API not found or failed. Returning mock status.`);
      return {
        status: 'COMPLETED',
        steps: { stt: 'COMPLETED', audio: 'COMPLETED', vision: 'COMPLETED', llm: 'COMPLETED', finalize: 'COMPLETED' }
      };
    }
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

    try {
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
    } catch (err) {
      console.warn(`EventSource connection failed for assessment ${assessmentId}. Simulating completion callback.`);

      const timer = setTimeout(() => {
        onUpdate({
          status: 'COMPLETED',
          steps: { stt: 'COMPLETED', audio: 'COMPLETED', vision: 'COMPLETED', llm: 'COMPLETED', finalize: 'COMPLETED' }
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  },

  // --------------------------------------------------------------------------
  // Vishnu (FE3) API calls
  // --------------------------------------------------------------------------

  /**
   * Fetches the completed coaching report for an assessment.
   * GET /api/ai-prep/reports/{assessment_id}
   */
  async getReport(assessmentId: number, signal?: AbortSignal): Promise<ReportResponse> {
    try {
      return await request<ReportResponse>(`/api/ai-prep/reports/${assessmentId}`, {
        method: 'GET',
        signal,
      });
    } catch (err) {
      console.warn(`Backend getReport API not found or failed. Retrieving report for assessment ${assessmentId} locally.`);
      const reports = getLocalReports();
      const found = reports.find(r => r.assessment_id === assessmentId);
      if (found) return found;
      return generateMockReport(assessmentId);
    }
  },

  /**
   * Fetches user executive overview statistics and radar metrics.
   * GET /api/ai-prep/analytics/dashboard/{candidate_id}
   */
  async getDashboard(candidateId: number, signal?: AbortSignal): Promise<DashboardResponse> {
    try {
      return await request<DashboardResponse>(`/api/ai-prep/analytics/dashboard/${candidateId}`, {
        method: 'GET',
        signal,
      });
    } catch (err) {
      console.warn(`Backend getDashboard API not found or failed. Aggregating dashboard data locally.`);
      const assessments = getLocalAssessments();
      const candidateAssessments = assessments.filter(a => a.candidate_id === candidateId || a.candidate_id === 7);

      // If empty local assessments, pre-populate with mock assessments
      const defaultAssessments = candidateAssessments.length > 0 ? candidateAssessments : [
        {
          id: 101,
          candidate_id: candidateId,
          assessment_type: 'TECHNICAL' as AssessmentType,
          assessment_mode: 'VIDEO_AUDIO' as AssessmentMode,
          status: 'COMPLETED' as AssessmentStatus,
          attempt_number: 1,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          completed_at: new Date(Date.now() - 3600000 * 1.8).toISOString(),
          questions: []
        },
        {
          id: 102,
          candidate_id: candidateId,
          assessment_type: 'GENERAL_INTRO' as AssessmentType,
          assessment_mode: 'AUDIO_ONLY' as AssessmentMode,
          status: 'FAILED' as AssessmentStatus,
          attempt_number: 1,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          completed_at: new Date(Date.now() - 86400000 + 1200000).toISOString(),
          questions: []
        }
      ];

      return {
        radar: {
          llm_architecture: 80,
          rag_systems: 75,
          ml_fundamentals: 85,
          system_design: 70,
          code_quality: 90,
          ai_ethics: 95,
        },
        communication_trend: defaultAssessments.filter(a => a.status === 'COMPLETED').map(a => ({
          assessment_id: a.id,
          date: a.completed_at || a.created_at,
          wpm: 125,
          filler_per_min: 3,
          silence_pct: 12,
        })),
        executive_summary: {
          total_assessments: defaultAssessments.length,
          completed: defaultAssessments.filter(a => a.status === 'COMPLETED').length,
          latest_coaching_band: 'STRONG',
          band_trend: defaultAssessments.filter(a => a.status === 'COMPLETED').map(() => 'STRONG'),
          assessments: defaultAssessments,
        }
      };
    }
  }
};
