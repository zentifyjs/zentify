import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import * as path from "node:path";
import { Logger } from "../utils";
import {
  resolveLayerOnly,
  prependImports,
  injectAtMarker,
} from "./templates/resolver";
import { getTemplatesDir } from "./commands/utils";

export interface InstallResult {
  filesCreated: string[];
  filesSkipped: string[];
  depsAdded: string[];
  indexModified: boolean;
}

export interface InstallOptions {
  skipHooks?: boolean;
  force?: boolean;
}

export async function isLayerInstalled(
  layerName: string,
  projectRoot: string
): Promise<boolean> {
  const tpl = await resolveLayerOnly(layerName);
  const allDeps = await getProjectDeps(projectRoot);
  const layerDepNames = Object.keys(tpl.dependencies);

  const hasDep = layerDepNames.some((dep) => dep in allDeps);
  if (!hasDep) return false;

  const content = await readIndexTs(projectRoot);
  if (!content) return false;

  for (const injection of tpl.injections) {
    if (content.includes(injection.marker)) return false;
  }

  return true;
}

export async function installLayer(
  layerName: string,
  projectRoot: string,
  options?: InstallOptions
): Promise<InstallResult> {
  const logger = new Logger({ context: "install" });
  const result: InstallResult = {
    filesCreated: [],
    filesSkipped: [],
    depsAdded: [],
    indexModified: false,
  };

  await validateProject(projectRoot, logger);

  const tpl = await resolveLayerOnly(layerName);

  const manifest = await readLayerManifest(layerName);
  if (manifest?.requires) {
    for (const required of manifest.requires) {
      const installed = await isLayerInstalled(required, projectRoot);
      if (!installed) {
        const msg =
          `Layer '${layerName}' membutuhkan '${required}'. ` +
          `Jalankan: npx zentify ${required}:install`;
        logger.error(msg);
        throw new Error(msg);
      }
    }
  }

  if (!options?.force && (await isLayerInstalled(layerName, projectRoot))) {
    logger.info(`Layer '${layerName}' sudah terpasang. Skip.`);
    return result;
  }

  await mergePackageJson(projectRoot, tpl, result);

  for (const source of tpl.sources) {
    const copyFrom = path.join(source.dir, "files");
    try {
      await fs.access(copyFrom);
    } catch {
      continue;
    }
    await copyDirSafe(copyFrom, projectRoot, result, options?.force);
  }

  await mergeEnv(tpl.env, projectRoot);

  await injectIndex(projectRoot, tpl, result);

  if (tpl.adapterPackage && !options?.skipHooks) {
    await callAdapterOnInstall(tpl.adapterPackage, projectRoot, logger);
  }

  return result;
}

async function getProjectDeps(projectRoot: string): Promise<Record<string, string>> {
  try {
    const pkg = JSON.parse(
      await fs.readFile(path.join(projectRoot, "package.json"), "utf-8")
    );
    return { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    return {};
  }
}

async function readIndexTs(projectRoot: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(projectRoot, "app", "index.ts"), "utf-8");
  } catch {
    return null;
  }
}

async function readLayerManifest(layerName: string) {
  try {
    const templatesDir = getTemplatesDir();
    return JSON.parse(
      await fs.readFile(
        path.join(templatesDir, "layers", layerName, "manifest.json"),
        "utf-8"
      )
    );
  } catch {
    return null;
  }
}

async function validateProject(projectRoot: string, logger: Logger) {
  try {
    await fs.access(path.join(projectRoot, "package.json"));
  } catch {
    logger.error("package.json tidak ditemukan. Bukan project Zentify.");
    process.exit(1);
  }
  try {
    await fs.access(path.join(projectRoot, "app"));
  } catch {
    logger.error("Direktori app/ tidak ditemukan. Bukan project Zentify.");
    process.exit(1);
  }
}

async function mergePackageJson(
  projectRoot: string,
  tpl: any,
  result: InstallResult
) {
  const pkgPath = path.join(projectRoot, "package.json");
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
  const oldDeps = { ...pkg.dependencies };
  const oldDevDeps = { ...pkg.devDependencies };

  pkg.dependencies = { ...pkg.dependencies, ...tpl.dependencies };
  pkg.devDependencies = { ...pkg.devDependencies, ...tpl.devDependencies };

  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");

  for (const dep of Object.keys(tpl.dependencies)) {
    if (!(dep in oldDeps)) result.depsAdded.push(dep);
  }
  for (const dep of Object.keys(tpl.devDependencies || {})) {
    if (!(dep in oldDevDeps)) result.depsAdded.push(dep);
  }
}

async function copyDirSafe(
  src: string,
  dest: string,
  result: InstallResult,
  force?: boolean
): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirSafe(srcPath, destPath, result, force);
    } else {
      if (!force) {
        try {
          await fs.access(destPath);
          result.filesSkipped.push(path.relative(process.cwd(), destPath));
          continue;
        } catch {}
      }
      await fs.copyFile(srcPath, destPath);
      result.filesCreated.push(path.relative(process.cwd(), destPath));
    }
  }
}

async function mergeEnv(env: Record<string, string>, projectRoot: string) {
  if (Object.keys(env).length === 0) return;

  const logger = new Logger({ context: "install" });
  const envPath = path.join(projectRoot, ".env");

  let existing: Record<string, string> = {};
  try {
    const content = await fs.readFile(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        existing[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
      }
    }
  } catch {}

  const merged = { ...env, ...existing };
  const envContent =
    Object.entries(merged).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";

  await fs.writeFile(envPath, envContent, "utf-8");
  await fs.writeFile(path.join(projectRoot, ".env.example"), envContent, "utf-8");
  logger.info(`Updated .env (${Object.keys(env).length} keys).`);
}

async function injectIndex(
  projectRoot: string,
  tpl: any,
  result: InstallResult
) {
  const indexPath = path.join(projectRoot, "app", "index.ts");
  try {
    let content = await fs.readFile(indexPath, "utf-8");
    content = prependImports(content, tpl.imports);

    for (const injection of tpl.injections) {
      content = injectAtMarker(content, injection.marker, injection.code);
    }

    content = content
      .split("\n")
      .filter((line) => !line.trim().startsWith("// [[zentify:"))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");

    await fs.writeFile(indexPath, content, "utf-8");
    result.indexModified = true;
  } catch {
    new Logger({ context: "install" }).warn("app/index.ts tidak ditemukan.");
  }
}

async function callAdapterOnInstall(
  adapterPackage: string,
  projectRoot: string,
  logger: Logger
) {
  try {
    const adapter = await import(adapterPackage);
    const adapterClass = Object.values(adapter).find(
      (v: any) => v && typeof v === "function" && v.prototype?.onInstall
    ) as any;

    if (adapterClass) {
      const instance = Object.create(adapterClass.prototype);
      const onInstallResult = instance.onInstall(projectRoot);
      if (onInstallResult && typeof onInstallResult.then === "function") {
        await Promise.race([
          onInstallResult,
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error("onInstall timeout")), 10_000)
          ),
        ]);
      }
      logger.info(`Adapter ${adapterPackage} onInstall selesai.`);
    } else {
      logger.info(`Adapter ${adapterPackage} tidak punya onInstall hook.`);
    }
  } catch (e: any) {
    logger.warn(`Gagal menjalankan adapter onInstall: ${e.message}`);
  }
}
