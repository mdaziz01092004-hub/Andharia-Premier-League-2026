/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'apl_2026_audio_db';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomAudio(file: File): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Store the raw File object directly
    const request = store.put(file, 'custom_bg_music');
    request.onsuccess = () => {
      // Also notify any open components via an event
      window.dispatchEvent(new CustomEvent('custom-audio-updated'));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getCustomAudio(): Promise<File | null> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('custom_bg_music');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to get custom audio from IndexedDB:', err);
    return null;
  }
}

export async function deleteCustomAudio(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete('custom_bg_music');
    request.onsuccess = () => {
      window.dispatchEvent(new CustomEvent('custom-audio-updated'));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}
