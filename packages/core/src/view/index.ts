import { ZRequest, ZResponse } from "../types/message";
import { Purpose, ZentifyResponsePayload } from "../types";

export interface ZentifyViewEngine {
  render(
    page: string,
    props: Record<string, any>,
    req: ZRequest,
    res: ZResponse
  ): string | Promise<string> | void | Promise<void>;
}

export function render(page: string, props: Record<string, any> = {}): ZentifyResponsePayload {
  return {
    __isZentifyResponse: true,
    purpose: Purpose.view,
    payload: { page, props }
  };
}
