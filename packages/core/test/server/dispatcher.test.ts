import { describe, expect, it } from "vitest";
import { RequestDispatcher } from "../../src/server/dispatcher";
import { ResponseHandler } from "../../src/server/response";
import { Container } from "../../src/dependencies";
import type {
  ZentifyAdapter,
  ZentifyArgumentResolver,
} from "../../src/types/adapter";

function makeDispatcher(adapters: ZentifyAdapter[] = []) {
  const responseHandler = new ResponseHandler([]);
  const container = new Container();
  return {
    dispatcher: new RequestDispatcher(responseHandler, container, adapters),
    container,
  };
}

function makeReq(overrides: any = {}): any {
  return {
    body: { name: "test" },
    query: {},
    params: {},
    headers: {},
    url: "/",
    ...overrides,
  };
}

describe("RequestDispatcher.getArgs", () => {
  it("delegates kind adapter args to the registered adapter resolver", async () => {
    const user = { id: 1, name: "raja" };
    const adapter: ZentifyAdapter = {
      name: "ZentifyAuthAdapter",
      kind: "common",
      getResolverArgs(key: string): ZentifyArgumentResolver | undefined {
        if (key === "authuser") return () => user;
        return undefined;
      },
    };
    const { dispatcher } = makeDispatcher([adapter]);
    const req = makeReq();
    const route: any = {
      metadata: [
        {
          index: 0,
          type: "authuser",
          kind: { type: "adapter", name: "ZentifyAuthAdapter" },
        },
        { index: 1, type: "req", kind: { type: "internal" } },
      ],
    };

    const args = await (dispatcher as any).getArgs(route, req, {});
    expect(args[0]).toBe(user);
    expect(args[1]).toBe(req);
  });

  it("throws when kind adapter references an unregistered adapter", async () => {
    const { dispatcher } = makeDispatcher([]);
    const route: any = {
      metadata: [
        {
          index: 0,
          type: "authuser",
          kind: { type: "adapter", name: "MissingAdapter" },
        },
      ],
    };

    await expect(
      (dispatcher as any).getArgs(route, makeReq(), {}),
    ).rejects.toThrow(/not registered/);
  });

  it("throws when a registered adapter lacks a resolver for the arg type", async () => {
    const adapter: ZentifyAdapter = { name: "EmptyAdapter", kind: "common" };
    const { dispatcher } = makeDispatcher([adapter]);
    const route: any = {
      metadata: [
        {
          index: 0,
          type: "authuser",
          kind: { type: "adapter", name: "EmptyAdapter" },
        },
      ],
    };

    await expect(
      (dispatcher as any).getArgs(route, makeReq(), {}),
    ).rejects.toThrow(/has no argument resolver/);
  });

  it("uses built-in internal handlers for core types", async () => {
    const { dispatcher } = makeDispatcher([]);
    const req = makeReq({ params: { id: "42" } });
    const route: any = {
      metadata: [
        { index: 0, type: "body", kind: { type: "internal" } },
        { index: 1, type: "param", key: "id", kind: { type: "internal" } },
      ],
    };

    const args = await (dispatcher as any).getArgs(route, req, {});
    expect(args[0]).toEqual({ name: "test" });
    expect(args[1]).toBe("42");
  });

  it("defaults missing kind to internal", async () => {
    const { dispatcher } = makeDispatcher([]);
    const req = makeReq();
    const route: any = {
      metadata: [{ index: 0, type: "req" }],
    };

    const args = await (dispatcher as any).getArgs(route, req, {});
    expect(args[0]).toBe(req);
  });

  it("skips unknown types with no resolver", async () => {
    const { dispatcher } = makeDispatcher([]);
    const route: any = {
      metadata: [{ index: 0, type: "totally-unknown" }],
    };

    const args = await (dispatcher as any).getArgs(route, makeReq(), {});
    expect(args[0]).toBeUndefined();
  });
});
