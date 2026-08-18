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

  routes?: {
    /** Route module path, resolved from the configured output dir (zentify.json `outDir`), e.g. "app/Routes/web.js". */
    web?: string;
    /** API route module path, resolved from the configured output dir (zentify.json `outDir`), e.g. "app/Routes/api.js". */
    api?: string;
  };
};