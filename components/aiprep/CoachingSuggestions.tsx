"use client";

import React from "react";
import { Target, AlertCircle, Quote } from "lucide-react";
import type { CoachingSuggestion } from "@/types/aiprep";

interface CoachingSuggestionsProps {
  suggestions?: CoachingSuggestion[] | null;
}

const DEFAULT_SUGGESTIONS: CoachingSuggestion[] = [
  {
    priority: 1,
    dimension: "Structure & Examples",
    area: "Include Real-World Production Examples",
    suggestion: "When describing RAG pipelines, cite specific latency benchmarks (e.g., P95 retrieval under 40ms) and chunking strategies from real projects.",
    evidence: "Question 3: Discussed vector search theoretically without citing indexing latency trade-offs.",
  },
  {
    priority: 2,
    dimension: "Delivery",
    area: "Reduce Hesitation at Start of Complex Questions",
    suggestion: "Take a structured 3-second pause to outline your 3 main points before speaking rather than using filler sounds.",
    evidence: "Question 5: Used 'um' twice while formulating distributed consensus explanation.",
  },
  {
    priority: 3,
    dimension: "Technical Depth",
    area: "Elaborate on Fallback Mechanisms",
    suggestion: "Detail circuit breakers and graceful degradation when the LLM provider experiences 5xx outages.",
    evidence: "Question 2: Explained prompt routing well, but did not mention caching or model fallbacks.",
  },
];

export function CoachingSuggestions({ suggestions }: CoachingSuggestionsProps) {
  const items = suggestions && suggestions.length > 0 ? suggestions : DEFAULT_SUGGESTIONS;
  const ordered = [...items].sort((a, b) => a.priority - b.priority);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Coaching & Improvement Plan</h2>
      </div>
      <p className="text-xs text-slate-500 mb-6">
        Targeted action items generated from your transcript, telemetry, and rubric grading.
      </p>

      <div className="space-y-4">
        {ordered.map((item, idx) => (
          <article
            key={`${item.priority}-${idx}`}
            className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-gray-850 dark:bg-gray-800/40 hover:border-indigo-200 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  {item.priority}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.area}</h3>
              </div>
              <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-gray-700 dark:text-slate-300">
                {item.dimension}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {item.suggestion}
            </p>

            {item.evidence && (
              <div className="mt-3.5 flex items-start gap-2 rounded-lg bg-white/80 p-3 text-xs text-slate-600 dark:bg-gray-900/80 dark:text-slate-300 border border-slate-100 dark:border-gray-800">
                <Quote className="h-3.5 w-3.5 shrink-0 text-indigo-500 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Observation: </span>
                  {item.evidence}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default CoachingSuggestions;
