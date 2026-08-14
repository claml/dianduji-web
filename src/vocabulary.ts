/**
 * Vocabulary book persisted in IndexedDB.
 *
 * Storing a snapshot of the looked-up entry keeps the book readable even
 * when the dictionary chunk is not loaded yet. A tiny event bus lets the
 * UI refresh the list without polling.
 */

export interface SavedWord {
  word: string;
  phonetic: string;
  definitionChinese: string;
  addedAt: number; // epoch millis
}

const DB_NAME = 'dianduji';
const STORE = 'vocabulary';
const EVENT = 'dianduji:vocabulary';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'word' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = fn(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class VocabularyBook {
  private readonly events: EventTarget;

  constructor(events: EventTarget = window) {
    this.events = events;
  }

  async add(entry: SavedWord): Promise<void> {
    await withStore('readwrite', (store) => store.put(entry));
    this.events.dispatchEvent(new Event(EVENT));
  }

  async remove(word: string): Promise<void> {
    await withStore('readwrite', (store) => store.delete(word));
    this.events.dispatchEvent(new Event(EVENT));
  }

  async list(): Promise<SavedWord[]> {
    const all = await withStore('readonly', (store) => store.getAll());
    return (all as SavedWord[]).sort((a, b) => b.addedAt - a.addedAt);
  }

  async contains(word: string): Promise<boolean> {
    const hit = await withStore('readonly', (store) => store.get(word));
    return hit != null;
  }

  subscribe(listener: () => void): () => void {
    this.events.addEventListener(EVENT, listener);
    return () => this.events.removeEventListener(EVENT, listener);
  }
}
