import { Middleware } from "../types/middleware";
import { ZRequest, ZResponse } from "../types/message";

export class HaloMiddleware implements Middleware {
  async handle(
    req: ZRequest,
    res: ZResponse,
    next: () => Promise<void>,
  ): Promise<void> {
    console.log("HaloMiddleware: Before next()");
    await next();
    console.log("HaloMiddleware: After next()");
  }
}

export class AuthMiddleware implements Middleware {
  async handle(
    req: ZRequest,
    res: ZResponse,
    next: () => Promise<void>,
  ): Promise<void> {
    console.log("AuthMiddleware: Before next()");
    await next();
    console.log("AuthMiddleware: After next()");
  }
}
