import { getControllerMetadata, getRouteMetadata } from "../decorators";
import { Middleware } from "../middleware";
import { normalizePath } from "../utils/route";
import { matchRoute } from "./matcher";
import { parseQuery } from "./query";

export type ControllerClass<T = any> = new (...args: any[]) => T;

export type MethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export type ControllerHandler<C extends ControllerClass<any>> = [
  controller: C,
  method: MethodKeys<InstanceType<C>>,
];

export type FunctionHandler = (...args: any[]) => any;

export type HandlerFunction = [ControllerClass<any>, string] | FunctionHandler;

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type ListRoutes = {
  method: HttpMethod;
  path: string;
  handler: HandlerFunction;
  middlewares: Middleware[];
};

export class Route {
  private static routes: ListRoutes[] = [];

  private static globalMiddleware: Middleware[] = [];

  private static prefixStack: string[] = [];

  private static groupMiddlewareStack: Middleware[][] = [];

  private static getPrefix(): string {
    return this.prefixStack.join("");
  }

  private static getGroupMiddlewares(): Middleware[] {
    return this.groupMiddlewareStack.flat();
  }

  public static resolveMiddlewares(route: ListRoutes): Middleware[] {
    return [...this.globalMiddleware, ...route.middlewares];
  }

  public static hasRoute(method: HttpMethod, path: string): boolean {
    return this.routes.some(
      (route) => route.method === method && route.path === path,
    );
  }

  public static getRoute(
    method: HttpMethod,
    url: URL,
  ):
    | {
        route: ListRoutes;
        params: Record<string, string>;
        query: Record<string, string | string[]>;
      }
    | undefined {
    const matched = matchRoute(method, url, this.routes);
    const query = parseQuery(url);
    if (!matched) {
      return undefined;
    }
    return { ...matched, query };
  }

  static controller(
    controller: ControllerClass,
    middlewares: Middleware[] = [],
  ): void {
    const prototype = controller.prototype;
    const routes = getRouteMetadata(prototype);

    const controllerMetadata = getControllerMetadata(controller);
    const controllerPath = controllerMetadata?.path || "";

    [...routes.entries()].map(([classMethod, metadata]) => {
      Route.addRoute(
        metadata.method,
        controllerPath + metadata.path,
        [controller, classMethod.toString()],
        [...middlewares, ...metadata.middlewares],
      );
    });
  }

  static addRoute(
    method: HttpMethod,
    path: string,
    handler: HandlerFunction,
    middlewares: Middleware[] = [],
  ): void {
    const rawPath = this.getPrefix() + path;

    let routePath = normalizePath(rawPath);
    if (routePath.includes(":")) {
      const paramRegex = /:([a-zA-Z0-9_]+)/g;
      routePath = routePath.replace(paramRegex, (_, paramName) => {
        return `/:${paramName}`;
      });
    }

    const routeMiddlewares = [...this.getGroupMiddlewares(), ...middlewares];

    const seen = new Set<Function>();

    for (const middleware of routeMiddlewares) {
      const middlewareType =
        typeof middleware === "function" ? middleware : middleware.constructor;

      if (seen.has(middlewareType)) {
        const name = middlewareType.name || "AnonymousMiddleware";

        throw new Error(
          `Duplicate middleware "${name}" on route [${method}] ${routePath}`,
        );
      }

      seen.add(middlewareType);
    }

    this.routes.push({
      method,
      path: routePath,
      handler,
      middlewares: routeMiddlewares,
    });
  }

  public static get<C extends ControllerClass<any>>(
    path: string,
    handler: ControllerHandler<C> | FunctionHandler,
    middlewares: Middleware[] = [],
  ): void {
    this.addRoute("GET", path, handler as HandlerFunction, middlewares);
  }

  public static post<C extends ControllerClass<any>>(
    path: string,
    handler: ControllerHandler<C> | FunctionHandler,
    middlewares: Middleware[] = [],
  ): void {
    this.addRoute("POST", path, handler as HandlerFunction, middlewares);
  }

  public static put<C extends ControllerClass<any>>(
    path: string,
    handler: ControllerHandler<C> | FunctionHandler,
    middlewares: Middleware[] = [],
  ): void {
    this.addRoute("PUT", path, handler as HandlerFunction, middlewares);
  }

  public static delete<C extends ControllerClass<any>>(
    path: string,
    handler: ControllerHandler<C> | FunctionHandler,
    middlewares: Middleware[] = [],
  ): void {
    this.addRoute("DELETE", path, handler as HandlerFunction, middlewares);
  }

  public static group(
    prefix: string,
    callback: () => void,
    middlewares: Middleware[] = [],
  ): void {
    this.prefixStack.push(prefix);
    this.groupMiddlewareStack.push(middlewares);

    try {
      callback();
    } finally {
      this.prefixStack.pop();
      this.groupMiddlewareStack.pop();
    }
  }

  public static use(middleware: Middleware): void {
    this.globalMiddleware.push(middleware);
  }

  public static getRoutes(): ListRoutes[] {
    return this.routes;
  }
}
