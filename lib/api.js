
// lib/api.js

const isClient = typeof window !== "undefined";

// Get token from localStorage
function getToken() {
  if (!isClient) return null;
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("bearer_token") ||
    null
  );
}

// Build full URL from endpoint
function buildUrl(endpoint) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  let ep = endpoint.replace(/^\//, ""); // remove leading slash
  if (ep.startsWith("api/")) ep = ep.substring(4);
  return baseUrl ? `${baseUrl}/${ep}` : `/${ep}`;
}

export async function apiFetch(endpoint, options = {}) {
  const isClient = typeof window !== "undefined";
  const token =
    isClient &&
    (localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("bearer_token") ||
      null);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");


  let endpointStr = String(endpoint).replace(/^\//, "");
  if (endpointStr.startsWith("api/")) endpointStr = endpointStr.substring(4);
  if (!endpointStr.includes("?") && !endpointStr.endsWith("/") && !endpointStr.includes(".")) {
    endpointStr += "/";
  }

  if (options.params) {
    const queryParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      endpointStr = endpointStr.replace(/\/$/, "") + "?" + queryString;
    }
  }

  const url = endpointStr.startsWith("http") ? endpointStr : `${baseUrl}/${endpointStr}`;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const bodyIsFormData = options?.body instanceof FormData;
  if (bodyIsFormData) delete headers["Content-Type"];

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    ...(options.credentials ? { credentials: options.credentials } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
    ...options,
    ...(options.body ? { body: bodyIsFormData ? options.body : JSON.stringify(options.body) } : {}),
  };

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    let errorBody = null;
    try { errorBody = await res.json(); } catch { errorBody = await res.text().catch(() => `HTTP ${res.status}`); }
    const err = new Error(JSON.stringify(errorBody));
    err.status = res.status;
    err.body = errorBody;
    throw err;
  }

  if (res.status === 204) return {};
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? await res.json() : await res.text();
}

// Axios-like wrapper
const api = {
  async request(method, endpoint, options = {}) {
    const opts = { ...options, method };
    const body = await apiFetch(endpoint, opts);
    return { data: body };
  },

  get(endpoint, options = {}) {
    return this.request("GET", endpoint, options);
  },
  post(endpoint, body, options = {}) {
    return this.request("POST", endpoint, { ...options, body });
  },
  put(endpoint, body, options = {}) {
    return this.request("PUT", endpoint, { ...options, body });
  },
  patch(endpoint, body, options = {}) {
    return this.request("PATCH", endpoint, { ...options, body });
  },
  delete(endpoint, options = {}) {
    return this.request("DELETE", endpoint, options);
  },
};
// Universal updater
export async function smartUpdate(resource, id, data, opts = {}) {
  // Try the most common pattern first
  const rawResource = String(resource).replace(/^\/+/, "").replace(/\/+$/, "");

  // Priority order: try most likely to succeed first
  const priorityCandidates = [
    { method: "PUT", endpoint: `api/${rawResource}/${id}` },
    { method: "PATCH", endpoint: `api/${rawResource}/${id}` },
    { method: "PUT", endpoint: `${rawResource}/${id}` },
    { method: "PATCH", endpoint: `${rawResource}/${id}` },
  ];

  let lastError = null;

  for (const { method, endpoint } of priorityCandidates) {
    try {
      console.log(`[smartUpdate] Trying ${method} ${endpoint}`);
      const resp = await apiFetch(endpoint, { method, body: data });
      console.log(`[smartUpdate] SUCCESS: ${method} ${endpoint}`);
      return resp;
    } catch (err) {
      console.log(`[smartUpdate] FAILED: ${method} ${endpoint} - ${err.status}`);
      lastError = err;
      if (err.status === 404 || err.status === 405 || err.status === 307) continue;
      if (err.status === 401) throw err;
    }
  }

  throw lastError || new Error("Update failed: all methods exhausted");
}

export const authFetch = apiFetch;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export default api;
