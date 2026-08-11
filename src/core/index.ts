import { Middleware } from "./middleware";
import { Route } from "./router/route";
import { HttpServer } from "./server/http";
import { AppContext } from "./types/app_context";
import { Logger } from "./utils";

export class Zify {
  public context: AppContext = {};
  private logger = new Logger({
    context: "App",
  });
  constructor(config: AppContext = {}) {
    this.context = config;
  }

  addMiddleware(middleware: Middleware) {
    Route.use(middleware);
  }

  run() {
    const routes = Route.getRoutes();
    console.log("Registered routes:", routes);
    const httpServer = new HttpServer();
    httpServer.registerRoutes(routes);
    this.logger.info("Starting server...");
    httpServer.start();
  }
}
