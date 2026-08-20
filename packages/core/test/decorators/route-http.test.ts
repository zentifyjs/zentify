import { describe, expect, it, vi } from "vitest";
import {
  Get,
  Post,
  Put,
  Patch,
  Delete,
  getRouteMetadata,
} from "../../src/decorators/route_http";
import type { Middleware } from "../../src/types/middleware";

class Mw implements Middleware {
  async handle(_ctx: any, next: () => Promise<void>) {
    await next();
  }
}

describe("HTTP verb decorators", () => {
  it("registers a GET route with defaults", () => {
    class C {
      @Get()
      index() {}
    }
    expect(getRouteMetadata(C.prototype).get("index")).toEqual({
      method: "GET",
      path: "/",
      middlewares: [],
    });
  });

  it("registers each verb with its path", () => {
    class C {
      @Get("/a")
      a() {}

      @Post("/b")
      b() {}

      @Put("/c")
      c() {}

      @Patch("/d")
      d() {}

      @Delete("/e")
      e() {}
    }

    const meta = getRouteMetadata(C.prototype);
    expect(meta.get("a")).toMatchObject({ method: "GET", path: "/a" });
    expect(meta.get("b")).toMatchObject({ method: "POST", path: "/b" });
    expect(meta.get("c")).toMatchObject({ method: "PUT", path: "/c" });
    expect(meta.get("d")).toMatchObject({ method: "PATCH", path: "/d" });
    expect(meta.get("e")).toMatchObject({ method: "DELETE", path: "/e" });
  });

  it("stores route-level middlewares", () => {
    const mw = new Mw();
    class C {
      @Get("/admin", [mw])
      admin() {}
    }
    expect(getRouteMetadata(C.prototype).get("admin")?.middlewares).toEqual([
      mw,
    ]);
  });

  it("returns an empty map for undecorated prototypes", () => {
    class C {
      index() {}
    }
    expect(getRouteMetadata(C.prototype).size).toBe(0);
  });

  it("does not let a route decorator change the handler behavior", () => {
    const handler = vi.fn();
    class C {
      @Get("/x")
      x() {
        handler();
      }
    }
    const instance = new C();
    instance.x();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});