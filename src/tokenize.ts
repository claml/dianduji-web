/**
 * Tokenizer for PDF text-layer items.
 *
 * pdf.js reports each text run as a single string; this splits it into
 * words while keeping their character offsets so the reader can place a
 * clickable span per word and map a click back to the exact word.
 */

export interface TextToken {
  /** The word as extracted (keeps internal hyphens/apostrophes). */
  text: string;
  /** Character offset of the token inside the source string. */
  startChar: number;
  /** Character offset one past the last character of the token. */
  endChar: number;
}

// Leading letter guards against stray control characters some PDFs embed.
const WORD_RE = /[A-Za-z][A-Za-z'’-]*/g;

export function tokenizeItem(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  for (const match of text.matchAll(WORD_RE)) {
    tokens.push({
      text: match[0],
      startChar: match.index,
      endChar: match.index + match[0].length,
    });
  }
  return tokens;
}

/** Approximate horizontal offset (in text pixels) of a character run. */
export function charOffsetPx(fontSizePx: number, charCount: number): number {
  // 0.5 x font size is a reasonable average advance for Latin text.
  return fontSizePx * 0.5 * charCount;
}
