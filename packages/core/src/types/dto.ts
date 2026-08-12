import z from "zod";

export interface DTOClass {
  new (): any;
  schema: z.ZodType;
}
