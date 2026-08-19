import {
  Authenticatable,
  AuthRepository,
  Zentify,
  ZentifyAdapter,
  ZentifyAdapterKind,
} from "@zentify/core";
import { AuthManager } from "./auth_manager";
import { SessionGuard } from "./guard/session";
import { MemorySessionStore } from "./store/memory";
import { AuthCookieImpl } from "./auth_cookie";
import { BcryptHasher } from "./hasher/bcrypt";

export interface ZentifyAuthAdapterOptions {
  resultType?: "session" | "jwt";
  passwordHasher?: "bcrypt" | "argon2";
  model?: Authenticatable;
}

function getSessionGuard(
  type: "session" | "jwt",
  app: Zentify,
): SessionGuard<Authenticatable> {
  if (type === "session") {
    return new SessionGuard(new MemorySessionStore(), new AuthCookieImpl(app));
  } else {
    throw new Error("JWT guard not implemented yet");
  }
}

function getPasswordHasher(type: "bcrypt" | "argon2"): BcryptHasher {
  if (type === "bcrypt") {
    return new BcryptHasher();
  } else {
    throw new Error("Password hasher not implemented yet");
  }
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
    const repo: AuthRepository<Authenticatable> =
      app?.container.resolve("AUTH_REPOSITORY");

    const authManager = new AuthManager(
      repo,
      getSessionGuard(this.options.resultType || "session", app),
      getPasswordHasher(this.options.passwordHasher || "bcrypt"),
    );

    app?.container.provideGlobal({
      token: AuthManager,
      useValue: authManager,
    });
  }
  onModuleResolve(
    moduleMetadata: any,
    providerSet: Set<any>,
    container: any,
  ): void {}
}
