export interface ConfigLoader {
  /** Unique identifier for logging */
  name: string;
  /** Lower runs first; later loaders override earlier ones. Default 0. */
  priority?: number;
  /** Synchronous load of env pairs. Called once at boot. */
  load(): Record<string, string>;
}
