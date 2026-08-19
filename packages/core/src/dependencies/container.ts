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
  private globalTokens = new Set<InjectionToken>();
  private resolvingStack: InjectionToken[] = [];

  provide(provider: Provider) {
    if (typeof provider === "function") {
      this.providers.set(provider, { token: provider, useClass: provider });
    } else {
      this.providers.set(provider.token, provider);
    }
  }

  provideGlobal(provider: Provider) {
    this.provide(provider);
    const token = typeof provider === "function" ? provider : provider.token;
    this.globalTokens.add(token);
  }

  isGlobal(token: InjectionToken): boolean {
    return this.globalTokens.has(token);
  }

  has(token: InjectionToken): boolean {
    return this.instances.has(token) || this.providers.has(token);
  }

  private isAllowedForModule(
    token: InjectionToken,
    allowedProviders?: Set<InjectionToken>,
  ): boolean {
    if (!allowedProviders) return true;
    if (this.globalTokens.has(token)) return true;
    return allowedProviders.has(token);
  }

  resolve<T>(token: InjectionToken, allowedProviders?: Set<InjectionToken>): T {
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    const cycleFrom = this.resolvingStack.indexOf(token);
    if (cycleFrom !== -1) {
      const chain = [...this.resolvingStack.slice(cycleFrom), token]
        .map(tokenLabel)
        .join(" -> ");
      throw new Error(`Circular dependency detected: ${chain}`);
    }

    this.resolvingStack.push(token);

    try {
      const provider = this.providers.get(token);

      if (!provider) {
        if (typeof token === "function") {
          if (!this.isAllowedForModule(token, allowedProviders)) {
            throw new Error(`Dependency ${tokenLabel(token)} is not provided in the Module`);
          }
          const instance = this.resolveClass(token, allowedProviders);
          this.instances.set(token, instance);
          return instance;
        }
        throw new Error(`Cannot resolve dependency for token: ${String(token)}`);
      }

      if (!this.isAllowedForModule(token, allowedProviders)) {
        throw new Error(`Dependency ${tokenLabel(token)} is not provided in the Module`);
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
    } finally {
      this.resolvingStack.pop();
    }
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

function tokenLabel(token: InjectionToken): string {
  if (typeof token === "function") {
    return token.name || "(anonymous)";
  }
  return String(token);
}
