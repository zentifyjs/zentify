import { HandlerFunction } from "./controller";
import { MiddlewareHandler } from "./middleware";

export type RequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "REQ_METHOD_ALL";

export type HttpMethod = Exclude<RequestMethod, "REQ_METHOD_ALL">;

export type Routes = {
  method: HttpMethod;
  path: string;
  handler: HandlerFunction;
  middlewares: MiddlewareHandler[];
  metadata?: any[];
  controllerInstance?: any;
};