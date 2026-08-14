import { describe, expect, it } from 'vitest';
import { buildReviewQueue } from '../src/review';
import type { SavedWord } from '../src/vocabulary';

function word(name: string, mastered = false): SavedWord {
  return {
    word: name,
    phonetic: '',
    definitionChinese: '释义',
    addedAt: 1,
    mastered,
  };
}

describe('buildReviewQueue', () => {
  it('puts unmastered words before mastered ones', () => {
    const queue = buildReviewQueue([
      word('gene', true),
      word('cell', false),
      word('model', true),
      word('protein', false),
    ]);
    expect(queue.map((c) => c.word).slice(0, 2).sort()).toEqual(['cell', 'protein']);
    expect(queue.map((c) => c.word).slice(2).sort()).toEqual(['gene', 'model']);
    expect(queue).toHaveLength(4);
  });

  it('shuffles within each group', () => {
    const words = Array.from({ length: 12 }, (_, i) => word(`w${i}`));
    const first = buildReviewQueue(words).map((c) => c.word).join(',');
    const second = buildReviewQueue(words).map((c) => c.word).join(',');
    // Extremely unlikely to be identical for 12 items.
    expect(first).not.toBe(second);
  });

  it('handles an empty book', () => {
    expect(buildReviewQueue([])).toEqual([]);
  });
});
