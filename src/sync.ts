/**
 * Account & cloud-sync client for the web edition.
 *
 * Same contract as the mobile app (docs/gateway-reference/sync-api.md),
 * so one self-hosted gateway serves both. The gateway base URL is the
 * root of the configured translate URL (e.g. http://host:8080).
 */

import { loadGatewayUrl } from './online-translate';

export interface SyncUser {
  id: number;
  username: string;
}

export interface SyncSnapshot {
  data: Record<string, unknown>;
  updatedAt: number;
}

export interface SyncPutResult {
  data: Record<string, unknown>;
  updatedAt: number;
  accepted: boolean;
}

export type SyncFailure = 'offline' | 'invalidCredentials' | 'usernameTaken' | 'rejected' | 'badResponse';

export class SyncError extends Error {
  constructor(
    readonly failure: SyncFailure,
    message = failure,
  ) {
    super(message);
  }
}

/** Derives the gateway root from the translate URL. */
export function gatewayRoot(): string {
  const url = loadGatewayUrl();
  try {
    const parsed = new URL(url);
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return 'http://127.0.0.1:8080';
  }
}

export class SyncClient {
  constructor(
    private readonly root: string = gatewayRoot(),
    private readonly fetchImpl: typeof fetch = fetch.bind(globalThis),
  ) {}

  async register(username: string, password: string): Promise<{ token: string; user: SyncUser }> {
    return this.authenticate('/auth/register', username, password);
  }

  async login(username: string, password: string): Promise<{ token: string; user: SyncUser }> {
    return this.authenticate('/auth/login', username, password);
  }

  async fetch(token: string): Promise<SyncSnapshot | null> {
    const body = await this.request('GET', '/sync/get', token);
    const decoded = body as { data?: unknown; updatedAt?: unknown };
    if (decoded.data == null) return null;
    if (typeof decoded.data !== 'object' || typeof decoded.updatedAt !== 'number') {
      throw new SyncError('badResponse');
    }
    return {
      data: decoded.data as Record<string, unknown>,
      updatedAt: decoded.updatedAt,
    };
  }

  async push(
    token: string,
    data: Record<string, unknown>,
    updatedAt: number,
  ): Promise<SyncPutResult> {
    const body = (await this.request('POST', '/sync/put', token, {
      data,
      updatedAt,
    })) as { data?: unknown; updatedAt?: unknown; accepted?: unknown };
    if (
      typeof body.data !== 'object' ||
      body.data == null ||
      typeof body.updatedAt !== 'number' ||
      typeof body.accepted !== 'boolean'
    ) {
      throw new SyncError('badResponse');
    }
    return {
      data: body.data as Record<string, unknown>,
      updatedAt: body.updatedAt,
      accepted: body.accepted,
    };
  }

  private async authenticate(
    path: string,
    username: string,
    password: string,
  ): Promise<{ token: string; user: SyncUser }> {
    const body = (await this.request('POST', path, undefined, {
      username,
      password,
    })) as { token?: unknown; user?: unknown };
    if (typeof body.token !== 'string' || typeof body.user !== 'object' || body.user == null) {
      throw new SyncError('badResponse');
    }
    const user = body.user as { id?: unknown; username?: unknown };
    if (typeof user.id !== 'number' || typeof user.username !== 'string') {
      throw new SyncError('badResponse');
    }
    return { token: body.token, user: { id: user.id, username: user.username } };
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    token?: string,
    payload?: Record<string, unknown>,
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.root}${path}`, {
        method,
        headers: {
          ...(payload ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new SyncError('offline');
    }
    if (response.status === 401) {
      throw new SyncError(path.startsWith('/auth/') ? 'invalidCredentials' : 'rejected');
    }
    if (response.status === 409) {
      throw new SyncError('usernameTaken');
    }
    if (!response.ok) throw new SyncError('badResponse');
    try {
      return await response.json();
    } catch {
      throw new SyncError('badResponse');
    }
  }
}
