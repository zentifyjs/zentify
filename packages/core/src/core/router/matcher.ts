import type { Routes, HttpMethod } from "./route";
import { RouteTable } from "./route_table";

export type RouteMatch = {
  route: Routes;
  params: Record<string, string>;
};

export function matchRoute(
  method: HttpMethod,
  pathname: string,
  routesTable: RouteTable,
): RouteMatch | undefined {
  return routesTable.find(method, pathname);
}
