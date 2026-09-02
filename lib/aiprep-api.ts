import { apiFetch } from "@/lib/api";
import type {
  AiPrepAssessment,
  AiPrepAssessmentListResponse,
  AiPrepCompletedAssessmentView,
  AiPrepReport,
  AiPrepScoreDimension,
  AudioTelemetry,
  DashboardAnalytics,
  JsonObject,
  Transcript,
  VisionTelemetry,
} from "@/types/aiprep";

const COMPLETED_STATUS = "COMPLETED";

const isRecord = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNotFoundError = (value: unknown): boolean =>
  isRecord(value) && value.status === 404;

const asStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const toDisplayLabel = (value: string): string =>
  value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

const scoreDimensionsFromReport = (report: AiPrepReport): AiPrepScoreDimension[] =>
  Object.entries(report.scores_breakdown_json).flatMap(([key, value]) => {
    if (!isRecord(value) || typeof value.score !== "number") return [];
    return [{ label: toDisplayLabel(key), score: value.score }];
  });

const improvementAreasFromReport = (report: AiPrepReport): string[] => {
  const technicalAreas = isRecord(report.technical_analysis_json)
    ? asStringList(report.technical_analysis_json.areas_for_improvement)
    : [];

  if (technicalAreas.length > 0) return technicalAreas;

  if (!Array.isArray(report.improvements_json)) return [];
  return report.improvements_json.flatMap((item) => {
    if (!isRecord(item) || typeof item.topic !== "string") return [];
    return [item.topic];
  });
};

export const aiPrepApi = {
  listAssessments(candidateId: number): Promise<AiPrepAssessmentListResponse> {
    return apiFetch(`ai-prep/assessments?candidate_id=${encodeURIComponent(candidateId)}&limit=100`, { cache: "no-store" });
  },

  getAssessment(assessmentId: number): Promise<AiPrepAssessment> {
    return apiFetch(`ai-prep/assessments/${encodeURIComponent(assessmentId)}`, { cache: "no-store" });
  },

  getReport(assessmentId: number): Promise<AiPrepReport> {
    return apiFetch(`ai-prep/assessments/${encodeURIComponent(assessmentId)}/report`, { cache: "no-store" });
  },

  getTranscript(assessmentId: number): Promise<Transcript | null> {
    return apiFetch(`ai-prep/assessments/${encodeURIComponent(assessmentId)}/transcript`);
  },

  getAudioTelemetry(assessmentId: number): Promise<AudioTelemetry | null> {
    return apiFetch(`ai-prep/assessments/${encodeURIComponent(assessmentId)}/audio-telemetry`);
  },

  getVisionTelemetry(assessmentId: number): Promise<VisionTelemetry | null> {
    return apiFetch(`ai-prep/assessments/${encodeURIComponent(assessmentId)}/vision-telemetry`);
  },

  getDashboardAnalytics(candidateId: number): Promise<DashboardAnalytics> {
    return apiFetch(`ai-prep/analytics/dashboard/${encodeURIComponent(candidateId)}`);
  },
};

export async function loadCompletedAssessment(
  assessmentId: number,
): Promise<AiPrepCompletedAssessmentView> {
  const assessment = await aiPrepApi.getAssessment(assessmentId);
  let report: AiPrepReport | null = null;

  try {
    report = await aiPrepApi.getReport(assessmentId);
  } catch (error: unknown) {
    if (!isNotFoundError(error)) throw error;
    // A completed assessment can be finalized before its report is available.
  }

  return {
    assessment,
    report,
    dimensions: report ? scoreDimensionsFromReport(report) : [],
    strengths:
      report && isRecord(report.technical_analysis_json)
        ? asStringList(report.technical_analysis_json.strengths)
        : [],
    improvementAreas: report ? improvementAreasFromReport(report) : [],
  };
}

export function isCompletedAssessment(status: string): boolean {
  return status === COMPLETED_STATUS;
}
