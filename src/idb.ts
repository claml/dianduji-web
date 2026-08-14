/**
 * Shared IndexedDB bootstrap for all feature stores.
 *
 * One database, one version; every store is created idempotently during
 * upgrades so modules never fight over the version number.
 */

export const DB_NAME = 'dianduji';
export const DB_VERSION = 2;
export const VOCABULARY_STORE = 'vocabulary';
export const READING_STORE = 'reading';

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VOCABULARY_STORE)) {
        db.createObjectStore(VOCABULARY_STORE, { keyPath: 'word' });
      }
      if (!db.objectStoreNames.contains(READING_STORE)) {
        db.createObjectStore(READING_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function withStore<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const request = fn(transaction.objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
