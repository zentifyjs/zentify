import { describe, expect, it } from "vitest";
import {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from "../../src/exception/http";

describe("HttpException", () => {
  it("stores message, statusCode and details", () => {
    const err = new HttpException({
      message: "too many requests",
      statusCode: 429,
      details: { retryAfter: 5 },
    });

    expect(err.message).toBe("too many requests");
    expect(err.statusCode).toBe(429);
    expect(err.details).toEqual({ retryAfter: 5 });
    expect(err.name).toBe("HttpException");
  });

  it("constructs without details", () => {
    const err = new HttpException({ message: "boom", statusCode: 500 });
    expect(err.details).toBeUndefined();
  });
});

describe("built-in exceptions", () => {
  const cases = [
    [BadRequestException, 400, "Bad Request"],
    [UnauthorizedException, 401, "Unauthorized"],
    [ForbiddenException, 403, "Forbidden"],
    [NotFoundException, 404, "Not Found"],
    [InternalServerErrorException, 500, "Internal Server Error"],
  ] as const;

  it.each(cases)(
    "%s maps to status %i with default message",
    (ExceptionClass, status, message) => {
      const err = new ExceptionClass();
      expect(err).toBeInstanceOf(HttpException);
      expect(err.statusCode).toBe(status);
      expect(err.message).toBe(message);
    },
  );

  it("accepts a custom message and details", () => {
    const err = new NotFoundException("User not found", { key: "user-1" });
    expect(err.message).toBe("User not found");
    expect(err.details).toEqual({ key: "user-1" });
  });
});