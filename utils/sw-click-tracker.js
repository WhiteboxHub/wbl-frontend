/* 
 * Job Click Tracking Service Worker (v5)
 * 12-Hour Sync Logic using IndexedDB
 */

const DB_NAME = 'JobClickTracker';
const STORE_NAME = 'pending_clicks';
const META_STORE = 'sync_meta';
let cachedToken = null;
let baseUrl = '';
let lastClickTime = null;

const SYNC_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 2);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create pending_clicks if it doesn't exist (it usually does from v1)
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'job_listing_id' });
            }
            // Create sync_meta to store our last_synced_at timestamp
            if (!db.objectStoreNames.contains(META_STORE)) {
                db.createObjectStore(META_STORE, { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (e) => {
            console.error('[SW] DB Open Error:', e);
            reject(e);
        };
    });
}

async function getLastSyncedAt() {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            if (!db.objectStoreNames.contains(META_STORE)) return resolve(null);
            const tx = db.transaction(META_STORE, 'readonly');
            const store = tx.objectStore(META_STORE);
            const getReq = store.get('last_synced_at');
            getReq.onsuccess = () => {
                resolve(getReq.result ? getReq.result.value : null);
            };
            getReq.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
}

async function setLastSyncedAt(timestamp) {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(META_STORE, 'readwrite');
            const store = tx.objectStore(META_STORE);
            const putReq = store.put({ id: 'last_synced_at', value: timestamp });
            putReq.onsuccess = () => resolve();
            putReq.onerror = () => resolve();
        });
    } catch (e) {}
}

async function getPendingClicks() {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            if (!db.objectStoreNames.contains(STORE_NAME)) return resolve([]);
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const getAll = store.getAll();
            getAll.onsuccess = () => resolve(getAll.result);
            getAll.onerror = () => resolve([]);
        });
    } catch (e) {
        return [];
    }
}

async function clearClicks(ids) {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            ids.forEach(id => store.delete(id));
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    } catch(e) {}
}

let isFlushing = false;
let pendingFlush = false;
let pendingFlushForce = false;

function handleConfigUpdate() {
    if (baseUrl && cachedToken) {
        if (pendingFlush) {
            const force = pendingFlushForce;
            pendingFlush = false;
            pendingFlushForce = false;
            attemptFlush(force);
        } else {
            // On page load/auth, check if we need to flush scheduled sync
            attemptFlush(false);
        }
    }
}

// THE FLUSH LOGIC
async function attemptFlush(force = false) {
    if (!baseUrl || !cachedToken) {
        pendingFlush = true;
        if (force) {
            pendingFlushForce = true;
        }
        console.warn('[SW] Sync deferred: Config/Token not received yet');
        return;
    }

    if (isFlushing) {
        pendingFlush = true;
        if (force) {
            pendingFlushForce = true;
        }
        return;
    }

    isFlushing = true;

    try {
        const lastSyncedAt = await getLastSyncedAt();
        const now = Date.now();

        if (force || lastSyncedAt === null || (now - lastSyncedAt) > SYNC_THRESHOLD_MS) {
            const clicks = await getPendingClicks();
            if (clicks.length === 0) {
                return;
            }

            const path = '/candidates/track-clicks-batch';
            const cleanBase = baseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
            const url = `${cleanBase}/api${path}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cachedToken}`
                },
                body: JSON.stringify({ clicks })
            });

            if (response.ok) {
                await clearClicks(clicks.map(c => c.job_listing_id));
                await setLastSyncedAt(Date.now());
            } else {
                console.error('[SW] Sync Error: HTTP', response.status);
            }
        }
    } catch (err) {
        console.error('[SW] Sync Error:', err);
    } finally {
        isFlushing = false;
        if (pendingFlush) {
            const nextForce = pendingFlushForce;
            pendingFlush = false;
            pendingFlushForce = false;
            setTimeout(() => attemptFlush(nextForce), 0); 
        }
    }
}

// Background polling just in case tab stays open for 12 hours
setInterval(() => attemptFlush(false), 5 * 60 * 1000); // Check every 5 minutes

// Check for 1 hour inactivity
setInterval(async () => {
    if (!lastClickTime) return
    
    const idleMs = Date.now() - lastClickTime
    const oneHour = 60 * 60 * 1000

    if (idleMs >= oneHour) {
        await attemptFlush(true);
        lastClickTime = null;
    }
}, 60 * 1000);

self.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SET_API_URL') {
        baseUrl = event.data.url;
        handleConfigUpdate();
    }

    if (event.data.type === 'SET_TOKEN') {
        cachedToken = event.data.token;
        handleConfigUpdate();
    }

    if (event.data.type === 'TRACK_CLICK') {
        lastClickTime = Date.now();
        attemptFlush(true);
    }

    if (event.data.type === 'FLUSH') {
        attemptFlush(true);
    }
});

// Activate & Cleanup
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'flush-job-clicks') {
        event.waitUntil(attemptFlush(true));
    }
});
