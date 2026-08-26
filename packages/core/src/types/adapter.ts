import type { Container, InjectionToken } from "../dependencies/container";
import { Zentify } from "../zentify";
import { ZentifyViewEngine } from "../view";
import type { ZRequest, ZResponse } from "./message";

export type ZentifyAdapterKind = "database" | "view" | "common" | "other";

export interface ZentifyArgumentContext {
  req: ZRequest;
  res: ZResponse;
  container: Container;
  param: any;
}

export type ZentifyArgumentResolver = (
  param: any,
  ctx: ZentifyArgumentContext,
) => Promise<any> | any;

export interface ZentifyAdapter {
  name: string;
  kind: ZentifyAdapterKind;

  /**
   * Names of other adapters whose onInit must complete before this
   * adapter's onInit runs. Adapters are boot-ordered by these dependencies,
   * regardless of registration order.
   */
  dependsOn?: string[];

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
  onModuleResolve?(
    moduleMetadata: any,
    providerSet: Set<any>,
    container: any,
  ): void;

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

  /**
   * Resolves an argument for a route parameter decorator bound to this
   * adapter via parameter metadata `kind: { type: "adapter", name }`.
   * Called by RequestDispatcher.getArgs(); implement per argument type key.
   */
  getResolverArgs?(key: string): ZentifyArgumentResolver | undefined;

  /**
   * General-purpose hook called during CLI install.
   * Adapter bebas lakukan apa saja: copy file, validasi, jalankan migration,
   * buat directory, dll. Dipanggil SETELAH npm install (adapter package tersedia).
   */
  onInstall?(projectRoot: string): Promise<void> | void;
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
