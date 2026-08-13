import { Routes, DTOClass } from "../types";
import { Middleware } from "../types/middleware";
import { ZRequest, ZResponse } from "../types/message";
import { HttpException } from "../exception/http";
import { safeParse } from "valibot";
import { Route } from "../router/route";
import { ResponseHandler } from "./response";

export class RequestDispatcher {
  private responseHandler: ResponseHandler;

  private argHandlers: Record<string, (param: any, req: ZRequest, res: ZResponse) => Promise<any> | any> = {
    "req": (param, req, res) => req,
    "res": (param, req, res) => res,
    "param": (param, req, res) => req.params[param.key!],
    "file": async (param, req, res) => await req.file(param.key!),
    "body": (param, req, res) => this.validateDto(req.body, param.additionalData?.dtoClass, "Invalid request body"),
    "query": (param, req, res) => this.validateDto(req.query, param.additionalData?.dtoClass, "Invalid request query"),
  };

  constructor(responseHandler: ResponseHandler) {
    this.responseHandler = responseHandler;
  }

  public async dispatch(req: ZRequest, res: ZResponse, staticHandler?: any): Promise<void> {
    const rawUrl = req.url ?? "/";
    const qIndex = rawUrl.indexOf("?");
    const pathname = qIndex !== -1 ? rawUrl.substring(0, qIndex) : rawUrl;
    const search = qIndex !== -1 ? rawUrl.substring(qIndex + 1) : "";

    const matched = Route.getRoute(
      req.method as any,
      pathname,
      search
    );

    if (!matched) {
      if (staticHandler) {
        staticHandler(req, res, () => {
          this.responseHandler.sendJsonResponse(res, 404, { message: "Route not found" });
        });
        return;
      }
      this.responseHandler.sendJsonResponse(res, 404, { message: "Route not found" });
      return;
    }

    const { route, params, query } = matched;

    req.params = params;
    req.query = query;

    const middlewares = Route.resolveMiddlewares(route);

    await this.callHandler(route, req, res, middlewares);
  }

  private async callHandler(route: Routes, req: ZRequest, res: ZResponse, middlewares: Middleware[]): Promise<void> {
    try {
      await this.executeMiddleware(middlewares, req, res, async () => {
        const args: any[] = await this.getArgs(route, req, res);
        const result = Array.isArray(route.handler)
          ? await this.callController(route, args)
          : await route.handler(...args);
        
        await this.responseHandler.handleResponse(result, req, res);
      });
    } catch (error: unknown) {
      this.responseHandler.handleException(error, res);
    }
  }

  private async executeMiddleware(middlewares: Middleware[], req: ZRequest, res: ZResponse, handler: () => Promise<void>): Promise<void> {
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

  private async getArgs(route: Routes, req: ZRequest, res: ZResponse): Promise<any[]> {
    const metadata = route.metadata || [];
    const args: any[] = [];
    if (metadata.length === 0) {
      args.push(req, res);
      return args;
    }
    await Promise.all(metadata.map(async (param) => {
      const handler = this.argHandlers[param.type];
      if (handler) {
        args[param.index] = await handler(param, req, res);
      }
    }));
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

  private validateDto(data: any, dto: DTOClass | null | undefined, errorMsg: string) {
    if (dto && Object.hasOwn(dto, "schema")) {
      const dtoResult = safeParse(dto.schema, data);
      if (dtoResult.success === false) {
        throw new HttpException({
          message: errorMsg,
          statusCode: 422,
          details: dtoResult.issues,
        });
      }
      return dtoResult.output;
    }
    return data;
  }
}
