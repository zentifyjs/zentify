import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { ConfigService } from "../../src/adapters/config/config.service";
import { Configuration, Env } from "../../src/decorators/config";
import { Container } from "../../src/dependencies/container";

@Configuration()
class AppConfig {
  @Env("PORT") port!: number;
  @Env("ENABLED") enabled!: boolean;
  @Env("APP_NAME") appName!: string;
  @Env("API_URL") apiUrl!: string;
}

@Configuration()
class StrictConfig {
  @Env("STRICT_FLAG") flag!: boolean;
  @Env("NUMERIC_PORT") port!: number;
  @Env("MISSING_OPTIONAL") optional!: string;
}

const KEYS = [
  "PORT",
  "ENABLED",
  "APP_NAME",
  "API_URL",
  "FRONTEND_PUBLIC_KEY",
  "FRONTEND_API_BASE",
];

function resetEnvs() {
  for (const key of KEYS) {
    delete process.env[key];
  }
}

describe("ConfigService", () => {
  beforeEach(() => {
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    resetEnvs();
    (ConfigService as any).loaded = false;

    process.env.PORT = "443";
    process.env.ENABLED = "1";
    process.env.APP_NAME = "my-app";
    process.env.API_URL = "https://api.example.com";
    process.env.FRONTEND_PUBLIC_KEY = "pk_live_123";
    process.env.FRONTEND_API_BASE = "/api/v1";

    ConfigService.load();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (ConfigService as any).loaded = false;
    resetEnvs();
  });

  it("coerces @Env bindings into a @Configuration() class resolved via DI", () => {
    const container = new Container();
    container.provide(AppConfig);

    const config = container.resolve<AppConfig>(AppConfig);

    expect(config.port).toBe(443);
    expect(config.enabled).toBe(true);
    expect(config.appName).toBe("my-app");
    expect(config.apiUrl).toBe("https://api.example.com");
  });

  it("skips missing bindings and coerces boolean/number edge cases", () => {
    (ConfigService as any).loaded = false;
    resetEnvs();
    process.env.STRICT_FLAG = "false";
    process.env.NUMERIC_PORT = "not-a-number";
    ConfigService.load();

    const container = new Container();
    container.provide(StrictConfig);
    const config = container.resolve<StrictConfig>(StrictConfig);

    expect(config.flag).toBe(false);
    expect(config.port).toBe("not-a-number");
    expect(config.optional).toBeUndefined();
  });

  it("returns stored values via static get", () => {
    expect(ConfigService.get("APP_NAME")).toBe("my-app");
    expect(ConfigService.get("PORT")).toBe("443");
  });

  it("returns the default when a key is missing", () => {
    (ConfigService as any).loaded = false;
    resetEnvs();
    ConfigService.load();
    expect(ConfigService.get("MISSING_KEY", "fallback")).toBe("fallback");
  });

  it("throws when a key is missing without a default", () => {
    (ConfigService as any).loaded = false;
    resetEnvs();
    ConfigService.load();
    expect(() => ConfigService.get("MISSING_KEY")).toThrow(/is missing/);
  });

  it("static has reports presence", () => {
    expect(ConfigService.has("APP_NAME")).toBe(true);

    (ConfigService as any).loaded = false;
    resetEnvs();
    ConfigService.load();
    expect(ConfigService.has("APP_NAME")).toBe(false);
  });

  it("instance get/has delegate to the static implementation", () => {
    (ConfigService as any).loaded = false;
    resetEnvs();
    ConfigService.load();

    const service = new ConfigService();
    expect(() => service.get("MISSING")).toThrow(/is missing/);
    expect(service.has("MISSING")).toBe(false);
  });

  it("getFrontendEnvs exposes FRONTEND_* vars as import.meta.env entries", () => {
    const envs = ConfigService.getFrontendEnvs();

    expect(envs).toEqual({
      "import.meta.env.FRONTEND_PUBLIC_KEY": '"pk_live_123"',
      "import.meta.env.FRONTEND_API_BASE": '"/api/v1"',
    });
  });

  it("getFrontendEnvMap exposes FRONTEND_* vars as a plain map", () => {
    const envs = ConfigService.getFrontendEnvMap();

    expect(envs).toEqual({
      FRONTEND_PUBLIC_KEY: "pk_live_123",
      FRONTEND_API_BASE: "/api/v1",
    });
  });

  it("exposes the envs snapshot", () => {
    expect(ConfigService.envs.APP_NAME).toBe("my-app");
  });

  it("addLoader registers a custom loader that contributes vars", () => {
    const customLoader = {
      name: "CustomLoader",
      priority: 1,
      load: () => ({ CUSTOM_KEY: "custom-value" }),
    };

    ConfigService.addLoader(customLoader);
    (ConfigService as any).loaded = false;
    ConfigService.load();

    expect(ConfigService.get("CUSTOM_KEY")).toBe("custom-value");
    expect(ConfigService.get("APP_NAME")).toBe("my-app");
  });

  it("is a no-op when already loaded", () => {
    (ConfigService as any).loaded = true;
    ConfigService.load();
    expect(ConfigService.get("APP_NAME")).toBe("my-app");
  });

  it("handles loaders without a priority value", () => {
    const order: string[] = [];
    const noPriority = {
      name: "NoPriority",
      load: () => {
        order.push("np");
        return {};
      },
    };
    const prio = {
      name: "Prio",
      priority: 5,
      load: () => {
        order.push("p");
        return {};
      },
    };

    ConfigService.addLoader(noPriority);
    ConfigService.addLoader(prio);
    (ConfigService as any).loaded = false;
    ConfigService.load();

    expect(order).toEqual(["np", "p"]);
  });

  it("lazily loads before reading frontend envs when not loaded yet", () => {
    (ConfigService as any).loaded = false;
    (ConfigService as any).envStore = {};

    expect(ConfigService.getFrontendEnvMap()).toEqual({
      FRONTEND_PUBLIC_KEY: "pk_live_123",
      FRONTEND_API_BASE: "/api/v1",
    });

    (ConfigService as any).loaded = false;
    (ConfigService as any).envStore = {};

    const envs = ConfigService.getFrontendEnvs();
    expect(envs).toEqual({
      "import.meta.env.FRONTEND_PUBLIC_KEY": '"pk_live_123"',
      "import.meta.env.FRONTEND_API_BASE": '"/api/v1"',
    });
  });

  it("sorts loaders by priority before loading", () => {
    const order: string[] = [];
    const loaderA = {
      name: "LoaderA",
      priority: 2,
      load: () => {
        order.push("A");
        return {};
      },
    };
    const loaderB = {
      name: "LoaderB",
      priority: 1,
      load: () => {
        order.push("B");
        return {};
      },
    };

    ConfigService.addLoader(loaderA);
    ConfigService.addLoader(loaderB);
    (ConfigService as any).loaded = false;
    ConfigService.load();

    expect(order).toEqual(["B", "A"]);
  });

  it("warns and continues when a loader throws", () => {
    const warn = vi.spyOn((ConfigService as any).logger, "warn");

    const brokenLoader = {
      name: "BrokenLoader",
      load: () => {
        throw new Error("boom");
      },
    };

    ConfigService.addLoader(brokenLoader);
    (ConfigService as any).loaded = false;
    ConfigService.load();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Config loader "BrokenLoader" failed: boom'),
    );
    expect(ConfigService.get("APP_NAME")).toBe("my-app");
  });
});