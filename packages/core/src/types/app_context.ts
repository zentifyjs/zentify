import type { ConfigLoader } from "../adapters/config/types";

export type AppContext = {
  server?: {
    port?: number;
    host?: string;
  };

  bodyParser?: {
    maxSize?: number;
    maxFiles?: number;
    maxFields?: number;
  };

  config?: {
    loaders?: ConfigLoader[];
  };
};