export type AssessmentStatus =
  | "TESTING"
  | "IN_PROGRESS"
  | "PAUSED"
  | "PROCESSING"
  | "EVALUATING"
  | "COMPLETED"
  | "FAILED"
  | string;

export type AssessmentTrackType =
  | "TECHNICAL"
  | "SYSTEM_DESIGN"
  | "INTRO"
  | "GENERAL_INTRO"
  | "JD_INTRO"
  | "JOB_DESCRIPTION_INTRO"
  | "RECRUITER"
  | "HIRING_MANAGER"
  | string;

export interface AiPrepAssessmentListItem {
  id: number;
  assessment_type: string;
  assessment_mode?: string;
  media_type?: string;
  status: AssessmentStatus;
  attempt_number?: number;
  coaching_band?: string | null;
  overall_score?: number | null;
  created_at: string;
}

export interface AiPrepAssessment {
  id: number;
  candidate_id: number;
  assessment_type: string;
  assessment_mode?: string;
  media_type?: string;
  status: AssessmentStatus;
  attempt_number?: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  coaching_band?: string | null;
  youtube_url?: string | null;
  data?: JsonObject | null;
  report?: JsonObject | null;
}

export interface AiPrepAssessmentListResponse {
  items: AiPrepAssessmentListItem[];
  total: number;
}

export type JsonObject = Record<string, unknown>;

export interface ScoreCategory {
  score: number;
  sub_scores: Record<string, number>;
}

export interface ScoresBreakdown {
  ai_engineering?: ScoreCategory;
  core_engineering?: ScoreCategory;
  non_technical?: ScoreCategory;
  business_acumen?: ScoreCategory;
  [key: string]: ScoreCategory | undefined;
}

export interface TechnicalAnalysis {
  summary?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
  depth_assessment?: string | null;
}

export interface NonTechnicalAnalysis {
  communication_summary?: string;
  structure_quality?: string;
  confidence_notes?: string;
}

export interface CoachingSuggestion {
  priority: number;
  dimension: string;
  area: string;
  suggestion: string;
  evidence: string;
}

export interface TranscriptEvidence {
  quote: string;
  timestamp_s: number | null;
  dimension: string;
  observation: string;
}

export interface Transcript {
  id: number;
  assessment_id: number;
  transcript_text: string;
  word_timestamps_json?: JsonObject | null;
  segments?: Array<{
    speaker?: string;
    text: string;
    timestamp?: string | number;
  }>;
  created_at: string;
}

export interface AudioTelemetry {
  id: number;
  assessment_id: number;
  avg_volume_db: number;
  background_noise_level: string;
  clipping_detected: boolean;
  silence_ratio_pct: number;
  filler_words_per_min: number;
  speaking_pace_wpm: number;
  created_at: string;
}

export interface VisionTelemetry {
  id: number;
  assessment_id: number;
  face_visible_pct: number;
  head_nods_count: number;
  frame_stability_score: number;
  created_at: string;
}

export interface DashboardAssessment {
  id: number;
  assessment_type: string;
  status: AssessmentStatus;
  coaching_band: string | null;
  overall_score: number | null;
  attempt_number?: number;
  created_at: string;
}

export interface CommunicationTrendPoint {
  assessment_id?: number;
  date: string;
  score?: number;
  wpm: number;
  filler_per_min: number;
  silence_pct: number;
}

export interface PerformanceTrendPoint {
  date: string;
  score: number;
  assessment_id?: number;
}

export interface DashboardAnalytics {
  executive_summary: {
    total_assessments: number;
    completed: number;
    latest_coaching_band: string | null;
    band_trend: string[];
    average_overall_score: number;
    score_change_pts?: number;
    assessments: DashboardAssessment[];
  };
  radar: Record<string, number>;
  communication_trend: CommunicationTrendPoint[];
  performance_trend?: PerformanceTrendPoint[];
}

export interface AiPrepQuestionReview {
  question_id: number;
  question_text: string;
  candidate_answer?: string;
  rubric_score?: number;
  feedback?: string;
}

export interface AiPrepReport {
  id: number;
  assessment_id: number;
  overall_score: number;
  coaching_band: string;
  attempt_number?: number;
  duration?: string;
  questions_count?: number;
  assessment_code?: string;
  scores_breakdown_json: ScoresBreakdown;
  technical_analysis_json: TechnicalAnalysis;
  non_technical_analysis_json: NonTechnicalAnalysis;
  coaching_suggestions_json: CoachingSuggestion[] | null;
  transcript_evidence_json: TranscriptEvidence[] | null;
  questions_json?: AiPrepQuestionReview[] | null;
  improvements_json?: unknown;
  created_at: string;
}

export interface AiPrepScoreDimension {
  label: string;
  score: number;
}

export interface AiPrepCompletedAssessmentView {
  assessment: AiPrepAssessment;
  report: AiPrepReport | null;
  dimensions: AiPrepScoreDimension[];
  strengths: string[];
  improvementAreas: string[];
}

export interface AiPrepHistoryEntry {
  assessment: AiPrepAssessmentListItem;
  completedAssessment: AiPrepCompletedAssessmentView | null;
}
