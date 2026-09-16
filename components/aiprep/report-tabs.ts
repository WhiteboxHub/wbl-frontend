/**
 * Shared report-tab definitions.
 * Single source of truth for labels, URL query params, and ordering.
 */

export const REPORT_TABS = [
  { label: "Overview",      queryParam: "overview" },
  { label: "Performance",   queryParam: "performance" },
  { label: "Technical",     queryParam: "technical" },
  { label: "Communication", queryParam: "communication" },
  { label: "Coaching",      queryParam: "coaching" },
  { label: "Transcript",    queryParam: "transcript" },
  { label: "Next Steps",    queryParam: "next-steps" },
] as const;

export type ReportTab = typeof REPORT_TABS[number]["label"];

/** Resolve a raw ?tab= query-param string → ReportTab label (falls back to Overview) */
export function tabFromParam(param: string | null | undefined): ReportTab {
  if (!param) return "Overview";
  const found = REPORT_TABS.find(
    (t) => t.queryParam === param.toLowerCase().trim()
  );
  return found?.label ?? "Overview";
}

/** Resolve a ReportTab label → URL query-param value */
export function paramFromTab(tab: ReportTab): string {
  return REPORT_TABS.find((t) => t.label === tab)?.queryParam ?? "overview";
}
