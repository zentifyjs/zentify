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

const regexCache = new Map<string, RegExp>();

export function matchMiddlewarePath(routePath: string, configPath: string): boolean {
  if (configPath.includes('*')) {
    let regex = regexCache.get(configPath);
    if (!regex) {
      const regexPath = configPath.replace(/\*/g, '.*');
      regex = new RegExp(`^${regexPath}$`);
      regexCache.set(configPath, regex);
    }
    return regex.test(routePath);
  }
  return routePath === configPath;
}