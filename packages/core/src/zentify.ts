import "reflect-metadata";
import { Middleware } from "./types/middleware";
import { Route } from "./router/route";
import { HttpServer } from "./server/http";
import { AppContext } from "./types/app_context";
import { Logger } from "./utils";
import { ZentifyViewEngine } from "./view";
import { ZentifyAdapter } from "./types/adapter";
import { Container } from "./depedencies/container";

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

  async run() {
    for (const adapter of this.adapters) {
      if (adapter.onInit) {
        await adapter.onInit(this);
      }
    }

    Route.setContainer(this.container);
    Route.resolveModules(this.adapters);

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
