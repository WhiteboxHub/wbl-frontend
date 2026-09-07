/**
 * AIPrep API Client Layer (Master PDF & JSON Contract Compliant)
 * 
 * Target Workspace: wbl-frontend
 * Primary Contract Spec: AIPrep_Contracts_signature.pdf / contracts/api_endpoints.md
 * Base URL Prefix: /api/aiprep
 */

import { apiFetch as baseApiFetch } from '@/lib/api';

const apiFetch = (endpoint: string, options?: any) => {
  const path =
    endpoint.startsWith('aiprep/') ||
      endpoint === 'user_dashboard' ||
      endpoint.startsWith('setup/') ||
      endpoint.startsWith('coderpad/')
      ? endpoint
      : `aiprep/${endpoint}`;
  return baseApiFetch(path, options);
};

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
  track_title?: string | null;
  job_description?: string | null;
  job_description_text?: string | null;
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

export interface AIPrepSetupStatus {
  resume_uploaded: boolean;
  api_keys_configured: boolean;
  setup_complete: boolean;
}

export interface CandidateAnalyticsDashboard {
  analytics: {
    average_technical_score: number;
    average_communication_score: number;
    average_wpm?: number | null;
    average_silence_ratio_pct?: number | null;
    top_strengths: string[];
    top_improvements: string[];
  };
  executive_summary: { latest_coaching_band: string };
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

export interface AssessmentInfo {
  type: AssessmentType;
  title: string;
  modalHeader: string;
  modalQuestion: string;
  modalDescription: string;
  shortDescription: string;
  duration: string;
  keyTopics: string[];
  tips?: string[];
}

export const ASSESSMENT_INFO_DETAILS: Record<AssessmentType, AssessmentInfo> = {
  INTRO: {
    type: 'INTRO',
    title: 'Introduction Assessment',
    modalHeader: 'Introduction Assessment',
    modalQuestion: 'What is an Introduction Assessment?',
    modalDescription:
      'This assessment gives you an opportunity to introduce yourself in a professional interview-style format. You can talk about your background, education, skills, experience, key strengths, projects, and career goals.',
    shortDescription:
      'Introduce yourself in a professional interview-style format covering background, skills, strengths, and career goals.',
    duration: '4 mins',
    keyTopics: [
      'Background & Education',
      'Technical & Professional Skills',
      'Key Strengths & Core Values',
      'Relevant Projects & Achievements',
      'Career Goals & Aspirations',
    ],
    tips: [
      'Keep your introduction structured and concise (around 2–3 minutes).',
      'Highlight 1–2 key career accomplishments.',
      'Speak clearly and maintain positive eye contact with your camera.',
    ],
  },
  JD_INTRO: {
    type: 'JD_INTRO',
    title: 'JD Introduction Assessment',
    modalHeader: 'JD Introduction Assessment',
    modalQuestion: 'What is a JD Introduction Assessment?',
    modalDescription:
      'This assessment gives you an opportunity to explain your understanding of the job description. You can talk about the role, responsibilities, required skills, qualifications, and how your experience and skills match the position.',
    shortDescription:
      'Explain your understanding of the target job description and demonstrate how your background matches the role.',
    duration: '4 mins',
    keyTopics: [
      'Role & Core Responsibilities',
      'Required Skills & Technical Qualifications',
      'Direct Experience Match',
      'How You Plan to Add Value',
    ],
    tips: [
      'Reference specific requirements mentioned in the job description.',
      'Connect your past experiences directly to the role needs.',
      'Explain why you are uniquely suited for this specific opening.',
    ],
  },
  RECRUITER: {
    type: 'RECRUITER',
    title: 'Recruiter Assessment',
    modalHeader: 'Recruiter Assessment',
    modalQuestion: 'What is a Recruiter Assessment?',
    modalDescription:
      'This assessment gives you an opportunity to discuss your professional background, career interests, experience, and expectations. You can talk about your strengths, achievements, career goals, and why you are interested in the opportunity.',
    shortDescription:
      'Discuss professional background, career interests, experience, strengths, and expectations with a recruiter.',
    duration: '~15 mins',
    keyTopics: [
      'Professional Career Overview',
      'Key Achievements & Milestones',
      'Career Interests & Trajectory',
      'Role Expectations & Motivations',
    ],
    tips: [
      'Be clear about your career journey and motivations.',
      'Highlight interpersonal skills and adaptability.',
      'Communicate your passion and interest in the opportunity.',
    ],
  },
  HIRING_MANAGER: {
    type: 'HIRING_MANAGER',
    title: 'Hiring Manager Assessment',
    modalHeader: 'Hiring Manager Assessment',
    modalQuestion: 'What is a Hiring Manager Assessment?',
    modalDescription:
      'This assessment gives you an opportunity to discuss your professional experience and how you can contribute to the role and team. You can talk about your previous work, important projects, achievements, problem-solving approach, and how you handle different situations.',
    shortDescription:
      'Discuss professional experience, past project impact, problem-solving approach, and how you contribute to the role.',
    duration: '~15 mins',
    keyTopics: [
      'High-Impact Past Projects',
      'Contribution to Role & Team',
      'Problem-Solving Approach',
      'Handling Situations & Impact',
    ],
    tips: [
      'Use the STAR method (Situation, Task, Action, Result) for situational questions.',
      'Emphasize your ownership, decision rationale, and measurable outcomes.',
      'Show how you collaborate with cross-functional teams.',
    ],
  },
  TECHNICAL: {
    type: 'TECHNICAL',
    title: 'Technical Assessment',
    modalHeader: 'Technical Assessment',
    modalQuestion: 'What is a Technical Assessment?',
    modalDescription:
      'This assessment gives you an opportunity to demonstrate your technical knowledge and problem-solving skills. You can answer questions about technologies, programming concepts, tools, systems, and technical challenges related to the role.',
    shortDescription:
      'Demonstrate technical knowledge, programming concepts, tools, systems, and problem-solving skills related to the role.',
    duration: '~15 mins',
    keyTopics: [
      'Technologies & Core Programming Concepts',
      'Tools & Frameworks Mastery',
      'Technical Problem-Solving Skills',
      'Role-Related Engineering Challenges',
    ],
    tips: [
      'Walk through your thought process out loud.',
      'Discuss trade-offs between different technical solutions.',
      'Clarify assumptions before diving into deep technical answers.',
    ],
  },
  SYSTEM_DESIGN: {
    type: 'SYSTEM_DESIGN',
    title: 'System Design Assessment',
    modalHeader: 'System Design Assessment',
    modalQuestion: 'What is a System Design Assessment?',
    modalDescription:
      'This assessment gives you an opportunity to demonstrate how you design and build a software system. You can discuss the system architecture, components, databases, APIs, scalability, reliability, and the technical decisions you would make.',
    shortDescription:
      'Demonstrate how you design and build software systems, architecture, components, databases, APIs, scalability, and reliability.',
    duration: '~15 mins',
    keyTopics: [
      'System Architecture & Components',
      'Databases & APIs Integration',
      'Scalability & Reliability Design',
      'Technical Decisions & Trade-offs',
    ],
    tips: [
      'Start with requirements gathering and scale estimation.',
      'Define high-level architecture before diving into component details.',
      'Highlight bottlenecks, caching strategies, and fault tolerance.',
    ],
  },
};

export function buildAssessmentCardMetadata(
  type: AssessmentType,
  dbQuestionCount?: number,
  avgSecondsPerQuestion?: number
): AssessmentCardMeta {
  const isNoPause = NO_PAUSE_ASSESSMENT_TYPES.includes(type);
  const requiresJd = type === 'JD_INTRO';
  const isIntro = type === 'INTRO' || type === 'JD_INTRO';
  const info = ASSESSMENT_INFO_DETAILS[type];

  const count = typeof dbQuestionCount === 'number' ? dbQuestionCount : 0;
  const sec = typeof avgSecondsPerQuestion === 'number' ? avgSecondsPerQuestion : getDefaultTypeSeconds(type);
  const timeLimit = isIntro ? '4 mins' : formatTimeEstimate(count, sec, type);

  return {
    type,
    title: type,
    description: info?.modalDescription || info?.shortDescription || '',
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

const aiprepApiFetch = (endpoint: string, options: any = {}) => {
  const cleanEp = endpoint.replace(/^\//, '');
  const path = cleanEp.startsWith('aiprep/') ? cleanEp : `aiprep/${cleanEp}`;
  return apiFetch(path, options);
};

export const aiprepApi = {
  getSetupStatus: async (): Promise<AIPrepSetupStatus> => {
    let setupRes: any = null;
    try {
      setupRes = await apiFetch('setup/setup-status');
    } catch (e) {
      console.warn('setup/setup-status fetch note:', e);
    }

    let hasActiveKeys = false;
    try {
      const keys: any = await apiFetch('coderpad/me/llm-keys');
      if (Array.isArray(keys) && keys.length > 0) {
        hasActiveKeys = keys.some((k: any) => k.status === 'active' || k.validation_status === 'active');
      }
    } catch (e) {
      console.warn('coderpad/me/llm-keys check note:', e);
    }

    const isKeysConfigured = Boolean(setupRes?.api_keys_configured || hasActiveKeys);
    const isResumeUploaded = Boolean(setupRes?.resume_uploaded);
    return {
      resume_uploaded: isResumeUploaded,
      api_keys_configured: isKeysConfigured,
      setup_complete: isResumeUploaded && isKeysConfigured,
    };
  },
  getDashboardAnalytics: async (candidateId: number): Promise<CandidateAnalyticsDashboard> => {
    try {
      return await apiFetch(`aiprep/analytics/candidate/${candidateId}`);
    } catch (e) {
      console.warn('Candidate analytics endpoint notice:', e);
      return {
        analytics: {
          average_technical_score: 0,
          average_communication_score: 0,
          average_wpm: null,
          average_silence_ratio_pct: null,
          top_strengths: [],
          top_improvements: [],
        },
        executive_summary: { latest_coaching_band: 'NOT_STARTED' },
      };
    }
  },
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
    // Safe default to 1001 if candidateId is unassociated (matches backend dependencies fallback)
    if (!candidateId) {
      candidateId = 1001;
    }

    const normMediaType: MediaType = (
      payload.media_type === 'AUDIO' || payload.assessment_mode === 'AUDIO_ONLY' || payload.assessment_mode === 'AUDIO'
        ? 'AUDIO'
        : 'VIDEO'
    ) as MediaType;
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

    return aiprepApiFetch('assessments', {
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
    return aiprepApiFetch(`assessments/${assessmentId}/data`, {
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
    return aiprepApiFetch(`assessments/${assessmentId}/media`, {
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
    return aiprepApiFetch(`assessments/${assessmentId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /**
   * 5. Get Assessment Report: GET /api/aiprep/assessments/{id}
   */
  getAssessment: async (assessmentId: number): Promise<AssessmentDetails> => {
    return aiprepApiFetch(`assessments/${assessmentId}`);
  },

  /**
   * 6. List Candidate Assessments: GET /api/aiprep/assessments?candidate_id={id}
   */
  listCandidateAssessments: async (
    candidateId: number
  ): Promise<{ items: AssessmentDetails[]; total: number }> => {
    return aiprepApiFetch(`assessments?candidate_id=${candidateId}`);
  },

  /**
   * 7. List Questions: GET /api/aiprep/questions?category={cat}&difficulty_level={diff}
   */
  getQuestions: async (
    category?: string,
    difficulty?: string
  ): Promise<QuestionListResponse> => {
    const params = new URLSearchParams();
    if (category && category !== 'GENERAL') {
      params.append('category', category.toUpperCase());
    }
    if (difficulty) params.append('difficulty_level', difficulty.toUpperCase());

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return aiprepApiFetch(`questions${queryStr}`);
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
    return aiprepApiFetch('questions', {
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
    return aiprepApiFetch(`questions/${id}`, {
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
      } catch (_) { }
    }
    return { id, status };
  },

  uploadChunk: async (
    assessmentId: number,
    chunkIndex: number,
    blob: Blob,
    mediaType: string = 'VIDEO',
    isFinal: boolean = false
  ): Promise<{ message: string; chunk_index?: number; file_path?: string; success?: boolean }> => {
    const formData = new FormData();
    formData.append('file', blob, `chunk_${chunkIndex}.webm`);
    formData.append('chunk_index', String(chunkIndex));
    formData.append('assessment_id', String(assessmentId));
    formData.append('media_type', mediaType);
    if (isFinal !== undefined) {
      formData.append('is_final', String(isFinal));
    }

    try {
      const res = await apiFetch(`assessments/${assessmentId}/upload-media`, {
        method: 'POST',
        body: formData,
      });
      return { success: true, ...res };
    } catch (err: any) {
      // If 404, fallback to /aiprep/assessments prefix
      if (err?.status === 404 || (typeof err?.message === 'string' && err.message.includes('404'))) {
        try {
          const fallbackRes = await apiFetch(`aiprep/assessments/${assessmentId}/upload-media`, {
            method: 'POST',
            body: formData,
          });
          return { success: true, ...fallbackRes };
        } catch (_) { }
      }
      console.error(`[AIPrep API] Failed to upload chunk ${chunkIndex}:`, err);
      throw err;
    }
  },

  getProcessingStatus: async (
    assessmentId: number
  ): Promise<ProcessingStatusResponse> => {
    try {
      const assessment = await aiprepApi.getAssessment(assessmentId);
      const status = assessment?.status || 'IN_PROGRESS';

      let progress = 10;
      let step = 'SUBMITTED';

      if (status === 'IN_PROGRESS') {
        progress = 25;
        step = 'RECORDING';
      } else if (status === 'EVALUATING') {
        progress = 65;
        step = 'EVALUATING_ENGINES';
      } else if (status === 'COMPLETED') {
        progress = 100;
        step = 'COMPLETED';
      } else if (status === 'FAILED') {
        step = 'FAILED';
        progress = 0;
      }

      return {
        step,
        progress,
        status,
      };
    } catch (err: any) {
      console.error(`[AIPrep API] Failed to fetch processing status for ${assessmentId}:`, err);
      return {
        step: 'RETRYING',
        progress: 50,
        status: 'EVALUATING',
      };
    }
  },

  subscribeToProcessing: (
    assessmentId: number,
    onProgress: (status: ProcessingStatusResponse) => void,
    onError?: (err: any) => void
  ): (() => void) => {
    let isCancelled = false;

    const poll = async () => {
      try {
        const res = await aiprepApi.getProcessingStatus(assessmentId);
        if (isCancelled) return;
        onProgress(res);

        if (res.status === 'COMPLETED' || res.status === 'FAILED') {
          return;
        }
      } catch (err) {
        if (!isCancelled && onError) onError(err);
      }

      if (!isCancelled) {
        timerId = setTimeout(poll, 3000);
      }
    };

    let timerId = setTimeout(poll, 1500);

    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  },
};

export default aiprepApi;
