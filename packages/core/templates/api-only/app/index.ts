// Main app entry point
import { Zentify } from "@zentify/core";

const app = new Zentify({
  routes: { web: "app/Routes/web.js" },
});

app.useStatic("dist/public");

app.run();