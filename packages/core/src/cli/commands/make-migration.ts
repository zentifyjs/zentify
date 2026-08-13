import { Command } from "commander";
import * as path from "node:path";
import { generateFileFromTemplate } from "./utils";

export const makeMigration = new Command("make:migration")
  .description("Generate a new TypeORM migration")
  .argument("<name>", "Name of the migration")
  .action(async (name: string) => {
    const timestamp = Date.now().toString();
    const targetPath = path.join(process.cwd(), "app", "Database", "migrations", `${timestamp}-${name}.ts`);
    
    await generateFileFromTemplate("migration.ts.tpl", targetPath, {
      name,
      timestamp,
    });
  });
