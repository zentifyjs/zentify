import { ConfigService } from "../adapters/config/config.service";

export type InjectionToken = string | symbol | Function | any;

export interface ClassProvider {
  token: InjectionToken;
  useClass: Function;
}

export interface ValueProvider {
  token: InjectionToken;
  useValue: any;
}

export interface FactoryProvider {
  token: InjectionToken;
  useFactory: (container: Container) => any;
}

export type Provider = ClassProvider | ValueProvider | FactoryProvider | Function;

export class Container {
  private instances = new Map<InjectionToken, any>();
  private providers = new Map<InjectionToken, ClassProvider | ValueProvider | FactoryProvider>();

  provide(provider: Provider) {
    if (typeof provider === "function") {
      this.providers.set(provider, { token: provider, useClass: provider });
    } else {
      this.providers.set(provider.token, provider);
    }
  }

  has(token: InjectionToken): boolean {
    return this.instances.has(token) || this.providers.has(token);
  }

  resolve<T>(token: InjectionToken, allowedProviders?: Set<InjectionToken>): T {
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    const provider = this.providers.get(token);

    if (!provider) {
      if (typeof token === "function") {
        if (allowedProviders && !allowedProviders.has(token)) {
          throw new Error(`Dependency ${token.name} is not provided in the Module`);
        }
        const instance = this.resolveClass(token, allowedProviders);
        this.instances.set(token, instance);
        return instance;
      }
      throw new Error(`Cannot resolve dependency for token: ${String(token)}`);
    }

    if (allowedProviders && !allowedProviders.has(token)) {
      throw new Error(`Dependency ${String(token)} is not provided in the Module`);
    }

    let instance: any;

    if ("useValue" in provider) {
      instance = provider.useValue;
    } else if ("useFactory" in provider) {
      instance = provider.useFactory(this);
    } else if ("useClass" in provider) {
      instance = this.resolveClass(provider.useClass, allowedProviders);
    }

    this.instances.set(token, instance);
    return instance;
  }

  private resolveClass(target: Function, allowedProviders?: Set<InjectionToken>): any {
    const deps = Reflect.getMetadata("design:paramtypes", target) || [];
    const customTokens = Reflect.getMetadata("zentify:inject", target) || {};

    const resolvedDeps = deps.map((dep: any, index: number) => {
      const customToken = customTokens[index];
      const tokenToResolve = customToken !== undefined ? customToken : dep;

      if (tokenToResolve === undefined || (typeof tokenToResolve !== "function" && typeof tokenToResolve !== "string" && typeof tokenToResolve !== "symbol")) {
        throw new Error(`Cannot resolve dependency of ${target.name} at index ${index}. Did you forget a decorator or provider?`);
      }

      return this.resolve(tokenToResolve, allowedProviders);
    });

    const instance = new (target as any)(...resolvedDeps);
    ConfigService.applyEnvironment(target, instance);
    return instance;
  }
}
