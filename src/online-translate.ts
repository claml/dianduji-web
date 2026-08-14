/**
 * Online translation through the self-hosted gateway.
 *
 * Contract: mobile/docs/gateway-reference/online-translation-gateway.md
 * (POST {term, sentence} -> {termTranslation, sentenceTranslation, ...}).
 * The web client never holds keys; the gateway address is user-configured
 * (localStorage) and defaults to the local gateway.
 */

export interface OnlineTranslation {
  termTranslation: string;
  sourceId: string;
}

export type TranslateOutcome =
  | { ok: true; result: OnlineTranslation }
  | { ok: false; reason: 'offline' | 'error' };

export interface OnlineTranslator {
  translate(term: string): Promise<TranslateOutcome>;
}

const DEFAULT_GATEWAY = 'http://127.0.0.1:8080/translate';
const SETTINGS_KEY = 'dianduji.gatewayUrl';

export function loadGatewayUrl(): string {
  try {
    return localStorage.getItem(SETTINGS_KEY) || DEFAULT_GATEWAY;
  } catch {
    return DEFAULT_GATEWAY;
  }
}

export function saveGatewayUrl(url: string): void {
  try {
    localStorage.setItem(SETTINGS_KEY, url.trim());
  } catch {
    // storage unavailable; keep default
  }
}

export class GatewayTranslator implements OnlineTranslator {
  constructor(
    private readonly baseUrl: string = loadGatewayUrl(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async translate(term: string): Promise<TranslateOutcome> {
    const clean = term.trim();
    if (!clean) return { ok: false, reason: 'error' };
    let response: Response;
    try {
      response = await this.fetchImpl(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ term: clean, sentence: '' }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // Network error / CORS / gateway not running.
      return { ok: false, reason: 'offline' };
    }
    if (!response.ok) return { ok: false, reason: 'error' };
    try {
      const body = (await response.json()) as {
        termTranslation?: string;
        sourceId?: string;
      };
      const text = (body.termTranslation ?? '').trim();
      if (!text) return { ok: false, reason: 'error' };
      return {
        ok: true,
        result: {
          termTranslation: text,
          sourceId: body.sourceId ?? 'gateway',
        },
      };
    } catch {
      return { ok: false, reason: 'error' };
    }
  }
}
