import FindMyWay from "find-my-way";
import type { Routes, HttpMethod } from "../types";

export class RouteTable {
  private readonly finder = FindMyWay({
    ignoreTrailingSlash: true,
  });

  private readonly registered: Routes[] = [];

  private readonly staticRoutes = new Map<string, Routes>();

  add(route: Routes): void {
    const isStatic = !route.path.includes(":") && !route.path.includes("*");

    if (isStatic) {
      const key = `${route.method}:${route.path}`;
      if (this.staticRoutes.has(key)) {
        throw new Error(`Duplicate route: ${route.method} ${route.path}`);
      }
      this.staticRoutes.set(key, route);
    }

    try {
      this.finder.on(route.method, route.path, noop, route);
    } catch {
      if (!isStatic) {
        throw new Error(`Duplicate route: ${route.method} ${route.path}`);
      }
    }

    this.registered.push(route);
  }

  find(
    method: HttpMethod,
    pathname: string,
  ):
    | {
        route: Routes;
        params: Record<string, string>;
      }
    | undefined {
    const staticKey = `${method}:${pathname}`;
    const staticRoute = this.staticRoutes.get(staticKey);
    
    if (staticRoute) {
      return {
        route: staticRoute,
        params: {},
      };
    }

    const hit = this.finder.find(method, pathname);

    if (!hit) {
      return undefined;
    }

    return {
      route: hit.store as Routes,
      params: hit.params as Record<string, string>,
    };
  }

  all(): Routes[] {
    return [...this.registered];
  }
}

const noop = () => {};