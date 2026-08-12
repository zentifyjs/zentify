import {
  JsonBodyParser,
  TextBodyParser,
  UrlEncodedBodyParser,
} from "../parser";
import { BodyParser } from "../parser/body_parser";
import { MultipartParser } from "../parser/multipart";

const PARSER_REGISTRY: Record<string, any> = {
  "application/json": JsonBodyParser,
  "application/x-www-form-urlencoded": UrlEncodedBodyParser,
  "text/plain": TextBodyParser,
  "multipart/form-data": MultipartParser, // MultipartBodyParser is handled separately
};

export function getBodyParser(
  contentType: string | undefined,
  maxSize: number,
): BodyParser | undefined {
  if (!contentType) {
    return undefined;
  }
  return Object.entries(PARSER_REGISTRY).reduce(
    (parser, [key, ParserClass]) => {
      if (contentType.toLowerCase().includes(key)) {
        return new ParserClass(maxSize);
      }
      return parser;
    },
    undefined as BodyParser | undefined,
  );
}
