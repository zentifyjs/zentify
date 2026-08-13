import { Command } from "commander";
import { spawn } from "child_process";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { Logger } from "../../utils";

export const dbSeed = new Command("db:seed")
  .description("Run the database seeders")
  .option("-c, --class <name>", "Specific seeder class to run", "DatabaseSeeder")
  .action(async (options) => {
    const logger = new Logger({ context: "CLI" });
    const indexPath = path.join(process.cwd(), "app", "index.ts");
    
    try {
        await fs.access(indexPath);
    } catch {
        logger.error("Error: Could not find app/index.ts in the current directory.");
        process.exit(1);
    }

    logger.info(`Booting app to run seeder: ${options.class}...`);

    const child = spawn("node", ["--loader", "ts-node/esm", "app/index.ts"], {
        stdio: "inherit",
        shell: true,
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
  });
