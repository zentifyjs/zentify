import { describe, expect, it } from "vitest";
import {
  addParameterMetadata,
  getParameterMetadata,
} from "../../src/decorators/metadata";
import { Param } from "../../src/decorators/param";
import { Req } from "../../src/decorators/req";
import { Res } from "../../src/decorators/res";
import { File } from "../../src/decorators/file";

describe("parameter metadata", () => {
  it("stores and reads raw metadata for a method", () => {
    const target = {};
    addParameterMetadata(target, "handler", { index: 0, type: "req" });
    addParameterMetadata(target, "handler", { index: 1, type: "res" });
    addParameterMetadata(target, "other", { index: 0, type: "param", key: "id" });

    expect(getParameterMetadata(target, "handler")).toEqual([
      { index: 0, type: "req" },
      { index: 1, type: "res" },
    ]);
    expect(getParameterMetadata(target, "other")).toEqual([
      { index: 0, type: "param", key: "id" },
    ]);
    expect(getParameterMetadata(target, "missing")).toEqual([]);
  });

  it("records @Param metadata", () => {
    class C {
      handler(@Param("id") id: string) {}
    }
    const meta = getParameterMetadata(C.prototype, "handler");
    expect(meta).toContainEqual({ index: 0, type: "param", key: "id" });
  });

  it("records @Req metadata", () => {
    class C {
      handler(@Req() req: unknown) {}
    }
    const meta = getParameterMetadata(C.prototype, "handler");
    expect(meta).toContainEqual({ index: 0, type: "req" });
  });

  it("records @Res metadata", () => {
    class C {
      handler(@Res() res: unknown) {}
    }
    const meta = getParameterMetadata(C.prototype, "handler");
    expect(meta).toContainEqual({ index: 0, type: "res" });
  });

  it("records @File metadata with the field name", () => {
    class C {
      handler(@File("data") file: unknown) {}
    }
    const meta = getParameterMetadata(C.prototype, "handler");
    expect(meta).toContainEqual({ index: 0, type: "file", key: "data" });
  });

  it("assigns the correct index for mixed parameters", () => {
    class C {
      handler(@Req() req: unknown, @Param("id") id: string, @File("f") f: unknown) {}
    }
    const meta = getParameterMetadata(C.prototype, "handler");
    expect(meta).toEqual(
      expect.arrayContaining([
        { index: 0, type: "req" },
        { index: 1, type: "param", key: "id" },
        { index: 2, type: "file", key: "f" },
      ]),
    );
  });
});