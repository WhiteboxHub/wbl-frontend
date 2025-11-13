// lib/cacheDebug.js - Simple cache debugging

import { clearCache, deleteFromCache, openDB, STORE_NAME } from "./dbCache";

/**
 * Get all cache entries
 */
async function getAllCacheEntries() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    
    const entries = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    
    db.close();
    return entries;
  } catch (error) {
    console.error("[CacheDebug] Error:", error);
    return [];
  }
}

/**
 * Inspect cache contents
 */
export async function inspectCache() {
  const entries = await getAllCacheEntries();
  
  if (entries.length === 0) {
    console.log("[Cache] Empty");
    return;
  }

  const formatted = entries.map((entry) => ({
    Endpoint: entry.endpoint,
    "Last Modified": entry.lastmoddatetime || "N/A",
    Size: JSON.stringify(entry.data).length + " bytes",
    Age: Math.floor((Date.now() - entry.timestamp) / 1000) + "s",
    Cached: new Date(entry.timestamp).toLocaleString(),
  }));

  console.table(formatted);
  console.log(`[Cache] Total: ${entries.length} entries`);
}

/**
 * Initialize debug tools
 */
export function initCacheDebug() {
  if (typeof window === "undefined") return;

  window.__cacheDebug = {
    inspect: inspectCache,
    clear: clearCache,
    help: () => {
      console.log(`
%c🔧 Simple Cache Debug

Commands:
  window.__cacheDebug.inspect() - Show all cache entries
  window.__cacheDebug.clear()   - Clear entire cache
  window.__cacheDebug.help()    - Show this help
      `, "color: #00ff00; font-weight: bold");
    },
  };

  console.log("%c[Cache] Debug tools ready: window.__cacheDebug", "color: #00ff00");
}

// Auto-initialize
if (typeof window !== "undefined") {
  initCacheDebug();
}
