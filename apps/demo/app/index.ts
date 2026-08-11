// Main app entry point
import { Route, Zify, render } from "zify";
import { ZifyBridge } from "@zify/bridge";
import "./Routes/web"
const app = new Zify({
  server: { port: 3000 },
});

// Daftarkan View Engine
app.setViewEngine(
  new ZifyBridge({
    entry: "app/Views/main.tsx",
    isDev: true,
  })
);

app.run();
