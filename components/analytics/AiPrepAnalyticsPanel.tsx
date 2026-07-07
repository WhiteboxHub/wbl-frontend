"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle2, XCircle, Terminal, BarChart2,
  Search, Filter, RefreshCw, X, BookOpen, Play, Star, Activity, Download, AlertTriangle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { EnhancedMetricCard } from "@/components/EnhancedMetricCard";
import { AGGridTable } from "@/components/AGGridTable";
import { ColDef } from "ag-grid-community";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CandidateRow {
  id: number;
  user_id: string;
  name: string;
  email: string;
  wbl_email: string;
  login_count: number;
  created_at: string;
  last_login: string;
  extraction_status: string;
  has_resume: boolean;
  has_project: boolean;
  intro_attempts: number;
  best_intro_score: number;
  intro_score?: number;
  latest_intro_score: number;
  intro_passed: boolean;
  latest_video_url: string | null;
  questions_answered: number;
  avg_interview_score: number;
  interview_sessions: number;
  interview_completed: boolean;
  case_studies_generated: number;
  prep_completion_pct: number;
  prep_status_label: string;
}

interface Summary {
  total_candidates: number;
  active_this_week: number;
  intro_pass_rate: number;
  interview_completion_rate: number;
  total_case_studies: number;
  intro_passed_count: number;
  interview_completed_count: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return "—"; }
};

// ── AG-Grid Custom Renderers ──────────────────────────────────────────────────

const NameRenderer = (params: any) => {
  return (
    <div className="flex items-center gap-2 h-full">
      <span className="text-gray-300 font-mono text-[10px]">▶</span>
      <span className="font-semibold text-gray-800 dark:text-white text-xs">{params.value || "—"}</span>
    </div>
  );
};

const VideoRenderer = (params: any) => {
  const val = params.value;
  if (!val) {
    return <span className="text-xs text-gray-300 dark:text-gray-500 font-medium italic">—</span>;
  }
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        params.context?.setActiveVideoUrl(val);
      }}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border border-gray-200 dark:border-darklight text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-dark hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-200 dark:hover:border-violet-800 transition-all shadow-sm"
    >
      <Play className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500 mr-1" />
      Watch
    </button>
  );
};

const ScoreRenderer = (params: any) => {
  const score = params.value || 0;
  const passed = params.data?.intro_passed;
  if (!score) return <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">—</span>;
  const color =
    score >= 75 ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400" :
    score >= 50 ? "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400" :
                  "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {score}
      {passed
        ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        : <XCircle className="w-3 h-3 text-rose-500" />
      }
    </span>
  );
};

const SuccessRateRenderer = (params: any) => {
  const rate = params.value || 0;
  return (
    <div className="flex items-center gap-2 h-full">
      <div className="w-16 bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-gray-200/50 dark:border-darklight">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-300"
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-8 text-right">
        {Math.round(rate)}%
      </span>
    </div>
  );
};

// ── Detail Drawer ─────────────────────────────────────────────────────────────

const DetailDrawer = ({
  userId, onClose
}: {
  userId: string; onClose: () => void;
}) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/analytics/ai-prep/candidates/${userId}`)
      .then(setDetail)
      .catch((err) => {
        toast.error("Failed to load candidate detail");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const introChartData = detail?.intro_history?.map((e: any, i: number) => ({
    attempt: `Attempt ${i + 1}`,
    score: e.score,
    passed: e.passed ? 1 : 0,
  })) || [];

  const interviewChartData = detail?.interview_history?.map((e: any, i: number) => ({
    q: `Q${i + 1}`,
    score: (e.score || 0) * 10,
  })) || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-dark border-l border-gray-200 dark:border-darklight z-50 flex flex-col shadow-2xl"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-darklight">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white text-base">
              {detail?.candidate?.name || "Candidate Detail"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{detail?.candidate?.email || userId}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {detail && (
              <button
                onClick={() => {
                  const c = detail.candidate;
                  const rows = [
                    ["Candidate Name", c.name],
                    ["Email", c.email],
                    ["WBL Email", c.wbl_email],
                    ["Login Count", c.login_count],
                    ["Joined Date", fmtDate(c.created_at)],
                    ["Last Active Date", fmtDate(c.last_login)],
                    [],
                    ["INTRO SCORE TIMELINE"],
                    ["Attempt", "Score", "Passed", "Date"],
                    ...(detail.intro_history || []).map((h: any, i: number) => [
                      `Attempt ${i + 1}`,
                      h.score,
                      h.passed ? "Yes" : "No",
                      fmtDate(h.created_at)
                    ]),
                    [],
                    ["INTERVIEW PRACTICE BREAKDOWN"],
                    ["Question", "Score", "Feedback", "Date"],
                    ...(detail.interview_history || []).map((h: any, i: number) => [
                      `Question ${i + 1}`,
                      h.score * 10,
                      h.feedback?.overall_critique || h.feedback?.critique || "",
                      fmtDate(h.created_at)
                    ])
                  ];
                  const csvContent = rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `${c.name.replace(/\s+/g, "_")}_ai_prep_report.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                title="Download Candidate CSV Report"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : detail ? (
            <>
              {/* Candidate meta */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["WBL Email", detail.candidate.wbl_email],
                  ["Login Count", detail.candidate.login_count],
                  ["Joined", fmtDate(detail.candidate.created_at)],
                  ["Last Active", fmtDate(detail.candidate.last_login)],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-2.5 border border-gray-100 dark:border-darklight">
                    <p className="text-gray-400 dark:text-gray-500 font-semibold">{k}</p>
                    <p className="text-gray-800 dark:text-white font-bold mt-0.5">{v || "—"}</p>
                  </div>
                ))}
              </div>

              {/* Intro score timeline */}
              {introChartData.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-500" />
                    Intro Score History
                  </h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={introChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="attempt" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Tooltip
                        contentStyle={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8 }}
                        labelStyle={{ color: "#1e293b", fontWeight: "bold" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(262, 83%, 58%)"
                        strokeWidth={2}
                        dot={{ fill: "hsl(262, 83%, 58%)", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Interview answer scores */}
              {interviewChartData.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-amber-500" />
                    Interview Answer Scores
                  </h4>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={interviewChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="q" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Tooltip
                        contentStyle={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8 }}
                      />
                      <Bar dataKey="score" fill="hsl(280, 85%, 57%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* CoderPad removed */}

              {/* Case Studies */}
              {detail.case_studies?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    Case Studies Generated ({detail.case_studies.length})
                  </h4>
                  <div className="space-y-1.5">
                    {detail.case_studies.slice(0, 5).map((cs: any, i: number) => (
                      <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-darklight text-xs">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{cs.topic || "Custom"}</span>
                        <span className="text-gray-400">{fmtDate(cs.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm text-center pt-10">Failed to load details.</p>
          )}
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px]"
      />
    </AnimatePresence>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

interface AiPrepAnalyticsPanelProps {
  active?: boolean;
}

export function AiPrepAnalyticsPanel({ active = true }: AiPrepAnalyticsPanelProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterIntroPassed, setFilterIntroPassed] = useState<boolean | null>(null);
  const [filterInterviewDone, setFilterInterviewDone] = useState<boolean | null>(null);
  const [filterActiveWeek, setFilterActiveWeek] = useState<boolean | null>(null);

  // Drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Video modal state
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, c] = await Promise.all([
        apiFetch("/analytics/ai-prep/summary"),
        apiFetch(`/analytics/ai-prep/candidates`),
      ]);
      setSummary(s);
      setCandidates(c.candidates || []);
    } catch (e: any) {
      setError(e.message || "Failed to load AI Prep analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) {
      loadData();
    }
  }, [active, loadData]);

  // Client-side search + filters
  const displayed = useMemo(() => {
    let rows = [...candidates];

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.wbl_email || "").toLowerCase().includes(q)
      );
    }

    if (filterIntroPassed === true) {
      rows = rows.filter(r => r.intro_passed);
    } else if (filterIntroPassed === false) {
      rows = rows.filter(r => !r.intro_passed);
    }

    if (filterInterviewDone === true) {
      rows = rows.filter(r => r.interview_completed);
    } else if (filterInterviewDone === false) {
      rows = rows.filter(r => !r.interview_completed);
    }

    if (filterActiveWeek === true) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      rows = rows.filter(r => r.last_login && new Date(r.last_login) >= weekAgo);
    }

    return rows;
  }, [candidates, search, filterIntroPassed, filterInterviewDone, filterActiveWeek]);

  // AG-Grid Columns Definitions
  const analyticsColumnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Candidate Name",
        field: "name",
        cellRenderer: NameRenderer,
        minWidth: 180,
        flex: 2,
        pinned: "left",
      },
      {
        headerName: "Email",
        field: "email",
        minWidth: 200,
        flex: 2,
      },
      {
        headerName: "Video",
        field: "latest_video_url",
        cellRenderer: VideoRenderer,
        minWidth: 110,
        sortable: false,
        filter: false,
      },
      {
        headerName: "Intro Score",
        field: "intro_score",
        cellRenderer: ScoreRenderer,
        minWidth: 120,
        type: "numericColumn",
      },
      {
        headerName: "Intro Status",
        field: "intro_passed",
        minWidth: 130,
        cellRenderer: (params: any) => {
          const status = params.data?.intro_status;
          if (!status || status === "not_started") return <span className="text-gray-400 dark:text-gray-600 font-medium">—</span>;
          const passed = params.value;
          if (passed) {
            return <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Cleared</span>;
          }
          return <span className="text-rose-500 dark:text-rose-400 font-semibold">Not Cleared</span>;
        }
      },
      {
        headerName: "Login Count",
        field: "login_count",
        minWidth: 110,
        type: "numericColumn",
      },
      {
        headerName: "Last Active",
        field: "last_login",
        minWidth: 180,
        valueFormatter: (params) => {
          if (!params.value) return "—";
          try {
            return new Date(params.value).toLocaleString();
          } catch {
            return params.value;
          }
        }
      }
    ],
    []
  );

  const exportCSV = () => {
    const headers = [
      "Name","Email","WBL Email","Login Count","Last Active",
      "Resume","Project","Intro Attempts","Intro Score","Intro Cleared",
      "Questions Answered","Avg Interview Score","Interview Completed",
      "Case Studies","Prep Status"
    ];
    const rows = displayed.map(r => [
      r.name, r.email, r.wbl_email, r.login_count, fmtDate(r.last_login),
      r.has_resume ? "Yes" : "No", r.has_project ? "Yes" : "No",
      r.intro_attempts, r.intro_score, r.intro_passed ? "Yes" : "No",
      r.questions_answered, r.avg_interview_score, r.interview_completed ? "Yes" : "No",
      r.case_studies_generated,
      r.prep_status_label
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ai-prep-analytics.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const FilterToggle = ({
    label, value, onChange, trueColor,
  }: {
    label: string; value: boolean | null; onChange: (v: boolean | null) => void; trueColor?: string;
  }) => {
    const display = value === null ? label : value ? `✓ ${label}` : `✗ ${label}`;
    const style =
      value === true  ? `${trueColor || "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400 font-semibold"}` :
      value === false ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400 font-semibold" :
                        "bg-white border-gray-200 text-gray-500 dark:bg-dark dark:border-darklight dark:text-gray-400 hover:text-gray-800 dark:hover:text-white";
    
    const cycle = () => {
      if (value === null) onChange(true);
      else if (value === true) onChange(false);
      else onChange(null);
    };

    return (
      <button
        onClick={cycle}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${style}`}
      >
        {display}
      </button>
    );
  };

  if (error) {
    return (
      <div className="text-center space-y-4 bg-white dark:bg-dark p-8 rounded-xl border border-gray-200 dark:border-darklight shadow-sm max-w-sm mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
        <p className="text-gray-700 dark:text-gray-300 font-bold">{error}</p>
        <button onClick={loadData} className="px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      {loading && summary === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white dark:bg-dark border border-gray-200 dark:border-darklight shadow-sm animate-pulse" />
          ))}
        </div>
      ) : summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <EnhancedMetricCard
            title="Total Candidates"
            value={summary.total_candidates}
            icon={<Users className="size-4" />}
            variant="purple"
          />
          <EnhancedMetricCard
            title="Active This Week"
            value={summary.active_this_week}
            icon={<Activity className="size-4" />}
            variant="purple"
          />
          <EnhancedMetricCard
            title="Intro Pass Rate"
            value={`${summary.intro_pass_rate}%`}
            icon={<Star className="size-4" />}
            variant="purple"
          />
          <EnhancedMetricCard
            title="Interview Done"
            value={`${summary.interview_completion_rate}%`}
            icon={<CheckCircle2 className="size-4" />}
            variant="purple"
          />
          <EnhancedMetricCard
            title="Case Studies"
            value={summary.total_case_studies}
            icon={<BookOpen className="size-4" />}
            variant="purple"
          />
        </motion.div>
      )}

      {/* ── Filters & Search ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-darklight p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center shadow-sm"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-darklight rounded-lg text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300 transition-all shadow-sm"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <FilterToggle
            label="Intro Cleared"
            value={filterIntroPassed}
            onChange={setFilterIntroPassed}
            trueColor="bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400 font-semibold"
          />
          <FilterToggle
            label="Interview Done"
            value={filterInterviewDone}
            onChange={setFilterInterviewDone}
          />
          <FilterToggle
            label="Active 7d"
            value={filterActiveWeek}
            onChange={setFilterActiveWeek}
            trueColor="bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-950/20 dark:border-cyan-900 dark:text-cyan-400 font-semibold"
          />
          {(filterIntroPassed !== null || filterInterviewDone !== null || filterActiveWeek !== null) && (
            <button
              onClick={() => { setFilterIntroPassed(null); setFilterInterviewDone(null); setFilterActiveWeek(null); }}
              className="text-xs text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 font-semibold transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-darklight text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-xs font-semibold transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </motion.div>

      {/* ── AG Grid Table ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark rounded-xl border border-gray-200 dark:border-darklight shadow-sm overflow-hidden"
      >
        <AGGridTable
          title="AI Prep Candidate Analytics"
          rowData={displayed}
          columnDefs={analyticsColumnDefs}
          height="450px"
          showAddButton={false}
          getRowNodeId={(data) => String(data.user_id || data.id)}
          onRowClicked={(data) => setSelectedUserId(data.user_id)}
          defaultColDef={{ editable: false, sortable: true, filter: true }}
          context={{ setActiveVideoUrl }}
          loading={loading}
          hideToolbar={false}
        />
      </motion.div>

      {/* ── Video Player Modal Overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {activeVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-dark rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full border border-gray-200 dark:border-darklight"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-darklight">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-violet-500 fill-violet-500" />
                  <h3 className="font-extrabold text-gray-800 dark:text-white text-sm">Intro Practice Playback</h3>
                </div>
                <button
                  onClick={() => setActiveVideoUrl(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-slate-950 flex items-center justify-center aspect-video relative">
                <video
                  src={activeVideoUrl}
                  controls
                  autoPlay
                  className="max-h-[50vh] w-full"
                />
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-darklight text-center">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                  MPEG/WebM format · Evaluate Eye Contact & Talking Pace
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Candidate Detail Drawer ───────────────────────────────────────── */}
      {selectedUserId && (
        <DetailDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
