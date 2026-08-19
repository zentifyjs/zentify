import { AsyncLocalStorage } from "node:async_hooks";
import { ZHttpContext } from "../../types";

export class ZentifyHttpContextService {
  constructor(private asyncLocalStorage: AsyncLocalStorage<ZHttpContext>) {}
  run<R>(ctx: ZHttpContext, fn: () => R): R {
    return this.asyncLocalStorage.run(ctx, fn);
  }

  has(): boolean {
    return this.asyncLocalStorage.getStore() !== undefined;
  }

  current(): ZHttpContext {
    const store = this.asyncLocalStorage.getStore();
    if (!store) {
      throw new Error(
        "No active HTTP request context. HttpContext is only available inside a request lifecycle.",
      );
    }
    return store;
  }
}
