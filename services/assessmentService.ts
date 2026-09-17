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
    limit: number = 50
  ): Promise<AssessmentListApiResponse> => {
    try {
      const offset = (page - 1) * limit;
      const queryParams = new URLSearchParams({
        limit: String(limit),
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
};
