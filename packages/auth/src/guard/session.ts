import { Authenticatable } from "@zentify/core";
import { AuthGuard } from "../types/guard";
import { SessionStore } from "../types/store";
import { AuthCookie } from "../types/cookie";
import { AuthCookieOptions } from "../auth_cookie";

export interface SessionGuardOptions {
  cookieName?: string;
  cookie?: AuthCookieOptions;
}

export class SessionGuard<T extends Authenticatable> implements AuthGuard<T> {
  readonly name: string;
  readonly cookieName: string;

  private sessionId: string | undefined;
  private readonly cookieOptions: AuthCookieOptions;

  constructor(
    name: string,
    private readonly sessions: SessionStore,
    private readonly cookies: AuthCookie,
    options: SessionGuardOptions = {},
  ) {
    this.name = name;
    this.cookieName = options.cookieName ?? `zentify_${name}`;
    this.cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      ...options.cookie,
      maxAge: options.cookie?.maxAge,
    };
  }

  async login(user: T, lookup: Record<string, unknown>): Promise<string> {
    const sessionId = await this.sessions.create();

    await this.sessions.set(
      sessionId,
      "auth.identifier",
      user.getAuthIdentifier(),
    );
    await this.sessions.set(sessionId, "auth.lookup", lookup);

    this.cookies.set(this.cookieName, sessionId, this.cookieOptions);
    this.sessionId = sessionId;

    return sessionId;
  }

  async getIdentifier(
    token?: string,
  ): Promise<{ identifier: string; lookup: Record<string, unknown> } | null> {
    const sessionId = token ?? this.sessionId ?? this.cookies.get(this.cookieName);
    if (!sessionId) {
      return null;
    }

    const identifier = await this.sessions.get<string>(
      sessionId,
      "auth.identifier",
    );
    const lookup = await this.sessions.get<Record<string, unknown>>(
      sessionId,
      "auth.lookup",
    );
    if (!identifier || !lookup) {
      return null;
    }

    return {
      identifier: identifier,
      lookup: lookup,
    };
  }

  token(): string | undefined {
    return this.sessionId ?? this.cookies.get(this.cookieName);
  }

  async logout(): Promise<void> {
    const sessionId = this.token();

    if (sessionId) {
      await this.sessions.destroy(sessionId);
    }

    this.sessionId = undefined;
    this.cookies.delete(this.cookieName);
  }
}