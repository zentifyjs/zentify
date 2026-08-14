import { Command } from "commander";
import { resolveEntryPoint, getZentifyConfig } from "../utils/config";
import { Logger } from "../../utils";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type { ChildProcess } from "node:child_process";

export const devCommand = new Command("dev")
  .description("Start the Zentify development server with hot-reload")
  .action(async () => {
    const logger = new Logger({
      context: "dev"
    });
    
    const { dist } = resolveEntryPoint();
    
    logger.info(`Starting development server...`);
    
    // 1. Compile initially
    await new Promise<void>((resolve, reject) => {
      const initBuild = spawn("npx", ["tsc"], {
        stdio: "ignore", // Suppress initial tsc output
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
        stdio: "ignore", // Suppress initial tsc-alias output
        shell: true,
        env: process.env,
      });
      
      initAlias.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Initial tsc-alias failed with code ${code}`));
      });
      
      initAlias.on("error", (err) => reject(err));
    });
    
    // logger.info(`Initial build complete. Starting watch mode...`);

    // 3. Start tsc in watch mode, pipe stdout to intercept completion message
    const tscProcess = spawn("npx", ["tsc", "--watch", "--preserveWatchOutput"], {
      stdio: ["inherit", "pipe", "inherit"],
      shell: true,
      env: process.env,
    });
    
    let nodeProcess: ChildProcess | null = null;
    let isRestarting = false;
    
    const spawnNode = () => {
      // logger.info(`Starting server...`);
      nodeProcess = spawn("node", [dist], {
        stdio: "inherit",
        shell: false, // Must be false to properly kill node.exe on Windows
        env: {
          ...process.env,
          NODE_ENV: "development",
        },
      });
      
      nodeProcess.on("error", (err) => {
        logger.error(`Node process error: ${err.message}`);
      });
    };

    const startNode = () => {
      if (nodeProcess) {
        nodeProcess.removeAllListeners("close");
        nodeProcess.on("close", () => {
          nodeProcess = null;
          spawnNode();
        });
        nodeProcess.kill();
      } else {
        spawnNode();
      }
    };

    // Hook into TSC compilation events
    tscProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      
      // Filter out spammy TSC watch messages, only print real errors
      if (!output.includes("Starting compilation in watch mode...") &&
          !output.includes("Watching for file changes.")) {
        process.stdout.write(data);
      }
      
      // When TSC finishes compiling, it outputs this message
      if (output.includes("Watching for file changes.")) {
        if (isRestarting) return;
        isRestarting = true;
        
        // logger.info("Resolving aliases...");
        const aliasProcess = spawn("npx", ["tsc-alias", "--resolve-full-paths"], {
          stdio: "ignore", // Suppress output
          shell: true,
          env: process.env,
        });
        
        aliasProcess.on("close", (code) => {
          isRestarting = false;
          if (code === 0) {
            startNode();
          } else {
            logger.error(`tsc-alias failed with code ${code}`);
          }
        });
      }
    });
    
    tscProcess.on("error", (err) => {
      logger.error(`TSC process error: ${err.message}`);
    });
  });
