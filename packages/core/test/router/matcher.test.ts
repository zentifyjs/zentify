import { describe, expect, it } from "vitest";
import { matchMiddlewarePath } from "../../src/router/matcher";

describe("matchMiddlewarePath", () => {
  it("matches an exact path", () => {
    expect(matchMiddlewarePath("/admin", "/admin")).toBe(true);
    expect(matchMiddlewarePath("/admin/dashboard", "/admin")).toBe(false);
  });

  it("matches wildcard paths", () => {
    expect(matchMiddlewarePath("/admin/users", "/admin/*")).toBe(true);
    expect(matchMiddlewarePath("/admin", "/admin/*")).toBe(false);
    expect(matchMiddlewarePath("/api/v1/posts/1", "/api/v1/*")).toBe(true);
  });

  it("matches the root wildcard", () => {
    expect(matchMiddlewarePath("/", "/*")).toBe(true);
    expect(matchMiddlewarePath("/about", "/*")).toBe(true);
  });
});