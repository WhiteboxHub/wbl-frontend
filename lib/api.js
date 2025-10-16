
// export async function apiFetch(endpoint, options = {}) {
//   const isClient = typeof window !== "undefined";

//   // get token from several possible keys (client-side only)
//   const token =
//     isClient &&
//     (localStorage.getItem("access_token") ||
//       localStorage.getItem("token") ||
//       localStorage.getItem("auth_token") ||
//       localStorage.getItem("bearer_token") ||
//       null);

//   // base url may be empty -> fall back to relative path behavior
//   const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

//   // Normalize endpoint to string and strip leading slash for safe concatenation
//   const endpointStr = String(endpoint).replace(/^\//, "");

//   // Build final URL: if baseUrl present -> `${baseUrl}/${endpointStr}` else `/${endpointStr}`
//   const url = baseUrl ? `${baseUrl}/${endpointStr}` : `/${endpointStr}`;

//   // Start with a safe headers object and merge any provided options.headers
//   const providedHeaders = (options.headers && { ...options.headers }) || {};
//   const headers = { ...providedHeaders };

//   // Detect FormData only on client to avoid SSR errors
//   const bodyIsFormData = isClient && options?.body instanceof FormData;

//   // If not FormData, ensure Content-Type is set (may be overwritten by providedHeaders)
//   if (!bodyIsFormData) {
//     headers["Content-Type"] = headers["Content-Type"] || "application/json";
//   }

//   // Add Authorization if token present and not already provided
//   if (token) {
//     headers["Authorization"] = headers["Authorization"] || `Bearer ${token}`;
//   }

//   // Prepare body: if it's an object (and not FormData), stringify it.
//   let body = options.body;
//   if (body && typeof body === "object" && !bodyIsFormData) {
//     // Avoid double-stringifying strings
//     body = JSON.stringify(body);
//   }

//   // Build fetch options, but prefer explicit fields from options (credentials, signal, etc.)
//   const fetchOptions = {
//     method: options.method || "GET",
//     headers,
//     // allow consumers to pass credentials/signal/mode/cache etc via options
//     ...(options.credentials ? { credentials: options.credentials } : {}),
//     ...(options.signal ? { signal: options.signal } : {}),
//     ...options, // keep other options (like mode, cache) — headers already handled above
//     ...(options.body ? { body: bodyIsFormData ? options.body : body } : {}),
//   };

//   // If sending FormData, ensure browser sets boundary (remove Content-Type)
//   if (bodyIsFormData && fetchOptions.headers) {
//     delete fetchOptions.headers["Content-Type"];
//   }

//   const res = await fetch(url, fetchOptions);

//   if (!res.ok) {
//     // Try JSON first, then text — helpful for debugging API errors
//     let errorBody = null;
//     try {
//       errorBody = await res.json();
//     } catch {
//       try {
//         errorBody = await res.text();
//       } catch {
//         errorBody = `HTTP ${res.status}`;
//       }
//     }
//     const message =
//       (errorBody && (typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody))) ||
//       res.statusText ||
//       `Request failed with status ${res.status}`;
//     const err = new Error(message);
//     // attach status/body for callers that inspect errors
//     err.status = res.status;
//     err.body = errorBody;
//     throw err;
//   }

//   // No content
//   if (res.status === 204) return {};

//   // Try to parse JSON, otherwise return raw text
//   const contentType = res.headers.get("content-type") || "";
//   if (contentType.includes("application/json")) {
//     try {
//       return await res.json();
//     } catch (e) {
//       // fallback to text if JSON parsing fails unexpectedly
//       const text = await res.text().catch(() => "");
//       return text;
//     }
//   } else {
//     // return text for non-json responses (avoids hiding useful server replies)
//     return await res.text();
//   }
// }

// // Minimal API wrapper that mimics axios-like shape: { data: <body> }
// const api = {
//   async request(method, endpoint, options = {}) {
//     const opts = {
//       ...options,
//       method,
//     };

//     const body = await apiFetch(endpoint, opts);
//     return { data: body };
//   },

//   get(endpoint, options = {}) {
//     return this.request("GET", endpoint, options);
//   },
//   post(endpoint, body, options = {}) {
//     return this.request("POST", endpoint, { ...options, body });
//   },
//   put(endpoint, body, options = {}) {
//     return this.request("PUT", endpoint, { ...options, body });
//   },
//   patch(endpoint, body, options = {}) {
//     return this.request("PATCH", endpoint, { ...options, body });
//   },
//   delete(endpoint, options = {}) {
//     return this.request("DELETE", endpoint, options);
//   },
// };
// // ...existing code...

// // expose alias and base url for other modules that expect these names
// export const authFetch = apiFetch;
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// // export default api;


// export default api;
// lib/api.js

export async function apiFetch(endpoint, options = {}) {
  const isClient = typeof window !== "undefined";

  // get token from several possible keys (client-side only)
  const token =
    isClient &&
    (localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("bearer_token") ||
      null);

  // base url may be empty -> fall back to relative path behavior
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  // Normalize endpoint to string and strip leading slash for safe concatenation
  const endpointStr = String(endpoint).replace(/^\//, "");

  // Build final URL
  const url = baseUrl ? `${baseUrl}/${endpointStr}` : `/${endpointStr}`;

  // Start with a safe headers object and merge any provided options.headers
  const providedHeaders = (options.headers && { ...options.headers }) || {};
  const headers = { ...providedHeaders };

  // Detect FormData only on client
  const bodyIsFormData = isClient && options?.body instanceof FormData;

  // Set Content-Type if not FormData
  if (!bodyIsFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  // Add Authorization header
  if (token && !options.useCookies) {
    // only add token when not explicitly using cookies
    headers["Authorization"] = headers["Authorization"] || `Bearer ${token}`;
  }

  // Prepare body: stringify plain objects (but not strings, not FormData)
  let body = options.body;
  if (body && typeof body === "object" && !bodyIsFormData) {
    body = JSON.stringify(body);
  }

  // Final fetch options
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
          // not found — try next candidate
          continue;
        }
        if (err && err.status === 401) {
          // auth issue — rethrow so caller handles redirect
          throw err;
        }
        // other errors: continue trying other candidates but keep lastError
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
