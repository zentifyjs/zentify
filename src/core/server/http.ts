import { createServer } from "node:http";

import { HandlerFunction, HttpMethod, Routes, Route } from "../router/route";

import { z } from "zod";

import { enhanceRequest, enhanceResponse } from "./message";

import { HttpException } from "../exception/http";
import { Middleware } from "../middleware";
import { AppContext } from "../types/app_context";
import { getNetworkAddresses, Logger } from "../utils";
import { ZRequest, ZResponse } from "../types/message";
import { getParameterMetadata } from "../decorators/metadata";
import { DTOClass } from "../types/dto";

export class HttpServer {
  private routes: Routes[] = [];
  private logger = new Logger({
    context: "HttpServer",
  });
  private appContext: AppContext = {};
  constructor(appContext: AppContext = {}) {
    this.appContext = appContext;
  }
  public registerRoutes(routes: Routes[]): void {
    this.routes = routes;
  }

  private async handleRequest(req: ZRequest, res: ZResponse): Promise<void> {
    const matched = Route.getRoute(
      req.method as HttpMethod,
      new URL(req.url ?? "/", `http://${req.headers.host}`),
    );

    if (!matched) {
      this.sendJsonResponse(res, 404, { message: "Route not found" });
      return;
    }

    const { route, params, query } = matched!;

    req.params = params;
    req.query = query;

    const middlewares = Route.resolveMiddlewares(route);

    await this.callHandler(route.handler, req, res, middlewares);
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
    handler: HandlerFunction,
    req: ZRequest,
    res: ZResponse,
    middlewares: Middleware[],
  ): Promise<void> {
    try {
      await this.executeMiddleware(middlewares, req, res, async () => {
        const args: any[] = await this.getArgs(handler, req, res);

        const result = Array.isArray(handler)
          ? await this.callController(handler, args)
          : await handler(...args);

        if (result !== undefined && !res.writableEnded) {
          this.sendJsonResponse(res, 200, result);
        }
      });
    } catch (error: unknown) {
      this.handleException(error, res);
    }
  }

  private async getArgs(
    handler: HandlerFunction,
    req: ZRequest,
    res: ZResponse,
  ): Promise<any[]> {
    let metadata;
    let [ControllerClass, methodName]: any[] = [null, null];
    if (Array.isArray(handler)) {
      [ControllerClass, methodName] = handler;
      const controller = new ControllerClass();
      metadata = getParameterMetadata(
        Object.getPrototypeOf(controller),
        methodName,
      );
    } else {
      metadata = getParameterMetadata(handler, "handler");
    }

    const args: any[] = [];

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
          const result = dto.schema.safeParse(req.body);
          if (result.success === false) {
            throw new HttpException({
              message: "Invalid request body",
              statusCode: 422,
              details: z.treeifyError(result.error),
            });
          }
          args[param.index] = result.data;
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

  private async callController(handler: HandlerFunction, args: any[]) {
    if (!Array.isArray(handler)) {
      throw new Error("Handler is not a controller method");
    }

    const [ControllerClass, methodName] = handler;

    const controllerInstance = new ControllerClass();
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
  }
}
