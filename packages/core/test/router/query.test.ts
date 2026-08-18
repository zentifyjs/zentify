import { describe, expect, it } from "vitest";
import { parseQuery } from "../../src/router/query";

describe("parseQuery", () => {
  it("returns an empty object for an empty search", () => {
    expect(parseQuery("")).toEqual({});
    expect(parseQuery(undefined as unknown as string)).toEqual({});
  });

  it("parses simple key-value pairs", () => {
    expect(parseQuery("name=john&age=25")).toEqual({ name: "john", age: "25" });
  });

  it("returns an array for repeated keys", () => {
    expect(parseQuery("tag=a&tag=b")).toEqual({ tag: ["a", "b"] });
  });

  it("decodes percent-encoded values", () => {
    expect(parseQuery("q=hello%20world")).toEqual({ q: "hello world" });
  });
});