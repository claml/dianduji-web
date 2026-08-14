import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentId, ReadingStore } from '../src/reading-state';

async function clearReading(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('dianduji', 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('vocabulary')) {
        db.createObjectStore('vocabulary', { keyPath: 'word' });
      }
      if (!db.objectStoreNames.contains('reading')) {
        db.createObjectStore('reading', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('reading')) {
        db.close();
        resolve();
        return;
      }
      const tx = db.transaction('reading', 'readwrite');
      tx.objectStore('reading').clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

describe('ReadingStore', () => {
  beforeEach(clearReading);

  it('saves and restores the page for a document', async () => {
    const store = new ReadingStore();
    const id = documentId('paper.pdf', 12345);
    expect(id).toMatch(/^doc-/);
    expect(await store.load(id)).toBeNull();

    await store.save(id, 'paper.pdf', 7);
    const state = await store.load(id);
    expect(state?.page).toBe(7);
    expect(state?.name).toBe('paper.pdf');
  });

  it('keeps the most recent documents first', async () => {
    const store = new ReadingStore();
    await store.save('doc-a', 'a.pdf', 1);
    await new Promise((r) => setTimeout(r, 5));
    await store.save('doc-b', 'b.pdf', 2);
    const recent = await store.recent();
    expect(recent.map((r) => r.id)).toEqual(['doc-b', 'doc-a']);
  });
});
