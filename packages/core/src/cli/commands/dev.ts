import { Command } from "commander";
import { spawn } from "node:child_process";
import { resolveEntryPoint } from "../utils/config";

export const devCommand = new Command("dev")
  .description("Start the Zentify application in development mode")
  .action(() => {
    const { dist } = resolveEntryPoint();
    
    console.log(`[Zentify] Starting development server...`);
    console.log(`[Zentify] Initial build...`);
    
    const initialBuild = spawn("npx", ["tsc"], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });

    initialBuild.on("close", (code) => {
      if (code !== 0) {
        console.error(`[Zentify] Initial build failed with code ${code}.`);
        process.exit(code ?? 1);
      }

      console.log(`[Zentify] Initial build complete. Starting watcher...`);
      
      // Run tsc in watch mode
      const tscProcess = spawn("npx", ["tsc", "--watch", "--preserveWatchOutput"], {
        stdio: "inherit",
        shell: true,
        env: process.env,
      });
      
      // Run node with watch-path set to dist
      const nodeProcess = spawn("node", ["--watch-path=./dist", dist], {
        stdio: "inherit",
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: "development",
        },
      });

      const cleanup = () => {
        tscProcess.kill();
        nodeProcess.kill();
        process.exit();
      };

      process.on("SIGINT", cleanup);
      process.on("SIGTERM", cleanup);
    });
  });
