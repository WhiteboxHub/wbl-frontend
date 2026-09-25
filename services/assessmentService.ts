import { apiFetch } from "@/lib/api";
import {
  AssessmentFiltersState,
  AssessmentGridItem,
  AssessmentListApiResponse,
} from "@/types/assessment";

/**
 * Assessment Service for Candidate and Admin/Employee assessment operations.
 */
// In-flight request deduplication map to prevent duplicate concurrent network calls
const inFlightCandidateAssessments = new Map<string, Promise<AssessmentListApiResponse>>();

export const assessmentService = {
  fetchCandidateAssessments: async (
    filters: Partial<AssessmentFiltersState> = {},
    page: number = 1,
    limit: number = 50
  ): Promise<AssessmentListApiResponse> => {
    const offset = (page - 1) * limit;
    const queryParams = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || '') : '';
    const urlCid = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('candidateId') || '') : '';
    const effectiveCandidateId = filters.candidate_id?.trim() || urlCid.trim();

    if (effectiveCandidateId) {
      queryParams.set("candidate_id", effectiveCandidateId);
    }

    const tokenSnippet = token ? token.slice(-25) : 'anon';
    const cacheKey = `candidate_${tokenSnippet}_${queryParams.toString()}`;
    if (inFlightCandidateAssessments.has(cacheKey)) {
      return inFlightCandidateAssessments.get(cacheKey)!;
    }

    const fetchPromise = (async (): Promise<AssessmentListApiResponse> => {
      try {
        const res = await apiFetch(
          `api/aiprep/candidate/assessments?${queryParams.toString()}`
        );

        const items: AssessmentGridItem[] = res?.items || [];
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
        console.warn("fetchCandidateAssessments error:", err?.message);
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
        };
      } finally {
        setTimeout(() => inFlightCandidateAssessments.delete(cacheKey), 500);
      }
    })();

    inFlightCandidateAssessments.set(cacheKey, fetchPromise);
    return fetchPromise;
  },

  fetchEmployeeAssessments: async (
    filters: Partial<AssessmentFiltersState> = {},
    page: number = 1,
    limit: number = 50
  ): Promise<AssessmentListApiResponse> => {
    try {
      const offset = (page - 1) * limit;
      const queryParams = new URLSearchParams({
        limit: String(Math.min(limit, 100)),
        offset: String(offset),
      });

      if (filters.candidate_id?.trim()) {
        const rawCand = filters.candidate_id.trim();
        if (/^\d+$/.test(rawCand)) {
          queryParams.set("candidate_id", rawCand);
        } else if (rawCand.toLowerCase().startsWith("cand-") && /^\d+$/.test(rawCand.slice(5))) {
          queryParams.set("candidate_id", rawCand.slice(5));
        }
      }

      if (filters.status && filters.status !== "all") {
        queryParams.set("status", filters.status);
      }
      if (filters.category && filters.category !== "all") {
        queryParams.set("assessment_type", filters.category);
      }
      if (filters.media_type && filters.media_type !== "all") {
        queryParams.set("media_type", filters.media_type);
      }
      if (filters.search && filters.search.trim()) {
        queryParams.set("search", filters.search.trim());
      }

      const res = await apiFetch(
        `api/aiprep/employee/assessments?${queryParams.toString()}`
      );

      const items: AssessmentGridItem[] = res?.items || [];
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
      console.warn("fetchEmployeeAssessments error:", err?.message);
      throw err;
    }
  },

  fetchAllEmployeeAssessments: async (): Promise<AssessmentListApiResponse> => {
    try {
      const firstRes = await apiFetch(`api/aiprep/employee/assessments?limit=100&offset=0`);
      let items: AssessmentGridItem[] = firstRes?.items || [];
      const total: number = firstRes?.total ?? items.length;

      if (total > items.length && items.length > 0) {
        const totalPagesToFetch = Math.ceil(total / 100);
        const remainingFetches = [];
        for (let p = 2; p <= totalPagesToFetch; p++) {
          const nextOffset = (p - 1) * 100;
          remainingFetches.push(
            apiFetch(`api/aiprep/employee/assessments?limit=100&offset=${nextOffset}`)
          );
        }
        const pagesRes = await Promise.all(remainingFetches);
        for (const pr of pagesRes) {
          if (pr?.items && Array.isArray(pr.items)) {
            items = items.concat(pr.items);
          }
        }
      }

      const seen = new Set<number>();
      const uniqueItems = items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      return {
        items: uniqueItems,
        total: uniqueItems.length,
        page: 1,
        limit: uniqueItems.length,
        totalPages: 1,
      };
    } catch (err: any) {
      console.warn("fetchAllEmployeeAssessments error:", err?.message);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 1,
      };
    }
  },

  fetchAssessmentDetail: async (assessmentId: number) => {
    try {
      const res = await apiFetch(
        `api/aiprep/employee/assessments/${assessmentId}/report`
      );
      return res;
    } catch (err: any) {
      console.error("fetchAssessmentDetail error:", err);
      return null;
    }
  },

  fetchAssessmentRecord: async (assessmentId: number) => {
    try {
      const res = await apiFetch(
        `api/aiprep/employee/assessments/${assessmentId}`
      );
      return res;
    } catch (err: any) {
      return null;
    }
  },

  fetchAssessmentReport: async (assessmentId: number) => {
    try {
      const res = await apiFetch(
        `api/aiprep/employee/assessments/${assessmentId}/report`
      );
      return res;
    } catch (err: any) {
      // 404 is expected if report has not been generated yet (e.g. IN_PROGRESS or FAILED)
      return null;
    }
  },

  fetchAssessmentData: async (assessmentId: number) => {
    try {
      const res = await apiFetch(
        `api/aiprep/employee/assessments/${assessmentId}/data`
      );
      return res;
    } catch (err: any) {
      console.error("fetchAssessmentData error:", err);
      return {
        id: assessmentId,
        questions: [],
        telemetry: {},
      };
    }
  },

  deleteAssessment: async (assessmentId: number) => {
    try {
      const res = await apiFetch(
        `api/aiprep/employee/assessments/${assessmentId}`,
        {
          method: "DELETE",
        }
      );
      return res;
    } catch (err: any) {
      console.warn("deleteAssessment error:", err?.message);
      return null;
    }
  },
};
