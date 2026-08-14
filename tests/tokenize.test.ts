import { describe, expect, it } from 'vitest';
import { charOffsetPx, tokenizeItem } from '../src/tokenize';

describe('tokenizeItem', () => {
  it('splits a simple sentence into words with offsets', () => {
    const tokens = tokenizeItem('Hello world');
    expect(tokens).toEqual([
      { text: 'Hello', startChar: 0, endChar: 5 },
      { text: 'world', startChar: 6, endChar: 11 },
    ]);
  });

  it('keeps internal hyphens and apostrophes', () => {
    const tokens = tokenizeItem("state-of-the-art isn't");
    expect(tokens.map((t) => t.text)).toEqual([
      'state-of-the-art',
      "isn't",
    ]);
  });

  it('skips punctuation and whitespace', () => {
    const tokens = tokenizeItem('(RNA), DNA. ');
    expect(tokens.map((t) => t.text)).toEqual(['RNA', 'DNA']);
  });

  it('rejects empty and non-letter strings', () => {
    expect(tokenizeItem('')).toEqual([]);
    expect(tokenizeItem('--- 123 ---')).toEqual([]);
  });

  it('reports offsets inside the original string', () => {
    const tokens = tokenizeItem('the protein');
    expect(tokens[0]).toEqual({ text: 'the', startChar: 0, endChar: 3 });
    expect(tokens[1]).toEqual({ text: 'protein', startChar: 4, endChar: 11 });
  });
});

describe('charOffsetPx', () => {
  it('scales with font size and character count', () => {
    expect(charOffsetPx(20, 2)).toBe(20);
    expect(charOffsetPx(10, 3)).toBe(15);
  });
});
