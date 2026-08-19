import type { ObjectLiteral, Repository } from "typeorm";

import type { AuthRepository } from "@zentify/core";

export class TypeOrmAuthRepository<
  T extends ObjectLiteral,
> implements AuthRepository<T> {
  constructor(private readonly repository: Repository<T>) {}

  async findById(identifier: string) {
    return this.repository.findOne({
      where: {
        id: identifier,
      } as any,
    });
  }

  async findByCredentials(credentials: Record<string, unknown>) {
    return this.repository.findOne({
      where: credentials as any,
    });
  }
}
