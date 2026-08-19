import { Authenticatable, AuthRepository } from "@zentify/core";
import { PasswordHasher } from "./types/hasher";
import { AuthGuard } from "./types/guard";

export class AuthManager<T extends Authenticatable> {
  constructor(
    private readonly repository: AuthRepository<T>,
    private readonly guard: AuthGuard<T>,
    private readonly hasher: PasswordHasher,
  ) {}

  async attempt(credentials: Record<string, unknown>): Promise<boolean> {
    const { password, ...lookup } = credentials;

    const user = await this.repository.findByCredentials(lookup);

    if (!user) {
      return false;
    }

    const valid = await this.hasher.verify(
      String(password),
      user.getAuthPassword!(),
    );

    if (!valid) {
      return false;
    }

    await this.guard.login(user);

    return true;
  }

  async user(): Promise<T | null> {
    const identifier = await this.guard.getIdentifier();

    if (!identifier) {
      return null;
    }

    return this.repository.findById(identifier);
  }

  async hashPassword(password: string): Promise<string> {
    return this.hasher.hash(password);
  }

  async check(): Promise<boolean> {
    return (await this.user()) !== null;
  }

  async logout(): Promise<void> {
    await this.guard.logout();
  }
}
