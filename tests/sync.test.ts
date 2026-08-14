import { describe, expect, it, vi } from 'vitest';
import { SyncClient } from '../src/sync';
import { WebSyncEngine } from '../src/sync-engine';
import type { SyncDataBundle } from '../src/sync-data';

type FetchHandler = (url: string, init?: RequestInit) => Promise<Response>;

function mockFetch(handler: FetchHandler): typeof fetch {
  return vi.fn(handler) as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

describe('SyncClient', () => {
  it('registers and returns the session', async () => {
    const fetchImpl = mockFetch(async () =>
      jsonResponse({ token: 't1', user: { id: 1, username: 'alice' } }, 201),
    );
    const client = new SyncClient('http://gw:8080', fetchImpl);
    const result = await client.register('alice', 'secret1');
    expect(result.token).toBe('t1');
    expect(result.user.username).toBe('alice');
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://gw:8080/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('maps 401 to invalidCredentials and 409 to usernameTaken', async () => {
    const bad = new SyncClient(
      'http://gw:8080',
      mockFetch(async () => jsonResponse({ error: 'x' }, 401)),
    );
    await expect(bad.login('a', 'b')).rejects.toMatchObject({
      failure: 'invalidCredentials',
    });

    const taken = new SyncClient(
      'http://gw:8080',
      mockFetch(async () => jsonResponse({ error: 'x' }, 409)),
    );
    await expect(taken.register('a', 'b')).rejects.toMatchObject({
      failure: 'usernameTaken',
    });
  });

  it('fetch returns null for empty remote state', async () => {
    const client = new SyncClient(
      'http://gw:8080',
      mockFetch(async () => jsonResponse({ data: null, updatedAt: 0 })),
    );
    expect(await client.fetch('tok')).toBeNull();
  });

  it('push sends the bearer token', async () => {
    let seenAuth = '';
    const client = new SyncClient(
      'http://gw:8080',
      mockFetch(async (_url, init) => {
        seenAuth = String((init?.headers as Record<string, string> | undefined)?.['Authorization'] ?? '');
        return jsonResponse({ data: { v: 1 }, updatedAt: 10, accepted: true });
      }),
    );
    const result = await client.push('tok', { v: 1 }, 10);
    expect(result.accepted).toBe(true);
    expect(seenAuth).toBe('Bearer tok');
  });

  it('reports offline on network failure', async () => {
    const client = new SyncClient(
      'http://gw:8080',
      mockFetch(async () => {
        throw new TypeError('fetch failed');
      }),
    );
    await expect(client.login('a', 'b')).rejects.toMatchObject({
      failure: 'offline',
    });
  });
});

describe('WebSyncEngine', () => {
  it('stores the session and syncs local-newest by pushing', async () => {
    const fetchImpl = mockFetch(async (url) => {
      if (url.endsWith('/auth/register')) {
        return jsonResponse({ token: 't1', user: { id: 1, username: 'alice' } }, 201);
      }
      if (url.endsWith('/sync/get')) {
        return jsonResponse({ data: { v: 1 }, updatedAt: 50 });
      }
      if (url.endsWith('/sync/put')) {
        return jsonResponse({ data: { v: 2 }, updatedAt: 100, accepted: true });
      }
      return jsonResponse({ error: 'x' }, 404);
    });
    const storage = memoryStorage();
    const engine = new WebSyncEngine(
      async () => ({ data: { v: 2 }, updatedAt: 100 } as SyncDataBundle),
      async () => {},
      storage,
      new SyncClient('http://gw:8080', fetchImpl),
    );
    await engine.register('alice', 'secret1');
    expect(engine.isLoggedIn).toBe(true);
    expect(storage.getItem('dianduji.syncToken')).toBeTruthy();

    const outcome = await engine.syncNow();
    expect(outcome.pushedLocal).toBe(true);
  });

  it('applies a newer remote snapshot and restores the session', async () => {
    const fetchImpl = mockFetch(async (url) => {
      if (url.endsWith('/auth/register')) {
        return jsonResponse({ token: 't1', user: { id: 1, username: 'alice' } }, 201);
      }
      return jsonResponse({ data: { v: 'remote' }, updatedAt: 200 });
    });
    const storage = memoryStorage();
    let applied: Record<string, unknown> | null = null;
    const engine = new WebSyncEngine(
      async () => ({ data: { v: 'local' }, updatedAt: 100 } as SyncDataBundle),
      async (data) => {
        applied = data;
      },
      storage,
      new SyncClient('http://gw:8080', fetchImpl),
    );
    await engine.register('alice', 'secret1');
    const outcome = await engine.syncNow();
    expect(outcome.appliedRemote).toBe(true);
    expect(applied?.['v']).toBe('remote');

    // A second engine restores the session from storage.
    const restored = new WebSyncEngine(
      async () => ({ data: {}, updatedAt: 0 } as SyncDataBundle),
      async () => {},
      storage,
    );
    expect(restored.isLoggedIn).toBe(true);
    expect(restored.user?.username).toBe('alice');
  });

  it('clears the session when the token is rejected', async () => {
    const fetchImpl = mockFetch(async (url) => {
      if (url.endsWith('/auth/register')) {
        return jsonResponse({ token: 'bad', user: { id: 1, username: 'alice' } }, 201);
      }
      return jsonResponse({ error: 'x' }, 401);
    });
    const storage = memoryStorage();
    const engine = new WebSyncEngine(
      async () => ({ data: {}, updatedAt: 1 } as SyncDataBundle),
      async () => {},
      storage,
      new SyncClient('http://gw:8080', fetchImpl),
    );
    await engine.register('alice', 'secret1');
    await expect(engine.syncNow()).rejects.toMatchObject({ failure: 'rejected' });
    expect(engine.isLoggedIn).toBe(false);
    expect(storage.getItem('dianduji.syncToken')).toBeNull();
  });
});
