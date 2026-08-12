import { Body, Controller, Get, Param, Post, Query } from "../decorators";
import { NotFoundException } from "../exception/http";
import { DTOClass } from "../types/dto";
import { ZRequest, ZResponse } from "../types/message";
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

  @Get("/me")
  async getMyProfile(@Query() query: Record<string, string>) {
    return { message: "My profile found", query };
  }

  @Get(":id/profile")
  async getUserProfile(
    @Param("id") id: string,
    @Query() query: Record<string, string>,
  ) {
    return { message: "User profile found", userId: id, query };
  }

  @Post()
  async createUser(@Body() body: CreateUserDto) {
    const dto = body.name;
    return { message: "User created", dto };
  }
}
