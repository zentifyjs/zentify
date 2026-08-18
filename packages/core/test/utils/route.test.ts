import { describe, expect, it } from "vitest";
import { normalizePath } from "../../src/utils/route";

describe("normalizePath", () => {
  it("returns / for empty string, undefined-ish and root", () => {
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("/")).toBe("/");
  });

  it("adds a leading slash", () => {
    expect(normalizePath("users")).toBe("/users");
  });

  it("removes trailing slashes", () => {
    expect(normalizePath("/users/")).toBe("/users");
    expect(normalizePath("/users///")).toBe("/users");
  });

  it("collapses multiple consecutive slashes", () => {
    expect(normalizePath("/users//posts")).toBe("/users/posts");
    expect(normalizePath("//users///posts/")).toBe("/users/posts");
  });

  it("strips the query string", () => {
    expect(normalizePath("/users?name=john")).toBe("/users");
  });

  it("preserves the root when normalization would empty it", () => {
    expect(normalizePath("///")).toBe("/");
  });
});