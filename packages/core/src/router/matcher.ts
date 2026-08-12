import { HttpMethod, Routes } from "../types";
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

export function matchMiddlewarePath(routePath: string, configPath: string): boolean {
  if (configPath.includes('*')) {
    const regexPath = configPath.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPath}$`);
    return regex.test(routePath);
  }
  return routePath === configPath;
}