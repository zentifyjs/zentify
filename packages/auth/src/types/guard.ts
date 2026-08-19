import { Authenticatable } from "@zentify/core";

export interface AuthGuard<T extends Authenticatable = Authenticatable> {
  login(user: T, lookup: Record<string, unknown>): Promise<void>;

  getIdentifier(): Promise<{
    identifier: string;
    lookup: Record<string, unknown>;
  } | null>;

  logout(): Promise<void>;
}
