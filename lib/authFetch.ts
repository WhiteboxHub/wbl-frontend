const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function tryRefreshToken(): Promise<string | null> {
  try {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
    if (!refreshToken) return null;
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.access_token) {
      localStorage.setItem("token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refreshToken", data.refresh_token);
      return data.access_token;
    }
    return null;
  } catch (e) {
    console.error("refresh error:", e);
    return null;
  }
}


export async function authFetch(
  input: RequestInfo,
  init: RequestInit = {},
  opts: { allowAnonymous?: boolean; redirectOnAuthFail?: boolean } = {}
): Promise<Response> {
  const { allowAnonymous = false, redirectOnAuthFail = true } = opts;
  const url = typeof input === "string" && input.startsWith("http") ? input : `${API_BASE}${input}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const originalHeaders: HeadersInit = init.headers || {};
  const mergedHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...((originalHeaders as Record<string, string>) || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // If no token and anonymous allowed -> do unauthenticated request
  if (!token && allowAnonymous) {
    const anonRes = await fetch(url, { ...init, headers: originalHeaders });
    return anonRes;
  }

  if (!token && !allowAnonymous) {
    if (redirectOnAuthFail && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return new Response(null, { status: 401, statusText: "No token" });
    } else {
      return new Response(null, { status: 401, statusText: "No token" });
    }
  }

  let res = await fetch(url, { ...init, headers: mergedHeaders });

  if (res.status === 401 || res.status === 403) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      const retryHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...((originalHeaders as Record<string, string>) || {}),
        Authorization: `Bearer ${newToken}`,
      };
      res = await fetch(url, { ...init, headers: retryHeaders });
      return res;
    } else {
    
      if (redirectOnAuthFail && typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return new Response(null, { status: 401, statusText: "Refresh failed" });
      }
      return res; 
    }
  }

  return res;
}
