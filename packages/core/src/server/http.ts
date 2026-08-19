import { createServer } from "node:http";
import { enhanceRequest, enhanceResponse } from "./message";
import { AppContext } from "../types/app_context";
import { ConfigService } from "../adapters/config/config.service";
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

  private boundPort?: number;

  public async start(): Promise<number> {
    const appContext = this.appContext;
    const port = appContext.server?.port ?? Number(ConfigService.get("PORT", "3000"));
    const host = appContext.server?.host || "localhost";

    return new Promise<number>((resolve) => {
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
        const address = this.serverInstance?.address();
        const boundPort =
          address && typeof address === "object" ? address.port : port;
        this.boundPort = boundPort;

        const isProd = process.env.NODE_ENV === "production";
        const mode = isProd ? "Production" : "Development";
        const urls = getNetworkAddresses(boundPort);
        this.logger.info(`Server running in ${mode} mode.`);
        urls.forEach((url) => {
          this.logger.info(`> ${url}`);
        });

        resolve(boundPort);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      const server = this.serverInstance;
      if (!server) {
        resolve();
        return;
      }

      // Graceful shutdown: stop accepting new connections first.
      server.close(() => resolve());

      // Node keeps idle keep-alive sockets open indefinitely, which would
      // block the `close` callback above. Drop idle sockets right away so
      // the server can drain; in-flight requests still finish normally.
      server.closeIdleConnections?.();

      // Safety net: force-destroy any remaining connections (e.g. long-lived
      // sockets) after a short grace period so `stop()` never hangs.
      const timer = setTimeout(() => {
        server.closeAllConnections?.();
        resolve();
      }, 5000);
      timer.unref();
    });
  }
}
