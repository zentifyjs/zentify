import { ZRequest } from "../types/message";
import { BodyParser } from "./body_parser";
import { readBody } from "./read_body";

export class UrlEncodedBodyParser implements BodyParser {
  constructor(private readonly maxSize: number) {}

  public supports(contentType: string): boolean {
    return contentType
      .toLowerCase()
      .includes("application/x-www-form-urlencoded");
  }

  public async parse(req: ZRequest): Promise<unknown> {
    const body = await readBody(req, this.maxSize);

    if (body.length === 0) {
      return {};
    }

    return Object.fromEntries(new URLSearchParams(body.toString("utf8")));
  }
}
