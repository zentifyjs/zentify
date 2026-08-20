import { Authenticatable } from "@zentify/core";

export interface AuthIdentifier {
  identifier: string;
  lookup: Record<string, unknown>;
}

export interface AuthGuard<T extends Authenticatable = Authenticatable> {
  readonly name: string;
  readonly cookieName: string;

  /**
   * Persists the authenticated identity. May store a session or sign a token
   * and set it in an HttpOnly cookie. Returns the raw token (session id, JWT,
   * ...) when the transport is a plain string, or `undefined`.
   */
  login(user: T, lookup: Record<string, unknown>): Promise<string | void>;

  /**
   * Resolves the current authenticated identity. Reads the given token when
   * provided, otherwise falls back to the guard cookie.
   */
  getIdentifier(token?: string): Promise<AuthIdentifier | null>;

  logout(): Promise<void>;

  /** Returns the raw token of the active session, if any. */
  token?(): string | undefined;
}