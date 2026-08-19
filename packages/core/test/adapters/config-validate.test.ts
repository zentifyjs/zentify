import { describe, expect, it, afterEach, vi } from "vitest";
import { ConfigService } from "../../src/adapters/config/config.service";
import { Env, Configuration } from "../../src/decorators/config";

@Configuration()
class RequiresSecret {
  @Env("SUPER_SECRET_API_KEY")
  apiKey!: string;
}

describe("ConfigService validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SUPER_SECRET_API_KEY;
  });

  it("exits when a required env is missing", () => {
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    delete process.env.SUPER_SECRET_API_KEY;

    ConfigService.load();

    expect(exit).toHaveBeenCalledWith(1);
  });
});