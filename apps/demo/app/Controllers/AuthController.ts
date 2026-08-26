import { Body, Controller, Get, Post } from "@zentify/core";
import { AuthManager, AuthMiddleware, AuthUser } from "@zentify/auth";
import { InjectRepository } from "@zentify/typeorm";
import { User } from "../Models/User.js";
import { Repository } from "typeorm";

@Controller({ path: "/api/auth" })
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly authManager: AuthManager,
  ) {}

  @Post("/register")
  async register(@Body() body: any) {
    const email = String(body.email ?? "").trim();
    if (!email) {
      return { message: "Email is required" };
    }

    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : email;
    const user = await this.users.save({ name, email });
    user.password = await this.authManager.hashPassword(String(body.password));
    await this.users.save(user);

    return { message: "Registered successfully" };
  }

  @Post("/login")
  async login(@Body() body: any) {
    const ok = await this.authManager.guard("web").attempt({
      email: String(body.email ?? "").trim(),
      password: String(body.password ?? ""),
    });

    return ok
      ? { message: "Login successful" }
      : { message: "Invalid credentials" };
  }

  // Protected at the method level via AuthMiddleware.
  // Alternative: declare it at the module level (see AuthModule) using
  // includeRoutes/excludeRoutes. Do NOT use both for the same route —
  // a duplicated middleware type on one route throws an error.
  @Get("/me", [new AuthMiddleware({ guard: "web" })])
  async me(@AuthUser("web") user: User | null) {
    return user ? { user } : { message: "Not authenticated" };
  }
}
