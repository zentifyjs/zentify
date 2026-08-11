import { DTOClass } from "../types/dto";

export function isDtoClass(value: unknown): value is DTOClass {
  if (typeof value !== "function") {
    return false;
  }

  const schema = (value as DTOClass).schema;

  return (
    schema !== undefined &&
    typeof schema === "object" &&
    schema !== null &&
    typeof schema.safeParse === "function"
  );
}
