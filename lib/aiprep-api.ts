/**
 * AIPrep API Client Layer (Master PDF & JSON Contract Compliant)
 * 
 * Target Workspace: wbl-frontend
 * Primary Contract Spec: AIPrep_Contracts_signature.pdf / contracts/api_endpoints.md
 * Base URL Prefix: /api/aiprep
 */

import { apiFetch } from '@/lib/api';

// ============================================================================
// TypeScript Interfaces & Contract Schema Definitions
// ============================================================================

export type AssessmentType =
  | 'INTRO'
  | 'JD_INTRO'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'SYSTEM_DESIGN'
  | 'TECHNICAL';

export type MediaType = 'VIDEO' | 'AUDIO' | 'VIDEO_AUDIO' | 'AUDIO_ONLY' | string;

export type AssessmentStatus =
  | 'IN_PROGRESS'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'FAILED';

export const NO_PAUSE_ASSESSMENT_TYPES: ReadonlyArray<AssessmentType> = [
  'INTRO',
  'JD_INTRO',
];

export type AssessmentMode = MediaType;

export type ProcessingSteps = any;

export interface ProcessingStatusResponse {
  step: ProcessingSteps;
  progress: number;
  status: string;
  steps?: Record<string, number>;
  error?: string;
}

export interface CreateAssessmentRequest {
  candidate_id: number;
  assessment_type: AssessmentType;
  media_type: MediaType;
  assessment_mode?: string;
  job_description?: string | null;
  job_description_text?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface CreateAssessmentResponse {
  id: number;
  status: AssessmentStatus;
  started_at: string;
}

export interface QuestionTelemetryItem {
  question_id: number;
  question_text: string;
}

export interface TranscriptTelemetry {
  full_text: string;
  segments?: Array<{ text: string; start: number; end: number }>;
}

export interface AudioTelemetry {
  words_per_minute?: number;
  speaking_pace_wpm?: number;
  silence_ratio_pct?: number;
  filler_rate_per_min?: number;
  avg_volume_db?: number;
  mean_pitch_hz?: number;
  pause_count?: number;
  background_noise_level?: string;
  speaking_duration_seconds?: number;
}

export interface VideoTelemetry {
  is_video_mode?: boolean;
  face_visible_pct?: number;
  face_visibility_pct?: number;
  head_nods_count?: number;
  eye_contact_pct?: number;
  screen_attention_pct?: number;
  distraction_level_pct?: number;
  facial_engagement_pct?: number;
  acknowledgement_count?: number;
  expression_variety_pct?: number;
  posture_score?: number;
  visual_engagement_pct?: number;
  frame_stability_score?: number;
  sitting_position?: string;
  gaze_direction?: string;
}

export interface SubmitTelemetryPayload {
  questions: QuestionTelemetryItem[];
  transcript: TranscriptTelemetry;
  audio_telemetry: AudioTelemetry;
  video_telemetry: VideoTelemetry;
}

// Master Evaluation Output Schema (PDF Part 3 & all_json_schemas.json)
export interface AudioEvaluation {
  coherence?: string;
  clarity?: string;
  fluency?: string;
  confidence?: string;
  pace?: string;
  volume?: string;
  professionalism?: string;
}

export interface VideoEvaluation {
  eye_contact?: string;
  facial_engagement?: string;
  posture?: string;
  expression_variety?: string;
  distraction?: string;
}

export interface ScoresBreakdown {
  ai_engineering?: { score: number };
  core_engineering?: { score: number };
  non_technical?: { score: number };
  business_acumen?: { score: number };
  [key: string]: { score: number } | undefined;
}

export interface TechnicalAnalysis {
  summary?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
}

export interface CoachingSuggestionItem {
  priority: number;
  dimension?: string;
  area?: string;
  suggestion: string;
}

export interface TranscriptEvidenceItem {
  quote: string;
  timestamp_s?: number;
}

export interface TranscriptEvaluation {
  scores_breakdown?: ScoresBreakdown;
  technical_analysis?: TechnicalAnalysis;
  coaching_suggestions?: CoachingSuggestionItem[];
  transcript_evidence?: TranscriptEvidenceItem[];
}

export interface MasterReportSchema {
  audio_evaluation?: AudioEvaluation;
  video_evaluation?: VideoEvaluation;
  transcript_evaluation?: TranscriptEvaluation;
}

export interface AssessmentDetails {
  id: number;
  candidate_id: number;
  assessment_type: AssessmentType;
  media_type: MediaType;
  assessment_mode?: string;
  status: AssessmentStatus;
  youtube_url?: string | null;
  data?: any;
  report?: MasterReportSchema;
  created_at?: string;
}

export interface QuestionBankResponse {
  id: number;
  category: string;
  sub_category?: string | null;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | string | null;
  question_text: string;
  ideal_answer_rubric?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface QuestionListResponse {
  items: QuestionBankResponse[];
  total: number;
}

export interface AssessmentCardMeta {
  type: AssessmentType;
  title: string;
  description: string;
  timeLimit: string;
  questionCount: string;
  pauseAllowed: boolean;
  requiresJd: boolean;
}

// ============================================================================
// Helper Utilities
// ============================================================================

export function getDifficultySeconds(difficulty?: string): number {
  switch (difficulty?.toUpperCase()) {
    case 'EASY':
      return 90;
    case 'HARD':
      return 180;
    case 'EXPERT':
      return 240;
    case 'MEDIUM':
    default:
      return 120;
  }
}

export function getDefaultTypeSeconds(type: AssessmentType): number {
  switch (type) {
    case 'INTRO':
    case 'JD_INTRO':
      return 240;
    case 'RECRUITER':
      return 120;
    case 'HIRING_MANAGER':
    case 'TECHNICAL':
    case 'SYSTEM_DESIGN':
    default:
      return 180;
  }
}

export function formatTimeEstimate(
  count: number,
  secPerQuestion: number = 120,
  type?: AssessmentType
): string {
  if (type === 'INTRO' || type === 'JD_INTRO') return '4 mins';
  if (count > 0) {
    const totalMin = Math.round((count * secPerQuestion) / 60);
    return `~${totalMin} mins`;
  }
  return '~15 mins';
}

export function buildAssessmentCardMetadata(
  type: AssessmentType,
  dbQuestionCount?: number,
  avgSecondsPerQuestion?: number
): AssessmentCardMeta {
  const isNoPause = NO_PAUSE_ASSESSMENT_TYPES.includes(type);
  const requiresJd = type === 'JD_INTRO';
  const isIntro = type === 'INTRO' || type === 'JD_INTRO';

  const titleMap: Record<AssessmentType, string> = {
    INTRO: 'General Intro',
    JD_INTRO: 'Job Description Intro',
    RECRUITER: 'Recruiter Phone Screen',
    HIRING_MANAGER: 'Hiring Manager Conversation',
    TECHNICAL: 'Technical Theory & Coding',
    SYSTEM_DESIGN: 'System Design',
  };

  const descMap: Record<AssessmentType, string> = {
    INTRO: 'Introductory dialogue covering your overall professional background and general experience.',
    JD_INTRO: 'Introductory dialogue tailored dynamically to your target Job Description.',
    RECRUITER: 'Simulates a standard recruiter phone screen covering experience overview, compensation expectations, and notice period.',
    HIRING_MANAGER: 'Deeper technical alignment screen exploring system design, architecture ownership, and past project impact.',
    TECHNICAL: 'Deep-dive into core AI Engineering topics: LLMs, transformers, RAG architecture, vector search, and MLOps.',
    SYSTEM_DESIGN: 'Solve production AI scale challenges. Deconstruct business problems and design real-time data pipelines.',
  };

  const count = typeof dbQuestionCount === 'number' ? dbQuestionCount : 0;
  const sec = typeof avgSecondsPerQuestion === 'number' ? avgSecondsPerQuestion : getDefaultTypeSeconds(type);
  const timeLimit = isIntro ? '4 mins' : formatTimeEstimate(count, sec, type);

  return {
    type,
    title: titleMap[type] || type,
    description: descMap[type] || '',
    timeLimit,
    questionCount: '',
    pauseAllowed: !isNoPause,
    requiresJd,
  };
}

// ============================================================================
// API Caller Methods 
// ============================================================================

async function getPublicClientIp(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(1500) });
    const data = await res.json();
    return data?.ip || null;
  } catch {
    return null;
  }
}

export const aiprepApi = {
  /**
   * 1. Create Assessment: POST /api/aiprep/assessments
   * Note: ip_address and user_agent read automatically from HTTP headers by backend
   */
  createAssessment: async (payload: {
    candidate_id?: number;
    assessment_type: AssessmentType;
    media_type?: MediaType;
    assessment_mode?: string;
    job_description?: string | null;
    job_description_text?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
  }): Promise<CreateAssessmentResponse> => {
    let candidateId = payload.candidate_id;
    if (!candidateId) {
      try {
        const userDash: any = await apiFetch('user_dashboard');
        candidateId = userDash?.candidate_id || userDash?.basic_info?.id || userDash?.id || userDash?.user_id;
      } catch (e) {
        console.warn('Could not fetch candidateId from user_dashboard profile', e);
      }
    }
    if (!candidateId) {
      throw new Error('Candidate ID is required to create an assessment session.');
    }

    const normMediaType: MediaType = (payload.media_type || (payload.assessment_mode === 'AUDIO_ONLY' ? 'AUDIO' : 'VIDEO')) as MediaType;
    const jd = payload.job_description || payload.job_description_text || null;

    let clientIp = payload.ip_address;
    if (!clientIp) {
      clientIp = await getPublicClientIp();
    }

    const reqHeaders: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      reqHeaders['User-Agent'] = window.navigator.userAgent;
    }
    if (payload.user_agent) {
      reqHeaders['User-Agent'] = payload.user_agent;
    }
    if (clientIp) {
      reqHeaders['X-Forwarded-For'] = clientIp;
      reqHeaders['X-Client-IP'] = clientIp;
      reqHeaders['X-Real-IP'] = clientIp;
    }

    const body: Record<string, any> = {
      candidate_id: candidateId,
      assessment_type: payload.assessment_type,
      media_type: normMediaType,
      job_description: jd,
    };

    if (clientIp) body.ip_address = clientIp;
    if (payload.user_agent) body.user_agent = payload.user_agent;

    return apiFetch('assessments', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(body),
    });
  },

  /**
   * 2. Submit Assessment Data: POST /api/aiprep/assessments/{id}/data
   */
  submitTelemetryData: async (
    assessmentId: number,
    payload: SubmitTelemetryPayload
  ): Promise<{ message: string }> => {
    return apiFetch(`assessments/${assessmentId}/data`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * 3. Update Assessment Media URL: PATCH /api/aiprep/assessments/{id}/media
   */
  updateMediaUrl: async (
    assessmentId: number,
    youtubeUrl: string
  ): Promise<{ id: number; youtube_url: string }> => {
    return apiFetch(`assessments/${assessmentId}/media`, {
      method: 'PATCH',
      body: JSON.stringify({ youtube_url: youtubeUrl }),
    });
  },

  /**
   * 4. Trigger Evaluation: POST /api/aiprep/assessments/{id}/evaluate
   */
  triggerEvaluation: async (
    assessmentId: number
  ): Promise<{ id: number; status: AssessmentStatus }> => {
    return apiFetch(`assessments/${assessmentId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /**
   * 5. Get Assessment Report: GET /api/aiprep/assessments/{id}
   */
  getAssessment: async (assessmentId: number): Promise<AssessmentDetails> => {
    return apiFetch(`assessments/${assessmentId}`);
  },

  /**
   * 6. List Candidate Assessments: GET /api/aiprep/assessments?candidate_id={id}
   */
  listCandidateAssessments: async (
    candidateId: number
  ): Promise<{ items: AssessmentDetails[]; total: number }> => {
    return apiFetch(`assessments?candidate_id=${candidateId}`);
  },

  /**
   * 7. List Questions: GET /api/aiprep/questions?category={cat}&difficulty_level={diff}
   */
  getQuestions: async (
    category?: string,
    difficulty?: string
  ): Promise<QuestionListResponse> => {
    const params = new URLSearchParams();
    if (category) {
      params.append('category', category);
    }
    if (difficulty) params.append('difficulty_level', difficulty);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`questions${queryStr}`);
  },

  /**
   * 8. Create Question: POST /api/aiprep/questions
   */
  createQuestion: async (payload: {
    category: string;
    sub_category?: string;
    difficulty_level: string;
    question_text: string;
    is_active?: boolean;
  }): Promise<QuestionBankResponse> => {
    return apiFetch('questions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * 9. Update Question: PATCH /api/aiprep/questions/{id}
   */
  updateQuestion: async (
    id: number,
    payload: { is_active?: boolean; question_text?: string; difficulty_level?: string }
  ): Promise<QuestionBankResponse> => {
    return apiFetch(`questions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // ── Compatibility Helper Methods ─────────────────────────────────────────
  saveVisionTelemetry: async (data: {
    assessment_id: number;
    face_visible_pct?: number;
    head_nods_count?: number;
    frame_stability_score?: number;
    sitting_position?: string;
  }): Promise<{ message: string }> => {
    return aiprepApi.submitTelemetryData(data.assessment_id, {
      questions: [],
      transcript: { full_text: '' },
      audio_telemetry: {},
      video_telemetry: {
        face_visible_pct: data.face_visible_pct,
        head_nods_count: data.head_nods_count,
        frame_stability_score: data.frame_stability_score,
        sitting_position: data.sitting_position,
      },
    });
  },

  updateAssessmentStatus: async (
    id: number,
    status: string
  ): Promise<{ id: number; status: string }> => {
    if (status === 'EVALUATING' || status === 'COMPLETED') {
      try {
        await aiprepApi.triggerEvaluation(id);
      } catch (_) {}
    }
    return { id, status };
  },

  uploadChunk: async (
    assessmentId: number,
    _chunkNumber?: any,
    _blob?: any
  ): Promise<{ success: boolean }> => {
    return { success: true };
  },

  getProcessingStatus: async (
    assessmentId: number
  ): Promise<ProcessingStatusResponse> => {
    return {
      step: 'COMPLETE',
      progress: 100,
      status: 'COMPLETED',
    };
  },

  subscribeToProcessing: (
    assessmentId: number,
    onProgress: (status: ProcessingStatusResponse) => void,
    onError?: () => void
  ): (() => void) => {
    onProgress({ step: 'COMPLETE', progress: 100, status: 'COMPLETED' });
    return () => {};
  },
};

export default aiprepApi;
