import { describe, expect, it } from "vitest";
import { Readable } from "node:stream";
import { MultipartParser } from "../../src/parser/multipart";
import { HttpException } from "../../src/exception/http";

const BOUNDARY = "----MultipartTestBoundary";

function makeRequest(payload: string): any {
  const req = Readable.from([Buffer.from(payload)]);
  return Object.assign(req, {
    method: "POST",
    url: "/upload",
    headers: {
      "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      host: "localhost",
    },
    context: { bodyParser: { maxSize: 1024 * 1024 } },
  });
}

function payload(
  parts: Array<{ kind: "field" | "file"; name: string; value?: string; filename?: string }>,
): string {
  const chunks: string[] = [];
  for (const part of parts) {
    chunks.push(`--${BOUNDARY}\r\n`);
    if (part.kind === "field") {
      chunks.push(`Content-Disposition: form-data; name="${part.name}"\r\n\r\n`);
      chunks.push(`${part.value}\r\n`);
    } else {
      chunks.push(
        `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"\r\n`,
      );
      chunks.push(`Content-Type: text/plain\r\n\r\n`);
      chunks.push(`${part.value}\r\n`);
    }
  }
  chunks.push(`--${BOUNDARY}--\r\n`);
  return chunks.join("");
}

describe("MultipartParser", () => {
  it("supports multipart/form-data content types", () => {
    const parser = new MultipartParser(1024);
    expect(parser.supports("multipart/form-data")).toBe(true);
    expect(parser.supports("MULTIPART/FORM-DATA; boundary=x")).toBe(true);
    expect(parser.supports("application/json")).toBe(false);
  });

  it("parses fields and files into a result", async () => {
    const parser = new MultipartParser(1024 * 1024);
    const result = await parser.parse(
      makeRequest(
        payload([
          { kind: "field", name: "title", value: "Hello" },
          { kind: "field", name: "tags", value: "a,b" },
          { kind: "file", name: "doc", filename: "notes.txt", value: "content" },
        ]),
      ),
    );

    const file = await result.file("doc");
    expect(file.filename).toBe("notes.txt");
    expect((await file.toBuffer()).toString()).toBe("content");

    await result.files();
    expect(result.body).toEqual({ title: "Hello", tags: "a,b" });

    const all = await result.files();
    expect(all).toHaveLength(1);
  });

  it("filters files by fieldname via files()", async () => {
    const parser = new MultipartParser(1024 * 1024);
    const result = await parser.parse(
      makeRequest(
        payload([
          { kind: "file", name: "a", filename: "a.txt", value: "A" },
          { kind: "file", name: "a", filename: "b.txt", value: "B" },
          { kind: "file", name: "c", filename: "c.txt", value: "C" },
        ]),
      ),
    );

    const onlyA = await result.files("a");
    expect(onlyA.map((f) => f.filename)).toEqual(["a.txt", "b.txt"]);

    await expect(result.files("missing")).rejects.toBeInstanceOf(HttpException);
    await expect(result.files("missing")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects with 404 when a requested file is never uploaded", async () => {
    const parser = new MultipartParser(1024 * 1024);
    const result = await parser.parse(
      makeRequest(payload([{ kind: "field", name: "only", value: "x" }])),
    );

    await expect(result.file("ghost")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects with 404 when file() is called after parsing finished", async () => {
    const parser = new MultipartParser(1024 * 1024);
    const result = await parser.parse(
      makeRequest(payload([{ kind: "field", name: "only", value: "x" }])),
    );

    await result.files();
    await expect(result.file("ghost")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("resolves file() from the already-collected files after finish", async () => {
    const parser = new MultipartParser(1024 * 1024);
    const result = await parser.parse(
      makeRequest(
        payload([{ kind: "file", name: "doc", filename: "notes.txt", value: "x" }]),
      ),
    );

    await result.files();
    const file = await result.file("doc");
    expect(file.filename).toBe("notes.txt");
  });

  it("rejects pending file waiters and finished promise on busboy error", async () => {
    const boundary = "----MultipartErrorBoundary";
    const malformed = Readable.from([
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="doc"; filename="big.txt"\r\n` +
          `Content-Type: text/plain\r\n\r\n` +
          `partial-content\r\n`,
      ),
    ]);
    const req = Object.assign(malformed, {
      method: "POST",
      url: "/upload",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        host: "localhost",
      },
      context: { bodyParser: { maxSize: 1024 * 1024, maxFiles: 20, maxFields: 100 } },
    });

    const parser = new MultipartParser(1024 * 1024);
    const result = await parser.parse(req);

    await expect(result.file("never-uploaded")).rejects.toMatchObject({
      message: "Unexpected end of form",
    });
    await expect(result.files()).rejects.toMatchObject({
      message: "Unexpected end of form",
    });
  });
});