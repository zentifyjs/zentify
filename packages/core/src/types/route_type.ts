import { HandlerFunction } from "./controller";
import { Middleware } from "./middleware";

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
  middlewares: Middleware[];
  metadata?: any[];
  controllerInstance?: any;
};