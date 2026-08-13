import { Controller, Get } from "@zentify/core";

@Controller("{{path}}")
export class {{name}} {
  @Get("/")
  public index() {
    return { message: "Hello from {{name}}" };
  }
}
