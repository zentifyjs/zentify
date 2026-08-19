// core/body-parser/multipart-file.ts

import { Readable, Transform } from "node:stream";
import { ZFile } from "./body_parser";

export class MultipartFile implements ZFile {
  public size = 0;

  private consumed = false;

  constructor(
    public readonly fieldname: string,
    public readonly filename: string,
    public readonly mimetype: string,
    public readonly encoding: string,
    private readonly readable: Readable,
  ) {
    const counter = new Transform({
      transform: (chunk, _encoding, callback) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

        this.size += buffer.length;

        callback(null, chunk);
      },
    });

    this.readable = readable.pipe(counter);
    // The busboy error handler in MultipartParser already rejects the
    // pending file waiters; avoid crashing on the unhandled stream error.
    readable.on("error", () => {});
    this.readable.on("error", () => {});
  }

  public stream(): Readable {
    return this.readable;
  }

  public async toBuffer(): Promise<Buffer> {
    if (this.consumed) {
      throw new Error("File stream has already been consumed");
    }

    this.consumed = true;

    const chunks: Buffer[] = [];

    for await (const chunk of this.readable) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

      chunks.push(buffer);
    }

    return Buffer.concat(chunks);
  }

  public async save(path: string): Promise<void> {
    const fs = await import("node:fs/promises");
    const nodePath = await import("node:path");
    const { pipeline } = await import("node:stream/promises");

    await fs.mkdir(nodePath.dirname(path), {
      recursive: true,
    });

    await pipeline(
      this.readable,
      await fs.open(path, "w").then((file) => file.createWriteStream()),
    );
  }

  public toJSON() {
    return {
      fieldname: this.fieldname,
      filename: this.filename,
      mimetype: this.mimetype,
      size: this.size,
    };
  }
}
