/**
 * Audio Recording and IndexedDB Storage Service
 * Handles client-side audio recording using MediaRecorder API,
 * stores raw audio blobs in IndexedDB for reliable offline playback,
 * creates local object URLs, and prepares payloads for Firestore metadata sync.
 */

const DB_NAME = 'WardAudioStore';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

// Open IndexedDB database
function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save audio blob to IndexedDB
 */
export async function saveAudioRecording(nodeId: string, blob: Blob): Promise<string> {
  const db = await openAudioDB();
  const id = `rec_${nodeId}_${Date.now()}`;
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item = {
      id,
      nodeId,
      blob,
      size: blob.size,
      mimeType: blob.type,
      createdAt: new Date().toISOString(),
    };
    const req = store.put(item);

    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve audio blob and generate playable Object URL
 */
export async function getAudioRecordingUrl(id: string): Promise<string | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          const url = URL.createObjectURL(req.result.blob);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error fetching audio from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete all stored audio recordings from IndexedDB
 */
export async function clearAllAudioRecordings(): Promise<void> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Notice clearing audio recordings IndexedDB:', err);
  }
}
