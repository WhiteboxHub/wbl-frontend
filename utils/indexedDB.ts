// Lightweight IndexedDB helpers for caching leads
// All functions are safe to call in environments without IndexedDB

const DB_NAME = 'wb_leads_db';
const STORE_NAME = 'leads';
const DB_VERSION = 1;

function hasIDB(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIDB()) return reject(new Error('IndexedDB not available'));

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function getAllLeadsFromIDB<T = any>(): Promise<T[]> {
  try {
    const db = await openDB();
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as T[]);
      req.onerror = () => reject(req.error || new Error('Failed to read leads from IDB'));
    });
  } catch {
    return [];
  }
}

export async function setLeadsToIDB<T = any>(leads: T[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      // Clear then add
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        for (const lead of leads) {
          store.put(lead as any);
        }
      };
      clearReq.onerror = () => reject(clearReq.error || new Error('Failed to clear leads store'));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to write leads to IDB'));
    });
  } catch {
    // ignore
  }
}

export async function clearLeadsFromIDB(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to clear leads from IDB'));
    });
  } catch {
    // ignore
  }
}
