import { normalizePath } from "../utils/route";
import type { ListRoutes, HttpMethod } from "./route";

export type RouteMatch = {
  route: ListRoutes;
  params: Record<string, string>;
};

export function matchRoute(
  method: HttpMethod,
  url: URL,
  routes: ListRoutes[],
): RouteMatch | undefined {
  const requestPath = normalizePath(url.pathname);

  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const routePath = normalizePath(route.path);

    const routeParts = routePath === "/" ? [] : routePath.slice(1).split("/");

    const requestParts =
      requestPath === "/" ? [] : requestPath.slice(1).split("/");

    if (routeParts.length !== requestParts.length) {
      continue;
    }

    const params: Record<string, string> = {};

    let matched = true;

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const requestPart = requestParts[i];

      // /user/:id
      if (routePart.startsWith(":")) {
        const paramName = routePart.slice(1);

        if (!paramName) {
          matched = false;
          break;
        }

        params[paramName] = decodeURIComponent(requestPart);

        continue;
      }

      if (routePart !== requestPart) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return {
        route,
        params,
      };
    }
  }

  return undefined;
}
