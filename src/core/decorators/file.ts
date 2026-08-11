import { addParameterMetadata } from "./metadata";

export function File(name: string) {
  return function (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    addParameterMetadata(target, propertyKey, {
      index: parameterIndex,
      type: "file",
      key: name,
    });
  };
}
