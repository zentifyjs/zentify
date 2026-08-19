import { nodeFileTrace } from "@vercel/nft";
import picomatch from "picomatch";
import * as fs from "node:fs";
import * as path from "node:path";
import type { Logger } from "../../utils";

/**
 * Dev-only packages that must never be shipped into the standalone output.
 * These are only ever loaded by the CLI bundler or the Vite dev server
 * (`vite` is dynamically imported by the Vite adapter inside an `isDev: false`
 * guard, and the standalone target always runs in production).
 */
const DEV_ONLY_PATTERNS = [
  "**/node_modules/vite/**",
  "**/node_modules/@vitejs/**",
  "**/node_modules/rollup/**",
  "**/node_modules/esbuild/**",
  "**/node_modules/@swc/**",
  "**/node_modules/@inquirer/**",
];

/** Directories that are never part of the deployment. */
const IGNORED_DIRS = ["**/.git/**", "**/.zentify/**"];

const IGNORE_PATTERNS = [...DEV_ONLY_PATTERNS, ...IGNORED_DIRS];

/**
 * nft's array-ignore resolves patterns through path.relative() which produces
 * backslash-separated globs on Windows that picomatch never matches. A
 * function-based ignore with fully normalized (posix) paths avoids that.
 */
const ignore = (relPath: string): boolean =>
  picomatch.isMatch(toPosix(relPath), IGNORE_PATTERNS);

export interface CreateStandaloneOptions {
  /** Absolute path to the application root (where zentify.json lives). */
  projectRoot: string;
  /** Build output dir relative to projectRoot, e.g. "dist". */
  outDir: string;
  logger?: Logger;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

/**
 * Traces resolve npm-workspace symlinks (e.g. `node_modules/@zentify/core` ->
 * `packages/core`) to their real location. The trace "base" must therefore be
 * a common ancestor of BOTH the app output and every realpath'd workspace
 * package. We walk up from the project root until we find a workspaces
 * manifest (monorepo root); for plain projects that is the project root itself.
 */
function findTracingBase(projectRoot: string): string {
  let dir = projectRoot;
  for (;;) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.workspaces) return dir;
      } catch {
        // malformed package.json — keep walking
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return projectRoot;
    dir = parent;
  }
}

/** Recursively collect the produced SSR bundle files (single-file chunks). */
function collectServerBundles(projectRoot: string, outDir: string): string[] {
  const results: string[] = [];
  const walk = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(mjs|js)$/.test(entry.name)) {
        results.push(full);
      }
    }
  };
  walk(path.join(projectRoot, outDir, "server"));
  return results;
}

interface PackageInfo {
  root: string;
  name: string;
}

/**
 * Find the nearest ancestor directory containing a package.json manifest and
 * read its `name`. This is the package boundary for both hoisted node_modules
 * packages and (realpath'd) npm-workspace packages.
 */
function findPackageInfo(absPath: string): PackageInfo | null {
  let dir = path.dirname(absPath);
  for (;;) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.name) {
          let root = dir;
          try {
            root = fs.realpathSync(dir);
          } catch {
            // keep original path
          }
          return { root, name: pkg.name };
        }
      } catch {
        // ignore malformed manifest
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Resolve a package directory by its name following the node_modules walk. */
function resolvePackageDir(root: string, depName: string): string | null {
  const rel = toPosix(depName).split("/").join(path.sep);
  let dir = root;
  for (;;) {
    const candidate = path.join(dir, "node_modules", rel);
    if (fs.existsSync(candidate)) {
      try {
        return fs.realpathSync(candidate);
      } catch {
        return candidate;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function copyPackageIfNeeded(
  root: string,
  name: string,
  targetRoot: string,
  seen: Set<string>,
): void {
  if (seen.has(name)) return;
  seen.add(name);
  const target = path.join(targetRoot, name);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(root, target, { recursive: true });
}

function serverJsSource(): string {
  return [
    'import { fileURLToPath } from "node:url";',
    'import { dirname, join } from "node:path";',
    "",
    "// Standalone deployments always run in production mode.",
    'process.env.NODE_ENV ??= "production";',
    "",
    "const __dirname = dirname(fileURLToPath(import.meta.url));",
    "",
    "// Resolve every runtime path relative to the standalone folder.",
    "process.chdir(__dirname);",
    "",
    "// The TypeORM adapter resolves entity/migration globs from",
    "// dirname(process.argv[1]); point it at the real entry so globs",
    '// like "./Database/migrations/**" land inside dist/app.',
    'process.argv[1] = join(__dirname, "dist/app/index.js");',
    "",
    'await import("./dist/app/index.js");',
    "",
  ].join("\n");
}

export interface CreateStandaloneResult {
  standaloneDir: string;
  fileCount: number;
}

/**
 * Remove every build artifact in the output dir except the standalone folder
 * itself. After `createStandalone` copies `app`/`public`/`server` into
 * `standalone/dist`, the original copies are redundant and only add confusion
 * on deployment. Guards prevent deleting the project root or a filesystem root.
 */
export function cleanupOutDir(
  outDirAbs: string,
  standaloneDir: string,
): number {
  const outResolved = path.resolve(outDirAbs);
  const standaloneResolved = path.resolve(standaloneDir);

  const rel = path.relative(outResolved, standaloneResolved);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(
      `Standalone cleanup aborted: standalone dir "${standaloneResolved}" is not inside "${outResolved}".`,
    );
  }
  if (path.parse(outResolved).root === outResolved) {
    throw new Error(
      `Standalone cleanup aborted: refusing to delete filesystem root "${outResolved}".`,
    );
  }

  let removed = 0;
  for (const entry of fs.readdirSync(outResolved, { withFileTypes: true })) {
    const full = path.join(outResolved, entry.name);
    if (path.resolve(full) === standaloneResolved) continue;
    fs.rmSync(full, { recursive: true, force: true });
    removed++;
  }
  return removed;
}

export async function createStandalone(
  opts: CreateStandaloneOptions,
): Promise<CreateStandaloneResult> {
  const { projectRoot, outDir } = opts;
  const logger = opts.logger;
  const base = findTracingBase(projectRoot);

  const standaloneDir = path.join(projectRoot, outDir, "standalone");
  const innerDist = path.join(standaloneDir, "dist");
  const innerNodeModules = path.join(standaloneDir, "node_modules");

  fs.rmSync(standaloneDir, { recursive: true, force: true });
  fs.mkdirSync(innerNodeModules, { recursive: true });

  const entryRel = path.join(outDir, "app", "index.js");
  const entryAbs = path.join(projectRoot, entryRel);
  if (!fs.existsSync(entryAbs)) {
    throw new Error(
      `Standalone build failed: entry not found at "${entryRel}". Run the normal build first.`,
    );
  }

  const serverBundles = collectServerBundles(projectRoot, outDir);
  const entries = [entryAbs, ...serverBundles];

  if (logger) {
    logger.info(
      `Tracing dependencies from ${serverBundles.length > 0 ? `${entries.length} files` : entryRel}...`,
    );
  }

  const { fileList, warnings } = await nodeFileTrace(entries, {
    base,
    ts: false,
    analysis: { emitGlobs: false },
    ignore,
  });
  if (logger && warnings.size > 0) {
    logger.warn(
      `${warnings.size} warnings during tracing (ignored resolving optional deps):`,
    );
    for (const w of [...warnings].slice(0, 5)) {
      logger.warn(`  - ${w.message}`);
    }
  }

  const projectRootRel = toPosix(path.relative(base, projectRoot));
  const appOutPrefix =
    (projectRootRel ? `${projectRootRel}/` : "") + toPosix(outDir) + "/";
  const projectPkgJsonRel = projectRootRel
    ? `${projectRootRel}/package.json`
    : "package.json";
  let baseReal = base;
  let projectRootReal = projectRoot;
  try {
    baseReal = fs.realpathSync(base);
    projectRootReal = fs.realpathSync(projectRoot);
  } catch {
    // keep originals
  }

  const seenPackages = new Set<string>();
  for (const rel of fileList) {
    const norm = toPosix(rel);
    if (norm === projectRootRel || norm === projectPkgJsonRel) continue;
    if (norm.startsWith(appOutPrefix)) continue;
    const info = findPackageInfo(path.join(base, rel));
    if (!info) continue;
    // Never treat the tracing base or the app itself as a shippable package.
    let infoRoot = info.root;
    try {
      infoRoot = fs.realpathSync(info.root);
    } catch {
      // keep resolved root
    }
    if (path.relative(infoRoot, baseReal) === "") continue;
    if (path.relative(infoRoot, projectRootReal) === "") continue;
    copyPackageIfNeeded(info.root, info.name, innerNodeModules, seenPackages);
  }

  // Safety net: also ship every explicit runtime dependency from package.json.
  // Tracing misses dynamic `require()` calls (e.g. TypeORM drivers like "pg")
  // that are only reachable through indirection.
  const pkgJsonPath = path.join(projectRoot, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      for (const depName of Object.keys(pkg.dependencies || {})) {
        const depRoot = resolvePackageDir(projectRoot, depName);
        if (depRoot) {
          copyPackageIfNeeded(depRoot, depName, innerNodeModules, seenPackages);
        }
      }
    } catch {
      // ignore malformed package.json
    }
  }

  const copiedPackages = seenPackages.size;

  // Copy the full app outputs; dynamic route imports, the hashed SSR bundle
  // and fs-level asset reads all expect the whole directories.
  for (const sub of ["app", "public", "server"]) {
    const src = path.join(projectRoot, outDir, sub);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(innerDist, sub), { recursive: true });
    }
  }

  fs.writeFileSync(path.join(standaloneDir, "server.js"), serverJsSource());
  fs.writeFileSync(
    path.join(standaloneDir, "package.json"),
    JSON.stringify(
      {
        name: "zentify-standalone",
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: {
          start: "zentify start",
        },
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(standaloneDir, "zentify.json"),
    JSON.stringify({ entry: "dist/app/index.js", outDir: "dist" }, null, 2),
  );

  if (logger) {
    logger.info(
      `Standalone output ready at "${toPosix(path.relative(projectRoot, standaloneDir))}" ` +
        `(${fileList.size} traced files, ${copiedPackages} packages).`,
    );
  }

  // Everything is now copied into standalone; drop the original build
  // artifacts so the output dir contains only the deployable folder.
  const outDirAbs = path.join(projectRoot, outDir);
  if (path.resolve(outDirAbs) !== path.resolve(projectRoot)) {
    const removed = cleanupOutDir(outDirAbs, standaloneDir);
    if (logger && removed > 0) {
      logger.info(
        `Removed build artifacts from "${toPosix(path.relative(projectRoot, outDirAbs))}" ` +
          `(${removed} item${removed === 1 ? "" : "s"} removed, kept "standalone" only).`,
      );
    }
  }

  return { standaloneDir, fileCount: fileList.size };
}
