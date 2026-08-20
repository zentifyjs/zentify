import type { ZRequest, ZResponse } from "./message";
import type { Container } from "../dependencies/container";

export interface ZentifyMiddlewareContext {
  container: Container;
  request: ZRequest;
  response: ZResponse;
}

export interface Middleware {
  handle(
    ctx: ZentifyMiddlewareContext,
    next: () => Promise<void>,
  ): Promise<void>;
}

export type MiddlewareFunction = (
  ctx: ZentifyMiddlewareContext,
  next: () => Promise<void>,
) => Promise<void>;

export type MiddlewareHandler = Middleware | MiddlewareFunction;