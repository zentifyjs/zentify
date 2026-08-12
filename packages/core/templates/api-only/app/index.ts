// Main app entry point
import { Zify } from "@zify/core";
import "./Routes/web.js"
const app = new Zify({
  server: { port: 3003 },
});

app.useStatic("dist/public");

app.run();
