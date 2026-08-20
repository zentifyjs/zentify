// core/decorators/route.ts

import { HttpMethod, MiddlewareHandler } from "../types";

export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  middlewares: MiddlewareHandler[];
}

const routeMetadata = new WeakMap<
  object,
  Map<string | symbol, RouteMetadata>
>();

function Route(
  method: HttpMethod,
  path: string,
  middlewares: MiddlewareHandler[] = [],
) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    let routes = routeMetadata.get(target);

    if (!routes) {
      routes = new Map();
      routeMetadata.set(target, routes);
    }

    routes.set(propertyKey, {
      method,
      path,
      middlewares,
    });
  };
}

export function getRouteMetadata(
  target: object,
): Map<string | symbol, RouteMetadata> {
  return routeMetadata.get(target) ?? new Map();
}

export function Get(path = "/", middlewares: MiddlewareHandler[] = []) {
  return Route("GET", path, middlewares);
}

export function Post(path = "/", middlewares: MiddlewareHandler[] = []) {
  return Route("POST", path, middlewares);
}

export function Put(path = "/", middlewares: MiddlewareHandler[] = []) {
  return Route("PUT", path, middlewares);
}

export function Patch(path = "/", middlewares: MiddlewareHandler[] = []) {
  return Route("PATCH", path, middlewares);
}

export function Delete(path = "/", middlewares: MiddlewareHandler[] = []) {
  return Route("DELETE", path, middlewares);
}
