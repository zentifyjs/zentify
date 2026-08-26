import {
  Authenticatable,
  AuthRepository,
  Zentify,
  ZentifyAdapter,
  ZentifyAdapterKind,
  ZentifyArgumentResolver,
} from "@zentify/core";
import { AuthManager } from "./auth_manager";
import { GuardInstance } from "./guard_instance";
import { SessionGuard } from "./guard/session";
import { MemorySessionStore } from "./store/memory";
import { AuthCookieImpl } from "./auth_cookie";
import { BcryptHasher } from "./hasher/bcrypt";
import { AUTH_ADAPTER_NAME, DEPEND_ON_ADAPTERS } from "./constant";
import { DatabaseSessionStore } from "./store/database";

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
    new DatabaseSessionStore(app.container.resolve("TYPEORM_DATA_SOURCE")),
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
  name = AUTH_ADAPTER_NAME;
  kind: ZentifyAdapterKind = "common";
  dependsOn = DEPEND_ON_ADAPTERS;
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

  getResolverArgs(key: string): ZentifyArgumentResolver | undefined {
    const map = {
      authuser: async (param: any, ctx: any) => {
        const { container } = ctx;

        const result = await container
          .resolve(AuthManager)
          .guard(param.additionalData?.guardName ?? "web")
          .user();
        return result;
      },
    };

    return map[key as keyof typeof map] ?? undefined;
  }

  async onInstall(projectRoot: string) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const { spawn } = await import("node:child_process");
    const { Logger } = await import("@zentify/core");
    const logger = new Logger({ context: "auth:install" });

    const authDir = path.resolve(__dirname, "..");
    const migrationsSrc = path.join(authDir, "data", "migrations");

    try {
      await fs.access(migrationsSrc);
      const migrationsDest = path.join(
        projectRoot,
        "app",
        "Database",
        "migrations",
      );
      await fs.mkdir(migrationsDest, { recursive: true });

      const files = await fs.readdir(migrationsSrc);
      for (const file of files) {
        if (!file.endsWith(".ts")) continue;
        const src = path.join(migrationsSrc, file);
        const dest = path.join(migrationsDest, file);
        try {
          await fs.access(dest);
          logger.warn(`Migration ${file} sudah ada, skip.`);
        } catch {
          await fs.copyFile(src, dest);
          logger.info(`Copied migration: ${file}`);
        }
      }
    } catch {
      logger.warn("Migration source tidak ditemukan di auth package.");
    }

    const userPath = path.join(projectRoot, "app", "Models", "User.ts");
    try {
      const content = await fs.readFile(userPath, "utf-8");
      if (!content.includes("getAuthIdentifier")) {
        logger.warn(
          "User.ts belum implement Authenticatable. " +
            "Tambahkan method getAuthIdentifier() { return this.email; }",
        );
      }
    } catch {
      logger.warn("app/Models/User.ts tidak ditemukan.");
    }

    logger.info("Menjalankan migration...");
    try {
      const child = spawn("npx", ["zentify", "migrate:run"], {
        stdio: "inherit",
        cwd: projectRoot,
        shell: true,
      });
      await new Promise<void>((resolve, reject) => {
        child.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`migrate:run exited with code ${code}`));
        });
      });
      logger.info("Migration berhasil.");
    } catch (e: any) {
      logger.warn(`Gagal menjalankan migration: ${e.message}`);
      logger.info("Jalankan manual: npx zentify migrate:run");
    }
  }
}
