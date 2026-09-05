"use client";

import React from "react";
import type { ScoresBreakdown } from "@/types/aiprep";

const formatLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

interface ScoreBreakdownProps {
  scores?: ScoresBreakdown | null;
  displayMode?: "bars" | "cards" | "both";
  onViewDetails?: () => void;
}

const DEFAULT_SKILLS = [
  { label: "LLM Architecture", score: 88 },
  { label: "RAG Systems", score: 82 },
  { label: "ML Fundamentals", score: 79 },
  { label: "System Design", score: 85 },
  { label: "Code Quality", score: 90 },
  { label: "AI Ethics", score: 80 },
];

export function ScoreBreakdown({ scores, displayMode = "both", onViewDetails }: ScoreBreakdownProps) {
  let skillItems = DEFAULT_SKILLS;

  if (scores) {
    const extracted: Array<{ label: string; score: number }> = [];
    if (scores.ai_engineering?.sub_scores?.llm_knowledge) {
      extracted.push({ label: "LLM Architecture", score: scores.ai_engineering.sub_scores.llm_knowledge });
    }
    if (scores.ai_engineering?.sub_scores?.rag_understanding) {
      extracted.push({ label: "RAG Systems", score: scores.ai_engineering.sub_scores.rag_understanding });
    }
    if (scores.core_engineering?.sub_scores?.ml_fundamentals) {
      extracted.push({ label: "ML Fundamentals", score: scores.core_engineering.sub_scores.ml_fundamentals });
    }
    if (scores.core_engineering?.sub_scores?.system_design) {
      extracted.push({ label: "System Design", score: scores.core_engineering.sub_scores.system_design });
    }
    if (scores.core_engineering?.sub_scores?.code_quality) {
      extracted.push({ label: "Code Quality", score: scores.core_engineering.sub_scores.code_quality });
    }
    if (scores.ai_engineering?.sub_scores?.ethics) {
      extracted.push({ label: "AI Ethics", score: scores.ai_engineering.sub_scores.ethics });
    }
    if (extracted.length >= 3) {
      skillItems = extracted;
    }
  }

  const dimensions = scores
    ? Object.entries(scores).filter(
        (entry): entry is [string, NonNullable<ScoresBreakdown[string]>] =>
          entry[1] !== undefined && typeof entry[1].score === "number"
      )
    : [];

  return (
    <div className="space-y-6">
      {(displayMode === "bars" || displayMode === "both") && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-950 dark:text-white">Skill Breakdown</h3>
            <p className="text-xs text-slate-500">Your performance across key technical areas.</p>
          </div>

          <div className="space-y-4">
            {skillItems.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                  <span className="text-slate-900 dark:text-white font-bold">{item.score} <span className="text-slate-400 font-normal">/100</span></span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {onViewDetails && (
            <div className="mt-6 flex justify-center border-t border-slate-100 pt-4 dark:border-gray-800">
              <button
                type="button"
                onClick={onViewDetails}
                className="rounded-lg bg-slate-50 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-400"
              >
                View Performance Details
              </button>
            </div>
          )}
        </section>
      )}

      {(displayMode === "cards" || displayMode === "both") && dimensions.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-bold text-slate-950 dark:text-white mb-4">Category Dimensions</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dimensions.map(([name, dim]) => (
              <article key={name} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{formatLabel(name)}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{dim.score} <span className="text-xs font-normal text-slate-400">/ 100</span></p>
                {dim.sub_scores && Object.keys(dim.sub_scores).length > 0 && (
                  <dl className="mt-3 space-y-1.5 border-t border-slate-200/60 pt-3 text-xs dark:border-gray-700">
                    {Object.entries(dim.sub_scores).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <dt className="text-slate-500 dark:text-slate-400">{formatLabel(k)}</dt>
                        <dd className="font-semibold text-slate-800 dark:text-slate-200">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ScoreBreakdown;
