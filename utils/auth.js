
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

/**
 * Call backend /user_role to get role + status.
 * Backend response expected: { role: string, status: "active" | "inactive" | "registered", ... }
 */
export const fetchUserRole = async (token) => {
  try {
    const t = token || localStorage.getItem("access_token");
    if (!t) return { role: null, status: "inactive" };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user_role`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${t}`,
      },
    });

    if (!response.ok) {
      // try to parse error body
      try {
        const err = await response.json();
        // if token invalid or user inactive backend should return proper status code & message
        return { role: null, status: err.status || "inactive", detail: err.detail || null };
      } catch (e) {
        return { role: null, status: "inactive", detail: null };
      }
    }

    const data = await response.json();
    // Normalise shape
    return {
      role: data.role ?? null,
      status: (data.status ?? "active").toString().toLowerCase(),
      raw: data,
    };
  } catch (error) {
    console.error("Error in fetchUserRole:", error);
    return { role: null, status: "inactive" };
  }
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

  const uname = (decoded.sub || "").toString();
  if (uname.toLowerCase() === "admin") return "admin";

  // backend sets is_employee True for employee logins
  if (decoded.is_employee === true || decoded.is_employee === "true") return "employee";

  // fallback to candidate
  return "candidate";
};

/**
 * Validate token + remote status check
 * Returns { valid: boolean, message: string }
 */
export const isAuthenticated = async () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return { valid: false, message: "Please Login!" };
  }

  if (isTokenExpired(token)) {
    return { valid: false, message: "Session expired, please login again." };
  }

  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user_role`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return { valid: false, message: err.detail || "Token validation failed" };
    }

    const data = await r.json();
    if ((data.status ?? "active").toString().toLowerCase() !== "active") {
      return { valid: false, message: "Your account is inactive." };
    }

    return { valid: true, message: "" };
  } catch (error) {
    console.error("Auth check error:", error);
    return { valid: false, message: "An error occurred while validating the token" };
  }
};
