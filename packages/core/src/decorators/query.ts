import { addParameterMetadata } from "./metadata";

export function Query() {
  return function (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    addParameterMetadata(target, propertyKey, {
      index: parameterIndex,
      type: "query",
    });
  };
}
