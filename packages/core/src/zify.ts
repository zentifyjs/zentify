import "reflect-metadata";
import { Middleware } from "./types/middleware";
import { Route } from "./router/route";
import { HttpServer } from "./server/http";
import { AppContext } from "./types/app_context";
import { Logger } from "./utils";
import { ZifyViewEngine } from "./view";

export class Zify {
  public context: AppContext = {};
  public viewEngine?: ZifyViewEngine;
  private logger = new Logger({
    context: "App",
  });
  constructor(config: AppContext = {}) {
    this.context = config;
  }

  setViewEngine(engine: ZifyViewEngine) {
    this.viewEngine = engine;
  }

  addMiddleware(middleware: Middleware) {
    Route.use(middleware);
  }

  run() {
    const routes = Route.getRoutes();
    for (const route of routes) {
      this.logger.info(
        `Registered route: [${route.method}] ${route.path} -> ${typeof route.handler === "function" ? "FunctionHandler" : `${route.handler[0].name}.${route.handler[1]}`}`,
      );
    }
    const httpServer = new HttpServer(this.context, this.viewEngine);
    httpServer.registerRoutes(routes);
    this.logger.info("Starting server...");
    httpServer.start();
  }
}
