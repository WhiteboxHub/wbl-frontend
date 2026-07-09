"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColDef } from "ag-grid-community";
import {
  SearchIcon,
  Users,
  CheckCircle2,
  Clock,
  BarChart2,
  Mic,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { AGGridTable } from "@/components/AGGridTable";
import { EnhancedMetricCard } from "@/components/EnhancedMetricCard";
import { Input } from "@/components/admin_ui/input";
import { Loader } from "@/components/admin_ui/loader";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DimensionScores {
  communication_clarity: number;
  confidence: number;
  structure: number;
  professionalism: number;
  fluency: number;
  completeness: number;
  technical_articulation: number;
  speaking_quality: number;
}

interface AiPrepUserRow {
  session_id: string;
  wbl_email: string;
  name: string;
  login_count: number;
  last_active: string | null;
  extraction_status: string;
  intro_attempts: number;
  intro_best_score: number | null;
  intro_latest_score: number | null;
  intro_passed: boolean;
  last_intro_date: string | null;
  video_url: string | null;
  scores: Partial<DimensionScores>;
  overall_score: number | null;
  strengths: string[];
  weaknesses: string[];
  ai_suggestions: string[];
  improvement_areas: string[];
  created_at: string | null;
}

interface ReportSummary {
  total_users: number;
  users_with_intro: number;
  active_last_7_days: number;
  avg_intro_score: number;
  pass_rate_pct: number;
  users: AiPrepUserRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Score Badge renderer
// ─────────────────────────────────────────────────────────────────────────────
const ScoreBadge = ({ value }: { value: number | null }) => {
  if (value === null || value === undefined)
    return <span className="text-gray-400 text-xs">—</span>;
  const color =
    value >= 80
      ? "bg-green-100 text-green-700"
      : value >= 60
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {value}
    </span>
  );
};

const PassBadge = ({ passed }: { passed: boolean }) =>
  passed ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <CheckCircle2 className="h-3 w-3" /> Pass
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      — Pending
    </span>
  );

// ─────────────────────────────────────────────────────────────────────────────
// Score bar (mini horizontal bar for dimension scores)
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-44 shrink-0 capitalize">
        {label.replace(/_/g, " ")}
      </span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 w-7 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Drawer — shown when a row is selected
// ─────────────────────────────────────────────────────────────────────────────
function DetailDrawer({
  user,
  onClose,
}: {
  user: AiPrepUserRow;
  onClose: () => void;
}) {
  const dimKeys: (keyof DimensionScores)[] = [
    "communication_clarity",
    "confidence",
    "structure",
    "professionalism",
    "fluency",
    "completeness",
    "technical_articulation",
    "speaking_quality",
  ];

  const hasScores = Object.keys(user.scores).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {user.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {user.wbl_email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {user.login_count}
              </div>
              <div className="text-xs text-blue-500 mt-0.5">Logins</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {user.intro_attempts}
              </div>
              <div className="text-xs text-purple-500 mt-0.5">Intro Attempts</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {user.intro_best_score ?? "—"}
              </div>
              <div className="text-xs text-green-500 mt-0.5">Best Score</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {user.intro_passed ? "✓" : "—"}
              </div>
              <div className="text-xs text-amber-500 mt-0.5">
                {user.intro_passed ? "Passed" : "Not yet"}
              </div>
            </div>
          </div>

          {/* Dimension scores */}
          {hasScores && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4 text-indigo-500" />
                LLM Evaluation — Dimension Scores
              </h3>
              <div className="space-y-2">
                {dimKeys.map((k) => (
                  <ScoreBar
                    key={k}
                    label={k}
                    value={user.scores[k] ?? 0}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {user.strengths.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                <Star className="h-4 w-4" /> Strengths
              </h3>
              <ul className="space-y-1">
                {user.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {user.weaknesses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Areas for Improvement
              </h3>
              <ul className="space-y-1">
                {user.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Suggestions */}
          {user.ai_suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4" /> AI Suggestions
              </h3>
              <ul className="space-y-1">
                {user.ai_suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Video URL placeholder */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Video className="h-4 w-4" /> Intro Recording
            </h3>
            {user.video_url ? (
              <a
                href={user.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                View Recording
              </a>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Video recording not available yet (Sprint 2)
              </p>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-400 border-t dark:border-gray-700 pt-3 space-y-1">
            <div>Last Active: {user.last_active ? new Date(user.last_active).toLocaleString() : "—"}</div>
            <div>Last Intro: {user.last_intro_date ? new Date(user.last_intro_date).toLocaleString() : "—"}</div>
            <div>Registered: {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Panel
// ─────────────────────────────────────────────────────────────────────────────
interface AiPrepAnalyticsPanelProps {
  active?: boolean;
}

export function AiPrepAnalyticsPanel({ active = true }: AiPrepAnalyticsPanelProps) {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [emailFilter, setEmailFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<AiPrepUserRow | null>(null);

  const showLoader = useMinimumLoadingTime(loading && !hasLoaded);

  const AI_PREP_API =
    process.env.NEXT_PUBLIC_AIPREP_API_URL ||
    "http://localhost:8000";

  // ── Fetch data from AI-Prep backend ────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("auth_token") ||
            null
          : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${AI_PREP_API}/api/analytics/ai-prep-report`, {
        headers,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`AI-Prep API error ${res.status}: ${body}`);
      }

      const data: ReportSummary = await res.json();
      setReport(data);
      setHasLoaded(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load AI-Prep analytics";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [AI_PREP_API]);

  useEffect(() => {
    if (active) loadData();
  }, [active, loadData]);

  // ── Filter rows ────────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    if (!report) return [];
    const q = emailFilter.trim().toLowerCase();
    if (!q) return report.users;
    return report.users.filter(
      (u) =>
        u.wbl_email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
    );
  }, [report, emailFilter]);

  // ── AG Grid column definitions ─────────────────────────────────────────────
  const columnDefs: ColDef[] = useMemo(
    () => [
      { field: "name", headerName: "Name", flex: 1.2 },
      { field: "wbl_email", headerName: "Email", flex: 1.5 },
      {
        field: "login_count",
        headerName: "Logins",
        flex: 0.6,
        type: "numericColumn",
      },
      {
        field: "last_active",
        headerName: "Last Active",
        flex: 1.2,
        valueFormatter: (p) => {
          if (!p.value) return "—";
          try {
            return new Date(p.value).toLocaleString();
          } catch {
            return String(p.value);
          }
        },
      },
      {
        field: "intro_attempts",
        headerName: "Intro Attempts",
        flex: 0.8,
        type: "numericColumn",
      },
      {
        field: "intro_best_score",
        headerName: "Best Score",
        flex: 0.7,
        cellRenderer: (p: { value: number | null }) => (
          <ScoreBadge value={p.value} />
        ),
      },
      {
        field: "intro_latest_score",
        headerName: "Latest Score",
        flex: 0.75,
        cellRenderer: (p: { value: number | null }) => (
          <ScoreBadge value={p.value} />
        ),
      },
      {
        field: "intro_passed",
        headerName: "Status",
        flex: 0.75,
        cellRenderer: (p: { value: boolean }) => (
          <PassBadge passed={p.value} />
        ),
      },
      {
        field: "last_intro_date",
        headerName: "Last Intro",
        flex: 1.1,
        valueFormatter: (p) => {
          if (!p.value) return "—";
          try {
            return new Date(p.value).toLocaleDateString();
          } catch {
            return String(p.value);
          }
        },
      },
      {
        field: "video_url",
        headerName: "Video",
        flex: 0.6,
        sortable: false,
        filter: false,
        cellRenderer: (p: { value: string | null }) =>
          p.value ? (
            <a
              href={p.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-xs"
            >
              View
            </a>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          ),
      },
    ],
    []
  );

  // ── Early returns ──────────────────────────────────────────────────────────
  if (!active) return null;

  if (showLoader && !hasLoaded) {
    return (
      <div className="py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary metric cards */}
      {report && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <EnhancedMetricCard
            title="Total Users"
            value={report.total_users}
            icon={<Users className="size-4" />}
            variant="blue"
          />
          <EnhancedMetricCard
            title="Intro Completed"
            value={report.users_with_intro}
            icon={<Mic className="size-4" />}
            variant="purple"
          />
          <EnhancedMetricCard
            title="Active (last 7d)"
            value={report.active_last_7_days}
            icon={<Clock className="size-4" />}
            variant="teal"
          />
          <EnhancedMetricCard
            title="Avg Intro Score"
            value={report.avg_intro_score || "—"}
            icon={<BarChart2 className="size-4" />}
            variant="indigo"
          />
          <EnhancedMetricCard
            title="Pass Rate"
            value={`${report.pass_rate_pct}%`}
            icon={<TrendingUp className="size-4" />}
            variant="green"
          />
        </div>
      )}

      {/* Filter + Refresh bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            className="pl-9"
            placeholder="Filter by name or email…"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm disabled:opacity-60 transition-colors"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Click the <strong>View</strong> (eye) icon on any row to see the full
        LLM evaluation breakdown, strengths, weaknesses, and AI suggestions.
      </p>

      {/* Data grid */}
      <AGGridTable
        title="AI-Prep Candidate Report"
        rowData={filteredRows}
        columnDefs={columnDefs}
        height="520px"
        showAddButton={false}
        getRowNodeId={(data) => String(data.session_id)}
        onRowUpdated={undefined}
        onRowDeleted={undefined}
        defaultColDef={{ editable: false, sortable: true, filter: true }}
        onRowViewed={(row: AiPrepUserRow) => setSelectedUser(row)}
      />

      {/* Detail drawer / modal */}
      {selectedUser && (
        <DetailDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
