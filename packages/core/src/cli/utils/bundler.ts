import * as esbuild from "esbuild";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, ChildProcess } from "node:child_process";

// Custom SWC Plugin for esbuild (handles TS and decorators)
import * as swc from "@swc/core";
const swcPlugin = (isDev: boolean): esbuild.Plugin => ({
  name: "swc-plugin",
  setup(build) {
    build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
      const code = await fs.promises.readFile(args.path, "utf8");
      
      const result = await swc.transform(code, {
        filename: args.path,
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: args.path.endsWith("x"),
            decorators: true,
          },
          transform: {
            decoratorMetadata: true,
            legacyDecorator: true,
          },
          target: "es2022",
        },
        module: {
          type: "es6",
        },
        sourceMaps: isDev ? "inline" : false,
      });

      return {
        contents: result.code,
        loader: args.path.endsWith("x") ? "tsx" : "ts",
      };
    });
  },
});

// Plugin to auto-append .js to relative imports (for 1-by-1 ESM output)
const esmExtensionPlugin: esbuild.Plugin = {
  name: "esm-extension-plugin",
  setup(build) {
    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      // If the import is relative, doesn't have an extension, and isn't a directory
      if (args.path.startsWith('.') && !args.path.match(/\.[a-zA-Z0-9]+$/)) {
        return { path: args.path + '.js', external: true };
      }
      return null;
    });
  },
};

function getAllFiles(dir: string): string[] {
  try {
    const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
    return files
      .filter((f) => f.isFile() && (f.name.endsWith(".ts") || f.name.endsWith(".tsx")))
      .map((f) => path.join(f.parentPath || (f as any).path, f.name));
  } catch {
    return [];
  }
}

export class ZentifyBundler {
  private static activeProcess: ChildProcess | null = null;
  
  static async build(entryPoints: string[], outDir: string = "dist", isDev: boolean = false): Promise<void> {
    const outPath = path.join(process.cwd(), outDir);
    
    const allEntryPoints = new Set<string>();
    for (const ep of entryPoints) {
      if (ep.endsWith(".ts") || ep.endsWith(".tsx")) {
        allEntryPoints.add(ep);
        const baseDir = path.dirname(ep);
        if (baseDir.includes("app")) {
           const appDir = ep.substring(0, ep.lastIndexOf("app") + 3);
           getAllFiles(appDir).forEach(f => allEntryPoints.add(f));
        }
      }
    }
    
    const plugins = isDev ? [swcPlugin(false), esmExtensionPlugin] : [swcPlugin(false)];
    
    await esbuild.build({
      entryPoints: Array.from(allEntryPoints),
      bundle: isDev,
      outdir: outPath,
      outbase: process.cwd(),
      format: "esm",
      platform: "node",
      target: "node20",
      plugins,
      packages: isDev ? "external" : undefined,
      logLevel: "error",
    });
  }

  static async watch(entryPoints: string[], outDir: string = ".zentify", env: NodeJS.ProcessEnv = process.env, mainSource: string = "app/index.ts"): Promise<void> {
    const outPath = path.join(process.cwd(), outDir);

    const allEntryPoints = new Set<string>();
    for (const ep of entryPoints) {
      if (ep.endsWith(".ts") || ep.endsWith(".tsx")) {
        allEntryPoints.add(ep);
        const baseDir = path.dirname(ep);
        if (baseDir.includes("app")) {
           const appDir = ep.substring(0, ep.lastIndexOf("app") + 3);
           getAllFiles(appDir).forEach(f => allEntryPoints.add(f));
        }
      }
    }

    const runProcess = () => {
      if (this.activeProcess) {
        this.activeProcess.kill();
      }
      
      this.activeProcess = spawn("node", [path.join(outPath, mainSource.replace(/\.ts$/, ".js"))], {
        stdio: "inherit",
        shell: false,
        env: {
          ...env,
        }
      });
      
      this.activeProcess.on("error", (err) => {
        console.error(`Failed to start process: ${err.message}`);
      });
    };

    const ctx = await esbuild.context({
      entryPoints: Array.from(allEntryPoints),
      bundle: true,
      outdir: outPath,
      outbase: process.cwd(),
      format: "esm",
      platform: "node",
      target: "node20",
      plugins: [
        swcPlugin(true),
        esmExtensionPlugin,
        {
          name: "watch-plugin",
          setup(build) {
            build.onEnd((result) => {
              if (result.errors.length === 0) {
                runProcess();
              }
            });
          },
        },
      ],
      packages: "external",
      logLevel: "info",
    });

    await ctx.watch();
  }
}
