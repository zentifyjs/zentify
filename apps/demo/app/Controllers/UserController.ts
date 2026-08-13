import { Body, Controller, Get, Post, Query, Res, render, redirect } from "@zentify/core";
import { UserService } from "../Services/UserService.js";
import { UserDTO } from "./dto/UserDTO.js";

@Controller({ path: "/users" })
export class UserController {
    constructor(
        private readonly userService: UserService
    ) {}

    @Get("/")
    async index(@Query() query: any) {
        const page = parseInt(query.page || "1", 10);
        const limit = parseInt(query.limit || "5", 10);
        const paginated = await this.userService.getPaginatedUsers(page, limit);
        
        return render("Users/Index", { 
            title: "User Management (CRUD & Pagination)",
            ...paginated
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
            await this.userService.updateUser(id, { name: body.name, email: body.email });
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
