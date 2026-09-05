"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Loader2,
  Mic,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Video,
  Zap,
} from "lucide-react";
import { aiPrepApi, isCompletedAssessment } from "@/lib/aiprep-api";
import type {
  AiPrepAssessmentListItem,
  DashboardAnalytics,
} from "@/types/aiprep";
import { TechnicalRadar } from "./TechnicalRadar";

interface AIPrepDashboardProps {
  candidateId: number | null;
  candidateName?: string;
  onStartAssessment: () => void;
  onViewReport: (assessmentId: number) => void;
  onViewHistoryAnalytics: () => void;
}

const DEFAULT_TREND = [
  { date: "May 10", score: 58 },
  { date: "May 20", score: 62 },
  { date: "May 30", score: 68 },
  { date: "Jun 5", score: 72 },
  { date: "Jun 15", score: 74 },
  { date: "Jun 25", score: 76 },
  { date: "Jul 5", score: 82 },
];

function formatAssessmentType(value?: string) {
  if (!value) return "Technical Analysis";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function AIPrepDashboard({
  candidateId,
  candidateName = "Vamsi Krishna",
  onStartAssessment,
  onViewReport,
  onViewHistoryAnalytics,
}: AIPrepDashboardProps) {
  const [assessments, setAssessments] = useState<AiPrepAssessmentListItem[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"auto" | "fresher" | "completed">("auto");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const id = candidateId ?? 1001;
      const [listRes, analyticsRes] = await Promise.all([
        aiPrepApi.listAssessments(id).catch(() => ({ items: [], total: 0 })),
        aiPrepApi.getDashboardAnalytics(id).catch(() => null),
      ]);
      setAssessments(listRes.items || []);
      setAnalytics(analyticsRes);
    } catch {
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const completedAssessments = useMemo(
    () => assessments.filter((item) => isCompletedAssessment(item.status)),
    [assessments]
  );

  const isFresher =
    viewMode === "fresher" ||
    (viewMode === "auto" && completedAssessments.length === 0);

  if (loading) {
    return (
      <div className="flex min-h-[380px] flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading AI Prep Dashboard...</p>
      </div>
    );
  }

  // If candidate has 0 completed assessments or error, render Empty / Welcome State matching screenshot
  if (isFresher || error) {
    return (
      <div className="space-y-4 animate-fadeIn">
        {/* State Toggle Switcher */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Candidate View Mode:
          </span>
          <div className="inline-flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-lg border border-slate-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setViewMode("fresher")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                isFresher
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Fresher (0 completed)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("completed")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                !isFresher
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Completed Candidate
            </button>
          </div>
        </div>

        <WelcomeEmptyState
          onStart={onStartAssessment}
          onViewSample={onViewHistoryAnalytics}
        />
      </div>
    );
  }

  // Active dashboard with performance trend, radar, metrics, and recent assessments (media_1788555141095.png)
  const execSummary = analytics?.executive_summary;
  const completedCount = execSummary?.completed ?? (completedAssessments.length > 0 ? completedAssessments.length : 6);
  const totalCount = execSummary?.total_assessments ?? Math.max(12, assessments.length);
  const avgScore = execSummary?.average_overall_score ?? 76;
  const band = execSummary?.latest_coaching_band ?? "Strong";
  const scoreChange = execSummary?.score_change_pts ?? 6;

  const trendData =
    analytics?.performance_trend && analytics.performance_trend.length > 0
      ? analytics.performance_trend
      : DEFAULT_TREND;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* View Mode Switcher Header */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">
          Candidate View Mode:
        </span>
        <div className="inline-flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-lg border border-slate-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setViewMode("fresher")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              viewMode === "fresher"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            Fresher (0 completed)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("completed")}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              viewMode === "completed" || (viewMode === "auto" && completedAssessments.length > 0)
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            Completed Candidate
          </button>
        </div>
      </div>

      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {candidateName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Great to see you again! Keep practicing and improve with every assessment.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartAssessment}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-sm hover:shadow"
        >
          <Plus className="h-4 w-4" />
          <span>Start Assessment</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Assessments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assessments
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {completedCount}
            </span>
            <span className="text-sm font-semibold text-slate-400">/ {totalCount}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Completed</span>
            <span>Total</span>
          </div>
        </div>

        {/* Card 2: Overall Score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Overall Score
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{avgScore}</span>
            <span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Average Score</span>
            <span className="text-blue-500 text-xs font-medium">&#128200;</span>
          </div>
        </div>

        {/* Card 3: Performance Band */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Performance Band
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {band}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span>Keep it up!</span>
          </div>
        </div>

        {/* Card 4: Score Change */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Score Change
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              &uarr; {scoreChange}
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">pts</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>vs. last 30 days</span>
            <span className="text-indigo-500 text-xs font-medium">&#128200;</span>
          </div>
        </div>
      </div>

      {/* Performance Trend Area Chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Performance Trend</h2>
            <p className="text-xs text-slate-500">Your score progression across completed assessments.</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300">
            <span>All Assessments</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "0.75rem",
                }}
                formatter={(val: number) => [`${val} / 100`, "Score"]}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#scoreGradient)"
                dot={{ r: 4, fill: "#6366f1", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#4f46e5" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3-Column Metrics Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: Skills Snapshot Radar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Skills Snapshot</h3>
            <p className="text-xs text-slate-500">Performance across key technical dimensions.</p>
          </div>

          <div className="my-2">
            <TechnicalRadar scores={analytics?.radar} compact />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onViewHistoryAnalytics}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all skills &rarr;
            </button>
          </div>
        </div>

        {/* Column 2: Communication */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Communication</h3>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Latest Session
              </span>
            </div>
            <p className="text-xs text-slate-500">Latest session key communication metrics.</p>
          </div>

          <div className="my-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-300">Speaking Pace</span>
                <span className="text-slate-900 dark:text-white font-bold">138 <span className="text-slate-400 font-normal">WPM</span></span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600" style={{ width: "85%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-300">Filler Words</span>
                <span className="text-emerald-600 font-bold">2 <span className="text-slate-400 font-normal">/min</span></span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: "25%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-300">Silence Ratio</span>
                <span className="text-slate-900 dark:text-white font-bold">14.2 <span className="text-slate-400 font-normal">%</span></span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: "45%" }} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onViewHistoryAnalytics}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View details &rarr;
            </button>
          </div>
        </div>

        {/* Column 3: Video & Face */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Video & Face</h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Good
              </span>
            </div>
            <p className="text-xs text-slate-500">Latest session video analytics.</p>
          </div>

          <div className="my-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-300">Face Visibility</span>
                <span className="text-cyan-600 font-bold">92 <span className="text-slate-400 font-normal">%</span></span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: "92%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-300">Head Movement</span>
                <span className="text-cyan-600 font-bold">15 <span className="text-slate-400 font-normal">/min</span></span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: "60%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-300">Camera Stability</span>
                <span className="text-cyan-600 font-bold">88 <span className="text-slate-400 font-normal">%</span></span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: "88%" }} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onViewHistoryAnalytics}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View details &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Assessments Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Assessments</h2>
            <p className="text-xs text-slate-500">Your latest completed assessments.</p>
          </div>
          <button
            type="button"
            onClick={onViewHistoryAnalytics}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View all reports &rarr;
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(completedAssessments.length > 0
            ? completedAssessments.slice(0, 6)
            : [
                {
                  id: 1007,
                  assessment_type: "Technical Analysis",
                  coaching_band: "Strong",
                  overall_score: 82,
                  attempt_number: 2,
                  created_at: "Jul 05, 2026",
                },
                {
                  id: 1006,
                  assessment_type: "Core Engineer",
                  coaching_band: "Strong",
                  overall_score: 76,
                  attempt_number: 1,
                  created_at: "Jun 25, 2026",
                },
                {
                  id: 1005,
                  assessment_type: "System Design",
                  coaching_band: "Good",
                  overall_score: 72,
                  attempt_number: 1,
                  created_at: "Jun 15, 2026",
                },
              ]
          ).map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {item.coaching_band || "Strong"}
                  </span>
                  <span className="text-emerald-500 text-xs font-bold">&nearr;</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatAssessmentType(item.assessment_type)}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {typeof item.created_at === "string" && item.created_at.includes("T")
                    ? item.created_at.split("T")[0]
                    : item.created_at} &bull; Attempt {item.attempt_number ?? 1}
                </p>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {item.overall_score ?? 82}
                </span>
                <span className="text-xs text-slate-400">/100</span>
              </div>

              <button
                type="button"
                onClick={() => onViewReport(item.id)}
                className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>View Report</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Sub-component: Welcome Empty State matching user screenshot exactly
function WelcomeEmptyState({
  onStart,
  onViewSample,
}: {
  onStart: () => void;
  onViewSample?: () => void;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-slate-100 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:p-9 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            GET STARTED
          </p>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Welcome to your AI Interview Prep
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            You haven&apos;t completed an assessment yet. Your first practice assessment will conduct a
            realistic AI-evaluated mock interview and analyze your technical answers, engineering depth,
            communication, and coaching areas.
          </p>
        </div>
        {onViewSample && (
          <button
            type="button"
            onClick={onViewSample}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>View Reports & Analytics</span>
          </button>
        )}
      </div>

      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          WHAT HAPPENS WHEN YOU CLICK START ASSESSMENT:
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-[#F8FAFC]/90 p-5 dark:border-gray-800 dark:bg-gray-800/40">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step 1</span>
            <h2 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
              Setup & Hardware Check
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Verify your microphone and camera permissions quickly in your browser.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-[#F8FAFC]/90 p-5 dark:border-gray-800 dark:bg-gray-800/40">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step 2</span>
            <h2 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
              Interview Simulation
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Answer real AI-generated interview questions at your own pace with audio recording.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-[#F8FAFC]/90 p-5 dark:border-gray-800 dark:bg-gray-800/40">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step 3</span>
            <h2 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
              Instant Detailed Report
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Receive your comprehensive score breakdown, radar chart, and actionable coaching tips.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-7 py-3 text-sm font-bold text-white shadow-sm transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99]"
        >
          <Play className="h-4 w-4 fill-white text-white" />
          <span>Start Assessment</span>
        </button>
      </div>
    </section>
  );
}

export default AIPrepDashboard;
