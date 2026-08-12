import { IncomingMessage } from "node:http";

import { HttpException } from "../exception/http";

export async function readBody(
  req: IncomingMessage,
  maxSize: number,
): Promise<Buffer> {
  const chunks: Buffer[] = [];

  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    size += buffer.length;

    if (size > maxSize) {
      throw new HttpException({
        statusCode: 413,
        message: "Request body too large",
      });
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}
