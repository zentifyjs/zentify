import { addParameterMetadata } from "@zentify/core";
import { AUTH_ADAPTER_NAME } from "../constant";

export function AuthUser(guardName: string = "web") {
  return function (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    addParameterMetadata(target, propertyKey, {
      index: parameterIndex,
      type: "authuser",
      kind: {
        type: "adapter",
        name: AUTH_ADAPTER_NAME,
      },
      additionalData: {
        guardName,
      },
    });
  };
}
