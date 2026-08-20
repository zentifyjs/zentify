import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  render,
  redirect,
  Inject,
} from "@zentify/core";
import { UserService } from "../Services/UserService.js";
import { UserDTO } from "./dto/UserDTO.js";
import { AuthManager, AuthMiddleware } from "@zentify/auth";
import { User } from "../Models/User.js";
import { RequestContextService } from "../Services/RequestContextService.js";
import { AdminService } from "../Services/AdminService.js";

@Controller({ path: "/users" })
export class UserController {
  constructor(
    @Inject(UserService)
    private readonly userService: UserService,
    private readonly adminService: AdminService,
    private readonly authManager: AuthManager<User>,
    private readonly ctxService: RequestContextService,
  ) {}

  @Post("/login")
  async login(@Body() body: any, @Res() res: any) {
    const { email, password } = body;
    const success = await this.authManager
      .guard("web")
      .attempt({ email, password });

    if (success) {
      return {
        message: "Login successful",
        context: this.ctxService.describe(),
      };
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

  @Post("/admin/login")
  async adminLogin(@Body() body: any, @Res() res: any) {
    const { email, password } = body;
    const success = await this.authManager
      .guard("admin")
      .attempt({ email, password });

    if (success) {
      return {
        message: "Login successful",
        context: this.ctxService.describe(),
      };
    } else {
      return { message: "Invalid credentials" };
    }
  }

  @Post("/admin/register")
  async adminRegister(@Body() body: any, @Res() res: any) {
    const { email, password } = body;
    const user = await this.adminService.createUser({ name: email, email });
    user.password = await this.authManager.hashPassword(password); // Set the password for the user
    await this.adminService.updateUser(user.id, {
      name: user.name,
      email: user.email,
      password: user.password,
    }); // Update the user with the password

    return { message: "User registered successfully" };
  }

  @Get("/admin/me", [new AuthMiddleware({ guard: "admin" })])
  async adminMe() {
    const user = await this.authManager.guard("admin").user();
    if (user) {
      return { user };
    } else {
      return { message: "Not authenticated" };
    }
  }

  @Get("/me", [new AuthMiddleware({ guard: "web" })])
  async me() {
    const user = await this.authManager.guard("web").user();
    if (user) {
      return { user };
    } else {
      return { message: "Not authenticated" };
    }
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
