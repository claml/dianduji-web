import { readdirSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WebDictionary } from '../src/dictionary';
import type { ChunkData } from '../src/dictionary';

const CHUNKS_DIR = join(__dirname, '..', 'public', 'dictionary');

function loadChunkFromDisk(name: string): ChunkData {
  const raw = readFileSync(join(CHUNKS_DIR, `${name}.json.gz`));
  const text = gunzipSync(raw).toString('utf-8');
  return JSON.parse(text) as ChunkData;
}

describe('built dictionary chunks', () => {
  it('has one gzip chunk per letter plus misc', () => {
    const names = readdirSync(CHUNKS_DIR).filter((f) => f.endsWith('.json.gz'));
    expect(names).toHaveLength(27);
    for (const name of names) {
      const size = readFileSync(join(CHUNKS_DIR, name)).length;
      expect(size).toBeGreaterThan(0);
    }
  });

  it('contains common research words with full fields', () => {
    for (const word of ['model', 'protein', 'cell', 'analysis', 'attention']) {
      const chunk = loadChunkFromDisk(word.charAt(0));
      const entry = chunk.entries[word];
      expect(entry, `missing ${word}`).toBeTruthy();
      expect(entry.zh.length).toBeGreaterThan(0);
    }
  });

  it('maps inflected forms through lemmas', () => {
    const chunk = loadChunkFromDisk('m');
    expect(chunk.lemmas['models']).toBe('model');
  });
});

describe('WebDictionary lookup', () => {
  it('resolves a direct hit with normalized casing', async () => {
    const dict = new WebDictionary((name) =>
      Promise.resolve(loadChunkFromDisk(name)),
    );
    const entry = await dict.lookup('Model');
    expect(entry?.word).toBe('model');
    expect(entry?.definitionChinese.length).toBeGreaterThan(0);
  });

  it('resolves an inflected form via lemmas', async () => {
    const dict = new WebDictionary((name) =>
      Promise.resolve(loadChunkFromDisk(name)),
    );
    const entry = await dict.lookup('models');
    expect(entry?.word).toBe('model');
  });

  it('returns null for unknown words', async () => {
    const dict = new WebDictionary((name) =>
      Promise.resolve(loadChunkFromDisk(name)),
    );
    expect(await dict.lookup('zzzqqqxyz')).toBeNull();
  });

  it('caches chunks and fails gracefully on loader errors', async () => {
    let loads = 0;
    const dict = new WebDictionary(async (name) => {
      loads += 1;
      return loadChunkFromDisk(name);
    });
    await dict.lookup('model');
    await dict.lookup('memory');
    expect(loads).toBe(1); // same chunk loaded once
    const broken = new WebDictionary(async () => {
      throw new Error('offline');
    });
    await expect(broken.lookup('model')).rejects.toThrow('offline');
  });

  it('prefetches chunks in the background without failing lookups', async () => {
    const loaded = new Set<string>();
    const dict = new WebDictionary(async (name) => {
      loaded.add(name);
      return loadChunkFromDisk(name);
    });
    dict.prefetch(['a', 'm', 'zzz-unknown']);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(loaded.has('a')).toBe(true);
    expect(loaded.has('m')).toBe(true);
    // A later lookup of a prefetched chunk does not reload it.
    const before = loaded.size;
    await dict.lookup('model');
    expect(loaded.size).toBe(before);
  });
});
