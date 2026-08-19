import { SessionStore } from "../types/store";

export class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, Map<string, unknown>>();

  async create(): Promise<string> {
    const id = crypto.randomUUID();

    this.sessions.set(id, new Map());

    return id;
  }

  async get<T>(sessionId: string, key: string): Promise<T | null> {
    return (this.sessions.get(sessionId)?.get(key) as T) ?? null;
  }

  async set(sessionId: string, key: string, value: unknown) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return;
    }

    session.set(key, value);
  }

  async destroy(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}
