import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  getZentifyJsonConfig,
  resolveOutDir,
} from "../../src/utils/zentify-config";

function tempDirWith(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zentify-cfg-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

describe("getZentifyJsonConfig", () => {
  it("returns an empty object when there is no zentify.json", () => {
    const dir = tempDirWith({});
    expect(getZentifyJsonConfig(dir)).toEqual({});
  });

  it("parses a valid zentify.json", () => {
    const dir = tempDirWith({ "zentify.json": '{"outDir":"build","entry":"src/index.ts"}' });
    expect(getZentifyJsonConfig(dir)).toEqual({
      outDir: "build",
      entry: "src/index.ts",
    });
  });

  it("returns an empty object for malformed JSON", () => {
    const dir = tempDirWith({ "zentify.json": "{not valid json" });
    expect(getZentifyJsonConfig(dir)).toEqual({});
  });
});

describe("resolveOutDir", () => {
  it("defaults to dist", () => {
    const dir = tempDirWith({});
    expect(resolveOutDir(dir)).toBe("dist");
  });

  it("reads outDir from zentify.json", () => {
    const dir = tempDirWith({ "zentify.json": '{"outDir":"build"}' });
    expect(resolveOutDir(dir)).toBe("build");
  });
});