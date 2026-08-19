import { describe, expect, it } from "vitest";
import { HttpContext } from "../../src/utils/http-context";

const fakeCtx = { req: {} as any, res: {} as any };

describe("HttpContext", () => {
  it("provides the store inside run", () => {
    let seen: any;
    HttpContext.run(fakeCtx, () => {
      seen = HttpContext.current();
    });

    expect(seen).toBe(fakeCtx);
  });

  it("has() reflects an active store", () => {
    expect(HttpContext.has()).toBe(false);

    HttpContext.run(fakeCtx, () => {
      expect(HttpContext.has()).toBe(true);
    });

    expect(HttpContext.has()).toBe(false);
  });

  it("propagates through async/await", async () => {
    let seen: any;
    await HttpContext.run(fakeCtx, async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      seen = HttpContext.current();
    });

    expect(seen).toBe(fakeCtx);
  });

  it("throws when accessed outside a request", () => {
    expect(() => HttpContext.current()).toThrow(
      /No active HTTP request context/,
    );
  });
});