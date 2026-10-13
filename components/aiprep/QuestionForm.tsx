"use client";

import React, { useState, useEffect } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import {
  QuestionBankItem,
  QuestionCategory,
  QuestionDifficulty,
} from "@/types/aiprep";
import { SUBJECT_CONCEPTS_MAP, type QuestionSubject } from "@/lib/questionBankTaxonomy";

export interface QuestionFormData {
  id?: number;
  category: QuestionCategory;
  sub_category?: string | null;
  subject?: string | null;
  concept?: string | null;
  scope?: "BROAD" | "SPECIFIC";
  time_limit_seconds?: number;
  difficulty_level: QuestionDifficulty;
  question_text: string;
  ground_truth?: any;
  is_active: number | boolean;
}

interface QuestionFormProps {
  initialData?: QuestionBankItem | null;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: number) => Promise<void> | void;
}

const CATEGORIES: { value: QuestionCategory; label: string }[] = [
  { value: "INTRO", label: "Intro" },
  { value: "JD_INTRO", label: "Job Description Intro" },
  { value: "RECRUITER", label: "Recruiter Screening" },
  { value: "HIRING_MANAGER", label: "Hiring Manager" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "TECHNICAL", label: "Technical" },
];

const DIFFICULTIES: { value: QuestionDifficulty; label: string }[] = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const labelCls =
  "block text-[11px] font-bold uppercase tracking-wider text-[#2a5a6b] mb-1";
const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#2a5a6b] focus:ring-2 focus:ring-[#2a5a6b]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-teal-500";
const sectionHeaderCls =
  "text-xs font-bold text-[#2a5a6b] uppercase tracking-wider pb-1.5 mb-3 border-b-2 border-[#2a5a6b]/30";

export const QuestionForm: React.FC<QuestionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
}) => {
  const isEditMode = Boolean(initialData);

  const [category, setCategory] = useState<QuestionCategory>("TECHNICAL");
  const [subCategory, setSubCategory] = useState<string>("");
  const [subject, setSubject] = useState<string>("AI Engineering");
  const [concept, setConcept] = useState<string>("Python & Data Manipulation");
  const [scope, setScope] = useState<"BROAD" | "SPECIFIC">("SPECIFIC");
  const [duration, setDuration] = useState<number>(120);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("MEDIUM");
  const [questionText, setQuestionText] = useState("");
  const [groundTruthText, setGroundTruthText] = useState("");
  const [isGroundTruthCopied, setIsGroundTruthCopied] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category);
      setDifficulty(initialData.difficulty_level);
      setSubject(initialData.subject || "AI Engineering");
      setConcept(initialData.concept || initialData.sub_category || "Python & Data Manipulation");
      setScope(initialData.scope === "BROAD" ? "BROAD" : "SPECIFIC");
      setDuration(Number(initialData.time_limit_seconds) || 120);
      setSubCategory(initialData.sub_category || initialData.concept || "");
      setQuestionText(initialData.question_text || "");
      const existingGroundTruth = (initialData as any).ground_truth;
      setGroundTruthText(existingGroundTruth == null ? "" : typeof existingGroundTruth === "string" ? (() => { try { return JSON.stringify(JSON.parse(existingGroundTruth), null, 2); } catch { return existingGroundTruth; } })() : JSON.stringify(existingGroundTruth, null, 2));
      setIsActive(Boolean(initialData.is_active));
    } else {
      setCategory("TECHNICAL");
      setDifficulty("MEDIUM");
      setSubject("AI Engineering");
      setConcept("Python & Data Manipulation");
      setScope("SPECIFIC");
      setDuration(120);
      setSubCategory("");
      setQuestionText("");
      setGroundTruthText("");
      setIsActive(true);
    }
    setErrors({});
  }, [initialData]);

  const handleCategoryChange = (newCat: QuestionCategory) => {
    setCategory(newCat);
    setSubCategory("");
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!category) errs.category = "Category is required.";
    if (category === "TECHNICAL" && !subCategory.trim())
      errs.sub_category = "Sub-category is required for Technical questions.";
    if (!difficulty) errs.difficulty = "Difficulty level is required.";
    if (!questionText.trim() || questionText.trim().length < 5)
      errs.question_text = "Question must be at least 5 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      let groundTruth: any = null;
      if (groundTruthText.trim()) {
        try { groundTruth = JSON.parse(groundTruthText); }
        catch {
          setErrors({ _form: "Ground Truth must be valid JSON. Please correct the JSON syntax before saving." });
          return;
        }
      }
      await onSubmit({
        ...(initialData?.id ? { id: initialData.id } : {}),
        category,
        sub_category: category === "TECHNICAL" ? concept.trim() : (subCategory.trim() || null),
        subject: subject || null,
        concept: concept || null,
        scope,
        time_limit_seconds: Math.max(1, Number(duration) || 120),
        difficulty_level: difficulty,
        question_text: questionText.trim(),
        ground_truth: groundTruth,
        is_active: isActive ? 1 : 0,
      });
    } catch (err: any) {
      setErrors({ _form: err.message || "Failed to save question." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col min-h-0 overflow-hidden h-full"
    >
      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        {errors._form && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {errors._form}
          </div>
        )}

        {/* Compact metadata grid matching the original Question Bank editor */}
        <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
          <div>
            <label htmlFor="form-category" className={labelCls}>Category <span className="text-red-500">*</span></label>
            <select id="form-category" value={category} onChange={(e) => handleCategoryChange(e.target.value as QuestionCategory)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>
          <div>
            <label htmlFor="form-difficulty" className={labelCls}>Difficulty <span className="text-red-500">*</span></label>
            <select id="form-difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)} className={inputCls}>
              {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            {errors.difficulty && <p className="mt-1 text-xs text-red-500">{errors.difficulty}</p>}
          </div>
          <div>
            <label htmlFor="form-subject" className={labelCls}>Subject (Discipline) <span className="text-red-500">*</span></label>
            <select id="form-subject" value={subject} onChange={(e) => { const next = e.target.value; setSubject(next); const concepts = SUBJECT_CONCEPTS_MAP[next as QuestionSubject] || []; if (concepts.length && !concepts.some((item) => item.name === concept)) setConcept(concepts[0].name); }} className={inputCls}>
              {Object.keys(SUBJECT_CONCEPTS_MAP).map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="form-concept" className={labelCls}>Concept <span className="text-red-500">*</span></label>
            <select id="form-concept" value={concept} onChange={(e) => { setConcept(e.target.value); setSubCategory(e.target.value); }} className={inputCls}>
              {(SUBJECT_CONCEPTS_MAP[subject as QuestionSubject] || []).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              {concept && !(SUBJECT_CONCEPTS_MAP[subject as QuestionSubject] || []).some((item) => item.name === concept) && <option value={concept}>{concept}</option>}
            </select>
          </div>
          <div>
            <label htmlFor="form-scope" className={labelCls}>Scope (Answer Depth)</label>
            <select id="form-scope" value={scope} onChange={(e) => setScope(e.target.value as "BROAD" | "SPECIFIC")} className={inputCls}>
              <option value="SPECIFIC">Specific (Definition only)</option>
              <option value="BROAD">Broad (Comprehensive answer)</option>
            </select>
          </div>
          <div>
            <label htmlFor="form-duration" className={labelCls}>Duration Budget (Seconds)</label>
            <input
              id="form-duration"
              type="number"
              min={1}
              max={3600}
              step={1}
              value={duration || ""}
              onChange={(e) => setDuration(Number(e.target.value) || 0)}
              className={inputCls}
              aria-describedby="form-duration-help"
            />
            <p id="form-duration-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {duration > 0 ? `${Math.floor(duration / 60)} min${Math.floor(duration / 60) === 1 ? "ute" : "utes"} ${duration % 60} sec (${duration} seconds)` : "Enter duration in seconds"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="modal-question-text" className={labelCls}>Question <span className="text-red-500">*</span></label>
            <textarea id="modal-question-text" rows={3} placeholder="Enter the interview question..." value={questionText} onChange={(e) => setQuestionText(e.target.value)} className={`${inputCls} resize-y`} />
            {errors.question_text && <p className="mt-1 text-xs text-red-500">{errors.question_text}</p>}
          </div>

        </div>

        {/* Full-width Ground Truth JSON editor */}
        <div className="mt-4 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/80 p-4 shadow-sm dark:border-cyan-900/70 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/30">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <label htmlFor="form-ground-truth" className={labelCls}>Ideal Answer Ground Truth (Raw JSON)</label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Edit the complete JSON, including nested fields. Changes are saved with the question.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(groundTruthText);
                    setIsGroundTruthCopied(true);
                    window.setTimeout(() => setIsGroundTruthCopied(false), 1800);
                  } catch {
                    setErrors((current) => ({ ...current, _form: "Unable to copy JSON automatically. Select the JSON text and copy it manually." }));
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#176b91] shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-gray-700 dark:bg-gray-800 dark:text-cyan-300 dark:hover:bg-gray-700"
                aria-label="Copy entire Ground Truth JSON"
                title="Copy entire JSON"
              >
                {isGroundTruthCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {isGroundTruthCopied ? "Copied!" : "Copy JSON"}
              </button>
            </div>
          </div>
          <textarea
            id="form-ground-truth"
            rows={12}
            spellCheck={false}
            placeholder='Enter valid JSON, e.g. {"key_points": [], "evaluation": {"criteria": []}}'
            value={groundTruthText}
            onChange={(e) => setGroundTruthText(e.target.value)}
            className={`${inputCls} w-full min-h-[300px] resize-y border-cyan-200 bg-white/95 font-mono text-xs leading-relaxed shadow-inner focus:border-blue-400 focus:ring-blue-400/20 dark:border-gray-700 dark:bg-gray-950`}
          />
        </div>

      </div>

      {/* Sticky Footer */}
      <div className="shrink-0 flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-3.5 dark:border-gray-800 dark:bg-gray-900/60">
        {isEditMode && initialData?.id && onDelete ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onDelete(initialData.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow-xs transition-all hover:bg-red-100 hover:text-red-700 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
            <span>Delete</span>
          </button>
        ) : !isEditMode ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setQuestionText("");
              setSubCategory("");
              setErrors({});
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow-xs transition-all hover:bg-red-100 hover:text-red-700 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
            <span>Clear</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>

        <button
          id="modal-save-question-btn"
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#08c6c8] to-[#3478f6] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[#3478f6]/40 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {isSubmitting
            ? "Saving..."
            : isEditMode
            ? "Save Changes"
            : "Create Question"}
        </button>
      </div>
    </form>
  );
};


