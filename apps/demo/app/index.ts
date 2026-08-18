// Main app entry point
import { Route, Zentify, render } from "@zentify/core";
import { ZentifyViteAdapter } from "@zentify/vite"
import { ZentifyTypeOrmAdapter } from "@zentify/typeorm";

import "./Routes/web"
import { AppConfig } from "./Config/AppConfig.js";

const app = new Zentify();

app.addAdapter({
  dependency: [AppConfig],
  useFactory: (config: AppConfig) => {
    return new ZentifyTypeOrmAdapter({
      type: "postgres",
      host: config.dbHost,
      port: config.dbPort,
      username: config.dbUsername,
      password: config.dbPassword,
      database: config.dbName,
      // entities: ["./Models/**/*.{ts,js}"],
      // migrations: ["./Database/Migrations/**/*.{ts,js}"]
    });
  },
});

// Daftarkan View Engine
app.addAdapter(new ZentifyViteAdapter({
  mode: "ssr",
  manifestPath: "dist/public/.vite/manifest.json",
  entry: "app/Views/main.tsx"
}))

app.useStatic("dist/public");

app.run();