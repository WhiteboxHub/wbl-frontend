export type AssessmentType =
  | 'INTRO'
  | 'JD_INTRO'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'TECHNICAL'
  | 'SYSTEM_DESIGN'
  | string;

export const NO_PAUSE_ASSESSMENT_TYPES: ReadonlyArray<AssessmentType> = [
  'INTRO',
  'JD_INTRO',
];

export type MediaType = 'VIDEO' | 'AUDIO' | 'VIDEO_AUDIO' | 'AUDIO_ONLY' | string;

export type AssessmentMode = MediaType;

export interface AssessmentCardMeta {
  type: AssessmentType;
  title: string;
  description: string;
  timeLimit: string;
  questionCount: string;
  pauseAllowed: boolean;
  requiresJd: boolean;
}

export interface AssessmentQuestion {
  id?: number;
  question_id?: number;
  question_text: string;
  category?: string;
  sub_category?: string | null;
  difficulty_level?: string;
  is_active?: boolean;
}

export interface CreateAssessmentRequest {
  candidate_id?: number;
  assessment_type: AssessmentType;
  media_type?: MediaType;
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
  assessment_type?: string;
  media_type?: string;
  job_description?: string | null;
  questions?: AssessmentQuestion[];
}

export type AssessmentStatus = "IN_PROGRESS" | "EVALUATING" | "COMPLETED" | "FAILED" | string;

export interface AssessmentSummary {
  id: number;
  assessment_uuid?: string | null;
  assessment_type: string;
  media_type: string;
  status: AssessmentStatus;
  started_at?: string | null;
  created_at?: string | null;
  job_description?: string | null;
}

export interface AssessmentDetail extends AssessmentSummary {
  candidate_id: number;
  completed_at?: string | null;
  job_description?: string | null;
  youtube_url?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  data?: Record<string, unknown> | null;
  report?: Record<string, unknown> | null;
  questions?: AssessmentQuestion[];
}

export interface ReadinessCheck {
  eligible: boolean;
  candidate_id: number;
  message?: string | null;
  llm_check: { is_configured: boolean; message?: string | null };
  resume_check: { has_resume: boolean; has_parsed_json: boolean; message?: string | null };
}

export interface AssessmentListResponse {
  items: AssessmentSummary[];
  total?: number;
  count?: number;
}

export interface HardwareCheckResults {
  browser_info: string;
  os_info: string;
  camera_permission: boolean;
  mic_permission: boolean;
  speaker_ok: boolean;
  bandwidth_kbps: number;
  analytics_consent: boolean;
  assessment_type: string;
  audio_enabled: boolean;
  video_enabled: boolean;
  jd_text: string;
}



