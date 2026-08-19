import * as fs from "node:fs";
import * as path from "node:path";

export interface ZentifyJsonConfig {
  entry?: string;
  outDir?: string;
  /**
   * When true, `zentify build` also produces a self-contained standalone
   * output at `<outDir>/standalone/` (Next.js-style).
   */
  standalone?: boolean;
}

export function getZentifyJsonConfig(
  cwd: string = process.cwd(),
): ZentifyJsonConfig {
  const configPath = path.join(cwd, "zentify.json");
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(content) as ZentifyJsonConfig;
    } catch (e) {
      // ignore malformed config
    }
  }
  return {};
}

export function resolveOutDir(cwd: string = process.cwd()): string {
  return getZentifyJsonConfig(cwd).outDir ?? "dist";
}

export function resolveStandaloneDir(
  cwd: string = process.cwd(),
  outDir: string = resolveOutDir(cwd),
): string {
  return path.join(cwd, outDir, "standalone");
}