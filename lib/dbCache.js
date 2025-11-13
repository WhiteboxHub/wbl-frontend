// lib/dbCache.js - Simple IndexedDB cache

export const DB_NAME = "wbl";
export const STORE_NAME = "api_cache";
export const DB_VERSION = 1;

/**
 * Open IndexedDB connection
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "endpoint" });
        store.createIndex("endpoint", "endpoint", { unique: true });
      }
    };
    
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save response to cache with lastmoddatetime
 */
export async function saveToCache(endpoint, data, lastmoddatetime) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    store.put({
      endpoint,
      data,
      lastmoddatetime,
      timestamp: Date.now(),
    });
    
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    
    console.log(`[Cache] Saved: ${endpoint}`);
    db.close();
  } catch (error) {
    console.error("[Cache] Save error:", error);
  }
}

/**
 * Get cached response
 */
export async function getFromCache(endpoint) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    
    const result = await new Promise((resolve, reject) => {
      const req = store.get(endpoint);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });

    db.close();
    return result || null;
  } catch (error) {
    console.error("[Cache] Get error:", error);
    return null;
  }
}

/**
 * Delete specific cache entry
 */
export async function deleteFromCache(endpoint) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    store.delete(endpoint);
    
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    console.log(`[Cache] Deleted: ${endpoint}`);
    db.close();
  } catch (error) {
    console.error("[Cache] Delete error:", error);
  }
}

/**
 * Clear all cache
 */
export async function clearCache() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    store.clear();
    
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    console.log("[Cache] All cache cleared");
    db.close();
  } catch (error) {
    console.error("[Cache] Clear error:", error);
  }
}



