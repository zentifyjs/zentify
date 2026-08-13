#!/usr/bin/env node
import { Command } from "commander";
import { makeController } from "./commands/make-controller";
import { makeService } from "./commands/make-service";
import { makeModule } from "./commands/make-module";
import { makeModel } from "./commands/make-model";
import { makeApp } from "./commands/make-app";
import { devCommand } from "./commands/dev";
import { buildCommand } from "./commands/build";
import { startCommand } from "./commands/start";

const program = new Command();

program
  .name("zentify")
  .description("CLI for Zentify framework")
  .version("1.0.0");

import { makeMigration } from "./commands/make-migration";
import { makeSeeder } from "./commands/make-seeder";
import { dbSeed } from "./commands/db-seed";

program.addCommand(makeApp);
program.addCommand(makeController);
program.addCommand(makeService);
program.addCommand(makeModule);
program.addCommand(makeModel);
program.addCommand(makeMigration);
program.addCommand(makeSeeder);
program.addCommand(dbSeed);
program.addCommand(devCommand);
program.addCommand(buildCommand);
program.addCommand(startCommand);

program.parse();
