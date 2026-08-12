import * as fs from "node:fs/promises";
import * as path from "node:path";
import pc from "picocolors";

export async function generateFileFromTemplate(
  templateName: string,
  targetPath: string,
  replacements: Record<string, string>
) {
  try {
    const templatePath = path.resolve(__dirname, `../../../templates/${templateName}`);
    let content = await fs.readFile(templatePath, "utf-8");

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      content = content.replace(regex, value);
    }

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    
    // Check if file exists
    try {
      await fs.access(targetPath);
      console.log(pc.yellow(`File ${targetPath} already exists. Skipping...`));
      return;
    } catch {
      // File does not exist, safe to write
    }

    await fs.writeFile(targetPath, content, "utf-8");
    console.log(pc.green(`✔ Created ${targetPath}`));
  } catch (error: any) {
    console.error(pc.red(`Error generating file: ${error.message}`));
  }
}
