import Busboy from "busboy";
import { HttpException } from "../exception/http";
import { ZRequest } from "../types/message";
import { BodyParser, MultipartParserResult, ZFile } from "./body_parser";
import { MultipartFile } from "./multipart_file";

type FileWaiter = {
  resolve: (file: ZFile) => void;
  reject: (error: unknown) => void;
};

export class MultipartParser implements BodyParser {
  public supports(contentType: string): boolean {
    return contentType.toLowerCase().includes("multipart/form-data");
  }

  public async parse(req: ZRequest): Promise<MultipartParserResult> {
    const body: Record<string, string> = {};
    const files: MultipartFile[] = [];

    const appContext = req.context;

    const pendingFiles = new Map<string, FileWaiter[]>();

    let finished = false;

    let resolveFinished: (() => void) | undefined;
    let rejectFinished: ((error: unknown) => void) | undefined;

    const finishedPromise = new Promise<void>((resolve, reject) => {
      resolveFinished = resolve;
      rejectFinished = reject;
    });

    const busboy = Busboy({
      headers: req.headers,

      limits: {
        fileSize: appContext?.bodyParser?.maxSize ?? 10 * 1024 * 1024,

        files: appContext?.bodyParser?.maxFiles ?? 20,

        fields: appContext?.bodyParser?.maxFields ?? 100,
      },
    });

    busboy.on("field", (fieldname, value) => {
      body[fieldname] = value;
    });

    busboy.on("file", (fieldname, stream, info) => {
      const file = new MultipartFile(
        fieldname,
        info.filename,
        info.mimeType,
        info.encoding,
        stream,
      );

      files.push(file);

      const waiters = pendingFiles.get(fieldname);

      if (!waiters) {
        return;
      }

      pendingFiles.delete(fieldname);

      for (const waiter of waiters) {
        waiter.resolve(file);
      }
    });

    busboy.on("error", (error) => {
      for (const waiters of pendingFiles.values()) {
        for (const waiter of waiters) {
          waiter.reject(error);
        }
      }

      pendingFiles.clear();

      rejectFinished?.(error);
    });

    busboy.on("finish", () => {
      finished = true;

      for (const [fieldname, waiters] of pendingFiles) {
        const error = new HttpException({
          statusCode: 404,
          message: `File with fieldname "${fieldname}" not found`,
        });

        for (const waiter of waiters) {
          waiter.reject(error);
        }
      }

      pendingFiles.clear();

      resolveFinished?.();
    });

    req.pipe(busboy);

    req.body = body;

    const fileFn = (fieldname: string): Promise<ZFile> => {
      const existing = files.find((file) => file.fieldname === fieldname);

      if (existing) {
        return Promise.resolve(existing);
      }

      if (finished) {
        return Promise.reject(
          new HttpException({
            statusCode: 404,
            message: `File with fieldname "${fieldname}" not found`,
          }),
        );
      }

      return new Promise<ZFile>((resolve, reject) => {
        const waiters = pendingFiles.get(fieldname) ?? [];

        waiters.push({
          resolve,
          reject,
        });

        pendingFiles.set(fieldname, waiters);
      });
    };

    const filesFn = async (fieldname?: string): Promise<ZFile[]> => {
      await finishedPromise;

      if (!fieldname) {
        return files;
      }

      const matched = files.filter((file) => file.fieldname === fieldname);

      if (matched.length === 0) {
        throw new HttpException({
          statusCode: 404,
          message: `File with fieldname "${fieldname}" not found`,
        });
      }

      return matched;
    };

    return {
      body,
      file: fileFn,
      files: filesFn,
    };
  }
}
