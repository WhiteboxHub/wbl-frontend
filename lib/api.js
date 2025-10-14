// // src/utils/api.js
// export async function apiFetch(endpoint, options = {}) {
//   const token = localStorage.getItem("access_token");
//   const baseUrl = process.env.NEXT_PUBLIC_API_URL;

//   const headers = {
//     "Content-Type": "application/json",
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     ...(options.headers || {}),
//   };

//   // ✅ Automatically convert JS objects to JSON strings for request body
//   let body = options.body;
//   if (body && typeof body === "object" && !(body instanceof FormData)) {
//     body = JSON.stringify(body);
//   }

// const url = `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

// const res = await fetch(url, {
//   ...options,
//   headers,
//   ...(options.body ? { body } : {}),
// });


//   if (!res.ok) {
//     let errorText = "";
//     try {
//       errorText = await res.text();
//     } catch {
//       errorText = "Unknown error";
//     }
//     throw new Error(`Request failed (${res.status}): ${errorText}`);
//   }

//   try {
//     return await res.json();
//   } catch {
//     return {};
//   }
// }
// src/utils/api.js
export async function apiFetch(endpoint, options = {}) {
  // SSR-safe guard
  const isClient = typeof window !== "undefined";

  // Try several common token keys so mismatch won't silently fail
  const token =
    isClient &&
    (localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("bearer_token"));

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  // prepare headers; don't set Content-Type if body is FormData
  const headers = {
    ...(options.headers || {}),
  };

  // If options.body is not a FormData, default to JSON content-type
  const bodyIsFormData = isClient && options?.body instanceof FormData;
  if (!bodyIsFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token) {
    headers["Authorization"] = headers["Authorization"] || `Bearer ${token}`;
  }

  // stringify body for JSON requests (but keep FormData as-is)
  let body = options.body;
  if (body && typeof body === "object" && !bodyIsFormData) {
    body = JSON.stringify(body);
  }

  const url = `${baseUrl.replace(/\/$/, "")}/${String(endpoint).replace(/^\//, "")}`;

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    // include any other options (mode, credentials, etc.)
    ...options,
    // override body only if we prepared one
    ...(options.body ? { body } : {}),
  };

  // If we prepared a stringified body, use it
  if (body && bodyIsFormData === false) fetchOptions.body = body;
  if (bodyIsFormData) fetchOptions.body = options.body; // FormData preserved

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    // try JSON first (useful for structured error responses), then text
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

    // helpful message for debugging in toasts / logs
    const message =
      (errorBody && (typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody))) ||
      res.statusText ||
      `Request failed with status ${res.status}`;

    const err = new Error(message);
    err.status = res.status;
    err.body = errorBody;
    throw err;
  }

  // No content
  if (res.status === 204) return {};

  // try parse JSON, otherwise return empty object
  try {
    return await res.json();
  } catch {
    return {};
  }
}
