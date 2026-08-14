/**
 * Vocabulary book persisted in IndexedDB.
 *
 * Storing a snapshot of the looked-up entry keeps the book readable even
 * when the dictionary chunk is not loaded yet. A tiny event bus lets the
 * UI refresh the list without polling.
 */

import { VOCABULARY_STORE, withStore } from './idb';

export interface SavedWord {
  word: string;
  phonetic: string;
  definitionChinese: string;
  addedAt: number; // epoch millis
  mastered?: boolean;
}

const EVENT = 'dianduji:vocabulary';

export class VocabularyBook {
  private readonly events: EventTarget;

  constructor(events: EventTarget = window) {
    this.events = events;
  }

  async add(entry: SavedWord): Promise<void> {
    await withStore(VOCABULARY_STORE, 'readwrite', (store) => store.put(entry));
    this.events.dispatchEvent(new Event(EVENT));
  }

  async remove(word: string): Promise<void> {
    await withStore(VOCABULARY_STORE, 'readwrite', (store) => store.delete(word));
    this.events.dispatchEvent(new Event(EVENT));
  }

  async list(): Promise<SavedWord[]> {
    const all = await withStore(VOCABULARY_STORE, 'readonly', (store) =>
      store.getAll(),
    );
    return (all as SavedWord[]).sort((a, b) => b.addedAt - a.addedAt);
  }

  async setMastered(word: string, mastered: boolean): Promise<void> {
    const existing = await this.lookup(word);
    if (!existing) return;
    await withStore(VOCABULARY_STORE, 'readwrite', (store) =>
      store.put({ ...existing, mastered } as SavedWord),
    );
    this.events.dispatchEvent(new Event(EVENT));
  }

  private async lookup(word: string): Promise<SavedWord | null> {
    const hit = await withStore(VOCABULARY_STORE, 'readonly', (store) =>
      store.get(word),
    );
    return (hit as SavedWord | undefined) ?? null;
  }

  async contains(word: string): Promise<boolean> {
    return (await this.lookup(word)) != null;
  }

  subscribe(listener: () => void): () => void {
    this.events.addEventListener(EVENT, listener);
    return () => this.events.removeEventListener(EVENT, listener);
  }
}
