/**
 * Web sync data provider: collects the local learning snapshot
 * (vocabulary, phrases, custom definitions, reading settings) into the
 * versioned payload and applies a remote snapshot back.
 */

import { CustomDefinitionStore } from './custom-definitions';
import { PhraseStore } from './phrases';
import { VocabularyBook } from './vocabulary';
import { ReadingStore } from './reading-state';

export interface SyncDataBundle {
  data: Record<string, unknown>;
  updatedAt: number;
}

export const SYNC_VERSION = 1;
const ONLINE_KEY = 'dianduji.onlineEnabled';
const THEME_KEY = 'dianduji.theme';
const FONT_KEY = 'dianduji.fontSize';
const LINE_KEY = 'dianduji.lineHeight';

export class WebSyncData {
  constructor(
    private readonly book: VocabularyBook,
    private readonly phrases: PhraseStore,
    private readonly customs: CustomDefinitionStore,
    private readonly reading: ReadingStore,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async collect(): Promise<SyncDataBundle> {
    const [words, saved, customs, recent] = await Promise.all([
      this.book.list(),
      this.phrases.list(),
      this.customs.list(),
      this.reading.recent(),
    ]);
    const newest =
      Math.max(
        ...words.map((w) => w.addedAt),
        ...saved.map((p) => p.addedAt),
        ...customs.map((c) => c.createdAt),
        ...recent.map((r) => r.savedAt),
        this.now(),
      ) || this.now();
    return {
      data: {
        version: SYNC_VERSION,
        vocabulary: words.map((w) => ({
          word: w.word,
          phonetic: w.phonetic,
          definitionChinese: w.definitionChinese,
          mastered: w.mastered === true,
          addedAt: w.addedAt,
        })),
        phrases: saved.map((p) => ({ text: p.text, translation: p.translation })),
        customDefinitions: customs.map((c) => ({
          word: c.word,
          definition: c.definition,
        })),
        reading: recent.map((r) => ({ id: r.id, name: r.name, page: r.page })),
        settings: {
          onlineEnabled: readBool(ONLINE_KEY, true),
          theme: readString(THEME_KEY, 'system'),
          fontSize: readString(FONT_KEY, '17'),
          lineHeight: readString(LINE_KEY, '1.9'),
        },
      },
      updatedAt: newest,
    };
  }

  async apply(data: Record<string, unknown>, _updatedAt: number): Promise<void> {
    if (data['version'] !== SYNC_VERSION) return;

    const vocabulary = data['vocabulary'];
    if (Array.isArray(vocabulary)) {
      const local = await this.book.list();
      const remoteWords = new Set<string>();
      for (const raw of vocabulary) {
        if (typeof raw !== 'object' || raw == null) continue;
        const entry = raw as Record<string, unknown>;
        const word = entry['word'];
        if (typeof word !== 'string') continue;
        remoteWords.add(word);
        await this.book.add({
          word,
          phonetic: typeof entry['phonetic'] === 'string' ? entry['phonetic'] : '',
          definitionChinese:
            typeof entry['definitionChinese'] === 'string'
              ? entry['definitionChinese']
              : '',
          addedAt: typeof entry['addedAt'] === 'number' ? entry['addedAt'] : Date.now(),
          mastered: entry['mastered'] === true,
        });
      }
      for (const item of local) {
        if (!remoteWords.has(item.word)) {
          await this.book.remove(item.word);
        }
      }
    }

    const phrases = data['phrases'];
    if (Array.isArray(phrases)) {
      for (const raw of phrases) {
        if (typeof raw !== 'object' || raw == null) continue;
        const entry = raw as Record<string, unknown>;
        const text = entry['text'];
        if (typeof text !== 'string') continue;
        await this.phrases.add(
          text,
          typeof entry['translation'] === 'string' ? entry['translation'] : '',
        );
      }
    }

    const customDefinitions = data['customDefinitions'];
    if (Array.isArray(customDefinitions)) {
      for (const raw of customDefinitions) {
        if (typeof raw !== 'object' || raw == null) continue;
        const entry = raw as Record<string, unknown>;
        const word = entry['word'];
        const definition = entry['definition'];
        if (typeof word === 'string' && typeof definition === 'string') {
          await this.customs.save(word, definition);
        }
      }
    }

    const reading = data['reading'];
    if (Array.isArray(reading)) {
      for (const raw of reading) {
        if (typeof raw !== 'object' || raw == null) continue;
        const entry = raw as Record<string, unknown>;
        const id = entry['id'];
        const name = entry['name'];
        const page = entry['page'];
        if (typeof id === 'string' && typeof name === 'string' && typeof page === 'number') {
          await this.reading.save(id, name, page);
        }
      }
    }

    const settings = data['settings'];
    if (typeof settings === 'object' && settings != null) {
      const s = settings as Record<string, unknown>;
      if (typeof s['onlineEnabled'] === 'boolean') writeBool(ONLINE_KEY, s['onlineEnabled']);
      if (typeof s['theme'] === 'string') writeString(THEME_KEY, s['theme']);
      if (typeof s['fontSize'] === 'string') writeString(FONT_KEY, s['fontSize']);
      if (typeof s['lineHeight'] === 'string') writeString(LINE_KEY, s['lineHeight']);
    }
  }
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : value !== 'false';
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // storage unavailable
  }
}

function readString(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable
  }
}
