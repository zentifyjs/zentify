import { afterEach, describe, expect, it } from "vitest";
import {
  Controller,
  Dependency,
  Get,
  Post,
} from "@zentify/core";
import { createTestApp, type TestApp } from "../src";

let app: TestApp | undefined;

async function launch(options: Parameters<typeof createTestApp>[0] = {}) {
  app = await createTestApp(options);
  return app;
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

@Controller({ path: "health" })
class HealthController {
  @Get()
  index() {
    return { status: "ok" };
  }
}

@Dependency()
class GreetingService {
  greet(name: string) {
    return `hi ${name}`;
  }
}

@Controller({ path: "greet" })
class GreetController {
  constructor(private readonly greetingService: GreetingService) {}

  @Get()
  index() {
    return { msg: this.greetingService.greet("raja") };
  }
}

@Controller({ path: "alpha" })
class AlphaController {
  @Get()
  index() {
    return { route: "alpha" };
  }
}

@Controller({ path: "beta" })
class BetaController {
  @Get()
  index() {
    return { route: "beta" };
  }
}

@Controller({ path: "echo" })
class EchoController {
  @Post()
  echo() {
    return { method: "POST" };
  }
}

describe("createTestApp", () => {
  it("starts on an ephemeral port and serves routes", async () => {
    const a = await launch({ controllers: [HealthController] });

    expect(a.port).toBeGreaterThan(0);
    const res = await fetch(`${a.url}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("resolves module-scoped providers into controllers", async () => {
    const a = await launch({
      controllers: [GreetController],
      providers: [GreetingService],
    });

    const res = await fetch(`${a.url}/greet`);
    expect(await res.json()).toEqual({ msg: "hi raja" });
  });

  it("resets route state between apps", async () => {
    await launch({ controllers: [AlphaController] });

    const b = await createTestApp({ controllers: [BetaController] });

    const missing = await fetch(`${b.url}/alpha`);
    expect(missing.status).toBe(404);
    const present = await fetch(`${b.url}/beta`);
    expect(present.status).toBe(200);

    await b.close();
  });

  it("runs the server only once for a single app", async () => {
    const a = await launch({ controllers: [HealthController] });

    const res = await fetch(`${a.url}/health`);
    expect(res.status).toBe(200);
  });

  it("preserves app context defaults", async () => {
    const a = await launch({
      controllers: [HealthController],
      context: { bodyParser: { maxSize: 4 * 1024 * 1024 } },
    });

    expect(a.app.context.bodyParser?.maxSize).toBe(4 * 1024 * 1024);
  });

  it("close() stops the HTTP server", async () => {
    const a = await launch({ controllers: [HealthController] });
    const port = a.port;

    await a.close();

    await expect(fetch(`http://localhost:${port}/health`)).rejects.toThrow();
  });

  it("supports POST routes", async () => {
    const a = await launch({ controllers: [EchoController] });

    const res = await fetch(`${a.url}/echo`, { method: "POST" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ method: "POST" });
  });
});