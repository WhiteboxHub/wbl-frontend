export type AssessmentStatus = "TESTING" | "IN_PROGRESS" | "PAUSED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface AiPrepAssessmentListItem {
  id: number;
  assessment_type: string;
  assessment_mode: string;
  status: AssessmentStatus;
  attempt_number: number;
  coaching_band: string | null;
  created_at: string;
}

export interface AiPrepAssessment {
  id: number;
  candidate_id: number;
  assessment_type: string;
  assessment_mode: string;
  status: AssessmentStatus;
  attempt_number: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  coaching_band: string | null;
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
  word_timestamps_json: JsonObject | null;
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
  created_at: string;
}

export interface CommunicationTrendPoint {
  assessment_id: number;
  date: string;
  wpm: number;
  filler_per_min: number;
  silence_pct: number;
}

export interface DashboardAnalytics {
  executive_summary: {
    total_assessments: number;
    completed: number;
    latest_coaching_band: string | null;
    band_trend: string[];
    average_overall_score: number;
    assessments: DashboardAssessment[];
  };
  radar: Record<string, number>;
  communication_trend: CommunicationTrendPoint[];
}

export interface AiPrepReport {
  id: number;
  assessment_id: number;
  overall_score: number;
  coaching_band: string;
  scores_breakdown_json: ScoresBreakdown;
  technical_analysis_json: TechnicalAnalysis;
  non_technical_analysis_json: NonTechnicalAnalysis;
  coaching_suggestions_json: CoachingSuggestion[] | null;
  transcript_evidence_json: TranscriptEvidence[] | null;
  improvements_json: unknown;
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
