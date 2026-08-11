// core/decorators/route.ts

import { Middleware } from "../middleware";
import { HttpMethod } from "../router";

export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  middlewares: Middleware[];
}

const routeMetadata = new WeakMap<
  object,
  Map<string | symbol, RouteMetadata>
>();

function Route(
  method: HttpMethod,
  path: string,
  middlewares: Middleware[] = [],
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

export function Get(path = "/", middlewares: Middleware[] = []) {
  return Route("GET", path, middlewares);
}

export function Post(path = "/", middlewares: Middleware[] = []) {
  return Route("POST", path, middlewares);
}

export function Put(path = "/", middlewares: Middleware[] = []) {
  return Route("PUT", path, middlewares);
}

export function Patch(path = "/", middlewares: Middleware[] = []) {
  return Route("PATCH", path, middlewares);
}

export function Delete(path = "/", middlewares: Middleware[] = []) {
  return Route("DELETE", path, middlewares);
}
