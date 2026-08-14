import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { VocabularyBook } from '../src/vocabulary';

async function clearStore(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('dianduji', 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('vocabulary')) {
        request.result.createObjectStore('vocabulary', { keyPath: 'word' });
      }
      if (!request.result.objectStoreNames.contains('reading')) {
        request.result.createObjectStore('reading', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('vocabulary', 'readwrite');
      tx.objectStore('vocabulary').clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

describe('VocabularyBook', () => {
  beforeEach(clearStore);

  function makeBook(): VocabularyBook {
    return new VocabularyBook(new EventTarget());
  }

  it('adds, lists newest-first and removes words', async () => {
    const book = makeBook();
    await book.add({
      word: 'cell',
      phonetic: '/sel/',
      definitionChinese: 'n. 细胞',
      addedAt: 1,
    });
    await book.add({
      word: 'gene',
      phonetic: '/dʒiːn/',
      definitionChinese: 'n. 基因',
      addedAt: 2,
    });

    const words = await book.list();
    expect(words.map((w) => w.word)).toEqual(['gene', 'cell']);
    expect(words[0].phonetic).toBe('/dʒiːn/');

    expect(await book.contains('cell')).toBe(true);
    await book.remove('cell');
    expect(await book.contains('cell')).toBe(false);
    expect(await book.list()).toHaveLength(1);
  });

  it('upserts an existing word instead of duplicating', async () => {
    const book = makeBook();
    await book.add({
      word: 'cell',
      phonetic: '',
      definitionChinese: '旧释义',
      addedAt: 1,
    });
    await book.add({
      word: 'cell',
      phonetic: '/sel/',
      definitionChinese: '新释义',
      addedAt: 2,
    });
    const words = await book.list();
    expect(words).toHaveLength(1);
    expect(words[0].definitionChinese).toBe('新释义');
  });
});
