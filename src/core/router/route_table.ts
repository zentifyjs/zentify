import type { Routes, HttpMethod } from "./route";

type RouteNode = {
  static: Map<string, RouteNode>;
  param?: RouteNode;
  paramName?: string;
  route?: Routes;
};

function createNode(): RouteNode {
  return {
    static: new Map(),
  };
}

export class RouteTable {
  private readonly roots = new Map<HttpMethod, RouteNode>();

  add(route: Routes): void {
    let root = this.roots.get(route.method);

    if (!root) {
      root = createNode();
      this.roots.set(route.method, root);
    }

    const path =
      route.path === "/" ? [] : route.path.replace(/^\/+|\/+$/g, "").split("/");

    let node = root;

    for (const segment of path) {
      // :id
      if (segment.startsWith(":")) {
        const paramName = segment.slice(1);

        if (!paramName) {
          throw new Error(`Invalid route parameter in "${route.path}"`);
        }

        if (!node.param) {
          node.param = createNode();
          node.paramName = paramName;
        } else if (node.paramName !== paramName) {
          throw new Error(
            `Conflicting parameter names in route "${route.path}"`,
          );
        }

        node = node.param;
        continue;
      }

      // static segment
      let child = node.static.get(segment);

      if (!child) {
        child = createNode();
        node.static.set(segment, child);
      }

      node = child;
    }

    if (node.route) {
      throw new Error(`Duplicate route: ${route.method} ${route.path}`);
    }

    node.route = route;
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
    const root = this.roots.get(method);

    if (!root) {
      return undefined;
    }

    const path =
      pathname === "/" ? [] : pathname.replace(/^\/+|\/+$/g, "").split("/");

    return this.match(root, path, 0, {});
  }

  all(): Routes[] {
    const routes: Routes[] = [];

    for (const root of this.roots.values()) {
      this.collect(root, routes);
    }

    return routes;
  }

  private match(
    node: RouteNode,
    parts: string[],
    index: number,
    params: Record<string, string>,
  ):
    | {
        route: Routes;
        params: Record<string, string>;
      }
    | undefined {
    // Semua segment sudah habis
    if (index === parts.length) {
      if (node.route) {
        return {
          route: node.route,
          params,
        };
      }

      return undefined;
    }

    const part = parts[index];

    // 1. Static route harus diprioritaskan
    const staticChild = node.static.get(part);

    if (staticChild) {
      const result = this.match(staticChild, parts, index + 1, params);

      if (result) {
        return result;
      }
    }

    // 2. Baru parameter route
    if (node.param) {
      const paramName = node.paramName!;

      const nextParams = {
        ...params,
        [paramName]: decodeURIComponent(part),
      };

      const result = this.match(node.param, parts, index + 1, nextParams);

      if (result) {
        return result;
      }
    }

    return undefined;
  }

  private collect(node: RouteNode, routes: Routes[]): void {
    if (node.route) {
      routes.push(node.route);
    }

    for (const child of node.static.values()) {
      this.collect(child, routes);
    }

    if (node.param) {
      this.collect(node.param, routes);
    }
  }
}
