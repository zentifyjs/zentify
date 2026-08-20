import { Authenticatable, AuthRepository } from "@zentify/core";
import { PasswordHasher } from "./types/hasher";
import { AuthGuard } from "./types/guard";

export interface LoginResult<T extends Authenticatable> {
  user: T;
  token: string | null;
}

export class GuardInstance<T extends Authenticatable> {
  constructor(
    public readonly name: string,
    private readonly repository: AuthRepository<T>,
    private readonly guard: AuthGuard<T>,
    private readonly hasher: PasswordHasher,
  ) {}

  async attempt(credentials: Record<string, unknown>): Promise<boolean> {
    return (await this.login(credentials)) !== null;
  }

  async login(
    credentials: Record<string, unknown>,
  ): Promise<LoginResult<T> | null> {
    const { password, ...lookup } = credentials;

    const user = await this.repository.findByCredentials(lookup);

    if (!user) {
      return null;
    }

    if (password !== undefined) {
      if (!user.getAuthPassword) {
        throw new Error(
          `Authenticatable "${this.name}" must implement getAuthPassword().`,
        );
      }

      const valid = await this.hasher.verify(
        String(password),
        user.getAuthPassword(),
      );

      if (!valid) {
        return null;
      }
    }

    const token = (await this.guard.login(user, lookup)) ?? null;

    return { user, token };
  }

  async user(token?: string): Promise<T | null> {
    const identifier = await this.guard.getIdentifier(token);

    if (!identifier) {
      return null;
    }

    return this.repository.findByCredentials(identifier.lookup);
  }

  async check(token?: string): Promise<boolean> {
    return (await this.user(token)) !== null;
  }

  async logout(): Promise<void> {
    await this.guard.logout();
  }

  token(): string | undefined {
    return typeof this.guard.token === "function"
      ? this.guard.token()
      : undefined;
  }
}