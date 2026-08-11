import type { Routes, HttpMethod } from "./route";

type ParamNode = {
  name: string;
  child?: RouteNode;
  route?: Routes;
};

type RouteNode = {
  staticChildren: Map<string, RouteNode>;
  param?: ParamNode;
  route?: Routes;
};

export class RouteTable {
  private readonly roots = new Map<HttpMethod, RouteNode>();

  add(route: Routes): void {
    let root = this.roots.get(route.method);

    if (!root) {
      root = { staticChildren: new Map() };
      this.roots.set(route.method, root);
    }

    const path = splitPath(route.path);
    const node = this.insert(root, path, 0, route.path);

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

    const params: Record<string, string> = {};
    const matched = this.match(root, pathname, 1, pathname.length, params);

    if (!matched) {
      return undefined;
    }

    return { route: matched, params };
  }

  all(): Routes[] {
    const routes: Routes[] = [];

    for (const root of this.roots.values()) {
      this.collect(root, routes);
    }

    return routes;
  }

  private insert(
    node: RouteNode,
    segments: string[],
    index: number,
    path: string,
  ): RouteNode {
    if (index === segments.length) {
      return node;
    }

    const segment = segments[index];

    if (segment.startsWith(":")) {
      const paramName = segment.slice(1);

      if (!paramName) {
        throw new Error(`Invalid route parameter in "${path}"`);
      }

      if (!node.param) {
        node.param = { name: paramName };
      } else if (node.param.name !== paramName) {
        throw new Error(`Conflicting parameter names in route "${path}"`);
      }

      if (!node.param.child) {
        node.param.child = { staticChildren: new Map() };
      }

      return this.insert(node.param.child, segments, index + 1, path);
    }

    let child = node.staticChildren.get(segment);

    if (!child) {
      child = { staticChildren: new Map() };
      node.staticChildren.set(segment, child);
    }

    return this.insert(child, segments, index + 1, path);
  }

  private match(
    node: RouteNode,
    path: string,
    pos: number,
    length: number,
    params: Record<string, string>,
  ): Routes | undefined {
    if (pos >= length) {
      return node.route;
    }

    const segEnd = path.indexOf("/", pos);
    const end = segEnd === -1 ? length : segEnd;

    const segment = path.slice(pos, end);
    const nextPos = end + 1;

    // 1. Static route harus diprioritaskan
    const staticChild = node.staticChildren.get(segment);

    if (staticChild) {
      const result = this.match(staticChild, path, nextPos, length, params);

      if (result) {
        return result;
      }
    }

    // 2. Baru parameter route
    if (node.param) {
      const paramValue =
        segment.indexOf("%") === -1
          ? segment
          : decodeSegment(segment);

      params[node.param.name] = paramValue;

      const result = this.match(
        node.param.child!,
        path,
        nextPos,
        length,
        params,
      );

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

    for (const child of node.staticChildren.values()) {
      this.collect(child, routes);
    }

    if (node.param?.child) {
      this.collect(node.param.child, routes);
    }
  }
}

function splitPath(path: string): string[] {
  return path === "/" ? [] : path.replace(/^\/+|\/+$/g, "").split("/");
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
