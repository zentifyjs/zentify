import { AuthCookie } from "./types/cookie";

export class AuthCookieImpl implements AuthCookie {
  private cookies: Record<string, string> = {};
  get(name: string): string | undefined {
    return this.cookies[name];
  }
  set(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "strict" | "lax" | "none";
      path?: string;
      maxAge?: number;
    },
  ) {
    this.cookies[name] = value;
  }

  delete(name: string) {
    delete this.cookies[name];
  }
}
