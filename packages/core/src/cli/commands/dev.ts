import { Command } from "commander";
import { resolveEntryPoint } from "../utils/config";
import { Logger } from "../../utils";
import { spawn } from "node:child_process";

export const devCommand = new Command("dev")
  .description("Start the Zentify development server with hot-reload")
  .action(async () => {
    const logger = new Logger({
      context: "dev"
    });
    
    const { dist } = resolveEntryPoint();
    
    logger.info(`Performing initial TypeScript compilation...`);
    
    // 1. Compile initially
    await new Promise<void>((resolve, reject) => {
      const initBuild = spawn("npx", ["tsc"], {
        stdio: "inherit",
        shell: true,
        env: process.env,
      });
      
      initBuild.on("close", (code) => {
        if (code === 0 || code === 2) { 
          resolve();
        } else {
          reject(new Error(`Initial build failed with code ${code}`));
        }
      });
      
      initBuild.on("error", (err) => reject(err));
    });
    
    // 2. Run tsc-alias initially
    await new Promise<void>((resolve, reject) => {
      const initAlias = spawn("npx", ["tsc-alias", "--resolve-full-paths"], {
        stdio: "inherit",
        shell: true,
        env: process.env,
      });
      
      initAlias.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Initial tsc-alias failed with code ${code}`));
      });
      
      initAlias.on("error", (err) => reject(err));
    });
    
    logger.info(`Initial build complete. Starting watch mode...`);

    // 3. Start tsc, tsc-alias, and node in watch mode
    const tscProcess = spawn("npx", ["tsc", "--watch", "--preserveWatchOutput"], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    
    const aliasProcess = spawn("npx", ["tsc-alias", "-w", "--resolve-full-paths"], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    
    const nodeProcess = spawn("node", [`--watch-path=dist`, dist], {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "development",
      },
    });
    
    nodeProcess.on("error", (err) => {
      logger.error(`Node process error: ${err.message}`);
    });
    
    tscProcess.on("error", (err) => {
      logger.error(`TSC process error: ${err.message}`);
    });
    
    aliasProcess.on("error", (err) => {
      logger.error(`TSC-Alias process error: ${err.message}`);
    });
  });
