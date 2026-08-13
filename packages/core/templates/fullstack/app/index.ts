// Main app entry point
import { Route, Zentify, render } from "@zentify/core";
import { ZentifyViteAdapter } from "@zentify/vite"

import "./Routes/web.js"

const app = new Zentify({
  server: { port: 3003 },
});

// Daftarkan View Engine
app.addAdapter(new ZentifyViteAdapter({
  entry: "app/Views/main.tsx"
}))

app.useStatic("dist/public");

app.run();
