import { ZRequest } from "../types/message";
import { BodyParser } from "./body_parser";
import { readBody } from "./read_body";

export class TextBodyParser implements BodyParser {
  constructor(private readonly maxSize: number) {}

  public supports(contentType: string): boolean {
    return contentType.toLowerCase().includes("text/plain");
  }

  public async parse(req: ZRequest): Promise<unknown> {
    const body = await readBody(req, this.maxSize);

    return body.toString("utf8");
  }
}
