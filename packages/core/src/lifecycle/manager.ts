import { Zentify } from "../zentify";
import { ZentifyAdapter } from "../types/adapter";
import { Logger } from "../utils";

export class LifecycleManager {
  private isShuttingDown = false;
  private logger = new Logger({ context: "LifecycleManager" });
  private app: Zentify;
  private adapters: ZentifyAdapter[];
  private shutdownHooks: Array<() => Promise<void>> = [];

  constructor(app: Zentify, adapters: ZentifyAdapter[]) {
    this.app = app;
    this.adapters = adapters;
    process.on("SIGINT", () => this.shutdown("SIGINT"));
    process.on("SIGTERM", () => this.shutdown("SIGTERM"));
  }

  registerShutdownHook(hook: () => Promise<void>) {
    this.shutdownHooks.push(hook);
  }

  async boot() {
    for (const adapter of this.adapters) {
      if (adapter.onInit) {
        await adapter.onInit(this.app);
      }
    }
  }

  async shutdown(signal?: string) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    
    if (signal) {
      this.logger.warn(`Received ${signal}. Shutting down gracefully...`);
    } else {
      this.logger.info(`Shutting down gracefully...`);
    }

    // Eksekusi semua custom shutdown hooks (misal: stop HTTP server)
    for (const hook of this.shutdownHooks) {
      try {
        await hook();
      } catch (e: any) {
        this.logger.error(`Error in shutdown hook: ${e.message}`);
      }
    }

    for (const adapter of this.adapters) {
      if (adapter.onClose) {
        try {
          await adapter.onClose(this.app);
        } catch (e: any) {
          this.logger.error(`Error closing adapter ${adapter.name}: ${e.message}`);
        }
      }
    }
    
    this.logger.info("Application closed.");
    process.exit(0);
  }
}
