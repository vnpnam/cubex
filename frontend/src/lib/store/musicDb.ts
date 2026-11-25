/**
 * IndexedDB helper for storing audio/cover blobs locally.
 * Tracks with local blobs are stored with audioUrl = "local:<id>"
 * On app mount, these are resolved to blob: object URLs.
 */

const DB_NAME = 'cubex-music-blobs';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio';
const COVER_STORE = 'cover';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(AUDIO_STORE);
      req.result.createObjectStore(COVER_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAudioBlob(id: number, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, 'readwrite');
    tx.objectStore(AUDIO_STORE).put(blob, id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function saveCoverBlob(id: number, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COVER_STORE, 'readwrite');
    tx.objectStore(COVER_STORE).put(blob, id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadAudioUrl(id: number): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(AUDIO_STORE, 'readonly');
    const req = tx.objectStore(AUDIO_STORE).get(id);
    req.onsuccess = () => {
      db.close();
      resolve(req.result ? URL.createObjectURL(req.result as Blob) : null);
    };
    req.onerror = () => { db.close(); resolve(null); };
  });
}

export async function loadCoverUrl(id: number): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(COVER_STORE, 'readonly');
    const req = tx.objectStore(COVER_STORE).get(id);
    req.onsuccess = () => {
      db.close();
      resolve(req.result ? URL.createObjectURL(req.result as Blob) : null);
    };
    req.onerror = () => { db.close(); resolve(null); };
  });
}

export async function deleteLocalTrack(id: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction([AUDIO_STORE, COVER_STORE], 'readwrite');
    tx.objectStore(AUDIO_STORE).delete(id);
    tx.objectStore(COVER_STORE).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); resolve(); };
  });
}

/** Returns true if the url is a local IDB marker */
export function isLocalMarker(url: string | null | undefined): boolean {
  return !!url && url.startsWith('local:');
}

export function localMarkerId(url: string): number {
  return parseInt(url.replace('local:', ''), 10);
}

export function localMarker(id: number): string {
  return `local:${id}`;
}
