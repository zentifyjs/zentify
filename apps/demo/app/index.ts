// Main app entry point
import { Route, Zentify, render } from "@zentify/core";
import { ZentifyViteAdapter } from "@zentify/vite";
import { ZentifyTypeOrmAdapter } from "@zentify/typeorm";
import { ZentifyAuthAdapter } from "@zentify/auth";
import { AppConfig } from "./Config/AppConfig.js";
import { User } from "./Models/User.js";
import { Admin } from "./Models/Admin.js";

const app = new Zentify({
  routes: { web: "app/Routes/web.js" },
});

app.addAdapter(
  new ZentifyAuthAdapter({
    defaultGuard: "web",
    passwordHasher: "bcrypt",
    guards: {
      web: {
        driver: "session",
        provider: User,
      },
      admin: {
        driver: "session",
        provider: Admin,
      },
    },
  }),
);

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
      synchronize: true,
      // entities: ["./Models/**/*.{ts,js}"],
      // migrations: ["./Database/Migrations/**/*.{ts,js}"]
    });
  },
});

// Daftarkan View Engine
app.addAdapter(new ZentifyViteAdapter());

app.useStatic("dist/public");

app.run();
