import { Command } from "commander";
import { ZentifyBundler } from "../utils/bundler";
import { resolveEntryPoint } from "../utils/config";
import { Logger } from "../../utils";

export const devCommand = new Command("dev")
  .description("Start the Zentify development server with hot-reload")
  .action(async () => {
    const logger = new Logger({
      context: "dev"
    })
    
    const { source } = resolveEntryPoint();
    
    logger.info(`Starting SWC development server...`);
    
    try {
      await ZentifyBundler.watch([source], ".zentify", {
        ...process.env,
        NODE_ENV: "development",
      }, source);
    } catch (e: any) {
      logger.error(`Dev server crashed: ${e.message}`);
    }
  });
