// lib/apiCache.js - Simple cache without extra API calls

import { apiFetch } from "./api";
import { getFromCache, saveToCache, deleteFromCache } from "./dbCache";

const CACHEABLE_METHODS = ["GET"];

/**
 * Cached API fetch - returns cached data immediately if available
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
    console.log(`[Cache] HIT: ${endpoint} (lastmod: ${cached.lastmoddatetime || 'N/A'})`);
    return cached.data; // Return immediately, no extra API call
  }

  // Cache miss - fetch from API
  console.log(`[Cache] MISS: ${endpoint}`);
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
 * Manually invalidate cache for an endpoint
 * Call this after POST/PUT/PATCH/DELETE operations
 */
export async function invalidateCache(endpoint) {
  console.log(`[Cache] Invalidating: ${endpoint}`);
  await deleteFromCache(endpoint);
}

export { deleteFromCache, clearCache } from "./dbCache";



