import { Readable } from "node:stream";
import { ZRequest } from "../types/message";

export interface BodyParser {
  supports(contentType: string | undefined): boolean;
  parse(req: ZRequest): Promise<unknown>;
}

export interface ZFile {
  fieldname: string;
  filename: string;
  mimetype: string;
  encoding: string;
  size: number;

  stream(): Readable;

  toBuffer(): Promise<Buffer>;

  save(path: string): Promise<void>;
}

export type MultipartParserResult = {
  body: Record<string, string>;
  files: (fieldName?: string) => Promise<ZFile[]>;
  file: (fieldName: string) => Promise<ZFile | undefined>;
};
