import { Authenticatable } from "@zentify/core";
import { AuthGuard } from "../types/guard";
import { SessionStore } from "../types/store";
import { AuthCookie } from "../types/cookie";

export class SessionGuard<T extends Authenticatable> implements AuthGuard<T> {
  constructor(
    private readonly sessions: SessionStore,
    private readonly cookies: AuthCookie,
  ) {}

  async login(user: T): Promise<void> {
    const sessionId = await this.sessions.create();

    await this.sessions.set(
      sessionId,
      "auth.identifier",
      user.getAuthIdentifier(),
    );

    this.cookies.set("session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  }

  async getIdentifier(): Promise<string | null> {
    const sessionId = this.cookies.get("session");

    if (!sessionId) {
      return null;
    }

    return this.sessions.get<string>(sessionId, "auth.identifier");
  }

  async logout(): Promise<void> {
    const sessionId = this.cookies.get("session");

    if (sessionId) {
      await this.sessions.destroy(sessionId);
    }

    this.cookies.delete("session");
  }
}
