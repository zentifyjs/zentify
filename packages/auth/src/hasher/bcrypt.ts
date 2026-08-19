import { PasswordHasher } from "../types/hasher";
import * as bcrypt from "bcrypt";
export class BcryptHasher implements PasswordHasher {
  private saltRounds: number = 12;
  setConfig(config: { saltRounds: number }): void {
    this.saltRounds = config.saltRounds;
  }

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
