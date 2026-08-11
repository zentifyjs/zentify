import { IncomingMessage, ServerResponse } from "node:http";
import { AppContext } from "./app_context";
import { ZFile } from "../parser/body_parser";

export interface ZRequest extends IncomingMessage {
  body: unknown;
  context?: AppContext;

  params: Record<string, string>;
  query?: Record<string, string | string[]>;

  file(fieldname: string): Promise<ZFile | undefined>;

  files(fieldname?: string): Promise<ZFile[]>;
}

export interface ZResponse extends ServerResponse {
  json(data: unknown): void;
  body?: unknown;
}
