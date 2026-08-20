import { Authenticatable } from "@zentify/core";
import { PasswordHasher } from "./types/hasher";
import { GuardInstance } from "./guard_instance";

export class AuthManager<T extends Authenticatable = Authenticatable> {
  constructor(
    private readonly defaultGuardName: string,
    private readonly guards: Record<string, GuardInstance<any>>,
    private readonly hasher: PasswordHasher,
  ) {}

  guard<G extends Authenticatable = T>(name?: string): GuardInstance<G> {
    const guardName = name ?? this.defaultGuardName;
    const instance = this.guards[guardName];

    if (!instance) {
      throw new Error(
        `Auth guard "${guardName}" is not registered. ` +
          `Available guards: ${Object.keys(this.guards).join(", ")}.`,
      );
    }

    return instance as GuardInstance<G>;
  }

  hashPassword(password: string): Promise<string> {
    return this.hasher.hash(password);
  }

  async attempt(credentials: Record<string, unknown>): Promise<boolean> {
    return this.guard().attempt(credentials);
  }

  async login(
    credentials: Record<string, unknown>,
  ): Promise<ReturnType<GuardInstance<Authenticatable>["login"]>> {
    return this.guard().login(credentials);
  }

  async user(): Promise<T | null> {
    return this.guard<T>().user();
  }

  async check(): Promise<boolean> {
    return this.guard().check();
  }

  token(): string | undefined {
    return this.guard().token();
  }

  async logout(): Promise<void> {
    return this.guard().logout();
  }
}