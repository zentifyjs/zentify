import { describe, expect, it } from "vitest";
import { Controller, getControllerMetadata } from "../../src/decorators/controller";
import { Module, getModuleMetadata } from "../../src/decorators/module";
import { Dependency } from "../../src/decorators/dependency";
import { Env, Configuration, getEnvBindings, getRequiredEnvs } from "../../src/decorators/config";
import { Inject } from "../../src/decorators/inject";

describe("Controller decorator", () => {
  it("stores the configured path", () => {
    @Controller({ path: "users" })
    class UsersController {}

    expect(getControllerMetadata(UsersController)?.path).toBe("users");
  });

  it("defaults the path to an empty string", () => {
    @Controller()
    class HomeController {}

    expect(getControllerMetadata(HomeController)?.path).toBe("");
  });

  it("stores the constructor dependency graph", () => {
    @Dependency()
    class Dep {}

    @Dependency()
    @Controller({ path: "x" })
    class ControllerWithDep {
      constructor(public dep: Dep) {}
    }

    const meta = getControllerMetadata(ControllerWithDep);
    expect(meta?.constructorDeps).toBeInstanceOf(Map);
    expect(meta?.constructorDeps.get(ControllerWithDep)).toEqual([Dep]);
  });

  it("returns undefined for undecorated classes", () => {
    class Plain {}
    expect(getControllerMetadata(Plain)).toBeUndefined();
  });
});

describe("Module decorator", () => {
  it("stores the module configuration", () => {
    class C {}
    const config = {
      controllers: [C],
      providers: [C],
      middleware: [{ middlewares: [] }],
    };

    @Module(config)
    class AppModule {}

    expect(getModuleMetadata(AppModule)).toEqual(config);
  });

  it("returns undefined for undecorated classes", () => {
    class Plain {}
    expect(getModuleMetadata(Plain)).toBeUndefined();
  });
});

describe("Env / Configuration decorators", () => {
  class Settings {
    @Env("PORT")
    port!: number;

    @Env("NODE_ENV")
    nodeEnv!: string;
  }

  it("records env bindings per class", () => {
    const bindings = getEnvBindings(Settings);
    expect(bindings).toEqual([
      { key: "PORT", propertyKey: "port" },
      { key: "NODE_ENV", propertyKey: "nodeEnv" },
    ]);
  });

  it("returns an empty list for classes without bindings", () => {
    class Plain {}
    expect(getEnvBindings(Plain)).toEqual([]);
  });

  it("reports required envs with class and property names", () => {
    const required = getRequiredEnvs();
    const ours = required.filter((r) => r.className === "Settings");

    expect(ours).toEqual(
      expect.arrayContaining([
        { key: "PORT", className: "Settings", propertyKey: "port" },
        { key: "NODE_ENV", className: "Settings", propertyKey: "nodeEnv" },
      ]),
    );
  });

  it("Configuration is a valid class decorator", () => {
    @Configuration()
    class ConfigClass {}
    expect(ConfigClass).toBeDefined();
  });
});

describe("Inject decorator", () => {
  const TOKEN = Symbol("TOKEN");

  it("stores a custom token per parameter index", () => {
    class NeedsToken {
      constructor(@Inject(TOKEN) public value: unknown) {}
    }

    const injects = Reflect.getMetadata("zentify:inject", NeedsToken);
    expect(injects).toEqual({ 0: TOKEN });
  });
});