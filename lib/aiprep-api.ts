const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

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

function getAuthToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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

  const response = await fetch(`${API_BASE}${path}`, {
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
    throw new Error(`[${response.status}] ${errorDetail}`);
  }

  return response.json();
}

export const aiprepApi = {
  uploadChunk(
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

  assembleMedia(
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

  getProcessingStatus(
    assessmentId: number,
    signal?: AbortSignal
  ): Promise<ProcessingStatusResponse> {
    return request<ProcessingStatusResponse>(
      `/api/ai-prep/assessments/${assessmentId}/processing-status`,
      { method: 'GET', signal }
    );
  },

  subscribeToProcessing(
    assessmentId: number,
    onUpdate: (status: ProcessingStatusResponse) => void,
    onError?: (error: Event) => void
  ): () => void {
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
  },

  getAssessment(id: number, signal?: AbortSignal): Promise<AssessmentDetails> {
    return request<AssessmentDetails>(`/api/ai-prep/assessments/${id}`, { method: 'GET', signal });
  },

  updateAssessmentStatus(
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
};
