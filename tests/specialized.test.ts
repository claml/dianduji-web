import { describe, expect, it } from 'vitest';
import { SpecializedDictionary } from '../src/specialized';

describe('SpecializedDictionary matching', () => {
  function seed(dict: SpecializedDictionary, terms: Array<{ term: string; domain: string; definition: string }>) {
    const map = (dict as unknown as { terms: Map<string, unknown> }).terms;
    (dict as unknown as { loaded: Promise<void> }).loaded = Promise.resolve();
    for (const t of terms) map.set(t.term, t);
  }

  it('finds a multi-word term around the tapped token, longest first', async () => {
    const dict = new SpecializedDictionary('unused.json');
    seed(dict, [
      { term: 'machine learning', domain: 'computerScience', definition: '机器学习' },
      { term: 'machine', domain: 'computerScience', definition: '机器' },
    ]);

    const tokens = ['Recent', 'machine', 'learning', 'advances'];
    const hit = await dict.lookupAround(tokens, 1);
    expect(hit?.term).toBe('machine learning');

    const single = await dict.lookupAround(['a', 'machine', 'gun'], 1);
    expect(single?.term).toBe('machine');
  });

  it('returns null when nothing matches', async () => {
    const dict = new SpecializedDictionary('unused.json');
    seed(dict, []);
    expect(await dict.lookupAround(['hello', 'world'], 0)).toBeNull();
  });

  it('respects the window size', async () => {
    const dict = new SpecializedDictionary('unused.json');
    seed(dict, [
      { term: 'convolutional neural network', domain: 'computerScience', definition: '卷积神经网络' },
    ]);
    const tokens = ['a', 'convolutional', 'neural', 'network', 'model'];
    const hit = await dict.lookupAround(tokens, 1, 3);
    expect(hit?.term).toBe('convolutional neural network');
    const capped = await dict.lookupAround(tokens, 1, 2);
    expect(capped).toBeNull();
  });
});
