import { Authenticatable } from "@zentify/core";

export interface AuthGuard<T extends Authenticatable = Authenticatable> {
  login(user: T): Promise<void>;

  getIdentifier(): Promise<string | null>;

  logout(): Promise<void>;
}
