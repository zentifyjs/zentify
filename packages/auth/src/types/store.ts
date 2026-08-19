export interface SessionStore {
  create(): Promise<string>;

  get<T>(sessionId: string, key: string): Promise<T | null>;

  set(sessionId: string, key: string, value: unknown): Promise<void>;

  destroy(sessionId: string): Promise<void>;
}
