"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

const tracks = [
  ["TECHNICAL", "Technical Interview", "Deep technical questions, data structures, algorithms, and engineering depth."],
  ["SYSTEM_DESIGN", "System Design", "Architecture, distributed systems, scalability, and trade-offs."],
  ["GENERAL_INTRO", "General Introduction", "Background, projects, problem solving, and behavioral alignment."],
  ["JOB_DESCRIPTION_INTRO", "Job Description Introduction", "Practice an introduction tailored to a role and its requirements."],
  ["RECRUITER", "Recruiter Screen", "Initial screening, communication, background, and compensation expectations."],
  ["HIRING_MANAGER", "Hiring Manager Round", "Leadership, cultural fit, ownership, and engineering impact."],
] as const;

export default function AIPrepAssessmentPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("TECHNICAL");

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-8 pt-32 sm:px-8 lg:px-16">
      <section className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600">1</span><div><h1 className="font-bold text-slate-950">Temporary Interview Practice</h1><p className="text-xs text-slate-400">Select a track to verify the WBL AI Prep integration.</p></div></div><button type="button" onClick={() => router.push("/user_dashboard/wbl-smartprep")} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</button></div>
      </section>
      <section className="mx-auto mt-6 max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-950">Select Assessment Track</h2><p className="mt-1 text-sm text-slate-600">Choose a practice track. This temporary screen only verifies the local WBL integration; it does not begin recording, processing, or a report workflow.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">{tracks.map(([value, title, detail]) => <button key={value} type="button" onClick={() => setSelected(value)} className={`relative rounded-xl border p-4 text-left transition ${selected === value ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500" : "border-slate-200 hover:border-slate-300"}`}><h3 className="text-sm font-bold text-slate-950">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{detail}</p>{selected === value && <CheckCircle2 className="absolute right-4 top-4 h-4 w-4 text-indigo-600" />}</button>)}</div>
      </section>
    </main>
  );
}
