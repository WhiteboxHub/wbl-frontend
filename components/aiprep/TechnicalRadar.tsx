"use client";

import { Radar, RadarChart, PolarAngleAxis, PolarGrid, ResponsiveContainer, Tooltip } from "recharts";
import type { ScoresBreakdown } from "@/types/aiprep";

const axes = [
  ["LLM Architecture", "ai_engineering", "llm_knowledge"],
  ["RAG Systems", "ai_engineering", "rag_understanding"],
  ["ML Fundamentals", "core_engineering", "ml_fundamentals"],
  ["System Design", "core_engineering", "system_design"],
  ["Code Quality", "core_engineering", "code_quality"],
  ["AI Ethics & Safety", "ai_engineering", "ethics"],
] as const;

export function TechnicalRadar({ scores }: { scores: ScoresBreakdown }) {
  const data = axes.flatMap(([label, category, key]) => {
    const value = scores[category]?.sub_scores[key];
    return typeof value === "number" ? [{ label, value }] : [];
  });
  if (data.length < 3) return <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><h2 className="text-lg font-bold text-gray-900 dark:text-white">Technical radar</h2><p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Technical radar data is not available for this assessment.</p></section>;
  return <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><h2 className="text-lg font-bold text-gray-900 dark:text-white">Technical radar</h2><div className="mt-4 h-80" aria-label="Technical assessment radar chart"><ResponsiveContainer width="100%" height="100%"><RadarChart data={data}><PolarGrid /><PolarAngleAxis dataKey="label" tick={{ fontSize: 12 }} /><Tooltip /><Radar name="Score" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} /></RadarChart></ResponsiveContainer></div></section>;
}
