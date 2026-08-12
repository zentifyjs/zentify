import FindMyWay from "find-my-way";
import type { Routes, HttpMethod } from "../types";

export class RouteTable {
  private readonly finder = FindMyWay({
    ignoreTrailingSlash: true,
  });

  private readonly registered: Routes[] = [];

  add(route: Routes): void {
    try {
      this.finder.on(route.method, route.path, noop, route);
    } catch {
      throw new Error(`Duplicate route: ${route.method} ${route.path}`);
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