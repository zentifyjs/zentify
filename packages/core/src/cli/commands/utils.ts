import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import * as path from "node:path";
import pc from "picocolors";
import { Logger } from "../../utils";

export function getTemplatesDir(): string {
  let dir = __dirname;
  while (true) {
    const candidate = path.join(dir, "templates");
    try {
      // Keep walking until we find the real templates dir (marker: tpls/ subfolder).
      // Avoids stopping at unrelated folders also named "templates" (e.g. src/cli/templates).
      if (fsSync.statSync(path.join(candidate, "tpls")).isDirectory()) return candidate;
    } catch {}
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error("Templates directory not found");
    }
    dir = parent;
  }
}

export async function generateFileFromTemplate(
  templateName: string,
  targetPath: string,
  replacements: Record<string, string>
) {
  const logger = new Logger({context: "utils"})
  try {
    const templatePath = path.join(getTemplatesDir(), "tpls", templateName);
    let content = await fs.readFile(templatePath, "utf-8");

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      content = content.replace(regex, value);
    }

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    
    // Check if file exists
    try {
      await fs.access(targetPath);
      logger.warn(`File ${targetPath} already exists. Skipping...`);
      return;
    } catch {
      // File does not exist, safe to write
    }

    await fs.writeFile(targetPath, content, "utf-8");
    logger.info(`Created ${targetPath}`);
  } catch (error: any) {
    logger.error(`Error generating file: ${error.message}`);
  }
}
