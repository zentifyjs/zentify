// Main app entry point
import { Route, Zentify, render } from "@zentify/core";
import { ZentifyViteAdapter } from "@zentify/vite"

const app = new Zentify({
  routes: { web: "app/Routes/web.js" },
});

// Daftarkan View Engine
app.addAdapter(new ZentifyViteAdapter())

app.useStatic("dist/public");

app.run();