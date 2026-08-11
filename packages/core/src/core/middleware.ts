import { ZRequest, ZResponse } from "./types/message";

export interface Middleware {
  handle(
    req: ZRequest,
    res: ZResponse,
    next: () => Promise<void>,
  ): Promise<void>;
}
