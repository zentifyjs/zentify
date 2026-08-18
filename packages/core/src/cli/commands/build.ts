import { Command } from "commander";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { Logger } from "../../utils";
import { resolveOutDir } from "../../utils/zentify-config";

export const buildCommand = new Command("build")
  .description("Build the Zentify application for production")
  .action(async () => {
    const logger = new Logger({
      context: "build"
    })
    const outDir = resolveOutDir();
    logger.info(`Building application...`);
    
    // Step 1: Build Backend with tsc
    logger.info(`Compiling backend with tsc...`);
    
    try {
      const tscProcess = spawn("npx", ["tsc", "--outDir", outDir], {
        stdio: "inherit",
        shell: true,
        env: process.env,
      });

      await new Promise<void>((resolve, reject) => {
        tscProcess.on("close", (code) => {
          if (code !== 0 && code !== 2) reject(new Error(`tsc failed with code ${code}`));
          else resolve();
        });
      });
      
      logger.info(`Resolving extensionless imports with tsc-alias...`);
      const aliasProcess = spawn("npx", ["tsc-alias", "--resolve-full-paths", "--outDir", outDir], {
        stdio: "inherit",
        shell: true,
        env: process.env,
      });
      
      await new Promise<void>((resolve, reject) => {
        aliasProcess.on("close", (code) => {
          if (code !== 0) reject(new Error(`tsc-alias failed with code ${code}`));
          else resolve();
        });
      });
      
      logger.info(`Backend compilation successful.`);
    } catch (e: any) {
      logger.error(`[Zentify] Backend compilation failed: ${e.message}`);
      process.exit(1);
    }
    
    // Step 2: Build Frontend if Vite is present
      const packageJsonPath = path.join(process.cwd(), "package.json");
      let hasVite = false;
      
      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (allDeps["vite"] || allDeps["@zentify/vite"]) {
            hasVite = true;
          }
        } catch (e) {
          // ignore
        }
      }
      
      const viteConfigCandidates = ["vite.config.ts", "vite.config.js", "vite.config.mjs"];
      const viteConfigPath = viteConfigCandidates
        .map((f) => path.join(process.cwd(), f))
        .find((p) => fs.existsSync(p));

      const viteConfigExists = Boolean(viteConfigPath);
                               
      if (hasVite || viteConfigExists) {
        logger.info(`Vite detected. Building frontend assets...`);

        // Auto-inject FRONTEND_* envs (via ConfigService) by generating a config override.
        // The developer does NOT need to write define/ConfigService inside their vite.config.ts.
        const viteArgs = ["vite", "build"];
        if (viteConfigPath) {
          try {
            const overrideDir = path.join(process.cwd(), ".zentify");
            fs.mkdirSync(overrideDir, { recursive: true });
            const overridePath = path.join(overrideDir, "vite.config.override.mjs");
            const basePath = viteConfigPath.replace(/\\/g, "/");
            fs.writeFileSync(
              overridePath,
              [
                `import { defineConfig } from "vite";`,
                `import { ConfigService } from "@zentify/core";`,
                `import baseConfig from "${basePath}";`,
                ``,
                `export default defineConfig(async (env) => {`,
                `  const base = typeof baseConfig === "function" ? await baseConfig(env) : baseConfig;`,
                `  return {`,
                `    ...base,`,
                `    envPrefix: ["VITE_", "FRONTEND_"],`,
                `    ssr: { noExternal: ["@zentify/react"] },`,
                `    build: { ...(base.build || {}), outDir: "${outDir.replace(/\\/g, "/")}/public" },`,
                `    define: { ...(base.define || {}), ...ConfigService.getFrontendEnvs(), __ZENTIFY_FRONTEND_ENV__: JSON.stringify(ConfigService.getFrontendEnvMap()) },`,
                `  };`,
                `});`,
                ``,
              ].join("\n"),
            );
            viteArgs.push("--config", ".zentify/vite.config.override.mjs");
          } catch (e: any) {
            logger.warn(`Could not generate vite config override: ${e.message}`);
          }
        }

        const viteProcess = spawn("npx", viteArgs, {
          stdio: "inherit",
          shell: true,
          env: {
            ...process.env,
            NODE_ENV: "production",
          },
        });
        
        viteProcess.on("close", (viteCode) => {
          if (viteCode !== 0) {
            logger.error(`Frontend build failed with code ${viteCode}`);
            process.exit(viteCode ?? 1);
          }
          
          logger.info(`Vite client build complete. Starting SSR build...`);
          // Step 3: Server Build (for SSR) — reuse the same override config so
          // define/envPrefix (FRONTEND_*) and ssr.noExternal apply to the SSR bundle too.
          const ssrConfigFlag = viteConfigPath ? ["--config", ".zentify/vite.config.override.mjs"] : [];
          const ssrProcess = spawn("npx", ["vite", "build", "--ssr", "app/Views/main.tsx", "--outDir", path.join(outDir, "server"), ...ssrConfigFlag], {
            stdio: "inherit",
            shell: true,
            env: {
              ...process.env,
              NODE_ENV: "production",
            },
          });
          
          ssrProcess.on("close", (ssrCode) => {
            if (ssrCode !== 0) {
              logger.error(`SSR build failed with code ${ssrCode}`);
              process.exit(ssrCode ?? 1);
            }
            logger.info(`Build completed successfully.`);
          });
        });
      } else {
        logger.info(`Build completed successfully.`);
      }
  });
