import { Command } from "commander";
import { spawn } from "node:child_process";
import { resolveEntryPoint } from "../utils/config";

export const startCommand = new Command("start")
  .description("Start the Zentify application in production mode")
  .action(() => {
    const { dist } = resolveEntryPoint();
    
    console.log(`[Zentify] Starting production server...`);
    
    const nodeProcess = spawn("node", [dist], {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    });

    nodeProcess.on("close", (code) => {
      process.exit(code ?? 0);
    });
  });
