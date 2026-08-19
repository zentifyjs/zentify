import { describe, expect, it } from "vitest";
import { RouteTable } from "../../src/router/route_table";

const route = (method: any, path: string, handler = () => {}) => ({
  method,
  path,
  handler,
  middlewares: [],
  metadata: [],
  controllerInstance: undefined,
});

describe("RouteTable", () => {
  it("finds a static route and returns empty params", () => {
    const table = new RouteTable();
    table.add(route("GET", "/users"));

    const hit = table.find("GET", "/users");
    expect(hit?.route.path).toBe("/users");
    expect(hit?.params).toEqual({});
  });

  it("finds a dynamic route and extracts params", () => {
    const table = new RouteTable();
    table.add(route("GET", "/users/:id"));
    table.add(route("GET", "/users/:id/posts/:postId"));

    const hit = table.find("GET", "/users/42");
    expect(hit?.route.path).toBe("/users/:id");
    expect(hit?.params).toEqual({ id: "42" });

    const multi = table.find("GET", "/users/42/posts/7");
    expect(multi?.params).toEqual({ id: "42", postId: "7" });
  });

  it("is method-sensitive", () => {
    const table = new RouteTable();
    table.add(route("GET", "/users"));

    expect(table.find("POST", "/users")).toBeUndefined();
  });

  it("ignores trailing slashes", () => {
    const table = new RouteTable();
    table.add(route("GET", "/users"));

    expect(table.find("GET", "/users/")?.route.path).toBe("/users");
  });

  it("throws on duplicate static routes", () => {
    const table = new RouteTable();
    table.add(route("GET", "/users"));

    expect(() => table.add(route("GET", "/users"))).toThrow(/Duplicate route/);
  });

  it("throws on duplicate dynamic routes", () => {
    const table = new RouteTable();
    table.add(route("GET", "/users/:id"));

    expect(() => table.add(route("GET", "/users/:name"))).toThrow(
      /Duplicate route/,
    );
  });

  it("allows the same path with different methods", () => {
    const table = new RouteTable();
    table.add(route("GET", "/users"));
    table.add(route("POST", "/users"));

    expect(table.find("GET", "/users")).toBeDefined();
    expect(table.find("POST", "/users")).toBeDefined();
  });

  it("returns all registered routes via all()", () => {
    const table = new RouteTable();
    table.add(route("GET", "/a"));
    table.add(route("POST", "/b"));

    expect(table.all()).toHaveLength(2);
  });

  it("swallows finder errors for static routes (invalid method)", () => {
    const table = new RouteTable();
    expect(() => table.add(route("FOO", "/static-invalid"))).not.toThrow();
    expect(table.all()).toHaveLength(1);
  });

  it("stores a noop handler for dynamic routes", () => {
    const table = new RouteTable();
    table.add(route("GET", "/users/:id"));

    const hit = (table as any).finder.find("GET", "/users/x");
    expect(typeof hit?.handler).toBe("function");
    expect(hit?.handler()).toBeUndefined();
  });
});