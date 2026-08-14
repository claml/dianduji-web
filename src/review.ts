/**
 * Review queue for the vocabulary book.
 *
 * Unmastered words come first (shuffled), mastered words follow, so the
 * reader reviews what they have not yet marked as known.
 */

import type { SavedWord } from './vocabulary';

export interface ReviewCard {
  word: string;
  phonetic: string;
  definitionChinese: string;
  mastered: boolean;
}

export function buildReviewQueue(words: SavedWord[]): ReviewCard[] {
  const unmastered = words.filter((w) => !w.mastered);
  const mastered = words.filter((w) => w.mastered);
  return [...shuffle(unmastered), ...shuffle(mastered)].map((w) => ({
    word: w.word,
    phonetic: w.phonetic,
    definitionChinese: w.definitionChinese,
    mastered: w.mastered === true,
  }));
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
