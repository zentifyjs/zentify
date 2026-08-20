import { describe, expect, it } from "vitest";
import { resolveTemplate } from "../../../src/cli/templates/resolver";

describe("resolveTemplate with the auth layer", () => {
  it("resolves deps, imports and bootstrap injection for database + auth", async () => {
    const tpl = await resolveTemplate("api", [
      "database-postgres",
      "auth",
    ]);

    expect(tpl.dependencies).toMatchObject({
      "@zentify/auth": "*",
      "@zentify/typeorm": "*",
      pg: expect.any(String),
    });

    expect(tpl.imports).toContain(
      'import { ZentifyAuthAdapter } from "@zentify/auth";',
    );
    expect(tpl.imports).toContain('import { User } from "./Models/User.js";');

    const injection = tpl.injections.find(
      (i) => i.marker === "// [[zentify:auth]]",
    );
    expect(injection).toBeDefined();
    expect(injection!.code).toContain("new ZentifyAuthAdapter(");
    expect(injection!.code).toContain('defaultGuard: "web"');
    expect(injection!.code).toContain('driver: "session"');
    expect(injection!.code).toContain("provider: User");
  });

  it("does not resolve the auth layer from a bare api template", async () => {
    const tpl = await resolveTemplate("api");
    expect(tpl.dependencies["@zentify/auth"]).toBeUndefined();
    expect(
      tpl.injections.find((i) => i.marker === "// [[zentify:auth]]"),
    ).toBeUndefined();
  });
});