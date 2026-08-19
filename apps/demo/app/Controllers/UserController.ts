import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  render,
  redirect,
} from "@zentify/core";
import { UserService } from "../Services/UserService.js";
import { UserDTO } from "./dto/UserDTO.js";
import { AuthManager } from "@zentify/auth";
import { User } from "../Models/User.js";

@Controller({ path: "/users" })
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authManager: AuthManager<User>,
  ) {}

  @Post("/login")
  async login(@Body() body: any, @Res() res: any) {
    const { email, password } = body;
    const success = await this.authManager.attempt({ email, password });

    if (success) {
      return { message: "Login successful" };
    } else {
      return { message: "Invalid credentials" };
    }
  }

  @Post("/register")
  async register(@Body() body: any, @Res() res: any) {
    const { email, password } = body;
    const user = await this.userService.createUser({ name: email, email });
    user.password = await this.authManager.hashPassword(password); // Set the password for the user
    await this.userService.updateUser(user.id, {
      name: user.name,
      email: user.email,
      password: user.password,
    }); // Update the user with the password

    return { message: "User registered successfully" };
  }

  @Get("/")
  async index(@Query() query: any) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "5", 10);
    const paginated = await this.userService.getPaginatedUsers(page, limit);

    return render("Users/Index", {
      title: "User Management (CRUD & Pagination)",
      ...paginated,
    });
  }

  @Post("/create")
  async create(@Body() body: UserDTO) {
    await this.userService.createUser(body);
    return redirect("/users");
  }

  @Post("/update")
  async update(@Body() body: any) {
    const id = parseInt(body.id, 10);
    if (id) {
      await this.userService.updateUser(id, {
        name: body.name,
        email: body.email,
      });
    }
    return redirect("/users");
  }

  @Post("/delete")
  async destroy(@Body() body: any) {
    const id = parseInt(body.id, 10);
    if (id) {
      await this.userService.deleteUser(id);
    }
    return redirect("/users");
  }
}
