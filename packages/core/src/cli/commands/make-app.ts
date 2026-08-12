import { Command } from "commander";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import pc from "picocolors";
import { select } from "@inquirer/prompts";

export const makeApp = new Command("new")
  .description("Create a new Zentify application")
  .argument("<name>", "Name of the application")
  .action(async (name: string) => {
    try {
      const type = await select({
        message: "Select project type:",
        choices: [
          {
            name: "API Only",
            value: "api-only",
            description: "A lightweight Zentify application for REST APIs",
          },
          {
            name: "Fullstack (React)",
            value: "fullstack",
            description: "Zentify backend with React + Vite frontend",
          },
        ],
      });

      const sourceDir = path.resolve(__dirname, `../../../templates/${type}`);
      const targetDir = path.join(process.cwd(), name);

      // Check if source template exists
      try {
        await fs.access(sourceDir);
      } catch {
        console.error(pc.red(`Template ${type} not found at ${sourceDir}`));
        console.log(pc.yellow("Please ensure the templates directory is properly set up in @zentify/core."));
        return;
      }

      await copyDir(sourceDir, targetDir);

      // Replace project name in package.json
      const packageJsonPath = path.join(targetDir, "package.json");
      try {
        let pkg = await fs.readFile(packageJsonPath, "utf-8");
        pkg = pkg.replace(/"name":\s*".*"/, `"name": "${name}"`);
        await fs.writeFile(packageJsonPath, pkg, "utf-8");
      } catch (e) {
        // Ignore if package.json doesn't exist
      }

      console.log(pc.green(`\n✔ Zentify application '${name}' created successfully!`));
      console.log(pc.cyan(`\nNext steps:`));
      console.log(`  cd ${name}`);
      console.log(`  npm install`);
      console.log(`  npm run dev`);
    } catch (error: any) {
      console.error(pc.red(`Error: ${error.message}`));
    }
  });

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
