import { Command } from "commander";
import * as path from "node:path";
import { generateFileFromTemplate } from "./utils";

export const makeService = new Command("make:service")
  .description("Generate a new service class")
  .argument("<name>", "Name of the service")
  .action(async (name: string) => {
    const className = name.endsWith("Service") ? name : `${name}Service`;
    const targetPath = path.join(process.cwd(), "app", "Services", `${className}.ts`);

    await generateFileFromTemplate("service.ts.tpl", targetPath, {
      name: className,
    });
  });
