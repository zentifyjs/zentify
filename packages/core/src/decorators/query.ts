import { isDtoClass } from "../utils";
import { addParameterMetadata } from "./metadata";

export function Query() {
  return function (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    const paramTypes = Reflect.getMetadata(
      "design:paramtypes",
      target,
      propertyKey,
    );

    const dtoClass = paramTypes?.[parameterIndex];

    addParameterMetadata(target, propertyKey, {
      index: parameterIndex,
      type: "query",
      additionalData: {
        dtoClass: isDtoClass(dtoClass) ? dtoClass : null,
      },
    });
  };
}
