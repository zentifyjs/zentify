import { Route, Zify } from "./";
import { ZRequest, ZResponse } from "./core/types/message";

const app = new Zify({
  server: {
    port: 8001,
  },
});

Route.get("/", (req: ZRequest, res: ZResponse) => {
  return res.json({
    message: "Hello, World!",
  });
});
app.run();
