"use client";

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const tracks = [
  ["TECHNICAL", "Technical Interview", "Deep technical questions, data structures, algorithms, and engineering depth."],
  ["SYSTEM_DESIGN", "System Design", "Architecture, distributed systems, scalability, and trade-offs."],
  ["GENERAL_INTRO", "General Introduction", "Background, projects, problem solving, and behavioral alignment."],
  ["JOB_DESCRIPTION_INTRO", "Job Description Introduction", "Practice an introduction tailored to a role and its requirements."],
  ["RECRUITER", "Recruiter Screen", "Initial screening, communication, background, and compensation expectations."],
  ["HIRING_MANAGER", "Hiring Manager Round", "Leadership, cultural fit, ownership, and engineering impact."],
] as const;

export function TemporaryInterviewPractice({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState("TECHNICAL");

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600">1</span>
            <div><h1 className="font-bold text-slate-950 dark:text-white">Temporary Interview Practice</h1><p className="text-xs text-slate-400">Select a track to verify the WBL AI Prep integration.</p></div>
          </div>
          <button type="button" onClick={onBack} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-300"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</button>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Select Assessment Track</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Choose a practice track. This temporary screen only verifies the local WBL integration; it does not begin recording, processing, or a report workflow.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">{tracks.map(([value, title, detail]) => <button key={value} type="button" onClick={() => setSelected(value)} className={`relative rounded-xl border p-4 text-left transition ${selected === value ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500 dark:bg-indigo-950/20" : "border-slate-200 hover:border-slate-300 dark:border-gray-700"}`}><h3 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{detail}</p>{selected === value && <CheckCircle2 className="absolute right-4 top-4 h-4 w-4 text-indigo-600" />}</button>)}</div>
      </section>
    </div>
  );
}
