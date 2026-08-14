/**
 * Lazy, chunked ECDICT dictionary for the browser.
 *
 * `public/dictionary/{a..z,misc}.json.gz` hold per-first-letter entry and
 * lemma maps (see scripts/build-dictionary.py). Chunks are fetched and
 * decompressed on first use, then cached in memory.
 */

export interface DictionaryEntry {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definitionEnglish: string;
  definitionChinese: string;
}

interface RawEntry {
  p: string;
  pos: string;
  en: string;
  zh: string;
}

export interface ChunkData {
  entries: Record<string, RawEntry>;
  lemmas: Record<string, string>;
}

export type ChunkLoader = (name: string) => Promise<ChunkData>;

function chunkNameFor(word: string): string {
  const first = word.charAt(0).toLowerCase();
  return /^[a-z]$/.test(first) ? first : 'misc';
}

export class WebDictionary {
  private readonly chunks = new Map<string, Promise<ChunkData>>();

  constructor(private readonly loader: ChunkLoader) {}

  /** Resolves the tapped word to its entry; null when unknown. */
  async lookup(word: string): Promise<DictionaryEntry | null> {
    const key = word.toLowerCase();
    if (!key) return null;
    const chunk = await this.loadChunk(chunkNameFor(key));
    const entry = chunk.entries[key];
    if (entry) return this.toEntry(key, entry);
    // Inflected forms resolve through the lemma map (models -> model).
    const lemma = chunk.lemmas[key];
    if (lemma) {
      const lemmaChunk = await this.loadChunk(chunkNameFor(lemma));
      const resolved = lemmaChunk.entries[lemma];
      if (resolved) return this.toEntry(lemma, resolved);
    }
    return null;
  }

  private loadChunk(name: string): Promise<ChunkData> {
    let pending = this.chunks.get(name);
    if (!pending) {
      pending = this.loader(name);
      this.chunks.set(name, pending);
    }
    return pending;
  }

  private toEntry(word: string, raw: RawEntry): DictionaryEntry {
    return {
      word,
      phonetic: raw.p,
      partOfSpeech: raw.pos,
      definitionEnglish: raw.en,
      definitionChinese: raw.zh,
    };
  }
}

/** Default loader: fetch + decompress. Detects gzip by magic bytes so it
 * works both on static hosts that serve the raw .gz bytes (GitHub Pages)
 * and on dev servers that already decompress and send Content-Encoding. */
export function fetchChunkLoader(base = 'dictionary/'): ChunkLoader {
  return async (name) => {
    const response = await fetch(`${base}${name}.json.gz`);
    if (!response.ok || !response.body) {
      throw new Error(`dictionary chunk ${name} unavailable (${response.status})`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
      const reader = new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream('gzip'))
        .getReader();
      const parts: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value);
      }
      const total = parts.reduce((sum, part) => sum + part.length, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const part of parts) {
        merged.set(part, offset);
        offset += part.length;
      }
      return JSON.parse(new TextDecoder().decode(merged)) as ChunkData;
    }
    return JSON.parse(new TextDecoder().decode(bytes)) as ChunkData;
  };
}
