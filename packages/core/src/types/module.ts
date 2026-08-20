import type { ControllerClass } from "./controller";
import { MiddlewareHandler } from "./middleware";
import { HttpMethod, RequestMethod } from "./route_type";

export type ModuleClass<T = any> = new (...args: any[]) => T;
export type ModuleMiddleware = {
    middlewares: MiddlewareHandler[]
    excludeRoutes?: {
        path: string
        method: RequestMethod
    }[]
    includeRoutes?: {
        path: string
        method: RequestMethod
    }[]
}
export type ModuleEntry = {
  controllers?: ControllerClass[];
  providers?: any[];
  middleware?: ModuleMiddleware[];
  entities?: any[];
};