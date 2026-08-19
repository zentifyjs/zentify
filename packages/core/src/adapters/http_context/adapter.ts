import { AsyncLocalStorage } from "node:async_hooks";
import { ZentifyAdapter, ZentifyAdapterKind, ZHttpContext } from "../../types";
import { Zentify } from "../../zentify";
import { ZentifyHttpContextService } from "./service";
import { REQUEST_CONTEXT } from "../../constants";

export class ZentifyHttpContextAdapter implements ZentifyAdapter {
  name = "ZentifyHttpContextAdapter";
  kind: ZentifyAdapterKind = "common";
  private asyncLocalStorage: AsyncLocalStorage<ZHttpContext>;
  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage<ZHttpContext>();
  }

  onBeforeInit(app: Zentify): Promise<void> | void {
    app.container.provideGlobal({
      token: REQUEST_CONTEXT,
      useValue: new ZentifyHttpContextService(this.asyncLocalStorage),
    });
  }
}
