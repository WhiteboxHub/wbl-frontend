// lib/apiCache.js - Cache with HEAD request validation

import { apiFetch } from "./api";
import { getFromCache, saveToCache, deleteFromCache } from "./dbCache";

const CACHEABLE_METHODS = ["GET"];


async function checkCacheFreshness(endpoint, cachedLastMod) {
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    let ep = endpoint.replace(/^\//, "");
    if (ep.startsWith("api/")) ep = ep.substring(4);
    
    
    const baseEndpoint = ep.split('?')[0];
    const url = `${baseUrl ? baseUrl : ''}/${baseEndpoint}`;
    
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
      return false; 
    }
    const serverLastMod = response.headers.get("Last-Modified");
    if (!serverLastMod || !cachedLastMod) {
      return false; 
    }

  
    const serverNormalized = String(serverLastMod).trim();
    const cachedNormalized = String(cachedLastMod).trim();
    
    if (serverNormalized !== cachedNormalized) {
      const maxLen = Math.min(50, Math.max(serverNormalized.length, cachedNormalized.length));
      for (let i = 0; i < maxLen; i++) {
        const sChar = serverNormalized[i] || '(end)';
        const cChar = cachedNormalized[i] || '(end)';
        if (sChar !== cChar) {
          console.log(`[Cache] Diff at position ${i}: server='${sChar}' cached='${cChar}'`);
        }
      }
    }
   
    
    return serverNormalized === cachedNormalized;
  } catch (error) {
    console.error(`[Cache] HEAD check error:`, error);
    return false; 
  }
}


export async function cachedApiFetch(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (!CACHEABLE_METHODS.includes(method)) {
    return await apiFetch(endpoint, options);
  }
  const cached = await getFromCache(endpoint);
  
  if (cached && cached.data) {    
    const isFresh = await checkCacheFreshness(endpoint, cached.lastmoddatetime);
    
    if (isFresh) {
      return cached.data; 
    } else {
      await deleteFromCache(endpoint);
      
    }
  } else {
    console.log(`[Cache] MISS - No cached data in IndexedDB: ${endpoint}`);
    
  }

  const result = await apiFetch(endpoint, options);

  
  let serverLastMod = null;
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    let ep = endpoint.replace(/^\//, "");
    if (ep.startsWith("api/")) ep = ep.substring(4);
    const baseEndpoint = ep.split('?')[0];
    const url = `${baseUrl ? baseUrl : ''}/${baseEndpoint}`;
    
    const token = typeof window !== "undefined" &&
      (localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("bearer_token") ||
        null);

    const headResponse = await fetch(url, {
      method: "HEAD",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    
    if (headResponse.ok) {
      serverLastMod = headResponse.headers.get("Last-Modified");
    }
  } catch (e) {
  }

  await saveToCache(endpoint, result, serverLastMod);
  return result;
}


export async function cachedApiFetchNoValidation(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (!CACHEABLE_METHODS.includes(method)) {
    return await apiFetch(endpoint, options);
  }
  const cached = await getFromCache(endpoint);
  if (cached && cached.data) {
    return cached.data;
  }

  const result = await apiFetch(endpoint, options);
  const lastmoddatetime = Array.isArray(result) && result.length > 0
    ? result[0]?.lastmoddatetime || null
    : result?.lastmoddatetime || null;
  await saveToCache(endpoint, result, lastmoddatetime);
  return result;
}


export async function invalidateCache(endpoint) {
  await deleteFromCache(endpoint);
}

export { deleteFromCache, clearCache } from "./dbCache";



