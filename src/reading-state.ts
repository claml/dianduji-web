/**
 * Reading progress memory (IndexedDB).
 *
 * Remembers the last page per document so reopening the same PDF resumes
 * where the reader left off. The document key is derived from name + size.
 */

import { READING_STORE, withStore } from './idb';

export interface ReadingState {
  id: string;
  name: string;
  page: number;
  savedAt: number;
}

/** Stable per-file id: name + size, lowercased and hashed. */
export function documentId(name: string, size: number): string {
  let hash = 0;
  const source = `${name.toLowerCase()}|${size}`;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) | 0;
  }
  return `doc-${(hash >>> 0).toString(36)}`;
}

export class ReadingStore {
  async save(id: string, name: string, page: number): Promise<void> {
    await withStore(READING_STORE, 'readwrite', (store) =>
      store.put({ id, name, page, savedAt: Date.now() } as ReadingState),
    );
  }

  async load(id: string): Promise<ReadingState | null> {
    const hit = await withStore(READING_STORE, 'readonly', (store) => store.get(id));
    return (hit as ReadingState | undefined) ?? null;
  }

  async recent(limit = 20): Promise<ReadingState[]> {
    const all = await withStore(READING_STORE, 'readonly', (store) =>
      store.getAll(),
    );
    return (all as ReadingState[]).sort((a, b) => b.savedAt - a.savedAt).slice(0, limit);
  }
}
