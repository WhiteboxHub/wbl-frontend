export type AssessmentType =
  | 'INTRO'
  | 'JD_INTRO'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'TECHNICAL'
  | 'SYSTEM_DESIGN';

export type AssessmentStatus =
  | 'IN_PROGRESS'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'FAILED';

export type MediaType = 'VIDEO_AUDIO' | 'AUDIO_ONLY' | 'VIDEO' | 'AUDIO' | string;

export interface AssessmentGridItem {
  id: number;
  candidate_id?: number;
  candidate_name?: string | null;
  candidate_email?: string | null;
  assessment_type: string;
  media_type: string;
  status: string;
  score?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  youtube_url?: string | null;
}

export interface AssessmentFiltersState {
  search: string;
  candidate_id?: string;
  candidate_search?: string;
  category: string;
  status: string;
  media_type?: string;
  date_operator?: string;
  date_value?: string;
  date_to?: string;
}

export interface AssessmentListApiResponse {
  items: AssessmentGridItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
