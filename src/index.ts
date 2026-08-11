import "reflect-metadata";

import { Zify } from "./core";
import { Middleware } from "./core/middleware";
import { ZRequest, ZResponse } from "./core/types/message";
import { Logger } from "./core/utils";
import "./routes";
import { FileController } from "./test/file";

class LoggerMiddleware implements Middleware {
  private logger = new Logger({
    context: "LoggerMiddleware",
  });
  async handle(req: ZRequest, res: ZResponse, next: () => Promise<void>) {
    this.logger.info(`Incoming request: ${req.method} ${req.url}`);
    await next();
    this.logger.info(`Response sent for: ${req.method} ${req.url}`);
  }
}

const app = new Zify({
  server: {},
});
app.addMiddleware(new LoggerMiddleware());
app.run();
