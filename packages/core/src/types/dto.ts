import { GenericSchema } from "valibot";

export interface DTOClass {
  new (...args: any[]): any;
  schema: GenericSchema;
}
