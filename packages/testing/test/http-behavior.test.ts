import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  render,
  redirect,
  type Middleware,
} from "@zentify/core";
import * as v from "valibot";
import { createTestApp, type CreateTestAppOptions, type TestApp } from "../src";

let app: TestApp | undefined;

async function launch(options: CreateTestAppOptions): Promise<TestApp> {
  app = await createTestApp(options);
  return app;
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

@Controller({ path: "hello" })
class HelloController {
  @Get()
  index() {
    return { hello: "world" };
  }
}

@Controller({ path: "users" })
class UsersController {
  @Get(":id")
  show(@Param("id") id: string, @Query() query: unknown) {
    return { id, query };
  }
}

class CreateUserDto {
  static schema = v.object({ name: v.string() });
  name!: string;
}

@Controller({ path: "create" })
class CreateController {
  @Post()
  create(@Body() body: CreateUserDto) {
    return { created: body };
  }
}

const order: string[] = [];

class FirstMiddleware implements Middleware {
  async handle(_req: any, _res: any, next: () => Promise<void>) {
    order.push("m1");
    await next();
    order.push("m1-after");
  }
}

class SecondMiddleware implements Middleware {
  async handle(_req: any, _res: any, next: () => Promise<void>) {
    order.push("m2");
    await next();
    order.push("m2-after");
  }
}

@Controller({ path: "http" })
class HttpController {
  @Get("/order")
  order() {
    order.push("handler");
    return { order: [...order] };
  }

  @Get("/twice", createDoubleNext())
  twice() {
    return { ok: true };
  }
}

function createDoubleNext(): Middleware[] {
  class DoubleNextMiddleware implements Middleware {
    async handle(_req: any, _res: any, next: () => Promise<void>) {
      next();
      await next();
    }
  }
  return [new DoubleNextMiddleware()];
}

@Controller({ path: "err" })
class ErrController {
  @Get()
  boom() {
    throw new Error("boom");
  }
}

@Controller({ path: "nf" })
class NotFoundController {
  @Get(":id")
  show() {
    throw new NotFoundException("missing");
  }
}

@Controller({ path: "go" })
class GoController {
  @Get()
  go() {
    return redirect("/target");
  }
}

@Controller({ path: "page" })
class PageController {
  @Get()
  index() {
    return render("Home", { title: "Zentify" });
  }
}

describe("HTTP behavior", () => {
  it("returns plain objects as JSON with 200", async () => {
    const a = await launch({ controllers: [HelloController] });
    const res = await fetch(`${a.url}/hello`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hello: "world" });
  });

  it("binds params and query into handler args", async () => {
    const a = await launch({ controllers: [UsersController] });
    const res = await fetch(`${a.url}/users/42?x=1&tag=a&tag=b`);

    expect(await res.json()).toEqual({
      id: "42",
      query: { x: "1", tag: ["a", "b"] },
    });
  });

  it("validates a valid DTO body", async () => {
    const a = await launch({ controllers: [CreateController] });
    const res = await fetch(`${a.url}/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "raja" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ created: { name: "raja" } });
  });

  it("rejects an invalid DTO body with 422", async () => {
    const a = await launch({ controllers: [CreateController] });
    const res = await fetch(`${a.url}/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: 123 }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.message).toBe("Invalid request body");
    expect(Array.isArray(body.details)).toBe(true);
  });

  it("runs middlewares in order with next()", async () => {
    order.length = 0;
    const a = await launch({
      controllers: [HttpController],
      middleware: [
        {
          middlewares: [new FirstMiddleware(), new SecondMiddleware()],
        },
      ],
    });

    const res = await fetch(`${a.url}/http/order`);

    expect(await res.json()).toEqual({ order: ["m1", "m2", "handler"] });
    expect(order).toEqual(["m1", "m2", "handler", "m2-after", "m1-after"]);
  });

  it("survives a double next() call without crashing", async () => {
    const a = await launch({ controllers: [HttpController] });
    const res = await fetch(`${a.url}/http/twice`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("maps HttpExceptions to their status code", async () => {
    const a = await launch({ controllers: [NotFoundController] });
    const res = await fetch(`${a.url}/nf/1`);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "missing" });
  });

  it("maps unknown errors to 500", async () => {
    const a = await launch({ controllers: [ErrController] });
    const res = await fetch(`${a.url}/err`);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Internal Server Error" });
  });

  it("responds to redirects with the Location header", async () => {
    const a = await launch({ controllers: [GoController] });
    const res = await fetch(`${a.url}/go`, { redirect: "manual" });

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/target");
  });

  it("returns 404 for unknown routes", async () => {
    const a = await launch({ controllers: [HelloController] });
    const res = await fetch(`${a.url}/no-such-route`);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "Route not found" });
  });

  it("renders views through an adapter view engine", async () => {
    const engine = vi.fn((_page: string, props: any, _req: any, res: any) => {
      res.setHeader("content-type", "text/html");
      res.end(`<h1>${props.title}</h1>`);
    });
    const a = await launch({
      controllers: [PageController],
      adapters: [{ name: "test-view", getViewEngine: () => ({ render: engine }) }],
    });

    const res = await fetch(`${a.url}/page`);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("<h1>Zentify</h1>");
    expect(engine).toHaveBeenCalledWith(
      "Home",
      { title: "Zentify" },
      expect.anything(),
      expect.anything(),
    );
  });

  it("responds 500 when a view is returned without an engine", async () => {
    const a = await launch({ controllers: [PageController] });
    const res = await fetch(`${a.url}/page`);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Internal Server Error" });
  });
});