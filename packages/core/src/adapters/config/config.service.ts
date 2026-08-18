import { Dependency } from "../../decorators/dependency";
import { getEnvBindings, getRequiredEnvs } from "../../decorators/config";
import { Logger } from "../../utils/logger";
import { EnvFileConfigLoader } from "./loaders/env_file";
import type { ConfigLoader } from "./types";

function coerce(raw: string, type?: Function): unknown {
  if (type === Number) {
    const n = Number(raw);
    return Number.isNaN(n) ? raw : n;
  }
  if (type === Boolean) return raw === "true" || raw === "1";
  return raw;
}

@Dependency()
export class ConfigService {
  private static logger = new Logger({ context: "ConfigService" });
  private static loaders: ConfigLoader[] = [new EnvFileConfigLoader()];
  private static envStore: Record<string, string> = {};
  private static loaded = false;

  static get envs(): Readonly<Record<string, string>> {
    return this.envStore;
  }

  static addLoader(loader: ConfigLoader): void {
    this.loaders.push(loader);
  }

  static load(): void {
    if (this.loaded) return;
    this.loaded = true;

    this.envStore = { ...process.env } as Record<string, string>;

    const sorted = [...this.loaders].sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0),
    );

    for (const loader of sorted) {
      try {
        const parsed = loader.load();
        Object.assign(this.envStore, parsed);
        this.logger.info(
          `Loaded ${Object.keys(parsed).length} variable(s)`,
        );
      } catch (e: any) {
        this.logger.warn(`Config loader "${loader.name}" failed: ${e.message}`);
      }
    }

    for (const key of Object.keys(this.envStore)) {
      process.env[key] = this.envStore[key];
    }

    this.validate();
  }

  static get<T = string>(key: string, defaultValue?: T): T {
    const value = this.envStore[key];
    if (value === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`[Config Error] Environment variable '${key}' is missing!`);
    }
    return value as unknown as T;
  }

  static has(key: string): boolean {
    return this.envStore[key] !== undefined;
  }

  /** Assigns + coerces @Env properties after DI construction. No-op when no bindings. */
  static applyEnvironment(target: Function, instance: any): void {
    for (const { key, propertyKey } of getEnvBindings(target)) {
      const value = this.envStore[key];
      if (value === undefined) continue;
      const designType = Reflect.getMetadata(
        "design:type",
        target.prototype,
        propertyKey,
      );
      instance[propertyKey] = coerce(value, designType);
    }
  }

  static getFrontendEnvs(): Record<string, string> {
    if (!this.loaded) this.load();
    const out: Record<string, string> = {};
    for (const key of Object.keys(this.envStore)) {
      if (key.startsWith("FRONTEND_")) {
        out[`import.meta.env.${key}`] = JSON.stringify(this.envStore[key]);
      }
    }
    return out;
  }

  /** Plain { KEY: value } map of FRONTEND_* vars for client-side injection. */
  static getFrontendEnvMap(): Record<string, string> {
    if (!this.loaded) this.load();
    const out: Record<string, string> = {};
    for (const key of Object.keys(this.envStore)) {
      if (key.startsWith("FRONTEND_")) {
        out[key] = this.envStore[key];
      }
    }
    return out;
  }

  private static validate(): void {
    const required = getRequiredEnvs();
    const missing = required.filter(
      ({ key }) => this.envStore[key] === undefined,
    );
    if (missing.length === 0) return;

    const detail = missing
      .map((m) => `  - '${m.key}' (required by ${m.className}.${m.propertyKey})`)
      .join("\n");

    this.logger.error(
      "Configuration Validation Failed! Missing required environment variables:\n" +
        detail,
    );
    process.exit(1);
  }

  /** Instance aliases for DI injection parity */
  get<T = string>(key: string, defaultValue?: T): T {
    return ConfigService.get(key, defaultValue);
  }

  has(key: string): boolean {
    return ConfigService.has(key);
  }
}