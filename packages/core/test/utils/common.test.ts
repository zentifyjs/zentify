import { describe, expect, it } from "vitest";
import { isDtoClass, assertDtoClass } from "../../src/utils";

class ValidDto {
  static schema = {};
}

class NotDto {}

function notAclass() {}

describe("isDtoClass", () => {
  it("returns true for classes with a static schema", () => {
    expect(isDtoClass(ValidDto)).toBe(true);
  });

  it("returns false for classes without a schema", () => {
    expect(isDtoClass(NotDto)).toBe(false);
  });

  it("returns false for non-function values", () => {
    expect(isDtoClass(null)).toBe(false);
    expect(isDtoClass(undefined)).toBe(false);
    expect(isDtoClass({})).toBe(false);
    expect(isDtoClass("class")).toBe(false);
    expect(isDtoClass(42)).toBe(false);
  });

  it("returns false when schema is not an object", () => {
    class StringSchema {
      static schema = "nope";
    }
    class NullSchema {
      static schema = null;
    }
    expect(isDtoClass(StringSchema)).toBe(false);
    expect(isDtoClass(NullSchema)).toBe(false);
  });
});

describe("assertDtoClass", () => {
  it("does not throw for valid DTO classes", () => {
    expect(() =>
      assertDtoClass(ValidDto, { constructor: { name: "Ctrl" } }, "handler", 0),
    ).not.toThrow();
  });

  it("throws a descriptive error for invalid DTO classes", () => {
    expect(() =>
      assertDtoClass(NotDto, { constructor: { name: "UserController" } }, "create", 1),
    ).toThrow(/Invalid @Body\(\) parameter in UserController\.create\(\)/);
    expect(() =>
      assertDtoClass(NotDto, { constructor: { name: "UserController" } }, "create", 1),
    ).toThrow(/Parameter #1 has type 'NotDto'/);
  });

  it("handles non-function dtoClass values", () => {
    expect(() =>
      assertDtoClass(undefined, { constructor: { name: "C" } }, "m", 0),
    ).toThrow(/has type 'undefined'/);
  });

  it("does not require the function to be named", () => {
    expect(() =>
      assertDtoClass(notAclass, { constructor: { name: "C" } }, "m", 0),
    ).toThrow(/has type 'notAclass'/);
  });
});