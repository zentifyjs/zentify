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
};
