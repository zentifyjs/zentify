import { Body, Controller, Get, Param, Post, Query } from "../core/decorators";
import { NotFoundException } from "../core/exception/http";
import { DTOClass } from "../core/types/dto";
import { ZRequest, ZResponse } from "../core/types/message";
import { z } from "zod";
class CreateUserDto {
  static schema = z.object({
    name: z.string().min(1, "Name is required"),
  });
  name!: string;
}

@Controller({ path: "user" })
export class UserController {
  @Get(":id")
  async getUser(
    @Param("id") id: string,
    @Query() query: Record<string, string>,
  ) {
    return { message: "User found", userId: id, query };
  }

  @Post()
  async createUser(@Body() body: CreateUserDto) {
    const dto = body.name;
    return { message: "User created", dto };
  }
}
