import { Zentify } from "../zentify";
import { ZentifyViewEngine } from "../view";

export interface ZentifyAdapter {
  name: string;
  
  /**
   * Lifecycle hook called before the HTTP server starts.
   * Useful for initializing programmatic servers like Vite.
   */
  onInit?(app: Zentify): Promise<void> | void;
  
  /**
   * Returns a connect-style middleware (req, res, next)
   * that will be executed by HttpServer before Zify Router.
   */
  getGlobalMiddleware?(): any;
  
  /**
   * Returns the view engine implementation if this adapter
   * is responsible for rendering views.
   */
  getViewEngine?(): ZentifyViewEngine;
  
  /**
   * Lifecycle hook called when a module is resolved.
   * Useful for registering module-scoped dependencies like ORM entities.
   */
  onModuleResolve?(moduleMetadata: any, providerSet: Set<any>, container: any): void;
}
