import { describe, expect, it } from "vitest";
import { Readable } from "node:stream";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import { MultipartFile } from "../../src/parser/multipart_file";

function makeFile(contents: string): MultipartFile {
  return new MultipartFile(
    "data",
    "photo.png",
    "image/png",
    "7bit",
    Readable.from([Buffer.from(contents)]),
  );
}

function makeFileFromStrings(chunks: string[]): MultipartFile {
  return new MultipartFile(
    "data",
    "photo.png",
    "image/png",
    "7bit",
    Readable.from(chunks) as any,
  );
}

describe("MultipartFile", () => {
  it("exposes metadata", () => {
    const file = makeFile("x");
    expect(file.fieldname).toBe("data");
    expect(file.filename).toBe("photo.png");
    expect(file.mimetype).toBe("image/png");
    expect(file.encoding).toBe("7bit");
  });

  it("toBuffer returns the file contents and tracks size", async () => {
    const file = makeFile("hello");
    const buffer = await file.toBuffer();

    expect(buffer.toString()).toBe("hello");
    expect(file.size).toBe(5);
  });

  it("normalizes non-Buffer string chunks in stream and toBuffer", async () => {
    const file = makeFileFromStrings(["ab", "cd"]);

    expect(file.size).toBe(0);
    const buffer = await file.toBuffer();
    expect(buffer.toString()).toBe("abcd");
    expect(file.size).toBe(4);
  });

  it("throws if the stream is consumed twice", async () => {
    const file = makeFile("hello");
    await file.toBuffer();

    await expect(file.toBuffer()).rejects.toThrow(
      /already been consumed/,
    );
  });

  it("exposes the underlying stream", async () => {
    const file = makeFile("stream-data");
    const stream = file.stream();

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    expect(Buffer.concat(chunks).toString()).toBe("stream-data");
  });

  it("swallows errors emitted on the piped stream", async () => {
    const file = makeFile("x");
    const stream = file.stream();

    stream.destroy(new Error("boom"));

    await new Promise((resolve) => setImmediate(resolve));
    stream.resume();
  });

  it("does not double-count size on the transform", async () => {
    const file = makeFileFromStrings(["ab", "cd"]);
    expect(file.size).toBe(0);

    const stream = file.stream();
    stream.resume();
    await new Promise((resolve) => stream.once("end", resolve));
  });

  it("save writes the file to disk", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zentify-file-"));
    const target = path.join(dir, "nested", "out.txt");
    const file = makeFile("saved!");

    await file.save(target);

    expect(fs.readFileSync(target, "utf-8")).toBe("saved!");
    expect(file.size).toBe(6);
  });

  it("serializes to plain JSON", () => {
    const file = makeFile("x");
    expect(file.toJSON()).toEqual({
      fieldname: "data",
      filename: "photo.png",
      mimetype: "image/png",
      size: 0,
    });
  });
});