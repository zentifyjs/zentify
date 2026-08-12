// Main app entry point
import { Route, Zify, render } from "@zify/core";
import { ZifyBridge } from "@zify/bridge";
import "./Routes/web.js"
const app = new Zify({
  server: { port: 3003 },
});

// Daftarkan View Engine
app.setViewEngine(
  new ZifyBridge({
    entry: "app/Views/main.tsx",
    manifestPath: "./dist/public/.vite/manifest.json",
    isDev: false,
  })
);

app.useStatic("dist/public");

app.run();
