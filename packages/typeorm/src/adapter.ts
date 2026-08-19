import { DataSource, DataSourceOptions } from "typeorm";
import { TypeOrmAuthRepository } from "./auth_repository";
import {
  Route,
  getModuleMetadata,
  Zentify,
  ZentifyAdapter,
  Logger,
  ZentifyAdapterKind,
} from "@zentify/core";
import * as path from "path";

export class ZentifyTypeOrmAdapter implements ZentifyAdapter {
  public readonly name = "TypeOrmAdapter";
  public readonly kind: ZentifyAdapterKind = "database";
  private dataSource: DataSource;
  private readonly logger: Logger = new Logger({ context: "TypeOrmAdapter" });
  private app: Zentify | null = null;
  constructor(options: DataSourceOptions) {
    const rewrittenOptions = { ...options };

    if (!rewrittenOptions.entities) {
      rewrittenOptions.entities = ["./Models/**/*.{ts,js}"];
    }

    if (!rewrittenOptions.migrations) {
      rewrittenOptions.migrations = ["./Database/migrations/**/*.{ts,js}"];
    }

    const entryDir = path.dirname(process.argv[1]).replace(/\\/g, "/");

    const normalizePaths = (paths: any[]) => {
      return paths.map((p: any) => {
        if (typeof p === "string") {
          let normalizedPath = p.replace(/\\/g, "/");
          if (
            !normalizedPath.includes(":/") &&
            !normalizedPath.startsWith("/")
          ) {
            normalizedPath = path.posix.join(entryDir, normalizedPath);
          }
          return normalizedPath;
        }
        return p;
      });
    };

    if (Array.isArray(rewrittenOptions.entities)) {
      rewrittenOptions.entities = normalizePaths(rewrittenOptions.entities);
    }

    if (Array.isArray(rewrittenOptions.migrations)) {
      rewrittenOptions.migrations = normalizePaths(rewrittenOptions.migrations);
    }

    this.dataSource = new DataSource(rewrittenOptions);
  }

  async onInit(app: Zentify) {
    await this.dataSource.initialize();

    app.container.provide({
      token: "TYPEORM_DATA_SOURCE",
      useValue: this.dataSource,
    });

    app.container.provide({
      token: DataSource,
      useValue: this.dataSource,
    });
    const entities = this.dataSource.entityMetadatas.map((meta) => meta.target);
    const authRepo = entities.find((entity) => this.isAuthRepository(entity));
    if (authRepo) {
      app.container.provide({
        token: "AUTH_REPOSITORY",
        useValue: new TypeOrmAuthRepository(
          this.dataSource.getRepository(authRepo),
        ),
      });
    }
    this.app = app;
  }

  onModuleResolve(moduleMetadata: any, providerSet: Set<any>, container: any) {
    if (moduleMetadata.entities) {
      for (const entity of moduleMetadata.entities) {
        const entityName =
          typeof entity === "function"
            ? entity.name
            : (entity as any).options?.name || "Unknown";
        const token = `TYPEORM_REPOSITORY_${entityName}`;
        // Ensure the repository is in the global container
        if (!container.has(token)) {
          const repository = this.dataSource.getRepository(entity);

          container.provide({
            token,
            useValue: repository,
          });
        }

        // Add token to the module's allowed providers
        providerSet.add(token);
      }
    }
  }

  private isAuthRepository(target: any): boolean {
    return (
      typeof target.prototype?.getAuthIdentifier === "function" &&
      typeof target.prototype?.getAuthPassword === "function"
    );
  }

  async onMigrate(type: string) {
    if (type === "run") {
      this.logger.info(`Running migrations...`);
      const runMigrations = await this.dataSource.runMigrations();
      if (runMigrations && runMigrations.length > 0) {
        runMigrations.forEach((m) => this.logger.info(`Migrated: ${m.name}`));
      } else {
        this.logger.info(`No new migrations to run.`);
      }
    } else if (type === "revert") {
      let lastMigration: string | undefined;
      try {
        const migrationsTableName =
          this.dataSource.options.migrationsTableName || "migrations";
        const result = await this.dataSource.query(
          `SELECT name FROM ${migrationsTableName} ORDER BY id DESC LIMIT 1`,
        );
        if (result && result.length > 0) {
          lastMigration = result[0].name;
        }
      } catch (e) {
        // Ignore error if table doesn't exist yet
      }

      if (lastMigration) {
        this.logger.info(`Reverting migration: ${lastMigration}`);
      } else {
        this.logger.info(`Reverting last migration...`);
      }

      await this.dataSource.undoLastMigration();

      if (lastMigration) {
        this.logger.info(`Migration ${lastMigration} reverted.`);
      } else {
        this.logger.info(`Migration reverted.`);
      }
    } else if (type === "fresh") {
      this.logger.info(`Dropping database...`);
      await this.dataSource.dropDatabase();
      await this.dataSource.synchronize();
      this.logger.info(`Running migrations...`);
      const runMigrations = await this.dataSource.runMigrations();
      if (runMigrations && runMigrations.length > 0) {
        runMigrations.forEach((m) => this.logger.info(`Migrated: ${m.name}`));
      } else {
        this.logger.info(`No new migrations to run.`);
      }
    }
  }

  async onClose(app: Zentify) {
    try {
      this.logger.info(`Closing database connection...`);
      await this.dataSource.destroy();
      this.logger.info(`Database connection closed.`);
    } catch (error) {
      this.logger.error(
        `Failed to close database connection: ${(error as Error).message}`,
      );
    }
  }
}
