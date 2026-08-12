import { Command } from "commander";
import * as path from "node:path";
import { generateFileFromTemplate } from "./utils";

export const makeModule = new Command("make:module")
  .description("Generate a new module class")
  .argument("<name>", "Name of the module")
  .action(async (name: string) => {
    const className = name.endsWith("Module") ? name : `${name}Module`;
    const targetPath = path.join(process.cwd(), "app", "Modules", `${className}.ts`);

    await generateFileFromTemplate("module.ts.tpl", targetPath, {
      name: className,
    });
  });
