import { ZRequest, ZResponse } from "../types/message";

export interface ZifyViewEngine {
  render(
    page: string,
    props: Record<string, any>,
    req: ZRequest,
    res: ZResponse
  ): string | Promise<string> | void | Promise<void>;
}

export interface ZifyView {
  __isZifyView: true;
  page: string;
  props: Record<string, any>;
}

export function render(page: string, props: Record<string, any> = {}): ZifyView {
  return {
    __isZifyView: true,
    page,
    props,
  };
}
