/**
 * Saved sentences (phrase book) persisted in IndexedDB.
 *
 * A lightweight counterpart of the mobile app's phrase book: the reader
 * can save a translated sentence so it can be reviewed later. Keyed by a
 * content hash so identical sentences do not duplicate.
 */

import { PHRASES_STORE, withStore } from './idb';

export interface SavedPhrase {
  id: string;
  text: string;
  translation: string;
  addedAt: number;
}

export function phraseId(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return `phrase-${(hash >>> 0).toString(36)}`;
}

export class PhraseStore {
  async add(text: string, translation: string): Promise<void> {
    await withStore(PHRASES_STORE, 'readwrite', (store) =>
      store.put({
        id: phraseId(text),
        text,
        translation,
        addedAt: Date.now(),
      } as SavedPhrase),
    );
  }

  async remove(id: string): Promise<void> {
    await withStore(PHRASES_STORE, 'readwrite', (store) => store.delete(id));
  }

  async contains(text: string): Promise<boolean> {
    const hit = await withStore(PHRASES_STORE, 'readonly', (store) =>
      store.get(phraseId(text)),
    );
    return hit != null;
  }

  async list(): Promise<SavedPhrase[]> {
    const all = await withStore(PHRASES_STORE, 'readonly', (store) =>
      store.getAll(),
    );
    return (all as SavedPhrase[]).sort((a, b) => b.addedAt - a.addedAt);
  }
}
