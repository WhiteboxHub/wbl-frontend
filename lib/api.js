// lib/api.js

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

  const endpointStr = String(endpoint).replace(/^\//, "");

  const url = baseUrl ? `${baseUrl}/${endpointStr}` : `/${endpointStr}`;

  const providedHeaders = (options.headers && { ...options.headers }) || {};
  const headers = { ...providedHeaders };
  const bodyIsFormData = isClient && options?.body instanceof FormData;

  if (!bodyIsFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token && !options.useCookies) {

    headers["Authorization"] = headers["Authorization"] || `Bearer ${token}`;
  }


  let body = options.body;
  if (body && typeof body === "object" && !bodyIsFormData) {
    body = JSON.stringify(body);
  }

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    ...(options.credentials ? { credentials: options.credentials } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
    ...options,
    ...(options.body ? { body: bodyIsFormData ? options.body : body } : {}),
  };

  // Remove Content-Type for FormData so browser can set boundary
  if (bodyIsFormData && fetchOptions.headers) {
    delete fetchOptions.headers["Content-Type"];
  }

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    let errorBody = null;
    try {
      errorBody = await res.json();
    } catch {
      try {
        errorBody = await res.text();
      } catch {
        errorBody = `HTTP ${res.status}`;
      }
    }

    const message =
      (typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody)) ||
      res.statusText ||
      `Request failed with status ${res.status}`;

    const err = new Error(message);
    err.status = res.status;
    err.body = errorBody;
    throw err;
  }

  // No content
  if (res.status === 204) return {};

  // Try to parse JSON
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      return text;
    }
  } else {
    return await res.text();
  }
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

// Universal updater that works for many table naming patterns
export async function smartUpdate(resource, id, data, opts = {}) {
  const methods = Array.isArray(opts.methods) ? opts.methods : ["PATCH", "PUT"];
  const rawResource = String(resource).replace(/^\/+/, "").replace(/\/+$/, "");
  const singular = rawResource.endsWith("s") ? rawResource.slice(0, -1) : rawResource;

  const candidates = [
    `${rawResource}/${id}`,
    `${rawResource}/${id}/`,
    `${singular}/${id}`,
    `${singular}/${id}/`,
  ];

  if (!rawResource.startsWith("api/")) {
    candidates.push(...candidates.map((c) => `api/${c}`));
  }

  let lastError = null;

  for (const method of methods) {
    for (const candidate of candidates) {
      try {
        const resp = await apiFetch(candidate, { method, body: data });
        return resp;
      } catch (err) {
        lastError = err;
        if (err && err.status === 404) {
          continue;
        }
        if (err && err.status === 401) {
         
          throw err;
        }
        
        continue;
      }
    }
  }

  const final = lastError || new Error("Update failed: resource not found");
  throw final;
}

export const authFetch = apiFetch;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export default api;
