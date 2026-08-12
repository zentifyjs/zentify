import { Command } from "commander";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

export const buildCommand = new Command("build")
  .description("Build the Zentify application for production")
  .action(() => {
    console.log(`[Zentify] Building application...`);
    
    // Step 1: Build Backend with tsc
    console.log(`[Zentify] Compiling TypeScript backend...`);
    const tscProcess = spawn("npx", ["tsc"], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    
    tscProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`[Zentify] Backend compilation failed with code ${code}`);
        process.exit(code ?? 1);
      }
      
      console.log(`[Zentify] Backend compilation successful.`);
      
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
        console.log(`[Zentify] Vite detected. Building frontend assets...`);
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
            console.error(`[Zentify] Frontend build failed with code ${viteCode}`);
            process.exit(viteCode ?? 1);
          }
          console.log(`[Zentify] Build completed successfully.`);
        });
      } else {
        console.log(`[Zentify] Build completed successfully.`);
      }
    });
  });
