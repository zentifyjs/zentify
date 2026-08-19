import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { Route } from "../../src/router/route";
import { pathToFileURL } from "node:url";

let tempDir: string | undefined;

function tempDirWith(files: Record<string, string>): string {
  tempDir = fs.mkdtempSync(path.join(process.cwd(), ".zentify-routes-"));
  for (const [name, content] of Object.entries(files)) {
    const abs = path.join(tempDir, name);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return tempDir;
}

describe("Route.importRoutes", () => {
  beforeEach(() => Route.reset());
  afterEach(() => {
    Route.reset();
    vi.restoreAllMocks();
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it("loads a route file and registers its routes", async () => {
    const dir = tempDirWith({});
    const file = path.join(dir, "web.mjs");
    const routeSrc = pathToFileURL(
      path.join(process.cwd(), "src/router/route.ts"),
    ).href;
    fs.writeFileSync(
      file,
      `import { Route } from ${JSON.stringify(routeSrc)};\n` +
        `Route.get("/imported", () => "ok");\n`,
    );

    await Route.importRoutes({ web: pathToFileURL(file).href }, dir);

    expect(Route.hasRoute("GET", "/imported")).toBe(true);
  });

  it("logs a warning without throwing when the file is missing", async () => {
    const warn = vi.spyOn(process.stderr, "write");

    await expect(
      Route.importRoutes({ web: "does/not/exist.mjs" }, "out-dir"),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
  });

  it("imports both web and api specs", async () => {
    const dir = tempDirWith({});
    const web = path.join(dir, "web.mjs");
    const api = path.join(dir, "api.mjs");
    fs.writeFileSync(web, `export const web = true;\n`);
    fs.writeFileSync(api, `export const api = true;\n`);

    await expect(
      Route.importRoutes(
        {
          web: pathToFileURL(web).href,
          api: pathToFileURL(api).href,
        },
        dir,
      ),
    ).resolves.toBeUndefined();
  });

  it("builds extension-less candidates when the spec has no extension", async () => {
    const warn = vi.spyOn(process.stderr, "write");

    await expect(
      Route.importRoutes({ web: "routes/missing" }, "out-dir"),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
  });

  it("rethrows errors that are not module-not-found", async () => {
    const dir = tempDirWith({});
    const file = path.join(dir, "broken.mjs");
    fs.writeFileSync(file, `throw new Error("syntax boom");\n`);

    await expect(
      Route.importRoutes({ web: pathToFileURL(file).href }, dir),
    ).rejects.toThrow(/syntax boom/);
  });

  it("treats bare package specs as direct import candidates", async () => {
    const warn = vi.spyOn(process.stderr, "write");

    await expect(
      Route.importRoutes({ web: "@scope/route-bundle" }, "out-dir"),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
  });
});