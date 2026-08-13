import { Command } from "commander";
import { spawn } from "child_process";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { Logger } from "../../utils";
import { pathToFileURL } from "node:url";
import { resolveEntryPoint } from "../utils/config";
import { ZentifyBundler } from "../utils/bundler";

export const dbSeed = new Command("db:seed")
  .description("Run the database seeders")
  .option("-c, --class <name>", "Specific seeder class to run", "DatabaseSeeder")
  .action(async (options) => {
    const logger = new Logger({ context: "CLI" });
    const { source } = resolveEntryPoint();
    const indexPath = path.join(process.cwd(), source);
    
    try {
        await fs.access(indexPath);
    } catch {
        logger.error("Error: Could not find app/index.ts in the current directory.");
        process.exit(1);
    }

    logger.info(`Compiling app to run seeder: ${options.class}...`);
    
    try {
        const seederSrc = path.join(process.cwd(), "app/Database/seeders", `${options.class}.ts`);
        await ZentifyBundler.build([source, seederSrc], ".zentify", true);
        
        const child = spawn("node", [path.join(".zentify", source.replace(/\.ts$/, ".js"))], {
            stdio: "inherit",
            shell: false,
            env: {
                ...process.env,
                ZENTIFY_SEEDING: "true",
                ZENTIFY_SEED_CLASS: options.class
            }
        });

        child.on("close", (code) => {
            if (code !== 0) {
                logger.error(`Seeder process exited with code ${code}`);
            } else {
                logger.info("Seeder process completed successfully.");
            }
        });
    } catch (e: any) {
        logger.error(`Failed to compile seeder: ${e.message}`);
    }
  });
