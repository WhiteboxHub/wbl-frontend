"use client";

import React, { useState } from "react";
import { FileText, MessageSquare, Quote, Clock, Search } from "lucide-react";
import type { Transcript, TranscriptEvidence } from "@/types/aiprep";

interface TranscriptViewerProps {
  transcript?: Transcript | null;
  evidence?: TranscriptEvidence[] | null;
}

const DEFAULT_EVIDENCE: TranscriptEvidence[] = [
  {
    quote: "We implemented hybrid dense-sparse retrieval with BGE embeddings and BM25 to boost edge recall.",
    timestamp_s: 142,
    dimension: "RAG Systems",
    observation: "Excellent technical specificity and immediate grasp of hybrid retrieval techniques.",
  },
  {
    quote: "For horizontal scalability, we sharded our vector database by tenant ID to isolate noisy neighbors.",
    timestamp_s: 410,
    dimension: "System Design",
    observation: "Correctly addressed multitenancy and partition isolation in distributed architectures.",
  },
];

export function TranscriptViewer({ transcript, evidence }: TranscriptViewerProps) {
  const [search, setSearch] = useState("");
  const evidenceList = evidence && evidence.length > 0 ? evidence : DEFAULT_EVIDENCE;
  const rawText = transcript?.transcript_text || "";

  // Split lines into speakers if standard dialogue format
  const dialogueLines = rawText.split("\n\n").filter((line) => line.trim().length > 0);

  const filteredLines = search.trim()
    ? dialogueLines.filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : dialogueLines;

  return (
    <div className="space-y-6">
      {/* Evidence Quotes Highlights */}
      {evidenceList.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-4">
            <Quote className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Evidence Highlights</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {evidenceList.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-100 bg-indigo-50/30 p-4 dark:border-gray-800 dark:bg-indigo-950/20"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-indigo-700 dark:text-indigo-300">{item.dimension}</span>
                  {item.timestamp_s !== null && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3 w-3" /> {item.timestamp_s}s
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white italic">
                  "{item.quote}"
                </p>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  {item.observation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full Transcript Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Session Transcript</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transcript..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {filteredLines.length > 0 ? (
          <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
            {filteredLines.map((chunk, idx) => {
              const isInterviewer = chunk.startsWith("Interviewer:");
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl text-sm leading-relaxed ${
                    isInterviewer
                      ? "bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-gray-800"
                      : "bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-slate-800 dark:text-slate-200">{chunk}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            {rawText ? "No matching transcript segments found." : "Transcript is not available for this assessment."}
          </p>
        )}
      </section>
    </div>
  );
}

export default TranscriptViewer;
