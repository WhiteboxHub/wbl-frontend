// Small IndexedDB helper for storing leads
const DB_NAME = 'wbl_frontend_db';
const DB_VERSION = 1;
const LEADS_STORE = 'leads';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LEADS_STORE)) {
        db.createObjectStore(LEADS_STORE, { keyPath: 'id' });
      }
    };
  });
}

export async function getAllLeadsFromIDB(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LEADS_STORE, 'readonly');
      const store = tx.objectStore(LEADS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('IDB getAllLeads error', e);
    return [];
  }
}

export async function setLeadsToIDB(leads: any[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LEADS_STORE, 'readwrite');
      const store = tx.objectStore(LEADS_STORE);
      // Clear then put new
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        for (const lead of leads) {
          store.put(lead);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('IDB setLeads error', e);
  }
}

export async function clearLeadsFromIDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LEADS_STORE, 'readwrite');
      const store = tx.objectStore(LEADS_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('IDB clearLeads error', e);
  }
}

export async function putLeadToIDB(lead: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LEADS_STORE, 'readwrite');
      const store = tx.objectStore(LEADS_STORE);
      const req = store.put(lead);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('IDB putLead error', e);
  }
}
