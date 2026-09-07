import axios from 'axios';
import { QuestionBankItem, QuestionFiltersState, QuestionListResponse } from '@/types/aiprep';

function getEndpointUrl(path: string): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const baseUrl = envUrl.replace(/\/$/, '');
  let cleanPath = path.replace(/^\//, '');

  if (baseUrl.endsWith('/api') && cleanPath.startsWith('api/')) {
    cleanPath = cleanPath.substring(4);
  } else if (!baseUrl.endsWith('/api') && !cleanPath.startsWith('api/')) {
    cleanPath = `api/${cleanPath}`;
  }

  return baseUrl ? `${baseUrl}/${cleanPath}` : `/${cleanPath}`;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('bearer_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    const params: Record<string, string | number | boolean> = {
      limit,
      offset,
    };

    if (filters?.category && filters.category !== 'all') {
      params.category = filters.category;
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      params.difficulty_level = filters.difficulty;
    }
    if (filters?.status && filters.status !== 'all') {
      params.is_active = filters.status === 'active';
    }

    const res = await axios.get<{ items: QuestionBankItem[]; total: number }>(
      getEndpointUrl('/api/aiprep/questions'),
      {
        headers: getAuthHeader(),
        params,
        timeout: 10000,
      }
    );

    let items = res.data.items || [];
    let total = res.data.total ?? items.length;

    // Apply client-side sub_category and search filtering if needed
    if (filters?.sub_category && filters.sub_category !== 'all') {
      items = items.filter(
        (item) => item.sub_category?.toLowerCase() === filters.sub_category.toLowerCase()
      );
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.question_text?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.sub_category?.toLowerCase().includes(q)
      );
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (err: any) {
    console.error('Fetch Question Bank API Error:', err?.response?.data || err.message);
    const detail = err?.response?.data?.detail;
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
    const res = await axios.post<QuestionBankItem>(
      getEndpointUrl('/api/aiprep/questions'),
      payload,
      {
        headers: getAuthHeader(),
        timeout: 10000,
      }
    );
    return res.data;
  } catch (err: any) {
    console.error('Create Question API Error:', err?.response?.data || err.message);
    const detail = err?.response?.data?.detail;
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
    const res = await axios.patch<QuestionBankItem>(
      getEndpointUrl(`/api/aiprep/questions/${id}`),
      payload,
      {
        headers: getAuthHeader(),
        timeout: 10000,
      }
    );
    return res.data;
  } catch (err: any) {
    console.error('Update Question API Error:', err?.response?.data || err.message);
    const detail = err?.response?.data?.detail;
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
    await axios.patch(
      getEndpointUrl(`/api/aiprep/questions/${id}`),
      { is_active: Boolean(isActive) },
      { headers: getAuthHeader(), timeout: 10000 }
    );
    return true;
  } catch (err: any) {
    console.error('Toggle Question Status API Error:', err?.response?.data || err.message);
    const detail = err?.response?.data?.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Failed to update question status in backend database.');
  }
}

// ---------------------------------------------------------------------------
// 5. Delete question permanently from backend database
// DELETE /api/aiprep/questions/:id
// ---------------------------------------------------------------------------
export async function deleteQuestion(id: number): Promise<boolean> {
  try {
    await axios.delete(getEndpointUrl(`/api/aiprep/questions/${id}`), {
      headers: getAuthHeader(),
      timeout: 10000,
    });
    return true;
  } catch (err: any) {
    try {
      await axios.patch(
        getEndpointUrl(`/api/aiprep/questions/${id}`),
        { is_active: false },
        { headers: getAuthHeader(), timeout: 10000 }
      );
      return true;
    } catch {
      console.error('Delete Question API Error:', err?.response?.data || err.message);
      const detail = err?.response?.data?.detail;
      throw new Error(typeof detail === 'string' ? detail : 'Failed to delete question from backend database.');
    }
  }
}
