import { Inject } from "@zentify/core";
import type { ObjectLiteral, EntityTarget } from "typeorm";

export function Repository<Entity extends ObjectLiteral>(
  entity: EntityTarget<Entity>
) {
  const entityName = typeof entity === "function" ? entity.name : (entity as any).options?.name || "Unknown";
  const token = `TYPEORM_REPOSITORY_${entityName}`;
  
  return Inject(token);
}
