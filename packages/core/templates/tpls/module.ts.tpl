import { Module } from "@zentify/core";
import { {{name}}Controller } from "../Controllers/{{name}}Controller";
import { {{name}}Service } from "../Services/{{name}}Service";
import { {{name}} } from "../Models/{{name}}";

@Module({
  controllers: [{{name}}Controller],
  providers: [{{name}}Service],
  entities: [{{name}}]
})
export class {{name}}Module {}
