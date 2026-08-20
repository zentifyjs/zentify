import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Route } from "../../src/router/route";
import { Container } from "../../src/dependencies/container";
import { Controller } from "../../src/decorators/controller";
import { Get, Post } from "../../src/decorators/route_http";
import { Module } from "../../src/decorators/module";
import type { Middleware } from "../../src/types/middleware";

class GlobalMw implements Middleware {
  async handle(_ctx: any, next: () => Promise<void>) {
    await next();
  }
}

class RouteMw implements Middleware {
  async handle(_ctx: any, next: () => Promise<void>) {
    await next();
  }
}

class GroupMw implements Middleware {
  async handle(_ctx: any, next: () => Promise<void>) {
    await next();
  }
}

class SharedMw implements Middleware {
  async handle(_ctx: any, next: () => Promise<void>) {
    await next();
  }
}

class AuthMw implements Middleware {
  async handle(_ctx: any, next: () => Promise<void>) {
    await next();
  }
}

const handler = () => "ok";

describe("Route registration", () => {
  beforeEach(() => {
    Route.reset();
  });

  afterEach(() => {
    Route.reset();
  });

  it.each(["get", "post", "put", "delete"] as const)(
    "registers a %s route via the shorthand",
    (verb) => {
      Route[verb]("/items", handler);

      const routes = Route.getRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0]).toMatchObject({
        method: verb.toUpperCase(),
        path: "/items",
      });
    },
  );

  it("normalizes registered paths", () => {
    Route.get("users//", handler);
    expect(Route.hasRoute("GET", "/users")).toBe(true);
  });

  it("supports dynamic path segments", () => {
    Route.get("/users/:id", handler);
    const match = Route.getRoute("GET", "/users/42", "");
    expect(match?.params).toEqual({ id: "42" });
  });

  it("parses the query string when matching a route", () => {
    Route.get("/search", handler);
    const match = Route.getRoute("GET", "/search", "q=zentify&page=2");
    expect(match?.query).toEqual({ q: "zentify", page: "2" });
  });

  it("returns undefined when no route matches", () => {
    Route.get("/users", handler);
    expect(Route.getRoute("GET", "/nope", "")).toBeUndefined();
    expect(Route.getRoute("POST", "/users", "")).toBeUndefined();
  });

  it("throws on duplicate static routes", () => {
    Route.get("/dup", handler);
    expect(() => Route.get("/dup", handler)).toThrow(/Duplicate route/);
  });

  it("throws on duplicate dynamic routes", () => {
    Route.get("/users/:id", handler);
    expect(() => Route.get("/users/:id", handler)).toThrow(/Duplicate route/);
  });

  it("detects duplicate middlewares across route + group", () => {
    const middleware = new SharedMw();
    expect(() => {
      Route.group("/admin", () => {
        Route.get("/x", handler, [middleware]);
      }, [middleware]);
    }).toThrow(/Duplicate middleware "SharedMw"/);
  });

  it("accepts function-form middlewares", () => {
    const fnMw = async (_ctx: any, next: () => Promise<void>) => {
      await next();
    };

    Route.get("/fn", handler, [fnMw]);

    const route = Route.getRoutes()[0];
    expect(route.middlewares[0]).toBe(fnMw);
  });

  it("throws on duplicate anonymous middlewares", () => {
    const anonymous = Object.defineProperty(
      async (_ctx: any, next: () => Promise<void>) => {
        await next();
      },
      "name",
      { value: "" },
    );

    Route.get("/anon", handler, [anonymous]);
    expect(() => Route.get("/anon2", handler, [anonymous])).not.toThrow();

    expect(() => {
      Route.group("/x", () => {
        Route.get("/y", handler, [anonymous]);
      }, [anonymous]);
    }).toThrow(/Duplicate middleware "AnonymousMiddleware"/);
  });
});

describe("Route.group and Route.use", () => {
  beforeEach(() => Route.reset());
  afterEach(() => Route.reset());

  it("applies a prefix to routes registered in a group", () => {
    Route.group("/api", () => {
      Route.get("/users", handler);
    });

    expect(Route.hasRoute("GET", "/api/users")).toBe(true);
  });

  it("applies group middlewares to routes", () => {
    const middleware = new GroupMw();
    Route.group("/api", () => {
      Route.get("/users", handler);
    }, [middleware]);

    const [route] = Route.getRoutes();
    expect(route.middlewares).toContain(middleware);
  });

  it("does not leak prefix or middlewares outside the group", () => {
    const middleware = new GroupMw();
    Route.group("/api", () => {
      Route.get("/inside", handler);
    }, [middleware]);
    Route.get("/outside", handler);

    const routes = Route.getRoutes();
    expect(routes[0].path).toBe("/api/inside");
    expect(routes[1].path).toBe("/outside");
    expect(routes[1].middlewares).toHaveLength(0);
  });

  it("supports nested groups", () => {
    Route.group("/api", () => {
      Route.group("/v1", () => {
        Route.get("/ping", handler);
      });
    });

    expect(Route.hasRoute("GET", "/api/v1/ping")).toBe(true);
  });

  it("Route.use registers global middlewares applied to every route", () => {
    const middleware = new GlobalMw();
    Route.use(middleware);
    Route.get("/x", handler);

    const [route] = Route.getRoutes();
    expect(Route.resolveMiddlewares(route)).toEqual([middleware]);
  });

  it("combines global and route-level middlewares", () => {
    Route.use(new GlobalMw());
    Route.get("/x", handler, [new RouteMw()]);

    const [route] = Route.getRoutes();
    expect(Route.resolveMiddlewares(route).map((m) => m.constructor.name)).toEqual([
      "GlobalMw",
      "RouteMw",
    ]);
  });
});

describe("Route controller registration", () => {
  beforeEach(() => {
    Route.reset();
    Route.setContainer(new Container());
  });

  afterEach(() => Route.reset());

  it("resolves a controller instance and exposes route metadata", () => {
    @Controller({ path: "users" })
    class UsersController {
      @Get("/list")
      list() {}

      @Post("/create")
      create() {}
    }

    Route.addRoute("GET", "/users/list", [UsersController, "list"], []);

    const match = Route.getRoute("GET", "/users/list", "");
    expect(match?.route).toBeDefined();
    expect(match?.route.controllerInstance).toBeInstanceOf(UsersController);
    expect(match?.route.path).toBe("/users/list");
  });

  it("throws when no container is set", () => {
    Route.reset();

    class Lone {}

    expect(() =>
      Route.addRoute("GET", "/lone", [Lone, "handler"], []),
    ).toThrow(/Container is not initialized/);
  });
});

describe("Route.module and resolveModules", () => {
  beforeEach(() => {
    Route.reset();
    Route.setContainer(new Container());
  });

  afterEach(() => Route.reset());

  it("registers modules and exposes them", () => {
    class EmptyModule {}

    Route.module(EmptyModule);
    expect(Route.registeredModules).toEqual([EmptyModule]);
  });

  it("tolerates modules without metadata and adapters without hooks", () => {
    class BareModule {}

    Route.module(BareModule);
    expect(() => Route.resolveModules([{}])).not.toThrow();

    expect(Route.getRoutes()).toHaveLength(0);
  });

  it("passes an empty metadata object to adapters for undecorated modules", () => {
    class Undecorated {}

    Route.module(Undecorated);
    const seen: any[] = [];
    Route.resolveModules([
      {
        onModuleResolve(metadata: any) {
          seen.push(metadata);
        },
      },
    ]);

    expect(seen).toEqual([{}]);
  });

  it("resolves a controller class passed as the class (not an instance)", () => {
    @Controller({ path: "raw" })
    class RawController {
      @Get("/hit")
      hit() {}
    }

    (Route as any).controller(RawController, []);

    expect(Route.hasRoute("GET", "/raw/hit")).toBe(true);
  });

  it("registers controllers without a @Controller path using an empty prefix", () => {
    class BareController {
      @Get("/bare")
      bare() {}
    }

    (Route as any).controller(BareController, []);

    expect(Route.hasRoute("GET", "/bare")).toBe(true);
  });

  it("resolves modules with controllers into routes", () => {
    @Controller({ path: "home" })
    class HomeController {
      @Get("/")
      index() {
        return "home";
      }
    }

    @Module({ controllers: [HomeController] })
    class HomeModule {}

    Route.module(HomeModule);
    Route.resolveModules();

    expect(Route.hasRoute("GET", "/home")).toBe(true);
    expect(Route.registeredModules).toEqual([HomeModule]);
  });

  it("passes module metadata to adapters with an onModuleResolve hook", () => {
    const seen: any[] = [];

    @Controller({ path: "a" })
    class CtrlA {
      @Get("/x")
      x() {}
    }

    @Module({ controllers: [CtrlA] })
    class ModuleA {}

    Route.module(ModuleA);
    Route.resolveModules([
      {
        onModuleResolve(metadata: any, providers: any, container: any) {
          seen.push({ metadata, providers, container });
        },
      },
    ]);

    expect(seen).toHaveLength(1);
    expect(seen[0].metadata.controllers).toEqual([CtrlA]);
    expect(seen[0].providers).toBeInstanceOf(Set);
    expect(seen[0].container).toBeInstanceOf(Container);
  });

  it("handles modules with middleware and route exclusions", () => {
    @Controller({ path: "http" })
    class HttpController {
      @Get("/public")
      publicHandler() {}

      @Get("/admin")
      adminHandler() {}
    }

    @Module({
      controllers: [HttpController],
      middleware: [
        {
          middlewares: [new AuthMw()],
          excludeRoutes: [{ path: "/http/*", method: "GET" }],
        },
      ],
    })
    class HttpModule {}

    Route.module(HttpModule);
    Route.resolveModules();

    const routes = Route.getRoutes();
    const publicRoute = routes.find((r) => r.path === "/http/public");
    const adminRoute = routes.find((r) => r.path === "/http/admin");

    expect(publicRoute?.middlewares).toHaveLength(0);
    expect(adminRoute?.middlewares).toHaveLength(0);
  });

  it("applies module middleware to included routes only", () => {
    @Controller({ path: "shop" })
    class ShopController {
      @Get("/free")
      freeHandler() {}

      @Get("/vip")
      vipHandler() {}
    }

    @Module({
      controllers: [ShopController],
      middleware: [
        {
          middlewares: [new AuthMw()],
          includeRoutes: [{ path: "/shop/vip", method: "GET" }],
        },
      ],
    })
    class ShopModule {}

    Route.module(ShopModule);
    Route.resolveModules();

    const routes = Route.getRoutes();
    const free = routes.find((r) => r.path === "/shop/free");
    const vip = routes.find((r) => r.path === "/shop/vip");

    expect(free?.middlewares).toHaveLength(0);
    expect(vip?.middlewares).toHaveLength(1);
    expect(vip?.middlewares[0]).toBeInstanceOf(AuthMw);
  });

  it("applies module middleware to every route when includeRoutes is empty", () => {
    @Controller({ path: "docs" })
    class DocsController {
      @Get("/guide")
      guideHandler() {}
    }

    @Module({
      controllers: [DocsController],
      middleware: [
        {
          middlewares: [new AuthMw()],
          includeRoutes: [],
        },
      ],
    })
    class DocsModule {}

    Route.module(DocsModule);
    Route.resolveModules();

    const route = Route.getRoutes().find((r) => r.path === "/docs/guide");
    expect(route?.middlewares).toHaveLength(1);
    expect(route?.middlewares[0]).toBeInstanceOf(AuthMw);
  });
});