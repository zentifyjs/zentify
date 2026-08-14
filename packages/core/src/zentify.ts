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

import serveStatic from "serve-static";

export class Zentify {
  public context: AppContext = {};
  public container = new Container();
  private adapters: ZentifyAdapter[] = [];
  private staticHandler?: ReturnType<typeof serveStatic>;
  private logger = new Logger({
    context: "App",
  });
  constructor(config: AppContext = {}) {
    this.context = config;
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

  async boot() {
    for (const adapter of this.adapters) {
      if (adapter.onInit) {
        await adapter.onInit(this);
      }
    }

    Route.setContainer(this.container);
    Route.resolveModules(this.adapters);
  }

  private async runSeeder(seederClass: string) {
    try {
      // 1. Try to load from .zentify/seeders/ (if running via db:seed bundle)
      // 2. Try to load from dist/app/Database/seeders/ (if running in production)
      // 3. Fallback to app/Database/seeders/ (if running via raw TS)
      const possiblePaths = [
        path.join(process.cwd(), ".zentify", "app", "Database", "seeders", `${seederClass}.js`),
        path.join(process.cwd(), "dist", "app", "Database", "seeders", `${seederClass}.js`),
        path.join(process.cwd(), "app", "Database", "seeders", `${seederClass}.ts`)
      ];

      let loadedModule;
      let actualPath = "";
      
      for (const p of possiblePaths) {
        try {
          // Bypass tsc converting import() to require() in commonjs
          const dynamicImport = new Function('modulePath', 'return import(modulePath)');
          loadedModule = await dynamicImport(pathToFileURL(p).href);
          actualPath = p;
          break;
        } catch (e: any) {
          this.logger.error(`Failed loading from ${p}: ${e.message}`);
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
      process.exit(0);
    } catch (err: any) {
      this.logger.error(`Failed to run seeder: ${err.message}`);
      process.exit(1);
    }
  }

  async run() {
    await this.boot();

    if (process.env.ZENTIFY_MIGRATING) {
      const type = process.env.ZENTIFY_MIGRATING;
      try {
        for (const adapter of this.adapters) {
          if (adapter.onMigrate) {
            await adapter.onMigrate(type);
          }
        }
        process.exit(0);
      } catch (err: any) {
        this.logger.error(`Migration failed: ${err.message}`);
        process.exit(1);
      }
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
    const httpServer = new HttpServer(this.context, this.adapters);
    if (this.staticHandler) {
      httpServer.setStaticHandler(this.staticHandler);
    }
    httpServer.registerRoutes(routes);
    this.logger.info("Starting server...");
    httpServer.start();
  }
}
