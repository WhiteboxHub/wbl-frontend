import { apiFetch } from '@/lib/api';
import { QuestionBankItem, QuestionFiltersState, QuestionListResponse } from '@/types/aiprep';

// ---------------------------------------------------------------------------
// 1. Fetch questions list from backend database
// GET /api/aiprep/questions
// Backend accepts: category, difficulty_level, is_active, limit, offset
// ---------------------------------------------------------------------------
export async function fetchQuestionBank(
  filters?: Partial<QuestionFiltersState>,
  page: number = 1,
  limit: number = 10
): Promise<QuestionListResponse> {
  try {
    const offset = (page - 1) * limit;
    const queryParams = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    if (filters?.category && filters.category !== 'all') {
      queryParams.set('category', filters.category);
    }
    if (filters?.sub_category && filters.sub_category !== 'all') {
      queryParams.set('sub_category', filters.sub_category);
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      queryParams.set('difficulty_level', filters.difficulty);
    }
    if (filters?.status && filters.status !== 'all') {
      queryParams.set('is_active', String(filters.status === 'active'));
    }
    if (filters?.search && filters.search.trim()) {
      queryParams.set('search', filters.search.trim());
    }

    const res = await apiFetch(`api/aiprep/questions?${queryParams.toString()}`);
    const items: QuestionBankItem[] = res?.items || [];
    const total: number = res?.total ?? items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (err: any) {
    console.error('Fetch Question Bank API Error:', err?.body?.detail || err.message);
    const detail = err?.body?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Failed to fetch questions from backend database.');
  }
}

// ---------------------------------------------------------------------------
// 2. Create new question in backend database
// POST /api/aiprep/questions
// ---------------------------------------------------------------------------
export async function createQuestion(
  data: Omit<QuestionBankItem, 'id' | 'created_at' | 'updated_at'>
): Promise<QuestionBankItem> {
  const isTechnical = data.category === 'TECHNICAL';
  const payload = {
    category: data.category,
    sub_category: isTechnical ? (data.sub_category || 'General Technical') : null,
    difficulty_level: data.difficulty_level || 'MEDIUM',
    question_text: data.question_text,
    is_active: Boolean(data.is_active ?? true),
  };

  try {
    const res = await apiFetch('api/aiprep/questions', {
      method: 'POST',
      body: payload,
    });
    return res;
  } catch (err: any) {
    console.error('Create Question API Error:', err?.body?.detail || err.message);
    const detail = err?.body?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Failed to create question in backend database.');
  }
}

// ---------------------------------------------------------------------------
// 3. Update existing question in backend database
// PATCH /api/aiprep/questions/:id
// ---------------------------------------------------------------------------
export async function updateQuestion(
  id: number,
  data: Partial<QuestionBankItem>
): Promise<QuestionBankItem> {
  const payload: Record<string, any> = {};

  if (data.sub_category !== undefined) {
    const targetCategory = data.category || 'TECHNICAL';
    payload.sub_category = targetCategory === 'TECHNICAL' ? (data.sub_category || 'General Technical') : null;
  }
  if (data.difficulty_level) payload.difficulty_level = data.difficulty_level;
  if (data.question_text) payload.question_text = data.question_text;
  if (data.is_active !== undefined) payload.is_active = Boolean(data.is_active);

  try {
    const res = await apiFetch(`api/aiprep/questions/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return res;
  } catch (err: any) {
    console.error('Update Question API Error:', err?.body?.detail || err.message);
    const detail = err?.body?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Failed to update question in backend database.');
  }
}

// ---------------------------------------------------------------------------
// 4. Toggle question active status in backend database
// PATCH /api/aiprep/questions/:id
// ---------------------------------------------------------------------------
export async function toggleQuestionStatus(
  id: number,
  isActive: boolean
): Promise<boolean> {
  try {
    await apiFetch(`api/aiprep/questions/${id}`, {
      method: 'PATCH',
      body: { is_active: Boolean(isActive) },
    });
    return true;
  } catch (err: any) {
    console.error('Toggle Question Status API Error:', err?.body?.detail || err.message);
    const detail = err?.body?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Failed to update question status in backend database.');
  }
}

// ---------------------------------------------------------------------------
// 5. Delete question permanently from backend database
// DELETE /api/aiprep/questions/:id
// ---------------------------------------------------------------------------
export async function deleteQuestion(id: number): Promise<boolean> {
  try {
    await apiFetch(`api/aiprep/questions/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (err: any) {
    try {
      await apiFetch(`api/aiprep/questions/${id}`, {
        method: 'PATCH',
        body: { is_active: false },
      });
      return true;
    } catch {
      console.error('Delete Question API Error:', err?.body?.detail || err.message);
      const detail = err?.body?.detail;
      throw new Error(typeof detail === 'string' ? detail : 'Failed to delete question from backend database.');
    }
  }
}
