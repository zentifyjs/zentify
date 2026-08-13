// Main app entry point
import { Zentify } from "@zentify/core";
import "./Routes/web.js"

const app = new Zentify({
  server: { port: 3003 },
});

app.useStatic("dist/public");

app.run();
