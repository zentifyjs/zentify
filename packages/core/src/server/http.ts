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
  private onShutdown?: () => Promise<void>;

  constructor(appContext: AppContext = {}, adapters: ZentifyAdapter[] = [], onShutdown?: () => Promise<void>) {
    this.appContext = appContext;
    this.adapters = adapters;
    this.onShutdown = onShutdown;
    
    this.responseHandler = new ResponseHandler(this.adapters);
    this.dispatcher = new RequestDispatcher(this.responseHandler);
  }

  public registerRoutes(routes: Routes[]): void {
    // Routes are static in Route.routes, but we can keep this for interface compatibility
  }

  public setStaticHandler(handler: any): void {
    this.staticHandler = handler;
  }

  private serverInstance?: ReturnType<typeof createServer>;

  public start(): void {
    const appContext = this.appContext;
    const port = appContext.server?.port || 3000;
    const host = appContext.server?.host || "localhost";

    this.serverInstance = createServer(async (nodeReq, nodeRes) => {
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

    this.serverInstance.listen(port, host, () => {
      const isProd = process.env.NODE_ENV === "production";
      const mode = isProd ? "Production" : "Development";
      const urls = getNetworkAddresses(port);
      this.logger.info(`Server running in ${mode} mode.`);
      urls.forEach((url) => {
        this.logger.info(`> ${url}`);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.serverInstance) {
        this.serverInstance.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
