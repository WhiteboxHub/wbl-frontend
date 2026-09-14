import axios from "axios";
import {
  AssessmentFiltersState,
  AssessmentGridItem,
  AssessmentListApiResponse,
} from "@/types/assessment";

function getEndpointUrl(path: string): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const baseUrl = envUrl.replace(/\/$/, "");
  let cleanPath = path.replace(/^\//, "");

  if (baseUrl.endsWith("/api") && cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.substring(4);
  } else if (!baseUrl.endsWith("/api") && !cleanPath.startsWith("api/")) {
    cleanPath = `api/${cleanPath}`;
  }

  return baseUrl ? `${baseUrl}/${cleanPath}` : `/${cleanPath}`;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("bearer_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
      const params: Record<string, any> = { limit, offset };

      if (filters.candidate_id?.trim()) {
        params.candidate_id = filters.candidate_id.trim();
      }

      const res = await axios.get<{ items: AssessmentGridItem[]; total: number }>(
        getEndpointUrl("/api/aiprep/candidate/assessments"),
        {
          headers: getAuthHeader(),
          params,
          timeout: 10000,
        }
      );

      const items = res.data?.items || [];
      const total = res.data?.total ?? items.length;
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
      const params: Record<string, any> = { limit, offset };

      if (filters.candidate_id?.trim()) {
        params.candidate_id = filters.candidate_id.trim();
      }
      if (filters.status && filters.status !== "all") {
        params.status = filters.status;
      }

      const res = await axios.get<{ items: AssessmentGridItem[]; total: number }>(
        getEndpointUrl("/api/aiprep/employee/assessments"),
        {
          headers: getAuthHeader(),
          params,
          timeout: 10000,
        }
      );

      const items = res.data?.items || [];
      const total = res.data?.total ?? items.length;
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
      const res = await axios.get(
        getEndpointUrl(`/api/aiprep/employee/assessments/${assessmentId}/report`),
        {
          headers: getAuthHeader(),
          timeout: 10000,
        }
      );
      return res.data;
    } catch (err: any) {
      console.error("fetchAssessmentDetail error:", err);
      return null;
    }
  },

  fetchAssessmentData: async (assessmentId: number) => {
    try {
      const res = await axios.get(
        getEndpointUrl(`/api/aiprep/employee/assessments/${assessmentId}/data`),
        {
          headers: getAuthHeader(),
          timeout: 10000,
        }
      );
      return res.data;
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

