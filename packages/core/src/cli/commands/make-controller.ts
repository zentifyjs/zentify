import { Command } from "commander";
import * as path from "node:path";
import { generateFileFromTemplate } from "./utils";

export const makeController = new Command("make:controller")
  .description("Generate a new controller class")
  .argument("<name>", "Name of the controller")
  .action(async (name: string) => {
    // Usually we append 'Controller' to the name if not present
    const className = name.endsWith("Controller") ? name : `${name}Controller`;
    const targetPath = path.join(process.cwd(), "app", "Controllers", `${className}.ts`);
    const routePath = `/${name.replace("Controller", "").toLowerCase()}`;

    await generateFileFromTemplate("controller.ts.tpl", targetPath, {
      name: className,
      path: routePath,
    });
  });
