// Main app entry point
import { Route, Zentify, render } from "@zentify/core";
import { ZentifyViteAdapter } from "@zentify/vite"
import { ZentifyTypeOrmAdapter } from "@zentify/typeorm";

import "./Routes/web"

const app = new Zentify({
  server: { port: 3003 },
});

app.addAdapter(
  new ZentifyTypeOrmAdapter({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "",
    database: "zentify",
    entities: ["./Models/**/*.{ts,js}"],
    synchronize: true,
  })
);

// Daftarkan View Engine
app.addAdapter(new ZentifyViteAdapter({
  entry: "app/Views/main.tsx"
}))

app.useStatic("dist/public");

app.run();
