/**
 * Custom definitions (user dictionary) persisted in IndexedDB.
 *
 * Mirrors the mobile app's manual-definition feature: when neither the
 * general nor the specialized dictionary knows a word, the reader can
 * write their own contextual definition; it is stored locally and takes
 * precedence over online translation on later lookups.
 */

import { CUSTOM_DEFS_STORE, withStore } from './idb';

export interface CustomDefinition {
  word: string;
  definition: string;
  createdAt: number;
}

export class CustomDefinitionStore {
  async save(word: string, definition: string): Promise<void> {
    await withStore(CUSTOM_DEFS_STORE, 'readwrite', (store) =>
      store.put({
        word: word.toLowerCase(),
        definition,
        createdAt: Date.now(),
      } as CustomDefinition),
    );
  }

  async load(word: string): Promise<CustomDefinition | null> {
    const hit = await withStore(CUSTOM_DEFS_STORE, 'readonly', (store) =>
      store.get(word.toLowerCase()),
    );
    return (hit as CustomDefinition | undefined) ?? null;
  }

  async remove(word: string): Promise<void> {
    await withStore(CUSTOM_DEFS_STORE, 'readwrite', (store) =>
      store.delete(word.toLowerCase()),
    );
  }
}
