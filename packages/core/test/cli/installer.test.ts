import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { installLayer, isLayerInstalled } from "../../src/cli/installer";
import { resolveLayerOnly } from "../../src/cli/templates/resolver";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

async function createFixture(deps: Record<string, string>, indexContent: string) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "zentify-test-"));
  await fs.writeFile(
    path.join(tmpDir, "package.json"),
    JSON.stringify({ name: "test-app", dependencies: { "@zentify/core": "*", ...deps } })
  );
  await fs.mkdir(path.join(tmpDir, "app"), { recursive: true });
  await fs.writeFile(path.join(tmpDir, "app", "index.ts"), indexContent);
  return tmpDir;
}

const AUTH_INDEX = [
  "import { Zentify } from '@zentify/core';",
  "const app = new Zentify();",
  "app.addAdapter(new ZentifyTypeOrmAdapter({}));",
  "// [[zentify:auth]]",
  "app.run();",
].join("\n");

async function createAuthFixture() {
  const tmpDir = await createFixture({ "@zentify/typeorm": "*" }, AUTH_INDEX);
  await fs.mkdir(path.join(tmpDir, "app", "Models"), { recursive: true });
  await fs.writeFile(path.join(tmpDir, "app", "Models", "User.ts"), "export class User {}");
  await fs.mkdir(path.join(tmpDir, "app", "Config"), { recursive: true });
  await fs.writeFile(path.join(tmpDir, "app", "Config", "AppConfig.ts"), "export class AppConfig {}");
  await fs.mkdir(path.join(tmpDir, "app", "Database", "migrations"), { recursive: true });
  await fs.writeFile(path.join(tmpDir, "app", "Database", "migrations", ".gitkeep"), "");
  await fs.mkdir(path.join(tmpDir, "app", "Database", "seeders"), { recursive: true });
  await fs.writeFile(path.join(tmpDir, "app", "Database", "seeders", "DatabaseSeeder.ts"), "export class DatabaseSeeder {}");
  return tmpDir;
}

const FRESH_INDEX = [
  "import { Zentify } from '@zentify/core';",
  "const app = new Zentify();",
  "app.run();",
].join("\n");

describe("installer", () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("isLayerInstalled returns false for fresh project", async () => {
    tmpDir = await createFixture({}, FRESH_INDEX);
    const installed = await isLayerInstalled("auth", tmpDir);
    expect(installed).toBe(false);
  });

  it("installLayer creates AuthController and AuthModule", async () => {
    tmpDir = await createAuthFixture();
    const result = await installLayer("auth", tmpDir, { skipHooks: true });
    expect(result.filesCreated.length).toBeGreaterThan(0);
    expect(result.filesCreated.some((f) => f.includes("AuthController"))).toBe(true);
    expect(result.filesCreated.some((f) => f.includes("AuthModule"))).toBe(true);
    expect(result.depsAdded).toContain("@zentify/auth");
    expect(result.indexModified).toBe(true);
  });

  it("installLayer skips existing files", async () => {
    tmpDir = await createAuthFixture();
    await fs.mkdir(path.join(tmpDir, "app", "Models"), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, "app", "Models", "User.ts"),
      "export class User {}"
    );
    const result = await installLayer("auth", tmpDir, { skipHooks: true });
    expect(result.filesSkipped.some((f) => f.includes("User.ts"))).toBe(true);
  });

  it("installLayer is idempotent", async () => {
    tmpDir = await createAuthFixture();
    await installLayer("auth", tmpDir, { skipHooks: true });
    const result = await installLayer("auth", tmpDir, { skipHooks: true });
    expect(result.filesCreated).toHaveLength(0);
  });

  it("installLayer with force reinstalls even if already installed", async () => {
    tmpDir = await createAuthFixture();
    await installLayer("auth", tmpDir, { skipHooks: true });
    const result = await installLayer("auth", tmpDir, { skipHooks: true, force: true });
    expect(result.filesCreated.length).toBeGreaterThan(0);
  });

  it("installLayer throws if requires not met", async () => {
    tmpDir = await createFixture({}, FRESH_INDEX);
    await expect(installLayer("auth", tmpDir, { skipHooks: true })).rejects.toThrow(
      /membutuhkan.*database/
    );
  });

  it("resolvedTemplate has adapterPackage from manifest", async () => {
    const tpl = await resolveLayerOnly("auth");
    expect(tpl.adapterPackage).toBe("@zentify/auth");
  });

  it("resolvedTemplate inherits adapterPackage via extends", async () => {
    const tpl = await resolveLayerOnly("database-postgres");
    expect(tpl.adapterPackage).toBe("@zentify/typeorm");
  });

  it("resolvedTemplate has requires from manifest", async () => {
    const tpl = await resolveLayerOnly("auth");
    expect(tpl.requires).toContain("database");
  });

  it("installLayer merges env keys for database-postgres", async () => {
    tmpDir = await createFixture({}, FRESH_INDEX);
    const result = await installLayer("database-postgres", tmpDir, { skipHooks: true });
    expect(result.depsAdded).toContain("pg");

    const envContent = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");
    expect(envContent).toContain("DB_TYPE=postgres");
    expect(envContent).toContain("DB_HOST=localhost");
  });

  it("installLayer preserves existing env values", async () => {
    tmpDir = await createFixture({}, FRESH_INDEX);
    await fs.writeFile(
      path.join(tmpDir, ".env"),
      "DB_HOST=custom-host\nDB_PORT=5433\n"
    );

    const result = await installLayer("database-postgres", tmpDir, { skipHooks: true });
    const envContent = await fs.readFile(path.join(tmpDir, ".env"), "utf-8");
    expect(envContent).toContain("DB_HOST=custom-host");
    expect(envContent).toContain("DB_PORT=5433");
    expect(envContent).toContain("DB_TYPE=postgres");
  });

  it("installLayer injects index.ts imports and bootstrap", async () => {
    tmpDir = await createAuthFixture();
    await installLayer("auth", tmpDir, { skipHooks: true });
    const content = await fs.readFile(path.join(tmpDir, "app", "index.ts"), "utf-8");
    expect(content).toContain('import { ZentifyAuthAdapter } from "@zentify/auth"');
    expect(content).toContain('import { User } from "./Models/User.js"');
    expect(content).toContain("new ZentifyAuthAdapter(");
    expect(content).not.toContain("// [[zentify:auth]]");
  });

  it("installLayer strips unused markers", async () => {
    tmpDir = await createAuthFixture();
    await installLayer("auth", tmpDir, { skipHooks: true });
    const content = await fs.readFile(path.join(tmpDir, "app", "index.ts"), "utf-8");
    expect(content).not.toContain("// [[zentify:");
  });
});
