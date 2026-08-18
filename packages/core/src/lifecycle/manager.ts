import { Zentify } from "../zentify";
import { ZentifyAdapter, ZentifyAdapterFactory } from "../types/adapter";
import { Logger } from "../utils";

export class LifecycleManager {
  private isShuttingDown = false;
  private logger = new Logger({ context: "LifecycleManager" });
  private app: Zentify;
  private adapters: Array<ZentifyAdapter | ZentifyAdapterFactory>;
  private shutdownHooks: Array<() => Promise<void>> = [];

  constructor(app: Zentify, adapters: Array<ZentifyAdapter | ZentifyAdapterFactory>) {
    this.app = app;
    this.adapters = adapters;
    process.on("SIGINT", () => this.shutdown("SIGINT"));
    process.on("SIGTERM", () => this.shutdown("SIGTERM"));
  }

  registerShutdownHook(hook: () => Promise<void>) {
    this.shutdownHooks.push(hook);
  }

  private materialize(entry: ZentifyAdapter | ZentifyAdapterFactory): ZentifyAdapter {
    if ("useFactory" in entry) {
      const { dependency = [], useFactory } = entry;
      const deps = dependency.map((token) => this.app.container.resolve(token));
      return useFactory(...deps);
    }
    return entry;
  }

  async boot() {
    for (let i = 0; i < this.adapters.length; i++) {
      const adapter = this.materialize(this.adapters[i]);
      this.adapters[i] = adapter;
      if (adapter.onBeforeInit) {
        await adapter.onBeforeInit(this.app);
      }
    }

    for (const adapter of this.adapters as ZentifyAdapter[]) {
      if (adapter.onInit) {
        await adapter.onInit(this.app);
      }
    }
  }

  async close(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.logger.info(`Shutting down gracefully...`);

    // Eksekusi semua custom shutdown hooks (misal: stop HTTP server)
    for (const hook of this.shutdownHooks) {
      try {
        await hook();
      } catch (e: any) {
        this.logger.error(`Error in shutdown hook: ${e.message}`);
      }
    }

    for (const adapter of this.adapters as ZentifyAdapter[]) {
      if (adapter.onClose) {
        try {
          await adapter.onClose(this.app);
        } catch (e: any) {
          this.logger.error(`Error closing adapter ${adapter.name}: ${e.message}`);
        }
      }
    }

    this.logger.info("Application closed.");
  }

  async shutdown(signal?: string) {
    if (signal) {
      this.logger.warn(`Received ${signal}. Shutting down gracefully...`);
    }
    await this.close();
    process.exit(0);
  }
}
