import { describe, expect, it } from 'vitest';
import { PhraseDictionary } from '../src/phrase-dictionary';

describe('PhraseDictionary', () => {
  function seed(dict: PhraseDictionary, entries: Array<{ key: string; words: string[]; type: string; meaning: string; confidence: number }>) {
    (dict as unknown as { entries: unknown[] }).entries = entries;
    (dict as unknown as { loaded: Promise<void> }).loaded = Promise.resolve();
  }

  it('matches a two-word phrasal verb around the tap', async () => {
    const dict = new PhraseDictionary('unused.json');
    seed(dict, [
      { key: 'look-up', words: ['look', 'up'], type: 'phrasalVerb', meaning: '查阅', confidence: 0.98 },
    ]);
    const hit = await dict.lookupAround(['please', 'look', 'up', 'the', 'word'], 1);
    expect(hit?.surface).toBe('look up');
    expect(hit?.meaning).toBe('查阅');
  });

  it('prefers the longest phrase and is case-insensitive', async () => {
    const dict = new PhraseDictionary('unused.json');
    seed(dict, [
      { key: 'pay-attention-to', words: ['pay', 'attention', 'to'], type: 'collocation', meaning: '注意', confidence: 0.99 },
      { key: 'attention', words: ['attention'], type: 'collocation', meaning: '单', confidence: 0.9 },
    ]);
    const hit = await dict.lookupAround(['Pay', 'Attention', 'To', 'details'], 1);
    expect(hit?.surface).toBe('pay attention to');
  });

  it('returns null when nothing matches', async () => {
    const dict = new PhraseDictionary('unused.json');
    seed(dict, [
      { key: 'look-up', words: ['look', 'up'], type: 'phrasalVerb', meaning: '查阅', confidence: 0.98 },
    ]);
    expect(await dict.lookupAround(['hello', 'world'], 0)).toBeNull();
  });
});
