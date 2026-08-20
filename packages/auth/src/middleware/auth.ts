import {
  Middleware,
  UnauthorizedException,
  ZentifyMiddlewareContext,
} from "@zentify/core";
import { AuthManager } from "../auth_manager";

export interface AuthMiddlewareOptions {
  guard?: string;
  header?: string;
  redirectTo?: string;
}

export class AuthMiddleware implements Middleware {
  constructor(private readonly options: AuthMiddlewareOptions = {}) {}

  async handle(
    ctx: ZentifyMiddlewareContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const auth = ctx.container.resolve<AuthManager>(AuthManager);
    const token = this.extractToken(ctx.request);
    const ok = await auth.guard(this.options.guard).check(token);

    if (!ok) {
      if (this.options.redirectTo) {
        ctx.response.statusCode = 302;
        ctx.response.setHeader("Location", this.options.redirectTo);
        ctx.response.end();
        return;
      }

      throw new UnauthorizedException(
        `Unauthenticated (guard: ${this.options.guard ?? "default"})`,
      );
    }

    await next();
  }

  private extractToken(request: {
    headers: Record<string, string | string[] | undefined>;
  }): string | undefined {
    const value = request.headers[this.options.header ?? "authorization"];

    if (typeof value === "string" && value.startsWith("Bearer ")) {
      return value.slice(7);
    }

    return undefined;
  }
}