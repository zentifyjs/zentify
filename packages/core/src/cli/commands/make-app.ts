import { Command } from "commander";
import * as path from "node:path";
import { select } from "@inquirer/prompts";
import { Logger } from "../../utils";
import {
  listBaseTemplates,
  listLayers,
  materialize,
  resolveTemplate,
} from "../templates/resolver";

export const makeApp = new Command("new")
  .description("Create a new Zentify application")
  .argument("<name>", "Name of the application")
  .action(async (name: string) => {
    const logger = new Logger({context: "make:app"})
    try {
      const baseTemplates = await listBaseTemplates();
      if (baseTemplates.length === 0) {
        logger.error("No templates found in the templates directory.");
        return;
      }

      const type = await select({
        message: "Select project type:",
        choices: baseTemplates.map((t) => ({
          name: t.name,
          value: t.folder,
          description: t.description,
        })),
      });

      const dbLayers = await listLayers("database");
      const dbChoices = [
        ...dbLayers.map((l, i) => ({
          name: i === 0 ? `${l.name} (Default)` : l.name,
          value: l.folder,
          description: l.description,
        })),
        {
          name: "None",
          value: "none",
          description: "Do not include database integration",
        },
      ];

      const dbType = await select({
        message: "Select database type:",
        choices: dbChoices,
      });

      const targetDir = path.join(process.cwd(), name);
      const resolved = await resolveTemplate(
        type,
        dbType === "none" ? [] : [dbType],
      );
      await materialize(resolved, targetDir, { appName: name });

      logger.info(`Zentify application '${name}' created successfully!`);
      logger.info(`Next steps:`);
      logger.info(`  cd ${name}`);
      logger.info(`  npm install`);
      logger.info(`  npm run dev`);
    } catch (error: any) {
      logger.error(`Error: ${error.message}`);
    }
  });