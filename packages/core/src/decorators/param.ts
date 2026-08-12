import { addParameterMetadata } from "./metadata";

export function Param(key: string) {
  return function (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    addParameterMetadata(target, propertyKey, {
      index: parameterIndex,
      type: "param",
      key,
    });
  };
}
