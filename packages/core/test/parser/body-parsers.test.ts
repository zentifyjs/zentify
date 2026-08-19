import { describe, expect, it } from "vitest";
import { Readable } from "node:stream";
import { JsonBodyParser } from "../../src/parser/json";
import { UrlEncodedBodyParser } from "../../src/parser/urlencoded";
import { TextBodyParser } from "../../src/parser/text";
import { readBody } from "../../src/parser/read_body";
import { HttpException } from "../../src/exception/http";

function makeRequest(body: Buffer | string, method = "POST") {
  const stream = Readable.from(
    Buffer.isBuffer(body) ? [body] : [Buffer.from(body)],
  );
  return Object.assign(stream, {
    method,
    headers: { "content-type": "application/json" },
  }) as any;
}

describe("JsonBodyParser", () => {
  const parser = new JsonBodyParser(1024);

  it("supports application/json content types", () => {
    expect(parser.supports("application/json")).toBe(true);
    expect(parser.supports("Application/JSON; charset=utf-8")).toBe(true);
    expect(parser.supports("text/plain")).toBe(false);
  });

  it("parses a valid JSON body", async () => {
    const result = await parser.parse(makeRequest('{"name":"raja","age":25}'));
    expect(result).toEqual({ name: "raja", age: 25 });
  });

  it("returns undefined for an empty body", async () => {
    expect(await parser.parse(makeRequest(""))).toBeUndefined();
  });

  it("throws a 400 HttpException on invalid JSON", async () => {
    const promise = parser.parse(makeRequest("{not valid json"));

    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await expect(promise).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("UrlEncodedBodyParser", () => {
  const parser = new UrlEncodedBodyParser(1024);

  it("supports x-www-form-urlencoded content types", () => {
    expect(parser.supports("application/x-www-form-urlencoded")).toBe(true);
    expect(parser.supports("application/x-www-form-urlencoded; charset=utf-8")).toBe(true);
    expect(parser.supports("application/json")).toBe(false);
  });

  it("parses url-encoded fields", async () => {
    const result = await parser.parse(
      makeRequest("name=raja&role=admin"),
    );
    expect(result).toEqual({ name: "raja", role: "admin" });
  });

  it("returns an empty object for an empty body", async () => {
    expect(await parser.parse(makeRequest(""))).toEqual({});
  });
});

describe("TextBodyParser", () => {
  const parser = new TextBodyParser(1024);

  it("supports text/plain content types", () => {
    expect(parser.supports("text/plain")).toBe(true);
    expect(parser.supports("text/plain; charset=utf-8")).toBe(true);
    expect(parser.supports("application/json")).toBe(false);
  });

  it("returns the raw string body", async () => {
    expect(await parser.parse(makeRequest("hello world"))).toBe("hello world");
  });
});

describe("readBody", () => {
  it("concatenates chunks in order", async () => {
    const stream = Readable.from([Buffer.from("ab"), Buffer.from("cd")]);
    const buffer = await readBody(stream as any, 1024);
    expect(buffer.toString()).toBe("abcd");
  });

  it("normalizes non-Buffer string chunks", async () => {
    const stream = Readable.from(["ab", "cd"]);
    const buffer = await readBody(stream as any, 1024);
    expect(buffer.toString()).toBe("abcd");
  });

  it("throws a 413 HttpException when the size limit is exceeded", async () => {
    const stream = Readable.from([Buffer.alloc(100)]);
    const promise = readBody(stream as any, 50);

    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await expect(promise).rejects.toMatchObject({ statusCode: 413 });
  });
});