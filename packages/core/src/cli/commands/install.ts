import { Command } from "commander";
import { listLayers, resolveLayerOnly } from "../templates/resolver";
import { installLayer, isLayerInstalled } from "../installer";
import { Logger } from "../../utils";

async function getProjectDeps(projectRoot: string): Promise<Record<string, string>> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    const pkg = JSON.parse(
      await fs.readFile(path.join(projectRoot, "package.json"), "utf-8")
    );
    return { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    return {};
  }
}

function getManualHint(filename: string, layerName: string): string | null {
  if (filename.endsWith("User.ts")) {
    return "Tambahkan getAuthIdentifier() { return this.email; } dan getAuthPassword() { return this.password; }";
  }
  if (filename.endsWith("web.ts")) {
    return "Tambahkan import AuthModule + Route.module(AuthModule)";
  }
  if (filename.endsWith("AppConfig.ts")) {
    return "Tambahkan @Env('DB_TYPE') dan field database lainnya";
  }
  return null;
}

function printResult(result: any, logger: Logger) {
  logger.info("\nRingkasan:");
  if (result.filesCreated.length) {
    logger.info(`  File baru: ${result.filesCreated.join(", ")}`);
  }
  if (result.filesSkipped.length) {
    logger.warn(`  File di-skip (sudah ada):`);
    for (const f of result.filesSkipped) {
      logger.warn(`    - ${f}`);
    }
  }
  if (result.depsAdded.length) {
    logger.info(`  Deps baru: ${result.depsAdded.join(", ")}`);
  }
  if (result.indexModified) {
    logger.info(`  app/index.ts updated`);
  }
}

export async function registerInstallCommands(program: Command) {
  const layers = await listLayers();

  for (const layer of layers) {
    if (layer.folder === "database") continue;

    const cmd = new Command(`${layer.folder}:install`)
      .description(`Install ${layer.name} ke project Zentify saat ini`)
      .option("-y, --yes", "Lewati konfirmasi")
      .option("-f, --force", "Force install meskipun sudah terpasang")
      .option("--skip-hooks", "Lewati adapter onInstall hook")
      .action(async (options) => {
        const logger = new Logger({ context: "install" });
        const projectRoot = process.cwd();

        if (!options.yes) {
          const deps = await getProjectDeps(projectRoot);
          const tpl = await resolveLayerOnly(layer.folder);
          if (tpl.adapterPackage && !(tpl.adapterPackage in deps)) {
            logger.error(
              `Adapter belum terinstall. Jalankan dulu:\n` +
              `  npm install ${tpl.adapterPackage}`
            );
            process.exit(1);
          }
        }

        const result = await installLayer(layer.folder, projectRoot, {
          skipHooks: options.skipHooks,
          force: options.force,
        });
        printResult(result, logger);

        if (result.filesSkipped.length) {
          logger.info("\nFile berikut perlu di-edit manual:");
          for (const f of result.filesSkipped) {
            const hint = getManualHint(f, layer.folder);
            if (hint) logger.info(`  ${f}: ${hint}`);
          }
        }
      });

    program.addCommand(cmd);
  }

  program.addCommand(
    new Command("install")
      .argument("<layer>", "Nama layer untuk diinstall")
      .option("-y, --yes", "Lewati konfirmasi")
      .option("-f, --force", "Force install meskipun sudah terpasang")
      .option("--skip-hooks", "Lewati adapter onInstall hook")
      .description("Install layer ke project Zentify saat ini")
      .action(async (layerName: string, options) => {
        const logger = new Logger({ context: "install" });
        const layers = await listLayers();
        const layer = layers.find(
          (l) => l.folder === layerName || l.name === layerName
        );
        if (!layer) {
          logger.error(
            `Layer '${layerName}' tidak ditemukan. ` +
            `Tersedia: ${layers.map((l) => l.folder).join(", ")}`
          );
          process.exit(1);
        }

        const projectRoot = process.cwd();
        if (!options.yes) {
          const deps = await getProjectDeps(projectRoot);
          const tpl = await resolveLayerOnly(layer.folder);
          if (tpl.adapterPackage && !(tpl.adapterPackage in deps)) {
            logger.error(
              `Adapter belum terinstall. Jalankan dulu:\n` +
              `  npm install ${tpl.adapterPackage}`
            );
            process.exit(1);
          }
        }

        const result = await installLayer(layer.folder, projectRoot, {
          skipHooks: options.skipHooks,
          force: options.force,
        });
        printResult(result, logger);

        if (result.filesSkipped.length) {
          logger.info("\nFile berikut perlu di-edit manual:");
          for (const f of result.filesSkipped) {
            const hint = getManualHint(f, layer.folder);
            if (hint) logger.info(`  ${f}: ${hint}`);
          }
        }
      })
  );
}
