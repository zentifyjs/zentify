import { DataSource, DataSourceOptions } from "typeorm";
import { Route, getModuleMetadata, Zentify, ZentifyAdapter } from "@zentify/core";
import * as path from "path";

export class ZentifyTypeOrmAdapter implements ZentifyAdapter {
  public readonly name = "TypeOrmAdapter";
  private dataSource: DataSource;

  constructor(options: DataSourceOptions) {
    const rewrittenOptions = { ...options };

    if (Array.isArray(rewrittenOptions.entities)) {
      const entryDir = path.dirname(process.argv[1]).replace(/\\/g, '/');
      rewrittenOptions.entities = rewrittenOptions.entities.map((entity: any) => {
        if (typeof entity === 'string') {
          let normalizedPath = entity.replace(/\\/g, '/');
          
          if (!normalizedPath.includes(':/') && !normalizedPath.startsWith('/')) {
            normalizedPath = path.posix.join(entryDir, normalizedPath);
          }
          
          return normalizedPath;
        }
        return entity;
      });
    }

    this.dataSource = new DataSource(rewrittenOptions);
  }

  async onInit(app: Zentify) {
    await this.dataSource.initialize();
    
    app.container.provide({
      token: "TYPEORM_DATA_SOURCE",
      useValue: this.dataSource,
    });
  }

  onModuleResolve(moduleMetadata: any, providerSet: Set<any>, container: any) {
    if (moduleMetadata.entities) {
      for (const entity of moduleMetadata.entities) {
        const entityName = typeof entity === "function" ? entity.name : (entity as any).options?.name || "Unknown";
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
}
