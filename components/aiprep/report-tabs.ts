/**
 * Shared report-tab definitions.
 * Single source of truth for labels, URL query params, and ordering.
 */

export const REPORT_TABS = [
  { label: "Evaluation", queryParam: "evaluation" },
  { label: "Details",    queryParam: "details" },
] as const;

export type PrimaryReportTab = typeof REPORT_TABS[number]["label"];
export type ReportTab =
  | "Evaluation"
  | "Details"
  | "Overview"
  | "Performance"
  | "Technical"
  | "Communication"
  | "Coaching"
  | "Transcript"
  | "Next Steps";

/** Resolve a raw ?tab= query-param string → ReportTab label (falls back to Evaluation) */
export function tabFromParam(param: string | null | undefined): ReportTab {
  if (!param) return "Evaluation";
  const p = param.toLowerCase().trim();
  if (p === "evaluation" || p === "overview") return "Evaluation";
  if (p === "details") return "Details";
  if (p === "transcript") return "Transcript";
  if (
    ["performance", "technical", "communication", "coaching", "next-steps"].includes(p)
  ) {
    return "Details";
  }
  return "Evaluation";
}

/** Resolve a ReportTab label → URL query-param value */
export function paramFromTab(tab: ReportTab): string {
  if (tab === "Evaluation" || tab === "Overview") return "evaluation";
  if (tab === "Details") return "details";
  if (tab === "Transcript") return "transcript";
  return "evaluation";
}

