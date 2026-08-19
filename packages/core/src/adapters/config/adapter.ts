import { ConfigService } from "./config.service";
import type { ConfigLoader } from "./types";
import type { ZentifyAdapter, ZentifyAdapterKind } from "../../types/adapter";
import type { Zentify } from "../../zentify";
import { Logger } from "../../utils/logger";

export interface ConfigAdapterOptions {
  loaders?: ConfigLoader[];
}

export class ConfigAdapter implements ZentifyAdapter {
  name = "ConfigAdapter";
  kind: ZentifyAdapterKind = "common";
  private logger = new Logger({ context: "ConfigAdapter" });
  private options: ConfigAdapterOptions;

  constructor(options: ConfigAdapterOptions = {}) {
    this.options = options;
  }

  /** Called in LifecycleManager.boot(), before onInit. Loads + validates config eagerly. */
  onBeforeInit(app: Zentify): void {
    for (const loader of this.options.loaders ?? []) {
      ConfigService.addLoader(loader);
    }

    ConfigService.load();

    app.container.provide({ token: ConfigService, useValue: ConfigService });
  }
}
