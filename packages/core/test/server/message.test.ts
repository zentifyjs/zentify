import { describe, expect, it, vi } from "vitest";
import { Readable } from "node:stream";
import { enhanceRequest, enhanceResponse } from "../../src/server/message";
import { HttpException } from "../../src/exception/http";

function makeIncoming(body: Buffer | string, method = "POST") {
  const stream = Readable.from(
    Buffer.isBuffer(body) ? [body] : [Buffer.from(body)],
  );
  return Object.assign(stream, {
    method,
    url: "/users?page=2",
    headers: { "content-type": "application/json", host: "localhost" },
    context: { bodyParser: { maxSize: 1024 * 1024 } },
  }) as any;
}

describe("enhanceResponse", () => {
  function makeResponse() {
    const setHeader = vi.fn();
    const end = vi.fn();
    return { setHeader, end };
  }

  it("attaches a json method that serializes data", () => {
    const { setHeader, end } = makeResponse();
    const enhanced = enhanceResponse({ setHeader, end } as any);

    enhanced.json({ hello: "world" });

    expect(setHeader).toHaveBeenCalledWith("Content-Type", "application/json");
    expect(end).toHaveBeenCalledWith('{"hello":"world"}');
    expect(enhanced.body).toEqual({ hello: "world" });
  });

  it("throws a 500 HttpException on circular structures", () => {
    const { setHeader, end } = makeResponse();
    const enhanced = enhanceResponse({ setHeader, end } as any);

    const circular: any = { a: 1 };
    circular.self = circular;

    expect(() => enhanced.json(circular)).toThrow(HttpException);
    expect(() => enhanced.json(circular)).toThrow(/circular/);
  });

  it("rethrows non-circular serialization errors", () => {
    const { setHeader, end } = makeResponse();
    const enhanced = enhanceResponse({ setHeader, end } as any);

    const error = new Error("boom");
    const bad = {
      toJSON: () => {
        throw error;
      },
    };

    expect(() => enhanced.json(bad)).toThrow(error);
  });

  it("rethrows plain TypeErrors that are not circular", () => {
    const { setHeader, end } = makeResponse();
    const enhanced = enhanceResponse({ setHeader, end } as any);

    const bigintValue = { big: 10n };
    expect(() => enhanced.json(bigintValue)).toThrow(TypeError);
    expect(() => enhanced.json(bigintValue)).not.toThrow(/circular/);
  });
});

describe("enhanceRequest", () => {
  it("returns undefined body for GET requests and initializes fields", async () => {
    const req = makeIncoming("", "GET");
    const enhanced = await enhanceRequest(req, req.context);

    expect(enhanced.body).toBeUndefined();
    expect(enhanced.params).toEqual({});
    expect(enhanced.query).toEqual({});
    expect(enhanced.context).toEqual(req.context);
  });

  it("parses a JSON body for POST requests", async () => {
    const req = makeIncoming('{"name":"raja"}', "POST");
    const enhanced = await enhanceRequest(req, req.context);

    expect(enhanced.body).toEqual({ name: "raja" });
  });

  it("keeps urlencoded parsed body flat", async () => {
    const req = Readable.from([Buffer.from("a=1&b=two")]);
    const incoming = Object.assign(req, {
      method: "POST",
      url: "/x",
      headers: { "content-type": "application/x-www-form-urlencoded", host: "h" },
      context: {},
    });

    const enhanced = await enhanceRequest(incoming, incoming.context);
    expect(enhanced.body).toEqual({ a: "1", b: "two" });
  });

  it("returns undefined body when no parser matches and method is not GET", async () => {
    const req = Readable.from([Buffer.from("hello")]);
    const incoming = Object.assign(req, {
      method: "POST",
      url: "/x",
      headers: { "content-type": "application/xml", host: "h" },
      context: {},
    });

    const enhanced = await enhanceRequest(incoming, incoming.context);
    expect(enhanced.body).toBeUndefined();
  });

  it("falls back to empty contentType and context when missing", async () => {
    const req = Readable.from([Buffer.from("no-type")]);
    const incoming = Object.assign(req, {
      method: "POST",
      url: "/x",
      headers: { host: "h" },
    });

    const enhanced = await enhanceRequest(incoming, undefined as any);
    expect(enhanced.body).toBeUndefined();
  });

  it("splits multipart results into file, files and body", async () => {
    const boundary = "----TestBoundary123";
    const payload = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n` +
        `My Title\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file1"; filename="a.txt"\r\n` +
        `Content-Type: text/plain\r\n\r\n` +
        `file contents\r\n` +
        `--${boundary}--\r\n`,
    );

    const req = Readable.from([payload]);
    const incoming = Object.assign(req, {
      method: "POST",
      url: "/upload",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        host: "localhost",
      },
      context: {},
    });

    const enhanced = await enhanceRequest(incoming, incoming.context);

    expect(typeof enhanced.file).toBe("function");
    expect(typeof enhanced.files).toBe("function");

    const file = await enhanced.file("file1");
    expect(file.filename).toBe("a.txt");
    expect((await file.toBuffer()).toString()).toBe("file contents");

    await enhanced.files();
    expect(enhanced.body).toEqual({ title: "My Title" });
  });
});