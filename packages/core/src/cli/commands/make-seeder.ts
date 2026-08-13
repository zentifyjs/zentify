import { Command } from "commander";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { generateFileFromTemplate } from "./utils";
import { Logger } from "../../utils";

export const makeSeeder = new Command("make:seeder")
  .description("Generate a new database seeder")
  .argument("<name>", "Name of the seeder (e.g. User)")
  .action(async (name: string) => {
    const logger = new Logger({ context: "CLI" });
    const targetPath = path.join(process.cwd(), "app", "Database", "seeders", `${name}Seeder.ts`);
    
    // Auto-create DatabaseSeeder if it doesn't exist
    const dbSeederPath = path.join(process.cwd(), "app", "Database", "seeders", "DatabaseSeeder.ts");
    try {
      await fs.access(dbSeederPath);
    } catch {
      logger.info("DatabaseSeeder.ts not found. Creating one...");
      await generateFileFromTemplate("database-seeder.ts.tpl", dbSeederPath, {});
    }

    await generateFileFromTemplate("seeder.ts.tpl", targetPath, {
      name,
    });
  });
