/**
 * Question Bank Taxonomy
 * Centralised taxonomy data for subjects, concepts, and form options.
 * Used by QuestionBankTable, QuestionForm, and QuestionDetailDrawer.
 */

// ── Re-exported type (mirrors types/aiprep.ts) ──────────────────────────────
export type QuestionSubject = "AI Engineering" | "Software Engineering" | "DevOps and Cloud";

// ── Subject → Concept mapping ────────────────────────────────────────────────
export const SUBJECT_CONCEPTS_MAP: Record<QuestionSubject, { name: string }[]> = {
  "AI Engineering": [
    { name: "Python & Data Manipulation" },
    { name: "ML & Deep Learning Fundamentals" },
    { name: "ML Frameworks & Tooling" },
    { name: "NLP" },
    { name: "Generative AI & LLMs" },
    { name: "RAG & Retrieval" },
    { name: "Agentic AI & Multi-Agent Systems" },
    { name: "Models & Context Engineering" },
    { name: "AI Systems Ops: Evaluation, Guardrails & Observability" },
  ],
  "Software Engineering": [
    { name: "System Architecture & Design" },
    { name: "API Design & Microservices" },
    { name: "Databases & Caching" },
    { name: "Concurrency & Async Systems" },
    { name: "Data Structures & Algorithms" },
  ],
  "DevOps and Cloud": [
    { name: "Containers & Orchestration" },
    { name: "CI/CD & GitOps" },
    { name: "Cloud Architecture & Services" },
    { name: "Infrastructure as Code & Security" },
  ],
};

// ── Flat list of all concepts ─────────────────────────────────────────────────
export interface ConceptDefinition {
  name: string;
  subject: QuestionSubject;
  rawClubbedItems?: string[];
}

export const ALL_CONCEPTS_LIST: ConceptDefinition[] = (
  Object.entries(SUBJECT_CONCEPTS_MAP) as [QuestionSubject, { name: string }[]][]
).flatMap(([subject, items]) =>
  items.map((c) => ({
    name: c.name,
    subject,
  }))
);

// ── Subject dropdown options ──────────────────────────────────────────────────
export const SUBJECT_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Subjects" },
  { value: "AI Engineering", label: "AI Engineering" },
  { value: "Software Engineering", label: "Software Engineering" },
  { value: "DevOps and Cloud", label: "DevOps and Cloud" },
];

// ── Difficulty dropdown options ───────────────────────────────────────────────
export const DIFFICULTY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Difficulties" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

// ── Scope dropdown options ────────────────────────────────────────────────────
export const SCOPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Scopes" },
  { value: "BROAD", label: "Broad" },
  { value: "SPECIFIC", label: "Specific" },
];

// ── Concept dropdown options ──────────────────────────────────────────────────
export const CONCEPT_OPTIONS: { value: string; label: string; group?: string }[] = [
  { value: "all", label: "All Concepts" },
  ...ALL_CONCEPTS_LIST.map((c) => ({
    value: c.name,
    label: c.name,
    group: c.subject,
  })),
];

// ── Utility: format seconds → "Xs" or "Xm Ys" ───────────────────────────────
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

// ── Subject badge style helper ────────────────────────────────────────────────
export function getSubjectStyle(subject?: string | null): string {
  const styles: Record<string, string> = {
    "AI Engineering":
      "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
    "Software Engineering":
      "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    "DevOps and Cloud":
      "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  };
  return (
    (subject && styles[subject]) ||
    "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
  );
}

// ── Scope badge style helper ──────────────────────────────────────────────────
export function getScopeStyle(scope?: string | null): string {
  const styles: Record<string, string> = {
    BROAD:
      "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    SPECIFIC:
      "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  };
  return (
    (scope && styles[scope]) ||
    "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
  );
}

