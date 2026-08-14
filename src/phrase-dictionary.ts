/**
 * Phrase recognition (phrasal verbs, collocations, idioms).
 *
 * Data: public/phrases.json copied from the mobile repo's
 * assets/phrases/phrases.json. When a token is tapped, nearby token
 * sequences are matched against the phrase bank; the longest match
 * around the tap wins.
 */

export const PHRASE_TYPE_LABELS: Record<string, string> = {
  phrasalVerb: '动词短语',
  prepositionalPhrase: '介词短语',
  collocation: '搭配',
  idiom: '习语',
};

export interface PhraseHit {
  key: string;
  surface: string;
  type: string;
  meaning: string;
  confidence: number;
}

interface PhraseEntry {
  key: string;
  words: string[];
  type: string;
  meaning: string;
  confidence: number;
}

export class PhraseDictionary {
  private entries: PhraseEntry[] = [];
  private loaded: Promise<void> | null = null;

  constructor(private readonly url = 'phrases.json') {}

  private ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.loaded = (async () => {
        const response = await fetch(this.url);
        if (!response.ok) throw new Error(`phrase bank unavailable (${response.status})`);
        this.entries = (await response.json()) as PhraseEntry[];
      })();
    }
    return this.loaded;
  }

  /** Longest phrase around the tapped token, if any. */
  async lookupAround(
    tokens: string[],
    index: number,
    maxWords = 6,
  ): Promise<PhraseHit | null> {
    await this.ensureLoaded();
    let best: PhraseHit | null = null;
    for (const entry of this.entries) {
      const width = entry.words.length;
      if (width > maxWords || width > tokens.length) continue;
      const minStart = Math.max(0, index - width + 1);
      const maxStart = Math.min(index, tokens.length - width);
      for (let start = minStart; start <= maxStart; start++) {
        if (matches(tokens, start, entry.words)) {
          const candidate: PhraseHit = {
            key: entry.key,
            surface: entry.words.join(' '),
            type: entry.type,
            meaning: entry.meaning,
            confidence: entry.confidence,
          };
          if (best == null || width > best.surface.split(' ').length) {
            best = candidate;
          }
          break;
        }
      }
    }
    return best;
  }
}

function matches(tokens: string[], start: number, words: string[]): boolean {
  for (let i = 0; i < words.length; i++) {
    if (tokens[start + i]?.toLowerCase() !== words[i]) return false;
  }
  return true;
}
