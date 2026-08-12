// Main app entry point
import { Route, Zentify, render } from "@zentify/core";
import { ZentifyBridge } from "@zentify/bridge";
import "./Routes/web.js"
const app = new Zentify({
  server: { port: 3003 },
});

// Daftarkan View Engine
app.setViewEngine(
  new ZentifyBridge({
    entry: "app/Views/main.tsx",
    manifestPath: "./dist/public/.vite/manifest.json",
    isDev: false,
  })
);

app.useStatic("dist/public");

app.run();
