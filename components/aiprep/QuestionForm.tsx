"use client";

import React, { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import {
  QuestionBankItem,
  QuestionCategory,
  QuestionDifficulty,
  QUESTION_TAXONOMY,
} from "@/types/aiprep";

export interface QuestionFormData {
  id?: number;
  category: QuestionCategory;
  sub_category?: string | null;
  difficulty_level: QuestionDifficulty;
  question_text: string;
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
  { value: "EXPERT", label: "Expert" },
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
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("MEDIUM");
  const [questionText, setQuestionText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category);
      setDifficulty(initialData.difficulty_level);
      setSubCategory(
        initialData.category === "TECHNICAL"
          ? initialData.sub_category || ""
          : ""
      );
      setQuestionText(initialData.question_text || "");
      setIsActive(Boolean(initialData.is_active));
    } else {
      setCategory("TECHNICAL");
      setDifficulty("MEDIUM");
      setSubCategory(QUESTION_TAXONOMY["TECHNICAL"]?.[0] || "");
      setQuestionText("");
      setIsActive(true);
    }
    setErrors({});
  }, [initialData]);

  const handleCategoryChange = (newCat: QuestionCategory) => {
    setCategory(newCat);
    setSubCategory(
      newCat === "TECHNICAL" ? QUESTION_TAXONOMY["TECHNICAL"]?.[0] || "" : ""
    );
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
      await onSubmit({
        ...(initialData?.id ? { id: initialData.id } : {}),
        category,
        sub_category: category === "TECHNICAL" ? subCategory.trim() : null,
        difficulty_level: difficulty,
        question_text: questionText.trim(),
        is_active: isActive ? 1 : 0,
      });
    } catch (err: any) {
      setErrors({ _form: err.message || "Failed to save question." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTaxonomySubs =
    category === "TECHNICAL" ? QUESTION_TAXONOMY["TECHNICAL"] || [] : [];

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col min-h-0 overflow-hidden h-full"
    >
      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        {errors._form && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {errors._form}
          </div>
        )}

        {/* Two-column grid (image-1 style) */}
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">

          {/* LEFT COLUMN — Question Setup */}
          <div className="flex flex-col gap-4">
            <p className={sectionHeaderCls}>Question Setup</p>

            {/* Category */}
            <div>
              <label htmlFor="form-category" className={labelCls}>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="form-category"
                value={category}
                onChange={(e) =>
                  handleCategoryChange(e.target.value as QuestionCategory)
                }
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Sub-Category */}
            <div>
              <label htmlFor="form-subcategory-select" className={labelCls}>
                Sub-Category{" "}
                {category === "TECHNICAL" && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              {category === "TECHNICAL" ? (
                <div className="flex flex-col gap-2">
                  <select
                    id="form-subcategory-select"
                    value={
                      currentTaxonomySubs.includes(subCategory)
                        ? subCategory
                        : "__custom__"
                    }
                    onChange={(e) => {
                      if (e.target.value !== "__custom__") {
                        setSubCategory(e.target.value);
                      } else {
                        setSubCategory("");
                      }
                    }}
                    className={inputCls}
                  >
                    {currentTaxonomySubs.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom Sub-Category</option>
                  </select>
                  {(!currentTaxonomySubs.includes(subCategory) ||
                    subCategory === "") && (
                    <input
                      id="form-subcategory"
                      type="text"
                      placeholder="Enter custom sub-category..."
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className={inputCls}
                    />
                  )}
                </div>
              ) : (
                <input
                  disabled
                  type="text"
                  value="N/A — Technical questions only"
                  className="w-full rounded-lg border border-gray-200 bg-gray-100/70 px-3 py-2 text-sm text-gray-400 cursor-not-allowed dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-500"
                />
              )}
              {errors.sub_category && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.sub_category}
                </p>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label htmlFor="form-difficulty" className={labelCls}>
                Difficulty Level <span className="text-red-500">*</span>
              </label>
              <select
                id="form-difficulty"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as QuestionDifficulty)
                }
                className={inputCls}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {errors.difficulty && (
                <p className="mt-1 text-xs text-red-500">{errors.difficulty}</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Content & Status */}
          <div className="flex flex-col gap-4 mt-4 sm:mt-0">
            <p className={sectionHeaderCls}>Content &amp; Status</p>

            {/* Question */}
            <div className="flex-1">
              <label htmlFor="modal-question-text" className={labelCls}>
                Question <span className="text-red-500">*</span>
              </label>
              <textarea
                id="modal-question-text"
                rows={6}
                placeholder="e.g. Explain how multi-agent orchestration frameworks resolve non-deterministic execution paths..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className={`${inputCls} resize-none`}
              />
              {errors.question_text && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.question_text}
                </p>
              )}
            </div>

            {/* Active Status */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Active Status
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Available for AI Prep assessments.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  aria-label="Toggle active status"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2a5a6b]/30 focus:ring-offset-2 ${
                    isActive ? "bg-[#2a5a6b]" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
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
              setSubCategory(
                category === "TECHNICAL"
                  ? QUESTION_TAXONOMY["TECHNICAL"]?.[0] || ""
                  : ""
              );
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
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2a5a6b] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1e4a5a] focus:ring-2 focus:ring-[#2a5a6b]/30 disabled:opacity-50"
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


