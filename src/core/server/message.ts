import { IncomingMessage, ServerResponse } from "node:http";
import { HttpException } from "../exception/http";
import { AppContext } from "../types/app_context";
import { getBodyParser } from "../constants";
import { ZRequest, ZResponse } from "../types/message";
import { assertJsonSerializable } from "../utils";

export function enhanceResponse(res: ServerResponse): ZResponse {
  const response = res as ZResponse;

  response.json = (data: unknown) => {
    assertJsonSerializable(data);
    response.body = data;

    response.setHeader("Content-Type", "application/json");

    response.end(JSON.stringify(data));
  };

  return response;
}

export async function enhanceRequest(
  req: IncomingMessage,
  appContext: AppContext,
): Promise<ZRequest> {
  const request = req as ZRequest;

  request.context = appContext;
  request.params = {};
  request.query = {};
  const body = await parseBody(request);
  if (body && Object.hasOwn(body, "file") && Object.hasOwn(body, "files")) {
    request.file = (body as any).file;
    request.files = (body as any).files;
    request.body = (body as any).body;
  } else {
    request.body = body;
  }

  return request;
}

async function parseParams(req: ZRequest) {
  const url = new URL(req.url ?? "", `http://${req.headers.host}`);
}

async function parseBody(req: ZRequest): Promise<unknown> {
  const request = req as ZRequest;

  const contentType = req.headers["content-type"] ?? "";
  const context = request.context ?? {};
  const maxSize = context.bodyParser?.maxSize ?? 10 * 1024 * 1024; // Default to 10 MB if not specified
  const parser = getBodyParser(contentType, maxSize);

  if (parser) {
    const parsed = await parser.parse(request);

    if (
      contentType.toLowerCase().includes("multipart/form-data") &&
      typeof parsed === "object" &&
      parsed !== null
    ) {
      const { file, files, body } = parsed as any;
      return {
        file,
        files,
        body,
      };
    } else {
      return parsed;
    }
  } else {
    return undefined;
  }
}
