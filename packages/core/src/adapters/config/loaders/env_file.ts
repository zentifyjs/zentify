import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import type { ConfigLoader } from "../types";

export class EnvFileConfigLoader implements ConfigLoader {
  name = "EnvFileConfigLoader";
  priority = 100;

  load(): Record<string, string> {
    const cwd = process.cwd();
    const mode = process.env.NODE_ENV;

    const files = [".env", ".env.local"];
    if (mode) files.push(`.env.${mode}`, `.env.${mode}.local`);

    const merged: Record<string, string> = {};
    for (const file of files) {
      const abs = path.join(cwd, file);
      if (fs.existsSync(abs)) {
        Object.assign(merged, dotenv.parse(fs.readFileSync(abs)));
      }
    }
    return merged;
  }
}
