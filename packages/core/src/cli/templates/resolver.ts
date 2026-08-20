import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getTemplatesDir } from "../commands/utils";
import {
  ResolvedTemplate,
  TemplateInfo,
  TemplateManifest,
  TemplateSource,
} from "./types";

const MANIFEST = "manifest.json";

async function readManifest(dir: string): Promise<TemplateManifest | null> {
  try {
    const content = await fs.readFile(path.join(dir, MANIFEST), "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function listBaseTemplates(): Promise<TemplateInfo[]> {
  const templatesDir = getTemplatesDir();
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });

  const result: TemplateInfo[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "layers" || entry.name === "tpls") continue;
    const manifest = await readManifest(path.join(templatesDir, entry.name));
    if (!manifest || manifest.kind === "layer") continue;
    result.push({
      name: manifest.name,
      folder: entry.name,
      description: manifest.description || "",
    });
  }
  return result;
}

export async function listLayers(group?: string): Promise<TemplateInfo[]> {
  const layersDir = path.join(getTemplatesDir(), "layers");
  const entries = await fs.readdir(layersDir, { withFileTypes: true });

  const result: TemplateInfo[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifest = await readManifest(path.join(layersDir, entry.name));
    if (!manifest || manifest.kind !== "layer") continue;
    if (group && manifest.group !== group) continue;
    result.push({
      name: manifest.name,
      folder: entry.name,
      description: manifest.description || "",
      priority: manifest.priority,
    });
  }
  result.sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.name.localeCompare(b.name),
  );
  return result;
}

async function resolveLayer(layerName: string, acc: ResolvedTemplate): Promise<void> {
  const dir = path.join(getTemplatesDir(), "layers", layerName);
  const manifest = await readManifest(dir);
  if (!manifest) {
    throw new Error(`Layer '${layerName}' not found or has no manifest.json`);
  }

  if (manifest.extends) {
    await resolveLayer(manifest.extends, acc);
  }

  acc.sources.push({ dir, useFiles: true });
  await mergeInto(acc, manifest);
}

async function applyTemplateManifest(
  folder: string,
  acc: ResolvedTemplate,
): Promise<TemplateManifest> {
  const dir = path.join(getTemplatesDir(), folder);
  const manifest = await readManifest(dir);
  if (!manifest) {
    throw new Error(`Template '${folder}' not found or has no manifest.json`);
  }

  if (manifest.base) {
    await applyTemplateManifest(manifest.base, acc);
  }

  acc.sources.push({ dir, useFiles: false });
  await mergeInto(acc, manifest);

  if (manifest.layers) {
    for (const layer of manifest.layers) {
      await resolveLayer(layer, acc);
    }
  }

  return manifest;
}

export async function resolveTemplate(
  templateFolder: string,
  layerNames: string[] = [],
): Promise<ResolvedTemplate> {
  const acc: ResolvedTemplate = {
    name: templateFolder,
    sources: [],
    dependencies: {},
    devDependencies: {},
    env: {},
    imports: [],
    injections: [],
  };

  await applyTemplateManifest(templateFolder, acc);

  for (const layer of layerNames) {
    await resolveLayer(layer, acc);
  }

  return acc;
}

async function mergeInto(acc: ResolvedTemplate, manifest: TemplateManifest) {
  if (manifest.deps?.dependencies) {
    Object.assign(acc.dependencies, manifest.deps.dependencies);
  }
  if (manifest.deps?.devDependencies) {
    Object.assign(acc.devDependencies, manifest.deps.devDependencies);
  }
  if (manifest.env) {
    Object.assign(acc.env, manifest.env);
  }
  if (manifest.imports) {
    for (const line of manifest.imports) {
      if (!acc.imports.includes(line)) acc.imports.push(line);
    }
  }
  const code =
    manifest.bootstrap ??
    (manifest.bootstrapTpl ? await readBootstrapTpl(manifest.bootstrapTpl) : undefined);
  if (code && manifest.marker) {
    const existing = acc.injections.find((i) => i.marker === manifest.marker);
    if (existing) {
      existing.code += "\n" + code.trimEnd();
    } else {
      acc.injections.push({ marker: manifest.marker, code: code.trimEnd() });
    }
  }
}

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function prependImports(content: string, imports: string[]) {
  const fresh = imports.filter((line) => !content.includes(line));
  if (fresh.length === 0) return content;
  return fresh.join("\n") + "\n" + content;
}

function injectAtMarker(content: string, marker: string, code: string) {
  if (content.includes(marker)) {
    return content.replace(marker, code.trimEnd());
  }
  if (content.includes("app.run();")) {
    return content.replace("app.run();", code.trimEnd() + "\n\napp.run();");
  }
  return content;
}

export interface MaterializeOptions {
  appName: string;
}

export async function materialize(
  tpl: ResolvedTemplate,
  targetDir: string,
  { appName }: MaterializeOptions,
) {
  for (const source of tpl.sources) {
    const copyFrom = source.useFiles ? path.join(source.dir, "files") : source.dir;
    try {
      await fs.access(copyFrom);
    } catch {
      continue; // Layer has no files/ directory (e.g. driver layers), only metadata
    }
    await copyDir(copyFrom, targetDir);
  }

  await fs.rm(path.join(targetDir, MANIFEST), { force: true });

  // npm does not pack ".gitignore" files, so templates store it as "gitignore".
  try {
    await fs.rename(path.join(targetDir, "gitignore"), path.join(targetDir, ".gitignore"));
  } catch {
    // No gitignore file in this template
  }

  const packageJsonPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
  pkg.name = appName;
  pkg.dependencies = { ...pkg.dependencies, ...tpl.dependencies };
  pkg.devDependencies = { ...pkg.devDependencies, ...tpl.devDependencies };
  await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2), "utf-8");

  if (Object.keys(tpl.env).length > 0) {
    const envContent =
      Object.entries(tpl.env)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n") + "\n";
    await fs.writeFile(path.join(targetDir, ".env"), envContent, "utf-8");
    await fs.writeFile(path.join(targetDir, ".env.example"), envContent, "utf-8");
  }

  const indexPath = path.join(targetDir, "app/index.ts");
  let content = await fs.readFile(indexPath, "utf-8");
  content = prependImports(content, tpl.imports);

  for (const injection of tpl.injections) {
    content = injectAtMarker(content, injection.marker, injection.code);
  }

  // Strip any marker placeholders that were never used by a layer,
  // then collapse leftover blank lines.
  content = content
    .split("\n")
    .filter((line) => !line.trim().startsWith("// [[zentify:"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  await fs.writeFile(indexPath, content, "utf-8");
}

async function readBootstrapTpl(tplName: string): Promise<string> {
  const tplPath = path.join(getTemplatesDir(), "tpls", tplName);
  return await fs.readFile(tplPath, "utf-8");
}
