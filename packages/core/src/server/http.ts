import { createServer } from "node:http";
import { enhanceRequest, enhanceResponse } from "./message";
import { AppContext } from "../types/app_context";
import { getNetworkAddresses, Logger } from "../utils";
import { Routes } from "../types";
import { ZentifyAdapter } from "../types/adapter";
import { ResponseHandler } from "./response";
import { RequestDispatcher } from "./dispatcher";

export class HttpServer {
  private logger = new Logger({ context: "HttpServer" });
  private appContext: AppContext = {};
  private adapters: ZentifyAdapter[] = [];
  private staticHandler?: any;
  
  private responseHandler: ResponseHandler;
  private dispatcher: RequestDispatcher;

  constructor(appContext: AppContext = {}, adapters: ZentifyAdapter[] = []) {
    this.appContext = appContext;
    this.adapters = adapters;
    
    this.responseHandler = new ResponseHandler(this.adapters);
    this.dispatcher = new RequestDispatcher(this.responseHandler);
  }

  public registerRoutes(routes: Routes[]): void {
    // Routes are static in Route.routes, but we can keep this for interface compatibility
  }

  public setStaticHandler(handler: any): void {
    this.staticHandler = handler;
  }

  public start(): void {
    const appContext = this.appContext;
    const port = appContext.server?.port || 3000;
    const host = appContext.server?.host || "localhost";

    const server = createServer(async (nodeReq, nodeRes) => {
      const req = await enhanceRequest(nodeReq, this.appContext);
      const res = enhanceResponse(nodeRes);

      for (const adapter of this.adapters) {
        const globalMiddleware = adapter.getGlobalMiddleware?.();
        if (globalMiddleware) {
          const proceed = await new Promise<boolean>((resolve, reject) => {
            nodeRes.once('finish', () => resolve(false));
            nodeRes.once('close', () => resolve(false));
            
            globalMiddleware(nodeReq, nodeRes, (err: any) => {
              if (err) return reject(err);
              resolve(true);
            });
          });

          if (!proceed) {
            return; // Request handled by adapter middleware, stop execution
          }
        }
      }

      await this.dispatcher.dispatch(req, res, this.staticHandler);
    });

    server.listen(port, host, () => {
      const isProd = process.env.NODE_ENV === "production";
      const mode = isProd ? "Production" : "Development";
      const urls = getNetworkAddresses(port);
      this.logger.info(`Server running in ${mode} mode.`);
      urls.forEach((url) => {
        this.logger.info(`> ${url}`);
      });
    });

    process.on("SIGINT", () => {
      this.logger.warn("Received SIGINT. Shutting down gracefully...");
      server.close(() => {
        this.logger.info("Closed out remaining connections.");
        process.exit(0);
      });

      setTimeout(() => {
        this.logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    });

    process.on("SIGTERM", () => {
      this.logger.warn("Received SIGTERM. Shutting down gracefully...");
      server.close(() => {
        this.logger.info("Closed out remaining connections.");
        process.exit(0);
      });

      setTimeout(() => {
        this.logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    });
  }
}
