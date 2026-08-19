import { beforeAll, describe, expect, it } from "vitest";
import { Container } from "../../src/dependencies/container";
import { ConfigService } from "../../src/adapters/config/config.service";
import { Env } from "../../src/decorators/config";
import { Dependency } from "../../src/decorators/dependency";

@Dependency()
class Leaf {
  greet() {
    return "leaf";
  }
}

@Dependency()
class Branch {
  constructor(public readonly leaf: Leaf) {}
}

@Dependency()
class Trunk {
  constructor(public readonly branch: Branch) {}
}

const VALUE_TOKEN = Symbol("VALUE_TOKEN");
const FACTORY_TOKEN = Symbol("FACTORY_TOKEN");

class BaseService {}
class ImplService extends BaseService {
  hello = "impl";
}

@Dependency()
class UsesCustomToken {
  constructor(public readonly value: unknown) {}
}
Reflect.defineMetadata("zentify:inject", { 0: VALUE_TOKEN }, UsesCustomToken);

class EnvConfig {
  @Env("PORT")
  port!: number;

  @Env("ENABLED")
  enabled!: boolean;

  @Env("APP_NAME")
  appName!: string;
}

class NotProvided {}

describe("Container", () => {
  it("resolves nested classes via design:paramtypes", () => {
    const container = new Container();
    const trunk = container.resolve(Trunk);

    expect(trunk).toBeInstanceOf(Trunk);
    expect(trunk.branch).toBeInstanceOf(Branch);
    expect(trunk.branch.leaf).toBeInstanceOf(Leaf);
    expect(trunk.branch.leaf.greet()).toBe("leaf");
  });

  it("caches instances as singletons", () => {
    const container = new Container();
    const a = container.resolve(Trunk);
    const b = container.resolve(Trunk);

    expect(a).toBe(b);
    expect(a.branch).toBe(b.branch);
  });

  it("supports useValue providers", () => {
    const container = new Container();
    container.provide({ token: VALUE_TOKEN, useValue: { ok: true } });

    const value = container.resolve(VALUE_TOKEN);
    expect(value).toEqual({ ok: true });
  });

  it("supports useFactory providers with the container", () => {
    const container = new Container();
    container.provide({
      token: FACTORY_TOKEN,
      useFactory: (c) => ({ from: c instanceof Container }),
    });

    expect(container.resolve(FACTORY_TOKEN)).toEqual({ from: true });
  });

  it("supports useClass providers", () => {
    const container = new Container();
    container.provide({ token: BaseService, useClass: ImplService });

    expect(container.resolve(BaseService)).toBeInstanceOf(ImplService);
  });

  it("supports plain function providers", () => {
    const container = new Container();
    container.provide(Leaf);

    expect(container.resolve(Leaf)).toBeInstanceOf(Leaf);
  });

  it("returns undefined for providers without a recognizable shape", () => {
    const container = new Container();
    container.provide({ token: "shapeless", foo: 1 } as any);

    expect(container.resolve("shapeless")).toBeUndefined();
  });

  it("has reports providers and resolved instances", () => {
    const container = new Container();
    container.provide(Leaf);

    expect(container.has(Leaf)).toBe(true);
    container.resolve(Leaf);
    expect(container.has(Leaf)).toBe(true);
    expect(container.has(NotProvided)).toBe(false);
  });

  it("throws for unresolvable non-function tokens", () => {
    const container = new Container();
    expect(() => container.resolve("missing-token")).toThrow(
      /Cannot resolve dependency for token: missing-token/,
    );
  });

  it("throws a descriptive error when a param type is unusable", () => {
    class BrokenDep {
      constructor(public value: number) {}
    }
    Reflect.defineMetadata("design:paramtypes", [42], BrokenDep);

    const container = new Container();
    expect(() => container.resolve(BrokenDep)).toThrow(/Cannot resolve dependency/);
    expect(() => container.resolve(BrokenDep)).toThrow(/at index 0/);
  });

  it("labels symbol tokens in circular chain messages", () => {
    const SYM_TOKEN = Symbol("SYM_TOKEN");

    class UsesSym {
      constructor(public value: unknown) {}
    }
    class NeedsUsesSym {
      constructor(public usesSym: unknown) {}
    }

    Reflect.defineMetadata("design:paramtypes", [SYM_TOKEN], UsesSym);
    Reflect.defineMetadata("design:paramtypes", [UsesSym], NeedsUsesSym);

    const container = new Container();
    container.provide({ token: SYM_TOKEN, useClass: NeedsUsesSym });

    expect(() => container.resolve(UsesSym)).toThrow(/Circular dependency detected/);
  });

  it("labels anonymous function tokens in circular chain messages", () => {
    const anonToken = Object.defineProperty(function () {}, "name", { value: "" });

    class UsesAnon {
      constructor(public value: unknown) {}
    }
    class NeedsUsesAnon {
      constructor(public usesAnon: unknown) {}
    }

    Reflect.defineMetadata("design:paramtypes", [anonToken], UsesAnon);
    Reflect.defineMetadata("design:paramtypes", [UsesAnon], NeedsUsesAnon);

    const container = new Container();
    container.provide({ token: anonToken, useClass: NeedsUsesAnon });

    expect(() => container.resolve(UsesAnon)).toThrow(
      /Circular dependency detected/,
    );
  });

  it("resolves custom @Inject tokens", () => {
    const container = new Container();
    container.provide({ token: VALUE_TOKEN, useValue: "injected-value" });

    const instance = container.resolve(UsesCustomToken);
    expect(instance.value).toBe("injected-value");
  });

  it("throws when a dependency is not provided in the Module scope", () => {
    const container = new Container();
    const allowed = new Set([Leaf]);

    expect(() => container.resolve(Branch, allowed)).toThrow(
      /Dependency Branch is not provided/,
    );
  });

  it("throws when the requested token is not in the Module scope", () => {
    const container = new Container();
    container.provide(Leaf);
    const allowed = new Set([NotProvided]);

    expect(() => container.resolve(Leaf, allowed)).toThrow(
      /not provided in the Module/,
    );
  });

  it("enforces the Module scope check through the whole dependency tree", () => {
    const container = new Container();
    const allowed = new Set([Leaf, Branch, Trunk]);

    const trunk = container.resolve(Trunk, allowed);
    expect(trunk.branch.leaf).toBeInstanceOf(Leaf);
  });
});

describe("Container + Env binding", () => {
  beforeAll(() => {
    process.env.PORT = "8080";
    process.env.ENABLED = "true";
    process.env.APP_NAME = "zentify";
    ConfigService.load();
  });

  it("injects and coerces @Env properties", () => {
    const container = new Container();
    const config = container.resolve(EnvConfig);

    expect(config.port).toBe(8080);
    expect(config.enabled).toBe(true);
    expect(config.appName).toBe("zentify");
  });
});