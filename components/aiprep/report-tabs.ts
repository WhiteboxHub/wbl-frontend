/**
 * Shared report-tab definitions.
 * Single source of truth for labels, URL query params, and ordering.
 */

export const REPORT_TABS = [
  { label: "Overview", queryParam: "overview" },
  { label: "Details",  queryParam: "details" },
] as const;

export type PrimaryReportTab = typeof REPORT_TABS[number]["label"];
export type ReportTab =
  | "Overview"
  | "Details"
  | "Audio Analysis"
  | "Video Analysis"
  | "Evaluation"
  | "Performance"
  | "Technical"
  | "Communication"
  | "Coaching"
  | "Transcript"
  | "Next Steps";

/** Resolve a raw ?tab= query-param string → ReportTab label (falls back to Overview) */
export function tabFromParam(param: string | null | undefined): ReportTab {
  if (!param) return "Overview";
  const p = param.toLowerCase().trim();
  if (p === "overview" || p === "evaluation") return "Overview";
  if (p === "details") return "Details";
  // TEMPORARILY DISABLED: Redirect to Overview while Audio Analysis tab is disabled
  // if (p === "audio-analysis" || p === "audio_analysis") return "Audio Analysis";
  // if (p === "video-analysis" || p === "video_analysis") return "Video Analysis";
  // if (p === "analysis" || p === "delivery") return "Audio Analysis";
  if (
    ["transcript", "performance", "technical", "communication", "coaching", "next-steps"].includes(p)
  ) {
    return "Details";
  }
  return "Overview";
}

/** Resolve a ReportTab label → URL query-param value */
export function paramFromTab(tab: ReportTab): string {
  if (tab === "Overview" || tab === "Evaluation") return "overview";
  if (tab === "Details" || tab === "Transcript") return "details";
  if (tab === "Audio Analysis") return "audio-analysis";
  if (tab === "Video Analysis") return "video-analysis";
  return "overview";
}


