import { ZRequest, ZResponse } from "../types/message";

export interface ZentifyViewEngine {
  render(
    page: string,
    props: Record<string, any>,
    req: ZRequest,
    res: ZResponse
  ): string | Promise<string> | void | Promise<void>;
}

export interface ZentifyView {
  __isZentifyView: true;
  page: string;
  props: Record<string, any>;
}

export function render(page: string, props: Record<string, any> = {}): ZentifyView {
  return {
    __isZentifyView: true,
    page,
    props,
  };
}
