import {
  Authenticatable,
  AuthRepository,
  Zentify,
  ZentifyAdapter,
  ZentifyAdapterKind,
} from "@zentify/core";
import { AuthManager } from "./auth_manager";
import { GuardInstance } from "./guard_instance";
import { SessionGuard } from "./guard/session";
import { MemorySessionStore } from "./store/memory";
import { AuthCookieImpl } from "./auth_cookie";
import { BcryptHasher } from "./hasher/bcrypt";

export interface AuthGuardConfig {
  driver: "session" | "jwt";
  provider: new (...args: any[]) => Authenticatable;
}

export interface ZentifyAuthAdapterOptions {
  defaultGuard: string;
  passwordHasher?: "bcrypt" | "argon2";
  guards: Record<string, AuthGuardConfig>;
}

function getSessionGuard(
  name: string,
  app: Zentify,
): SessionGuard<Authenticatable> {
  return new SessionGuard(
    name,
    new MemorySessionStore(),
    new AuthCookieImpl(app),
    { cookieName: `zentify_${name}` },
  );
}

function getGuard(
  name: string,
  driver: "session" | "jwt",
  app: Zentify,
): SessionGuard<Authenticatable> {
  if (driver === "session") {
    return getSessionGuard(name, app);
  }

  throw new Error(`JWT driver for guard "${name}" is not implemented yet.`);
}

function getPasswordHasher(type: "bcrypt" | "argon2"): BcryptHasher {
  if (type === "bcrypt") {
    return new BcryptHasher();
  }

  throw new Error("Password hasher not implemented yet");
}

export class ZentifyAuthAdapter implements ZentifyAdapter {
  name = "ZentifyAuthAdapter";
  kind: ZentifyAdapterKind = "common";
  dependsOn = ["TypeOrmAdapter"];
  private options: ZentifyAuthAdapterOptions;
  constructor(options: ZentifyAuthAdapterOptions) {
    this.options = options;
  }

  onInit(app: Zentify): Promise<void> | void {
    const container = app?.container;
    const hasher = getPasswordHasher(this.options.passwordHasher || "bcrypt");

    const guards: Record<string, GuardInstance<Authenticatable>> = {};

    for (const [name, config] of Object.entries(this.options.guards)) {
      const providerName = config.provider?.name || "Unknown";
      const repo = container.resolve<AuthRepository<Authenticatable>>(
        `AUTH_REPOSITORY_${providerName}`,
      );

      guards[name] = new GuardInstance(
        name,
        repo,
        getGuard(name, config.driver, app),
        hasher,
      );
    }

    const authManager = new AuthManager(
      this.options.defaultGuard,
      guards,
      hasher,
    );

    container.provideGlobal({
      token: AuthManager,
      useValue: authManager,
    });

    for (const name of Object.keys(guards)) {
      container.provideGlobal({
        token: `AuthManager.${name}`,
        useValue: guards[name],
      });
    }
  }
  onModuleResolve(
    moduleMetadata: any,
    providerSet: Set<any>,
    container: any,
  ): void {}
}