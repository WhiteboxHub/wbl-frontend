import { apiFetch } from "@/lib/api";
import {
  AssessmentFiltersState,
  AssessmentGridItem,
  AssessmentListApiResponse,
} from "@/types/assessment";

/**
 * Assessment Service for Candidate and Admin/Employee assessment operations.
 */
export const assessmentService = {
  fetchCandidateAssessments: async (
    filters: Partial<AssessmentFiltersState> = {},
    page: number = 1,
    limit: number = 50
  ): Promise<AssessmentListApiResponse> => {
    try {
      const offset = (page - 1) * limit;
      const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (filters.candidate_id?.trim()) {
        queryParams.set("candidate_id", filters.candidate_id.trim());
      }

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
    }
  },

  fetchEmployeeAssessments: async (
    filters: Partial<AssessmentFiltersState> = {},
    page: number = 1,
    limit: number = 100
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

      const res = await apiFetch(
        `api/aiprep/employee/assessments?${queryParams.toString()}`
      );

      let items: AssessmentGridItem[] = res?.items || [];
      const total: number = res?.total ?? items.length;

      // If total items exceed the single-page limit (100 in backend), fetch remaining pages
      // so client-side filters (candidate name, email, ID, etc.) operate on the full assessment list
      if (!filters.candidate_id?.trim() && total > items.length && items.length > 0) {
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

      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        items,
        total: items.length > total ? items.length : total,
        page,
        limit,
        totalPages,
      };
    } catch (err: any) {
      console.warn("fetchEmployeeAssessments error:", err?.message);
      return {
        items: [],
        total: 0,
        page,
        limit,
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
