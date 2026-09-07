/**
 * AIPrep API Client Layer (Master PDF & JSON Contract Compliant)
 * 
 * Target Workspace: wbl-frontend
 * Primary Contract Spec: AIPrep_Contracts_signature.pdf / contracts/api_endpoints.md
 * Base URL Prefix: /api/aiprep
 */

import { apiFetch as baseApiFetch } from '@/lib/api';

const apiFetch = (endpoint: string, options?: any) => {
  const path = endpoint.startsWith('aiprep/') || endpoint === 'user_dashboard' ? endpoint : `aiprep/${endpoint}`;
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
  stress_level?: string;
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

export interface AssessmentInfo {
  type: AssessmentType;
  title: string;
  subtitle: string;
  modalHeader: string;
  modalQuestion: string;
  modalDescription: string;
  shortDescription: string;
  cardDescription: string;
  duration: string;
  keyTopics: string[];
  whatIsThis: string;
  whatWillYouDo: string;
  whatToCover: string[];
  whatToExpect: string;
  tips: string[];
}

export const ASSESSMENT_INFO_DETAILS: Record<AssessmentType, AssessmentInfo> = {
  INTRO: {
    type: 'INTRO',
    title: 'Introduction Assessment',
    subtitle: 'Tell Me About Yourself',
    modalHeader: 'Introduction Assessment',
    modalQuestion: 'What is an Introduction Assessment?',
    modalDescription:
      'This is a short introduction you present during an interview, based on your resume, recent projects, experience, and recent work. Typically, your introduction should take 3–5 minutes.',
    shortDescription:
      'Introduce yourself in a professional interview-style format covering background, skills, strengths, and career goals.',
    cardDescription:
      'This is a short introduction you present during an interview, based on your resume, recent projects, experience, and recent work. Typically, your introduction should take 3–5 minutes.',
    duration: '3–5 mins',
    keyTopics: [
      'Professional Background & Experience',
      'Current & Recent Work',
      'Relevant Projects & Achievements',
      'Technical & Professional Skills',
      'Education & Qualifications',
    ],
    whatIsThis:
      'This is a short introduction you present during an interview, based on your resume, recent projects, experience, and recent work. Typically, your introduction should take 3–5 minutes.',
    whatWillYouDo:
      'You will introduce yourself in a clear and structured way, giving the interviewer an overview of your professional background and the experience most relevant to the opportunity.',
    whatToCover: [
      'Your professional background',
      'Education or relevant qualifications',
      'Career journey',
      'Recent or current experience',
      'Important projects',
      'Relevant skills',
      'Key strengths',
      'Career goals',
    ],
    whatToExpect:
      'This is usually one of the first questions in an interview. You should be able to speak about your background naturally and connect your experience to the role.',
    tips: [
      'Keep your introduction around 3–5 minutes.',
      'Start with your current project or most relevant experience.',
      'Highlight important projects and contributions.',
      'Connect your experience and skills to the role you are interviewing for.',
      'Speak naturally instead of memorizing your introduction.',
      'Keep your introduction clear, structured, and concise.',
    ],
  },
  JD_INTRO: {
    type: 'JD_INTRO',
    title: 'JD Introduction Assessment',
    subtitle: 'Job Description Introduction',
    modalHeader: 'JD Introduction Assessment',
    modalQuestion: 'What is a JD Introduction Assessment?',
    modalDescription:
      'This assessment helps you demonstrate that you understand the Job Description (JD) and can connect its requirements to your own experience, skills, and projects.',
    shortDescription:
      'Explain your understanding of the target job description and demonstrate how your background matches the role.',
    cardDescription:
      'Explain the JD, your understanding of the role, and how your experience matches it. Show that you have read and understood the position requirements.',
    duration: '3–5 mins',
    keyTopics: [
      'Role & Core Responsibilities',
      'Required Skills & Technical Qualifications',
      'Direct Experience Match',
      'How You Plan to Add Value',
    ],
    whatIsThis:
      'An assessment where you review a Job Description and explain your understanding of the role, responsibilities, required skills, and how your experience matches the position.',
    whatWillYouDo:
      'You will review the job description and explain your understanding of the role, responsibilities, required skills, and expectations.',
    whatToCover: [
      'What you understand about the role',
      'Main responsibilities',
      'Required skills and technologies',
      'Important qualifications',
      'Relevant experience from your background',
      'Projects related to the JD',
      'Areas where your skills match the role',
      'Areas where you may need to learn or improve',
    ],
    whatToExpect:
      'You will be expected to explain the JD in your own words and show how your background relates to the position. You may be asked follow-up questions about specific requirements.',
    tips: [
      'Read the JD carefully before starting.',
      'Identify the most important requirements.',
      'Focus on requirements relevant to your experience.',
      'Connect requirements to specific projects or responsibilities.',
      'Explain the JD in your own words.',
      'Don\'t simply read or repeat the JD.',
      'Be honest about skills or requirements you have not worked with.',
      'Prioritize quality over trying to mention every requirement.',
    ],
  },
  RECRUITER: {
    type: 'RECRUITER',
    title: 'Recruiter Assessment',
    subtitle: 'General Recruiter Interview',
    modalHeader: 'Recruiter Assessment',
    modalQuestion: 'What is a Recruiter Assessment?',
    modalDescription:
      'This assessment simulates an initial conversation with a recruiter. It focuses on your professional background, communication, career interests, motivation, and overall fit for the opportunity.',
    shortDescription:
      'Discuss professional background, career interests, experience, strengths, and expectations with a recruiter.',
    cardDescription:
      'Simulate an initial recruiter conversation covering your professional background, career interests, motivation, and overall fit for the opportunity.',
    duration: '~15 mins',
    keyTopics: [
      'Professional Career Overview',
      'Key Achievements & Milestones',
      'Career Interests & Trajectory',
      'Role Expectations & Motivations',
    ],
    whatIsThis:
      'This assessment simulates an initial conversation with a recruiter. It focuses on your professional background, communication, career interests, motivation, and overall fit for the opportunity.',
    whatWillYouDo:
      'You will respond to questions about your experience, career journey, interests, goals, motivation, and suitability for the role.',
    whatToCover: [
      'Professional background',
      'Career journey',
      'Current or recent experience',
      'Key skills',
      'Relevant projects',
      'Career interests',
      'Career goals',
      'Motivation for the opportunity',
      'Interest in the company or role',
      'Strengths relevant to the position',
    ],
    whatToExpect:
      'The questions are generally conversational and focus more on your overall professional profile and career fit than on deep technical details.',
    tips: [
      'Know your resume well.',
      'Keep your answers clear and concise.',
      'Be prepared to explain your career transitions.',
      'Clearly communicate your career goals.',
      'Explain why the opportunity interests you.',
      'Keep your answers professional but conversational.',
      'Be honest about your experience and expectations.',
      'Avoid giving unnecessarily long answers.',
    ],
  },
  HIRING_MANAGER: {
    type: 'HIRING_MANAGER',
    title: 'Hiring Manager Assessment',
    subtitle: 'Role Fit & Experience',
    modalHeader: 'Hiring Manager Assessment',
    modalQuestion: 'What is a Hiring Manager Assessment?',
    modalDescription:
      'This assessment simulates a deeper conversation with a hiring manager. It focuses on your experience, ownership, problem-solving, decision-making, and ability to contribute to the team.',
    shortDescription:
      'Discuss professional experience, past project impact, problem-solving approach, and how you contribute to the role.',
    cardDescription:
      'Deep discussion about your experience, ownership, problem-solving, decision-making, and ability to contribute to the team and role.',
    duration: '~15 mins',
    keyTopics: [
      'High-Impact Past Projects',
      'Contribution to Role & Team',
      'Problem-Solving Approach',
      'Handling Situations & Impact',
    ],
    whatIsThis:
      'This assessment simulates a deeper conversation with a hiring manager. It focuses on your experience, ownership, problem-solving, decision-making, and ability to contribute to the team.',
    whatWillYouDo:
      'You will discuss your previous work and explain what you did, how you approached problems, why you made certain decisions, and what you learned from the experience.',
    whatToCover: [
      'Relevant professional experience',
      'Important projects',
      'Your specific responsibilities',
      'Challenges you encountered',
      'How you solved problems',
      'Technical or business decisions you made',
      'Collaboration with team members',
      'Ownership and leadership',
      'Results and impact',
      'Lessons learned',
    ],
    whatToExpect:
      'Expect deeper questions about your experience. The interviewer may ask "Why?", "How?", "What was your role?", "What would you do differently?", or ask you to explain your decisions in more detail.',
    tips: [
      'Focus on your personal contribution.',
      'Use real examples from your experience.',
      'Explain the reasoning behind your decisions.',
      'Discuss challenges, not only successful outcomes.',
      'Highlight measurable results when possible.',
      'Be prepared for follow-up questions.',
      'Show ownership and accountability.',
      'Explain what you learned from difficult situations.',
      'Don\'t take credit for work you didn\'t personally do.',
    ],
  },
  TECHNICAL: {
    type: 'TECHNICAL',
    title: 'Technical Assessment',
    subtitle: 'Technical Interview',
    modalHeader: 'Technical Assessment',
    modalQuestion: 'What is a Technical Assessment?',
    modalDescription:
      'This assessment evaluates your technical knowledge, practical understanding, and problem-solving ability in areas relevant to the role.',
    shortDescription:
      'Demonstrate technical knowledge, programming concepts, tools, systems, and problem-solving skills related to the role.',
    cardDescription:
      'Evaluate your technical knowledge, problem-solving ability, and understanding of technologies relevant to the role you are applying for.',
    duration: '~15 mins',
    keyTopics: [
      'Technologies & Core Programming Concepts',
      'Tools & Frameworks Mastery',
      'Technical Problem-Solving Skills',
      'Role-Related Engineering Challenges',
    ],
    whatIsThis:
      'This assessment evaluates your technical knowledge, practical understanding, and problem-solving ability in areas relevant to the role.',
    whatWillYouDo:
      'You may be asked to explain technical concepts, solve problems, discuss your projects, write or review code, or work through technical scenarios.',
    whatToCover: [
      'Programming fundamentals',
      'Data structures and algorithms',
      'Frameworks and libraries',
      'Databases',
      'APIs',
      'Cloud technologies',
      'AI/ML concepts (if applicable)',
      'Testing',
      'Deployment',
      'Your project architecture',
      'Technical decisions you made',
    ],
    whatToExpect:
      'Questions can range from fundamental concepts to practical and scenario-based problems. You may also be asked to explain technologies listed on your resume or discuss how you implemented something in a project.',
    tips: [
      'Review the technical requirements in the JD.',
      'Understand the fundamentals behind the technologies you list.',
      'Be prepared to explain your own projects.',
      'Understand why you selected a particular technology or approach.',
      'Practice practical and scenario-based questions.',
      'Explain your reasoning step-by-step.',
      'Don\'t memorize definitions without understanding them.',
      'If you don\'t know something, be honest and explain how you would approach learning or solving it.',
    ],
  },
  SYSTEM_DESIGN: {
    type: 'SYSTEM_DESIGN',
    title: 'System Design Assessment',
    subtitle: 'Design a Scalable System',
    modalHeader: 'System Design Assessment',
    modalQuestion: 'What is a System Design Assessment?',
    modalDescription:
      'This assessment evaluates your ability to design a complete software or AI system and explain how the different parts work together.',
    shortDescription:
      'Demonstrate how you design and build software systems, architecture, components, databases, APIs, scalability, and reliability.',
    cardDescription:
      'Design and explain a complete software system including architecture, components, data flow, scalability, reliability, and technical decisions.',
    duration: '~15 mins',
    keyTopics: [
      'System Architecture & Components',
      'Databases & APIs Integration',
      'Scalability & Reliability Design',
      'Technical Decisions & Trade-offs',
    ],
    whatIsThis:
      'This assessment evaluates your ability to design a complete software or AI system and explain how the different parts work together.',
    whatWillYouDo:
      'You will be given a system-design problem and asked to develop a solution. You will explain the architecture, components, data flow, scalability, reliability, security, and technical decisions involved in your design.',
    whatToCover: [
      'Requirements (functional & non-functional)',
      'High-level architecture',
      'Major components',
      'APIs and services',
      'Data storage',
      'Data flow',
      'Scalability',
      'Reliability',
      'Security',
      'Performance',
      'Monitoring and observability',
      'Failure handling',
      'Technical trade-offs',
    ],
    whatToExpect:
      'You will be given a real-world design problem. You should first understand the requirements, then gradually build and explain your solution. You may be asked to change your design based on scale, performance, cost, or reliability requirements.',
    tips: [
      'Start by clarifying the requirements.',
      'Don\'t jump directly into technologies.',
      'Explain your architecture step-by-step.',
      'Separate functional and non-functional requirements.',
      'Think about scalability and reliability.',
      'Consider security from the beginning.',
      'Explain important trade-offs.',
      'Think about failure scenarios.',
      'Discuss monitoring and observability.',
      'Start with a simple design and add complexity only when needed.',
      'Be prepared to explain why you made each major design decision.',
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
