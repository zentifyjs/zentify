import { Command } from "commander";
import * as path from "node:path";
import { generateFileFromTemplate } from "./utils";
import { Logger } from "../../utils";

export const makeModule = new Command("make:module")
  .description("Generate a complete resource module (Controller, Service, Model, Module)")
  .argument("<name>", "Name of the module (e.g. User)")
  .action(async (name: string) => {
    const logger = new Logger({context: "make:module"})
    // Determine base name (e.g., "User" from "UserModule")
    const baseName = name.replace(/Module$/i, "");
    const moduleName = `${baseName}Module`;
    const controllerName = `${baseName}Controller`;
    const serviceName = `${baseName}Service`;
    const modelName = baseName;

    // Paths
    const modulePath = path.join(process.cwd(), "app", "Modules", `${moduleName}.ts`);
    const controllerPath = path.join(process.cwd(), "app", "Controllers", `${controllerName}.ts`);
    const servicePath = path.join(process.cwd(), "app", "Services", `${serviceName}.ts`);
    const modelPath = path.join(process.cwd(), "app", "Models", `${modelName}.ts`);

    const routePath = `/${baseName.toLowerCase()}`;

    try {
      // Generate Module
      await generateFileFromTemplate("module.ts.tpl", modulePath, {
        name: baseName,
      });

      // Generate Controller
      await generateFileFromTemplate("controller.ts.tpl", controllerPath, {
        name: controllerName,
        path: routePath,
      });

      // Generate Service
      await generateFileFromTemplate("service.ts.tpl", servicePath, {
        name: serviceName,
      });

      // Generate Model
      await generateFileFromTemplate("model.ts.tpl", modelPath, {
        name: modelName,
      });

      logger.info(`Successfully generated ${moduleName} resource!`);
    } catch (e: any) {
      logger.error(`Error generating module: ${e.message}`);
    }
  });
