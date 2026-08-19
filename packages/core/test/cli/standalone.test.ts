import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { cleanupOutDir } from "../../src/cli/utils/standalone";

describe("cleanupOutDir", () => {
  it("removes every entry except the standalone folder", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "zentify-cleanup-"));
    const outDir = path.join(root, "dist");
    const standalone = path.join(outDir, "standalone");

    fs.mkdirSync(path.join(outDir, "app"), { recursive: true });
    fs.mkdirSync(path.join(outDir, "public"), { recursive: true });
    fs.mkdirSync(path.join(outDir, "server"), { recursive: true });
    fs.writeFileSync(path.join(outDir, "stray.txt"), "x");
    fs.mkdirSync(path.join(standalone, "dist"), { recursive: true });
    fs.writeFileSync(path.join(standalone, "server.js"), "x");

    const removed = cleanupOutDir(outDir, standalone);

    expect(removed).toBe(4);
    expect(fs.readdirSync(outDir).sort()).toEqual(["standalone"]);
    expect(fs.existsSync(path.join(standalone, "server.js"))).toBe(true);

    fs.rmSync(root, { recursive: true, force: true });
  });

  it("throws when standalone is not inside the output dir", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "zentify-cleanup-"));
    const outDir = path.join(root, "dist");
    const elsewhere = path.join(root, "elsewhere", "standalone");
    fs.mkdirSync(outDir, { recursive: true });
    fs.mkdirSync(elsewhere, { recursive: true });

    expect(() => cleanupOutDir(outDir, elsewhere)).toThrow(/not inside/);

    fs.rmSync(root, { recursive: true, force: true });
  });

  it("throws when the output dir is a filesystem root", () => {
    const root = path.parse(process.cwd()).root;
    expect(() => cleanupOutDir(root, path.join(root, "standalone"))).toThrow(/filesystem root/);
  });
});
