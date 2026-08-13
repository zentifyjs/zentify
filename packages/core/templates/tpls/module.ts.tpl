import { Module } from "@zentify/core";
import { {{name}}Controller } from "../Controllers/{{name}}Controller";
import { {{name}}Service } from "../Services/{{name}}Service";

@Module({
  controllers: [{{name}}Controller],
  providers: [{{name}}Service],
})
export class {{name}}Module {}
