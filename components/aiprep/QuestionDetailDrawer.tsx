"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Edit2,
  Layers,
  CheckCircle2,
  Archive,
  Trash2,
  Clock,
  Target,
  Compass,
  FileText,
  Copy,
  Check,
  Code2,
  X,
} from "lucide-react";
import { QuestionBankItem } from "@/types/aiprep";
import {
  getSubjectStyle,
  getScopeStyle,
  formatDuration,
  ALL_CONCEPTS_LIST,
  QuestionSubject,
} from "@/lib/questionBankTaxonomy";

interface QuestionDetailDrawerProps {
  question: QuestionBankItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (q: QuestionBankItem) => void;
  onDelete?: (id: number) => Promise<void> | void;
}

const CATEGORY_LABELS: Record<string, string> = {
  INTRO: "Intro Warm-up",
  JD_INTRO: "Job Description Intro",
  RECRUITER: "Recruiter Screening",
  HIRING_MANAGER: "Hiring Manager",
  SYSTEM_DESIGN: "System Design",
  TECHNICAL: "Technical Interview",
};

const DIFFICULTY_BADGES: Record<string, string> = {
  EASY: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  HARD: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  EXPERT: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
};

export const QuestionDetailDrawer: React.FC<QuestionDetailDrawerProps> = ({
  question,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !question) return null;

  const isActive = Boolean(question.is_active);
  const subject = question.subject || "AI Engineering";
  const conceptName = question.concept || "—";
  const conceptMatch = ALL_CONCEPTS_LIST.find((c) => c.name === conceptName);
  const scope = question.scope || "SPECIFIC";
  const isBroad = scope === "BROAD";
  const timeLimit = question.time_limit_seconds || 120;

  // Ground truth parsing
  let groundTruthObj: any = null;
  if (question.ground_truth) {
    if (typeof question.ground_truth === "object") {
      groundTruthObj = question.ground_truth;
    } else {
      try {
        groundTruthObj = JSON.parse(String(question.ground_truth));
      } catch {
        groundTruthObj = { raw: question.ground_truth };
      }
    }
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(question.question_text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyGroundTruth = () => {
    if (showRawJson) {
      navigator.clipboard.writeText(JSON.stringify(groundTruthObj || {}, null, 2));
    } else {
      if (
        groundTruthObj &&
        (groundTruthObj.required_evidence?.length ||
          groundTruthObj.supporting_evidence?.length ||
          groundTruthObj.negative_evidence?.length ||
          groundTruthObj.partial_credit?.length)
      ) {
        const sections: string[] = [];
        if (groundTruthObj.required_evidence?.length) {
          sections.push(
            "REQUIRED EVIDENCE:\n" +
              groundTruthObj.required_evidence.map((item: string) => `• ${item}`).join("\n")
          );
        }
        if (groundTruthObj.supporting_evidence?.length) {
          sections.push(
            "SUPPORTING EVIDENCE:\n" +
              groundTruthObj.supporting_evidence.map((item: string) => `• ${item}`).join("\n")
          );
        }
        if (groundTruthObj.negative_evidence?.length) {
          sections.push(
            "NEGATIVE EVIDENCE:\n" +
              groundTruthObj.negative_evidence.map((item: string) => `• ${item}`).join("\n")
          );
        }
        if (groundTruthObj.partial_credit?.length) {
          sections.push(
            "PARTIAL CREDIT:\n" +
              groundTruthObj.partial_credit.map((item: string) => `• ${item}`).join("\n")
          );
        }
        navigator.clipboard.writeText(sections.join("\n\n"));
      } else {
        navigator.clipboard.writeText(
          typeof question.ground_truth === "string"
            ? question.ground_truth
            : JSON.stringify(groundTruthObj || {}, null, 2)
        );
      }
    }
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Dimmed Backdrop Click Area */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Card (Matching Candidate Marketing reference) */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-3xl sm:max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-blue-200 dark:border-blue-900 dark:bg-gray-900 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 shrink-0 flex items-center justify-between border-b border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-darklight dark:via-dark dark:to-darklight px-4 py-3 sm:px-6 z-10">
          <div className="flex items-center gap-2">
            <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-sm sm:text-base md:text-lg font-bold text-transparent">
              Question Bank ({question.id}) - Details &amp; Ground Truth
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-slate-800 cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X size={18} className="sm:h-5 sm:w-5" />
          </button>
        </div>

          {/* Body Content */}
          <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-7 py-6">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${getSubjectStyle(subject)}`}>
                {subject}
              </span>
              <span
                className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                  DIFFICULTY_BADGES[question.difficulty_level] || "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {question.difficulty_level}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${getScopeStyle(
                  scope
                )}`}
              >
                {isBroad ? <Compass className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                {scope}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                {formatDuration(timeLimit)}
              </span>
            </div>

            {/* Classification Card */}
            <div className="rounded-xl border border-gray-200/90 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block font-medium">Category:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                    {CATEGORY_LABELS[question.category] || question.category}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block font-medium">Sub-category / Concept:</span>
                  <span className="font-bold text-[#0e527a] dark:text-teal-400 text-sm">
                    {conceptName}
                  </span>
                </div>
                {conceptMatch?.rawClubbedItems && (
                  <div className="sm:col-span-2 border-t border-gray-200/60 pt-2.5 dark:border-gray-700/60">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mb-1">
                      Clubbed Topics:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {conceptMatch.rawClubbedItems.map((item) => (
                        <span
                          key={item}
                          className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Question Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Question Prompt
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0e527a] hover:text-[#0c4465] dark:text-teal-400"
                >
                  {copiedPrompt ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPrompt ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold leading-relaxed text-gray-900 shadow-2xs dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-100">
                {question.question_text}
              </div>
            </div>

            {/* Ideal Answer Ground Truth */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Ideal Answer Ground Truth / Evaluation Rubric
                </span>
                {groundTruthObj && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyGroundTruth}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-gray-900 dark:text-gray-300 shadow-2xs transition-colors cursor-pointer"
                      title={showRawJson ? "Copy JSON" : "Copy Rubric"}
                    >
                      {copiedJson ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-gray-900 dark:text-gray-300 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>{showRawJson ? "Structured View" : "JSON View"}</span>
                    </button>
                  </div>
                )}
              </div>

              {showRawJson ? (
                <pre className="min-h-48 max-h-96 overflow-y-auto rounded-xl bg-gray-950 p-4 font-mono text-xs text-emerald-400 whitespace-pre-wrap">
                  {JSON.stringify(groundTruthObj, null, 2)}
                </pre>
              ) : groundTruthObj && (groundTruthObj.required_evidence?.length || groundTruthObj.supporting_evidence?.length || groundTruthObj.negative_evidence?.length || groundTruthObj.partial_credit?.length) ? (
                <div className="space-y-3.5">
                  {/* Required Evidence */}
                  {Array.isArray(groundTruthObj.required_evidence) && groundTruthObj.required_evidence.length > 0 && (
                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                          Required Evidence ({groundTruthObj.required_evidence.length})
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {groundTruthObj.required_evidence.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-emerald-950 dark:text-emerald-100">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Supporting Evidence */}
                  {Array.isArray(groundTruthObj.supporting_evidence) && groundTruthObj.supporting_evidence.length > 0 && (
                    <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                          Supporting Evidence ({groundTruthObj.supporting_evidence.length})
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {groundTruthObj.supporting_evidence.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-blue-950 dark:text-blue-100">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Negative Evidence / Red Flags */}
                  {Array.isArray(groundTruthObj.negative_evidence) && groundTruthObj.negative_evidence.length > 0 && (
                    <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                          Negative Evidence ({groundTruthObj.negative_evidence.length})
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {groundTruthObj.negative_evidence.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-rose-950 dark:text-rose-100">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Partial Credit */}
                  {Array.isArray(groundTruthObj.partial_credit) && groundTruthObj.partial_credit.length > 0 && (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                          Partial Credit Criteria ({groundTruthObj.partial_credit.length})
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {groundTruthObj.partial_credit.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-32 rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-800 shadow-2xs dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-200 whitespace-pre-wrap">
                  {groundTruthObj?.rubric ||
                    (groundTruthObj?.milestones &&
                      groundTruthObj.milestones.map((m: any) => `${m.label || "Level " + m.level}: ${m.description}`).join("\n")) ||
                    (typeof question.ground_truth === "string" ? question.ground_truth : null) ||
                    "No ground truth rubric specified for this question."}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-7 py-4 dark:border-gray-800 dark:bg-gray-900">
            {onDelete && (
              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await onDelete(question.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer mr-auto"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(question);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0e527a] px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#0c4465] transition-colors cursor-pointer"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Question</span>
            </button>
          </div>
        </div>
      </div>,
    document.body
  );
};
