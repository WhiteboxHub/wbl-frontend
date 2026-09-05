"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { ArrowLeft, Award, BarChart3, Clock, Eye, FileText, RefreshCw, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { aiPrepApi, MOCK_AIPREP_DATA } from "@/lib/aiprep-api";
import type { DashboardAnalytics } from "@/types/aiprep";

interface ExecutiveDashboardProps {
  embedded?: boolean;
  onBack?: () => void;
  onViewReport?: (id: number) => void;
}

export function ExecutiveDashboard({
  embedded = false,
  onBack,
  onViewReport,
}: ExecutiveDashboardProps) {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let candidateId = 1001;
      try {
        const user = (await apiFetch("user_dashboard")) as { candidate_id?: number | null };
        if (user && user.candidate_id) candidateId = user.candidate_id;
      } catch {
        // fallback to default
      }
      const analytics = await aiPrepApi.getDashboardAnalytics(candidateId);
      setData(analytics);
    } catch {
      setError("Unable to load AI Prep analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Loading AI Prep Analytics...</p>
      </div>
    );
  }

  const analyticsData = data || MOCK_AIPREP_DATA.analytics;
  const summary = analyticsData.executive_summary;

  return (
    <div className={`mx-auto max-w-7xl space-y-6 ${embedded ? "py-1" : "py-8 px-4 sm:px-6"}`}>
      {/* Top Bar / Back Navigation */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to AI Prep Dashboard
          </button>
        ) : (
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">AI Prep</p>
        )}
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports &amp; Analytics</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Executive performance summary, communication telemetry, and complete assessment history.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
              <BarChart3 className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Assessments
            </span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary.completed}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
              <Award className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Latest Coaching Band
            </span>
          </div>
          <p className="mt-4 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {summary.latest_coaching_band ?? "Strong"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Average Overall Score
            </span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary.average_overall_score} <span className="text-sm font-normal text-slate-400">/ 100</span>
          </p>
        </div>
      </div>

      {/* Communication Trend Line Chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Communication &amp; Telemetry Trend</h2>
          <p className="text-xs text-slate-500">Speaking pace (WPM), filler words frequency, and silence ratios over time.</p>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData.communication_trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "0.75rem",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line type="monotone" dataKey="wpm" stroke="#6366f1" strokeWidth={2.5} name="Speaking Pace (WPM)" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="filler_per_min" stroke="#10b981" strokeWidth={2} name="Filler Words / min" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="silence_pct" stroke="#f59e0b" strokeWidth={2} name="Silence Ratio (%)" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Assessment History Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Assessment History</h2>
          <p className="text-xs text-slate-500">Complete record of your past sessions and evaluations.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider dark:border-gray-800 dark:bg-gray-800/60">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Track</th>
                <th className="px-6 py-3 font-semibold">Score</th>
                <th className="px-6 py-3 font-semibold">Coaching Band</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {summary.assessments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">{item.created_at}</td>
                  <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">{item.assessment_type}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                    {item.overall_score !== null ? `${item.overall_score} / 100` : "—"}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {item.coaching_band ?? "Strong"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (onViewReport) onViewReport(item.id);
                        else if (typeof window !== "undefined") {
                          window.location.href = `/aiprep/reports/${item.id}`;
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <Eye className="h-3 w-3" /> View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ExecutiveDashboard;
