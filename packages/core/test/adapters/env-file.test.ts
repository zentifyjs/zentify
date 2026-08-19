import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { EnvFileConfigLoader } from "../../src/adapters/config/loaders/env_file";

function makeTempDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zentify-env-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

describe("EnvFileConfigLoader", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = process.cwd();
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    vi.restoreAllMocks();
    process.chdir(cwd);
  });

  it("loads variables from .env when present", () => {
    const dir = makeTempDir({ ".env": "FOO=bar\nBAZ=qux\n" });
    process.chdir(dir);

    expect(new EnvFileConfigLoader().load()).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("lets .env.local override .env", () => {
    const dir = makeTempDir({
      ".env": "FOO=base\nBOTH=from-env\n",
      ".env.local": "FOO=override\n",
    });
    process.chdir(dir);

    expect(new EnvFileConfigLoader().load()).toEqual({
      FOO: "override",
      BOTH: "from-env",
    });
  });

  it("includes environment-specific files when NODE_ENV is set", () => {
    const dir = makeTempDir({
      ".env": "A=1\n",
      ".env.test": "A=2\nSTAGE=testing\n",
    });
    process.env.NODE_ENV = "test";
    process.chdir(dir);

    expect(new EnvFileConfigLoader().load()).toEqual({ A: "2", STAGE: "testing" });
  });

  it("lets .env.test.local override environment-specific files", () => {
    const dir = makeTempDir({
      ".env": "A=1\n",
      ".env.test": "A=2\nSTAGE=testing\n",
      ".env.test.local": "A=3\nSECRET=local\n",
    });
    process.env.NODE_ENV = "test";
    process.chdir(dir);

    expect(new EnvFileConfigLoader().load()).toEqual({
      A: "3",
      STAGE: "testing",
      SECRET: "local",
    });
  });

  it("returns an empty object when no env file exists", () => {
    const dir = makeTempDir({});
    process.chdir(dir);

    expect(new EnvFileConfigLoader().load()).toEqual({});
  });

  it("tracks its name and priority", () => {
    const loader = new EnvFileConfigLoader();
    expect(loader.name).toBe("EnvFileConfigLoader");
    expect(loader.priority).toBe(100);
  });
});