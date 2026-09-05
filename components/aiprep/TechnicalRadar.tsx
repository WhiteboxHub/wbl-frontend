"use client";

import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ScoresBreakdown } from "@/types/aiprep";

interface TechnicalRadarProps {
  scores?: ScoresBreakdown | Record<string, number> | null;
  compact?: boolean;
}

const DEFAULT_RADAR_DATA = [
  { label: "LLM Architecture", value: 88 },
  { label: "RAG Systems", value: 82 },
  { label: "ML Fundamentals", value: 79 },
  { label: "System Design", value: 85 },
  { label: "Code Quality", value: 90 },
  { label: "AI Ethics", value: 80 },
];

export function TechnicalRadar({ scores, compact = false }: TechnicalRadarProps) {
  let chartData = DEFAULT_RADAR_DATA;

  if (scores) {
    if ("ai_engineering" in scores || "core_engineering" in scores) {
      const breakdown = scores as ScoresBreakdown;
      const mapped = [
        {
          label: "LLM Architecture",
          value: breakdown.ai_engineering?.sub_scores?.llm_knowledge ?? 88,
        },
        {
          label: "RAG Systems",
          value: breakdown.ai_engineering?.sub_scores?.rag_understanding ?? 82,
        },
        {
          label: "ML Fundamentals",
          value: breakdown.core_engineering?.sub_scores?.ml_fundamentals ?? 79,
        },
        {
          label: "System Design",
          value: breakdown.core_engineering?.sub_scores?.system_design ?? 85,
        },
        {
          label: "Code Quality",
          value: breakdown.core_engineering?.sub_scores?.code_quality ?? 90,
        },
        {
          label: "AI Ethics",
          value: breakdown.ai_engineering?.sub_scores?.ethics ?? 80,
        },
      ];
      chartData = mapped;
    } else {
      const flat = scores as Record<string, number>;
      const keys = Object.keys(flat);
      if (keys.length > 0) {
        chartData = keys.map((k) => ({
          label: k,
          value: Number(flat[k]) || 0,
        }));
      }
    }
  }

  return (
    <div
      className={`w-full ${
        compact ? "h-64" : "h-80"
      } flex items-center justify-center`}
      aria-label="Technical assessment radar chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius={compact ? "65%" : "72%"}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: "#64748b", fontSize: compact ? 10 : 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#94a3b8", fontSize: 9 }}
            axisLine={false}
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
          <Radar
            name="Score"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2}
            fill="#818cf8"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
export default TechnicalRadar;
