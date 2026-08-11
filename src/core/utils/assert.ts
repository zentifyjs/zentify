import { DTOClass } from "../types/dto";
import { isDtoClass } from "./common";

function assertJsonSerializable(data: unknown): void {
  try {
    JSON.stringify(data);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("circular")) {
      throw new Error(
        "Response contains a circular structure and cannot be serialized to JSON",
      );
    }

    throw error;
  }
}

function assertDtoClass(
  dtoClass: unknown,
  target: object,
  propertyKey: string | symbol,
  parameterIndex: number,
): asserts dtoClass is DTOClass {
  const controllerName = target.constructor.name;

  const dtoName =
    typeof dtoClass === "function" ? dtoClass.name : String(dtoClass);

  if (!isDtoClass(dtoClass)) {
    throw new Error(
      `Invalid @Body() parameter in ` +
        `${controllerName}.${String(propertyKey)}(). ` +
        `Parameter #${parameterIndex} has type '${dtoName}', ` +
        `but it must be a DTO class with a static 'schema' property.`,
    );
  }
}

export { assertJsonSerializable, assertDtoClass };
