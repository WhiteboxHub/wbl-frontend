// lib/dbCache.js - Simple IndexedDB cache

export const DB_NAME = "wbl";
export const STORE_NAME = "api_cache";
export const DB_VERSION = 1;


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
    
    db.close();
  } catch (error) {
    console.error("[Cache] Save error:", error);
  }
}


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
    db.close();
  } catch (error) {
    console.error("[Cache] Delete error:", error);
  }
}


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

    db.close();
  } catch (error) {
    console.error("[Cache] Clear error:", error);
  }
}



