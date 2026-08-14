import { describe, expect, it, vi } from 'vitest';
import { GatewayTranslator } from '../src/online-translate';

type FetchHandler = (url: string, init?: RequestInit) => Promise<Response>;

function mockFetch(handler: FetchHandler): typeof fetch {
  return vi.fn(handler) as unknown as typeof fetch;
}

describe('GatewayTranslator', () => {
  it('returns the translation on success', async () => {
    const fetchImpl = mockFetch(async () =>
      new Response(
        JSON.stringify({ termTranslation: '架构', sourceId: 'tencent-tmt' }),
        { status: 200 },
      ),
    );
    const translator = new GatewayTranslator('http://gw/translate', fetchImpl);
    const outcome = await translator.translate('architecture');
    expect(outcome).toEqual({
      ok: true,
      result: { termTranslation: '架构', sourceId: 'tencent-tmt' },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://gw/translate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ term: 'architecture', sentence: '' }),
      }),
    );
  });

  it('reports offline on network failure', async () => {
    const fetchImpl = mockFetch(async () => {
      throw new TypeError('fetch failed');
    });
    const translator = new GatewayTranslator('http://gw/translate', fetchImpl);
    expect(await translator.translate('x')).toEqual({
      ok: false,
      reason: 'offline',
    });
  });

  it('reports error on server failure', async () => {
    const fetchImpl = mockFetch(async () => new Response('nope', { status: 503 }));
    const translator = new GatewayTranslator('http://gw/translate', fetchImpl);
    expect(await translator.translate('x')).toEqual({
      ok: false,
      reason: 'error',
    });
  });

  it('reports error when the body carries no translation', async () => {
    const fetchImpl = mockFetch(async () =>
      new Response(JSON.stringify({ termTranslation: '' }), { status: 200 }),
    );
    const translator = new GatewayTranslator('http://gw/translate', fetchImpl);
    expect(await translator.translate('x')).toEqual({
      ok: false,
      reason: 'error',
    });
  });

  it('skips empty terms', async () => {
    const fetchImpl = mockFetch(async () => new Response('{}', { status: 200 }));
    const translator = new GatewayTranslator('http://gw/translate', fetchImpl);
    expect(await translator.translate('   ')).toEqual({
      ok: false,
      reason: 'error',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
