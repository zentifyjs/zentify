import * as fs from "node:fs";
import * as path from "node:path";
import { resolveOutDir } from "../../utils/zentify-config";

export interface ZentifyConfig {
  entry?: string;
  outDir?: string;
}

export function getZentifyConfig(): ZentifyConfig {
  const configPath = path.join(process.cwd(), "zentify.json");
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse zentify.json", e);
    }
  }
  return {};
}

export function resolveEntryPoint(): { source: string; dist: string } {
  const config = getZentifyConfig();
  const outDir = config.outDir || resolveOutDir();

  let sourceEntry = config.entry;

  if (!sourceEntry) {
    const defaultEntries = [
      "app/index.ts",
      "src/index.ts",
      "src/main.ts"
    ];

    for (const entry of defaultEntries) {
      if (fs.existsSync(path.join(process.cwd(), entry))) {
        sourceEntry = entry;
        break;
      }
    }
  }

  if (!sourceEntry) {
    console.error("Could not find a valid entry point. Please specify 'entry' in zentify.json.");
    process.exit(1);
  }

  // Convert .ts to .js and prefix with outDir/ (if it isn't already)
  // Example: app/index.ts -> {outDir}/app/index.js
  // Or if they specified a custom path: custom/server.ts -> {outDir}/custom/server.js
  let distPath = sourceEntry.replace(/\.ts$/, ".js");
  distPath = distPath.replace(/\\/g, "/");
  if (!distPath.startsWith(`${outDir}/`)) {
    distPath = `${outDir}/${distPath}`;
  }

  return { source: sourceEntry, dist: distPath };
}