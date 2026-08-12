import { HttpException } from "../exception/http";
import { ZRequest } from "../types/message";
import { BodyParser } from "./body_parser";
import { readBody } from "./read_body";

export class JsonBodyParser implements BodyParser {
  constructor(private readonly maxSize: number) {}

  public supports(contentType: string): boolean {
    return contentType.toLowerCase().includes("application/json");
  }

  public async parse(req: ZRequest): Promise<unknown> {
    const body = await readBody(req, this.maxSize);

    if (body.length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(body.toString("utf8"));
    } catch {
      throw new HttpException({
        statusCode: 400,
        message: "Invalid JSON body",
      });
    }
  }
}
