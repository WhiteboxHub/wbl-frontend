import { apiFetch } from '@/lib/api';
import { QuestionBankItem, QuestionFiltersState, QuestionListResponse } from '@/types/aiprep';

// ---------------------------------------------------------------------------
// 1. Fetch questions list from backend database
// GET /api/aiprep/questions
// ---------------------------------------------------------------------------
export async function fetchQuestionBank(
  filters?: Partial<QuestionFiltersState>,
  page: number = 1,
  limit: number = 10
): Promise<QuestionListResponse> {
  const offset = (page - 1) * limit;
  const queryParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (filters?.category && filters.category !== 'all') {
    queryParams.set('category', filters.category);
  }
  if (filters?.subject && filters.subject !== 'all') {
    queryParams.set('subject', filters.subject);
  }
  if (filters?.concept && filters.concept !== 'all') {
    queryParams.set('concept', filters.concept);
  }
  if (filters?.difficulty && filters.difficulty !== 'all') {
    queryParams.set('difficulty_level', filters.difficulty);
  }
  if (filters?.scope && filters.scope !== 'all') {
    queryParams.set('scope', filters.scope);
  }
  if (filters?.status && filters.status !== 'all') {
    queryParams.set('is_active', String(filters.status === 'active'));
  }
  if (filters?.search && filters.search.trim()) {
    queryParams.set('search', filters.search.trim());
  }

  try {
    // Question Bank contains admin-only data (including ground_truth), so send
    // the logged-in user's bearer token and let the backend enforce staff access.
    const res: unknown = await apiFetch(`api/aiprep/questions?${queryParams.toString()}`);

    // A successful HTTP status does not guarantee a valid JSON payload.
    // Reject unexpected/empty responses here so the UI can show a useful error.
    if (!res || typeof res !== 'object' || Array.isArray(res)) {
      throw new Error('Invalid response from the Question Bank API. Expected an object containing items and total.');
    }

    const response = res as { items?: unknown; total?: unknown };
    if (!Array.isArray(response.items)) {
      throw new Error('Invalid response from the Question Bank API: the items field is missing or is not an array.');
    }

    const items = response.items as QuestionBankItem[];
    const total = typeof response.total === 'number' && Number.isFinite(response.total)
      ? response.total
      : items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (err: any) {
    const status = err?.status;
    if (status === 401) {
      throw new Error('You are not authenticated. Please sign in again.');
    }
    if (status === 403) {
      throw new Error('You do not have permission to access the Question Bank.');
    }
    if (status === 404) {
      throw new Error('Question Bank endpoint not found. Please check the backend configuration.');
    }
    if (typeof status === 'number' && status >= 500) {
      throw new Error('Backend server error while loading the Question Bank. Please try again or contact support.');
    }

    // Preserve useful API messages (including plain-text/HTML gateway errors)
    // while avoiding a misleading generic network error for response failures.
    const body = err?.body;
    const bodyMessage = typeof body === 'string'
      ? body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240)
      : body && typeof body === 'object'
        ? (body.detail || body.message || body.error)
        : undefined;
    const message = bodyMessage || err?.message;
    throw new Error(message || 'Failed to connect to the backend. Ensure the server is running at the configured API URL.');
  }
}

// ---------------------------------------------------------------------------
// 2. Create new question in backend database
// POST /api/aiprep/questions
// ---------------------------------------------------------------------------
export async function createQuestion(
  data: Omit<QuestionBankItem, 'id' | 'created_at' | 'updated_at'>
): Promise<QuestionBankItem> {
  const payload = {
    category: data.category,
    subject: data.subject || null,
    concept: data.concept || null,
    difficulty_level: data.difficulty_level || 'MEDIUM',
    scope: data.scope || 'SPECIFIC',
    time_limit_seconds: Number(data.time_limit_seconds) || 120,
    question_text: data.question_text,
    ground_truth: data.ground_truth || null,
    is_active: Boolean(data.is_active ?? true),
  };

  const res = await apiFetch('api/aiprep/questions', {
    method: 'POST',
    body: payload,
  } as any);
  return res;
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

  if (data.category !== undefined) payload.category = data.category;
  if (data.subject !== undefined) payload.subject = data.subject;
  if (data.concept !== undefined) payload.concept = data.concept;
  if (data.difficulty_level) payload.difficulty_level = data.difficulty_level;
  if (data.scope !== undefined) payload.scope = data.scope;
  if (data.time_limit_seconds !== undefined) payload.time_limit_seconds = Number(data.time_limit_seconds);
  if (data.question_text) payload.question_text = data.question_text;
  if (data.ground_truth !== undefined) payload.ground_truth = data.ground_truth;
  if (data.is_active !== undefined) payload.is_active = Boolean(data.is_active);

  const res = await apiFetch(`api/aiprep/questions/${id}`, {
    method: 'PATCH',
    body: payload,
  } as any);
  return res;
}

// ---------------------------------------------------------------------------
// 4. Toggle question active status in backend database
// PATCH /api/aiprep/questions/:id
// ---------------------------------------------------------------------------
export async function toggleQuestionStatus(
  id: number,
  isActive: boolean
): Promise<boolean> {
  await apiFetch(`api/aiprep/questions/${id}`, {
    method: 'PATCH',
    body: { is_active: Boolean(isActive) },
  } as any);
  return true;
}

// ---------------------------------------------------------------------------
// 5. Delete question permanently from backend database
// DELETE /api/aiprep/questions/:id
// ---------------------------------------------------------------------------
export async function deleteQuestion(id: number): Promise<boolean> {
  await apiFetch(`api/aiprep/questions/${id}`, {
    method: 'DELETE',
  } as any);
  return true;
}
