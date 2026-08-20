import { describe, expect, it } from "vitest";
import { createConnection, type Socket } from "node:net";
import { AsyncLocalStorage } from "node:async_hooks";
import { HttpServer } from "../../src/server/http";
import { Container } from "../../src/dependencies";
import { REQUEST_CONTEXT } from "../../src/constants";
import { ZentifyHttpContextService } from "../../src/adapters";

describe("HttpServer.stop", () => {
  it("resolves even with an open keep-alive connection", async () => {
    const container = new Container();
    container.provideGlobal({
      token: REQUEST_CONTEXT,
      useValue: new ZentifyHttpContextService(
        new AsyncLocalStorage<any>(),
      ),
    });

    const server = new HttpServer(container, {
      server: { port: 0, host: "127.0.0.1" },
    });
    const port = await server.start();
    expect(port).toBeGreaterThan(0);

    const sock: Socket = createConnection({ port, host: "127.0.0.1" });
    await new Promise<void>((resolve, reject) => {
      sock.once("connect", resolve);
      sock.once("error", reject);
    });

    sock.write("GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: keep-alive\r\n\r\n");
    await new Promise((r) => setTimeout(r, 100));

    try {
      const result = await Promise.race([
        server.stop().then(() => "resolved" as const),
        new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 3000)),
      ]);
      expect(result).toBe("resolved");
    } finally {
      sock.destroy();
    }
  });
});
