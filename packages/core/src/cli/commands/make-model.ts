import { Command } from "commander";
import * as path from "node:path";
import { generateFileFromTemplate } from "./utils";

export const makeModel = new Command("make:model")
  .description("Generate a new model class")
  .argument("<name>", "Name of the model")
  .action(async (name: string) => {
    // Unlike controllers/services, models usually don't have "Model" suffix, but we can allow it
    const className = name;
    const targetPath = path.join(process.cwd(), "app", "Models", `${className}.ts`);

    await generateFileFromTemplate("model.ts.tpl", targetPath, {
      name: className,
    });
  });
