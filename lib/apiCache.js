// lib/apiCache.js - Cache with HEAD request validation

import { apiFetch } from "./api";
import { getFromCache, saveToCache, deleteFromCache } from "./dbCache";

const CACHEABLE_METHODS = ["GET"];

/**
 * Check if cached data is still fresh using HEAD request
 */
async function checkCacheFreshness(endpoint, cachedLastMod) {
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    let ep = endpoint.replace(/^\//, "");
    if (ep.startsWith("api/")) ep = ep.substring(4);
    
    // Remove query params for HEAD request - use base endpoint
    const baseEndpoint = ep.split('?')[0];
    const url = baseUrl ? `${baseUrl}/${baseEndpoint}` : `/${baseEndpoint}`;
    
    const token = typeof window !== "undefined" &&
      (localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("bearer_token") ||
        null);

    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
      method: "HEAD",
      headers,
    });

    if (!response.ok) {
      console.log(`[Cache] HEAD request failed: ${response.status}`);
      return false; // On error, assume cache is stale
    }

    const serverLastMod = response.headers.get("Last-Modified");
    
    if (!serverLastMod || !cachedLastMod) {
      console.log(`[Cache] No Last-Modified header available`);
      return false; // If no lastmod info, refetch
    }

    console.log(`[Cache] Server: ${serverLastMod}, Cached: ${cachedLastMod}`);
    return serverLastMod === cachedLastMod;
  } catch (error) {
    console.error(`[Cache] HEAD check error:`, error);
    return false; // On error, refetch to be safe
  }
}

/**
 * Cached API fetch - validates cache freshness with HEAD request
 */
export async function cachedApiFetch(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  // Only cache GET requests
  if (!CACHEABLE_METHODS.includes(method)) {
    return await apiFetch(endpoint, options);
  }

  // Check cache first
  const cached = await getFromCache(endpoint);
  
  if (cached && cached.data) {
    console.log(`[Cache] Found cached data for: ${endpoint}`);
    console.log(`[Cache] Cached lastmoddatetime: ${cached.lastmoddatetime}`);
    
    // Check if cache is still fresh using HEAD request (lightweight check)
    const isFresh = await checkCacheFreshness(endpoint, cached.lastmoddatetime);
    
    if (isFresh) {
      console.log(`[Cache] ✅ HIT - Using IndexedDB (lastmoddatetime matches): ${endpoint}`);
      return cached.data; // Return from IndexedDB, NO GET request
    } else {
      console.log(`[Cache] ⚠️ STALE - lastmoddatetime changed, refetching: ${endpoint}`);
      await deleteFromCache(endpoint);
      // Will fall through to fetch from API
    }
  } else {
    console.log(`[Cache] MISS - No cached data in IndexedDB: ${endpoint}`);
    // Will fall through to fetch from API
  }

  // Cache miss or stale - fetch from API
  const result = await apiFetch(endpoint, options);

  // Extract lastmoddatetime from response
  const lastmoddatetime = Array.isArray(result) && result.length > 0
    ? result[0]?.lastmoddatetime || null
    : result?.lastmoddatetime || null;

  // Save to cache
  await saveToCache(endpoint, result, lastmoddatetime);
  console.log(`[Cache] Saved: ${endpoint} (lastmod: ${lastmoddatetime || 'N/A'})`);
  
  return result;
}

/**
 * Cached API fetch WITHOUT HEAD validation (pure IndexedDB cache)
 * Use this for instant responses without any API calls
 */
export async function cachedApiFetchNoValidation(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  if (!CACHEABLE_METHODS.includes(method)) {
    return await apiFetch(endpoint, options);
  }

  const cached = await getFromCache(endpoint);
  
  if (cached && cached.data) {
    console.log(`[Cache] ✅ HIT - Using IndexedDB directly (no HEAD check): ${endpoint}`);
    return cached.data;
  }

  console.log(`[Cache] MISS - Fetching from API: ${endpoint}`);
  const result = await apiFetch(endpoint, options);
  const lastmoddatetime = Array.isArray(result) && result.length > 0
    ? result[0]?.lastmoddatetime || null
    : result?.lastmoddatetime || null;
  await saveToCache(endpoint, result, lastmoddatetime);
  console.log(`[Cache] Saved to IndexedDB: ${endpoint}`);
  return result;
}

/**
 * Manually invalidate cache for an endpoint
 * Call this after POST/PUT/PATCH/DELETE operations
 */
export async function invalidateCache(endpoint) {
  console.log(`[Cache] Invalidating: ${endpoint}`);
  await deleteFromCache(endpoint);
}

export { deleteFromCache, clearCache } from "./dbCache";



