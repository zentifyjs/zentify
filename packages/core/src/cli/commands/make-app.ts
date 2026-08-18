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
import { TemplateInfo } from "../templates/types";

type ChoiceMap = Record<string, string>;

function buildTypeMap(templates: TemplateInfo[]): ChoiceMap {
  const map: ChoiceMap = {};
  for (const t of templates) {
    map[t.folder.toLowerCase()] = t.folder;
    map[t.name.toLowerCase()] = t.folder;
  }
  return map;
}

function buildDbMap(layers: TemplateInfo[]): ChoiceMap {
  const map: ChoiceMap = { none: "none" };
  for (const l of layers) {
    map[l.folder.toLowerCase()] = l.folder;
    map[l.name.toLowerCase()] = l.folder;
  }
  map.postgres = "database-postgres";
  map.mysql = "database-mysql";
  return map;
}

function resolveChoice(
  value: string | undefined,
  map: ChoiceMap,
  choicesText: string,
  logger: Logger,
): string | undefined {
  if (value === undefined) return undefined;
  const normalized = map[value.trim().toLowerCase()];
  if (!normalized) {
    logger.error(`Unknown value '${value}'. Choose from: ${choicesText}`);
    process.exit(1);
  }
  return normalized;
}

interface MakeAppOptions {
  type?: string;
  database?: string;
  interaction?: boolean;
}

export const makeApp = new Command("new")
  .description("Create a new Zentify application")
  .argument("<name>", "Name of the application")
  .option("--type <template>", "Base template to use (skips the project type prompt)")
  .option("--database <driver>", "Database integration to use (skips the database prompt)")
  .option("--no-interaction", "Generate without interactive prompts (requires --type)")
  .action(async (name: string, options: MakeAppOptions) => {
    const logger = new Logger({context: "make:app"})
    try {
      const baseTemplates = await listBaseTemplates();
      if (baseTemplates.length === 0) {
        logger.error("No templates found in the templates directory.");
        process.exit(1);
      }

      const typeMap = buildTypeMap(baseTemplates);
      const typeChoicesText = baseTemplates.map((t) => t.folder).join(", ");

      const dbLayers = await listLayers("database");
      const dbMap = buildDbMap(dbLayers);
      const dbChoicesText = [...dbLayers.map((l) => l.folder), "none"].join(", ");

      // Validate flags that the user explicitly provided (both modes).
      const explicitType = resolveChoice(options.type, typeMap, typeChoicesText, logger);
      const explicitDb = resolveChoice(options.database, dbMap, dbChoicesText, logger);

      let type: string | undefined = explicitType;
      let dbType: string | undefined = explicitDb;

      // commander's "--no-interaction" stores the value under "interaction"
      // (default true; passing the flag sets it to false).
      const noInteraction = options.interaction === false;

      if (noInteraction) {
        if (!type) {
          logger.error(`--type is required with --no-interaction. Choose from: ${typeChoicesText}`);
          process.exit(1);
        }
        dbType = dbType ?? "none";
      } else {
        if (!type) {
          type = await select({
            message: "Select project type:",
            choices: baseTemplates.map((t) => ({
              name: t.name,
              value: t.folder,
              description: t.description,
            })),
          });
        }

        if (!dbType) {
          dbType = await select({
            message: "Select database type:",
            choices: [
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
            ],
          });
        }
      }

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
      const noInteraction = options.interaction === false;
      if (noInteraction) process.exit(1);
    }
  });