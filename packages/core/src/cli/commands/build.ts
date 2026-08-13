import { Command } from "commander";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { Logger } from "../../utils";
import { ZentifyBundler } from "../utils/bundler";
import { resolveEntryPoint } from "../utils/config";

export const buildCommand = new Command("build")
  .description("Build the Zentify application for production")
  .action(async () => {
    const logger = new Logger({
      context: "build"
    })
    logger.info(`Building application...`);
    
    // Step 1: Build Backend with SWC + esbuild
    logger.info(`Bundling backend with SWC + esbuild...`);
    
    const { source } = resolveEntryPoint();
    
    try {
      await ZentifyBundler.build([source], "dist");
      logger.info(`Backend compilation successful. Adding .js extensions...`);
      
      const tscEsmFixProcess = spawn("npx", ["tsc-esm-fix", "--target=dist"], {
        stdio: "inherit",
        shell: true,
      });

      await new Promise<void>((resolve, reject) => {
        tscEsmFixProcess.on("close", (code) => {
          if (code !== 0) reject(new Error(`tsc-esm-fix failed with code ${code}`));
          else resolve();
        });
      });
      
      logger.info(`Extensions added successfully.`);
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
      
      const viteConfigExists = fs.existsSync(path.join(process.cwd(), "vite.config.ts")) || 
                               fs.existsSync(path.join(process.cwd(), "vite.config.js"));
                               
      if (hasVite || viteConfigExists) {
        logger.info(`Vite detected. Building frontend assets...`);
        const viteProcess = spawn("npx", ["vite", "build"], {
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
          logger.info(`Build completed successfully.`);
        });
      } else {
        logger.info(`Build completed successfully.`);
      }
  });
