import {
  REQUEST_CONTEXT,
  Zentify,
  ZentifyHttpContextService,
} from "@zentify/core";
import { AuthCookie } from "./types/cookie";

export interface AuthCookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  path?: string;
  maxAge?: number;
}

function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};

  const cookies: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;

    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (name) {
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    }
  }
  return cookies;
}

function serialize(
  name: string,
  value: string,
  options: AuthCookieOptions = {},
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.maxAge !== undefined)
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);

  return parts.join("; ");
}

export class AuthCookieImpl implements AuthCookie {
  private app: Zentify;
  private httpContext: ZentifyHttpContextService;

  constructor(app: Zentify) {
    this.app = app;
    this.httpContext = this.app.container.resolve(REQUEST_CONTEXT);
  }

  get(name: string): string | undefined {
    const { req } = this.httpContext.current();
    return parseCookies(String(req.headers.cookie ?? ""))[name];
  }

  set(name: string, value: string, options?: AuthCookieOptions): void {
    const { res } = this.httpContext.current();
    res.appendHeader("Set-Cookie", serialize(name, value, options));
  }

  delete(name: string): void {
    const { res } = this.httpContext.current();
    res.appendHeader(
      "Set-Cookie",
      `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/`,
    );
  }
}
