import { DataSource, DataSourceOptions } from "typeorm";
import type { Zentify, ZentifyAdapter } from "@zentify/core";
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

    const entities = this.dataSource.entityMetadatas;
    for (const metadata of entities) {
      const entityName = metadata.name;
      const token = `TYPEORM_REPOSITORY_${entityName}`;
      
      const repository = this.dataSource.getRepository(metadata.target);
      
      app.container.provide({
        token,
        useValue: repository,
      });
    }
  }
}
