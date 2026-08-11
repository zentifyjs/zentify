import { normalizePath } from "../utils/route";
import type { Routes, HttpMethod } from "./route";
import { RouteTable } from "./route_table";

export type RouteMatch = {
  route: Routes;
  params: Record<string, string>;
};

export function matchRoute(
  method: HttpMethod,
  url: URL,
  routesTable: RouteTable,
): RouteMatch | undefined {
  const pathname = normalizePath(url.pathname);

  return routesTable.find(method, pathname);
}
