import { Command } from "commander";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import pc from "picocolors";
import { select } from "@inquirer/prompts";
import { Logger } from "../../utils";

export const makeApp = new Command("new")
  .description("Create a new Zentify application")
  .argument("<name>", "Name of the application")
  .action(async (name: string) => {
    const logger = new Logger({context: "make:app"})
    try {
      const templatesDir = path.resolve(__dirname, `../../templates`);
      const templateFolders = await fs.readdir(templatesDir, { withFileTypes: true });

      const templateChoices = [];
      for (const folder of templateFolders) {
        if (folder.isDirectory()) {
          try {
            const manifestPath = path.join(templatesDir, folder.name, "manifest.json");
            const manifestContent = await fs.readFile(manifestPath, "utf-8");
            const manifest = JSON.parse(manifestContent);
            
            templateChoices.push({
              name: manifest.name,
              value: folder.name,
              description: manifest.description
            });
          } catch (e) {
            // Ignore folders without manifest.json
          }
        }
      }

      if (templateChoices.length === 0) {
        logger.error("No templates found in the templates directory.");
        return;
      }

      const type = await select({
        message: "Select project type:",
        choices: templateChoices,
      });

      const dbType = await select({
        message: "Select database type:",
        choices: [
          {
            name: "PostgreSQL (Default)",
            value: "postgres",
            description: "Use PostgreSQL",
          },
          {
            name: "MySQL",
            value: "mysql",
            description: "Use MySQL",
          },
          {
            name: "None",
            value: "none",
            description: "Do not include database integration",
          },
        ],
      });

      const sourceDir = path.join(templatesDir, type);
      const targetDir = path.join(process.cwd(), name);

      await copyDir(sourceDir, targetDir);
      
      // We don't copy manifest.json to the generated app
      try {
        await fs.rm(path.join(targetDir, "manifest.json"), { force: true });
      } catch (e) {}

      // Update package.json cleanly
      const packageJsonPath = path.join(targetDir, "package.json");
      try {
        const pkgStr = await fs.readFile(packageJsonPath, "utf-8");
        const pkg = JSON.parse(pkgStr);
        pkg.name = name;
        
        if (dbType !== "none") {
          pkg.dependencies = pkg.dependencies || {};
          pkg.dependencies["@zentify/typeorm"] = "latest";
          pkg.dependencies["typeorm"] = "^0.3.0";
          
          if (dbType === "mysql") {
            pkg.dependencies["mysql2"] = "^3.9.0";
          } else {
            pkg.dependencies["pg"] = "^8.23.0";
          }
        }
        
        await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2), "utf-8");
      } catch (e) {
        logger.warn("Could not update package.json");
      }

      // Update app/index.ts and create User model if DB selected
      if (dbType !== "none") {
        const indexTsPath = path.join(targetDir, "app/index.ts");
        try {
          let indexTs = await fs.readFile(indexTsPath, "utf-8");
          
          const isMysql = dbType === "mysql";
          // Baca template files
          let dbAdapterCode = await fs.readFile(path.join(templatesDir, "tpls", "database-adapter.ts.tpl"), "utf-8");
          const userModelCode = await fs.readFile(path.join(templatesDir, "tpls", "user-model.ts.tpl"), "utf-8");
          
          // Replace placeholders
          dbAdapterCode = dbAdapterCode.replace("__DB_TYPE__", isMysql ? "mysql" : "postgres");
          dbAdapterCode = dbAdapterCode.replace("__DB_PORT__", isMysql ? "3306" : "5432");
          dbAdapterCode = dbAdapterCode.replace("__DB_USERNAME__", isMysql ? "root" : "postgres");

          indexTs = `import { ZentifyTypeOrmAdapter } from "@zentify/typeorm";\n` + indexTs;
          indexTs = indexTs.replace("app.run();", dbAdapterCode + "\napp.run();");
          
          await fs.writeFile(indexTsPath, indexTs, "utf-8");
          
          // Create default Models directory and User.ts
          const modelsDir = path.join(targetDir, "app/Models");
          await fs.mkdir(modelsDir, { recursive: true });
          
          await fs.writeFile(path.join(modelsDir, "User.ts"), userModelCode, "utf-8");
          
        } catch (e) {
          logger.warn("Could not update app/index.ts");
        }
      }

      logger.info(`Zentify application '${name}' created successfully!`);
      logger.info(`Next steps:`);
      logger.info(`  cd ${name}`);
      logger.info(`  npm install`);
      logger.info(`  npm run dev`);
    } catch (error: any) {
      logger.error(`Error: ${error.message}`);
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
