import { Command } from "commander";
import { spawn } from "child_process";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { Logger } from "../../utils";
import { resolveEntryPoint } from "../utils/config";
import { ZentifyBundler } from "../utils/bundler";

const runMigrationProcess = async (type: string) => {
    const logger = new Logger({ context: "CLI" });
    const { source } = resolveEntryPoint();
    const indexPath = path.join(process.cwd(), source);
    
    try {
        await fs.access(indexPath);
    } catch {
        logger.error(`Error: Could not find ${source} in the current directory.`);
        process.exit(1);
    }

    logger.info(`Compiling app to run migrate:${type}...`);
    
    try {
        await ZentifyBundler.build([source], ".zentify", true);
        
        const child = spawn("node", [path.join(".zentify", source.replace(/\.ts$/, ".js"))], {
            stdio: "inherit",
            shell: false,
            env: {
                ...process.env,
                ZENTIFY_MIGRATING: type
            }
        });

        child.on("close", (code) => {
            if (code !== 0) {
                logger.error(`Migration process exited with code ${code}`);
            } else {
                logger.info(`Migration ${type} completed successfully.`);
            }
        });
    } catch (e: any) {
        logger.error(`Failed to compile for migration: ${e.message}`);
    }
}

export const migrateRun = new Command("migrate:run")
  .description("Run all pending database migrations")
  .action(() => runMigrationProcess("run"));

export const migrateRevert = new Command("migrate:revert")
  .description("Revert the last database migration")
  .action(() => runMigrationProcess("revert"));

export const migrateFresh = new Command("migrate:fresh")
  .description("Drop all tables and run all database migrations")
  .action(() => runMigrationProcess("fresh"));
