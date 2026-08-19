export interface PasswordHasher {
  setConfig(config: { saltRounds: number }): void;
  hash(password: string): Promise<string>;

  verify(password: string, hash: string): Promise<boolean>;
}
