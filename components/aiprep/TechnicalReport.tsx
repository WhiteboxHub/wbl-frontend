"use client";

import { useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { type NormalizedReport, formatBand, bandColor } from "@/types/aiprep-report";

interface Props {
  report: NormalizedReport;
}

function Badge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${bandColor(status)}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {formatBand(status)}
    </span>
  );
}

type ModalState =
  | { type: "depth"; title: string; content: string }
  | { type: "strengths"; title: string; items: string[] }
  | { type: "improvements"; title: string; items: string[] }
  | { type: "validation"; topic: string; reason?: string }
  | null;

export default function TechnicalReport({ report }: Props) {
  const { scores, technical_analysis, gaps_to_validate, transcript_evidence } = report;

  const [activeModal, setActiveModal] = useState<ModalState>(null);

  // Close modal on Escape key and prevent background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [activeModal]);

  const overallBand = scores?.overall_band || report.overall_readiness;

  const strengths = technical_analysis?.strengths ?? [];
  const displayedStrengths = strengths.slice(0, 3);

  const improvements = technical_analysis?.areas_for_improvement ?? [];
  const displayedImprovements = improvements.slice(0, 3);

  const validationTopics = gaps_to_validate ?? [];
  const techEvidence = transcript_evidence?.filter(e =>
    e.dimension?.toLowerCase().includes("tech")
  ) ?? [];

  const hasContent = Boolean(
    technical_analysis?.summary ||
    strengths.length > 0 ||
    improvements.length > 0 ||
    validationTopics.length > 0
  );

  if (!hasContent) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Technical analysis will appear when the evaluation is complete.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-slate-950">Technical Analysis</h2>
        <p className="text-sm text-slate-500">
          A detailed analysis of your technical performance across key areas.
        </p>
      </div>

      {/* 2. Compact Technical Assessment Card */}
      {technical_analysis?.summary && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-600" />
              <h3 className="text-base font-bold text-slate-900">Technical Assessment</h3>
            </div>
            {overallBand && <Badge status={overallBand} />}
          </div>

          <p className="text-sm leading-relaxed text-slate-700">
            {technical_analysis.summary}
          </p>

          {technical_analysis.depth_assessment && (
            <div className="mt-3.5 rounded-lg bg-slate-50 border border-slate-100 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Architectural Depth
                </p>
                <p className="text-xs text-slate-600 italic line-clamp-2">
                  {technical_analysis.depth_assessment}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveModal({
                    type: "depth",
                    title: "Architectural Depth Assessment",
                    content: technical_analysis.depth_assessment!,
                  })
                }
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                View details <ArrowRight className="size-3" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* 3. Strengths + Areas to Improve Side-by-Side */}
      {(strengths.length > 0 || improvements.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* Strengths Card */}
          {strengths.length > 0 && (
            <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm min-h-[220px]">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Strengths</h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {strengths.length}
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {displayedStrengths.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <Check className="size-2 stroke-[3]" />
                      </span>
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {strengths.length > 3 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveModal({
                        type: "strengths",
                        title: `Strengths (${strengths.length})`,
                        items: strengths,
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    View all {strengths.length} strengths <ArrowRight className="size-3" />
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Areas to Improve Card */}
          {improvements.length > 0 && (
            <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm min-h-[220px]">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <AlertCircle className="size-4" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Areas to Improve</h3>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    {improvements.length}
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {displayedImprovements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[9px] font-extrabold leading-none">
                        !
                      </span>
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {improvements.length > 3 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveModal({
                        type: "improvements",
                        title: `Areas to Improve (${improvements.length})`,
                        items: improvements,
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    View all {improvements.length} areas to improve <ArrowRight className="size-3" />
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* 4. Compact Areas to Validate Grid */}
      {validationTopics.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <HelpCircle className="size-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Areas to Validate</h3>
            </div>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
              {validationTopics.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {validationTopics.map((gap, i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setActiveModal({
                    type: "validation",
                    topic: gap.topic ?? "Validation Topic",
                    reason: gap.reason,
                  })
                }
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-violet-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                    <HelpCircle className="size-3.5" />
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                    {gap.topic}
                  </h4>
                </div>
                <ArrowRight className="size-3.5 shrink-0 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 5. Transcript Evidence (if available) */}
      {techEvidence.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h3 className="text-base font-bold text-slate-900">Transcript Evidence</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {techEvidence.length} {techEvidence.length === 1 ? "quote" : "quotes"}
            </span>
          </div>
          <div className="space-y-2.5">
            {techEvidence.map((ev, i) => (
              <div key={i} className="rounded-lg bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-xs">
                <p className="italic text-slate-700">"{ev.quote}"</p>
                {ev.observation && <p className="mt-1 text-slate-500">{ev.observation}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Progressive Disclosure Modal ─────────────────────────────────────── */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5 min-w-0">
                {activeModal.type === "depth" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Sparkles className="size-4" />
                  </div>
                )}
                {activeModal.type === "strengths" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                  </div>
                )}
                {activeModal.type === "improvements" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <AlertCircle className="size-4" />
                  </div>
                )}
                {activeModal.type === "validation" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <HelpCircle className="size-4" />
                  </div>
                )}
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {activeModal.type === "validation" ? activeModal.topic : activeModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed text-slate-700">
              {activeModal.type === "depth" && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Full Depth Assessment
                  </p>
                  <p className="leading-relaxed text-slate-700">
                    {activeModal.content}
                  </p>
                </div>
              )}

              {activeModal.type === "strengths" && (
                <ul className="space-y-3">
                  {activeModal.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3.5"
                    >
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="flex-1 text-xs text-slate-800 leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {activeModal.type === "improvements" && (
                <ul className="space-y-3">
                  {activeModal.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3.5"
                    >
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold leading-none">
                        !
                      </span>
                      <span className="flex-1 text-xs text-slate-800 leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {activeModal.type === "validation" && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Existing LLM-generated reason
                  </p>
                  {activeModal.reason ? (
                    <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                      <p className="text-xs leading-relaxed text-slate-800">
                        {activeModal.reason}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400">
                      No specific validation reason provided for this topic.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
