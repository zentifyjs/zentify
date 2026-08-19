export interface AuthRepository<T> {
  findById(identifier: string): Promise<T | null>;

  findByCredentials(credentials: Record<string, unknown>): Promise<T | null>;
}

export interface Authenticatable {
  getAuthIdentifier(): string;
  getAuthPassword?(): string;
}
