import { describe, expect, it } from "vitest";
import { getBodyParser } from "../../src/constants/parser";
import { JsonBodyParser } from "../../src/parser/json";
import { UrlEncodedBodyParser } from "../../src/parser/urlencoded";
import { TextBodyParser } from "../../src/parser/text";
import { MultipartParser } from "../../src/parser/multipart";

describe("getBodyParser", () => {
  it("returns undefined when contentType is missing", () => {
    expect(getBodyParser(undefined, 1024)).toBeUndefined();
    expect(getBodyParser("", 1024)).toBeUndefined();
  });

  it("returns undefined for unknown content types", () => {
    expect(getBodyParser("application/xml", 1024)).toBeUndefined();
    expect(getBodyParser("text/html", 1024)).toBeUndefined();
  });

  it("returns a JsonBodyParser for application/json", () => {
    const parser = getBodyParser("application/json", 2048);
    expect(parser).toBeInstanceOf(JsonBodyParser);
  });

  it("returns a UrlEncodedBodyParser for urlencoded", () => {
    const parser = getBodyParser("application/x-www-form-urlencoded", 2048);
    expect(parser).toBeInstanceOf(UrlEncodedBodyParser);
  });

  it("returns a TextBodyParser for text/plain", () => {
    const parser = getBodyParser("text/plain", 2048);
    expect(parser).toBeInstanceOf(TextBodyParser);
  });

  it("returns a MultipartParser for multipart/form-data", () => {
    const parser = getBodyParser("multipart/form-data", 2048);
    expect(parser).toBeInstanceOf(MultipartParser);
  });

  it("matches case-insensitively and ignores parameters", () => {
    const parser = getBodyParser(
      "MULTIPART/FORM-DATA; boundary=----xyz",
      2048,
    );
    expect(parser).toBeInstanceOf(MultipartParser);
  });

  it("creates a fresh instance on every call", () => {
    const a = getBodyParser("application/json", 1024);
    const b = getBodyParser("application/json", 1024);
    expect(a).toBeInstanceOf(JsonBodyParser);
    expect(a).not.toBe(b);
  });
});