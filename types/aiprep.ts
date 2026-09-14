export type QuestionCategory =
  | 'INTRO'
  | 'JD_INTRO'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'SYSTEM_DESIGN'
  | 'TECHNICAL';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface QuestionBankItem {
  id: number;
  category: QuestionCategory;
  sub_category?: string | null;
  difficulty_level: QuestionDifficulty;
  question_text: string;
  is_active: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QuestionFiltersState {
  search: string;
  category: string;
  sub_category: string;
  difficulty: string;
  status: 'all' | 'active' | 'inactive';
}

export interface QuestionListResponse {
  items: QuestionBankItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * According to DB constraint `chk_qb_subcategory` (Migration V134):
 * - Sub-categories are allowed/required ONLY when category is 'TECHNICAL'.
 * - For non-TECHNICAL categories, sub_category MUST be NULL.
 */
export const QUESTION_TAXONOMY: Record<QuestionCategory, string[]> = {
  TECHNICAL: [
    'Agentic AI & Orchestration',
    'RAG & Retrieval Systems',
    'LLMs, Prompting & Fine-Tuning',
    'MLOps, Deployment & Infrastructure',
    'Machine Learning & Evaluation',
    'Python, Coding & Debugging',
    'Cloud & AWS',
    'NLP & Text Processing',
  ],
  SYSTEM_DESIGN: [],
  RECRUITER: [],
  HIRING_MANAGER: [],
  INTRO: [],
  JD_INTRO: [],
};

