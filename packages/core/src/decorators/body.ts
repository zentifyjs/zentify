import { assertDtoClass, isDtoClass } from "../utils";
import { addParameterMetadata } from "./metadata";

export function Body({ raw }: { raw?: boolean } = { raw: false }) {
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

    if (!raw) {
      assertDtoClass(dtoClass, target, propertyKey, parameterIndex);
    }
    addParameterMetadata(target, propertyKey, {
      index: parameterIndex,
      type: "body",
      additionalData: {
        dtoClass: paramTypes?.[parameterIndex],
      },
    });
  };
}
