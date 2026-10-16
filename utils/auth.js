
export const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

export function getAuthHeaders(token = null) {
  const t = token || localStorage.getItem("access_token");
  if (!t) return {};
  return {
    Authorization: `Bearer ${t}`,
    "Content-Type": "application/json",
  };
}

let userRoleCache = { token: null, data: null, timestamp: 0 };
let inFlightUserRolePromises = new Map();

export const clearUserRoleCache = () => {
  userRoleCache = { token: null, data: null, timestamp: 0 };
  inFlightUserRolePromises.clear();
};

/**
 * Call backend /user_role to get role + status with in-memory caching and deduplication.
 * Backend response expected: { role: string, status: "active" | "inactive" | "registered", ... }
 */
export const isAssessmentPage = () => {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname.toLowerCase();
  const isAssessmentFlowPage =
    p.includes("/aiprep/session") ||
    p.includes("/aiprep/reports") ||
    p.includes("/session/") ||
    p.includes("/reports/");

  // The AI Prep wizard steps (assessment type, consent, device check, and practice)
  // use the existing token/local role and must not call GET /user_role.
  const wizardSteps = new Set([
    "assessment-type", "assesment-type", "consent",
    "device-check", "devicecheck", "practice",
    "practice-start", "configuration", "job-description",
    "jd-upload", "jd",
  ]);
  const isAiPrepWizardPage =
    p.includes("/user_dashboard/ai-prep/") &&
    wizardSteps.has(p.split("/").filter(Boolean).at(-1));

  return isAssessmentFlowPage || isAiPrepWizardPage;
};

export const fetchUserRole = async (token, forceRefresh = false) => {
  const t = token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
  if (!t) return { role: null, status: "inactive" };

  // Return cached result if valid for 60 seconds
  if (!forceRefresh && userRoleCache.token === t && (Date.now() - userRoleCache.timestamp < 60000) && userRoleCache.data) {
    return userRoleCache.data;
  }

  // Deduplicate concurrent requests per token; never reuse one user's request for another token.
  if (inFlightUserRolePromises.has(t)) {
    return inFlightUserRolePromises.get(t);
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user_role`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${t}`,
        },
      });

      if (!response.ok) {
        try {
          const err = await response.json();
          return { role: null, status: err.status || "inactive", detail: err.detail || null };
        } catch (e) {
          return { role: null, status: "inactive", detail: null };
        }
      }

      const data = await response.json();
      const res = {
        role: data.role ?? null,
        status: (data.status ?? "inactive").toString().toLowerCase(),
        raw: data,
      };

      userRoleCache = { token: t, data: res, timestamp: Date.now() };
      if (typeof window !== "undefined" && res.role) {
        try { localStorage.setItem("user_role", res.role); } catch (_) {}
      }
      return res;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("fetchUserRole network error:", error);
      }
      return { role: null, status: "inactive" };
    } finally {
      inFlightUserRolePromises.delete(t);
    }
  })();

  inFlightUserRolePromises.set(t, requestPromise);
  return requestPromise;
};

/**
 * Derive team role from token payload:
 * - sub === "admin" => "admin"
 * - payload.is_employee === true => "employee"
 * - otherwise => "candidate"
 * Treat employee as admin for avatar/dashboard access.
 */
export const getUserTeamRole = (token = null) => {
  const accessToken = token || localStorage.getItem("access_token");
  if (!accessToken) return null;

  const decoded = parseJwt(accessToken);
  if (!decoded) return null;

  if (decoded.role) {
    const roleLower = decoded.role.toLowerCase();
    if (["admin", "employee", "candidate"].includes(roleLower)) {
      return roleLower;
    }
  }

  const uname = (decoded.sub || "").toString();
  if (uname.toLowerCase() === "admin") return "admin";

  // backend sets is_employee True for employee logins
  if (decoded.is_employee === true || decoded.is_employee === "true") return "employee";

  // fallback to candidate
  return "candidate";
};

/**
 * Validate token and backend account status. fetchUserRole caches by token for 60 seconds and deduplicates concurrent requests.
 * Returns { valid: boolean, message: string, role?: string }
 */
export const isAuthenticated = async () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!token) return { valid: false, message: "Please Login!" };
  if (isTokenExpired(token)) return { valid: false, message: "Session expired, please login again." };
  try {
    const { role, status, detail } = await fetchUserRole(token);
    if ((status ?? "inactive").toString().toLowerCase() !== "active") return { valid: false, message: detail || "Your account is inactive." };
    return { valid: true, message: "", role: role || getUserTeamRole(token) || "candidate" };
  } catch (error) {
    console.error("Auth check error:", error);
    return { valid: false, message: "An error occurred while validating the token" };
  }
};
