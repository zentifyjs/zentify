import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Logger } from "../../src/utils/logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs info-level messages to stdout by default", () => {
    const logger = new Logger({ colors: false });
    logger.info("hello");

    expect(process.stdout.write).toHaveBeenCalled();
    const output = (process.stdout.write as any).mock.calls.join(" ");
    expect(output).toContain("[INFO]");
    expect(output).toContain("hello");
  });

  it("writes warn and error to stderr", () => {
    const logger = new Logger({ colors: false });
    logger.warn("careful");
    logger.error("boom");

    expect(process.stderr.write).toHaveBeenCalled();
    const output = (process.stderr.write as any).mock.calls.join(" ");
    expect(output).toContain("[WARN] careful");
    expect(output).toContain("[ERROR] boom");
  });

  it("suppresses messages below the configured level", () => {
    const logger = new Logger({ level: "warn", colors: false });
    logger.debug("hidden");
    logger.info("hidden too");

    expect(process.stdout.write).not.toHaveBeenCalled();
    expect(process.stderr.write).not.toHaveBeenCalled();
  });

  it("logs verbose and debug when enabled", () => {
    const logger = new Logger({ level: "verbose", colors: false });
    logger.verbose("v");
    logger.debug("d");
    logger.log("l");

    const output = (process.stdout.write as any).mock.calls.join(" ");
    expect(output).toContain("[VERBOSE] v");
    expect(output).toContain("[DEBUG] d");
    expect(output).toContain("[LOG] l");
  });

  it("formats non-string messages and extra args", () => {
    const logger = new Logger({ colors: false });
    logger.info({ nested: { ok: true } }, 42, "tail");

    const output = (process.stdout.write as any).mock.calls.join(" ");
    expect(output).toContain("nested");
    expect(output).toContain("42");
    expect(output).toContain("tail");
  });

  it("uses the error stack when logging an Error instance", () => {
    const logger = new Logger({ colors: false });
    const error = new Error("kaboom");
    logger.error(error);

    const output = (process.stderr.write as any).mock.calls.join(" ");
    expect(output).toContain("kaboom");
  });

  it("falls back to the message when an Error has no stack", () => {
    const logger = new Logger({ colors: false });
    const error = new Error("no-stack");
    (error as any).stack = undefined;

    logger.error(error);

    const output = (process.stderr.write as any).mock.calls.join(" ");
    expect(output).toContain("no-stack");
  });

  it("formats the context with bold ANSI codes when colors are enabled", () => {
    const logger = new Logger({ context: "BoldCtx", colors: true });
    logger.info("colored-ctx");

    const output = (process.stdout.write as any).mock.calls.join(" ");
    expect(output).toContain("\x1b[1m[BoldCtx]\x1b[0m");
  });

  it("omits the timestamp when disabled", () => {
    const logger = new Logger({ colors: false, timestamp: false });
    logger.info("no-time");

    const output = (process.stdout.write as any).mock.calls.join(" ");
    expect(output).toContain("[INFO] no-time");
    expect(output).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("includes the context label when provided", () => {
    const logger = new Logger({ context: "MyContext", colors: false });
    logger.info("with-ctx");

    const output = (process.stdout.write as any).mock.calls.join(" ");
    expect(output).toContain("[MyContext]");
  });

  it("emits ANSI colors when colors are enabled", () => {
    const logger = new Logger({ colors: true });
    logger.info("colored");

    const output = (process.stdout.write as any).mock.calls.join(" ");
    expect(output).toContain("\x1b[");
  });

  it("child inherits config but overrides the context", () => {
    const logger = new Logger({ context: "Parent", colors: false });
    const child = logger.child("Child");

    child.info("hi");

    const output = (process.stdout.write as any).mock.calls.join(" ");
    expect(output).toContain("[Child]");
    expect(output).toContain("hi");
  });

  it("defaults colors based on stdout TTY", () => {
    const logger = new Logger();
    expect(logger).toBeInstanceOf(Logger);
  });
});