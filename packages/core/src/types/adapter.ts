import type { InjectionToken } from "../depedencies/container";
import { Zentify } from "../zentify";
import { ZentifyViewEngine } from "../view";

export interface ZentifyAdapter {
  name: string;

  /**
   * Lifecycle hook called in LifecycleManager.boot(), BEFORE onInit.
   * May be async. Useful for eager config loading and validation.
   */
  onBeforeInit?(app: Zentify): Promise<void> | void;

  /**
   * Lifecycle hook called before the HTTP server starts.
   * Useful for initializing programmatic servers like Vite.
   */
  onInit?(app: Zentify): Promise<void> | void;
  
  /**
   * Lifecycle hook called when a module is resolved.
   * Useful for registering module-scoped dependencies like ORM entities.
   */
  onModuleResolve?(moduleMetadata: any, providerSet: Set<any>, container: any): void;

  /**
   * Lifecycle hook called to run database migrations.
   */
  onMigrate?(type: string): Promise<void> | void;


  /**
   * Lifecycle hook called when the application is closing.
   */
  onClose?(app: Zentify): Promise<void> | void;

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
}

export interface ZentifyAdapterFactory {
  /**
   * Tokens to resolve from the container and pass to `useFactory`.
   */
  dependency?: InjectionToken[];

  /**
   * Builds the adapter from the resolved dependencies.
   */
  useFactory: (...deps: any[]) => ZentifyAdapter;
}

export type AddAdapterInput = ZentifyAdapter | ZentifyAdapterFactory;
