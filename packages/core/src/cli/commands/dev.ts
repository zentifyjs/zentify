import { Command } from "commander";
import { spawn } from "node:child_process";
import { resolveEntryPoint } from "../utils/config";
import { Logger } from "../../utils";

export const devCommand = new Command("dev")
  .description("Start the Zentify application in development mode")
  .action(() => {
    const logger = new Logger({
      context: "dev"
    })
    
    logger.info(`Starting development server with ts-node...`);
    
    const child = spawn("node", ["--watch", "--loader", "ts-node/esm", "app/index.ts"], {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "development",
      },
    });

    const cleanup = () => {
      child.kill();
      process.exit();
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  });
