import { Controller, Get } from "@zify/core";

@Controller("{{path}}")
export class {{name}} {
  @Get("/")
  public index() {
    return { message: "Hello from {{name}}" };
  }
}
