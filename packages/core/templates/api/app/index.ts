// Main app entry point
import { Route, Zentify } from "@zentify/core";

const app = new Zentify({
  routes: { web: "app/Routes/web.js" },
});

app.useStatic("dist/public");

// [[zentify:auth]]
// [[zentify:vite]]
// [[zentify:database]]

app.run();