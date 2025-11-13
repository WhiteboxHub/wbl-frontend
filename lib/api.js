// lib/api.js
export async function apiFetch(endpoint, options = {}) {
  const isClient = typeof window !== "undefined";
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  const token =
    isClient &&
    (localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("bearer_token") ||
      null);

  let endpointStr = String(endpoint).replace(/^\//, "");
  if (endpointStr.startsWith("api/")) {
    endpointStr = endpointStr.substring(4);
  }

  const url = baseUrl ? `${baseUrl}/${endpointStr}` : `/${endpointStr}`;

  if (isClient) {
    console.log("[apiFetch] baseUrl:", baseUrl);
    console.log("[apiFetch] endpoint:", endpoint);
    console.log("[apiFetch] token present:", !!token);
    console.log("[apiFetch] final URL:", url);
  }

  const providedHeaders = (options.headers && { ...options.headers }) || {};
  const headers = { ...providedHeaders };
  const bodyIsFormData = isClient && options?.body instanceof FormData;

  if (!bodyIsFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token && !options.useCookies) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && typeof body === "object" && !bodyIsFormData) {
    body = JSON.stringify(body);
  }

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    credentials: options.useCookies ? "include" : options.credentials || "same-origin",
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.body ? { body: bodyIsFormData ? options.body : body } : {}),
  };

  if (bodyIsFormData && fetchOptions.headers) {
    delete fetchOptions.headers["Content-Type"];
  }

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    let errorBody;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text().catch(() => "");
    }

    const err = new Error(
      typeof errorBody === "string"
        ? errorBody
        : JSON.stringify(errorBody, null, 2) || res.statusText
    );
    err.status = res.status;
    err.body = errorBody;

    if (res.status === 401) {
      console.warn("[apiFetch] Unauthorized → clearing stored token");
      if (isClient) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("bearer_token");
      }
    }

    throw err;
  }

  if (res.status === 204) return {};

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return await res.text().catch(() => "");
    }
  }

  return await res.text();
}

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
        if (err.status === 404) continue;
        if (err.status === 401) {
          console.warn(`[smartUpdate] 401 Unauthorized on ${candidate}`);
          throw err;
        }
      }
    }
  }

  throw lastError || new Error("Update failed: resource not found");
}

export const authFetch = apiFetch;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export default api;

