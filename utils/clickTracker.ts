/**
 * Utility for tracking job clicks using IndexedDB
 * Surivives browser crashes and tab closures.
 */

const DB_NAME = 'JobClickTracker';
const STORE_NAME = 'pending_clicks';
const DB_VERSION = 2; // Matched with SW v5

export interface PendingClick {
    job_listing_id: number;
    count: number;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const dog = indexedDB.open(DB_NAME, DB_VERSION);
        dog.onerror = () => reject(dog.error);
        dog.onsuccess = () => resolve(dog.result);
        dog.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'job_listing_id' });
            }
            if (!db.objectStoreNames.contains('sync_meta')) {
                db.createObjectStore('sync_meta', { keyPath: 'id' });
            }
        };
    });
};

export const trackLocalClick = async (job_listing_id: number) => {
    console.log(`[ClickTracker] Tracking click for local job: ${job_listing_id}`);
    try {
        const db = await openDB();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            const getRequest = store.get(job_listing_id);
            getRequest.onsuccess = () => {
                const data = getRequest.result || { job_listing_id, count: 0 };
                data.count += 1;
                const putRequest = store.put(data);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error('[ClickTracker] IndexedDB save error:', error);
    }
};

export const getPendingClicks = async (): Promise<PendingClick[]> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[ClickTracker] IndexedDB read error:', error);
        return [];
    }
};

export const clearPendingClicks = async (ids: number[]) => {
    try {
        const db = await openDB();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            ids.forEach(id => store.delete(id));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error('[ClickTracker] IndexedDB clear error:', error);
    }
};
