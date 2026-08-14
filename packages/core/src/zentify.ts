import "reflect-metadata";
import { Middleware } from "./types/middleware";
import { Route } from "./router/route";
import { HttpServer } from "./server/http";
import { AppContext } from "./types/app_context";
import { Logger } from "./utils";
import { ZentifyViewEngine } from "./view";
import { ZentifyAdapter } from "./types/adapter";
import { Container } from "./depedencies/container";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { LifecycleManager } from "./lifecycle/manager";
import serveStatic from "serve-static";

export class Zentify {
  public context: AppContext = {};
  public container = new Container();
  public lifecycle: LifecycleManager;
  private adapters: ZentifyAdapter[] = [];
  private staticHandler?: ReturnType<typeof serveStatic>;
  private logger = new Logger({
    context: "App",
  });
  
  constructor(config: AppContext = {}) {
    this.context = config;
    this.lifecycle = new LifecycleManager(this, this.adapters);
  }

  addAdapter(adapter: ZentifyAdapter) {
    this.adapters.push(adapter);
  }

  useStatic(path: string, options?: serveStatic.ServeStaticOptions) {
    this.staticHandler = serveStatic(path, options);
  }

  addMiddleware(middleware: Middleware) {
    Route.use(middleware);
  }

  private async runSeeder(seederClass: string) {
    try {
      const possiblePaths = [
        path.join(process.cwd(), ".zentify", "app", "Database", "seeders", `${seederClass}.js`),
        path.join(process.cwd(), "dist", "app", "Database", "seeders", `${seederClass}.js`),
        path.join(process.cwd(), "app", "Database", "seeders", `${seederClass}.ts`)
      ];

      let loadedModule;
      let actualPath = "";
      
      for (const p of possiblePaths) {
        try {
          const dynamicImport = new Function('modulePath', 'return import(modulePath)');
          loadedModule = await dynamicImport(pathToFileURL(p).href);
          actualPath = p;
          break;
        } catch (e: any) {
          if (e.code !== 'ERR_MODULE_NOT_FOUND' && !e.message.includes("Cannot find module")) {
             this.logger.error(`Error loading seeder from ${p}: ${e.message}`);
          }
        }
      }
      
      if (!loadedModule) {
          throw new Error(`Seeder class ${seederClass} not found in any expected location.`);
      }

      const SeederClassRef = loadedModule[seederClass];
      
      if (!SeederClassRef) {
          throw new Error(`Seeder class ${seederClass} not found in ${actualPath}`);
      }
      
      const seederInstance = new SeederClassRef();
      this.logger.info(`Running seeder: ${seederClass}...`);
      await seederInstance.run(this);
      this.logger.info(`Seeder ${seederClass} completed successfully!`);
      await this.lifecycle.shutdown();
    } catch (err: any) {
      this.logger.error(`Failed to run seeder: ${err.message}`);
      process.exit(1);
    }
  }

  async run() {
    await this.lifecycle.boot();
    Route.setContainer(this.container);
    Route.resolveModules(this.adapters);

    if (process.env.ZENTIFY_MIGRATING) {
      const type = process.env.ZENTIFY_MIGRATING;
      try {
        for (const adapter of this.adapters) {
          if (adapter.onMigrate) {
            await adapter.onMigrate(type);
          }
        }
        await this.lifecycle.shutdown();
      } catch (err: any) {
        this.logger.error(`Migration failed: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    if (process.env.ZENTIFY_SEEDING === "true") {
      const seederClass = process.env.ZENTIFY_SEED_CLASS || "DatabaseSeeder";
      await this.runSeeder(seederClass);
      return;
    }

    const routes = Route.getRoutes();
    for (const route of routes) {
      this.logger.info(
        `Registered route: [${route.method}] ${route.path} -> ${typeof route.handler === "function" ? "FunctionHandler" : `${route.handler[0].name}.${route.handler[1]}`}`,
      );
    }
    const server = new HttpServer(this.context, this.adapters);
    this.lifecycle.registerShutdownHook(async () => {
      if (server) {
        await server.stop();
      }
    });
    
    if (this.staticHandler) {
      server.setStaticHandler(this.staticHandler);
    }
    server.registerRoutes(routes);
    this.logger.info("Starting server...");
    server.start();
  }
}
