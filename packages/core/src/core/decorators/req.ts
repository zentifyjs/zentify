// decorators/req.ts

import { addParameterMetadata } from "./metadata";

export function Req() {
  return function (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    addParameterMetadata(target, propertyKey, {
      index: parameterIndex,
      type: "req",
    });
  };
}
