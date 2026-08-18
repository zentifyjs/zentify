import { getControllerMetadata, getModuleMetadata, getRouteMetadata } from "../decorators";
import { getParameterMetadata } from "../decorators/metadata";
import type { Container } from "../depedencies";
import type { ControllerClass, ControllerHandler, FunctionHandler, HandlerFunction, HttpMethod, ModuleClass, ModuleMiddleware, Routes } from "../types";
import { Middleware } from "../types/middleware";
import { Logger } from "../utils";
import { normalizePath } from "../utils/route";
import { matchMiddlewarePath, matchRoute } from "./matcher";
import { parseQuery } from "./query";
import { RouteTable } from "./route_table";
import * as path from "node:path";
import { pathToFileURL } from "node:url";



export class Route {
  private static routes: Routes[] = [];

  private static globalMiddleware: Middleware[] = [];

  private static prefixStack: string[] = [];

  private static groupMiddlewareStack: Middleware[][] = [];

  private static moduleMiddlewareStack: ModuleMiddleware[][] = [];

  private static routeTable = new RouteTable();

  public static registeredModules: ModuleClass[] = [];

  private static container: Container;

  public static setContainer(container: Container) {
    this.container = container;
  }

  private static logger = new Logger({ context: "Route" });

  public static async importRoutes(
    routes?: { web?: string; api?: string },
    outDir: string = "dist",
  ): Promise<void> {
    const specs = [routes?.web, routes?.api].filter((r): r is string => !!r);
    for (const spec of specs) {
      await this.importRouteFile(spec, outDir);
    }
  }

  private static buildRouteCandidates(spec: string, outDir: string): string[] {
    if (spec.includes("://") || spec.startsWith("file:")) return [spec];

    if (/^(@[^/]+\/)?[^./][^/]*$/.test(spec)) return [spec];

    const ext = path.extname(spec);
    const exts = ext ? [".js", ".mjs", ".cjs", ".ts", ".mts", ".tsx"] : [".js", ".ts", ".mjs"];

    const candidates: string[] = [];
    const add = (rel: string) => {
      const base = path.resolve(process.cwd(), rel);
      candidates.push(base);
      if (ext) {
        const stem = base.slice(0, -ext.length);
        for (const e of exts) if (e !== ext) candidates.push(stem + e);
      } else {
        for (const e of exts) candidates.push(base + e);
      }
    };

    add(path.join(outDir, spec));
    add(spec);

    return [...new Set(candidates)];
  }

  private static async importRouteFile(spec: string, outDir: string): Promise<void> {
    for (const candidate of this.buildRouteCandidates(spec, outDir)) {
      try {
        const dynamicImport = new Function("p", "return import(p)");
        await dynamicImport(pathToFileURL(candidate).href);
        this.logger.info(`Loaded route file: ${candidate}`);
        return;
      } catch (e: any) {
        if (
          e.code !== "ERR_MODULE_NOT_FOUND" &&
          e.code !== "ERR_UNKNOWN_FILE_EXTENSION" &&
          !e.message?.includes("Cannot find module") &&
          !e.message?.includes("Failed to load url") &&
          !e.message?.includes("Unknown file extension")
        ) {
          throw e;
        }
      }
    }
    this.logger.warn(`Route file "${spec}" not found.`);
  }

  private static getPrefix(): string {
    return this.prefixStack.join("");
  }

  private static getGroupMiddlewares(): Middleware[] {
    return this.groupMiddlewareStack.flat();
  }

  public static resolveMiddlewares(route: Routes): Middleware[] {
    return [...this.globalMiddleware, ...route.middlewares];
  }

  public static hasRoute(method: HttpMethod, path: string): boolean {
    return this.routes.some(
      (route) => route.method === method && route.path === path,
    );
  }

  public static getRoute(
    method: HttpMethod,
    pathname: string,
    search: string,
  ):
    | {
        route: Routes;
        params: Record<string, string>;
        query: Record<string, string | string[]>;
      }
    | undefined {
    const matched = matchRoute(method, pathname, this.routeTable);
    if (!matched) {
      return undefined;
    }
    const query = parseQuery(search);
    return { ...matched, query };
  }

  static module(module: ModuleClass){
    this.registeredModules.push(module);
  }

  static resolveModules(adapters: any[] = []) {
    for (const module of this.registeredModules) {
      const moduleMetadata = getModuleMetadata(module);
      const middlewares = moduleMetadata?.middleware || [];
      this.moduleMiddlewareStack.push(middlewares);

      const controllers = moduleMetadata?.controllers || [];
      const providers = moduleMetadata?.providers || [];
      const providerSet = new Set<any>([...providers, ...controllers]);

      for (const adapter of adapters) {
        if (adapter.onModuleResolve) {
          adapter.onModuleResolve(moduleMetadata || {}, providerSet, this.container);
        }
      }

      for (const ControllerClass of controllers) {
        const controller = this.container.resolve(ControllerClass, providerSet);
        this.controller(controller, []);
      }

      this.moduleMiddlewareStack.pop();
    }
  }

  private static controller(
    controllerOrInstance: any,
    middlewares: Middleware[] = [],
  ): void {
    const isInstance = typeof controllerOrInstance !== "function";
    const ControllerClass = isInstance ? controllerOrInstance.constructor : controllerOrInstance;
    const controllerInstance = isInstance ? controllerOrInstance : undefined;

    const prototype = ControllerClass.prototype;
    const routes = getRouteMetadata(prototype);

    const controllerMetadata = getControllerMetadata(ControllerClass);
    const controllerPath = controllerMetadata?.path || "";

    [...routes.entries()].map(([classMethod, metadata]) => {
      Route.addRoute(
        metadata.method,
        controllerPath + metadata.path,
        [ControllerClass, classMethod.toString()],
        [...middlewares, ...metadata.middlewares],
        controllerInstance
      );
    });
  }

  static addRoute(
    method: HttpMethod,
    path: string,
    handler: HandlerFunction,
    middlewares: Middleware[] = [],
    preBuiltInstance?: any
  ): void {
    const rawPath = this.getPrefix() + path;

    let routePath = normalizePath(rawPath);
    if (routePath.includes(":")) {
      const paramRegex = /:([a-zA-Z0-9_]+)/g;
      routePath = routePath.replace(paramRegex, (_, paramName) => {
        return `/:${paramName}`;
      });
      routePath = normalizePath(routePath);
    }

    const routeMiddlewares = [...this.getGroupMiddlewares(), ...middlewares];

    const moduleMiddlewares = this.moduleMiddlewareStack.flat();
    for (const mm of moduleMiddlewares) {
      let isExcluded = false;
      if (mm.excludeRoutes) {
        isExcluded = mm.excludeRoutes.some(rule => 
          (rule.method === "REQ_METHOD_ALL" || rule.method === method) &&
          matchMiddlewarePath(routePath, rule.path)
        );
      }
      if (isExcluded) continue;

      let isIncluded = true;
      if (mm.includeRoutes && mm.includeRoutes.length > 0) {
        isIncluded = mm.includeRoutes.some(rule => 
          (rule.method === "REQ_METHOD_ALL" || rule.method === method) &&
          matchMiddlewarePath(routePath, rule.path)
        );
      }

      if (isIncluded) {
        routeMiddlewares.push(...mm.middlewares);
      }
    }

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

    let metadata: any[] = [];
    let controllerInstance: any = preBuiltInstance || null;

    if (Array.isArray(handler)) {
      const [ControllerClass, methodName] = handler;
      if (!controllerInstance) {
        if (!this.container) {
          throw new Error("Container is not initialized. Make sure to call app.run() before resolving routes.");
        }
        controllerInstance = this.container.resolve(ControllerClass);
      }
      metadata = getParameterMetadata(
        Object.getPrototypeOf(controllerInstance),
        methodName,
      );
    } else {
      metadata = getParameterMetadata(handler, "handler");
    }

    this.routeTable.add({
      method,
      path: routePath,
      handler,
      middlewares: routeMiddlewares,
      metadata,
      controllerInstance,
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

  public static getRoutes(): Routes[] {
    return this.routeTable.all();
  }
}
