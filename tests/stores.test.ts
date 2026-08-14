import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { CustomDefinitionStore } from '../src/custom-definitions';
import { PhraseStore, phraseId } from '../src/phrases';

async function resetDb(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('dianduji', 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of ['vocabulary', 'reading', 'custom-defs', 'phrases']) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: store === 'vocabulary' || store === 'custom-defs' ? 'word' : 'id' });
        }
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(['custom-defs', 'phrases'], 'readwrite');
      tx.objectStore('custom-defs').clear();
      tx.objectStore('phrases').clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

describe('CustomDefinitionStore', () => {
  beforeEach(resetDb);

  it('saves and loads a definition case-insensitively', async () => {
    const store = new CustomDefinitionStore();
    expect(await store.load('MEC')).toBeNull();
    await store.save('MEC', '城市设计与导航实验（缩写）');
    const hit = await store.load('mec');
    expect(hit?.definition).toBe('城市设计与导航实验（缩写）');
  });

  it('removes a definition', async () => {
    const store = new CustomDefinitionStore();
    await store.save('mec', '定义');
    await store.remove('MEC');
    expect(await store.load('mec')).toBeNull();
  });
});

describe('PhraseStore', () => {
  beforeEach(resetDb);

  it('adds, de-duplicates and lists sentences', async () => {
    const store = new PhraseStore();
    await store.add('Attention is all you need.', '注意力即你所需要的一切。');
    await store.add('Attention is all you need.', '重复');
    await store.add('Data is the new oil.', '数据是新时代的石油。');
    const list = await store.list();
    expect(list).toHaveLength(2);
    expect(list[0].text).toBe('Data is the new oil.');
    expect(await store.contains('Attention is all you need.')).toBe(true);
    await store.remove(phraseId('Attention is all you need.'));
    expect(await store.contains('Attention is all you need.')).toBe(false);
  });
});
