/**
 * Web sync engine: session (localStorage token) + last-write-wins sync.
 */

import { SyncClient, SyncError } from './sync';
import type { SyncUser } from './sync';
import type { SyncDataBundle } from './sync-data';

const TOKEN_KEY = 'dianduji.syncToken';

export interface SyncSession {
  token: string;
  user: SyncUser;
}

export class WebSyncEngine {
  private client: SyncClient;
  private token: string | null = null;
  user: SyncUser | null = null;

  constructor(
    private readonly collectLocal: () => Promise<SyncDataBundle>,
    private readonly applyRemote: (data: Record<string, unknown>, updatedAt: number) => Promise<void>,
    private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = localStorage,
    client: SyncClient = new SyncClient(),
  ) {
    this.client = client;
    const stored = storage.getItem(TOKEN_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored) as SyncSession;
        if (typeof session.token === 'string' && session.token.length > 0) {
          this.token = session.token;
          this.user = session.user;
        }
      } catch {
        storage.removeItem(TOKEN_KEY);
      }
    }
  }

  get isLoggedIn(): boolean {
    return this.token != null && this.user != null;
  }

  /** Bearer token for authenticated gateway calls (paid endpoints). */
  get bearerToken(): string | null {
    return this.token;
  }

  async register(username: string, password: string): Promise<void> {
    const result = await this.client.register(username, password);
    await this.establish(result.token, result.user);
  }

  async login(username: string, password: string): Promise<void> {
    const result = await this.client.login(username, password);
    await this.establish(result.token, result.user);
  }

  async logout(): Promise<void> {
    this.token = null;
    this.user = null;
    this.storage.removeItem(TOKEN_KEY);
  }

  async syncNow(): Promise<{ appliedRemote: boolean; pushedLocal: boolean }> {
    if (!this.token) throw new SyncError('rejected');
    const token = this.token;
    try {
      const remote = await this.client.fetch(token);
      const local = await this.collectLocal();

      if (remote == null || local.updatedAt > remote.updatedAt) {
        const result = await this.client.push(token, local.data, local.updatedAt);
        if (!result.accepted) {
          await this.applyRemote(result.data, result.updatedAt);
          return { appliedRemote: true, pushedLocal: false };
        }
        return { appliedRemote: false, pushedLocal: true };
      }

      await this.applyRemote(remote.data, remote.updatedAt);
      return { appliedRemote: true, pushedLocal: false };
    } catch (error) {
      if (error instanceof SyncError && error.failure === 'rejected') {
        await this.logout();
      }
      throw error;
    }
  }

  private async establish(token: string, user: SyncUser): Promise<void> {
    this.token = token;
    this.user = user;
    this.storage.setItem(
      TOKEN_KEY,
      JSON.stringify({ token, user } satisfies SyncSession),
    );
  }
}
