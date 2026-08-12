import { createServer } from "node:http";

import { Route } from "../router/route";
import { safeParse } from "valibot";

import { enhanceRequest, enhanceResponse } from "./message";

import { HttpException } from "../exception/http";
import { Middleware } from "../types/middleware";
import { AppContext } from "../types/app_context";
import { getNetworkAddresses, Logger } from "../utils";
import { ZRequest, ZResponse } from "../types/message";
import { getParameterMetadata } from "../decorators/metadata";
import { DTOClass } from "../types/dto";
import { ZifyViewEngine, ZifyView } from "../view";
import { HttpMethod, Routes } from "../types";

export class HttpServer {
  private routes: Routes[] = [];
  private logger = new Logger({
    context: "HttpServer",
  });
  private appContext: AppContext = {};
  private viewEngine?: ZifyViewEngine;
  private staticHandler?: any;
  
  constructor(appContext: AppContext = {}, viewEngine?: ZifyViewEngine) {
    this.appContext = appContext;
    this.viewEngine = viewEngine;
  }
  public registerRoutes(routes: Routes[]): void {
    this.routes = routes;
  }

  public setStaticHandler(handler: any): void {
    this.staticHandler = handler;
  }

  private async handleRequest(req: ZRequest, res: ZResponse): Promise<void> {
    const rawUrl = req.url ?? "/";
    const qIndex = rawUrl.indexOf("?");
    const pathname = qIndex !== -1 ? rawUrl.substring(0, qIndex) : rawUrl;
    const search = qIndex !== -1 ? rawUrl.substring(qIndex + 1) : "";

    const matched = Route.getRoute(
      req.method as HttpMethod,
      pathname,
      search
    );

    if (!matched) {
      if (this.staticHandler) {
        this.staticHandler(req, res, () => {
          this.sendJsonResponse(res, 404, { message: "Route not found" });
        });
        return;
      }
      this.sendJsonResponse(res, 404, { message: "Route not found" });
      return;
    }

    const { route, params, query } = matched!;

    req.params = params;
    req.query = query;

    const middlewares = Route.resolveMiddlewares(route);

    await this.callHandler(route, req, res, middlewares);
  }

  private async executeMiddleware(
    middlewares: Middleware[],
    req: ZRequest,
    res: ZResponse,
    handler: () => Promise<void>,
  ): Promise<void> {
    let index = -1;

    const dispatch = async (currentIndex: number): Promise<void> => {
      if (currentIndex <= index) {
        throw new Error("next() called multiple times");
      }

      index = currentIndex;

      if (currentIndex === middlewares.length) {
        await handler();
        return;
      }

      const middleware = middlewares[currentIndex];

      await middleware.handle(req, res, () => dispatch(currentIndex + 1));
    };

    await dispatch(0);
  }

  private async callHandler(
    route: Routes,
    req: ZRequest,
    res: ZResponse,
    middlewares: Middleware[],
  ): Promise<void> {
    try {
      await this.executeMiddleware(middlewares, req, res, async () => {
        const args: any[] = await this.getArgs(route, req, res);
        const result = Array.isArray(route.handler)
          ? await this.callController(route, args)
          : await route.handler(...args);
        if (result !== undefined && !res.writableEnded) {
          if (typeof result === "object" && result !== null && "__isZifyView" in result && result.__isZifyView) {
            if (!this.viewEngine) {
              throw new Error("View Engine is not configured but a view was returned.");
            }
            const view = result as ZifyView;
            await this.viewEngine.render(view.page, view.props, req, res);
          } else {
            this.sendJsonResponse(res, 200, result);
          }
        }
      });
    } catch (error: unknown) {
      this.handleException(error, res);
    }
  }

  private async getArgs(
    route: Routes,
    req: ZRequest,
    res: ZResponse,
  ): Promise<any[]> {
    const metadata = route.metadata || [];

    const args: any[] = [];
    if (metadata.length === 0) {
      args.push(req, res);
      return args;
    }
    for (const param of metadata) {
      switch (param.type) {
        case "req":
          args[param.index] = req;
          break;

        case "res":
          args[param.index] = res;
          break;

        case "body":
          const dto: DTOClass = param.additionalData?.dtoClass;
          const result = safeParse(dto.schema, req.body);
          if (result.success === false) {
            throw new HttpException({
              message: "Invalid request body",
              statusCode: 422,
              details: result.issues,
            });
          }
          args[param.index] = result.output;
          break;

        case "param":
          args[param.index] = req.params[param.key!];
          break;

        case "query":
          args[param.index] = req.query;
          break;

        case "file":
          args[param.index] = await req.file(param.key!);
          break;
      }
    }
    return args;
  }

  private async callController(route: Routes, args: any[]) {
    if (!Array.isArray(route.handler)) {
      throw new Error("Handler is not a controller method");
    }

    const [_, methodName] = route.handler;
    const controllerInstance = route.controllerInstance;
    return controllerInstance[methodName](...args);
  }

  private handleException(error: unknown, res: ZResponse): void {
    if (res.writableEnded) {
      return;
    }

    if (error instanceof HttpException) {
      this.sendJsonResponse(res, error.statusCode, {
        message: error.message,
        details: error.details,
      });

      return;
    }

    this.logger.error("Server error:", error);

    this.sendJsonResponse(res, 500, {
      message: "Internal Server Error",
    });
  }

  private sendJsonResponse(
    res: ZResponse,
    statusCode: number,
    data: unknown,
  ): void {
    if (res.writableEnded) {
      return;
    }

    res.statusCode = statusCode;
    res.json(data);
  }

  public start(): void {
    const appContext = this.appContext;

    const port = appContext.server?.port ?? 3000;

    const host = appContext.server?.host ?? "localhost";

    const server = createServer(async (req, res) => {
      try {
        const request = await enhanceRequest(req, this.appContext);

        const response = enhanceResponse(res);

        await this.handleRequest(request, response);
      } catch (error: unknown) {
        const response = res as ZResponse;

        this.handleException(error, response);
      }
    });

    server.listen(port, host, () => {
      this.logger.info(`Server listening on http://${host}:${port}`);

      if (host === "0.0.0.0") {
        for (const address of getNetworkAddresses(port)) {
          this.logger.info(`Network: ${address}`);
        }
      }
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        this.logger.error(
          `Port ${port} is already in use. Please choose a different port.`,
        );
      } else {
        this.logger.error("Server error:", error);
      }
    });

    server.on("close", () => {
      this.logger.info("Server closed");
    });

    const shutdownHandler = (signal: string) => {
      this.logger.info(`Menerima signal ${signal}. Menutup server secara graceful...`);
      server.close(() => {
        this.logger.info("Server berhasil ditutup.");
        process.exit(0);
      });

      if ('closeIdleConnections' in server) {
        // @ts-ignore
        server.closeIdleConnections();
      }
    };

    process.on("SIGINT", () => shutdownHandler("SIGINT"));
    process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
  }
}
