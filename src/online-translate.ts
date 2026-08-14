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
  sentenceTranslation: string;
  sourceId: string;
}

export type TranslateOutcome =
  | { ok: true; result: OnlineTranslation }
  | { ok: false; reason: 'offline' | 'error' };

export interface OnlineTranslator {
  translate(term: string): Promise<TranslateOutcome>;
  translateSentence(sentence: string): Promise<TranslateOutcome>;
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
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly baseUrl: string = loadGatewayUrl(),
    fetchImpl: typeof fetch = fetch.bind(globalThis),
  ) {
    this.fetchImpl = fetchImpl;
  }

  async translate(term: string): Promise<TranslateOutcome> {
    const clean = term.trim();
    if (!clean) return { ok: false, reason: 'error' };
    return this.call({ term: clean, sentence: '' });
  }

  async translateSentence(sentence: string): Promise<TranslateOutcome> {
    const clean = sentence.trim();
    if (!clean) return { ok: false, reason: 'error' };
    return this.call({ term: '', sentence: clean });
  }

  private async call(payload: {
    term: string;
    sentence: string;
  }): Promise<TranslateOutcome> {
    // First connection to the gateway can be flaky (cold TCP / CORS
    // preflight); retry once before reporting offline.
    for (let attempt = 0; attempt < 2; attempt++) {
      const outcome = await this.tryCall(payload);
      if (outcome.ok || outcome.reason === 'error') return outcome;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return { ok: false, reason: 'offline' };
  }

  private async tryCall(payload: {
    term: string;
    sentence: string;
  }): Promise<TranslateOutcome> {
    let response: Response;
    try {
      response = await this.fetchImpl(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      });
    } catch (error) {
      // Network error / CORS / gateway not running.
      console.error('gateway fetch failed:', error);
      return { ok: false, reason: 'offline' };
    }
    if (!response.ok) return { ok: false, reason: 'error' };
    try {
      const body = (await response.json()) as {
        termTranslation?: string;
        sentenceTranslation?: string;
        sourceId?: string;
      };
      const termText = (body.termTranslation ?? '').trim();
      const sentenceText = (body.sentenceTranslation ?? '').trim();
      const text = payload.sentence ? sentenceText : termText;
      if (!text) return { ok: false, reason: 'error' };
      return {
        ok: true,
        result: {
          termTranslation: termText,
          sentenceTranslation: sentenceText,
          sourceId: body.sourceId ?? 'gateway',
        },
      };
    } catch {
      return { ok: false, reason: 'error' };
    }
  }
}
