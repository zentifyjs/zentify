import { HandlerFunction } from "./controller";
import { Middleware } from "./middleware";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type Routes = {
  method: HttpMethod;
  path: string;
  handler: HandlerFunction;
  middlewares: Middleware[];
  metadata?: any[];
  controllerInstance?: any;
};